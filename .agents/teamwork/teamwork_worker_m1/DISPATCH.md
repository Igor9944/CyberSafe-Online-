## 2026-11-01T13:00:52Z
You are teamwork_worker for Milestone M1: Retrait des éléments de pitch et nettoyage du code (Requirement R1).
Your working directory is: /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m1/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read:
1. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/ORIGINAL_REQUEST.md
2. /home/ro0t_/Projects/les-bugs-busters/PROJECT.md
3. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_1/handoff.md

Exclusive File Ownership:
You have exclusive write access to:
- `src/components/cs/PitchModal.tsx`
- `src/components/cs/AppShell.tsx`
- `src/routes/a-propos.tsx`
- `src/routes/qr.tsx`
- `src/routes/audio.tsx` (CRITICAL: preserve `utterance.pitch = 1.0;` which is a SpeechSynthesis voice parameter!)
- `src/routes/guide.tsx`
- `src/routes/index.tsx`
- `README.md`
DO NOT modify any other files.

Tasks:
1. In `src/components/cs/AppShell.tsx`:
   - Remove `import { PitchModal } from "./PitchModal";`
   - Remove `pitchOpen` state (`const [pitchOpen, setPitchOpen] = useState(false);`)
   - Remove the mobile header button triggering the pitch modal (with Trophy icon and label/title "Aide de Pitch 3 min")
   - Remove the desktop top bar button with Trophy icon and "Pitch 3 min"
   - Remove the MLH x LBS sticker/badge and any hackathon badge
   - Remove `<PitchModal open={pitchOpen} onClose={() => setPitchOpen(false)} />`
   - Remove `src/components/cs/PitchModal.tsx` file (or empty/remove it if deletion is preferred)
2. In `src/routes/a-propos.tsx`:
   - Clean meta descriptions and headers referring to "Hackathon Build with Gemma", "Hack Day Lomé x LBS CS Club", etc.
   - Remove lines 89-187 (the entire Hackathon 20/20 evaluation rubric panel, 5 criteria cards, and 3-minute pitch chronometer).
   - Replace it with a professional presentation of CyberSafe Online as a permanent SaaS platform: Mission, Architecture anti-fraude, Protection citoyenne au Togo et en Afrique de l'Ouest, Éthique et transparence de l'IA.
3. Clean wording in:
   - `src/routes/qr.tsx` (replace "Exemples de démonstration pour le Pitch (1 clic) :" with "Exemples de démonstration rapide (1 clic) :")
   - `src/routes/audio.tsx` (replace "Scénarios d'appels réels au Togo (Prêts pour le Pitch en 1 clic) :" with "Scénarios d'appels réels au Togo (Prêts à tester en 1 clic) :", and NEVER touch `utterance.pitch = 1.0`)
   - `src/routes/guide.tsx` (clean hackathon mention line 99)
   - `src/routes/index.tsx` (clean "MLH x LBS 2026" sticker)
   - `README.md` (clean hackathon intro into a SaaS product overview)
4. Verification:
   - Execute `./node_modules/.bin/vitest run`
   - Execute `./node_modules/.bin/vite build`
   - Verify that grep for `PitchModal`, `3 minutes`, `barème 20`, `20/20` returns no hits in src/ (except legitimate code).
5. Write your handoff report to:
   `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m1/handoff.md`
6. Send a completion message to the orchestrator.
