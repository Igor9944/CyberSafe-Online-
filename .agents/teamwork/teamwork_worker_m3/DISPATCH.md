## 2026-11-01T13:15:30Z
You are teamwork_worker for Milestone M3: Visite guidée interactive (Requirement R2).
Your working directory is: /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m3/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read:
1. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/ORIGINAL_REQUEST.md
2. /home/ro0t_/Projects/les-bugs-busters/PROJECT.md
3. /home/ro0t_/Projects/les-bugs-busters/TEST_READY.md
4. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_2/handoff.md

Exclusive File Ownership:
You have exclusive write access to:
- `src/components/cs/OnboardingTour.tsx`
- `src/components/cs/AppShell.tsx`
DO NOT modify any other files.

Tasks:
1. Implement `src/components/cs/OnboardingTour.tsx`:
   - Export `export interface OnboardingTourProps { open: boolean; onClose: () => void; }` and `export function OnboardingTour({ open, onClose }: OnboardingTourProps)`.
   - Interactive, accessible, multi-step guided tour:
     * Step progression: Step indicator (e.g. "1 / 6"), "Suivant" button, "Précédent" button (disabled on step 1), "Terminer" on final step.
     * Skip option: "Passer la visite" button calling `onClose`.
     * Close button ('X') and `Escape` key handler calling `onClose`.
     * Non-blocking design: floating card / overlay that does NOT trap or freeze normal page navigation when dismissed or closed.
     * Remembers completion in `localStorage` under `cybersafe_tour_completed = "true"`.
     * If `open === false`, renders `null` without residual backdrops or scroll locks.
   - 6 Educational Steps:
     1. Bienvenue sur CyberSafe Online (Votre bouclier personnel contre les cyberfraudes).
     2. Scanners Phishing & SMS (Analyse intelligente des messages frauduleux en français et langues locales).
     3. Détecteurs QR & Audio (Vérification des QR codes malveillants et simulations d'appels d'ingénierie sociale).
     4. Espace d'Apprentissage & FlashCards (Modes d'entraînement interactifs Oui/Non et Bonne Réponse).
     5. Assistant Cyber & Référentiel (Conseils en direct et syntaxe officielle des opérateurs).
     6. Thème & Paramètres (Bascule claire/sombre cyber et personnalisation de votre espace).
2. Integrate in `src/components/cs/AppShell.tsx`:
   - Import `OnboardingTour`.
   - Add state `const [tourOpen, setTourOpen] = useState(false);`.
   - On initial mount, if `localStorage.getItem("cybersafe_tour_completed") !== "true"`, auto-open the tour.
   - Add dedicated on-demand trigger buttons:
     * In desktop top bar: `<button onClick={() => setTourOpen(true)} ...>🧭 Visite guidée</button>`.
     * In mobile header: icon button with Compass or HelpCircle, `onClick={() => setTourOpen(true)}`, `aria-label="Visite guidée"`.
   - Render `<OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />`.
3. Verification:
   - Run `./node_modules/.bin/vitest run --exclude "**/e2e-requirements.test.ts"`
   - Run `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts -t "R2"`
   - Run `./node_modules/.bin/vite build`
4. Write handoff report to:
   `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m3/handoff.md`
5. Send completion message to orchestrator.
