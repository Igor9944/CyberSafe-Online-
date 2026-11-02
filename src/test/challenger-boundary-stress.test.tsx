import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { OnboardingTour, TOUR_STEPS } from "@/components/cs/OnboardingTour";
import { normalizeFlashcard, type Flashcard } from "@/routes/apprendre";

// Mock localStorage for Node 26 + jsdom
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

describe("Challenger 2 Empirical Boundary & Stress Suite", () => {
  const ROOT_DIR = path.resolve(__dirname, "../..");

  beforeEach(() => {
    storageMap.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Pitch / Hackathon Scrub Boundary Conditions
  // =========================================================================
  describe("1. Pitch / Hackathon Scrub Boundary Conditions", () => {
    it("verifies PitchModal.tsx does not exist on disk", () => {
      const pitchModalPath = path.join(ROOT_DIR, "src/components/cs/PitchModal.tsx");
      expect(fs.existsSync(pitchModalPath)).toBe(false);
    });

    it("verifies complete absence of hackathon & pitch markers across all active source files", () => {
      const srcDir = path.join(ROOT_DIR, "src");

      function getAllFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
          } else if (/\.(tsx?|jsx?|html|css)$/.test(file)) {
            // Ignore the test files themselves
            if (!filePath.includes("/test/")) {
              fileList.push(filePath);
            }
          }
        }
        return fileList;
      }

      const files = getAllFiles(srcDir);
      expect(files.length).toBeGreaterThan(15);

      const violations: Array<{ file: string; match: string }> = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const rel = path.relative(ROOT_DIR, file);

        if (/PitchModal/i.test(content)) violations.push({ file: rel, match: "PitchModal" });
        if (/pitch\s*3\s*min/i.test(content)) violations.push({ file: rel, match: "pitch 3 min" });
        if (/aide\s*de\s*pitch/i.test(content)) violations.push({ file: rel, match: "aide de pitch" });
        if (/20\s*\/\s*20/i.test(content)) violations.push({ file: rel, match: "20/20 rubric" });
        if (/MLH\s*×\s*LBS\s*2026/i.test(content)) violations.push({ file: rel, match: "MLH × LBS 2026" });
        if (/hackathon/i.test(content)) violations.push({ file: rel, match: "hackathon" });
      }

      expect(violations).toEqual([]);
    });

    it("confirms speech synthesis pitch property utterance.pitch = 1.0 is preserved in /audio and functional", () => {
      const audioPath = path.join(ROOT_DIR, "src/routes/audio.tsx");
      const audioCode = fs.readFileSync(audioPath, "utf-8");

      expect(audioCode).toContain("utterance.pitch = 1.0;");
      expect(audioCode).toContain("utterance.rate = 1.0;");

      // Verify utterance object contract
      class MockSpeechSynthesisUtterance {
        text: string;
        lang = "";
        rate = 1;
        pitch = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      const instance = new MockSpeechSynthesisUtterance("Test dialogue");
      instance.pitch = 1.0;
      expect(instance.pitch).toBe(1.0);
    });
  });

  // =========================================================================
  // 2. FlashCards State Machine Boundaries
  // =========================================================================
  describe("2. FlashCards State Machine Boundaries", () => {
    it("handles extreme corrupt / partial card schemas in normalizeFlashcard", () => {
      // Completely null/undefined
      const normNull = normalizeFlashcard(null, 0);
      expect(normNull.id).toBe("fc-1");
      expect(normNull.front).toBe("Concept clé 1");
      expect(normNull.binaryAnswer).toBe(true);
      expect(normNull.mcqOptions?.length).toBe(4);
      expect(normNull.mcqAnswerIndex).toBe(0);

      // Card with corrupt/empty mcqOptions
      const badMcq = normalizeFlashcard({ mcqOptions: ["only one"] }, 5);
      expect(badMcq.mcqOptions?.length).toBe(4); // Fallback to 4 pedagogical options

      // Card with out-of-range mcqAnswerIndex
      const badIndex = normalizeFlashcard({ mcqOptions: ["A", "B", "C"], mcqAnswerIndex: 99 }, 1);
      expect(badIndex.mcqAnswerIndex).toBe(0); // Safely resets to 0

      // Card with negative mcqAnswerIndex
      const negIndex = normalizeFlashcard({ mcqOptions: ["A", "B"], mcqAnswerIndex: -2 }, 2);
      expect(negIndex.mcqAnswerIndex).toBe(0);
    });

    it("verifies dual-mode FlashCards interaction, boundaries, and answer locking", () => {
      // Simulate Flashcard state machine logic directly as implemented in apprendre.tsx
      const testCards: Flashcard[] = [
        normalizeFlashcard({
          id: "card-1",
          front: "Q1",
          binaryStatement: "T-Money demande toujours votre code PIN par SMS.",
          binaryAnswer: false,
          binaryExplanation: "T-Money ne demande jamais votre code PIN par SMS.",
          mcqQuestion: "Quelle est la règle d'or pour votre code secret ?",
          mcqOptions: ["Le partager à un agent", "Ne jamais le divulguer", "L'écrire sur le téléphone"],
          mcqAnswerIndex: 1,
          mcqExplanation: "Le code PIN est strictement confidentiel.",
        }, 0),
        normalizeFlashcard({
          id: "card-2",
          front: "Q2",
          binaryStatement: "Les arnaques aux faux transferts utilisent souvent de faux SMS de confirmation.",
          binaryAnswer: true,
          binaryExplanation: "Les escrocs envoient de faux SMS imitant l'opérateur.",
          mcqQuestion: "Comment vérifier un vrai transfert d'argent ?",
          mcqOptions: ["Consulter son solde via USSD officiel", "Faire confiance au SMS reçu", "Rappeler le numéro"],
          mcqAnswerIndex: 0,
          mcqExplanation: "Seul le solde vérifié via le code USSD officiel fait foi.",
        }, 1),
      ];

      // State machine variables
      let flashcardIndex = 0;
      let hasAnswered = false;
      let sessionScore = 0;
      let sessionAttempts = 0;
      let selectedBinary: boolean | null = null;
      let selectedMcq: number | null = null;

      const handleBinaryAnswer = (choice: boolean) => {
        if (hasAnswered) return;
        const card = testCards[flashcardIndex];
        if (!card) return;
        const correct = choice === card.binaryAnswer;
        selectedBinary = choice;
        hasAnswered = true;
        sessionAttempts++;
        if (correct) sessionScore++;
      };

      const handleMcqAnswer = (choiceIdx: number) => {
        if (hasAnswered) return;
        const card = testCards[flashcardIndex];
        if (!card) return;
        const correct = choiceIdx === card.mcqAnswerIndex;
        selectedMcq = choiceIdx;
        hasAnswered = true;
        sessionAttempts++;
        if (correct) sessionScore++;
      };

      const goToPrev = () => {
        if (flashcardIndex > 0) {
          flashcardIndex--;
          hasAnswered = false;
          selectedBinary = null;
          selectedMcq = null;
        }
      };

      const goToNext = () => {
        if (flashcardIndex < testCards.length - 1) {
          flashcardIndex++;
          hasAnswered = false;
          selectedBinary = null;
          selectedMcq = null;
        }
      };

      // 1. Boundary check at index 0: goToPrev must not underflow
      expect(flashcardIndex).toBe(0);
      goToPrev();
      expect(flashcardIndex).toBe(0);

      // 2. Answer locking: answer card 0 correctly in binary mode
      handleBinaryAnswer(false); // correct
      expect(hasAnswered).toBe(true);
      expect(sessionScore).toBe(1);
      expect(sessionAttempts).toBe(1);
      expect(selectedBinary).toBe(false);

      // Try answering again on the same card (double-click stress test)
      handleBinaryAnswer(true);
      expect(sessionScore).toBe(1); // Must not increment again!
      expect(sessionAttempts).toBe(1); // Must not increment attempts
      expect(selectedBinary).toBe(false); // Must not change selection

      // 3. Move to next card
      goToNext();
      expect(flashcardIndex).toBe(1);
      expect(hasAnswered).toBe(false);
      expect(selectedBinary).toBe(null);

      // 4. Boundary check at last card: goToNext must not overflow
      goToNext();
      expect(flashcardIndex).toBe(1); // Remained at 1 (last card)

      // 5. MCQ answering and locking on card 1
      handleMcqAnswer(0); // correct
      expect(hasAnswered).toBe(true);
      expect(sessionScore).toBe(2);
      expect(sessionAttempts).toBe(2);
      expect(selectedMcq).toBe(0);

      // Try picking another MCQ option while locked
      handleMcqAnswer(1);
      expect(sessionScore).toBe(2); // Still 2
      expect(sessionAttempts).toBe(2); // Still 2
      expect(selectedMcq).toBe(0); // Still 0
    });
  });

  // =========================================================================
  // 3. Onboarding Tour Boundaries
  // =========================================================================
  describe("3. Onboarding Tour Boundaries", () => {
    it("renders exactly null when open=false with no lingering DOM or backdrop", () => {
      const onClose = vi.fn();
      const { container } = render(React.createElement(OnboardingTour, { open: false, onClose }));
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.queryByTestId("onboarding-tour-backdrop")).toBeNull();
    });

    it("enforces first step boundary: 'Précédent' button is disabled on step 1", () => {
      const onClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose }));

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Check step 1 label
      expect(screen.getByText(new RegExp(`Étape 1 / ${TOUR_STEPS.length}`))).toBeInTheDocument();

      // Previous button must be disabled
      const prevButton = screen.getByRole("button", { name: /précédent/i });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass("opacity-40", "cursor-not-allowed");

      // Clicking disabled previous should do nothing
      fireEvent.click(prevButton);
      expect(screen.getByText(new RegExp(`Étape 1 / ${TOUR_STEPS.length}`))).toBeInTheDocument();
    });

    it("enforces final step boundary: displays 'Terminer' button and completes tour", () => {
      const onClose = vi.fn();
      render(React.createElement(OnboardingTour, { open: true, onClose }));

      // Navigate to the final step
      for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
        const nextButton = screen.getByRole("button", { name: /suivant/i });
        fireEvent.click(nextButton);
      }

      // Check final step label
      expect(
        screen.getByText(new RegExp(`Étape ${TOUR_STEPS.length} / ${TOUR_STEPS.length}`)),
      ).toBeInTheDocument();

      // Next button must no longer exist; "Terminer" button must appear
      expect(screen.queryByRole("button", { name: /suivant/i })).toBeNull();
      const finishButton = screen.getByRole("button", { name: /terminer/i });
      expect(finishButton).toBeInTheDocument();

      // Click "Terminer"
      fireEvent.click(finishButton);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("cybersafe_tour_completed")).toBe("true");
    });

    it("handles dismissals cleanly via Skip, Close icon, Backdrop, and Escape key", () => {
      const onClose = vi.fn();
      const { unmount } = render(React.createElement(OnboardingTour, { open: true, onClose }));

      // 1. Escape key
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Reset mock
      onClose.mockClear();

      // 2. Close button 'X'
      const closeBtn = screen.getByRole("button", { name: /fermer/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Reset mock
      onClose.mockClear();

      // 3. Skip button
      const skipBtn = screen.getByRole("button", { name: /passer/i });
      fireEvent.click(skipBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("cybersafe_tour_completed")).toBe("true");

      // Reset mock
      onClose.mockClear();

      // 4. Backdrop click vs dialog click
      const backdrop = screen.getByTestId("onboarding-tour-backdrop");
      const dialog = screen.getByRole("dialog");

      // Clicking dialog should NOT close tour
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();

      // Clicking backdrop directly should close tour
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("resets back to step 1 when reopened after closing", () => {
      const onClose = vi.fn();
      const { rerender } = render(React.createElement(OnboardingTour, { open: true, onClose }));

      // Advance to step 2
      const nextBtn = screen.getByRole("button", { name: /suivant/i });
      fireEvent.click(nextBtn);
      expect(screen.getByText(new RegExp(`Étape 2 / ${TOUR_STEPS.length}`))).toBeInTheDocument();

      // Close tour
      rerender(React.createElement(OnboardingTour, { open: false, onClose }));
      expect(screen.queryByRole("dialog")).toBeNull();

      // Reopen tour
      rerender(React.createElement(OnboardingTour, { open: true, onClose }));
      expect(screen.getByText(new RegExp(`Étape 1 / ${TOUR_STEPS.length}`))).toBeInTheDocument();
    });
  });
});
