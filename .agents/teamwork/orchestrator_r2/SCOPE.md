# Scope: CyberSafe Online — Round 2 (Logo, PWA, Animations, Mobile & Qualité)

## Architecture
CyberSafe Online Round 2 upgrades the visual identity, web app capabilities, interactive physics, and cross-device ergonomics of the SaaS platform:
- **Visual Identity (R1)**: Modern vector SVG emblem representing three hands interlocked in a triangular bond (C3 rotational symmetry, 2-layer forearm & clasping hand vector geometry), supporting responsive sizes (`sm`, `md`, `lg`) and theme variants (`light`, `dark`, `electric`) in `src/components/cs/Logo.tsx`, alongside high-res multi-platform favicons and app icons in `public/`.
- **Progressive Web App (R2)**: W3C compliant `public/manifest.webmanifest` & `public/manifest.json`, root-scoped Service Worker (`public/sw.js`) with smart offline caching (stale-while-revalidate for assets, network-first for navigation, network-only for API), SSR-safe registration in `src/routes/__root.tsx`, and interactive `usePWAInstall` hook with ergonomic install buttons in `AppShell.tsx`.
- **Micro-interactions & Animations (R3)**: Neo-brutalist tactile physics in `src/styles.css` and UI components (buttons, cards, stickers, badges) with crisp offsets (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`), fluid entrance utilities (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-pulse-glow`), and strict `@media (prefers-reduced-motion: reduce)` accessibility compliance.
- **Mobile & Tablet Optimization (R4)**: `viewport-fit=cover` in `__root.tsx`, safe-area insets (`env(safe-area-inset-*)`) on mobile headers, drawers, and bottom navigation bars, touch targets >= 44x44px across all interactive controls, and prevention of horizontal overflow on narrow screens.
- **Quality & Non-Regression (R5)**: 100% passing Vitest test suite (baseline 137 tests preserved + new R1-R4 test specifications), 0 TypeScript errors (`tsc --noEmit`), clean production SSR & client build (`vite build`), and clean Forensic Integrity Audit.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F19 | Modern Vector SVG Logo (Three Hands in Triangle) | Design and implement modern vector SVG emblem representing 3 hands interlocked in a triangle, supporting responsive dimensions (`sm`, `md`, `lg`) and style variants (`light`, `dark`, `electric`) with neo-brutalist accents in `src/components/cs/Logo.tsx`. Preserves 100% compatibility with existing test invariants (`viewBox="0 0 48 48"`, `shieldGradDark`/`shieldGradLight`, container styling). | M6 | Survey R1 |
| F20 | Modern Multi-Resolution Favicons & App Icons | Generate `public/favicon.svg`, multi-resolution `public/favicon.ico` (16x16, 32x32, 48x48), high-resolution PWA icons (`icon-192x192.png`, `icon-512x512.png`), maskable icon (`icon-maskable-512x512.png`), and `apple-touch-icon.png` (180x180). | M6 | Survey R1 |
| F21 | W3C Web App Manifest & SSR Head Metadata | Create `public/manifest.webmanifest` and `public/manifest.json` with required metadata (`display: standalone`, `theme_color`, `background_color`, `icons`, `shortcuts`). In `src/routes/__root.tsx`, link manifest and inject mobile web app meta tags in `Route.head()`. | M7 | Survey R2 |
| F22 | Service Worker & Offline Caching Engine | Implement `public/sw.js` with root scope (`/`), stale-while-revalidate for static assets, network-first for navigation, network-only for `/api/`, and SSR-safe client registration in `src/routes/__root.tsx`. | M7 | Survey R2 |
| F23 | Interactive PWA Install Prompt UI | Implement `src/hooks/usePWAInstall.ts` capturing `beforeinstallprompt`, handling native prompt, standalone detection, and iOS Safari guidance. Integrate ergonomic install button in `src/components/cs/AppShell.tsx` (desktop TopBar and mobile Header/Drawer). | M7 | Survey R2 |
| F24 | Neo-Brutalist Animations & Prefers-Reduced-Motion | Add keyframes and utilities (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-pulse-glow`) in `src/styles.css`. Apply tactile micro-interactions (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`) to buttons, cards, stickers, and badges. Implement `@media (prefers-reduced-motion: reduce)` resets. | M8 | Survey R3 |
| F25 | Mobile & Tablet Responsiveness, Safe-Areas & Touch Ergonomics | Add `viewport-fit=cover` in `__root.tsx`, declare safe-area utilities in `styles.css`, apply safe-area insets to mobile header, drawer, and bottom navigation in `AppShell.tsx`. Ensure all touch targets >= 44x44px and eliminate horizontal scroll on small viewports. | M9 | Survey R4 |
| F26 | Round 2 E2E Test Suite, Non-regression & Forensic Audit | Author comprehensive Vitest test suite (`src/test/r2-features.test.ts`), verify all 137 baseline tests pass, verify `tsc --noEmit` clean, verify `vite build` clean, and pass Forensic Integrity Audit. | M10 | Survey R5 |

---

