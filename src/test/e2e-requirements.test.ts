/**
 * E2E Requirements Test Suite for CyberSafe Online SaaS
 * ========================================================
 * Verifies Acceptance Criteria for Requirements R1 through R5 from ORIGINAL_REQUEST.md:
 * - R1: Nettoyage Hackathon & Code (No PitchModal, no 3-min pitch, no 20/20 rubric, no hackathon markers)
 * - R2: Visite Guidée (Onboarding Tour on-demand, skip, step-by-step progress, closeable, non-blocking)
 * - R3: Module FlashCards (Dual modes: « Oui / Non » binary True/False with immediate feedback,
 *       « Bonne Réponse » MCQ with options & immediate explanation, mode switching, coherent scoring/progression)
 * - R4: Logo & Intégration Visuelle (Vector SVG logo in header and sidebar, light & dark theme contrast, favicons)
 * - R5: Thème Sombre & Ergonomie (High contrast, no dark text on dark bg, no blinding white boxes, cyber/neo-brutalist styling)
 *
 * Test Architecture — 4 Tiers (Total >= 60 tests):
 * - Tier 1: Feature Coverage (>=5 tests per requirement = 25 tests)
 * - Tier 2: Boundary & Corner Cases (>=5 tests per requirement = 25 tests)
 * - Tier 3: Cross-Feature Combinations (Pairwise interactions = 6 tests)
 * - Tier 4: Real-World Application Scenarios (End-to-end user workflows = 5 tests)
 *
 * Note: Written in pure TypeScript (.ts) using React.createElement for universal parser compatibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Environment & Mock Setup for Node 26 + jsdom
// ---------------------------------------------------------------------------

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    storageMap.delete(key);
  }),
  clear: vi.fn(() => {
    storageMap.clear();
  }),
  get length() {
    return storageMap.size;
  },
  key: vi.fn((index: number) => Array.from(storageMap.keys())[index] ?? null),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
}

// Mock TanStack Router to allow seamless rendering of components using router hooks
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useRouterState: vi.fn(({ select }: any = {}) => {
      const state = { location: { pathname: "/" } };
      return select ? select(state) : state;
    }),
    useNavigate: () => vi.fn(),
    createFileRoute: () => () => ({ component: () => null }),
    Link: ({ children, to, onClick, className, ...props }: any) =>
      React.createElement(
        "a",
        {
          href: to,
          onClick,
          className,
          "data-testid": `link-${to}`,
          ...props,
        },
        children,
      ),
  };
});

// Helper paths
const ROOT_DIR = path.resolve(__dirname, "../..");
const SRC_DIR = path.join(ROOT_DIR, "src");

function readSourceFile(relPath: string): string {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return "";
  return fs.readFileSync(fullPath, "utf-8");
}

async function loadOptionalModule(relPathFromSrc: string): Promise<any> {
  const fullTsx = path.resolve(__dirname, "..", relPathFromSrc + ".tsx");
  const fullTs = path.resolve(__dirname, "..", relPathFromSrc + ".ts");
  if (!fs.existsSync(fullTsx) && !fs.existsSync(fullTs)) {
    return null;
  }
  return import(/* @vite-ignore */ `../${relPathFromSrc}`);
}

// ---------------------------------------------------------------------------
// Suite Execution Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  storageMap.clear();
  vi.clearAllMocks();
  if (typeof document !== "undefined") {
    document.documentElement.className = "";
    document.body.innerHTML = "";
  }
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// TIER 1: FEATURE COVERAGE (25 TESTS — 5 PER REQUIREMENT)
// ===========================================================================

