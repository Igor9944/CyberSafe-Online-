# Handoff Report — Phase 0 Codebase Survey: Architecture, R1 (Pitch Cleanup) & R4 (Logo Modernization)

**Date**: 2026-11-01  
**From**: teamwork_explorer_survey_1  
**To**: orchestrator (parent: `f1196ecd-9783-4010-bdd9-848bef435514`)  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

### Codebase Architecture & Build/Test
- **Framework & Tooling**:
  - `package.json` lines 48-52: `@tanstack/react-start` (1.168.60), `@tanstack/react-router` (1.170.41), `@tailwindcss/vite` (4.2.1), `vite` (8.1.5), `nitro` (3.0.260603-beta).
  - Framework UI: `react` (19.2.0), `@google/genai` (2.32.0), `lucide-react` (0.575.0), `tw-animate-css` (1.3.4).
- **Runtime & Command Verification**:
  - Command: `node -v` output: `v26.12.0` at `/usr/bin/node`. Note that `npm` is not in the system `$PATH`, but local project binaries in `./node_modules/.bin/` execute directly without issue.
  - Test command: `./node_modules/.bin/vitest run`
    - Output: `Test Files 7 passed (7) | Tests 45 passed (45) | Duration 2.56s`
  - Build command: `./node_modules/.bin/vite build`
    - Output: Client build completed in 2.65s (`.output/public`), SSR Nitro build completed in 1.42s (`.output/server`). Exit code: 0.

### Requirement R1: Pitch Removal & Code Cleanup Observations
1. **`src/components/cs/PitchModal.tsx`**:
   - Lines 15-20: Component `PitchModal({ open, onClose }: PitchModalProps)`.
   - Lines 21-57: 180-second countdown timer for 3-minute pitch.
   - Lines 59-84: 4 pitch steps: `1. Le Problème Réel au Togo`, `2. Démo MVP Scanner SMS (Gemma 4)`, `3. Volet « Apprendre » (/apprendre)`, `4. Conclusion & Barème 20 / 20` (linking to `/a-propos`).
   - Line 96: `Aide de Pitch — 3 Minutes Chrono`.
   - Line 99: `Suivez le timing parfait pour impressionner le jury MLH & LBS CS Club`.
   - Line 187: `Équipe « Les Bugs Busters » — Lomé Business School`.
2. **`src/components/cs/AppShell.tsx`**:
   - Line 22: `import { PitchModal } from "./PitchModal";`
   - Line 37: `NAV_ITEMS` definition with `badge: "MVP"` for route `/sms`.
   - Line 100: `const [pitchOpen, setPitchOpen] = useState(false);`
   - Lines 174-175: Mobile header button triggering pitch modal: `onClick={() => setPitchOpen(true)} title="Aide de Pitch 3 min"` with `<Trophy className="size-4" />`.
   - Line 233: Top bar badge: `<CyberSticker tone="cyan" rotate="none">MLH × LBS 2026</CyberSticker>`.
   - Lines 241-245: Desktop top bar button: `onClick={() => setPitchOpen(true)}` containing `<Trophy className="size-3.5 text-amber-500" />` and `<span>Pitch 3 min</span>`.
   - Line 302: `<PitchModal open={pitchOpen} onClose={() => setPitchOpen(false)} />`.
3. **`src/routes/a-propos.tsx`**:
   - Lines 26-28: Meta description: `"Présentation du projet CyberSafe Online par l'équipe Les Bugs Busters pour le Hackathon Build with Gemma."`
   - Line 41: `title="À Propos & Grille d'Évaluation du Hackathon"`
   - Line 42: `subtitle="CyberSafe Online — Développé par l'équipe « Les Bugs Busters » lors du Hacktoberfest Hack Day Lomé × LBS CS Club."`
   - Lines 48-50: `<CyberSticker tone="yellow" icon={Trophy} rotate="none">MLH × LBS 2026</CyberSticker>`
   - Lines 89-187: Entire evaluation section:
     - Header: `Conformité Intégrale aux 5 Critères du Hackathon (20 / 20)`, `Vérification point par point des attentes du jury MLH & LBS CS Club`, sticker `Objectif 20/20`.
     - 5 criteria cards: `1. Compréhension du problème (4/4)`, `2. Innovation & Originalité (4/4)`, `3. Usage de Gemma (4/4)`, `4. Démo & Qualité Technique (4/4)` (`Démo 3 min Clé en Main`), `5. Impact & Respect des Règles (4/4)`.
     - 6th card (lines 171-185): `Chronomètre Pitch Démo`, `Script 3 Minutes Chrono (0:00 - 0:45 ... 2:30 - 3:00 : Impact direct & Barème 20/20)`.
