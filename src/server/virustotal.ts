/**
 * Service Backend pour VirusTotal API v3.
 * Exécute exclusivement côté serveur avec process.env.VIRUSTOTAL_API_KEY.
 * Ne JAMAIS importer ce fichier dans du code exécuté côté client/navigateur.
 */

import fs from "node:fs";
import path from "node:path";
import type { Finding, GemmaAnalysisResponse } from "./gemma";

// Cache mémoire pour respecter les quotas et limiter les appels répétés (TTL 10 min)
interface CacheEntry {
  report: VirusTotalUrlReport;
  expiresAt: number;
}
const URL_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface VirusTotalStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
}

export interface VirusTotalUrlReport {
  url: string;
  domain: string;
  status: "analyzed" | "not_found" | "queued" | "unavailable" | "quota_exceeded" | "skipped_sensitive";
  stats?: VirusTotalStats | undefined;
  reputation?: number | undefined;
  categories?: string[] | undefined;
  lastAnalysisDate?: number | undefined;
  error?: string | undefined;
  message?: string | undefined;
}

export interface VirusTotalAnalysisResult {
  enabled: boolean;
  checked: boolean;
  hasUrls: boolean;
  urls: VirusTotalUrlReport[];
  summary: {
    totalUrls: number;
    maliciousUrls: number;
    suspiciousUrls: number;
    cleanUrls: number;
    notFoundUrls: number;
  };
  unavailable: boolean;
  unavailableReason?: string | undefined;
  caution: string;
}

function ensureEnvLoaded(): string | undefined {
  if (!process.env["VIRUSTOTAL_API_KEY"]) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile();
      }
    } catch {
      // Ignorer si process.loadEnvFile n'est pas disponible
    }

    if (!process.env["VIRUSTOTAL_API_KEY"]) {
      const pathsToTry = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "backend/.env"),
      ];
      for (const envPath of pathsToTry) {
        try {
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf-8");
            for (const line of content.split("\n")) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                const [k, ...v] = trimmed.split("=");
                const keyName = (k || "").trim();
                const val = v.join("=").trim().replace(/^["']|["']$/g, "");
                if (keyName === "VIRUSTOTAL_API_KEY" && val) {
                  process.env["VIRUSTOTAL_API_KEY"] = val;
                  break;
                }
              }
            }
          }
        } catch {
          // Ignorer erreur de lecture
        }
      }
    }
  }
  return process.env["VIRUSTOTAL_API_KEY"];
}

export function getVirusTotalApiKey(): string | undefined {
  return ensureEnvLoaded();
}

/**
 * Mots-clés sensibles dont la présence dans les paramètres d'URL
 * indique des jetons privés, codes OTP ou mots de passe.
 */
const SENSITIVE_PARAM_KEYWORDS = [
  "token",
  "access_token",
  "id_token",
  "jwt",
  "otp",
  "pin",
  "password",
  "pwd",
  "secret",
  "key",
  "api_key",
  "auth",
  "code",
  "session",
];

export interface ExtractedUrlInfo {
  rawUrl: string;
  normalizedUrl: string;
  domain: string;
  isSensitive: boolean;
  sensitiveReason?: string | undefined;
}

/**
 * Extrait, normalise et valide les URLs d'un SMS ou texte brut.
 */
export function extractUrlsFromText(text: string): ExtractedUrlInfo[] {
  if (!text || typeof text !== "string") return [];

  // Expression régulière robuste pour identifier les URL avec ou sans protocole
  const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-zA-Z0-9-]+\.(?:com|org|net|tg|xyz|top|live|site|online|info|me|ly|co|io|tk|ml|ga|cf|gq|biz|icu|buzz)(?:\/[^\s<>"']*)?)/gi;

  const matches = text.match(urlRegex) ?? [];
  const results: ExtractedUrlInfo[] = [];
  const seen = new Set<string>();

  for (const raw of matches) {
    // Nettoyer la ponctuation traînante fréquente en fin de SMS (.,:;!?)]
    let cleaned = raw.replace(/[.,;:!?)]+$/, "").trim();

    if (!cleaned) continue;

    // Normalisation : ajouter le protocole https:// si absent
    let withProto = cleaned;
    if (!/^https?:\/\//i.test(withProto)) {
      withProto = "https://" + withProto;
    }

    try {
      const parsed = new URL(withProto);
      const normalizedUrl = parsed.toString();
      const domain = parsed.hostname.toLowerCase();

      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);

      // Vérifier la présence de données confidentielles / tokens
      let isSensitive = false;
      let sensitiveReason: string | undefined;

      for (const [key, val] of parsed.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_PARAM_KEYWORDS.some((kw) => lowerKey.includes(kw))) {
          isSensitive = true;
          sensitiveReason = `Paramètre sensible détecté (?${key}=...) non soumis à un tiers`;
          break;
        }
      }

      results.push({
        rawUrl: cleaned,
        normalizedUrl,
        domain,
        isSensitive,
        ...(sensitiveReason !== undefined ? { sensitiveReason } : {}),
      });
    } catch {
      // Ignorer les chaînes qui ne forment pas une URL valide
    }
  }

  return results;
}

