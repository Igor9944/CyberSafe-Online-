# Handoff Report: Survey R2 — Progressive Web App (PWA) Installability

**Agent:** teamwork_explorer_survey_r2_2  
**Handoff Type:** Hard (Task complete)  
**Target:** orchestrator_r2 (`09a51586-56ab-4141-aa8e-08b3f69c9dc0`)  
**Artifact:** `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_r2_2/survey_report.md`  

---

## 1. Observation

- **Vite & Nitro Configuration (`vite.config.ts:7-57`)**: The project config imports `defineConfig` from `@lovable.dev/vite-tanstack-config`. The configuration states in lines 1-5:
  `// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually or the app will break with duplicate plugins: TanStack devtools ... tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target)...`
  Nitro builds using `cloudflare-module` preset.
- **Root Document Shell (`src/routes/__root.tsx:80-126`)**: There is no static `index.html` file in the project. The HTML document shell is dynamically created via `createRootRouteWithContext` in `src/routes/__root.tsx`. The `head` function defines `meta` and `links` arrays, and `RootShell` renders `<HeadContent />` and `<Scripts />`.
- **Static Assets in `public/` (`public/`)**: Current directory contents are `cybersafeimage2.jpeg`, `cybersafeimage.jpeg`, `favicon.ico`, `favicon.svg`, `robots.txt`. No `manifest.webmanifest`, `sw.js`, or `icons/` folder exists yet.
- **Nitro Asset Output (`.output/public/`)**: Running `./node_modules/.bin/vite build` succeeds and copies all files in `public/` directly to `.output/public/`. It generates `.output/public/_headers` applying immutable caching only to `/assets/*` (`/assets/* cache-control: public, max-age=31536000, immutable`), meaning `/manifest.webmanifest` and `/sw.js` are served without immutable cache headers.
- **AppShell UI (`src/components/cs/AppShell.tsx:172-272`)**: The desktop sticky bar is at lines 232-272, and the mobile sticky header is at lines 172-202. Both locations currently contain the tour trigger, theme toggle, and navigation triggers, and have clear layout space for an "Installer l'app" button.
- **Baseline Verification**:
  - Vitest test suite (`./node_modules/.bin/vitest run`): 10 test files, 137 passed (137 tests), 0 failures.
  - TypeScript type check (`./node_modules/.bin/tsc --noEmit`): Exits 0, 0 errors.
  - Vite build (`./node_modules/.bin/vite build`): Exits 0, generated `.output/public` and `.output/server`.
- **System Utilities**: The local system has `/usr/bin/convert`, `/usr/bin/magick`, and `/usr/bin/rsvg-convert` available for SVG-to-PNG icon generation.

---

## 2. Logic Chain

1. **Step 1 (Root Shell Integration)**: From observation of `src/routes/__root.tsx`, because TanStack Start uses programmatic head definitions rather than an `index.html` template, the PWA manifest link (`<link rel="manifest" href="/manifest.webmanifest">`), theme color (`<meta name="theme-color" content="#0f172a">`), and mobile tags must be registered inside `Route.head()`.
2. **Step 2 (Service Worker Scope)**: From observation of the Nitro static asset copy mechanism, placing `public/sw.js` and `public/manifest.webmanifest` ensures they are served at root URLs (`/sw.js` and `/manifest.webmanifest`). This gives the Service Worker top-level scope `/`, allowing it to control all navigation routes (`/sms`, `/qr`, `/assistant`, etc.).
3. **Step 3 (SSR Safety)**: From observation that TanStack Start performs SSR via Nitro Cloudflare workers, browser globals (`window`, `navigator`, `localStorage`, `matchMedia`, `serviceWorker`) are undefined on the server. Registration of the Service Worker and attachment of the `beforeinstallprompt` event listener must occur inside client-side `useEffect` hooks guarded by `typeof window !== "undefined"`.
4. **Step 4 (Caching Strategy)**: From observation of TanStack Start's client/server structure, navigation requests must use a Network-First strategy with fallback to cached shell (`/`) to preserve fresh SSR content while enabling offline loading. Static assets (CSS/JS/images) should use Stale-While-Revalidate or Cache-First. API routes (`/api/*`) must bypass caching.
5. **Step 5 (Install Prompt UX)**: Chromium fires `beforeinstallprompt` when installability criteria are met. By preventing default behavior (`e.preventDefault()`) and capturing the event in a `usePWAInstall` hook, CyberSafe Online can present a custom, neo-brutalist install button in the AppShell TopBar and Mobile Header/Drawer, calling `deferredPrompt.prompt()` and handling the user's choice. If the app is already in standalone mode, the prompt is suppressed.

---

## 3. Caveats

- **iOS WebKit Limitation**: iOS Safari does not fire the `beforeinstallprompt` event. For iOS users, the install UI must gracefully provide standard educational instructions (tap Share -> Add to Home Screen) rather than attempting to trigger a native prompt.
- **Development HTTP vs HTTPS**: Service workers require a secure origin (HTTPS or `localhost`). In development mode on `localhost:3000`, Chrome allows Service Worker registration and PWA installation without TLS.
- **External Libraries**: Avoid adding third-party Vite PWA plugins that wrap or alter the Vite plugin chain, as `@lovable.dev/vite-tanstack-config` manages the Nitro and Vite pipeline. A native Service Worker script in `public/sw.js` is simpler, 100% reliable, and completely decoupled from bundler quirks.

---

## 4. Conclusion

Requirement R2 is fully feasible and ready for milestone decomposition and worker implementation:
1. Create `public/manifest.webmanifest` and `public/manifest.json` conforming to W3C standards with icons (192, 512, maskable) and shortcuts.
2. Generate required PNG icons from vector emblem using `rsvg-convert` into `public/icons/`.
3. Create `public/sw.js` with network-first navigation and stale-while-revalidate static caching.
4. Update `src/routes/__root.tsx` `Route.head()` with manifest link and meta tags, and register the Service Worker in client `useEffect`.
5. Implement `src/hooks/usePWAInstall.ts` and integrate the install button into `src/components/cs/AppShell.tsx`.
6. Add PWA i18n keys to `src/locales/{fr,en,ee}.json`.
7. Add automated Vitest unit/e2e tests in `src/test/pwa-installable.test.ts`.

---

## 5. Verification Method

To independently verify the survey observations and findings:

1. **Verify TypeScript compilation**:
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ```
   *Expected result*: Exit code 0, no errors.
2. **Verify existing test suite**:
   ```bash
   ./node_modules/.bin/vitest run
   ```
   *Expected result*: All 137 tests pass.
3. **Verify Vite + Nitro build**:
   ```bash
   ./node_modules/.bin/vite build
   ```
   *Expected result*: Exit code 0, outputs generated in `.output/public` and `.output/server`.
4. **Inspect report**:
   View `/home/ro0t_/Projects/les-bugs-busters/.agents/teamwork/teamwork_explorer_survey_r2_2/survey_report.md`.
