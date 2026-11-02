/**
 * Client pour appeler l'API sécurisée /api/analyze (Gemma 4).
 * La clé GEMINI_API_KEY n'est JAMAIS manipulée ici (exclusivement côté serveur).
 */

import type { Language } from "./i18n";
import type { AnalysisResult } from "./risk-engine";

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

export interface GemmaApiAnalysisResult extends AnalysisResult {
  isGemma: boolean;
  model: string;
  lang?: Language;
}

export interface CombinedSmsAnalysisResult extends GemmaApiAnalysisResult {
  virusTotal?: VirusTotalAnalysisResult | undefined;
  gemmaRisk?: "FAIBLE" | "SUSPECT" | "ÉLEVÉ" | undefined;
  gemmaScore?: number | undefined;
  technicalRisk?: ("FAIBLE" | "SUSPECT" | "ÉLEVÉ" | "NON_RÉPERTORIÉ" | "INDISPONIBLE" | "AUCUN_LIEN") | undefined;
}

export interface GemmaAssistantReply {
  reply: string;
  model: string;
  isGemma: boolean;
  lang: Language;
}

export class GemmaApiError extends Error {
  quotaExceeded: boolean;
  statusCode: number;

  constructor(message: string, quotaExceeded = false, statusCode = 500) {
    super(message);
    this.name = "GemmaApiError";
    this.quotaExceeded = quotaExceeded;
    this.statusCode = statusCode;
  }
}

export async function analyzeWithGemmaApi(
  content: string,
  type: "sms" | "qr" | "audio" | "assistant" | "learning" = "sms",
  lang: Language = "fr",
  history: { role: string; content: string }[] = [],
  options?: { checkVirusTotal?: boolean },
): Promise<CombinedSmsAnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      type,
      lang,
      history,
      checkVirusTotal: options?.checkVirusTotal ?? true,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    const isQuota = res.status === 429 || data.quotaExceeded;
    const errorMsg =
      data.error ||
      (isQuota
        ? "Quota API IA CyberSafe dépassé (429). Aucune analyse fictive n'est affichée."
        : "Erreur de communication avec le serveur d'IA CyberSafe.");
    throw new GemmaApiError(errorMsg, isQuota, res.status);
  }

  return {
    level: data.level || "SUSPECT",
    score: typeof data.score === "number" ? data.score : 50,
    summary: data.summary || "Analyse réalisée par l'IA CyberSafe.",
    findings: Array.isArray(data.findings) ? data.findings : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    extracted: {
      amounts: [],
      links: [],
      phones: [],
    },
    isGemma: true,
    model: data.model || "gemma-4-26b-a4b-it",
    lang,
    virusTotal: data.virusTotal,
    gemmaRisk: data.gemmaRisk,
    gemmaScore: data.gemmaScore,
    technicalRisk: data.technicalRisk,
  };
}

export async function submitUrlToVirusTotalApi(
  url: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "vt_submit",
      url,
    }),
  });

  const data = await res.json().catch(() => ({ success: false, error: "Erreur réseau" }));
  return data;
}

export async function askGemmaAssistantApi(
  message: string,
  history: { role: string; content: string }[] = [],
  lang: Language = "fr",
  courseContext?: string,
  mode?: "standard" | "student",
): Promise<GemmaAssistantReply> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
      type: "assistant",
      lang,
      history,
      courseContext,
      mode,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    const isQuota = res.status === 429 || data.quotaExceeded;
    const errorMsg =
      data.error ||
      (isQuota
        ? "Quota API IA CyberSafe dépassé (429). L'assistant ne peut pas répondre."
        : "Erreur lors de l'appel à l'IA CyberSafe.");
    throw new GemmaApiError(errorMsg, isQuota, res.status);
  }

  return {
    reply: data.reply || "",
    model: data.model || "IA CyberSafe",
    isGemma: true,
    lang,
  };
}
