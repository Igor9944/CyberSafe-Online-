# Survey Report: Requirements R3 & R4
**Project**: CyberSafe Online — Transition to SaaS & PWA  
**Explorer**: `teamwork_explorer_survey_r2_3`  
**Date**: 2026-11-01  
**Scope**: 
- **Requirement R3**: Animations et micro-interactions fluides et dynamiques
- **Requirement R4**: Optimisation et adaptation mobile complète (smartphones et tablettes)
- **Regression Prevention**: Vitest test suite analysis & TypeScript verification

---

## 1. Executive Summary

A comprehensive architectural and code survey of CyberSafe Online was conducted to evaluate requirement **R3** (*Animations et micro-interactions fluides et dynamiques*) and requirement **R4** (*Optimisation et adaptation mobile complète*).

### Current Baseline Status
- **Stack**: TanStack React Start (Nitro SSR + Vite 8), TanStack Router, React 19, Tailwind CSS v4, Lucide React, Radix UI primitives.
- **Test & Build Health**: 
  - `./node_modules/.bin/vitest run`: **10 test files, 137 tests passing (100%)**.
  - `./node_modules/.bin/tsc --noEmit`: **0 errors**.
  - `./node_modules/.bin/vite build`: **Successful production SSR & client build**.
- **Key Findings**:
  1. **R3 (Animations)**: `src/styles.css` only declares a single keyframe animation (`@utility animate-rise`). There is **zero support** for `prefers-reduced-motion` in CSS, which violates WCAG accessibility and acceptance criteria. Buttons, cards, and stickers have fragmented micro-interactions (e.g. `variant="neo"` has partial hover/active offsets, while `variant="default"`, `variant="hero"`, and `variant="outline"` use non-brutalist `active:scale-[0.98]`). Standardized entrance utilities (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-pulse-glow`) and staggered delays are missing from the CSS architecture.
  2. **R4 (Mobile & Tablet Responsiveness)**:
     - The viewport meta tag in `src/routes/__root.tsx` is `width=device-width, initial-scale=1` without `viewport-fit=cover`, preventing iOS and Android notched displays from utilizing `env(safe-area-inset-*)`.
     - Touch targets in `src/components/cs/AppShell.tsx` (topbar tour button `size-8` = 32px, theme toggle `size-8` = 32px, mobile hamburger menu `p-2` with `size-5` icon = 36px, drawer close button = 36px) fail the minimum 44x44px touch target criterion.
     - Mobile navigation bars and headers do not account for `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`, causing overlapping with notches and home bars in standalone PWA mode.
     - Interactive inputs in `src/components/ui/input.tsx` default to `h-9` (36px), below the 44px touch standard on mobile.
     - Several route views have potential text clipping or horizontal push risks on narrow screens (< 360px), particularly preformatted codes in `/guide` and un-wrapped flex items in `ui.tsx`.

---

## 2. Requirement R3: Animations & Micro-Interactions Deep Dive

### 2.1 Current State Analysis

#### A. CSS Layer (`src/styles.css`)
In `src/styles.css`:
```css
/* Lines 205-217 */
@utility animate-rise {
  animation: rise 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```
**Deficiencies identified**:
- Only `animate-rise` exists.
- In components (e.g., `apprendre.tsx:1778`), classes such as `animate-fade-in` are referenced without a matching utility definition in `src/styles.css`.
- There is no `@media (prefers-reduced-motion: reduce)` block to protect users with vestibular conditions or accessibility preferences.
- Keyframe animations for slide-down, slide-up, scale-in, and pulse-glow are absent.

#### B. Tactile Micro-Interactions (Neo-Brutalist Physics)
Neo-brutalism relies on tangible, tactile physics:
- **Resting state**: Solid high-contrast border (`border-2 border-slate-900` or `border-2 border-foreground`) + crisp offset shadow (`--shadow-neo`: `3px 3px 0px 0px rgba(15,23,42,0.95)`).
- **Hover state**: Subtle hover lift (`hover:-translate-y-0.5 hover:-translate-x-0.5`) with enlarged shadow (`hover:shadow-[4px_4px_0px_0px_...]`).
- **Active / Click state**: Tactile depression into the screen (`active:translate-x-[2px] active:translate-y-[2px]`) with shadow collapse (`active:shadow-none` or `active:shadow-[1px_1px_...]`).

**Component Audit**:
1. `src/components/ui/button.tsx`:
   - Line 8: Base button has `active:scale-[0.98]`. In neo-brutalism, `scale` distortion creates an unnatural rubbery feel instead of a tactile mechanical push.
   - Line 22: `variant="neo"` has:
     `hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,0.95)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`. (This is good, but lacks horizontal hover and reduced-motion reset).
   - Lines 12, 19, 20: `default`, `hero`, `outline`, `glass` do NOT have the tactile translate offset. `hero` has `hover:brightness-110 hover:-translate-y-0.5` but no tactile active depression.
2. `src/components/cs/CyberDecorations.tsx`:
   - `CyberCard` (Line 382): `onClick && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"`. Missing horizontal offset `translate-x` and shadow reduction.
   - `CyberSticker` (Line 291): `hover:-translate-y-0.5 active:translate-y-0.5` + rotation. Needs tactile click feel (`active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`).
   - `CyberGlyph` (Line 343): `transition-transform hover:scale-105`. Needs reduced-motion override.
3. `src/components/cs/ui.tsx`:
   - `Panel` (Line 71): `onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-neo"`. Missing `active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`.
   - `RiskBadge`: Currently renders a `CyberSticker`.
4. `src/components/ui/badge.tsx`:
   - Standard badge lacks neo-brutalism variants, tactile borders, or micro-interactions.

#### C. Entrance Animations & Staggered Reveal
- Currently, pages apply `animate-rise` directly to page headers, hero sections, and individual scanner cards.
- In `src/routes/index.tsx` (Line 288), staggered delays are hardcoded via inline CSS: `style={{ animationDelay: `${i * 70}ms` }}`.
- Need standard reusable delay utilities: `delay-75`, `delay-100`, `delay-150`, `delay-200`, `delay-300` and CSS classes for smooth staggered cascading.

#### D. Loading State Transitions
- `ProgressBar` in `src/components/cs/ui.tsx` (Line 403-420):
  - Uses `transition-all duration-300` on the width bar.
  - Spinner: `<Sparkles className="size-3.5 animate-spin text-electric" />`.
  - When Google Gemma or OCR runs, feedback transitions should smoothly ease in and out without layout jank.
- `Skeleton` in `src/components/ui/skeleton.tsx`:
  - Uses `animate-pulse rounded-md bg-primary/10`. Needs dark theme enhancement and reduced-motion guard.

#### E. Strict Support for `prefers-reduced-motion`
- Missing entirely in `src/styles.css`.
- If a user configures their OS or browser to reduce motion:
  - All continuous animations (`animate-pulse`, `animate-spin`, `animate-glow`) must pause or halt.
  - Entrance animations must resolve immediately to `opacity: 1; transform: none;`.
  - Hover/active transforms must not cause displacement.

---

## 3. Requirement R4: Mobile & Tablet Optimization Deep Dive

### 3.1 Viewport and Safe-Area Insets (`env(safe-area-inset-*)`)

#### Observation
In `src/routes/__root.tsx`:
```tsx
// Line 83
{ name: "viewport", content: "width=device-width, initial-scale=1" }
```
Without `viewport-fit=cover`, notched devices (iPhone X through 16, modern Androids with punch-hole cameras) operate in a letterboxed mode where `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` evaluate to `0px`.

#### Impact in PWA Standalone Mode
When installed as a Progressive Web App (R2):
- Without safe-area insets, the sticky mobile header collides with the device status bar / notch.
- The fixed bottom navigation (`<nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 ... lg:hidden">` in `AppShell.tsx:282`) collides directly with the iOS Home Indicator swipe bar.
- Content at the bottom of pages gets obscured under the bottom navigation bar because `pb-24` does not account for `env(safe-area-inset-bottom)`.

#### Required Fixes
1. Update `src/routes/__root.tsx` meta viewport:
   ```tsx
   { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }
   ```
2. Define safe-area utilities in `src/styles.css`:
   ```css
   @utility pt-safe {
     padding-top: env(safe-area-inset-top, 0px);
   }
   @utility pb-safe {
     padding-bottom: env(safe-area-inset-bottom, 0px);
   }
   @utility pl-safe {
     padding-left: env(safe-area-inset-left, 0px);
   }
   @utility pr-safe {
     padding-right: env(safe-area-inset-right, 0px);
   }
   ```
3. Update `src/components/cs/AppShell.tsx`:
   - Mobile Header (Line 172):
     ```tsx
     <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-sidebar-border bg-sidebar/95 px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 text-night-foreground backdrop-blur-md lg:hidden">
     ```
   - Mobile Drawer (Line 207):
     ```tsx
     <div className="absolute inset-y-0 left-0 flex w-72 flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] ...">
     ```
   - Mobile Bottom Nav (Line 282):
     ```tsx
     <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 bg-card/95 backdrop-blur-lg pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
     ```
   - Main Content Area (Line 231):
     ```tsx
     <main className="relative z-10 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-12 lg:pl-64">
     ```

---

### 3.2 Touch Target Compliance (Minimum 44x44px)

Per WCAG 2.5.5 / 2.5.8 (Target Size) and Apple Human Interface Guidelines, all interactive targets on touch screens must have a minimum physical or bounding dimension of 44x44px.

#### Touch Target Violations in Existing Code
| Component / Location | Current Classes | Effective Dimension | Issue | Remediation |
|---|---|---|---|---|
| `AppShell.tsx:182` (Tour trigger button) | `grid size-8 place-items-center` | 32 x 32 px | **Fails** (< 44px) | Change to `size-11 min-h-[44px] min-w-[44px]` |
| `AppShell.tsx:190` (Theme toggle button) | `grid size-8 place-items-center` | 32 x 32 px | **Fails** (< 44px) | Change to `size-11 min-h-[44px] min-w-[44px]` |
| `AppShell.tsx:197` (Mobile menu button) | `rounded-lg p-2` | 36 x 36 px | **Fails** (< 44px) | Change to `size-11 min-h-[44px] min-w-[44px] grid place-items-center` |
| `AppShell.tsx:213` (Drawer close button) | `rounded-lg p-2` | 36 x 36 px | **Fails** (< 44px) | Change to `size-11 min-h-[44px] min-w-[44px] grid place-items-center` |
| `AppShell.tsx:65` (Drawer NavList links) | `px-3 py-2.5 text-sm` | ~38px height | **Sub-optimal** | Add `min-h-[44px] flex items-center` |
| `AppShell.tsx:290` (Bottom nav links) | `py-2.5 text-[10px]` | ~50px height, 64px width | **Compliant** | Ensure `min-h-[48px]` for touch buffer |
| `button.tsx:28` (`size="sm"`) | `h-8 px-3 text-xs` | 32px height | **Fails on touch** | Add `touch-manipulation min-h-[44px] sm:min-h-[32px]` or responsive sizing |
| `button.tsx:27` (`size="default"`) | `h-9 px-4 py-2` | 36px height | **Fails on touch** | Add `min-h-[44px] sm:min-h-[36px]` |
| `button.tsx:30` (`size="icon"`) | `h-9 w-9` | 36 x 36 px | **Fails on touch** | Change to `h-11 w-11 sm:h-9 sm:w-9` (`min-h-[44px] min-w-[44px]`) |
| `input.tsx:11` (`Input`) | `h-9` | 36px height | **Fails on touch** | Change to `h-11 md:h-9 min-h-[44px] md:min-h-[36px]` |
| `apprendre.tsx:1643` (Flashcard Prev/Next) | `size="sm"` (`h-8`) | 32px height | **Sub-optimal** | Set to `h-11 min-h-[44px] px-4` |
| `sms.tsx:322` (Screenshot remove button) | `variant="ghost" size="sm"` | 32px height | **Sub-optimal** | Add `min-h-[44px] min-w-[44px]` hit area |

---

### 3.3 Horizontal Overflow Prevention & Responsive Layout

#### Audit of All Routes Across Viewports (320px, 375px, 768px, 1024px)
1. **Root & AppShell**:
   - `overflow-x-hidden` is present on the outer div (`AppShell.tsx:129`).
   - Fixed sidebars (`w-64`, `hidden lg:flex`) cleanly hide below 1024px without causing flex squishing.
2. **Dashboard (`/`)**:
   - Hero banner: `flex flex-col lg:flex-row lg:items-center` stacks cleanly on mobile.
   - Stats grid: `grid-cols-2 gap-4 lg:grid-cols-4` works well on mobile (2x2 grid).
   - Scanners grid: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` stacks on mobile.
   - Long text in recent history is protected with `truncate` (`index.tsx:347`).
3. **Apprendre (`/apprendre`)**:
   - Tab navigation (Overview, Cours, Quiz, Flashcards, Progrès): Needs horizontal scroll on small devices (`overflow-x-auto no-scrollbar flex-nowrap`).
   - Flashcard Card: Has `min-h-[300px]`, options in QQCM wrap and use `break-words`.
   - Add Course modal: `max-w-lg w-full max-h-[90vh] overflow-y-auto` fits inside 320px viewport with padding `p-4`.
4. **SMS Scanner (`/sms`)**:
   - Textarea: `w-full resize-none` adapts to screen width.
   - Screenshot preview: Image thumbnail `size-14` with text container `min-w-0` and `truncate`.
   - Action buttons: `flex flex-wrap gap-3` prevents overflow; buttons wrap onto next row on mobile screens.
5. **QR Code Scanner (`/qr`)**:
   - Raw QR content: `break-all` (`qr.tsx:227`) prevents horizontal scrolling for long URLs or Base64 payloads.
   - Sandbox verification box wraps cleanly.
6. **Audio Scanner (`/audio`)**:
   - Audio waveform / recording interface adapts with flex columns.
   - Transcript textarea wraps words properly.
7. **Assistant (`/assistant`)**:
   - Prompt suggestions: On mobile, long suggestion chips must wrap or be in a horizontally scrollable container with touch swipe.
   - Chat input textarea: Expands gracefully and doesn't push past viewport width.
8. **Guide (`/guide`)**:
   - Four golden rules: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` (1 column on mobile, 2 on tablet, 4 on desktop).
   - Code syntax snippets (`guide.tsx:118, 127`): Needs `break-words overflow-x-auto` to prevent overflow on 320px screens.
9. **À Propos (`/a-propos`)**:
   - Team banner: `flex flex-col md:flex-row` stacks image above text on mobile/tablet.
   - 4 Pillars grid: `grid gap-4 sm:grid-cols-2` cleanly stacks on mobile.
10. **Historique (`/historique`) & Paramètres (`/parametres`)**:
    - Filter pills and language cards wrap cleanly (`grid gap-3 sm:grid-cols-3`).

---

### 3.4 Responsive Logo Adaptation
In `src/components/cs/Logo.tsx`:
- Mobile header currently displays `<Logo />`.
- On narrow devices (320px–360px), full logo text "CyberSafe Online" + subtitle "Sécurité & IA · Togo · SaaS" occupies ~220px, leaving minimal room for header actions.
- **Enhancement**:
  - Add responsive subtitle hiding on very small screens:
    ```tsx
    <div className="mt-0.5 hidden xs:flex sm:flex items-center gap-1.5 text-[9.5px] ...">
    ```
  - Ensure the emblem SVG maintains a strict `size-10 shrink-0` aspect ratio without distortion.

---

## 4. Vitest Test Suite & Regression Prevention Strategy

### 4.1 Test Infrastructure Review
- **Runner**: Vitest v4.1.12 with `jsdom`.
- **Config**: `vitest.config.ts` sets up `@vitejs/plugin-react` and alias `@` -> `./src`.
- **Existing Test Files**:
  1. `src/lib/risk-engine.test.ts` (7 tests)
  2. `src/test/adversarial-stress.test.ts` (21 tests)
  3. `src/test/app-routing.test.tsx` (10 tests)
  4. `src/test/challenger-boundary-stress.test.tsx` (10 tests)
  5. `src/test/document-parser.test.ts` (5 tests)
  6. `src/test/e2e-requirements.test.ts` (61 tests)
  7. `src/test/gemma-api.test.ts` (5 tests)
  8. `src/test/pdf-parser.test.ts` (2 tests)
  9. `src/test/rag-indexer.test.ts` (4 tests)
  10. `src/test/virustotal.test.ts` (12 tests)
  **Total**: 137 tests, all passing.

### 4.2 Non-Regression Protection
Existing tests in `src/test/e2e-requirements.test.ts` rigorously check:
- Absence of `PitchModal` and `Pitch 3 min` triggers.
- Header structure: Logo, Tour Trigger (`Compass` icon or `Visite guidée` text), Theme Toggle (`Sun`/`Moon`).
- Route rendering for all 10 routes.
- Flashcard data structures and QCM options.

**Any proposed implementation must preserve all existing test assertions:**
1. Do not remove or alter existing `aria-label="Basculer le thème"`, `aria-label="Aide"`, `aria-label="Visite guidée"`, `aria-label="Ouvrir le menu navigation"`.
2. Keep button labels and test ids identical while upgrading styles and dimensions.
3. Add dedicated new tests to specifically verify:
   - R3: Reduced-motion media query presence and animation utility classes.
   - R4: Viewport `viewport-fit=cover` in `__root.tsx`.
   - R4: Touch target dimensions (minimum 44x44px for mobile buttons).
   - R4: Safe-area utility classes in `styles.css` and `AppShell.tsx`.

---

## 5. Detailed Implementation Plan (Code Proposals)

### Phase 1: CSS Foundation (`src/styles.css` & `src/routes/__root.tsx`)

#### 1.1 In `src/routes/__root.tsx`
Update viewport meta tag to enable safe-area insets:
```tsx
// Before:
{ name: "viewport", content: "width=device-width, initial-scale=1" },

// After:
{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
```

#### 1.2 In `src/styles.css`
1. **Safe-Area Utilities**:
   ```css
   @utility pt-safe {
     padding-top: env(safe-area-inset-top, 0px);
   }
   @utility pb-safe {
     padding-bottom: env(safe-area-inset-bottom, 0px);
   }
   @utility pl-safe {
     padding-left: env(safe-area-inset-left, 0px);
   }
   @utility pr-safe {
     padding-right: env(safe-area-inset-right, 0px);
   }
   ```
2. **Standard Neo-Brutalist Animation Keyframes & Utilities**:
   ```css
   @utility animate-rise {
     animation: rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
   }
   @utility animate-fade-in {
     animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
   }
   @utility animate-slide-up {
     animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
   }
   @utility animate-slide-down {
     animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
   }
   @utility animate-scale-in {
     animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
   }
   @utility animate-pulse-glow {
     animation: pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
   }

   @keyframes rise {
     from {
       opacity: 0;
       transform: translateY(12px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }
   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }
   @keyframes slideUp {
     from {
       opacity: 0;
       transform: translateY(16px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }
   @keyframes slideDown {
     from {
       opacity: 0;
       transform: translateY(-16px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }
   @keyframes scaleIn {
     from {
       opacity: 0;
       transform: scale(0.96);
     }
     to {
       opacity: 1;
       transform: scale(1);
     }
   }
   @keyframes pulseGlow {
     0%, 100% {
       opacity: 1;
       filter: drop-shadow(0 0 4px color-mix(in oklab, var(--primary) 60%, transparent));
     }
     50% {
       opacity: 0.75;
       filter: drop-shadow(0 0 12px color-mix(in oklab, var(--primary) 90%, transparent));
     }
   }
   ```
3. **Global `prefers-reduced-motion` Enforcement**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
     .animate-rise,
     .animate-fade-in,
     .animate-slide-up,
     .animate-slide-down,
     .animate-scale-in,
     .animate-pulse,
     .animate-spin,
     .animate-pulse-glow {
       animation: none !important;
       transform: none !important;
     }
   }
   ```

---

### Phase 2: Neo-Brutalist Micro-Interactions (`button.tsx`, `CyberDecorations.tsx`, `ui.tsx`)

#### 2.1 In `src/components/ui/button.tsx`
- Replace rubbery `active:scale-[0.98]` with tactile neo-brutalist depression:
  `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
