/**
 * Handler HTTP pour l'endpoint POST /api/analyze.
 * Réutilisable par le serveur de production (server.ts) et le middleware Vite de dev.
 */

import {
  analyzeContentWithGemma,
  askGemmaAssistant,
  type AnalysisType,
  type SupportedLanguage,
} from "./gemma";
import {
  analyzeUrlsWithVirusTotal,
  combineGemmaAndVirusTotal,
  submitUrlToVirusTotal,
  type VirusTotalAnalysisResult,
} from "./virustotal";

export async function handleAnalyzeApiRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corps de requête JSON invalide." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    content,
    type = "sms",
    lang = "fr",
    history = [],
    checkVirusTotal = true,
    url,
    courseContext,
    mode,
  } = body || {};

  // Endpoint spécifique pour soumettre une URL inconnue à l'analyse VirusTotal
  if (type === "vt_submit") {
    const targetUrl = url || content;
    if (!targetUrl || typeof targetUrl !== "string") {
      return new Response(JSON.stringify({ error: "Une URL valide est requise pour la soumission." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const res = await submitUrlToVirusTotal(targetUrl.trim());
    return new Response(JSON.stringify(res), {
      status: res.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    return new Response(JSON.stringify({ error: "Le champ 'content' est obligatoire." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validTypes: AnalysisType[] = ["sms", "qr", "audio", "assistant", "learning"];
  const selectedType: AnalysisType = validTypes.includes(type) ? type : "sms";
  const selectedLang: SupportedLanguage = lang === "en" || lang === "ee" ? lang : "fr";

  try {
    if (selectedType === "assistant") {
      const result = await askGemmaAssistant(
        content.trim(),
        history,
        selectedLang,
        courseContext,
        mode,
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (selectedType === "sms") {
      // Pour les SMS, on effectue l'analyse sémantique Gemma et la vérification technique VirusTotal
      let vtResult: VirusTotalAnalysisResult | undefined;

      if (checkVirusTotal) {
        try {
          vtResult = await analyzeUrlsWithVirusTotal(content.trim());
        } catch {
          vtResult = {
            enabled: true,
            checked: false,
            hasUrls: false,
            urls: [],
            summary: { totalUrls: 0, maliciousUrls: 0, suspiciousUrls: 0, cleanUrls: 0, notFoundUrls: 0 },
            unavailable: true,
            unavailableReason: "Vérification VirusTotal indisponible",
            caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
          };
        }
      }

      const gemmaResult = await analyzeContentWithGemma(content.trim(), selectedType, selectedLang);

      if (vtResult) {
        const combined = combineGemmaAndVirusTotal(gemmaResult, vtResult);
        return new Response(JSON.stringify(combined), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(gemmaResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await analyzeContentWithGemma(content.trim(), selectedType, selectedLang);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const isQuota = error?.quotaExceeded || error?.statusCode === 429;
    const status = isQuota ? 429 : (error?.statusCode || 500);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur interne lors de l'appel à l'IA CyberSafe.",
        quotaExceeded: !!isQuota,
        isGemma: false,
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
