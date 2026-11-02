import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { chunkDocument, retrieveRelevantPassages, buildRagContextPrompt } from "../lib/rag-indexer";

function ensureEnvLoaded() {
  if (!process.env["GEMINI_API_KEY"]) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile();
      }
    } catch {}

    if (!process.env["GEMINI_API_KEY"]) {
      try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
              const [k, ...v] = trimmed.split("=");
              const val = v
                .join("=")
                .trim()
                .replace(/^["']|["']$/g, "");
              if (k && k.trim() === "GEMINI_API_KEY" && val) {
                process.env["GEMINI_API_KEY"] = val;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Impossible de lire .env manuellement:", err);
      }
    }
  }
}

ensureEnvLoaded();

export const GEMMA_MODEL = process.env["GEMMA_MODEL"] || "gemma-4-26b-a4b-it";
export const GEMMA_FALLBACK_MODEL = "gemma-2-27b-it";

export function parseGemmaJsonResponse<T = any>(text: string): T {
  const trimmed = text.trim();

  try {
    const raw = JSON.parse(trimmed);
    return Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" ? raw[0] : raw;
  } catch {}

  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (blockMatch && blockMatch[1]) {
    try {
      const raw = JSON.parse(blockMatch[1].trim());
      return Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" ? raw[0] : raw;
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const raw = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      return Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" ? raw[0] : raw;
    } catch {}
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const raw = JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
      return Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" ? raw[0] : raw;
    } catch {}
  }

  throw new Error(
    `Impossible d'extraire un JSON valide de la réponse Gemma : ${trimmed.slice(0, 100)}...`,
  );
}

export type AnalysisType = "sms" | "qr" | "audio" | "assistant" | "learning";
export type SupportedLanguage = "fr" | "en" | "ee";

export interface Finding {
  label: string;
  detail: string;
  weight: number;
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

export interface GemmaAnalysisResponse {
  level: "FAIBLE" | "SUSPECT" | "ÉLEVÉ";
  score: number;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  extractedMeta?: GemmaExtractedMeta;
  model: string;
  isGemma: true;
  lang: SupportedLanguage;
}

export interface GemmaStudyPlanItem {
  id: number;
  day: string;
  topic: string;
  completed: boolean;
}

export interface GemmaQuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GemmaFlashcardItem {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  binaryStatement?: string;
  binaryAnswer?: boolean;
  binaryExplanation?: string;
  mcqQuestion?: string;
  mcqOptions?: string[];
  mcqAnswerIndex?: number;
  mcqExplanation?: string;
}

export interface GemmaAssistantResponse {
  reply: string;
  model: string;
  isGemma: true;
  lang: SupportedLanguage;
  plan?: GemmaStudyPlanItem[];
  quiz?: GemmaQuizQuestion[];
  flashcards?: GemmaFlashcardItem[];
  extractedCourseText?: string;
}

export interface GemmaImageInput {
  base64: string;
  mimeType: string;
}

export interface GemmaErrorResponse {
  error: string;
  quotaExceeded: boolean;
  isGemma: false;
  statusCode: number;
}

function getClient(): GoogleGenAI {
  ensureEnvLoaded();
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante côté serveur dans .env");
  }
  return new GoogleGenAI({ apiKey });
}

const GEMMA_REQUEST_TIMEOUT_MS = 60_000; // 60 secondes maximum (compatible Vercel serverless)

async function callGemmaWithFallback(client: GoogleGenAI, payload: any, options: any = {}): Promise<any> {
  const { timeoutMs = GEMMA_REQUEST_TIMEOUT_MS } = payload.config || {};
  const configWithTimeout = {
    ...payload,
    config: {
      ...payload.config,
      timeoutMs: timeoutMs ?? GEMMA_REQUEST_TIMEOUT_MS,
    },
  };
  try {
    return await client.models.generateContent({
      model: GEMMA_MODEL,
      ...configWithTimeout,
    });
  } catch (err: any) {
    const msg = String(err?.message || "");
    const isModelError = (msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("UNAVAILABLE"));
    if (isModelError && GEMMA_MODEL !== GEMMA_FALLBACK_MODEL && options.allowFallback) {
      const result = await client.models.generateContent({
        model: GEMMA_FALLBACK_MODEL,
        ...configWithTimeout,
      });
      const response = (result as any)?.response;
      if (response?.candidates && response.candidates.length > 0) {
        const modelUsed = GEMMA_FALLBACK_MODEL;
        const fullResponse = {
          ...response,
          modelUsed,
          fallbackTriggered: true,
          fallbackFrom: GEMMA_MODEL,
        };
        return fullResponse;
      }
      return result;
    }
    throw err;
  }
}

