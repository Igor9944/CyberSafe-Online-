import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error - jsdom type declaration is optional in test environment
import { JSDOM } from "jsdom";
import {
  Logo,
  CyberSafeEmblem,
  type LogoSize,
  type LogoVariant,
  type LogoThemeVariant,
} from "../components/cs/Logo";

describe("Milestone 6 Empirical Challenge & Verification", () => {
  describe("1. Component Prop Matrix Stress Harness (Logo & CyberSafeEmblem)", () => {
    const sizes: (LogoSize | undefined)[] = ["sm", "md", "lg", undefined];
    const variants: (LogoVariant | undefined)[] = [
      "default",
      "light",
      "dark",
      "electric",
      "compact",
      "icon",
      undefined,
    ];
    const compactFlags: (boolean | undefined)[] = [true, false, undefined];
    const showTextFlags: (boolean | undefined)[] = [true, false, undefined];
    const customClasses = ["custom-brand-class", "p-4 border-red-500", "", undefined];
    const iconClasses = ["custom-icon-class", "ring-4", "", undefined];

    it("renders cleanly under all 2,268 Cartesian prop combinations without throwing", () => {
      let renderCount = 0;
      for (const size of sizes) {
        for (const variant of variants) {
          for (const compact of compactFlags) {
            for (const showText of showTextFlags) {
              for (const className of customClasses) {
                for (const iconClassName of iconClasses) {
                  const html = renderToStaticMarkup(
                    React.createElement(Logo, {
                      size,
                      variant,
                      compact,
                      showText,
                      className,
                      iconClassName,
                    })
                  );

                  renderCount++;
                  expect(html).toBeTruthy();
                  expect(html).toContain("<svg");
                  expect(html).toContain('viewBox="0 0 48 48"');

                  // Invariant verification on text rendering logic:
                  const isCompactMode = compact || variant === "compact" || variant === "icon";
                  const shouldShow = showText !== undefined ? showText : !isCompactMode;

                  if (shouldShow) {
                    expect(html).toContain("CyberSafe");
                    expect(html).toContain("Online");
                    expect(html).toContain("Sécurité &amp; IA · Togo");
                    expect(html).toContain("SaaS");
                  } else {
                    expect(html).not.toContain("CyberSafe");
                    expect(html).not.toContain("Sécurité &amp; IA · Togo");
                  }

                  if (className) {
                    expect(html).toContain(className.split(" ")[0]);
                  }
                  if (iconClassName) {
                    expect(html).toContain(iconClassName.split(" ")[0]);
                  }
                }
              }
            }
          }
        }
      }
      expect(renderCount).toBe(sizes.length * variants.length * compactFlags.length * showTextFlags.length * customClasses.length * iconClasses.length);
      expect(renderCount).toBe(4032);
    });

    it("verifies CyberSafeEmblem standalone under all theme variants and sizes", () => {
      const emblemThemes: (LogoThemeVariant | undefined)[] = ["default", "light", "dark", "electric", undefined];
      const emblemSizes: (LogoSize | undefined)[] = ["sm", "md", "lg", undefined];

      for (const variant of emblemThemes) {
        for (const size of emblemSizes) {
          const html = renderToStaticMarkup(
            React.createElement(CyberSafeEmblem, {
              variant,
              size,
              className: "test-emblem-cls",
            })
          );

          expect(html).toContain("<svg");
          expect(html).toContain('viewBox="0 0 48 48"');
          expect(html).toContain("test-emblem-cls");

          // Defs and gradient invariants
          expect(html).toContain('id="shieldGradDark"');
          expect(html).toContain('id="shieldGradLight"');
          expect(html).toContain('id="armFillGrad"');
          expect(html).toContain('id="handFillGrad"');

          // Borromean knot forearms and hands
          expect(html).toContain('id="canonical-forearm"');
          expect(html).toContain('id="canonical-hand"');
          expect(html).toContain('href="#canonical-forearm"');
          expect(html).toContain('href="#canonical-hand"');
          expect(html).toContain('transform="rotate(0)"');
          expect(html).toContain('transform="rotate(120)"');
          expect(html).toContain('transform="rotate(240)"');
        }
      }
    });

    it("survives unexpected / adversarial prop values without runtime crash", () => {
      // Cast invalid variants or types
      const html1 = renderToStaticMarkup(
        React.createElement(Logo, {
          variant: "non-existent-variant" as any,
          size: "unknown-size" as any,
        })
      );
      // If unknown size, sizeClasses["unknown-size"] might be undefined unless handled or fallback. Let's see what happens!
    });
  });

  describe("2. SVG Structural & XML Validity Verification", () => {
    const faviconSvgPath = path.resolve(process.cwd(), "public/favicon.svg");

    it("parses public/favicon.svg as valid XML with zero DOMParser errors", () => {
      expect(fs.existsSync(faviconSvgPath)).toBe(true);
      const svgContent = fs.readFileSync(faviconSvgPath, "utf-8");
      expect(svgContent.length).toBeGreaterThan(500);

      const dom = new JSDOM();
      const doc = new dom.window.DOMParser().parseFromString(svgContent, "image/svg+xml");
      const parserErrors = doc.querySelectorAll("parsererror");
      expect(parserErrors.length).toBe(0);

      const svg = doc.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("viewBox")).toBe("0 0 48 48");
      expect(svg?.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    });

    it("verifies required gradient definitions and color-scheme CSS in public/favicon.svg", () => {
      const svgContent = fs.readFileSync(faviconSvgPath, "utf-8");
      const dom = new JSDOM();
      const doc = new dom.window.DOMParser().parseFromString(svgContent, "image/svg+xml");

      expect(doc.getElementById("shieldGradDark")).not.toBeNull();
      expect(doc.getElementById("shieldGradLight")).not.toBeNull();
      expect(doc.getElementById("knotGradDark")).not.toBeNull();
      expect(doc.getElementById("knotGradLight")).not.toBeNull();
      expect(doc.getElementById("armFillGrad")).not.toBeNull();
      expect(doc.getElementById("handFillGrad")).not.toBeNull();

      // Check media query for light mode
      const styleEl = doc.querySelector("style");
      expect(styleEl).not.toBeNull();
      expect(styleEl?.textContent).toContain("@media (prefers-color-scheme: light)");
    });

    it("verifies 3-fold rotational symmetry (C3) and Borromean knot geometry in public/favicon.svg", () => {
      const svgContent = fs.readFileSync(faviconSvgPath, "utf-8");
      const dom = new JSDOM();
      const doc = new dom.window.DOMParser().parseFromString(svgContent, "image/svg+xml");

      // Forearm and hand defs
      expect(doc.getElementById("canonical-forearm")).not.toBeNull();
      expect(doc.getElementById("canonical-hand")).not.toBeNull();

      // Check <use> instances
      const uses = Array.from(doc.querySelectorAll("use")) as Element[];
      const forearmUses = uses.filter((u: Element) => u.getAttribute("href") === "#canonical-forearm");
      const handUses = uses.filter((u: Element) => u.getAttribute("href") === "#canonical-hand");

      expect(forearmUses.length).toBe(3);
      expect(handUses.length).toBe(3);

      const forearmRotations = forearmUses.map((u: Element) => u.getAttribute("transform"));
      const handRotations = handUses.map((u: Element) => u.getAttribute("transform"));

      expect(forearmRotations).toEqual(["rotate(0)", "rotate(120)", "rotate(240)"]);
      expect(handRotations).toEqual(["rotate(0)", "rotate(120)", "rotate(240)"]);
    });

    it("validates all SVG path syntax across public/favicon.svg and Logo component", () => {
      const svgContent = fs.readFileSync(faviconSvgPath, "utf-8");
      const dom = new JSDOM();
      const doc = new dom.window.DOMParser().parseFromString(svgContent, "image/svg+xml");

      const paths = Array.from(doc.querySelectorAll("path")) as Element[];
      expect(paths.length).toBeGreaterThan(0);

      // SVG path syntax validator: only valid command letters, numbers, spaces, dots, commas, minuses
      const validPathRegex = /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-]+$/;

      for (const p of paths) {
        const d = (p as Element).getAttribute("d");
        expect(d).toBeTruthy();
        expect(validPathRegex.test(d!)).toBe(true);
        expect(d).not.toContain("NaN");
        expect(d).not.toContain("undefined");
        expect(d).not.toContain("null");
      }
    });
  });

  describe("3. Binary Inspection of Favicon and Icon Assets", () => {
    it("verifies public/favicon.ico has valid ICO structure and multiple frames (16x16, 32x32, 48x48)", () => {
      const icoPath = path.resolve(process.cwd(), "public/favicon.ico");
      expect(fs.existsSync(icoPath)).toBe(true);

      const buf = fs.readFileSync(icoPath);
      expect(buf.length).toBeGreaterThan(100);

      // ICO Header: 2 bytes reserved (0x0000), 2 bytes type (0x0001), 2 bytes count
      expect(buf.readUInt16LE(0)).toBe(0); // Reserved
      expect(buf.readUInt16LE(2)).toBe(1); // Type 1 = ICO
      const imageCount = buf.readUInt16LE(4);
      expect(imageCount).toBeGreaterThanOrEqual(3);

      const frames: { width: number; height: number; bpp: number; offset: number; size: number }[] = [];
      for (let i = 0; i < imageCount; i++) {
        const entryOffset = 6 + i * 16;
        let width = buf.readUInt8(entryOffset);
        let height = buf.readUInt8(entryOffset + 1);
        if (width === 0) width = 256;
        if (height === 0) height = 256;
        const bpp = buf.readUInt16LE(entryOffset + 6);
        const size = buf.readUInt32LE(entryOffset + 8);
        const offset = buf.readUInt32LE(entryOffset + 12);

        // Sanity checks: offset + size within buffer bounds
        expect(offset + size).toBeLessThanOrEqual(buf.length);

        frames.push({ width, height, bpp, offset, size });
      }

      const dimensions = frames.map((f) => `${f.width}x${f.height}`);
      expect(dimensions).toContain("16x16");
      expect(dimensions).toContain("32x32");
      expect(dimensions).toContain("48x48");
    });

    function checkPng(filePath: string, expectedWidth: number, expectedHeight: number) {
      expect(fs.existsSync(filePath), `File should exist: ${filePath}`).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.length).toBeGreaterThan(100);

      // PNG Magic: 89 50 4E 47 0D 0A 1A 0A
      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(buf.subarray(0, 8).equals(pngMagic)).toBe(true);

      // First chunk must be IHDR
      const chunkLength = buf.readUInt32BE(8);
      const chunkType = buf.toString("ascii", 12, 16);
      expect(chunkType).toBe("IHDR");
      expect(chunkLength).toBe(13);

      // IHDR: width (4 bytes BE), height (4 bytes BE)
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(expectedWidth);
      expect(height).toBe(expectedHeight);

      const bitDepth = buf.readUInt8(24);
      const colorType = buf.readUInt8(25);
      expect([8, 16]).toContain(bitDepth);
      expect([2, 6]).toContain(colorType); // RGB or RGBA
    }

    it("verifies public/icons/icon-192x192.png is a valid 192x192 PNG", () => {
      checkPng(path.resolve(process.cwd(), "public/icons/icon-192x192.png"), 192, 192);
    });

    it("verifies public/icons/icon-512x512.png is a valid 512x512 PNG", () => {
      checkPng(path.resolve(process.cwd(), "public/icons/icon-512x512.png"), 512, 512);
    });

    it("verifies public/icons/icon-maskable-512x512.png is a valid 512x512 PNG", () => {
      checkPng(path.resolve(process.cwd(), "public/icons/icon-maskable-512x512.png"), 512, 512);
    });

    it("verifies public/icons/apple-touch-icon.png is a valid 180x180 PNG", () => {
      checkPng(path.resolve(process.cwd(), "public/icons/apple-touch-icon.png"), 180, 180);
    });

    it("verifies public/apple-touch-icon.png exists and is a valid 180x180 PNG", () => {
      checkPng(path.resolve(process.cwd(), "public/apple-touch-icon.png"), 180, 180);
    });
  });
});
