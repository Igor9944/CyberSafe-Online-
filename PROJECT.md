# Project: CyberSafe Online — Hackathon to SaaS Transition

## Architecture
CyberSafe Online is a full-stack cybersecurity awareness and anti-fraud platform built with:
- **Framework**: TanStack React Start (Nitro SSR + Vite) + TanStack Router (`@tanstack/react-router`)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React, Radix UI primitives, Neo-Brutalist Cyber aesthetic
- **State & Storage**: Client-side storage (`localStorage`) with backward-compatible runtime data normalizers
- **Execution & Tools**: Local project binaries in `./node_modules/.bin/` (`vite`, `vitest`, `tsc`) running on Node v26.12.0

### Data Flow & Component Hierarchy
```
RootShell (__root.tsx)
  └── AppShell (AppShell.tsx)
        ├── TopBar (Header, Logo, TourTrigger, ThemeToggle, MobileNav)
        ├── Sidebar (Brand, Logo, NavLinks, ModeBadge)
        ├── OnboardingTour (OnboardingTour.tsx - interactive, non-blocking)
        └── Route Content
              ├── / (Dashboard)
              ├── /apprendre (Learning, FlashCards Memo: Oui/Non & Bonne Réponse)
              ├── /sms, /qr, /audio (Security Scanners)
              ├── /assistant, /guide (Cyber Advisor & Reference)
              └── /a-propos (SaaS Product Mission & Architecture)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | PitchModal Removal | Delete `PitchModal.tsx` and all imports/state from `AppShell.tsx` | M1 | Survey R1 |
| F2 | Pitch 3-min Triggers Cleanup | Remove desktop and mobile 3-min pitch buttons and trophy icons | M1 | Survey R1 |
| F3 | Hackathon Rubric 20/20 Removal | Replace hackathon jury 20/20 scoring & chronometer panel in `/a-propos` with SaaS mission | M1 | Survey R1 |
| F4 | Codebase Hackathon Scrub | Remove hackathon markers, stickers, and outdated pitch texts in `qr.tsx`, `audio.tsx` (preserving `utterance.pitch`), `guide.tsx`, `index.tsx`, `apprendre.tsx`, `demo.ts`, `README.md` | M1 | Survey R1 |
| F5 | Vector Logo Modernization | Design modern vector SVG CyberSafe emblem and replace raster JPEG in `Logo.tsx` | M2 | Survey R4 |
| F6 | Logo Theme Adaptation & Clarity | Ensure logo renders cleanly without hardcoded `bg-white` box in dark sidebar and supports compact/extended modes | M2 | Survey R4 |
| F7 | Vector Favicon Integration | Create valid `favicon.svg` and `favicon.ico`, update `<head>` links in `__root.tsx` | M2 | Survey R4 |
| F8 | Guided Tour Architecture | Implement accessible, non-blocking `OnboardingTour.tsx` with multi-step walkthrough | M3 | Survey R2 |
| F9 | On-Demand Tour Trigger | Integrate tour trigger button in `AppShell` header and navigation | M3 | Survey R2 |
| F10 | Tour State & Interactivity | Support skip, step-by-step navigation, close at any time, non-blocking page resumption | M3 | Survey R2 |
| F11 | FlashCards Data Model Extension | Extend `Flashcard` schema with binary statement/feedback and MCQ question/options/explanation | M4 | Survey R3 |
| F12 | FlashCards Oui / Non Mode | Implement binary True/False mode with immediate success/error feedback and explanation | M4 | Survey R3 |
| F13 | FlashCards Bonne Réponse Mode | Implement MCQ mode with multiple options and immediate pedagogical explanation | M4 | Survey R3 |
| F14 | FlashCards Mode Switcher & Score | Add seamless mode switcher during sessions and unify scoring/progression metrics | M4 | Survey R3 |
| F15 | Dark Theme CSS Variables & Contrast | Fix `@custom-variant dark` in `styles.css`, define dark `--night`, `--night-foreground`, `--night-muted`, and crisp `--shadow-neo` | M5 | Survey R5 |
| F16 | Elimination of Glaring Dark Containers | Fix hardcoded `bg-white` boxes on banners (`index.tsx`, `a-propos.tsx`) and inverted white `CyberGlyph` | M5 | Survey R5 |
| F17 | System Theme Detection & FOUC Prevention | Implement `prefers-color-scheme` support and inline head script in `__root.tsx` | M5 | Survey R5 |
| F18 | E2E Testing Suite | Multi-tier test suite covering R1-R5 requirements with automated verification | E2E | Dual Track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Nettoyage Hackathon & Code (R1) | Delete `PitchModal.tsx`, scrub pitch references and 20/20 rubric | none | DONE |
| M2 | Modernisation Logo & Intégration Visuelle (R4) | Vector SVG logo, theme adaptability, favicons, banner harmonization | none | DONE |
| M3 | Visite Guidée Interactive (R2) | `OnboardingTour.tsx` implementation, trigger integration, non-blocking controls | M1 | DONE |
| M4 | Modes Avancés FlashCards (R3) | Dual modes (« Oui/Non » & « Bonne Réponse »), switcher, score progression | none | DONE |
| M5 | Amélioration Thème Sombre & Ergonomie (R5) | CSS variables, contrast enhancement, FOUC prevention, cyber-brutalist polish | M1, M2 | DONE |
| E2E | Opaque-Box E2E Testing Track | Automated test suite validating Tiers 1-4 for all requirements | none | PLANNED |
| M-FINAL | Final Integration & Adversarial Verification | 100% E2E tests pass, Tier 5 hardening, Forensic Integrity Audit | M1, M2, M3, M4, M5, E2E | PLANNED |

## Interface Contracts
### M1: Pitch Removal ↔ AppShell
- `AppShell.tsx`: No `PitchModal` import, no `pitchOpen` state, no `Pitch 3 min` buttons.
- Header button slots cleared for M3 Onboarding Tour trigger.

### M2: Logo ↔ Components
- `src/components/cs/Logo.tsx`: Exports `Logo({ className, variant, showText }: LogoProps)`.
- Renders vector SVG emblem with sharp theme-aware colors (no hardcoded `bg-white` wrapping).
- Favicon files: `public/favicon.svg` and `public/favicon.ico`.

### M3: Onboarding Tour ↔ AppShell
- `src/components/cs/OnboardingTour.tsx`: Exports `OnboardingTour({ open, onClose }: OnboardingTourProps)`.
- Triggered by dedicated button in header: `<button onClick={...}>🧭 Visite guidée</button>`.
- Non-blocking layout: Floating interactive card with step highlights, backdrop allows clicks outside or dismissal via Escape/Skip.

### M4: Flashcards ↔ Learning Route & Data
- `Flashcard` interface in `src/routes/apprendre.tsx`, `src/lib/demo.ts`, `src/server/gemma.ts`:
  ```typescript
  export interface Flashcard {
    id: string;
    front: string;
    back: string;
    mastered: boolean;
    binaryStatement?: string;
    binaryAnswer?: boolean;
    binaryExplanation?: string;
    mcqQuestion?: string;
    mcqOptions?: string[];
    mcqAnswerIndex?: number;
    mcqExplanation?: string;
  }
  ```
- Runtime normalizer: `normalizeFlashcard(raw: Partial<Flashcard>, index: number): Flashcard`.

### M5: Theme System ↔ Styles & Root
- `src/styles.css`: Custom variant `@custom-variant dark (&:where(.dark, .dark *));`.
- `.dark` class variables: `--night: oklch(0.20 0.04 260)`, `--night-foreground: oklch(0.96 0.01 255)`, `--night-muted: oklch(0.70 0.03 255)`, `--shadow-neo: 3px 3px 0px 0px rgba(0, 0, 0, 0.9)`.
- `src/routes/__root.tsx`: Inline theme initialization script in `<head>` checking `localStorage` and `prefers-color-scheme`.

## Code Layout
- `src/components/cs/`: Reusable CyberSafe UI components (`AppShell.tsx`, `Logo.tsx`, `OnboardingTour.tsx`, `CyberDecorations.tsx`)
- `src/routes/`: TanStack Router file-based pages (`__root.tsx`, `index.tsx`, `apprendre.tsx`, `a-propos.tsx`, etc.)
- `src/lib/`: Client utilities and datasets (`demo.ts`, `utils.ts`, `theme.ts`)
- `src/server/`: Server functions and AI logic (`gemma.ts`)
- `src/styles.css`: Tailwind CSS v4 variables and custom classes
- `public/`: Static assets (`favicon.svg`, `favicon.ico`)
- `tests/`: Automated unit and E2E test suites
