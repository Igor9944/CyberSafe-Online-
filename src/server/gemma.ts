/**
 * Service Backend pour Gemma 4 via Google GenAI SDK (@google/genai).
 * Exécute exclusivement côté serveur avec process.env.GEMINI_API_KEY.
 * Ne JAMAIS importer ce fichier dans du code exécuté côté client/navigateur.
 */

import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

// Charger les variables .env si elles ne sont pas encore présentes dans process.env
function ensureEnvLoaded() {
  if (!process.env.GEMINI_API_KEY) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile();
      }
    } catch {
      // Ignorer si le fichier .env n'est pas accessible via loadEnvFile
    }

    if (!process.env.GEMINI_API_KEY) {
      try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
              const [k, ...v] = trimmed.split("=");
              const val = v.join("=").trim().replace(/^["']|["']$/g, "");
              if (k.trim() === "GEMINI_API_KEY" && val) {
                process.env.GEMINI_API_KEY = val;
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

export const GEMMA_MODEL = "gemma-4-26b-a4b-it";

export type AnalysisType = "sms" | "qr" | "audio" | "assistant" | "learning";
export type SupportedLanguage = "fr" | "en" | "ee";

export interface Finding {
  label: string;
  detail: string;
  weight: number;
}

export interface GemmaAnalysisResponse {
  level: "FAIBLE" | "SUSPECT" | "ÉLEVÉ";
  score: number;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  model: string;
  isGemma: true;
  lang: SupportedLanguage;
}

export interface GemmaAssistantResponse {
  reply: string;
  model: string;
  isGemma: true;
  lang: SupportedLanguage;
}

export interface GemmaErrorResponse {
  error: string;
  quotaExceeded: boolean;
  isGemma: false;
  statusCode: number;
}

function getClient(): GoogleGenAI {
  ensureEnvLoaded();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante côté serveur dans .env");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyse un contenu (SMS, QR, Audio) avec le modèle Gemma 4 officiel.
 */
export async function analyzeContentWithGemma(
  content: string,
  type: AnalysisType,
  lang: SupportedLanguage = "fr",
): Promise<GemmaAnalysisResponse> {
  const client = getClient();

  const langInstructions: Record<SupportedLanguage, string> = {
    fr: "Rédige l'intégralité du résumé, des libellés de détection et des recommandations en français clair.",
    en: "Formulate all summaries, finding labels, and recommendations strictly in clear English.",
    ee: "Ŋlɔ emetsonuwo, beble dzesiwo kple aɖaŋuɖoɖowo katã le Eʋegbe (Éwé) nyui me, si sɔ na Togo dukɔmeviwo kple Mobile Money (T-Money, Moov Money).",
  };

  const typeContext: Record<AnalysisType, string> = {
    sms: "Ce contenu est un SMS reçu par un utilisateur au Togo.",
    qr: "Ce contenu provient d'un QR Code ou d'un lien extrait au Togo.",
    audio: "Ce contenu est la transcription ou le résumé d'un appel téléphonique suspect au Togo.",
    assistant: "Question générale de cybersécurité.",
    learning: "Exercice ou module d'apprentissage.",
  };

  const prompt = `Tu es l'expert en sécurité numérique CyberSafe Online au Togo, spécialisé dans la détection des arnaques Mobile Money (Moov Money, T-Money, Flooz), les vols de codes PIN/OTP, les faux gains et l'ingénierie sociale.
${typeContext[type]}
Message / Contenu à analyser :
"""
${content}
"""

Directives :
1. Détecte les menaces indépendamment de la langue utilisée dans le message (français, anglais, éwé ou code-switching).
2. Vérifie spécifiquement :
   - Demandes de code secret, code PIN, mot de passe ou code OTP
   - Faux gains, fausses loteries, promesses de bonus inattendus
   - Pression psychologique, urgence injustifiée, menace de suspension
   - Prétention d'être un agent de support ou service client officiel
   - Faux transfert par erreur demandant un remboursement immédiat
   - Codes USSD piégés (*...#) ou liens web frauduleux
3. Langue de réponse : ${lang}. ${langInstructions[lang]}

Réponds EXCLUSIVEMENT sous la forme d'un objet JSON strict avec cette structure :
{
  "level": "ÉLEVÉ" | "SUSPECT" | "FAIBLE",
  "score": <nombre entier entre 0 et 100>,
  "summary": "<résumé clair et pédagogique de la situation>",
  "findings": [
    {
      "label": "<titre court du signal détecté>",
      "detail": "<explication du risque>",
      "weight": <poids indicatif entre 5 et 50>
    }
  ],
  "recommendations": [
    "<conseil préventif 1>",
    "<conseil préventif 2>"
  ]
}`;

  try {
    const res = await client.models.generateContent({
      model: GEMMA_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = res.text?.trim() || "";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
      if (Array.isArray(parsed)) parsed = parsed[0];
    } catch {
      // Nettoyer les backticks markdown éventuels
      const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) parsed = parsed[0];
    }

    const level = parsed.level === "ÉLEVÉ" || parsed.level === "SUSPECT" || parsed.level === "FAIBLE"
      ? parsed.level
      : (parsed.score >= 60 ? "ÉLEVÉ" : parsed.score >= 25 ? "SUSPECT" : "FAIBLE");

    return {
      level,
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 50,
      summary: parsed.summary || "Analyse effectuée avec succès par Gemma 4.",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      model: GEMMA_MODEL,
      isGemma: true,
      lang,
    };
  } catch (error: any) {
    console.error("[Gemma Backend Service Error]:", error);
    const message = error?.message || String(error);
    const isQuota = message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED");
    const err: any = new Error(
      isQuota
        ? "Quota API Gemma dépassé (429 RESOURCE_EXHAUSTED). Veuillez patienter ou vérifier vos crédits Google GenAI."
        : `Erreur du service Gemma : ${message}`
    );
    err.quotaExceeded = isQuota;
    err.statusCode = isQuota ? 429 : 500;
    throw err;
  }
}

/**
 * Assistant interactif propulsé par Gemma 4.
 */
export async function askGemmaAssistant(
  message: string,
  history: { role: string; content: string }[] = [],
  lang: SupportedLanguage = "fr",
  courseContext?: string,
  mode?: "standard" | "student",
): Promise<GemmaAssistantResponse> {
  const client = getClient();

  const langPrompt: Record<SupportedLanguage, string> = {
    fr: "Tu dois répondre en français clair, précis, bienveillant et structuré.",
    en: "You must reply strictly in clear, professional and structured English.",
    ee: "Wò eŋuɖoɖo nanye Eʋegbe (Éwé) pɛpɛpɛ, kple Togo Mobile Money nyawo nyuie.",
  };

  const studentGuidelines = mode === "student" || courseContext
    ? `
Tu es l'Assistant Pédagogique et Tuteur Universel pour Étudiants propulsé par l'IA CyberSafe.
Tu accompagnes l'étudiant avec excellence dans TOUS ses sujets d'étude et matières académiques :
- Cybersécurité, Réseaux & Systèmes d'information
- Mathématiques, Algèbre, Analyse, Probabilités & Statistiques
- Informatique, Programmation (Python, JavaScript, C, Java, SQL, Algorithmique)
- Droit (Droit togolais, OHADA, Droit civil, constitutionnel, des affaires)
- Économie, Gestion, Comptabilité, Finance & Marketing
- Sciences Physiques, Chimie, SVT / Biologie, Sciences médicales
- Histoire, Géographie, Philosophie, Sciences humaines
- Langues vivantes (Français, Anglais, Éwé) et toute autre discipline.

Tu t'adaptes rigoureusement au niveau de l'étudiant, en fournissant des explications didactiques, des exemples concrets, des formules exactes et des plans de révision chronologiques.
${courseContext ? `\n[CONTENU DU COURS OU DOCUMENT FOURNI PAR L'ÉTUDIANT] :\n${courseContext}\n` : ""}

Commandes slash prises en charge dans le Mode Étudiant :
- /apprendre [sujet ou question] : Explique de manière pédagogique et détaillée les concepts fondamentaux du cours ou de la discipline demandée.
- /plan : Rédige un rétro-planning de révision méthodique jour par jour adapté à la matière et à la date d'examen.
- /quiz : Génère un quiz d'évaluation interactif avec des questions à choix multiples (A, B, C, D) ciblées sur le cours ou le sujet étudié, suivi des explications détaillées.
- /resume : Crée une fiche de synthèse synthétique avec notions clés, formules, définitions et pièges d'examen classiques.
- /stop : Confirme la fin de la session de révision et encourage chaleureusement l'étudiant.`
    : `
Règles d'or absolues pour la sécurité :
1. Ne conseille JAMAIS de partager un code PIN ou un code OTP.
2. Devant une annonce d'erreur de transfert, rappelle de TOUJOURS vérifier le solde via le menu officiel (*155# ou *145#).
3. Sois concis, pragmatique et rassurant.`;

  const systemInstruction = `Tu es l'assistant intelligent CyberSafe Online au Togo, propulsé par l'IA CyberSafe.
Tu aides les utilisateurs et étudiants avec expertise, rigueur et clarté.
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
    const res = await client.models.generateContent({
      model: GEMMA_MODEL,
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
    const isQuota = message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED");
    const err: any = new Error(
      isQuota
        ? "Quota API IA CyberSafe dépassé. L'assistant ne peut pas répondre pour l'instant."
        : `Erreur de communication avec l'IA CyberSafe : ${message}`
    );
    err.quotaExceeded = isQuota;
    err.statusCode = isQuota ? 429 : 500;
    throw err;
  }
}