## Milestones
| # | Name | Scope | Dependencies | Status | Exclusive File Ownership |
|---|------|-------|-------------|--------|--------------------------|
| M6 | Modern Vector SVG Logo & Favicons (R1) | F19, F20: `src/components/cs/Logo.tsx`, `public/favicon.svg`, `public/favicon.ico`, `public/icons/*` | none | PLANNED | `src/components/cs/Logo.tsx`, `public/favicon.svg`, `public/favicon.ico`, `public/icons/*` |
| M7 | Progressive Web App (PWA) & Install Prompt (R2) | F21, F22, F23: `public/manifest.webmanifest`, `public/manifest.json`, `public/sw.js`, `src/hooks/usePWAInstall.ts`, `src/routes/__root.tsx` (head & SW registration), `src/components/cs/AppShell.tsx` (install button) | M6 | PLANNED | `public/manifest.*`, `public/sw.js`, `src/hooks/usePWAInstall.ts` |
| M8 | Neo-brutalist Animations & Micro-interactions (R3) | F24: `src/styles.css`, `src/components/ui/button.tsx`, `src/components/cs/CyberDecorations.tsx`, `src/components/cs/ui.tsx`, `src/components/ui/badge.tsx` | none | PLANNED | `src/styles.css`, `src/components/ui/button.tsx`, `src/components/cs/CyberDecorations.tsx`, `src/components/ui/badge.tsx` |
| M9 | Full Mobile & Tablet Responsiveness (R4) | F25: `src/routes/__root.tsx` (viewport-fit), `src/components/cs/AppShell.tsx` (safe-areas & 44px touch targets), mobile layout polish | M7, M8 | PLANNED | `src/components/cs/AppShell.tsx`, `src/routes/__root.tsx` |
| M10 | Final E2E Suite, Non-regression & Forensic Audit (R5) | F26: Automated test suite, full regression suite, `tsc --noEmit`, `vite build`, Challenger verification, Forensic Integrity Audit | M6, M7, M8, M9 | PLANNED | `src/test/r2-features.test.ts` |

---

## Interface Contracts
### M6: Logo & Icons Contract
- `src/components/cs/Logo.tsx`:
  - Exports `Logo({ className, variant = "default", size = "md", showText = true, compact }: LogoProps)`
  - Exports `CyberSafeEmblem({ className, variant, size }: CyberSafeEmblemProps)`
  - Supports `size`: `"sm"` (32px), `"md"` (40px default), `"lg"` (56px)
  - Supports `variant`: `"default"`, `"light"`, `"dark"`, `"electric"`
  - Renders vector SVG emblem with 3 interlocking hands in a triangle
  - Maintains `viewBox="0 0 48 48"` and gradient definitions `shieldGradDark`, `shieldGradLight` for backward compatibility with baseline tests.
- Static assets in `public/`:
  - `favicon.svg` (SVG vector icon)
  - `favicon.ico` (multi-res ICO: 16, 32, 48px)
  - `icons/icon-192x192.png`, `icons/icon-512x512.png`, `icons/icon-maskable-512x512.png`, `icons/apple-touch-icon.png`

### M7: PWA & Service Worker Contract
- `public/manifest.webmanifest`: Valid W3C JSON with `display: "standalone"`, `theme_color: "#0f172a"`, `background_color: "#090d16"`.
- `public/sw.js`: Service worker implementing `install`, `activate`, and `fetch` (network-first for navigate, stale-while-revalidate for assets, network-only for `/api/`).
- `src/hooks/usePWAInstall.ts`:
  - Exports `usePWAInstall()` returning `{ isInstallable: boolean, isInstalled: boolean, isIOS: boolean, promptInstall: () => Promise<string> }`.
- `src/routes/__root.tsx`:
  - SSR `<head>` links: `<link rel="manifest" href="/manifest.webmanifest">`, Apple touch icons, theme-color meta tags.
  - Client-side `useEffect` registering `/sw.js` with scope `/`.

### M8: Neo-brutalist Animations Contract
- `src/styles.css`:
  - Declares `@utility animate-fade-in`, `@utility animate-slide-up`, `@utility animate-scale-in`, `@utility animate-pulse-glow`.
  - Declares `@media (prefers-reduced-motion: reduce)` setting `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`, `transition-duration: 0.01ms !important`, `scroll-behavior: auto !important`.
- Interactive components:
  - Tactile offsets: `hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.

### M9: Mobile & Safe-Area Contract
- `src/routes/__root.tsx`: Viewport meta contains `viewport-fit=cover`.
- `src/styles.css`: Utilities `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` using `env(safe-area-inset-*)`.
- `src/components/cs/AppShell.tsx`: Touch targets have minimum `min-h-[44px] min-w-[44px]` or adequate padding ensuring >= 44x44px clickable areas. Safe-area padding applied to mobile header, drawer, and bottom nav.

---

## Code Layout & File Boundaries
- `src/components/cs/`: Reusable CyberSafe UI (`AppShell.tsx`, `Logo.tsx`, `CyberDecorations.tsx`, `ui.tsx`)
- `src/components/ui/`: Primitive components (`button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`)
- `src/hooks/`: React hooks (`usePWAInstall.ts`)
- `src/routes/`: Router pages (`__root.tsx`, `index.tsx`, etc.)
- `src/styles.css`: Global Tailwind CSS v4 variables and utility classes
- `public/`: Manifest, Service Worker, icons, and favicons
- `src/test/`: Test suites (`e2e-requirements.test.ts`, `r2-features.test.ts`)