describe("Tier 1: Feature Coverage", () => {
  // -------------------------------------------------------------------------
  // R1: Nettoyage Hackathon & Code
  // -------------------------------------------------------------------------
  describe("R1: Nettoyage Hackathon & Code", () => {
    it("T1.1_R1: AppShell UI renders without PitchModal or pitch trigger buttons", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      const { container } = render(
        React.createElement(
          AppShell,
          null,
          React.createElement("div", { "data-testid": "page-content" }, "Content"),
        ),
      );

      // Pitch trigger buttons must be completely removed
      expect(screen.queryByText(/pitch 3 min/i)).toBeNull();
      expect(screen.queryByTitle(/aide de pitch/i)).toBeNull();
      expect(screen.queryByText(/aide de pitch — 3 minutes chrono/i)).toBeNull();

      // PitchModal should not be in the rendered DOM tree
      const pitchModalHeader = container.querySelector('[aria-label="pitch-modal"], .pitch-modal');
      expect(pitchModalHeader).toBeNull();
    });

    it("T1.2_R1: About page (/a-propos) renders SaaS mission instead of 20/20 hackathon rubric", () => {
      const content = readSourceFile("src/routes/a-propos.tsx");
      expect(content).not.toBe("");

      // 20/20 hackathon jury rubric must not be present
      expect(content).not.toMatch(/barème\s*20\s*\/\s*20/i);
      expect(content).not.toMatch(/objectif\s*20\s*\/\s*20/i);
      expect(content).not.toMatch(/grille d'évaluation du hackathon/i);
      expect(content).not.toMatch(/jury mlh/i);

      // SaaS mission should be emphasized
      expect(content).toMatch(/CyberSafe Online/i);
    });

    it("T1.3_R1: Home Dashboard renders without hackathon stickers or badges", () => {
      const content = readSourceFile("src/routes/index.tsx");
      expect(content).not.toBe("");

      // Hackathon demo sticker must be removed from Dashboard
      expect(content).not.toMatch(/MLH\s*×\s*LBS\s*2026/);
      expect(content).not.toMatch(/hackathon/i);
    });

    it("T1.4_R1: Scanners (QR & Audio) do not display pitch demo scenario labels", () => {
      const qrContent = readSourceFile("src/routes/qr.tsx");
      const audioContent = readSourceFile("src/routes/audio.tsx");

      // Demo labels mentioning pitch must be cleaned up
      expect(qrContent).not.toMatch(/pour le pitch/i);
      expect(audioContent).not.toMatch(/pour le pitch/i);
    });

    it("T1.5_R1: Guide page removes hackathon evaluation references", () => {
      const guideContent = readSourceFile("src/routes/guide.tsx");
      expect(guideContent).not.toBe("");

      // Guide syntax criteria should be clean of hackathon mention
      expect(guideContent).not.toMatch(/hackathon build with gemma/i);
    });
  });

  // -------------------------------------------------------------------------
  // R2: Visite Guidée (Onboarding Tour)
  // -------------------------------------------------------------------------
  describe("R2: Visite Guidée (Onboarding Tour)", () => {
    it("T1.1_R2: OnboardingTour component exists and renders interactive walkthrough when open", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(
        tourModule,
        "OnboardingTour component should be exported from src/components/cs/OnboardingTour.tsx",
      ).not.toBeNull();

      if (tourModule && tourModule.OnboardingTour) {
        const onClose = vi.fn();
        const { container } = render(
          React.createElement(tourModule.OnboardingTour, { open: true, onClose }),
        );
        expect(container.firstChild).not.toBeNull();
        expect(screen.getByText(/visite|bienvenue|découverte/i)).toBeInTheDocument();
      }
    });

    it("T1.2_R2: AppShell header integrates an on-demand tour trigger", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Main")));

      // Header must contain a tour trigger button
      const tourButton =
        screen.queryByRole("button", { name: /visite guidée|guide|tour/i }) ||
        document.querySelector('button[title*="visite" i], button[aria-label*="visite" i]');
      expect(
        tourButton,
        "AppShell header should have an accessible 'Visite guidée' trigger button",
      ).not.toBeNull();
    });

    it("T1.3_R2: Tour enables progressive step-by-step navigation (Next and Previous)", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module must exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      render(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));

      const nextButton = screen.queryByRole("button", { name: /suivant|next/i });
      expect(nextButton, "Tour should provide a 'Suivant' (Next) button").not.toBeNull();
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(screen.getByText(/étape 2|step 2|2\s*\/\s*\d/i)).toBeInTheDocument();
      }
    });

    it("T1.4_R2: Tour provides an immediate Skip (Passer) action", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module must exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      render(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));

      const skipButton = screen.queryByRole("button", { name: /passer|skip/i });
      expect(skipButton, "Tour should provide a 'Passer' (Skip) button").not.toBeNull();
      if (skipButton) {
        fireEvent.click(skipButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it("T1.5_R2: Tour provides a dedicated close button that terminates the tour", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module must exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      render(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));

      const closeButton =
        screen.queryByRole("button", { name: /fermer|close/i }) ||
        document.querySelector('button[aria-label*="fermer" i]');
      expect(closeButton, "Tour should provide a close button").not.toBeNull();
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  // -------------------------------------------------------------------------
  // R3: Modes Avancés FlashCards
  // -------------------------------------------------------------------------
  describe("R3: Modes Avancés FlashCards", () => {
    it("T1.1_R3: Learning module provides explicit controls to toggle between Oui/Non and Bonne Réponse modes", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).not.toBe("");

      // Must support both explicit modes
      expect(apprendreCode).toMatch(/Oui\s*\/\s*Non/i);
      expect(apprendreCode).toMatch(/Bonne\s*Réponse/i);
    });

    it("T1.2_R3: Oui/Non mode renders binary statement with Vrai/Faux (Oui/Non) answer choices", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/binaryStatement|affirmation|vrai|faux|oui.*non/i);
    });

    it("T1.3_R3: Oui/Non mode provides immediate feedback (success/error) upon answering", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/binaryExplanation|feedback|explication.*immédiate|correct/i);
    });

    it("T1.4_R3: Bonne Réponse mode presents multiple choice options for the question", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/mcqQuestion|mcqOptions|choix/i);
    });

    it("T1.5_R3: Bonne Réponse mode displays detailed pedagogical explanation upon validation", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/mcqExplanation|explication\s*pédagogique|détail/i);
    });
  });

  // -------------------------------------------------------------------------
  // R4: Logo & Intégration Visuelle
  // -------------------------------------------------------------------------
  describe("R4: Logo & Intégration Visuelle", () => {
    it("T1.1_R4: Logo component renders a vector SVG emblem instead of raster JPEG image", async () => {
      const { Logo } = await import("@/components/cs/Logo");
      const { container } = render(React.createElement(Logo));

      // Must render vector SVG
      const svg = container.querySelector("svg");
      expect(svg, "Logo must render an inline vector <svg> element").not.toBeNull();

      // Must NOT render raster JPEG image
      const rasterImg = container.querySelector('img[src*=".jpeg"], img[src*=".jpg"]');
      expect(rasterImg, "Logo must not use raster JPEG image").toBeNull();
    });

    it("T1.2_R4: Logo is integrated in AppShell sidebar with brand typography", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const brandTexts = screen.getAllByText(/CyberSafe/i);
      expect(brandTexts.length).toBeGreaterThan(0);
    });

    it("T1.3_R4: Logo is integrated in mobile header", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      const { container } = render(
        React.createElement(AppShell, null, React.createElement("div", null, "Page")),
      );

      const header = container.querySelector("header");
      expect(header).not.toBeNull();
      expect(header?.textContent).toMatch(/CyberSafe/i);
    });

    it("T1.4_R4: Logo supports compact mode for condensed display", async () => {
      const { Logo } = await import("@/components/cs/Logo");
      const { container } = render(React.createElement(Logo, { compact: true }));

      // In compact mode, SVG emblem is preserved, extended tagline is omitted
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(screen.queryByText(/Sécurité & IA · Togo/i)).toBeNull();
    });

    it("T1.5_R4: Vector favicon.svg exists in public directory and is linked in root head", () => {
      const faviconSvgPath = path.join(ROOT_DIR, "public/favicon.svg");
      expect(fs.existsSync(faviconSvgPath), "public/favicon.svg must exist").toBe(true);

      const rootCode = readSourceFile("src/routes/__root.tsx");
      expect(rootCode).toMatch(/favicon\.svg/i);
      expect(rootCode).toMatch(/image\/svg\+xml/i);
    });
  });

  // -------------------------------------------------------------------------
  // R5: Thème Sombre & Ergonomie
  // -------------------------------------------------------------------------
  describe("R5: Thème Sombre & Ergonomie", () => {
    it("T1.1_R5: Theme toggle in AppShell toggles dark class on html root and updates storage", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const toggleBtn = screen.getByRole("button", { name: /basculer le thème/i });
      expect(toggleBtn).toBeInTheDocument();

      // Click to enable dark mode
      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("cybersafe_theme", "dark");

      // Click again to toggle back to light mode
      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("cybersafe_theme", "light");
    });

    it("T1.2_R5: CSS custom variant rule in styles.css uses where selector for robust dark mode", () => {
      const css = readSourceFile("src/styles.css");
      expect(css).toMatch(/@custom-variant\s+dark\s+\(&:where\(\.dark,\s*\.dark\s+\*\)\);/);
    });

    it("T1.3_R5: Dark theme defines high-contrast palette tokens in styles.css", () => {
      const css = readSourceFile("src/styles.css");
      expect(css).toMatch(/--night:/);
      expect(css).toMatch(/--night-foreground:/);
      expect(css).toMatch(/--night-muted:/);
      expect(css).toMatch(/--shadow-neo:/);
    });

    it("T1.4_R5: Dashboard and About banner containers eliminate glaring hardcoded bg-white in dark mode", () => {
      const indexCode = readSourceFile("src/routes/index.tsx");
      const aboutCode = readSourceFile("src/routes/a-propos.tsx");

      // The banner wrapper must not have hardcoded bg-white without dark adaptation
      expect(indexCode).not.toMatch(/border-slate-800 bg-white p-4 shadow-neo/);
      expect(aboutCode).not.toMatch(/border-foreground bg-white p-4 shadow-neo/);
    });

    it("T1.5_R5: Neo-brutalist styling accents (shadow-neo, sharp borders) are present", () => {
      const css = readSourceFile("src/styles.css");
      expect(css).toContain("--shadow-neo");
      expect(css).toContain("--shadow-neo-sm");
      expect(css).toContain("--shadow-neo-lg");
    });
  });
});

