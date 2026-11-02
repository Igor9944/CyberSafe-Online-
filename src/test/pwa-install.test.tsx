import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { PwaInstallButton } from "../components/cs/PwaInstallButton";

describe("PWA (Progressive Web App) Specification & Asset Verification", () => {
  const rootDir = process.cwd();

  describe("1. Manifest Configuration (public/manifest.webmanifest)", () => {
    const manifestPath = path.join(rootDir, "public/manifest.webmanifest");

    it("verifies manifest file exists and is valid JSON", () => {
      expect(fs.existsSync(manifestPath), "manifest.webmanifest must exist").toBe(true);
      const content = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(content);
      expect(manifest).toBeTypeOf("object");
    });

    it("verifies required PWA manifest fields for installability (YouTube / Web App standard)", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      expect(manifest.name).toContain("CyberSafe Online");
      expect(manifest.short_name).toBe("CyberSafe");
      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.background_color).toBe("#020617");
      expect(manifest.theme_color).toBe("#0a1024");
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      const sizes = manifest.icons.map((i: any) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");

      const maskable = manifest.icons.find((i: any) => i.purpose === "maskable");
      expect(maskable, "A maskable icon is required for modern Android/Chrome PWA").toBeDefined();
    });

    it("verifies shortcut actions in manifest for quick navigation", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      const urls = manifest.shortcuts.map((s: any) => s.url);
      expect(urls).toContain("/sms");
      expect(urls).toContain("/assistant");
      expect(urls).toContain("/qr");
      expect(urls).toContain("/apprendre");
    });
  });

  describe("2. Service Worker (public/sw.js)", () => {
    const swPath = path.join(rootDir, "public/sw.js");

    it("verifies public/sw.js exists with cache-first and navigation strategies", () => {
      expect(fs.existsSync(swPath), "sw.js must exist").toBe(true);
      const swCode = fs.readFileSync(swPath, "utf-8");

      expect(swCode).toContain("addEventListener('install'");
      expect(swCode).toContain("addEventListener('activate'");
      expect(swCode).toContain("addEventListener('fetch'");
      expect(swCode).toContain("caches.open");
      expect(swCode).toContain("PRECACHE_URLS");
      expect(swCode).toContain("/manifest.webmanifest");
    });
  });

  describe("3. HTML Head & Service Worker Registration (__root.tsx)", () => {
    it("verifies __root.tsx references manifest and theme-color", () => {
      const rootPath = path.join(rootDir, "src/routes/__root.tsx");
      const rootCode = fs.readFileSync(rootPath, "utf-8");

      expect(rootCode).toContain('rel: "manifest"');
      expect(rootCode).toContain("/manifest.webmanifest");
      expect(rootCode).toContain('name: "theme-color"');
      expect(rootCode).toContain("serviceWorker.register");
    });
  });

  describe("4. PwaInstallButton Component", () => {
    it("renders header, button, card, and mobile-bar variants without error", () => {
      const headerHtml = renderToStaticMarkup(
        React.createElement(PwaInstallButton, { variant: "header" }),
      );
      expect(headerHtml).toContain("Installer");

      const buttonHtml = renderToStaticMarkup(
        React.createElement(PwaInstallButton, { variant: "button" }),
      );
      expect(buttonHtml).toContain("Installer CyberSafe");

      const cardHtml = renderToStaticMarkup(
        React.createElement(PwaInstallButton, { variant: "card" }),
      );
      expect(cardHtml).toMatch(/Installer l(&#x27;|')application/);

      const compactCardHtml = renderToStaticMarkup(
        React.createElement(PwaInstallButton, { variant: "card", compact: true }),
      );
      expect(compactCardHtml).toContain("Accès rapide depuis l’écran d’accueil.");
      expect(compactCardHtml).not.toContain("hors-ligne");
      expect(compactCardHtml).toContain("min-h-10");

      const mobileBarHtml = renderToStaticMarkup(
        React.createElement(PwaInstallButton, { variant: "mobile-bar" }),
      );
      expect(mobileBarHtml).toContain("<button");
    });
  });
});
