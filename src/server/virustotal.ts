import fs from "node:fs";
import path from "node:path";
import type { Finding, GemmaAnalysisResponse } from "./gemma";
import { extractUrlsFromText, encodeUrlForVirusTotal } from "./ssrf-protection";

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
  status:
    "analyzed" | "not_found" | "queued" | "unavailable" | "quota_exceeded" | "skipped_sensitive";
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

export interface CombinedAnalysisResult extends GemmaAnalysisResponse {
  gemmaRisk: "ÉLEVÉ" | "SUSPECT" | "FAIBLE";
  technicalRisk: string;
}

function ensureEnvLoaded(): string | undefined {
  if (!process.env["VIRUSTOTAL_API_KEY"]) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile();
      }
    } catch {}

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
                const val = v
                  .join("=")
                  .trim()
                  .replace(/^['"]|['"]$/g, "");
                if (keyName === "VIRUSTOTAL_API_KEY" && val) {
                  process.env["VIRUSTOTAL_API_KEY"] = val;
                  break;
                }
              }
            }
          }
        } catch {}
      }
    }
  }
  return process.env["VIRUSTOTAL_API_KEY"];
}

export function getVirusTotalApiKey(): string | undefined {
  return ensureEnvLoaded();
}

export interface ExtractedUrlInfo {
  rawUrl: string;
  normalizedUrl: string;
  domain: string;
  isSensitive: boolean;
  sensitiveReason?: string | undefined;
}

export { extractUrlsFromText, encodeUrlForVirusTotal };

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
      error: isTimeout ? "Délai de connexion dépassé" : err?.message || "Erreur réseau",
      message: "Vérification VirusTotal indisponible",
    };
  }
}

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
      caution:
        "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
    };
  }

  const reports: VirusTotalUrlReport[] = [];
  let unavailableCount = 0;
  let quotaCount = 0;

  for (const item of extracted) {
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
  const cleanUrls = reports.filter(
    (r) => (r.stats?.malicious ?? 0) === 0 && (r.stats?.harmless ?? 0) > 0,
  ).length;
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
    unavailable: isAllUnavailable,
    unavailableReason: isAllUnavailable ? "Tous les liens sont inaccessibles" : undefined,
    caution:
      "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
  };
}

export function combineGemmaAndVirusTotal(
  gemmaResult: GemmaAnalysisResponse,
  virusTotalResult: VirusTotalAnalysisResult,
): CombinedAnalysisResult {
  // Determine technical risk based on VirusTotal results
  let technicalRisk: string = "AUCUN_LIEN";
  if (virusTotalResult.unavailable) {
    technicalRisk = "INDISPONIBLE";
  } else if (virusTotalResult.summary.notFoundUrls > 0) {
    technicalRisk = "NON_RÉPERTORIÉ";
  } else if (virusTotalResult.summary.maliciousUrls > 0) {
    technicalRisk = "ÉLEVÉ";
  } else if (virusTotalResult.summary.suspiciousUrls > 0) {
    technicalRisk = "SUSPECT";
  }

  // Determine final overall level
  let finalLevel: "FAIBLE" | "SUSPECT" | "ÉLEVÉ" = "FAIBLE";
  if (gemmaResult.level === "ÉLEVÉ") {
    finalLevel = "ÉLEVÉ";
  } else if (gemmaResult.level === "SUSPECT") {
    finalLevel = "SUSPECT";
  }
  if (virusTotalResult.summary.maliciousUrls > 0) {
    finalLevel = "ÉLEVÉ";
  } else if (virusTotalResult.summary.suspiciousUrls > 0) {
    finalLevel = finalLevel === "FAIBLE" ? "SUSPECT" : finalLevel;
  }

  // Build findings
  const findings: Array<{ label: string; detail: string; weight: number }> = [];

  // Add Gemma findings (mark them as from Gemma)
  if (gemmaResult.findings && Array.isArray(gemmaResult.findings)) {
    for (const f of gemmaResult.findings) {
      findings.push({
        label: f.label || "Détection de Gemma",
        detail: f.detail || "Aucun détail",
        weight: f.weight || 20,
      });
    }
  }

  // Add VirusTotal findings
  if (virusTotalResult.summary.maliciousUrls > 0) {
    findings.push({
      label: "Lien malveillant détecté par VirusTotal",
      detail: `VirusTotal a détecté ${virusTotalResult.summary.maliciousUrls} fichier(s) malveillant(s) sur ${virusTotalResult.summary.totalUrls} lien(s)`,
      weight: 80,
    });
  } else if (virusTotalResult.summary.suspiciousUrls > 0) {
    findings.push({
      label: "Lien suspect détecté par VirusTotal",
      detail: `VirusTotal a détecté ${virusTotalResult.summary.suspiciousUrls} lien(s) suspect(s)`,
      weight: 40,
    });
  } else if (virusTotalResult.summary.notFoundUrls > 0) {
    findings.push({
      label: "Lien non encore répertorié par VirusTotal",
      detail: "VirusTotal n'a pas encore analysé ce lien, le danger est incertain",
      weight: 10,
    });
  }

  // Build recommendations
  const recommendations: string[] = [];
  if (gemmaResult.recommendations && Array.isArray(gemmaResult.recommendations)) {
    recommendations.push(...gemmaResult.recommendations);
  }

  if (virusTotalResult.summary.maliciousUrls > 0) {
    recommendations.push("NE CLIQUEZ PAS sur les liens suspects");
  }

  if (virusTotalResult.summary.notFoundUrls > 0) {
    recommendations.push("VirusTotal n'a pas encore vérifié ce lien, faites attention");
  }

  if (!virusTotalResult.unavailable && virusTotalResult.summary.totalUrls > 0) {
    recommendations.push("Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.");
  } else if (virusTotalResult.unavailable) {
    recommendations.push("Vérification VirusTotal indisponible - l'analyse se base sur Gemma uniquement");
  }

  const gemmaScore = gemmaResult.score || 0;
  // Calculate score based on VirusTotal stats (malicious=7, suspicious=2)
  let vtScore = 0;
  if (virusTotalResult.urls && virusTotalResult.urls.length > 0) {
    const url = virusTotalResult.urls[0];
    if (url && typeof url.stats === "object" && url.stats) {
      const stats: VirusTotalStats = url.stats as VirusTotalStats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      vtScore = (malicious * 7) + (suspicious * 2);
    }
  } else {
    vtScore = virusTotalResult.summary.maliciousUrls * 40;
  }
  const totalScore = Math.max(gemmaScore, vtScore);

  return {
    ...gemmaResult,
    level: finalLevel,
    score: totalScore,
    gemmaRisk: finalLevel,
    technicalRisk,
    virusTotal: virusTotalResult,
    findings,
    recommendations,
  } as CombinedAnalysisResult;
}