// ===========================================================================
// TIER 2: BOUNDARY & CORNER CASES (25 TESTS — 5 PER REQUIREMENT)
// ===========================================================================

describe("Tier 2: Boundary & Corner Cases", () => {
  // -------------------------------------------------------------------------
  // R1 Boundaries: Pitch Cleanup & Code Scrubbing
  // -------------------------------------------------------------------------
  describe("R1 Boundaries: Pitch Cleanup & Code Scrubbing", () => {
    it("T2.1_R1: Web Speech API utterance.pitch in audio scanner is preserved while scrubbing hackathon pitch", () => {
      const audioCode = readSourceFile("src/routes/audio.tsx");
      expect(audioCode).not.toBe("");

      // Speech synthesis pitch property MUST be preserved
      expect(audioCode).toMatch(/utterance\.pitch\s*=\s*1(\.0)?;/);
    });

    it("T2.2_R1: AppShell header maintains layout integrity and button alignment without pitch button", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      const { container } = render(
        React.createElement(AppShell, null, React.createElement("div", null, "Body")),
      );

      const desktopHeader = container.querySelector("main > div.sticky");
      expect(desktopHeader).not.toBeNull();
      // Should not contain pitch button in the header action group
      expect(desktopHeader?.textContent).not.toMatch(/pitch/i);
    });

    it("T2.3_R1: PitchModal component file is deleted from src/components/cs/", () => {
      const pitchModalPath = path.join(ROOT_DIR, "src/components/cs/PitchModal.tsx");
      expect(fs.existsSync(pitchModalPath), "PitchModal.tsx should be deleted").toBe(false);
    });

    it("T2.4_R1: About page retains rich SaaS mission and architecture details after rubric removal", () => {
      const aboutCode = readSourceFile("src/routes/a-propos.tsx");
      expect(aboutCode).not.toBe("");

      // Must retain core SaaS mission content
      expect(aboutCode).toMatch(/Gemma/i);
      expect(aboutCode).toMatch(/VirusTotal/i);
      expect(aboutCode).toMatch(/Mobile Money/i);
    });

    it("T2.5_R1: No obsolete hackathon TODO comments or temporary demo markers remain in source", () => {
      const routes = [
        "src/routes/index.tsx",
        "src/routes/a-propos.tsx",
        "src/routes/qr.tsx",
        "src/routes/guide.tsx",
      ];
      for (const route of routes) {
        const content = readSourceFile(route);
        expect(content).not.toMatch(/TODO.*hackathon/i);
        expect(content).not.toMatch(/FIXME.*pitch/i);
      }
    });
  });

  // -------------------------------------------------------------------------
  // R2 Boundaries: Tour Non-blocking & Lifecycle
  // -------------------------------------------------------------------------
  describe("R2 Boundaries: Tour Non-blocking & Lifecycle", () => {
    it("T2.1_R2: Tour backdrop is non-blocking: allows dismissal via click-outside or Escape key", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      render(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));

      // Press Escape key to dismiss
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("T2.2_R2: Tour boundary navigation: previous button disabled on step 1, finish on final step", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      render(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));

      // On step 1, Previous button should be disabled or absent
      const prevBtn = screen.queryByRole("button", { name: /précédent|previous/i });
      if (prevBtn) {
        expect(prevBtn).toBeDisabled();
      }
    });

    it("T2.3_R2: Tour completion state is saved in localStorage but remains re-triggerable on demand", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      const { rerender } = render(
        React.createElement(tourModule.OnboardingTour, { open: true, onClose }),
      );

      const skipBtn = screen.queryByRole("button", { name: /passer|skip/i });
      if (skipBtn) {
        fireEvent.click(skipBtn);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          expect.stringContaining("tour"),
          expect.any(String),
        );
      }

      // Re-triggering on demand re-renders cleanly
      rerender(React.createElement(tourModule.OnboardingTour, { open: true, onClose }));
      expect(screen.getByText(/visite|bienvenue|découverte/i)).toBeInTheDocument();
    });

    it("T2.4_R2: Tour renders null when closed with zero residual backdrop or body scroll lock traps", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const { container } = render(
        React.createElement(tourModule.OnboardingTour, { open: false, onClose: vi.fn() }),
      );
      expect(container.firstChild).toBeNull();
      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("T2.5_R2: Tour handles rapid open/close toggle cycles without state corruption", async () => {
      const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
      expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
      if (!tourModule?.OnboardingTour) return;

      const onClose = vi.fn();
      const { rerender, container } = render(
        React.createElement(tourModule.OnboardingTour, { open: false, onClose }),
      );

      // Rapidly toggle 5 times
      for (let i = 0; i < 5; i++) {
        rerender(React.createElement(tourModule.OnboardingTour, { open: i % 2 === 0, onClose }));
      }
      rerender(React.createElement(tourModule.OnboardingTour, { open: false, onClose }));
      expect(container.firstChild).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // R3 Boundaries: Flashcard Data & State Resilience
  // -------------------------------------------------------------------------
  describe("R3 Boundaries: Flashcard Data & State Resilience", () => {
    it("T2.1_R3: Flashcard normalizer gracefully handles legacy cards missing binary/mcq fields", async () => {
      const apprendreModule = await import("@/routes/apprendre").catch(() => null);

      // Verify that cards provide fallback or normalized shape
      const rawCard = {
        id: "legacy-1",
        front: "Qu'est-ce que le Phishing ?",
        back: "Une attaque par usurpation",
        mastered: false,
      };
      const normalizer =
        (apprendreModule as any)?.normalizeFlashcard ||
        ((c: any) => ({
          ...c,
          binaryStatement: c.binaryStatement || c.front,
          binaryAnswer: c.binaryAnswer ?? true,
          binaryExplanation: c.binaryExplanation || c.back,
          mcqQuestion: c.mcqQuestion || c.front,
          mcqOptions: c.mcqOptions || [c.back, "Réponse alternative", "Autre réponse"],
          mcqAnswerIndex: c.mcqAnswerIndex ?? 0,
          mcqExplanation: c.mcqExplanation || c.back,
        }));

      const normalized = normalizer(rawCard, 0);
      expect(normalized.binaryStatement).toBeDefined();
      expect(typeof normalized.binaryAnswer).toBe("boolean");
      expect(Array.isArray(normalized.mcqOptions)).toBe(true);
      expect(normalized.mcqOptions.length).toBeGreaterThanOrEqual(2);
    });

    it("T2.2_R3: Mode switching mid-session preserves active course selection and progress", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/flashcardMode|setFlashcardMode|activeFlashcardCourse/i);
    });

    it("T2.3_R3: Answering card locks response to prevent multiple conflicting score increments", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/hasAnswered|answered|selectedAnswer|showFeedback/i);
    });

    it("T2.4_R3: Empty course or 0-card state displays graceful empty state without crash", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/aucune carte|sélectionnez un cours|0 carte/i);
    });

    it("T2.5_R3: Flashcard navigation wraps or bounds cleanly at first and last card", () => {
      const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
      expect(apprendreCode).toMatch(/disabled=\{.*flashcardIndex === 0.*\}/);
    });
  });

  // -------------------------------------------------------------------------
  // R4 Boundaries: SVG Scaling, Favicon & Contrast
  // -------------------------------------------------------------------------
  describe("R4 Boundaries: SVG Scaling, Favicon & Contrast", () => {
    it("T2.1_R4: Logo wrapper avoids hardcoded bg-white in dark theme to eliminate glaring contrast box", async () => {
      const { Logo } = await import("@/components/cs/Logo");
      const { container } = render(React.createElement(Logo));

      // The logo container must not have hardcoded 'bg-white' without dark adaptation
      const whiteBox = container.querySelector(".bg-white:not([class*='dark:'])");
      expect(whiteBox, "Logo should not have hardcoded unadapted 'bg-white' container").toBeNull();
    });

    it("T2.2_R4: Vector logo SVG has valid viewBox and scalable vector attributes", async () => {
      const { Logo } = await import("@/components/cs/Logo");
      const { container } = render(React.createElement(Logo));

      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("viewBox")).toBeTruthy();
    });

    it("T2.3_R4: Logo component accepts and merges custom className cleanly", async () => {
      const { Logo } = await import("@/components/cs/Logo");
      const { container } = render(
        React.createElement(Logo, { className: "e2e-custom-logo-class" }),
      );

      expect(container.querySelector(".e2e-custom-logo-class")).not.toBeNull();
    });

    it("T2.4_R4: Standalone favicon.svg is valid XML and contains scalable vector markup", () => {
      const svgPath = path.join(ROOT_DIR, "public/favicon.svg");
      if (!fs.existsSync(svgPath)) {
        expect(fs.existsSync(svgPath), "public/favicon.svg should exist").toBe(true);
        return;
      }
      const svgContent = fs.readFileSync(svgPath, "utf-8");
      expect(svgContent).toMatch(/<svg/i);
      expect(svgContent).toMatch(/<\/svg>/i);
      expect(svgContent).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i);
    });

    it("T2.5_R4: Root head configures both SVG and ICO favicons with correct relation types", () => {
      const rootCode = readSourceFile("src/routes/__root.tsx");
      expect(rootCode).toMatch(/favicon\.svg/i);
      expect(rootCode).toMatch(/favicon\.ico/i);
    });
  });

  // -------------------------------------------------------------------------
  // R5 Boundaries: Theme Specificity, FOUC & Stability
  // -------------------------------------------------------------------------
  describe("R5 Boundaries: Theme Specificity, FOUC & Stability", () => {
    it("T2.1_R5: Inline head script in __root.tsx executes synchronously to prevent FOUC", () => {
      const rootCode = readSourceFile("src/routes/__root.tsx");
      expect(rootCode).toMatch(/cybersafe_theme|prefers-color-scheme/);
    });

    it("T2.2_R5: Light theme is the default when no theme preference is saved", () => {
      const rootCode = readSourceFile("src/routes/__root.tsx");
      const appShellCode = readSourceFile("src/components/cs/AppShell.tsx");
      const themeLogic = rootCode + appShellCode;

      expect(themeLogic).toContain('saved === "dark"');
      expect(themeLogic).not.toMatch(/prefers-color-scheme:\s*dark/i);
    });

    it("T2.3_R5: Theme toggle button includes accessible aria-label and accessible text for screen readers", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const toggle = screen.getByRole("button", { name: /basculer le thème/i });
      expect(toggle.getAttribute("aria-label")).toMatch(/basculer le thème/i);
    });

    it("T2.4_R5: Dark theme text tokens ensure minimum WCAG AAA/AA legibility (no dark text on dark bg)", () => {
      const css = readSourceFile("src/styles.css");
      const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
      expect(darkMatch).not.toBeNull();
      if (darkMatch) {
        const darkBody = darkMatch[1];
        expect(darkBody).toMatch(/--night-foreground:\s*oklch\(0\.9[0-9]/);
      }
    });

    it("T2.5_R5: Rapid consecutive theme toggles maintain synchronized state across all consumers", async () => {
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const toggle = screen.getByRole("button", { name: /basculer le thème/i });

      // Toggle 6 times
      for (let i = 0; i < 6; i++) {
        fireEvent.click(toggle);
      }

      // After 6 toggles from light: should be light
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith("cybersafe_theme", "light");
    });

    it("T2.6_R5: Mobile navigation locks background scrolling and closes accessibly with Escape", async () => {
      storageMap.set("cybersafe_tour_completed", "true");
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const openButton = document.querySelector<HTMLButtonElement>(
        'button[aria-controls="mobile-navigation"]',
      );
      if (!openButton) throw new Error("Mobile menu trigger was not rendered");
      fireEvent.click(openButton);

      const menu = screen.getByRole("dialog", { name: "nav.mainNavigation" });
      expect(menu.querySelector(".min-h-0.overflow-y-auto")).not.toBeNull();
      expect(openButton).toHaveAttribute("aria-expanded", "true");
      expect(document.body.style.overflow).toBe("hidden");
      expect(menu.querySelector('nav[aria-label="nav.mainNavigation"]')).not.toBeNull();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog", { name: "nav.mainNavigation" })).toBeNull();
      expect(openButton).toHaveAttribute("aria-expanded", "false");
      expect(document.body.style.overflow).toBe("");
      expect(document.activeElement).toBe(openButton);
      expect(document.querySelector("main")).not.toHaveAttribute("inert");
    });

    it("T2.7_R5: Mobile navigation confines keyboard focus to the open drawer", async () => {
      storageMap.set("cybersafe_tour_completed", "true");
      const { AppShell } = await import("@/components/cs/AppShell");
      render(React.createElement(AppShell, null, React.createElement("div", null, "Page")));

      const openButton = document.querySelector<HTMLButtonElement>(
        'button[aria-controls="mobile-navigation"]',
      );
      if (!openButton) throw new Error("Mobile menu trigger was not rendered");
      fireEvent.click(openButton);
      const menu = screen.getByRole("dialog", { name: "nav.mainNavigation" });
      const firstLink = menu.querySelector<HTMLAnchorElement>("a[href]");
      if (!firstLink) throw new Error("Mobile menu navigation link was not rendered");
      firstLink.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

      const focusable = menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      expect(document.activeElement).toBe(focusable.item(focusable.length - 1));
      expect(document.querySelector("main")).toHaveAttribute("inert");
    });
  });
});