- Update sizes to guarantee mobile 44px hit areas:
  - `default`: `h-11 md:h-9 px-4 py-2 min-h-[44px] md:min-h-[36px]`
  - `sm`: `h-10 md:h-8 px-3 text-xs min-h-[44px] md:min-h-[32px]`
  - `icon`: `size-11 md:size-9 min-h-[44px] min-w-[44px]`
  - `lg`: `h-12 md:h-11 px-6 min-h-[44px]`
- Add `motion-reduce:transform-none motion-reduce:transition-none` to base classes.

#### 2.2 In `src/components/cs/CyberDecorations.tsx`
- `CyberCard`:
  ```tsx
  onClick && "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
  ```
- `CyberSticker`:
  ```tsx
  "hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 motion-reduce:transform-none"
  ```
- `CyberGlyph`:
  ```tsx
  "transition-transform hover:scale-105 motion-reduce:hover:scale-100"
  ```

#### 2.3 In `src/components/cs/ui.tsx`
- `Panel`:
  ```tsx
  onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 motion-reduce:transform-none"
  ```

---

### Phase 3: Mobile Layout, Safe-Areas & Touch Targets (`AppShell.tsx`)

In `src/components/cs/AppShell.tsx`:
1. **Mobile Header**:
   - Add safe-area padding: `pt-[max(0.625rem,env(safe-area-inset-top))]`.
   - Upgrade button touch targets:
     - Tour button: change `size-8` to `size-11 min-h-[44px] min-w-[44px] rounded-xl`.
     - Theme button: change `size-8` to `size-11 min-h-[44px] min-w-[44px] rounded-xl`.
     - Menu button: change `p-2` to `size-11 min-h-[44px] min-w-[44px] grid place-items-center rounded-xl`.
