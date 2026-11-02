import { describe, expect, it } from "vitest";
import { analyzeSms, analyzeQrContent, levelFromScore } from "./risk-engine";
import { DEMO_SMS, DEMO_QR_CONTENT, DEMO_TRANSCRIPT, MULTILINGUAL_DEMO_SMS } from "./demo";

describe("risk engine", () => {
  it("maps scores to the three levels", () => {
    expect(levelFromScore(10)).toBe("FAIBLE");
    expect(levelFromScore(30)).toBe("SUSPECT");
    expect(levelFromScore(80)).toBe("ÉLEVÉ");
  });

  it("legit demo SMS is low risk in French", () => {
    expect(analyzeSms(DEMO_SMS[0].text, "fr").level).toBe("FAIBLE");
  });

  it("fake bonus and OTP requests are high risk", () => {
    expect(analyzeSms(DEMO_SMS[1].text, "fr").level).toBe("ÉLEVÉ");
    expect(analyzeSms(DEMO_SMS[2].text, "fr").level).toBe("ÉLEVÉ");
    expect(analyzeSms(DEMO_TRANSCRIPT, "fr").level).toBe("ÉLEVÉ");
  });

  it("suspicious QR link is flagged", () => {
    expect(analyzeQrContent(DEMO_QR_CONTENT).level).not.toBe("FAIBLE");
  });

  it("detects threats in Éwé (Eʋegbe)", () => {
    const eweOtp = MULTILINGUAL_DEMO_SMS.ee[2].text;
    const resultEe = analyzeSms(eweOtp, "ee");
    expect(resultEe.level).toBe("ÉLEVÉ");
    expect(resultEe.summary).toContain("SMS sia");
    expect(resultEe.recommendations.some((r) => r.includes("PIN") || r.includes("OTP"))).toBe(true);
  });

  it("detects threats in English", () => {
    const enOtp = MULTILINGUAL_DEMO_SMS.en[2].text;
    const resultEn = analyzeSms(enOtp, "en");
    expect(resultEn.level).toBe("ÉLEVÉ");
    expect(resultEn.summary).toContain("This SMS");
    expect(resultEn.recommendations.some((r) => r.includes("PIN") || r.includes("OTP"))).toBe(true);
  });

  it("handles code-switching (French + Éwé)", () => {
    const mixed = "Bonjour mon frère, j'ai fait une erreur de transfert de 25 000 FCFA sur ton compte T-Money. Na trɔ ga nam kaba s'il te plaît !";
    const result = analyzeSms(mixed, "fr");
    expect(result.level).not.toBe("FAIBLE");
    expect(result.findings.some((f) => f.label.includes("transfert") || f.label.includes("Arnaque"))).toBe(true);
  });
});
