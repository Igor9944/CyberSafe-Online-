import { describe, expect, it } from "vitest";
import {
  analyzeContentWithGemma,
  askGemmaAssistant,
  GEMMA_MODEL,
  GEMMA_FALLBACK_MODEL,
  parseGemmaJsonResponse,
} from "../server/gemma";

describe("Véritable API Gemma 4 (Integration & Parsing)", () => {
  it("vérifie que le modèle configuré est bien gemma-4-26b-a4b-it", () => {
    expect(GEMMA_MODEL).toBe("gemma-4-26b-a4b-it");
    expect(GEMMA_FALLBACK_MODEL).toBe("gemma-2-27b-it");
  });

  it("nettoie et extrait un JSON valide encapsulé dans des balises markdown ```json", () => {
    const rawGemmaOutput = `
Voici l'analyse demandée :
\`\`\`json
{
  "level": "ÉLEVÉ",
  "score": 85,
  "summary": "Tentative d'arnaque détectée : demande illégitime de code OTP.",
  "findings": [
    { "label": "Demande d'OTP", "detail": "L'expéditeur demande un code secret", "weight": 40 }
  ],
  "recommendations": [
    "Ne communiquez jamais votre code OTP"
  ]
}
\`\`\`
    `;

    const parsed = parseGemmaJsonResponse(rawGemmaOutput);
    expect(parsed.level).toBe("ÉLEVÉ");
    expect(parsed.score).toBe(85);
    expect(parsed.findings.length).toBe(1);
    expect(parsed.recommendations[0]).toContain("OTP");
  });

  it("gère gracieusement le parsing d'un JSON brut direct sans markdown", () => {
    const rawJson = '{"level": "FAIBLE", "score": 10, "summary": "Message officiel standard."}';
    const parsed = parseGemmaJsonResponse(rawJson);
    expect(parsed.level).toBe("FAIBLE");
    expect(parsed.score).toBe(10);
  });

  it("appelle réellement l'API Gemma 4 et retourne un résultat structuré conforme", async () => {
    const testSms =
      "URGENT Moov Money: Votre compte sera bloqué sous 2h. Envoyez votre code OTP au 90001122 pour le débloquer.";

    try {
      const result = await analyzeContentWithGemma(testSms, "sms", "fr");

      expect(result.isGemma).toBe(true);
      expect(result.model).toBe("gemma-4-26b-a4b-it");
      expect(result.level).toBe("ÉLEVÉ");
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(15);
    } catch (err: any) {
      if (err.message?.includes("fetch failed") || err.message?.includes("EAI_AGAIN")) {
        console.warn("Environnement sans accès réseau sortant direct : test en ligne ignoré");
      } else {
        throw err;
      }
    }
  }, 60000);

  it("génère une réponse multilingue en Éwé (Eʋegbe)", async () => {
    const ewePrompt = "Ame aɖe bia nye PIN kɔdi le kaƒoƒo me, nukae mawɔ ?";

    try {
      const assistantRes = await askGemmaAssistant(ewePrompt, [], "ee");

      expect(assistantRes.isGemma).toBe(true);
      expect(assistantRes.model).toBe("gemma-4-26b-a4b-it");
      expect(assistantRes.lang).toBe("ee");
      expect(assistantRes.reply.length).toBeGreaterThan(20);
    } catch (err: any) {
      if (err.message?.includes("fetch failed") || err.message?.includes("EAI_AGAIN")) {
        console.warn("Environnement sans accès réseau sortant direct : test en ligne ignoré");
      } else {
        throw err;
      }
    }
  }, 60000);
});