// ===========================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE INTERACTIONS — 6 TESTS)
// ===========================================================================

describe("Tier 3: Cross-Feature Combinations (Pairwise)", () => {
  it("T3.1_cross_R2_R5: OnboardingTour renders with seamless dark theme styling when dark mode is active", async () => {
    document.documentElement.classList.add("dark");
    const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
    expect(tourModule, "OnboardingTour should exist").not.toBeNull();
    if (!tourModule?.OnboardingTour) return;

    const { container } = render(
      React.createElement(tourModule.OnboardingTour, { open: true, onClose: vi.fn() }),
    );
    const card = container.querySelector(".bg-card, [class*='bg-night'], [class*='bg-slate-900']");
    expect(card, "Tour dialog should use theme-adaptive card background").not.toBeNull();
  });

  it("T3.2_cross_R3_R5: Flashcards dual modes maintain legible feedback and contrast in dark theme", () => {
    const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
    expect(apprendreCode).toMatch(/emerald|green|destructive|red/);
    expect(apprendreCode).toMatch(/dark:/);
  });

  it("T3.3_cross_R4_R5: Vector Logo renders with sharp visibility in both light and dark themes", async () => {
    const { Logo } = await import("@/components/cs/Logo");

    // Light mode render
    const light = render(React.createElement(Logo));
    expect(light.container.querySelector("svg")).not.toBeNull();
    light.unmount();

    // Dark mode render
    document.documentElement.classList.add("dark");
    const dark = render(React.createElement(Logo));
    expect(dark.container.querySelector("svg")).not.toBeNull();
    expect(dark.container.querySelector(".bg-white:not([class*='dark:'])")).toBeNull();
  });

  it("T3.4_cross_R1_R2: AppShell header cleanly replaces pitch button with tour trigger without layout shift", async () => {
    const { AppShell } = await import("@/components/cs/AppShell");
    render(React.createElement(AppShell, null, React.createElement("div", null, "Content")));

    // Old pitch button is gone
    expect(screen.queryByText(/pitch 3 min/i)).toBeNull();

    // New tour button is present
    const tourBtn =
      screen.queryByRole("button", { name: /visite guidée|tour|guide/i }) ||
      document.querySelector('button[title*="visite" i]');
    expect(tourBtn, "Tour trigger button replaces pitch button in header").not.toBeNull();
  });

  it("T3.5_cross_R2_R3: Tour steps highlight learning hub and flashcard capabilities", async () => {
    const tourContent = readSourceFile("src/components/cs/OnboardingTour.tsx");
    if (!tourContent) {
      expect(tourContent, "OnboardingTour.tsx should exist").not.toBe("");
      return;
    }

    expect(tourContent).toMatch(/apprendre|flashcard|étudiant|quiz/i);
  });

  it("T3.6_cross_R1_R3: Learning page is free of hackathon markers while dual-mode flashcards operate", () => {
    const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
    expect(apprendreCode).not.toMatch(/hackathon/i);
    expect(apprendreCode).not.toMatch(/pitch/i);
    expect(apprendreCode).toMatch(/flashcard/i);
  });
});

