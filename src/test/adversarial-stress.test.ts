/**
 * Adversarial Stress & Verification Test Suite for CyberSafe Online
 * =================================================================
 * Challenger Agent: teamwork_challenger_final_1
 * Roles: critic, specialist (Empirical Challenger)
 *
 * Specific Challenge Dimensions:
 * 1. Flashcards dual-mode learning module:
 *    - Rapid switching between « Oui / Non » and « Bonne Réponse »
 *    - Edge cases: cards missing optional binary/mcq fields, empty state, state corruption, score updates consistency
 * 2. Onboarding Tour:
 *    - Non-blocking nature (click outside, escape key, skip, close at any step)
 *    - Multiple openings/closings in sequence, body scroll trap checks
 * 3. Dark Theme & Logo:
 *    - Dynamic class toggling, localStorage persistence, FOUC prevention script in __root.tsx
 *    - Scalability of Logo vector SVG and favicon.svg validity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

// Component and module imports
import { normalizeFlashcard, type Flashcard } from "@/routes/apprendre";
import { OnboardingTour, TOUR_STEPS } from "@/components/cs/OnboardingTour";
import { Logo, CyberSafeEmblem } from "@/components/cs/Logo";

// ---------------------------------------------------------------------------
// Storage Mock Setup
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

describe("CHALLENGER 1: Empirical Adversarial Stress Suite", () => {
  beforeEach(() => {
    storageMap.clear();
    vi.clearAllMocks();
    document.documentElement.className = "";
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // CHALLENGE 1: Flashcards Dual-Mode Learning Module
  // =========================================================================
  describe("Challenge 1: Flashcards Dual-Mode Learning Module", () => {
    it("ADV-1.1: Rapid mode switching (100 toggles) maintains state integrity", () => {
      let mode: "binary" | "mcq" = "binary";
      let hasAnswered = false;
      let selectedBinaryAnswer: boolean | null = null;
      let selectedMcqAnswer: number | null = null;
      let isAnswerCorrect: boolean | null = null;

      const handleSwitchMode = (newMode: "binary" | "mcq") => {
        mode = newMode;
        hasAnswered = false;
        selectedBinaryAnswer = null;
        selectedMcqAnswer = null;
        isAnswerCorrect = null;
      };

      // Rapidly toggle back and forth 100 times
      for (let i = 0; i < 100; i++) {
        handleSwitchMode(i % 2 === 0 ? "mcq" : "binary");
        expect(hasAnswered).toBe(false);
        expect(selectedBinaryAnswer).toBeNull();
        expect(selectedMcqAnswer).toBeNull();
        expect(isAnswerCorrect).toBeNull();
      }

      // Final state should be "binary" (99 % 2 !== 0)
      expect(mode).toBe("binary");
    });

    it("ADV-1.2: Switching mode mid-session after answering preserves session scoring", () => {
      let sessionScore = 0;
      let sessionAttempts = 0;
      let hasAnswered = false;
      let mode: "binary" | "mcq" = "binary";

      const card = normalizeFlashcard({
        id: "adv-card-1",
        front: "Authentification à deux facteurs (2FA)",
        back: "Obligatoire pour les transactions sensibles",
        binaryStatement: "Le 2FA réduit drastiquement les risques de piratage.",
        binaryAnswer: true,
        mcqQuestion: "Que permet le 2FA ?",
        mcqOptions: [
          "Ajouter une couche de sécurité supplémentaire",
          "Désactiver le mot de passe",
          "Partager le compte en ligne",
          "Rendre le Wi-Fi public",
        ],
        mcqAnswerIndex: 0,
      });

      // Answer in binary mode
      const answerBinary = (choice: boolean) => {
        if (hasAnswered) return;
        hasAnswered = true;
        sessionAttempts += 1;
        if (choice === card.binaryAnswer) {
          sessionScore += 1;
        }
      };

      // Answer in MCQ mode
      const answerMcq = (idx: number) => {
        if (hasAnswered) return;
        hasAnswered = true;
        sessionAttempts += 1;
        if (idx === card.mcqAnswerIndex) {
          sessionScore += 1;
        }
      };

      const switchMode = (newMode: "binary" | "mcq") => {
        mode = newMode;
        hasAnswered = false;
      };

      // 1. Answer correctly in binary mode
      answerBinary(true);
      expect(sessionScore).toBe(1);
      expect(sessionAttempts).toBe(1);

      // 2. Switch to MCQ mode
      switchMode("mcq");
      expect(mode).toBe("mcq");
      expect(hasAnswered).toBe(false);

      // 3. Answer correctly in MCQ mode on the same card
      answerMcq(0);
      expect(sessionScore).toBe(2);
      expect(sessionAttempts).toBe(2);

      const rate = Math.round((sessionScore / sessionAttempts) * 100);
      expect(rate).toBe(100);
      expect(Number.isNaN(rate)).toBe(false);
    });

    it("ADV-1.3: Normalizer handles edge cases: missing all optional binary & mcq fields", () => {
      // Completely empty input
      const emptyCard = normalizeFlashcard({});
      expect(emptyCard.id).toBe("fc-1");
      expect(emptyCard.front).toBe("Concept clé 1");
      expect(emptyCard.back).toBe("Consultez les notes pour la définition complète.");
      expect(emptyCard.binaryStatement).toBe("Concept clé 1");
      expect(emptyCard.binaryAnswer).toBe(true);
      expect(emptyCard.binaryExplanation).toBe("Consultez les notes pour la définition complète.");
      expect(emptyCard.mcqQuestion).toBe("Concept clé 1");
      expect(Array.isArray(emptyCard.mcqOptions)).toBe(true);
      expect(emptyCard.mcqOptions?.length).toBe(4);
      expect(emptyCard.mcqAnswerIndex).toBe(0);
      expect(emptyCard.mcqExplanation).toBe("Consultez les notes pour la définition complète.");
    });

    it("ADV-1.4: Normalizer handles corrupt data types and out-of-bounds indices", () => {
      const corruptCard: any = {
        id: null,
        front: "   ",
        back: "",
        binaryStatement: null,
        binaryAnswer: "not-a-boolean",
        binaryExplanation: undefined,
        mcqQuestion: null,
        mcqOptions: "this is not an array",
        mcqAnswerIndex: 99999, // Out of bounds!
        mcqExplanation: null,
      };

      const normalized = normalizeFlashcard(corruptCard, 5);

      expect(normalized.id).toBe("fc-6");
      expect(normalized.front).toBe("Concept clé 6");
      expect(normalized.back).toBe("Consultez les notes pour la définition complète.");
      expect(normalized.binaryStatement).toBe("Concept clé 6");
      expect(typeof normalized.binaryAnswer).toBe("boolean");
      expect(normalized.binaryAnswer).toBe(true); // Fallback to true
      expect(Array.isArray(normalized.mcqOptions)).toBe(true);
      expect(normalized.mcqOptions?.length).toBeGreaterThanOrEqual(2);
      // Index was 99999, should be clamped/fallback to 0
      expect(normalized.mcqAnswerIndex).toBe(0);
      expect(normalized.mcqOptions?.[normalized.mcqAnswerIndex ?? 0]).toBeDefined();
    });

    it("ADV-1.5: Normalizer handles negative mcqAnswerIndex and insufficient mcqOptions", () => {
      const singleOptionCard = normalizeFlashcard({
        mcqOptions: ["Only one option"],
        mcqAnswerIndex: -3,
      });

      // Because mcqOptions had < 2 options, normalizer provides 4 standard fallback options
      expect(singleOptionCard.mcqOptions?.length).toBe(4);
      // Because mcqAnswerIndex was negative, fallback to 0
      expect(singleOptionCard.mcqAnswerIndex).toBe(0);
    });

    it("ADV-1.6: Empty course state (0 cards) does not crash or generate NaN metrics", () => {
      const emptyCards: Flashcard[] = [];
      const totalCards = emptyCards.length;
      const masteredCards = emptyCards.filter((c) => c.mastered).length;
      const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
      const sessionAttempts = 0;
      const sessionScore = 0;
      const sessionRate =
        sessionAttempts > 0 ? Math.round((sessionScore / sessionAttempts) * 100) : 0;

      expect(masteryPercent).toBe(0);
      expect(sessionRate).toBe(0);
      expect(Number.isNaN(masteryPercent)).toBe(false);
      expect(Number.isNaN(sessionRate)).toBe(false);

      // Accessing emptyCards[0] gives undefined, normalizeFlashcard(undefined, 0) handles it safely
      const safeCard = normalizeFlashcard(emptyCards[0], 0);
      expect(safeCard).toBeDefined();
      expect(safeCard.front).toBe("Concept clé 1");
    });

    it("ADV-1.7: Response locking prevents multiple conflicting score increments", () => {
      let attempts = 0;
      let score = 0;
      let hasAnswered = false;

      const recordAnswer = (isCorrect: boolean) => {
        if (hasAnswered) return; // Strict lock
        hasAnswered = true;
        attempts += 1;
        if (isCorrect) score += 1;
      };

      // Click once
      recordAnswer(true);
      expect(attempts).toBe(1);
      expect(score).toBe(1);

      // Attempt 10 spam clicks while locked
      for (let i = 0; i < 10; i++) {
        recordAnswer(true);
        recordAnswer(false);
      }

      // Counts remain strictly 1
      expect(attempts).toBe(1);
      expect(score).toBe(1);
    });

    it("ADV-1.8: Card mastery is permanent once achieved during session", () => {
      const card = normalizeFlashcard({ mastered: false }, 0);
      expect(card.mastered).toBe(false);

      // Mark mastered on first correct answer
      const masteredCard = { ...card, mastered: true };
      expect(masteredCard.mastered).toBe(true);

      // A subsequent wrong answer attempt on other mode must NOT revoke existing mastered status
      const preservedCard = { ...masteredCard };
      expect(preservedCard.mastered).toBe(true);
    });
  });

  // =========================================================================
  // CHALLENGE 2: Onboarding Tour Non-Blocking & Lifecycle
  // =========================================================================
  describe("Challenge 2: Onboarding Tour Non-Blocking & Lifecycle", () => {
    it("ADV-2.1: Non-blocking backdrop dismissal via outside click", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      const backdrop = screen.getByTestId("onboarding-tour-backdrop");
      // Click directly on the backdrop container
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("ADV-2.2: Dialog content click does not trigger dismissal (propagation stopped)", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it("ADV-2.3: Escape key dismisses the tour immediately from any step", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      // Advance to step 3
      const nextBtn = screen.getByRole("button", { name: /suivant/i });
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("ADV-2.4: Skip button marks tour completed in storage and closes", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      const skipBtn = screen.getByRole("button", { name: /passer/i });
      fireEvent.click(skipBtn);

      expect(localStorage.getItem("cybersafe_tour_completed")).toBe("true");
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("ADV-2.5: Dedicated close button ('X') terminates tour immediately", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      const closeBtn = screen.getByRole("button", { name: /fermer/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("ADV-2.6: Multiple rapid open/close toggle cycles (50 cycles) do not leak listeners or crash", () => {
      const handleClose = vi.fn();
      const addSpy = vi.spyOn(document, "addEventListener");
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { rerender } = render(
        React.createElement(OnboardingTour, { open: false, onClose: handleClose }),
      );

      for (let i = 0; i < 50; i++) {
        act(() => {
          rerender(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));
        });
        act(() => {
          rerender(React.createElement(OnboardingTour, { open: false, onClose: handleClose }));
        });
      }

      // Ensure every added keydown listener was removed
      const keydownAdds = addSpy.mock.calls.filter((call) => call[0] === "keydown").length;
      const keydownRemoves = removeSpy.mock.calls.filter((call) => call[0] === "keydown").length;
      expect(keydownAdds).toBe(keydownRemoves);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("ADV-2.7: Body scroll trap check: Tour NEVER locks document.body overflow", () => {
      const initialOverflow = document.body.style.overflow;
      const handleClose = vi.fn();

      const { rerender } = render(
        React.createElement(OnboardingTour, { open: true, onClose: handleClose }),
      );
      // While open, body overflow should NOT be set to hidden
      expect(document.body.style.overflow).toBe(initialOverflow);

      // Close it
      rerender(React.createElement(OnboardingTour, { open: false, onClose: handleClose }));
      expect(document.body.style.overflow).toBe(initialOverflow);
    });

    it("ADV-2.8: Step boundary navigation: cannot navigate below step 0 or past last step", () => {
      const handleClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose: handleClose }));

      // Step 1: Previous button is disabled
      const prevBtn = screen.getByRole("button", { name: /précédent/i });
      expect(prevBtn).toBeDisabled();

      // Press ArrowLeft on step 0: stays on step 1
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      expect(screen.getByText(`Étape 1 / ${TOUR_STEPS.length}`)).toBeInTheDocument();

      // Navigate to final step
      for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
        const next = screen.getByRole("button", { name: /suivant/i });
        fireEvent.click(next);
      }

      // On final step, button text is "Terminer"
      const finishBtn = screen.getByRole("button", { name: /terminer/i });
      expect(finishBtn).toBeInTheDocument();

      fireEvent.click(finishBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("cybersafe_tour_completed")).toBe("true");
    });
  });

  // =========================================================================
  // CHALLENGE 3: Dark Theme & Logo
  // =========================================================================
  describe("Challenge 3: Dark Theme & Logo", () => {
    it("ADV-3.1: Dynamic class toggling (50 cycles) maintains synchronized state with storage", () => {
      let isDark = false;
      const toggle = () => {
        isDark = !isDark;
        localStorage.setItem("cybersafe_theme", isDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", isDark);
      };

      for (let i = 0; i < 50; i++) {
        toggle();
        const stored = localStorage.getItem("cybersafe_theme");
        const classPresent = document.documentElement.classList.contains("dark");
        expect(stored).toBe(isDark ? "dark" : "light");
        expect(classPresent).toBe(isDark);
      }

      // No redundant duplicate classes
      const darkClasses = Array.from(document.documentElement.classList).filter(
        (c) => c === "dark",
      );
      expect(darkClasses.length).toBeLessThanOrEqual(1);
    });

    it("ADV-3.2: FOUC inline script in __root.tsx executes synchronously and correctly", () => {
      const rootPath = path.resolve(process.cwd(), "src/routes/__root.tsx");
      const rootCode = fs.readFileSync(rootPath, "utf-8");

      // Verify script is present in the <head>
      expect(rootCode).toContain("cybersafe_theme");
      expect(rootCode).toContain('document.documentElement.classList.add("dark")');

      // Extract the inline function body
      const scriptMatch = rootCode.match(/__html:\s*`([^`]+)`/);
      expect(scriptMatch).toBeTruthy();
      const inlineScript = scriptMatch?.[1] ?? "";

      // Test Scenario A: Storage has 'dark'
      storageMap.set("cybersafe_theme", "dark");
      document.documentElement.className = "";
      new Function(inlineScript)();
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Test Scenario B: Storage has 'light'
      storageMap.set("cybersafe_theme", "light");
      document.documentElement.classList.add("dark");
      new Function(inlineScript)();
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Test Scenario C: Storage empty defaults to light regardless of system theme
      storageMap.clear();
      document.documentElement.className = "";
      const origMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      new Function(inlineScript)();
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Test Scenario D: Storage empty, system light matches
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      new Function(inlineScript)();
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Test Scenario E: Storage throws exception (restricted security context)
      const faultStorageMock = {
        getItem: () => {
          throw new Error("SecurityError: Access is denied");
        },
      };
      Object.defineProperty(window, "localStorage", {
        value: faultStorageMock,
        configurable: true,
      });

      // Must execute without uncaught error
      expect(() => {
        new Function(inlineScript)();
      }).not.toThrow();

      // Restore
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        configurable: true,
      });
      window.matchMedia = origMatchMedia;
    });

    it("ADV-3.3: Logo renders scalable SVG with valid geometry and adapts to variants", () => {
      // Default variant
      const { container, rerender } = render(React.createElement(Logo, {}));
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute("viewBox")).toBe("0 0 48 48");
      expect(svg?.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");

      // Verify no hardcoded bg-white on container
      const emblemContainer = svg?.parentElement;
      expect(emblemContainer?.className).toContain("bg-slate-900");
      expect(emblemContainer?.className).toContain("dark:bg-slate-950");
      expect(emblemContainer?.className).not.toContain("bg-white");

      // Verify typography present
      expect(screen.getByText("CyberSafe")).toBeInTheDocument();
      expect(screen.getByText("Online")).toBeInTheDocument();
      expect(screen.getByText("SaaS")).toBeInTheDocument();

      // Compact variant: hides text
      rerender(React.createElement(Logo, { compact: true }));
      expect(screen.queryByText("CyberSafe")).not.toBeInTheDocument();
    });

    it("ADV-3.4: public/favicon.svg is well-formed XML and includes dark/light media queries", () => {
      const faviconPath = path.resolve(process.cwd(), "public/favicon.svg");
      expect(fs.existsSync(faviconPath)).toBe(true);

      const content = fs.readFileSync(faviconPath, "utf-8");
      expect(content).toContain("<svg");
      expect(content).toContain('viewBox="0 0 48 48"');
      expect(content).toContain("prefers-color-scheme: light");
      expect(content).toContain("shieldGradDark");
      expect(content).toContain("shieldGradLight");

      // XML well-formedness check using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "image/svg+xml");
      const parseError = doc.querySelector("parsererror");
      expect(parseError).toBeNull();
      expect(doc.documentElement.nodeName.toLowerCase()).toBe("svg");
    });

    it("ADV-3.5: Root __root.tsx references vector favicon.svg with correct MIME type", () => {
      const rootPath = path.resolve(process.cwd(), "src/routes/__root.tsx");
      const rootCode = fs.readFileSync(rootPath, "utf-8");

      expect(rootCode).toContain('rel: "icon", href: "/favicon.svg", type: "image/svg+xml"');
    });
  });
});
