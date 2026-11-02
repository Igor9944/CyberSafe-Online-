# TEST_READY: Opaque-Box E2E Requirements Test Suite

**Project**: CyberSafe Online — Hackathon to SaaS Transition  
**Track**: Opaque-Box E2E Requirements Testing Track  
**Test Suite Path**: `src/test/e2e-requirements.test.ts`  
**Runner Command**: `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts`  
**Full Project Runner**: `./node_modules/.bin/vitest run`  
**Execution Environment**: Node v26.12.0, Vitest v4.1.12, jsdom  

---

## 1. Executive Summary

A comprehensive, multi-tiered, opaque-box E2E test suite has been designed and implemented in `src/test/e2e-requirements.test.ts`. The suite strictly evaluates the acceptance criteria specified in `ORIGINAL_REQUEST.md` and architecture contracts in `PROJECT.md` across all five core requirements (**R1** to **R5**).

The test suite consists of **61 automated test cases** (exceeding the >=60 requirement threshold) structured across 4 rigorous testing tiers.

### Current Baseline Execution Status
- **Total Test Cases**: 61
- **Passing (Baseline)**: 29 tests
- **Failing (Expected for PLANNED Milestones)**: 32 tests
- **Syntax / Transform Errors**: 0
- **Execution Time**: ~1.95s

As milestone implementations progress (M1 through M5), the failing tests serve as an automated acceptance gate that will turn green upon correct feature delivery.

---

## 2. Test Suite Architecture & Tier Breakdown

```
src/test/e2e-requirements.test.ts (61 tests)
├── Tier 1: Feature Coverage (25 tests)
│   ├── R1: Nettoyage Hackathon & Code (5 tests)
│   ├── R2: Visite Guidée (Onboarding Tour) (5 tests)
│   ├── R3: Modes Avancés FlashCards (5 tests)
│   ├── R4: Logo & Intégration Visuelle (5 tests)
│   └── R5: Thème Sombre & Ergonomie (5 tests)
├── Tier 2: Boundary & Corner Cases (25 tests)
│   ├── R1 Boundaries: Pitch Cleanup & Code Scrubbing (5 tests)
│   ├── R2 Boundaries: Tour Non-blocking & Lifecycle (5 tests)
│   ├── R3 Boundaries: Flashcard Data & State Resilience (5 tests)
│   ├── R4 Boundaries: SVG Scaling, Favicon & Contrast (5 tests)
│   └── R5 Boundaries: Theme Specificity, FOUC & Stability (5 tests)
├── Tier 3: Cross-Feature Combinations (Pairwise) (6 tests)
│   ├── R2 × R5: OnboardingTour in Dark Theme
│   ├── R3 × R5: Flashcards Dual Modes in Dark Theme
│   ├── R4 × R5: Vector Logo in Light & Dark Themes
│   ├── R1 × R2: Tour Trigger Header Replacement
│   ├── R2 × R3: Tour Steps Highlighting Learning Hub
│   └── R1 × R3: Learning Hub Scrubbed of Hackathon Artifacts
└── Tier 4: Real-World Application Scenarios (5 tests)
    ├── T4.1: New User Onboarding Walkthrough & Dismissal
    ├── T4.2: Student Flashcard Dual-Mode Session & Scoring
    ├── T4.3: Dark Theme Full Site Navigation & Visual Ergonomics
    ├── T4.4: Forensic Audit Confirming Zero Hackathon Markers
    └── T4.5: User Preferences & Learning Progress Persistence Cycle
```

---

## 3. Requirement Mapping & Feature Checklist

| Req | Feature Name | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) | Target Milestone |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **R1** | Nettoyage Hackathon & Code (No PitchModal, no 3-min pitch, no 20/20 rubric) | 5 tests | 5 tests | 2 tests | 1 test | M1 |
| **R2** | Visite Guidée Interactive (Onboarding Tour on-demand, skip, non-blocking) | 5 tests | 5 tests | 3 tests | 1 test | M3 |
| **R3** | Module FlashCards Avancé (Dual modes: « Oui/Non » & « Bonne Réponse », score) | 5 tests | 5 tests | 3 tests | 1 test | M4 |
| **R4** | Logo Vectoriel & Intégration Visuelle (SVG emblem, favicons, theme contrast) | 5 tests | 5 tests | 1 test | 1 test | M2 |
| **R5** | Thème Sombre & Ergonomie (Contrast, no white box artifacts, FOUC script) | 5 tests | 5 tests | 3 tests | 2 tests | M5 |

---

## 4. Test Specifications by Requirement

### R1: Nettoyage Hackathon & Code
- **T1.1_R1**: AppShell UI renders without PitchModal or pitch trigger buttons ("Pitch 3 min", "Aide de Pitch").
- **T1.2_R1**: About page (`/a-propos`) renders SaaS product mission without 20/20 hackathon rubric.
- **T1.3_R1**: Dashboard (`/`) renders clean product branding without "MLH × LBS 2026" stickers.
- **T1.4_R1**: Scanners (`/qr`, `/audio`) do not display pitch demo scenario labels ("pour le Pitch").
- **T1.5_R1**: Guide page (`/guide`) syntax criteria scrubbed of hackathon references.
- **T2.1_R1**: Preserves legitimate Web Speech API `utterance.pitch = 1.0` in `/audio` while scrubbing pitch mentions.
- **T2.2_R1**: AppShell header maintains layout integrity and button alignment after pitch button removal.
- **T2.3_R1**: `src/components/cs/PitchModal.tsx` file is deleted from repository.
- **T2.4_R1**: About page retains rich SaaS mission, Gemma 4 integration, and VirusTotal details.
- **T2.5_R1**: Zero obsolete hackathon TODO comments or temporary demo markers remain in source files.

