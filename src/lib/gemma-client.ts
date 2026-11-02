import type { Language } from "./i18n";
import type { AnalysisResult } from "./risk-engine";

export const PUBLIC_GEMMA_MODEL = "gemma-4-26b-a4b-it";

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

export interface GemmaExtractedMeta {
  sender?: string;
  operator?: string;
  syntaxConformity?: "CONFORME" | "NON_CONFORME" | "SUSPECT";
  syntaxDetail?: string;
  transcribedText?: string;
  amounts?: string[];
  phones?: string[];
}

export interface GemmaApiAnalysisResult extends AnalysisResult {
  isGemma: boolean;
  model: string;
  lang?: Language;
  extractedMeta?: GemmaExtractedMeta | undefined;
}

export interface CombinedSmsAnalysisResult extends GemmaApiAnalysisResult {
  virusTotal?: VirusTotalAnalysisResult | undefined;
  gemmaRisk?: "FAIBLE" | "SUSPECT" | "ÉLEVÉ" | undefined;
  gemmaScore?: number | undefined;
  technicalRisk?:
    ("FAIBLE" | "SUSPECT" | "ÉLEVÉ" | "NON_RÉPERTORIÉ" | "INDISPONIBLE" | "AUCUN_LIEN") | undefined;
}

export interface StudyPlanItem {
  id: number;
  day: string;
  topic: string;
  completed: boolean;
}

export interface StudyQuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

export interface GemmaAssistantReply {
  reply: string;
  model: string;
  isGemma: boolean;
  lang: Language;
  plan?: StudyPlanItem[];
  quiz?: StudyQuizQuestion[];
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
  options?: {
    checkVirusTotal?: boolean;
    imageBase64?: string;
    imageMimeType?: string;
  },
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
      imageBase64: options?.imageBase64,
      imageMimeType: options?.imageMimeType,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    const isQuota = res.status === 429 || data.quotaExceeded;
    const errorMsg =
      data.error ||
      (isQuota
        ? "Quota API Gemma 4 dépassé (429). Aucune analyse fictive n'est affichée."
        : "Erreur de communication avec le serveur Gemma 4.");
    throw new GemmaApiError(errorMsg, isQuota, res.status);
  }

  return {
    level: data.level || "SUSPECT",
    score: typeof data.score === "number" ? data.score : 50,
    summary: data.summary || "Analyse réalisée par Google Gemma 4.",
    findings: Array.isArray(data.findings) ? data.findings : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    extracted: {
      sender: data.extractedMeta?.sender,
      amounts: Array.isArray(data.extractedMeta?.amounts) ? data.extractedMeta.amounts : [],
      links: [],
      phones: Array.isArray(data.extractedMeta?.phones) ? data.extractedMeta.phones : [],
    },
    extractedMeta: data.extractedMeta,
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
        ? "Quota API Gemma 4 dépassé (429). L'assistant ne peut pas répondre."
        : "Erreur lors de l'appel à Gemma 4.");
    throw new GemmaApiError(errorMsg, isQuota, res.status);
  }

  return {
    reply: data.reply || "",
    model: data.model || "gemma-4-26b-a4b-it",
    isGemma: true,
    lang,
  };
}

export async function generateStudyPlanApi(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  examDate: string,
  lang: Language = "fr",
): Promise<GemmaAssistantReply> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "study_plan",
      courseTitle,
      courseSubject,
      courseContext: courseContent,
      examDate,
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GemmaApiError(
      data.error || "Erreur lors de la génération du plan par Gemma 4.",
      res.status === 429,
      res.status,
    );
  }

  return {
    reply: data.reply || "",
    model: data.model || "gemma-4-26b-a4b-it",
    isGemma: true,
    lang,
    plan: Array.isArray(data.plan) ? data.plan : [],
  };
}

export async function generateStudyQuizApi(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  lang: Language = "fr",
): Promise<GemmaAssistantReply> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "study_quiz",
      courseTitle,
      courseSubject,
      courseContext: courseContent,
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GemmaApiError(
      data.error || "Erreur lors de la génération du quiz par Gemma 4.",
      res.status === 429,
      res.status,
    );
  }

  return {
    reply: data.reply || "",
    model: data.model || "gemma-4-26b-a4b-it",
    isGemma: true,
    lang,
    quiz: Array.isArray(data.quiz) ? data.quiz : [],
  };
}

export async function extractSmsImageApi(
  imageBase64: string,
  imageMimeType: string,
  lang: Language = "fr",
): Promise<{
  text: string;
  sender?: string;
  operator?: string;
  amounts?: string[];
  phones?: string[];
}> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "sms_image",
      imageBase64,
      imageMimeType,
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GemmaApiError(
      data.error || "Erreur lors de la lecture OCR du SMS.",
      res.status === 429,
      res.status,
    );
  }

  return {
    text: data.text || "",
    sender: data.sender,
    operator: data.operator,
    amounts: Array.isArray(data.amounts) ? data.amounts : [],
    phones: Array.isArray(data.phones) ? data.phones : [],
  };
}

export async function generateFlashcardsApi(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  lang: Language = "fr",
): Promise<{ id: string; front: string; back: string; mastered: boolean }[]> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "study_flashcards",
      courseTitle,
      courseSubject,
      courseContext: courseContent,
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GemmaApiError(
      data.error || "Erreur lors de la génération des flashcards.",
      res.status === 429,
      res.status,
    );
  }

  return Array.isArray(data.flashcards) ? data.flashcards : [];
}

export async function extractCourseImageApi(
  imageBase64: string,
  imageMimeType: string,
  lang: Language = "fr",
): Promise<{ text: string; suggestedTitle: string; suggestedSubject: string }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "course_image",
      imageBase64,
      imageMimeType,
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new GemmaApiError(
      data.error || "Erreur lors de la lecture de la photo de cours par Gemma.",
      res.status === 429,
      res.status,
    );
  }

  return {
    text: data.text || "",
    suggestedTitle: data.suggestedTitle || "Cours extrait par photo",
    suggestedSubject: data.suggestedSubject || "Cybersécurité & Réseaux",
  };
}