/**
 * Encode une URL au format base64url sans padding, requis par VirusTotal API v3.
 */
export function encodeUrlForVirusTotal(url: string): string {
  return Buffer.from(url).toString("base64url");
}

/**
 * Interroge l'API VirusTotal v3 pour obtenir le rapport de réputation d'une URL.
 */
export async function fetchVirusTotalReportForUrl(
  normalizedUrl: string,
  domain: string,
  apiKey?: string,
): Promise<VirusTotalUrlReport> {
  const key = apiKey || getVirusTotalApiKey();
  if (!key) {
    return {
      url: normalizedUrl,
      domain,
      status: "unavailable",
      error: "Clé VIRUSTOTAL_API_KEY absente côté serveur.",
      message: "Vérification VirusTotal indisponible",
    };
  }

  // Vérifier dans le cache mémoire
  const cached = URL_CACHE.get(normalizedUrl);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.report;
  }

  const urlId = encodeUrlForVirusTotal(normalizedUrl);
  const vtEndpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(vtEndpoint, {
      method: "GET",
      headers: {
        "x-apikey": key,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 200) {
      const data = await response.json();
      const attributes = data?.data?.attributes || {};
      const statsRaw = attributes.last_analysis_stats || {};

      const stats: VirusTotalStats = {
        malicious: Number(statsRaw.malicious) || 0,
        suspicious: Number(statsRaw.suspicious) || 0,
        undetected: Number(statsRaw.undetected) || 0,
        harmless: Number(statsRaw.harmless) || 0,
        timeout: Number(statsRaw.timeout) || 0,
      };

      const categoriesObj = attributes.categories || {};
      const categories = Object.values(categoriesObj).map(String).filter(Boolean);

      const report: VirusTotalUrlReport = {
        url: normalizedUrl,
        domain,
        status: "analyzed",
        stats,
        reputation: typeof attributes.reputation === "number" ? attributes.reputation : 0,
        categories: categories.slice(0, 5),
        lastAnalysisDate: attributes.last_analysis_date,
      };

      URL_CACHE.set(normalizedUrl, { report, expiresAt: Date.now() + CACHE_TTL_MS });
      return report;
    }

    if (response.status === 404) {
      const report: VirusTotalUrlReport = {
        url: normalizedUrl,
        domain,
        status: "not_found",
        message: "Lien non encore répertorié dans la base VirusTotal",
      };
      URL_CACHE.set(normalizedUrl, { report, expiresAt: Date.now() + CACHE_TTL_MS });
      return report;
    }

    if (response.status === 429) {
      return {
        url: normalizedUrl,
        domain,
        status: "quota_exceeded",
        error: "Quota API VirusTotal dépassé (429)",
        message: "Vérification VirusTotal indisponible (quota atteint)",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        url: normalizedUrl,
        domain,
        status: "unavailable",
        error: "Authentification VirusTotal refusée (clé invalide)",
        message: "Vérification VirusTotal indisponible",
      };
    }

    return {
      url: normalizedUrl,
      domain,
      status: "unavailable",
      error: `Réponse inattendue de VirusTotal (${response.status})`,
      message: "Vérification VirusTotal indisponible",
    };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return {
      url: normalizedUrl,
      domain,
      status: "unavailable",
      error: isTimeout ? "Délai de connexion dépassé" : (err?.message || "Erreur réseau"),
      message: "Vérification VirusTotal indisponible",
    };
  }
}