4. **`src/routes/qr.tsx`**:
   - Line 363: `Exemples de démonstration pour le Pitch (1 clic) :`
5. **`src/routes/audio.tsx`**:
   - Line 482: `Scénarios d'appels réels au Togo (Prêts pour le Pitch en 1 clic) :`
   - Line 207: `utterance.pitch = 1.0;` (Verified: legitimate Web Speech API property for speech synthesis voice frequency, NOT a hackathon reference).
6. **`src/routes/guide.tsx`**:
   - Line 99: `Critère officiel d'évaluation de conformité syntaxique (Hackathon Build with Gemma)`
7. **`src/routes/index.tsx`**:
   - Line 141: `<CyberSticker tone="yellow" rotate="right">MLH × LBS 2026</CyberSticker>`
8. **`src/routes/apprendre.tsx`**:
   - Line 162: `courseTitle: "Sécurité des Paiements Mobiles (LBS)"`
9. **`src/lib/demo.ts`**:
   - Lines 37-38: Course id `"cyber-lbs"` and title `"Sécurité des Paiements Mobiles & Cryptographie (LBS)"`
10. **`README.md`**:
    - Lines 5-6, 41, 89: Hackathon mentions ("dans le cadre du HACKTOBERFEST By LBS (Lome Business School)").
11. **Orphan Assets & Cleanliness**:
    - Asset `src/assets/hero-shield.jpg` (92 kB) is unreferenced throughout the entire project.
    - Duplicate files `cybersafeimage.jpeg` and `cybersafeimage2.jpeg` sit in the root workspace `/home/ro0t_/Projects/les-bugs-busters/` in addition to `public/` and `src/assets/`.
    - No dangling `TODO`, `FIXME`, or `console.log` left in the production source files.

### Requirement R4: Logo & Visual Integration Observations
1. **Existing Logo Files**:
   - `src/assets/cybersafeimage.jpeg`: 15,150 bytes, 736x736 pixel JPEG with a solid white/light background. Depicts a black emblem (diamond head + infinity knot ribbon loop).
   - `src/assets/cybersafeimage2.jpeg`: 125,893 bytes, 1536x1024 pixel JPEG with white background, emblem + "CYBERSAFE ONLINE" brand banner.
   - `public/favicon.ico`: 15,150 bytes. Binary identical to `cybersafeimage.jpeg` (JPEG image saved with .ico extension).
   - `src/routes/__root.tsx` lines 94-96:
     ```tsx
     { rel: "icon", href: "/cybersafeimage.jpeg", type: "image/jpeg" },
     { rel: "shortcut icon", href: "/cybersafeimage.jpeg" },
     { rel: "apple-touch-icon", href: "/cybersafeimage.jpeg" },
     ```
2. **Current Logo Component & Visual Bottlenecks (`src/components/cs/Logo.tsx`)**:
   - Lines 7-13:
     ```tsx
     <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-glow ring-1 ring-white/20 transition-transform duration-200 hover:scale-105">
       <img src={logoMark} alt="CyberSafe Online Logo" className="size-full object-contain" />
     </div>
     ```
   - In dark mode, because the JPEG has a non-transparent white background, it requires an artificial `bg-white` container box that sticks out sharply in the dark sidebar (`bg-sidebar`).
   - Renders in 3 places in `src/components/cs/AppShell.tsx`:
     - Line 132: Desktop Sidebar header (`<Logo />`)
     - Line 169: Mobile sticky header (`<Logo />`)
     - Line 203: Mobile navigation drawer (`<Logo />`)
   - Large banner image used in `src/routes/index.tsx` (line 192) and `src/routes/a-propos.tsx` (line 58).

---

## 2. Logic Chain

1. **Premise 1 (From Observations 1 & 2)**: `PitchModal.tsx` is an isolated component invoked exclusively in `AppShell.tsx` via `pitchOpen` and two trigger buttons (one in desktop top bar, one in mobile header).
   - *Inference*: Removing `PitchModal.tsx` and its references from `AppShell.tsx` will cleanly eliminate all runtime modal occurrences without breaking any route or feature. Furthermore, the vacated header space can directly accommodate the Onboarding Tour trigger button (Requirement R2).
