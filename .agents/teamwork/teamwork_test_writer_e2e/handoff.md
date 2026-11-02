# Handoff Report: E2E Requirements Test Suite

**Agent**: `teamwork_test_writer` (E2E Testing Track)  
**Date**: 2026-11-01T13:13:45Z  
**Working Directory**: `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_test_writer_e2e/`  
**Deliverables**:
- `src/test/e2e-requirements.test.ts` (61 automated tests across 4 tiers)
- `/home/ro0t_/Projects/les-bugs-busters/TEST_READY.md` (Readiness report & tier breakdown)

---

## 1. Observation

1. **Initial Requirement Scope**:
   From `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/ORIGINAL_REQUEST.md` (lines 13-55) and `TEST_INFRA.md` (lines 8-28), 5 core requirements must be tested across 4 tiers with >=60 tests:
   - R1: Nettoyage Hackathon & Code (No PitchModal, no 3-min pitch, no 20/20 rubric, no hackathon markers)
   - R2: Visite Guidée (Onboarding Tour on-demand, skip, step-by-step progress, closeable, non-blocking)
   - R3: Module FlashCards (Dual modes: « Oui / Non » & « Bonne Réponse », mode switching, score progression)
   - R4: Logo & Intégration Visuelle (Vector SVG logo, theme adaptability, favicons)
   - R5: Thème Sombre & Ergonomie (High contrast, no dark text on dark bg, no blinding white boxes, cyber/neo-brutalist styling)

2. **Node 26 & Parser Specifics**:
   - Running `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts` initially produced:
     `[PARSE_ERROR] Expected '>' but found 'Identifier'` when raw JSX was included in a `.ts` file.
   - Node 26.12.0 emitted `ExperimentalWarning: localStorage is not available because --localstorage-file was not provided`, causing `localStorage.getItem` to throw `TypeError: Cannot read properties of undefined` in jsdom unless mocked on `globalThis` and `window`.
   - Vite's static `import-analysis` threw `Failed to resolve import "@/components/cs/OnboardingTour"` when statically importing uncreated milestone files.

3. **Current Test Execution Results**:
   Running `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts`:
   - Duration: 1.95s
   - Total Tests: 61 tests
   - Passed: 29 tests
   - Failed: 32 tests (specifically testing features planned for milestones M1 through M5)
   - Running full suite `./node_modules/.bin/vitest run`:
     8 test files, 106 total tests (74 passed, 32 failed belonging to pre-implementation e2e gates, zero collateral breakage).

---

## 2. Logic Chain

1. **Test Design & Structure (Observation 1)**:
   - To achieve >= 60 tests with balanced depth, 61 tests were authored across 4 distinct tiers:
     - **Tier 1 (Feature Coverage)**: 25 tests (5 tests for each requirement R1 to R5).
     - **Tier 2 (Boundary & Corner Cases)**: 25 tests (5 edge cases for each requirement R1 to R5).
     - **Tier 3 (Cross-Feature Combinations)**: 6 tests covering pairwise interactions (Tour × Dark theme, Flashcards × Dark theme, Logo × Light/Dark, Tour trigger header replacement, Tour × Learning hub, Hackathon scrub × Learning hub).
     - **Tier 4 (Real-World Application Scenarios)**: 5 end-to-end user workflows (New user onboarding walkthrough, student dual-mode flashcard session, dark theme full site navigation, forensic hackathon audit, preference & progress persistence cycle).

2. **Parser & Environment Normalization (Observation 2)**:
   - Converted all React DOM rendering calls within `src/test/e2e-requirements.test.ts` to `React.createElement(...)` to guarantee 100% compliance with Vite's oxc `.ts` parser.
   - Polyfilled `localStorage` on both `globalThis` and `window` with in-memory backing store to ensure compatibility with Node v26.12.0 experimental storage.
   - Introduced `loadOptionalModule(relPath)` with `/* @vite-ignore */` and filesystem existence checks. When milestone implementation files (like `src/components/cs/OnboardingTour.tsx`) are not yet created, the test cleanly fails assertion against the contract rather than crashing the bundler.

3. **Baseline Validation (Observation 3)**:
   - Tests validating completed/baseline behaviors (e.g., speech synthesis `utterance.pitch` preservation, theme toggle state, neo-brutalist shadow tokens, legacy flashcard normalization, brand typography in sidebar) pass immediately (29 tests).
   - Tests validating unmerged milestone features (M1 forensic scrub of secondary routes, M2 vector SVG logo & favicons, M3 OnboardingTour component & header trigger, M4 dual-mode flashcards, M5 `:where` variant and banner dark adaptations) fail cleanly as expected acceptance gates (32 tests).

---

## 3. Caveats

- **Mocked Router Context**: To ensure fast, headless, opaque-box component testing without requiring an active browser or web server, `@tanstack/react-router`'s `useRouterState` and `Link` are mocked within the test file. Full browser routing integration is verified in `src/test/app-routing.test.tsx`.
- **Pre-Implementation Milestone Failures**: The 32 failing tests are expected and intended at this phase. They will sequentially transition to passing as the orchestrator dispatches and merges milestones M1 through M5.

---

## 4. Conclusion

The opaque-box E2E test suite is fully implemented, verified, and ready in `src/test/e2e-requirements.test.ts`. It provides 61 requirement-driven test cases covering R1 through R5 across all 4 tiers without regressions to existing workspace tests. `TEST_READY.md` has been published at the project root.

---

## 5. Verification Method

1. **Run E2E Requirements Test Suite**:
   ```bash
   ./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts
   ```
   *Expected outcome*: 61 tests executed (29 passed, 32 failed corresponding to planned milestones M1-M5).

2. **Run Full Workspace Test Suite**:
   ```bash
   ./node_modules/.bin/vitest run
   ```
   *Expected outcome*: 8 test files executed (7 existing test suites pass 100% with 45 passed tests).

3. **Inspect Published Deliverables**:
   - `src/test/e2e-requirements.test.ts`
   - `/home/ro0t_/Projects/les-bugs-busters/TEST_READY.md`