/**
 * Soumet une URL pour une nouvelle analyse auprès de VirusTotal (quand 404 ou non répertoriée).
 */
export async function submitUrlToVirusTotal(
  normalizedUrl: string,
  apiKey?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const key = apiKey || getVirusTotalApiKey();
  if (!key) {
    return { success: false, error: "VIRUSTOTAL_API_KEY manquante." };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const body = new URLSearchParams();
    body.append("url", normalizedUrl);

    const res = await fetch("https://www.virustotal.com/api/v3/urls", {
      method: "POST",
      headers: {
        "x-apikey": key,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const data = await res.json();
      return { success: true, id: data?.data?.id };
    }

    return { success: false, error: `Code HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur soumission" };
  }
}

/**
 * Analyse l'ensemble des URLs contenues dans un texte via VirusTotal v3.
 * Respecte les exigences de sécurité : ne transmet QUE les URLs, jamais le SMS complet.
 */
export async function analyzeUrlsWithVirusTotal(
  smsText: string,
  apiKey?: string,
): Promise<VirusTotalAnalysisResult> {
  const extracted = extractUrlsFromText(smsText);

  if (extracted.length === 0) {
    return {
      enabled: true,
      checked: true,
      hasUrls: false,
      urls: [],
      summary: {
        totalUrls: 0,
        maliciousUrls: 0,
        suspiciousUrls: 0,
        cleanUrls: 0,
        notFoundUrls: 0,
      },
      unavailable: false,
      caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
    };
  }

  const reports: VirusTotalUrlReport[] = [];
  let unavailableCount = 0;
  let quotaCount = 0;

  for (const item of extracted) {
    // Si l'URL contient des paramètres sensibles (token, OTP), on ne la soumet pas
    if (item.isSensitive) {
      reports.push({
        url: item.normalizedUrl,
        domain: item.domain,
        status: "skipped_sensitive",
        message: item.sensitiveReason || "Lien confidentiel non soumis à VirusTotal",
      });
      continue;
    }

    const report = await fetchVirusTotalReportForUrl(item.normalizedUrl, item.domain, apiKey);
    reports.push(report);

    if (report.status === "unavailable") unavailableCount++;
    if (report.status === "quota_exceeded") quotaCount++;
  }

  const maliciousUrls = reports.filter((r) => (r.stats?.malicious ?? 0) > 0).length;
  const suspiciousUrls = reports.filter((r) => (r.stats?.suspicious ?? 0) > 0).length;
  const cleanUrls = reports.filter((r) => (r.stats?.malicious ?? 0) === 0 && (r.stats?.harmless ?? 0) > 0).length;
  const notFoundUrls = reports.filter((r) => r.status === "not_found").length;

  const isAllUnavailable = unavailableCount > 0 && unavailableCount === reports.length;
  const isQuota = quotaCount > 0;

  return {
    enabled: true,
    checked: true,
    hasUrls: true,
    urls: reports,
    summary: {
      totalUrls: reports.length,
      maliciousUrls,
      suspiciousUrls,
      cleanUrls,
      notFoundUrls,
    },
    unavailable: isAllUnavailable || isQuota,
    ...(isQuota
      ? { unavailableReason: "Quota VirusTotal atteint (429)" }
      : isAllUnavailable
      ? { unavailableReason: "Vérification VirusTotal indisponible" }
      : {}),
    caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
  };
}

export type TechnicalRiskLevel =
  | "FAIBLE"
  | "SUSPECT"
  | "ÉLEVÉ"
  | "NON_RÉPERTORIÉ"
  | "INDISPONIBLE"
  | "AUCUN_LIEN";

export interface CombinedSmsAnalysisResponse extends GemmaAnalysisResponse {
  virusTotal: VirusTotalAnalysisResult;
  gemmaRisk: "FAIBLE" | "SUSPECT" | "ÉLEVÉ";
  gemmaScore: number;
  technicalRisk: TechnicalRiskLevel;
}

/**
 * Fusionne l'analyse contextuelle de Gemma avec la réputation technique de VirusTotal v3.
 * Sans confondre leurs rôles, conformément aux exigences du document CyberSafe Online.
 */
export function combineGemmaAndVirusTotal(
  gemma: GemmaAnalysisResponse,
  vt: VirusTotalAnalysisResult,
): CombinedSmsAnalysisResponse {
  let technicalRisk: TechnicalRiskLevel = "AUCUN_LIEN";

  if (vt.unavailable) {
    technicalRisk = "INDISPONIBLE";
  } else if (!vt.hasUrls) {
    technicalRisk = "AUCUN_LIEN";
  } else if (vt.summary.maliciousUrls > 0) {
    technicalRisk = "ÉLEVÉ";
  } else if (vt.summary.suspiciousUrls > 0) {
    technicalRisk = "SUSPECT";
  } else if (vt.summary.cleanUrls > 0) {
    technicalRisk = "FAIBLE";
  } else if (vt.summary.notFoundUrls > 0) {
    technicalRisk = "NON_RÉPERTORIÉ";
  }

  // Fusion du score et niveau global
  let globalScore = gemma.score;
  let globalLevel = gemma.level;

  if (technicalRisk === "ÉLEVÉ") {
    globalLevel = "ÉLEVÉ";
    // Si VirusTotal détecte des moteurs malveillants, le score monte à au moins 85
    globalScore = Math.max(globalScore, 85);
  } else if (technicalRisk === "SUSPECT") {
    if (globalLevel === "FAIBLE") {
      globalLevel = "SUSPECT";
      globalScore = Math.max(globalScore, 60);
    }
  }

  const combinedFindings: Finding[] = [...gemma.findings];
  const combinedRecommendations: string[] = [...gemma.recommendations];

  // Ajouter les signaux techniques VirusTotal dans les findings
  if (vt.hasUrls) {
    for (const urlReport of vt.urls) {
      if (urlReport.status === "analyzed" && urlReport.stats) {
        if (urlReport.stats.malicious > 0) {
          combinedFindings.unshift({
            label: `VirusTotal : ${urlReport.stats.malicious} moteur(s) classent ${urlReport.domain} comme malveillant`,
            detail: `L'URL ${urlReport.url} a été formellement signalée comme malveillante ou phishing sur VirusTotal.`,
            weight: 45,
          });
        } else if (urlReport.stats.suspicious > 0) {
          combinedFindings.push({
            label: `VirusTotal : ${urlReport.stats.suspicious} moteur(s) suspectent ${urlReport.domain}`,
            detail: `L'URL ${urlReport.url} présente des indices d'activité suspecte selon VirusTotal.`,
            weight: 20,
          });
        }
      } else if (urlReport.status === "not_found") {
        combinedFindings.push({
          label: `VirusTotal : ${urlReport.domain} non encore répertorié`,
          detail: `Ce lien n'a pas encore de rapport public dans la base VirusTotal. Il peut s'agir d'un domaine très récent créé pour une campagne d'escroquerie.`,
          weight: 15,
        });
      } else if (urlReport.status === "skipped_sensitive") {
        combinedFindings.push({
          label: "Protection confidentialité : Paramètres privés non transmis",
          detail: `L'URL contient des identifiants sensibles. Elle a été protégée et non transmise à un service tiers.`,
          weight: 0,
        });
      }
    }

    // Toujours inclure la recommandation obligatoire :
    // « Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr »
    const cautionText = "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr (les campagnes récentes peuvent ne pas encore être répertoriées).";
    if (!combinedRecommendations.includes(cautionText)) {
      combinedRecommendations.push(cautionText);
    }

    if (technicalRisk === "ÉLEVÉ") {
      combinedRecommendations.unshift("NE CLIQUEZ PAS sur le lien contenu dans ce SMS : il est formellement répertorié comme dangereux.");
    }
  }

  if (vt.unavailable) {
    combinedRecommendations.push("Vérification VirusTotal indisponible : La décision repose sur l'analyse contextuelle de Gemma.");
  }

  return {
    ...gemma,
    level: globalLevel,
    score: globalScore,
    findings: combinedFindings,
    recommendations: combinedRecommendations,
    virusTotal: vt,
    gemmaRisk: gemma.level,
    gemmaScore: gemma.score,
    technicalRisk,
  };
}
