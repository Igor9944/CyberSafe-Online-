## 2026-11-01T13:32:39Z
You are teamwork_worker for Milestone M5: Amélioration du thème sombre et ergonomie (Requirement R5).
Your working directory is: /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m5/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read:
1. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/ORIGINAL_REQUEST.md
2. /home/ro0t_/Projects/les-bugs-busters/PROJECT.md
3. /home/ro0t_/Projects/les-bugs-busters/TEST_READY.md
4. /home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_3/handoff.md

Exclusive File Ownership:
You have exclusive write access to:
- `src/styles.css`
- `src/components/cs/CyberDecorations.tsx`
- `src/components/ui/button.tsx`
- `src/routes/index.tsx`
- `src/routes/a-propos.tsx`
DO NOT modify any other files.

Tasks:
1. `src/styles.css`:
   - Change `@custom-variant dark (&:is(.dark *));` to `@custom-variant dark (&:where(.dark, .dark *));`.
   - In the `.dark` class block:
     * Define the missing tokens:
       `--night: oklch(0.20 0.04 260);` (providing clear visual contrast against `--background: oklch(0.14 ...)`).
       `--night-foreground: oklch(0.97 0.01 255);`
       `--night-muted: oklch(0.72 0.04 258);`
       `--sidebar-accent: oklch(0.25 0.05 260);`
       `--gradient-hero: linear-gradient(135deg, oklch(0.20 0.04 260), oklch(0.14 0.03 260));`
     * Fix `--shadow-neo`: replace milky white 35% shadow (`rgba(255, 255, 255, 0.35)`) with crisp neo-brutalist offset shadow: `3px 3px 0px 0px rgba(0, 0, 0, 0.95)`.
     * Ensure text contrast tokens meet WCAG AA/AAA legibility (no dark-on-dark text, `--muted-foreground` clean and readable).
2. `src/components/cs/CyberDecorations.tsx`:
   - Line 351: In `CyberGlyph`, fix the `dark` variant. It currently forces `dark:bg-white dark:text-slate-950` which creates an eye-straining white square in dark mode. Change to a crisp cyber-dark aesthetic:
     `dark:bg-slate-900 dark:text-cyan-400 dark:border-cyan-400/60 dark:shadow-[2.5px_2.5px_0px_0px_#06b6d4]`.
   - Polish badges and stickers to have clear borders and shadows under dark mode.
3. `src/components/ui/button.tsx`:
   - In the `sticker` variant, ensure borders and shadows adapt cleanly to dark mode.
4. `src/routes/index.tsx` & `src/routes/a-propos.tsx`:
   - In `index.tsx`: change the container wrapping the banner image (line ~190) from `bg-white` to `bg-card dark:bg-slate-900 border-2 border-border shadow-neo`.
   - In `a-propos.tsx`: change the container wrapping the banner image (line ~56) from `bg-white` to `bg-card dark:bg-slate-900 border-2 border-border shadow-neo`.
5. Verification:
   - Run `./node_modules/.bin/vitest run --exclude "**/e2e-requirements.test.ts"`
   - Run `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts -t "R5"`
   - Run `./node_modules/.bin/vite build`
6. Write handoff report to:
   `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_worker_m5/handoff.md`
7. Send completion message to orchestrator.
