import { describe, expect, it } from "vitest";
import { analyzeContentWithGemma, askGemmaAssistant, GEMMA_MODEL } from "../server/gemma";

describe("Véritable API Gemma 4 (Integration)", () => {
  it("vérifie que le modèle configuré est bien gemma-4-26b-a4b-it", () => {
    expect(GEMMA_MODEL).toBe("gemma-4-26b-a4b-it");
  });

  it("appelle réellement l'API Gemma 4 et retourne un résultat structuré conforme", async () => {
    const testSms = "URGENT Moov Money: Votre compte sera bloqué sous 2h. Envoyez votre code OTP au 90001122 pour le débloquer.";

    const result = await analyzeContentWithGemma(testSms, "sms", "fr");

    expect(result.isGemma).toBe(true);
    expect(result.model).toBe("gemma-4-26b-a4b-it");
    expect(result.level).toBe("ÉLEVÉ");
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(15);
  }, 60000);

  it("génère une réponse multilingue en Éwé (Eʋegbe)", async () => {
    const ewePrompt = "Ame aɖe bia nye PIN kɔdi le kaƒoƒo me, nukae mawɔ ?";

    const assistantRes = await askGemmaAssistant(ewePrompt, [], "ee");

    expect(assistantRes.isGemma).toBe(true);
    expect(assistantRes.model).toBe("gemma-4-26b-a4b-it");
    expect(assistantRes.lang).toBe("ee");
    expect(assistantRes.reply.length).toBeGreaterThan(20);
  }, 60000);
});
