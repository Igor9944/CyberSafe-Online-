import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const srcDir = path.resolve(__dirname, "..");
const qrSource = readFileSync(path.join(srcDir, "routes/qr.tsx"), "utf8");

describe("QR camera capture", () => {
  it("offers a rear-camera photo capture while keeping image upload available", () => {
    expect(qrSource).toContain('capture="environment"');
    expect(qrSource).toContain('t("qr.takePhoto")');
    expect(qrSource).toContain("ref={inputRef}");
    expect(qrSource).toContain("ref={cameraInputRef}");
  });

  it("provides the camera action in every supported language", () => {
    for (const locale of ["fr", "en", "ee"]) {
      const translations = JSON.parse(
        readFileSync(path.join(srcDir, "locales", `${locale}.json`), "utf8"),
      ) as { qr: { takePhoto?: string } };

      expect(translations.qr.takePhoto).toBeTruthy();
    }
  });
});
