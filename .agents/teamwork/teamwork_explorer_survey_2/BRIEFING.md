# BRIEFING — 2026-11-01T12:51:30Z

## Mission
Survey CyberSafe Online codebase for Requirement R3 (Modes avancés des FlashCards) and Requirement R2 (Visite guidée interactive), producing comprehensive analysis and handoff reports.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigator, synthesizer
- Working directory: /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_2
- Original parent: f1196ecd-9783-4010-bdd9-848bef435514
- Milestone: Phase 0 - Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any code or files outside working directory
- Write only to /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_2/
- Follow Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method)

## Current Parent
- Conversation ID: f1196ecd-9783-4010-bdd9-848bef435514
- Updated: 2026-11-01T12:43:18Z

## Investigation State
- **Explored paths**:
  - `src/routes/apprendre.tsx` (FlashCards implementation, student space, tabs, state management)
  - `src/server/gemma.ts` & `src/server/api-handler.ts` (Flashcard AI prompt generation & endpoints)
  - `src/lib/gemma-client.ts` (Client Flashcard generation API)
  - `src/lib/demo.ts` (Default courses datasets)
  - `src/routes/__root.tsx` & `src/components/cs/AppShell.tsx` (Layout, navigation, PitchModal triggers, theme)
  - `src/routes/index.tsx`, `guide.tsx`, `assistant.tsx` (Key UI entry points, cards, routes)
  - `src/styles.css`, `package.json`, `src/test/` (Dependencies, styles, vitest baseline)
- **Key findings**:
  - FlashCards currently only support passive front/back flipping without any evaluation, binary checks, or MCQ options.
  - FlashCards are stored in localStorage within `StoredCourseItem.flashcards`.
  - Demo courses have static content ready to be enriched with pre-seeded binary and MCQ datasets.
  - Gemma 4 generation can easily be prompt-engineered to output both binary and MCQ fields in strict JSON.
  - No existing tour/help library is installed, honoring the demo integrity rule (no 3rd-party core frameworks).
  - PitchModal (to be removed in R1) occupied sticky topbar & mobile header slots, which can be cleanly repurposed for the on-demand Onboarding Tour trigger.
  - An accessible, non-blocking custom React tour overlay (floating dock / card) ensures normal navigation is never impeded.
- **Unexplored areas**: None. All required areas for R3 and R2 have been thoroughly examined and verified.

## Key Decisions Made
- R3: Structured `Flashcard` data model to support both `binary*` and `mcq*` properties while maintaining backward compatibility with legacy `front`/`back`.
- R3: Implemented runtime adapter strategy (`normalizeFlashcard`) to guarantee valid binary and MCQ structures even for legacy or freshly uploaded courses.
- R3: Designed interactive mode switcher toggle bar preserving course session and card index with immediate educational feedback and unified score/mastery metrics.
- R2: Selected a bespoke, non-blocking floating tour component (`OnboardingTour`) with `useTour()` hook/context, accessible keyboard controls, skip/close at any time, and persistent completion in `localStorage`.
- R2: Repurposed header slot (previously "Pitch 3 min") and hero welcoming prompt to trigger the tour on-demand without blocking layout.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — persistent situational awareness
- progress.md — liveness heartbeat
- analysis.md — deep survey analysis report (writing now)
- handoff.md — 5-component handoff report (writing next)