2. **Mobile Drawer**:
   - Add safe-area insets: `pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]`.
   - Close button: change `p-2` to `size-11 min-h-[44px] min-w-[44px] grid place-items-center`.
   - NavList items: ensure `min-h-[44px]`.
3. **Mobile Bottom Navigation Bar**:
   - Add safe-area inset padding: `pb-[max(0.5rem,env(safe-area-inset-bottom))]`.
   - Nav links: ensure `min-h-[48px]`.
4. **Main Content Container**:
   - Adjust bottom padding: `pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-12 lg:pl-64`.

---

### Phase 4: Route-by-Route Responsive Polish

1. **`src/routes/apprendre.tsx`**:
   - Flashcard Prev/Next buttons: set minimum 44px touch height (`h-11`).
   - Tabs navigation bar: add `overflow-x-auto` with touch scrolling for small phones.
2. **`src/routes/sms.tsx`**:
   - Textarea and action buttons: ensure full width on mobile (`w-full sm:w-auto`).
   - OCR and analyze buttons: minimum 44px height.
3. **`src/routes/qr.tsx`**:
   - Importer / Saisie tabs: minimum 44px height.
   - Decoded content box: enforce `break-all` and `max-w-full`.
4. **`src/routes/guide.tsx`**:
   - Code blocks: ensure `break-words overflow-x-auto`.