### R2: Visite Guidée (Onboarding Tour)
- **T1.1_R2**: `OnboardingTour` component exported from `src/components/cs/OnboardingTour.tsx` and renders walkthrough.
- **T1.2_R2**: AppShell header integrates an on-demand tour trigger button ("Visite guidée").
- **T1.3_R2**: Tour enables progressive step-by-step navigation ("Suivant" / "Précédent").
- **T1.4_R2**: Tour provides an immediate Skip ("Passer") action calling `onClose`.
- **T1.5_R2**: Tour provides a dedicated close button ('X') that terminates the tour at any step.
- **T2.1_R2**: Tour backdrop is non-blocking: allows dismissal via click-outside or Escape key.
- **T2.2_R2**: Tour boundary navigation: "Précédent" button disabled on step 1; "Terminer" on final step.
- **T2.3_R2**: Tour completion state saved in localStorage (`cybersafe_tour_completed`), re-triggerable on demand.
- **T2.4_R2**: Tour renders `null` when `open=false` with zero residual backdrop or body scroll lock traps.
- **T2.5_R2**: Tour handles rapid open/close toggle cycles without state corruption or dangling timers.

### R3: Modes Avancés FlashCards
- **T1.1_R3**: Learning module provides explicit controls to toggle between « Oui / Non » and « Bonne Réponse » modes.
- **T1.2_R3**: « Oui / Non » mode renders binary statement with Vrai/Faux (Oui/Non) answer choices.
- **T1.3_R3**: « Oui / Non » mode provides immediate feedback (success/error) upon answering.
- **T1.4_R3**: « Bonne Réponse » mode presents multiple choice options (MCQ) for the question.
- **T1.5_R3**: « Bonne Réponse » mode displays detailed pedagogical explanation upon validation.
- **T2.1_R3**: Flashcard normalizer gracefully handles legacy cards missing binary/mcq fields.
- **T2.2_R3**: Mode switching mid-session preserves active course selection and progress.
- **T2.3_R3**: Answering card locks response to prevent multiple conflicting score increments.
- **T2.4_R3**: Empty course or 0-card state displays graceful empty state without crash.
- **T2.5_R3**: Flashcard navigation wraps or bounds cleanly at first and last card.

### R4: Logo & Intégration Visuelle
- **T1.1_R4**: Logo component renders an inline vector `<svg>` emblem instead of raster JPEG image.
- **T1.2_R4**: Logo is integrated in AppShell sidebar with brand typography ("CyberSafe Online").
- **T1.3_R4**: Logo is integrated in mobile header.
- **T1.4_R4**: Logo supports compact mode (`compact={true}`) for condensed display without distortion.
- **T1.5_R4**: Vector `favicon.svg` exists in `public/` directory and is linked in root `<head>`.
- **T2.1_R4**: Logo wrapper avoids hardcoded unadapted `bg-white` in dark theme.
- **T2.2_R4**: Vector logo SVG has valid `viewBox`, `xmlns`, and scalable vector attributes.
- **T2.3_R4**: Logo component accepts and merges custom `className` cleanly.
- **T2.4_R4**: Standalone `public/favicon.svg` is valid XML and contains scalable vector markup.
- **T2.5_R4**: Root `<head>` configures both SVG and ICO favicons with correct MIME types.

### R5: Thème Sombre & Ergonomie
- **T1.1_R5**: Theme toggle in AppShell toggles `dark` class on html root and updates `localStorage`.
- **T1.2_R5**: CSS `@custom-variant dark (&:where(.dark, .dark *));` defined in `src/styles.css`.
- **T1.3_R5**: Dark theme defines high-contrast palette tokens (`--night`, `--night-foreground`, `--night-muted`, `--shadow-neo`).
- **T1.4_R5**: Dashboard and About banner containers eliminate glaring hardcoded `bg-white` in dark mode.
- **T1.5_R5**: Neo-brutalist styling accents (`--shadow-neo`, sharp borders) are present.
- **T2.1_R5**: Inline `<head>` script in `src/routes/__root.tsx` executes synchronously to prevent FOUC.
- **T2.2_R5**: System theme detection falls back to `prefers-color-scheme: dark` when storage is unset.
- **T2.3_R5**: Theme toggle button includes accessible `aria-label="Basculer le thème"`.
- **T2.4_R5**: Dark theme text tokens ensure minimum WCAG AAA/AA legibility (no dark text on dark bg).
- **T2.5_R5**: Rapid consecutive theme toggles maintain synchronized state across all consumers.

---

## 5. Verification Commands

Run the E2E requirement suite:
```bash
./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts
```

Run in watch mode during development:
```bash
./node_modules/.bin/vitest src/test/e2e-requirements.test.ts
```

Run full project test suite:
```bash
./node_modules/.bin/vitest run
```
