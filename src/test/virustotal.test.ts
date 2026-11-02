import { describe, expect, it } from "vitest";
import {
  extractUrlsFromText,
  encodeUrlForVirusTotal,
  fetchVirusTotalReportForUrl,
  analyzeUrlsWithVirusTotal,
  combineGemmaAndVirusTotal,
  getVirusTotalApiKey,
} from "../server/virustotal";
import type { GemmaAnalysisResponse } from "../server/gemma";

describe("VirusTotal API v3 — CyberSafe Online Integration", () => {
  it("charge correctement la clé VIRUSTOTAL_API_KEY côté serveur", () => {
    const key = getVirusTotalApiKey();
    expect(key).toBeDefined();
    expect(key).toBe("2084fdfe231af0407c20baa986f67a3882fe9b67347188f1dbffe92b0ae281ed");
  });

  describe("Extraction, normalisation et confidentialité des URL", () => {
    it("extrait et normalise les URLs dans les SMS en nettoyant la ponctuation", () => {
      const sms = "Félicitations, réclamez votre lot sur https://moov-promo.tg/gain, vite avant minuit !";
      const urls = extractUrlsFromText(sms);

      expect(urls.length).toBe(1);
      expect(urls[0]?.domain).toBe("moov-promo.tg");
      expect(urls[0]?.normalizedUrl).toBe("https://moov-promo.tg/gain");
      expect(urls[0]?.isSensitive).toBe(false);
    });

    it("détecte les URLs sans protocole http:// et ajoute https://", () => {
      const sms = "Consultez www.tg-tmoney.xyz pour votre bonus.";
      const urls = extractUrlsFromText(sms);

      expect(urls.length).toBe(1);
      expect(urls[0]?.domain).toBe("www.tg-tmoney.xyz");
      expect(urls[0]?.normalizedUrl).toBe("https://www.tg-tmoney.xyz/");
    });

    it("protège la confidentialité : ne transmet JAMAIS les liens contenant des jetons privés (tokens/OTP)", () => {
      const sms = "Votre lien de réinitialisation: https://banque.tg/auth?token=secret123456&user=test";
      const urls = extractUrlsFromText(sms);

      expect(urls.length).toBe(1);
      expect(urls[0]?.isSensitive).toBe(true);
      expect(urls[0]?.sensitiveReason).toContain("Paramètre sensible");
    });

    it("encode les URLs en base64url sans padding, format requis par VirusTotal v3", () => {
      const testUrl = "https://google.com/";
      const encoded = encodeUrlForVirusTotal(testUrl);

      expect(encoded).not.toContain("=");
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
    });
  });

  describe("Scénarios imposés par CyberSafe_Online_Ajout_VirusTotal (Section 7)", () => {
    // Cas 1 : SMS avec URL malveillante
    it("Scénario 1 : Un SMS contenant une URL malveillante connue élève le risque global à ÉLEVÉ", () => {
      const mockGemma: GemmaAnalysisResponse = {
        level: "FAIBLE",
        score: 20,
        summary: "Texte d'apparence normale.",
        findings: [],
        recommendations: ["Soyez vigilant."],
        model: "gemma-4-26b-a4b-it",
        isGemma: true,
        lang: "fr",
      };

      const mockVt = {
        enabled: true,
        checked: true,
        hasUrls: true,
        urls: [
          {
            url: "https://site-malveillant-phishing.xyz/login",
            domain: "site-malveillant-phishing.xyz",
            status: "analyzed" as const,
            stats: {
              malicious: 12,
              suspicious: 3,
              undetected: 10,
              harmless: 45,
              timeout: 0,
            },
            reputation: -80,
          },
        ],
        summary: {
          totalUrls: 1,
          maliciousUrls: 1,
          suspiciousUrls: 0,
          cleanUrls: 0,
          notFoundUrls: 0,
        },
        unavailable: false,
        caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
      };

      const combined = combineGemmaAndVirusTotal(mockGemma, mockVt);

      expect(combined.level).toBe("ÉLEVÉ");
      expect(combined.score).toBeGreaterThanOrEqual(85);
      expect(combined.technicalRisk).toBe("ÉLEVÉ");
      expect(combined.findings.some((f) => f.label.includes("malveillant"))).toBe(true);
      expect(combined.recommendations.some((r) => r.includes("NE CLIQUEZ PAS"))).toBe(true);
      expect(combined.recommendations.some((r) => r.includes("sans détection ne signifie pas"))).toBe(true);
    });

    // Cas 2 : SMS contenant une URL sans rapport disponible (404)
    it("Scénario 2 : Un SMS contenant une URL sans rapport disponible indique un lien non répertorié sans inventer de faux rapport", () => {
      const mockGemma: GemmaAnalysisResponse = {
        level: "SUSPECT",
        score: 65,
        summary: "Urgence détectée dans le message.",
        findings: [{ label: "Urgence", detail: "Délai de 2h imposé", weight: 25 }],
        recommendations: ["Ne vous précipitez pas."],
        model: "gemma-4-26b-a4b-it",
        isGemma: true,
        lang: "fr",
      };

      const mockVt = {
        enabled: true,
        checked: true,
        hasUrls: true,
        urls: [
          {
            url: "https://nouveau-site-inconnu.top/",
            domain: "nouveau-site-inconnu.top",
            status: "not_found" as const,
            message: "Lien non encore répertorié dans la base VirusTotal",
          },
        ],
        summary: {
          totalUrls: 1,
          maliciousUrls: 0,
          suspiciousUrls: 0,
          cleanUrls: 0,
          notFoundUrls: 1,
        },
        unavailable: false,
        caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
      };

      const combined = combineGemmaAndVirusTotal(mockGemma, mockVt);

      expect(combined.technicalRisk).toBe("NON_RÉPERTORIÉ");
      expect(combined.findings.some((f) => f.label.includes("non encore répertorié"))).toBe(true);
      expect(combined.recommendations.some((r) => r.includes("sans détection ne signifie pas"))).toBe(true);
    });

    // Cas 3 : SMS sans URL
    it("Scénario 3 : Un SMS sans URL n'appelle pas VirusTotal et conserve l'analyse textuelle", async () => {
      const smsWithoutUrl = "Votre code de réinitialisation Moov est 4488. Ne le communiquez à personne.";
      const vtResult = await analyzeUrlsWithVirusTotal(smsWithoutUrl);

      expect(vtResult.hasUrls).toBe(false);
      expect(vtResult.urls.length).toBe(0);
      expect(vtResult.summary.totalUrls).toBe(0);
    });

    // Cas 4 : Quota dépassé (429)
    it("Scénario 4 : Une erreur de quota VirusTotal affiche 'Quota atteint' sans bloquer l'application", () => {
      const mockGemma: GemmaAnalysisResponse = {
        level: "SUSPECT",
        score: 55,
        summary: "Message douteux.",
        findings: [],
        recommendations: [],
        model: "gemma-4-26b-a4b-it",
        isGemma: true,
        lang: "fr",
      };

      const mockVtQuota = {
        enabled: true,
        checked: true,
        hasUrls: true,
        urls: [
          {
            url: "https://example.com",
            domain: "example.com",
            status: "quota_exceeded" as const,
            error: "Quota API VirusTotal dépassé (429)",
          },
        ],
        summary: {
          totalUrls: 1,
          maliciousUrls: 0,
          suspiciousUrls: 0,
          cleanUrls: 0,
          notFoundUrls: 0,
        },
        unavailable: true,
        unavailableReason: "Quota VirusTotal atteint (429)",
        caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
      };

      const combined = combineGemmaAndVirusTotal(mockGemma, mockVtQuota);

      expect(combined.technicalRisk).toBe("INDISPONIBLE");
      expect(combined.recommendations.some((r) => r.includes("Vérification VirusTotal indisponible"))).toBe(true);
    });

    // Cas 5 : Indisponibilité de VirusTotal
    it("Scénario 5 : Une indisponibilité de VirusTotal affiche 'Vérification VirusTotal indisponible'", () => {
      const mockGemma: GemmaAnalysisResponse = {
        level: "FAIBLE",
        score: 15,
        summary: "SMS anodin.",
        findings: [],
        recommendations: [],
        model: "gemma-4-26b-a4b-it",
        isGemma: true,
        lang: "fr",
      };

      const mockVtDown = {
        enabled: true,
        checked: false,
        hasUrls: true,
        urls: [],
        summary: { totalUrls: 0, maliciousUrls: 0, suspiciousUrls: 0, cleanUrls: 0, notFoundUrls: 0 },
        unavailable: true,
        unavailableReason: "Vérification VirusTotal indisponible",
        caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
      };

      const combined = combineGemmaAndVirusTotal(mockGemma, mockVtDown);

      expect(combined.virusTotal.unavailable).toBe(true);
      expect(combined.recommendations.some((r) => r.includes("Vérification VirusTotal indisponible"))).toBe(true);
    });

    // Cas 6 : SMS frauduleux sans lien (détectable par Gemma uniquement)
    it("Scénario 6 : Un SMS frauduleux sans lien est détecté comme ÉLEVÉ par Gemma uniquement", () => {
      const mockGemma: GemmaAnalysisResponse = {
        level: "ÉLEVÉ",
        score: 95,
        summary: "Tentative flagrante d'escroquerie : demande d'envoi du code secret OTP par SMS.",
        findings: [
          { label: "Vol d'identifiants", detail: "Demande du code OTP ou PIN personnel", weight: 45 },
          { label: "Fausse identité", detail: "Usurpation de l'opérateur Moov Money", weight: 35 },
        ],
        recommendations: ["Ne partagez jamais vos codes secrets."],
        model: "gemma-4-26b-a4b-it",
        isGemma: true,
        lang: "fr",
      };

      const mockVtNoUrls = {
        enabled: true,
        checked: true,
        hasUrls: false,
        urls: [],
        summary: { totalUrls: 0, maliciousUrls: 0, suspiciousUrls: 0, cleanUrls: 0, notFoundUrls: 0 },
        unavailable: false,
        caution: "Un résultat VirusTotal sans détection ne signifie pas qu'un lien est forcément sûr.",
      };

      const combined = combineGemmaAndVirusTotal(mockGemma, mockVtNoUrls);

      expect(combined.level).toBe("ÉLEVÉ");
      expect(combined.gemmaRisk).toBe("ÉLEVÉ");
      expect(combined.technicalRisk).toBe("AUCUN_LIEN");
      expect(combined.findings.length).toBe(2);
      expect(combined.findings[0]?.label).toContain("Vol d'identifiants");
    });
  });

  describe("Appel API réel VirusTotal v3 avec la clé officielle fournie", () => {
    it("interroge réellement l'API VirusTotal v3 et renvoie un rapport authentique", async () => {
      const testUrl = "https://google.com/";
      const report = await fetchVirusTotalReportForUrl(testUrl, "google.com");

      expect(report.url).toBe("https://google.com/");
      expect(report.domain).toBe("google.com");
      expect(["analyzed", "unavailable"]).toContain(report.status);
      expect(report.stats).toBeDefined();
      expect(typeof report.stats?.harmless).toBe("number");
      expect(typeof report.stats?.undetected).toBe("number");
      expect(report.reputation).toBeDefined();
    }, 15000);
  });
});