2. **Premise 2 (From Observation 3)**: In `src/routes/a-propos.tsx`, lines 89-187 form an entire `<Panel>` explicitly dedicated to the hackathon's "Barème 20/20", jury criteria, and a 3-minute pitch chronometer.
   - *Inference*: Deleting this panel and replacing it with a professional product mission presentation (anti-fraud architecture, community security in Togo/West Africa, AI transparency) fulfills Acceptance Criterion R1 without altering application routing (`/a-propos` route remains healthy).
3. **Premise 3 (From Observations 4, 5, 6, 7, 8, 9, 10)**: Minor wording remnants ("pour le Pitch", "Hackathon Build with Gemma", "MLH × LBS 2026", "MVP" badge, "(LBS)") exist across `qr.tsx`, `audio.tsx`, `guide.tsx`, `index.tsx`, `apprendre.tsx`, `demo.ts`, and `README.md`.
   - *Inference*: Updating these 7 locations to neutral SaaS terminology ("pour l'analyse en 1 clic", "Référentiel officiel", "Plateforme SaaS 2026") cleanly scrubs hackathon residue without touching core business logic or risking regressions.
4. **Premise 4 (From Observation 5b)**: `utterance.pitch = 1.0` in `audio.tsx:207` is an audio speech synthesis parameter.
   - *Inference*: Modifying or deleting this line would break audio synthesis functionality. It must remain untouched.
5. **Premise 5 (From Observations on Logo & Branding)**: The current logo is a raster JPEG (`cybersafeimage.jpeg`) placed inside a `bg-white` box, and the favicon is an invalid raw JPEG pretending to be an ICO file.
   - *Inference*: Crafting a modern vector SVG representation of the CyberSafe emblem and integrating it into `Logo.tsx` with dynamic light/dark styling (e.g. electric cyan and neon lime accents on dark mode, deep slate on light mode) will eliminate the unsightly white square in the sidebar, ensure crisp scaling at all dimensions, and provide a valid SVG favicon (`/favicon.svg`) in `__root.tsx`.

---

## 3. Caveats

- **Network-dependent Gemma test**: In `src/test/gemma-api.test.ts`, tests against the live Google Gemini API gracefully log `Environnement sans accès réseau sortant direct : test en ligne ignoré` when offline and pass cleanly. Any new tests written should maintain this mock/graceful fallback pattern.
- **Git history preservation**: As mandated by `AGENTS.md`, Lovable is connected. No force pushing or rebasing should be performed by subsequent implementation agents.
- **`routeTree.gen.ts`**: Auto-generated by TanStack Router. Edits must be made to route files (`src/routes/*.tsx`), never directly to `routeTree.gen.ts`.

---

## 4. Conclusion

- **Codebase Readiness**: The application is in excellent technical health. Build and test suites pass 100% out-of-the-box.
- **R1 Scope**: Exactly 1 component (`PitchModal.tsx`), 1 parent component (`AppShell.tsx`), 6 route files (`a-propos.tsx`, `qr.tsx`, `audio.tsx`, `guide.tsx`, `index.tsx`, `apprendre.tsx`), 1 mock data file (`demo.ts`), and `README.md` require updates. No deep refactoring is needed.
- **R4 Scope**: Create a vectorized, theme-adaptive SVG logo component in `Logo.tsx`, create SVG/ICO favicons in `public/`, update `<head>` links in `__root.tsx`, and polish brand banner containers in `index.tsx` and `a-propos.tsx`.
- **Implementation path**: The transition from hackathon demo to permanent SaaS product can proceed smoothly with zero architecture risk.

---

## 5. Verification Method

To independently verify the investigation findings and ensure no regressions during subsequent implementation:

1. **Verify Test Suite**:
   ```bash
   ./node_modules/.bin/vitest run
   ```
   *Expected*: 7 test files, 45 tests passing.
2. **Verify Production Build**:
   ```bash
   ./node_modules/.bin/vite build
   ```
   *Expected*: Exit code 0, client and SSR bundles generated in `.output/`.
3. **Verify Removal of Pitch & Hackathon Terms**:
   ```bash
   grep -riE "(PitchModal|3 minutes chrono|barème 20|barème 20/20|hackathon build with gemma|MLH × LBS)" src/
   ```
   *Expected*: Zero matches (excluding SpeechSynthesis audio pitch).
4. **Verify Logo Rendering & Theme Adaptability**:
   - Inspect `src/components/cs/Logo.tsx` and confirm no hardcoded `bg-white` container remains on dark theme.
   - Inspect `src/routes/__root.tsx` and confirm valid vector favicon link (`/favicon.svg` or proper `.ico`).