export async function analyzeContentWithGemma(
  content: string,
  type: AnalysisType,
  lang: SupportedLanguage = "fr",
  image?: GemmaImageInput,
): Promise<GemmaAnalysisResponse> {
  const client = getClient();

  const langInstructions: Record<SupportedLanguage, string> = {
    fr: "Rédige l'intégralité du résumé, des libellés de détection, de l'analyse syntaxique et des recommandations en français simple, très clair et accessible au secteur informel togolais.",
    en: "Formulate all summaries, finding labels, syntax checks, and recommendations strictly in clear, accessible English.",
    ee: "Ŋlɔ emetsonuwo, beble dzesiwo kple aɖaŋuɖoɖowo katã le Eʋegbe (Éwé) nyui me, si sɔ na Togo dukɔmeviwo kple Mobile Money (T-Money, Moov Money).",
  };

  const typeContext: Record<AnalysisType, string> = {
    sms: image
      ? "L'utilisateur a soumis une CAPTURE D'ÉCRAN (et/ou texte) d'un SMS Mobile Money reçu au Togo. Lis intégralement l'image, extrais le texte exact, l'expéditeur affiché en haut de l'écran, les montants et vérifie la conformité avec les vrais formats T-Money / Moov Money."
      : "Ce contenu est un SMS Mobile Money reçu par un utilisateur au Togo.",
    qr: "Ce contenu provient d'un QR Code ou d'un lien extrait au Togo.",
    audio: "Ce contenu est la transcription ou le résumé d'un appel téléphonique suspect au Togo.",
    assistant: "Question générale de cybersécurité.",
    learning: "Exercice ou module d'apprentissage.",
  };

  const prompt = `Tu es l'expert en sécurité numérique CyberSafe Online au Togo, propulsé par Google Gemma (${GEMMA_MODEL}), spécialisé dans la détection des arnaques Mobile Money (T-Money / Yas, Moov Money / Flooz), les faux transferts par erreur, les fausses tontines, les faux concours et les vols de codes PIN/OTP.
${typeContext[type]}
${content ? `Message / Contenu fourni :\n"""\n${content}\n"""` : "Lis attentivement le message figurant sur la capture d'écran jointe."}

Directives d'analyse :
1. Détecte les menaces indépendamment de la langue utilisée (français, anglais, éwé ou code-switching).
2. Compare RIGOUREUSEMENT la syntaxe du message aux VRAIS formats de SMS officiels au Togo (T-Money et Moov Money) :
   - Un VRAI SMS de transaction T-Money ou Moov Money provient d'un expéditeur alphanumérique officiel (TMoney, MoovMoney, Yas, Flooz), mentionne un montant précis, le "Nouveau solde : XXX FCFA", une référence officielle (ex: Réf / ID / TxID), ne contient AUCUN lien web externe, ne demande JAMAIS de code PIN/OTP, et ne demande JAMAIS de renvoyer de l'argent.
   - Une ARNAQUE ("Tu as reçu un dépôt par erreur, renvoie-moi...", faux concours/loterie, fausse tontine, usurpation d'agent, lien .xyz/.top, numéro personnel +228 9X XX XX XX) viole ces formats officiels.
3. Extrais les informations clés : expéditeur (sender), opérateur ciblé (T-Money, Moov Money, ou Inconnu), montants, numéros de téléphone, et verdict de conformité syntaxique ("CONFORME", "NON_CONFORME" ou "SUSPECT").
4. IMPORTANT : Un résultat à risque faible (FAIBLE) ne doit JAMAIS être formulé comme une garantie absolue d'authenticité. Toujours recommander la consultation du solde officiel via le menu USSD (*145# ou *155#).
5. Langue de réponse : ${lang}. ${langInstructions[lang]}

Réponds EXCLUSIVEMENT sous la forme d'un objet JSON strict avec cette structure :
{
  "level": "ÉLEVÉ" | "SUSPECT" | "FAIBLE",
  "score": <nombre entier entre 0 et 100>,
  "summary": "<alerte claire en langage simple compréhensible immédiatement par un commerçant, artisan ou étudiant au Togo>",
  "sender": "<expéditeur détecté ou déduit, ex: 'TMoney (Officiel)', 'Numéro privé +228 99 00 00 00', 'Faux agent Moov', etc.>",
  "operator": "T-Money" | "Moov Money" | "T-Money / Moov Money" | "Autre / Non spécifié",
  "syntaxConformity": "CONFORME" | "NON_CONFORME" | "SUSPECT",
  "syntaxDetail": "<explication précise de la conformité ou non-conformité par rapport aux vrais SMS officiels T-Money / Moov Money>",
  "transcribedText": "<si une image a été fournie, texte exact lu dans la capture d'écran ; sinon chaîne vide>",
  "amounts": ["<montant extrait 1>"],
  "phones": ["<numéro extrait 1>"],
  "findings": [
    {
      "label": "<titre court du signal détecté>",
      "detail": "<explication claire du risque>",
      "weight": <poids indicatif entre 5 et 50>
    }
  ],
  "recommendations": [
    "<conseil concret 1 (ex: vérifier le vrai solde via *145# pour T-Money ou *155# pour Moov Money)>",
    "<conseil concret 2>"
  ]
}`;

  const contentsPayload: any = image?.base64
    ? [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: image.base64.replace(/^data:[^;]+;base64,/, ""),
                mimeType: image.mimeType || "image/png",
              },
            },
            { text: prompt },
          ],
        },
      ]
    : prompt;

  try {
    const res = await callGemmaWithFallback(client, {
      contents: contentsPayload,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = res.text?.trim() || "";
    const parsed = parseGemmaJsonResponse(text);

    const level =
      parsed.level === "ÉLEVÉ" || parsed.level === "SUSPECT" || parsed.level === "FAIBLE"
        ? parsed.level
        : parsed.score >= 60
          ? "ÉLEVÉ"
          : parsed.score >= 25
            ? "SUSPECT"
            : "FAIBLE";

    const syntaxConformity =
      parsed.syntaxConformity === "CONFORME" ||
      parsed.syntaxConformity === "NON_CONFORME" ||
      parsed.syntaxConformity === "SUSPECT"
        ? parsed.syntaxConformity
        : level === "FAIBLE"
          ? "CONFORME"
          : level === "ÉLEVÉ"
            ? "NON_CONFORME"
            : "SUSPECT";

    return {
      level,
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 50,
      summary: parsed.summary || "Analyse effectuée avec succès par Gemma.",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      extractedMeta: {
        sender: parsed.sender || undefined,
        operator: parsed.operator || undefined,
        syntaxConformity,
        syntaxDetail: parsed.syntaxDetail || undefined,
        transcribedText: parsed.transcribedText || undefined,
        amounts: Array.isArray(parsed.amounts) ? parsed.amounts : [],
        phones: Array.isArray(parsed.phones) ? parsed.phones : [],
      },
      model: GEMMA_MODEL,
      isGemma: true,
      lang,
    };
  } catch (error: any) {
    console.error("[Gemma Backend Service Error]:", error);
    const message = error?.message || String(error);
    const isQuota =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED");
    const err: any = new Error(
      isQuota
        ? "Quota API Gemma dépassé (429 RESOURCE_EXHAUSTED). Veuillez patienter ou vérifier vos crédits Google GenAI."
        : `Erreur du service Gemma : ${message}`,
    );
    err.quotaExceeded = isQuota;
    err.statusCode = isQuota ? 429 : 500;
    throw err;
  }
}

export async function extractSmsFromImageWithGemma(
  image: GemmaImageInput,
  lang: SupportedLanguage = "fr",
): Promise<{
  text: string;
  sender?: string;
  operator?: string;
  amounts?: string[];
  phones?: string[];
}> {
  const client = getClient();
  const prompt = `Tu es l'analyste de sécurité Mobile Money de CyberSafe Online au Togo.
Analyse cette capture d'écran d'un SMS ou notification reçue sur un smartphone au Togo (T-Money, Moov Money, ou message privé).
Extrais fidèlement :
1. Le texte exact et complet du SMS affiché.
2. L'expéditeur affiché en tête (sender).
3. L'opérateur présumé (T-Money, Moov Money, ou Autre).
4. Tous les montants en FCFA mentionnés.
5. Tous les numéros de téléphone (+228...) mentionnés.

Réponds EXCLUSIVEMENT en JSON strict avec ce format :
{
  "text": "<texte intégral transcrit du SMS>",
  "sender": "<nom ou numéro de l'expéditeur>",
  "operator": "T-Money" | "Moov Money" | "Autre",
  "amounts": ["<montant 1>"],
  "phones": ["<téléphone 1>"]
}`;

  const res = await callGemmaWithFallback(client, {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: image.base64.replace(/^data:[^;]+;base64,/, ""),
              mimeType: image.mimeType || "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = res.text?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed = parsed[0];
  } catch {
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) parsed = parsed[0];
  }

  return {
    text: String(parsed.text || "").trim(),
    sender: parsed.sender || undefined,
    operator: parsed.operator || undefined,
    amounts: Array.isArray(parsed.amounts) ? parsed.amounts : [],
    phones: Array.isArray(parsed.phones) ? parsed.phones : [],
  };
}

export async function extractCourseFromImageWithGemma(
  image: GemmaImageInput,
  lang: SupportedLanguage = "fr",
): Promise<{ text: string; suggestedTitle: string; suggestedSubject: string }> {
  const client = getClient();
  const prompt = `Tu es un assistant académique propulsé par Google Gemma.
Lis attentivement cette photo d'un cours d'école ou d'université (notes de cours, polycopié, diapositive ou tableau).
Transcris fidèlement tout le contenu pédagogique lisible et structure-le clairement.
Réponds EXCLUSIVEMENT en JSON strict avec ce format :
{
  "suggestedTitle": "<titre court du cours identifié>",
  "suggestedSubject": "<matière identifiée, ex: Mathématiques & Algèbre, Droit & Sciences Juridiques, Informatique & Programmation, Économie, Finance & Gestion, Cybersécurité & Réseaux, Physique, Chimie & SVT>",
  "text": "<transcription complète et structurée du cours>"
}`;

  const res = await callGemmaWithFallback(client, {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: image.base64.replace(/^data:[^;]+;base64,/, ""),
              mimeType: image.mimeType || "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = res.text?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(clean);
  }

  return {
    text: parsed.text || "",
    suggestedTitle: parsed.suggestedTitle || "Cours extrait par photo",
    suggestedSubject: parsed.suggestedSubject || "Cybersécurité & Réseaux",
  };
}

export async function generateStudyPlanWithGemma(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  examDate: string,
  lang: SupportedLanguage = "fr",
): Promise<GemmaAssistantResponse> {
  const client = getClient();
  const langNotice =
    lang === "ee"
      ? "Rédige l'introduction et les étapes du plan en Eʋegbe (Éwé) clair."
      : lang === "en"
        ? "Write the introduction and plan milestones in clear English."
        : "Rédige l'introduction et les jalons du plan en français clair, motivant et méthodique.";

  const prompt = `Tu es le tuteur académique proactif propulsé par Google Gemma (${GEMMA_MODEL}).
L'étudiant a exécuté la commande "/plan" pour organiser ses révisions.
Titre du cours : "${courseTitle || courseSubject}"
Matière : "${courseSubject}"
Date d'examen / échéance : "${examDate || "Dans 5 jours"}"
${courseContent ? `Contenu du cours téléversé :\n"""\n${courseContent.slice(0, 6000)}\n"""` : ""}

${langNotice}
Crée un plan de révision personnalisé sur 5 jours (ou 5 étapes progressives jusqu'à la date d'examen) qui découpe intelligemment les chapitres et notions EXACTES de ce cours, avec un rappel proactif de quiz quotidien.

Réponds EXCLUSIVEMENT en JSON strict avec cette structure :
{
  "reply": "<message d'introduction encourageant et proactif présentant la stratégie de révision et proposant un rappel / quiz du jour>",
  "plan": [
    {
      "id": 1,
      "day": "<Jour 1 (ou Date) — Titre de l'étape>",
      "topic": "<Détail précis des notions du cours à réviser et objectif d'exercice>",
      "completed": false
    }
  ]
}`;

  const res = await callGemmaWithFallback(client, {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = res.text?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed = parsed[0];
  } catch {
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) parsed = parsed[0];
  }

  const plan: GemmaStudyPlanItem[] = Array.isArray(parsed.plan)
    ? parsed.plan.map((item: any, idx: number) => ({
        id: idx + 1,
        day: String(item.day || `Jour ${idx + 1}`),
        topic: String(item.topic || "Révision des concepts clés"),
        completed: Boolean(item.completed),
      }))
    : [];

  return {
    reply:
      parsed.reply ||
      `📅 **Plan de révision personnalisé généré par Gemma** pour **${courseTitle || courseSubject}** (Objectif : ${examDate || "Examen"}).`,
    model: GEMMA_MODEL,
    isGemma: true,
    lang,
    plan,
  };
}

export async function generateQuizWithGemma(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  lang: SupportedLanguage = "fr",
): Promise<GemmaAssistantResponse> {
  const client = getClient();
  const langNotice =
    lang === "ee"
      ? "Rédige les questions, options et explications en Eʋegbe (Éwé)."
      : lang === "en"
        ? "Write all questions, options, and explanations in clear English."
        : "Rédige les questions, les 4 propositions et les explications détaillées en français clair.";

  const prompt = `Tu es le tuteur académique adaptatif propulsé par Google Gemma (${GEMMA_MODEL}).
L'étudiant a tapé la commande "/quiz" pour tester ses connaissances.
Titre du cours : "${courseTitle || courseSubject}"
Matière : "${courseSubject}"
${courseContent ? `Contenu du cours téléversé par l'étudiant :\n"""\n${courseContent.slice(0, 6000)}\n"""` : ""}

${langNotice}
Génère exactement 4 questions à choix multiples (QCM) pertinentes, progressives et directement ancrées dans le contenu du cours fourni (ou dans la matière si aucun texte n'est fourni).
Chaque question doit avoir exactement 4 options, l'index exact de la bonne réponse (0, 1, 2 ou 3) et une explication pédagogique détaillée qui aide l'étudiant à comprendre son erreur s'il se trompe.

Réponds EXCLUSIVEMENT en JSON strict avec cette structure :
{
  "reply": "<message d'encouragement invitant l'étudiant à répondre aux questions ci-dessous pour évaluer sa maîtrise du cours>",
  "quiz": [
    {
      "id": 1,
      "question": "<énoncé précis de la question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "answerIndex": 0,
      "explanation": "<explication pédagogique détaillée de la bonne réponse>"
    }
  ]
}`;

  const res = await callGemmaWithFallback(client, {
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = res.text?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed = parsed[0];
  } catch {
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) parsed = parsed[0];
  }

  const quiz: GemmaQuizQuestion[] = Array.isArray(parsed.quiz)
    ? parsed.quiz.map((q: any, idx: number) => ({
        id: idx + 1,
        question: String(q.question || `Question ${idx + 1}`),
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options.map(String)
            : ["Vrai", "Faux"],
        answerIndex:
          typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex < 4
            ? q.answerIndex
            : 0,
        explanation: String(q.explanation || "Référez-vous aux notions clés du cours."),
      }))
    : [];

  return {
    reply:
      parsed.reply ||
      `🎯 **Quiz d'évaluation généré sur mesure par Gemma** à partir de votre cours **"${courseTitle || courseSubject}"** :`,
    model: GEMMA_MODEL,
    isGemma: true,
    lang,
    quiz,
  };
}

export async function generateFlashcardsWithGemma(
  courseTitle: string,
  courseSubject: string,
  courseContent: string,
  lang: SupportedLanguage = "fr",
): Promise<GemmaFlashcardItem[]> {
  const client = getClient();
  const langNotice =
    lang === "ee"
      ? "Rédige le recto (front) et le verso (back) en Eʋegbe (Éwé)."
      : lang === "en"
        ? "Formulate flashcard front and back strictly in clear English."
        : "Formule le recto (front: question / concept) et le verso (back: définition / explication clé) en français pédagogique.";

  const prompt = `Tu es le tuteur pédagogique propulsé par Google Gemma (${GEMMA_MODEL}).
Crée entre 4 et 6 fiches de révision flashcards interactives basées sur les notions maîtresses de ce cours :
Titre : "${courseTitle || courseSubject}"
Matière : "${courseSubject}"
Contenu du cours :
"""
${courseContent.slice(0, 7000)}
"""

${langNotice}
Chaque fiche doit cibler une définition capitale, une formule, un piège fréquent d'examen ou un principe fondamental.
Réponds EXCLUSIVEMENT en JSON strict avec ce format :
{
  "flashcards": [
    {
      "id": "fc-1",
      "front": "<question percutante ou concept à définir>",
      "back": "<explication claire, synthétique et mémorisable>",
      "mastered": false,
      "binaryStatement": "<affirmation claire à valider par Vrai ou Faux>",
      "binaryAnswer": true,
      "binaryExplanation": "<justification pédagogique immédiate du Vrai ou Faux>",
      "mcqQuestion": "<question à choix multiples>",
      "mcqOptions": ["<option 1>", "<option 2>", "<option 3>", "<option 4>"],
      "mcqAnswerIndex": 0,
      "mcqExplanation": "<explication détaillée de la bonne réponse>"
    }
  ]
}`;

  const res = await callGemmaWithFallback(client, {
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const raw = res.text?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed = parsed[0];
  } catch {
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) parsed = parsed[0];
  }

  const cards: GemmaFlashcardItem[] = Array.isArray(parsed.flashcards)
    ? parsed.flashcards.map((fc: any, idx: number) => {
        const front = String(fc.front || `Concept clé ${idx + 1}`);
        const back = String(fc.back || "Consultez les notes pour la définition complète.");
        const binaryStatement = fc.binaryStatement ? String(fc.binaryStatement) : front;
        const binaryAnswer = typeof fc.binaryAnswer === "boolean" ? fc.binaryAnswer : true;
        const binaryExplanation = fc.binaryExplanation ? String(fc.binaryExplanation) : back;
        const mcqQuestion = fc.mcqQuestion ? String(fc.mcqQuestion) : front;
        const mcqOptions =
          Array.isArray(fc.mcqOptions) && fc.mcqOptions.length >= 2
            ? fc.mcqOptions.map(String)
            : [back, "Alternative inexacte", "Option non recommandée"];
        const mcqAnswerIndex =
          typeof fc.mcqAnswerIndex === "number" &&
          fc.mcqAnswerIndex >= 0 &&
          fc.mcqAnswerIndex < mcqOptions.length
            ? fc.mcqAnswerIndex
            : 0;
        const mcqExplanation = fc.mcqExplanation ? String(fc.mcqExplanation) : back;

        return {
          id: String(fc.id || `fc-${idx + 1}`),
          front,
          back,
          mastered: Boolean(fc.mastered),
          binaryStatement,
          binaryAnswer,
          binaryExplanation,
          mcqQuestion,
          mcqOptions,
          mcqAnswerIndex,
          mcqExplanation,
        };
      })
    : [];

  return cards;
}

export async function askGemmaAssistant(
  message: string,
  history: { role: string; content: string }[] = [],
  lang: SupportedLanguage = "fr",
  courseContext?: string,
  mode?: "standard" | "student",
): Promise<GemmaAssistantResponse> {
  const client = getClient();

  const langPrompt: Record<SupportedLanguage, string> = {
    fr: "Tu dois répondre en français simple, précis, bienveillant et structuré.",
    en: "You must reply strictly in clear, professional and structured English.",
    ee: "Wò eŋuɖoɖo nanye Eʋegbe (Éwé) pɛpɛpɛ, kple Togo Mobile Money nyawo nyuie.",
  };

  let ragContextBlock = "";
  if (mode === "student" && courseContext && courseContext.trim().length > 0) {
    const chunks = chunkDocument(courseContext);
    const relevantPassages = retrieveRelevantPassages(message, chunks, 3);
    ragContextBlock = buildRagContextPrompt(relevantPassages);
  }

  const studentGuidelines =
    mode === "student"
      ? `
Tu es l'Assistant Pédagogique Réactif, Proactif et Adaptatif propulsé par Google Gemma (${GEMMA_MODEL}).
L'étudiant a activé le volet "Apprendre" via une commande "/".
Comportement attendu :
- RÉACTIF : Réponds immédiatement et avec précision aux questions sur le cours téléversé. Citer les passages sources pertinents.
- PROACTIF : Propose de toi-même des pistes de révision, relance l'étudiant sur les points importants du cours et suggère un mini-quiz ou un rappel.
- ADAPTATIF : Si l'étudiant signale une erreur au quiz ou une notion mal comprise, réexplique-la avec une analogie simple et un exemple concret.
${ragContextBlock ? ragContextBlock : courseContext ? `\n[CONTENU DU COURS TÉLÉVERSÉ PAR L'ÉTUDIANT] :\n${courseContext.slice(0, 5000)}\n` : ""}

Commandes slash disponibles :
- /apprendre : Active le mode apprentissage et invite à téléverser un cours (PDF, DOCX, PPTX, photo ou texte).
- /plan : Propose un plan d'apprentissage sur plusieurs jours selon la date d'examen.
- /quiz : Pose des questions QCM sur le cours et corrige les réponses.
- /resume : Produit un résumé structuré et des fiches de révision du cours.
- /stop : Quitte le mode apprentissage et revient au scanner d'arnaques.`
      : `
Tu es en MODE SCANNER D'ARNAQUES & ASSISTANT MOBILE MONEY AU TOGO (T-Money / Moov Money).
Sans commande commençant par "/", tu restes strictement en mode détection de fraudes et protection Mobile Money :
1. Si l'utilisateur colle un SMS ou décrit un appel ("Tu as reçu un dépôt par erreur, renvoie-moi...", faux concours, fausse tontine, demande de PIN/OTP), analyse-le immédiatement : extrais le montant, l'expéditeur, vérifie la conformité avec les vrais formats T-Money / Moov Money, et donne une alerte claire en français simple (ou dans la langue choisie).
2. Ne conseille JAMAIS de partager un code PIN ou un code OTP.
3. Devant une annonce d'erreur de transfert, rappelle de TOUJOURS vérifier le vrai solde via le menu USSD officiel (*145# pour T-Money ou *155# pour Moov Money).
4. Rappelle discrètement en fin de réponse que le mode révision de cours ne s'active que sur commande "/" (ex: /apprendre).`;

  const systemInstruction = `Tu es le bot intelligent CyberSafe Online au Togo, propulsé de façon essentielle par Google Gemma (${GEMMA_MODEL}).
${langPrompt[lang]}
${studentGuidelines}`;

  const contents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const res = await callGemmaWithFallback(client, {
      contents: contents as any,
    });

    return {
      reply: res.text || "Je n'ai pas pu générer de réponse.",
      model: GEMMA_MODEL,
      isGemma: true,
      lang,
    };
  } catch (error: any) {
    console.error("[CyberSafe AI Assistant Error]:", error);
    const message = error?.message || String(error);
    const isQuota =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED");
    const err: any = new Error(
      isQuota
        ? "Quota API Gemma dépassé (429 RESOURCE_EXHAUSTED). Le service d'assistance est momentanément restreint."
        : `Erreur du service d'assistance Gemma : ${message}`,
    );
    err.quotaExceeded = isQuota;
    err.statusCode = isQuota ? 429 : 500;
    throw err;
  }
}
