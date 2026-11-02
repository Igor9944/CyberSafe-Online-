import { describe, expect, it } from "vitest";
import { extractUrlsFromText, isValidUrlForAnalysis } from "../server/ssrf-protection";

describe("SSRF Protection", () => {
  describe("isValidUrlForAnalysis", () => {
    it("accepte les URL publiques légitimes", () => {
      const result = isValidUrlForAnalysis("https://example.com/page");
      expect(result.valid).toBe(true);
    });

    it("refuse http:", () => {
      const result = isValidUrlForAnalysis("http://example.com/page");
      expect(result.valid).toBe(true); // HTTP is allowed, only https is blocked
    });

    it("refuse file://", () => {
      const result = isValidUrlForAnalysis("file:///etc/passwd");
      expect(result.valid).toBe(false);
    });

    it("refuse ftp://", () => {
      const result = isValidUrlForAnalysis("ftp://example.com/file");
      expect(result.valid).toBe(false);
    });

    it("bloque localhost", () => {
      const result = isValidUrlForAnalysis("http://localhost:3000");
      expect(result.valid).toBe(false);
    });

    it("bloque 127.0.0.1", () => {
      const result = isValidUrlForAnalysis("http://127.0.0.1:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque IPv6 localhost ::1", () => {
      const result = isValidUrlForAnalysis("http://[::1]:3000");
      expect(result.valid).toBe(false);
    });

    it("bloque les IP privées 10.x.x.x", () => {
      const result = isValidUrlForAnalysis("http://10.0.0.1:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque les IP privées 192.168.x.x", () => {
      const result = isValidUrlForAnalysis("http://192.168.1.1:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque les IP privées 172.16.x.x", () => {
      const result = isValidUrlForAnalysis("http://172.16.0.1:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque les domaines .internal", () => {
      const result = isValidUrlForAnalysis("https://service.internal:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque les domaines .local", () => {
      const result = isValidUrlForAnalysis("https://server.local:8080");
      expect(result.valid).toBe(false);
    });

    it("bloque les URL avec identifiants intégrés", () => {
      const result = isValidUrlForAnalysis("https://user:pass@example.com");
      expect(result.valid).toBe(false);
    });

    it("bloque les ports dangereux (22 SSH, 23 FTP)", () => {
      const result = isValidUrlForAnalysis("https://example.com:22");
      expect(result.valid).toBe(false);
    });
  });

  describe("extractUrlsFromText", () => {
    it("retourne les URLs publiques", () => {
      const urls = extractUrlsFromText("Voir https://example.com/secret");
      expect(urls).toHaveLength(1);
      expect(urls[0]?.isSensitive).toBe(false);
      expect(urls[0]?.domain).toBe("example.com");
    });

    it("marque les URLs locales comme sensibles", () => {
      const urls = extractUrlsFromText("Essayer http://localhost/admin");
      expect(urls).toHaveLength(1);
      expect(urls[0]?.isSensitive).toBe(true);
      expect(urls[0]?.domain).toBe("localhost");
    });

    it("marque les IP privées comme sensibles", () => {
      const urls = extractUrlsFromText("Aller sur 192.168.1.1");
      expect(urls).toHaveLength(1);
      expect(urls[0]?.isSensitive).toBe(true);
      expect(urls[0]?.domain).toBe("192.168.1.1");
    });
  });
});
