
import {
  analyzeContentWithGemma,
  askGemmaAssistant,
  extractCourseFromImageWithGemma,
  extractSmsFromImageWithGemma,
  generateFlashcardsWithGemma,
  generateQuizWithGemma,
  generateStudyPlanWithGemma,
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
    content = "",
    type = "sms",
    lang = "fr",
    history = [],
    checkVirusTotal = true,
    url,
    courseContext,
    courseTitle,
    courseSubject,
    examDate,
    mode,
    imageBase64,
    imageMimeType,
  } = body || {};

  const selectedLang: SupportedLanguage = lang === "en" || lang === "ee" ? lang : "fr";

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

  try {
    if (type === "sms_image") {
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "Aucune capture d'écran fournie pour l'analyse OCR." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const extracted = await extractSmsFromImageWithGemma(
        { base64: imageBase64, mimeType: imageMimeType || "image/png" },
        selectedLang,
      );
      return new Response(JSON.stringify(extracted), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "course_image") {
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "Aucune image fournie pour l'extraction du cours." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const extracted = await extractCourseFromImageWithGemma(
        { base64: imageBase64, mimeType: imageMimeType || "image/jpeg" },
        selectedLang,
      );
      return new Response(JSON.stringify(extracted), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "study_plan") {
      const planRes = await generateStudyPlanWithGemma(
        courseTitle || "Cours d'étude",
        courseSubject || "Général",
        courseContext || content || "",
        examDate || "",
        selectedLang,
      );
      return new Response(JSON.stringify(planRes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "study_quiz") {
      const quizRes = await generateQuizWithGemma(
        courseTitle || "Cours d'étude",
        courseSubject || "Général",
        courseContext || content || "",
        selectedLang,
      );
      return new Response(JSON.stringify(quizRes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "study_flashcards") {
      const flashcards = await generateFlashcardsWithGemma(
        courseTitle || "Cours d'étude",
        courseSubject || "Général",
        courseContext || content || "",
        selectedLang,
      );
      return new Response(JSON.stringify({ flashcards }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hasText = typeof content === "string" && content.trim().length > 0;
    const hasImage = typeof imageBase64 === "string" && imageBase64.length > 0;

    if (!hasText && !hasImage) {
      return new Response(JSON.stringify({ error: "Veuillez fournir un texte ou une capture d'écran à analyser." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validTypes: AnalysisType[] = ["sms", "qr", "audio", "assistant", "learning"];
    const selectedType: AnalysisType = validTypes.includes(type) ? type : "sms";

    if (selectedType === "assistant") {
      const result = await askGemmaAssistant(
        String(content).trim(),
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

    const imageInput = hasImage
      ? { base64: imageBase64, mimeType: imageMimeType || "image/png" }
      : undefined;

    const gemmaResult = await analyzeContentWithGemma(
      String(content).trim(),
      selectedType,
      selectedLang,
      imageInput,
    );

    const textForVt = `${String(content).trim()} ${gemmaResult.extractedMeta?.transcribedText || ""}`.trim();
    const shouldCheckVt =
      checkVirusTotal &&
      (selectedType === "sms" ||
        selectedType === "qr" ||
        /^https?:\/\//i.test(textForVt) ||
        /[a-z0-9-]+\.(com|tg|top|xyz|net|org|live|site|online)/i.test(textForVt));

    if (shouldCheckVt && textForVt) {
      let vtResult: VirusTotalAnalysisResult | undefined;
      try {
        vtResult = await analyzeUrlsWithVirusTotal(textForVt);
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

      if (vtResult) {
        const combined = combineGemmaAndVirusTotal(gemmaResult, vtResult);
        return new Response(JSON.stringify(combined), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(gemmaResult), {
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