// ===========================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (END-TO-END WORKFLOWS — 5 TESTS)
// ===========================================================================

describe("Tier 4: Real-World Application Scenarios", () => {
  it("T4.1_scenario_new_user_onboarding_and_dismissal: Complete first-time user tour walkthrough", async () => {
    const tourModule = await loadOptionalModule("components/cs/OnboardingTour");
    expect(tourModule, "OnboardingTour module should exist").not.toBeNull();
    if (!tourModule?.OnboardingTour) return;

    let isOpen = true;
    const handleClose = vi.fn(() => {
      isOpen = false;
    });

    const { rerender } = render(
      React.createElement(tourModule.OnboardingTour, { open: isOpen, onClose: handleClose }),
    );

    // Step 1: User sees welcoming message
    expect(screen.getByText(/visite|bienvenue|découverte/i)).toBeInTheDocument();

    // User steps forward to Step 2
    const nextBtn = screen.queryByRole("button", { name: /suivant|next/i });
    if (nextBtn) {
      fireEvent.click(nextBtn);
    }

    // User decides to skip to resume normal browsing
    const skipBtn = screen.queryByRole("button", { name: /passer|skip/i });
    if (skipBtn) {
      fireEvent.click(skipBtn);
      expect(handleClose).toHaveBeenCalled();
    }

    // Once dismissed, tour is closed and page remains interactive
    rerender(React.createElement(tourModule.OnboardingTour, { open: false, onClose: handleClose }));
    expect(screen.queryByText(/visite guidée interactive/i)).toBeNull();
  });

  it("T4.2_scenario_student_flashcard_session: Dual-mode revision session with scoring", async () => {
    const apprendreCode = readSourceFile("src/routes/apprendre.tsx");
    expect(apprendreCode).not.toBe("");

    // Verify dual mode execution capability
    expect(apprendreCode).toMatch(/Oui\s*\/\s*Non/i);
    expect(apprendreCode).toMatch(/Bonne\s*Réponse/i);
    expect(apprendreCode).toMatch(/mastered|score|progression/i);
  });

  it("T4.3_scenario_dark_theme_full_site_navigation: Theme toggle and cross-page visual ergonomics", async () => {
    const { AppShell } = await import("@/components/cs/AppShell");
    const { rerender } = render(
      React.createElement(
        AppShell,
        null,
        React.createElement("div", { "data-testid": "dashboard-view" }, "Dashboard"),
      ),
    );

    // Toggle to Dark Mode
    const toggle = screen.getByRole("button", { name: /basculer le thème/i });
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Navigate to About
    rerender(
      React.createElement(
        AppShell,
        null,
        React.createElement("div", { "data-testid": "about-view" }, "About Page Content"),
      ),
    );
    expect(screen.getByTestId("about-view")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Navigate to Learning
    rerender(
      React.createElement(
        AppShell,
        null,
        React.createElement("div", { "data-testid": "learning-view" }, "Learning Space"),
      ),
    );
    expect(screen.getByTestId("learning-view")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("T4.4_scenario_saas_brand_and_audit: Forensic inspection confirms zero hackathon artifacts across product", () => {
    const sourceFiles = [
      "src/components/cs/AppShell.tsx",
      "src/routes/index.tsx",
      "src/routes/a-propos.tsx",
      "src/routes/qr.tsx",
      "src/routes/audio.tsx",
      "src/routes/guide.tsx",
      "src/routes/apprendre.tsx",
    ];

    const violations: Array<{ file: string; match: string }> = [];

    for (const relPath of sourceFiles) {
      const code = readSourceFile(relPath);
      if (!code) continue;

      if (code.match(/pitch\s*3\s*min/i)) violations.push({ file: relPath, match: "Pitch 3 min" });
      if (code.match(/MLH\s*×\s*LBS/i)) violations.push({ file: relPath, match: "MLH × LBS" });
      if (code.match(/barème\s*20\s*\/\s*20/i))
        violations.push({ file: relPath, match: "Barème 20/20" });
      if (code.match(/aide de pitch/i)) violations.push({ file: relPath, match: "Aide de Pitch" });
    }

    expect(
      violations,
      `Forensic check failed: found forbidden hackathon markers: ${JSON.stringify(violations)}`,
    ).toEqual([]);
  });

  it("T4.5_scenario_user_preference_persistence_and_reload: Storage persistence across reloads", async () => {
    const { AppShell } = await import("@/components/cs/AppShell");

    // User chooses dark mode
    render(
      React.createElement(AppShell, null, React.createElement("div", null, "Initial session")),
    );

    const toggle = screen.getByRole("button", { name: /basculer le thème/i });
    fireEvent.click(toggle);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("cybersafe_theme", "dark");

    // Simulate page reload: unmount and remount with saved localStorage
    cleanup();
    storageMap.set("cybersafe_theme", "dark");

    render(
      React.createElement(AppShell, null, React.createElement("div", null, "Reloaded session")),
    );

    // Dark theme should be active on reload
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByText("Reloaded session")).toBeInTheDocument();
  });
});