5. **`src/routes/assistant.tsx`**:
   - Quick prompt chips: wrap with flex-wrap or touch-scrollable horizontal track.

---

### Phase 5: Verification & Non-Regression Tests

1. Create a dedicated test file `src/test/animations-mobile-r3-r4.test.ts` verifying:
   - `viewport-fit=cover` in `__root.tsx`.
   - `@media (prefers-reduced-motion: reduce)` and animation utilities in `src/styles.css`.
   - Mobile buttons in `AppShell` satisfy `>= 44px` touch size classes (`min-h-[44px]`, `min-w-[44px]`, `size-11`).
   - Safe-area inset classes (`safe-area-inset-top`, `safe-area-inset-bottom`) in `AppShell.tsx`.
2. Run full suite:
   ```bash
   ./node_modules/.bin/vitest run
   ./node_modules/.bin/tsc --noEmit
   ./node_modules/.bin/vite build
   ```
   All 137 existing tests + new R3/R4 tests must pass with 0 errors.

---

## 6. Summary Table: Requirements Mapping

| Requirement | Element | Current Status | Planned Implementation | Risk Level |
|---|---|---|---|---|
| **R3** | Tactile Micro-Interactions | Partial (`variant="neo"` only, rubbery `scale-[0.98]`) | Neo-brutal tactile offsets (`translate-x-[2px] translate-y-[2px]`, shadow collapse) across all buttons, cards, stickers | Low |
| **R3** | Entrance Animations | Only `animate-rise` exists | Add `animate-fade-in`, `animate-slide-up`, `animate-slide-down`, `animate-scale-in`, `animate-pulse-glow` | Low |
| **R3** | `prefers-reduced-motion` | **Missing** (0% coverage) | Universal CSS reset + Tailwind `motion-reduce:transform-none` | Zero (purely additive) |
| **R4** | Viewport Configuration | `width=device-width, initial-scale=1` | Add `viewport-fit=cover` | Zero |
| **R4** | Safe-Area Insets | **Missing** in header, nav, drawer | `env(safe-area-inset-top)` & `env(safe-area-inset-bottom)` | Low |
| **R4** | Touch Targets (>= 44x44px) | Multiple 32px & 36px buttons | Upgrade to 44px minimum (`size-11`, `min-h-[44px]`, `min-w-[44px]`) | Low |
| **R4** | Horizontal Overflow | Mostly good; some code blocks need guard | Add `break-words`, `overflow-x-auto` to `/guide` & chip lists | Zero |
| **R5** | Regression Testing | 137 Vitest tests pass | Add R3/R4 automated tests, verify 100% pass | Zero |
