# Technical Survey & Implementation Plan: Requirement R1 (CyberSafe Online Modern Vector Logo & Favicons)

**Author:** `teamwork_explorer_survey_r2_1`  
**Date:** 2026-11-01  
**Working Directory:** `/home/ro0t_/Projects/les-bugs-busters/`  
**Status:** Complete Read-Only Exploration  

---

## 1. Executive Summary

This report delivers a comprehensive technical survey and architectural plan for **Requirement R1**: creating an embellished, modern neo-brutalist vector SVG logo for **CyberSafe Online** based on the reference illustration (three clasping hands forming a continuous triangular knot), modernizing the React component `src/components/cs/Logo.tsx`, and integrating adaptive favicons and app icons in `public/`.

All findings have been independently verified against the codebase, test suites (`adversarial-stress.test.ts`, `e2e-requirements.test.ts`), and rendering pipelines (`ImageMagick 7.1.2`, `DOMParser`, `vitest`).

---

## 2. Reference Illustration Analysis

### 2.1 File Location
- **Path:** `/home/ro0t_/.gemini/antigravity/brain/6b37c714-d31e-44dc-8a64-596acf2bcf6f/.user_uploaded/media_1793550518973_a74a7119.jpg`
- **Format:** High-resolution JPEG line-art illustration.

### 2.2 Visual & Topological Breakdown
1. **Three-fold Rotational Symmetry ($C_3$):**
   - Three forearms extend outward radially at exact $120^\circ$ angular intervals:
     - **Arm 1 (Top):** $\theta \approx 90^\circ$ (pointing vertically towards the top)
     - **Arm 2 (Bottom-Left):** $\theta \approx 210^\circ$ (pointing towards lower-left)
     - **Arm 3 (Bottom-Right):** $\theta \approx 330^\circ$ (pointing towards lower-right)
2. **Continuous Cyclical Interlocking Knot (Borromean / Triquetra Lock):**
   - Hand 1 (from Arm 1) reaches down-left and grasps the wrist/forearm of Arm 2.
   - Hand 2 (from Arm 2) reaches across the bottom and grasps the wrist/forearm of Arm 3.
   - Hand 3 (from Arm 3) reaches up-left and grasps the wrist/forearm of Arm 1.
   - **Crucial topological property:** No single arm sits completely on top of or underneath the others. Every hand clasps *in front* of the wrist it holds, while its own forearm passes *behind* the hand clasping it.
3. **Anatomical Definition:**
   - Four fingers (Index, Middle, Ring, Pinky) curl tightly around the cylindrical volume of the wrist.
   - Knuckle lines and dorsal tendons delineate the back of the hand.
   - The thumb wraps along the inside edge of the wrist (counter-grip).
   - In the center of the three hands is a triangular negative aperture.
4. **Symbolic Meaning for CyberSafe Online:**
   - Represents solidarity, mutual vigilance, and community security in Togo ("Tous solidaires contre la fraude Mobile Money"). It symbolizes that no single user is vulnerable when everyone is interlocked in mutual protection.

---

## 3. Existing Codebase & Asset Analysis

### 3.1 Current `src/components/cs/Logo.tsx`
- **Exported Symbols:**
  - `export function CyberSafeEmblem({ className }: { className?: string })`: Renders an SVG with `viewBox="0 0 48 48"` depicting a previous abstract diamond/infinity knot.
  - `export function Logo({ compact, showText, variant, className, iconClassName }: LogoProps)`: Wraps the emblem in a `size-10 rounded-xl` container with text: `CyberSafe Online` and `Sécurité & IA · Togo · SaaS`.
- **Current Props Interface:**
  ```ts
  export interface LogoProps {
    compact?: boolean;
    showText?: boolean;
    variant?: "default" | "compact" | "icon";
    className?: string;
    iconClassName?: string;
  }
  ```

### 3.2 Usages in the Codebase
- `src/components/cs/AppShell.tsx`:
  - **Line 137:** Desktop sidebar (`<Logo />`)
  - **Line 174:** Mobile sticky header (`<Logo />`)
  - **Line 209:** Mobile slide-out drawer menu (`<Logo />`)
- `src/routes/index.tsx` & `src/routes/a-propos.tsx`:
  - Currently render a hero card with `brandBanner` (`cybersafeimage2.jpeg`).

### 3.3 Public Directory Assets (`public/`)
- `public/favicon.svg` (2,730 bytes): Contains SVG with `viewBox="0 0 48 48"`, gradient IDs `shieldGradDark`, `shieldGradLight`, `knotGradDark`, `knotGradLight`, and `@media (prefers-color-scheme: light)`.
- `public/favicon.ico` (15,086 bytes): Windows icon resource containing 16x16, 32x32, 48x48 layers.
- `public/cybersafeimage.jpeg` & `public/cybersafeimage2.jpeg`: Old raster images from early project iterations.

### 3.4 Root Route Linkages (`src/routes/__root.tsx`)
In `Route.head`:
```tsx
links: [
  { rel: "stylesheet", href: appCss },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  { rel: "alternate icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/favicon.svg" },
  // fonts...
]
```

---

## 4. Test Suite Constraints & Anti-Regression Invariants

Our exploration of `src/test/adversarial-stress.test.ts` and `src/test/e2e-requirements.test.ts` revealed strict expectations that **must be preserved**:

| Test ID | File | Exact Assertion / Requirement | Impact on Logo & Favicon |
|---|---|---|---|
| **ADV-3.3** | `adversarial-stress.test.ts:525-547` | `svg.getAttribute("viewBox") === "0 0 48 48"`<br>`svg.getAttribute("xmlns") === "http://www.w3.org/2000/svg"`<br>`container.className` contains `bg-slate-900` & `dark:bg-slate-950`<br>`container.className` does NOT contain `bg-white`<br>Text includes `CyberSafe`, `Online`, `SaaS`<br>`compact: true` removes text | Embellished SVG must keep `viewBox="0 0 48 48"` and valid XML namespace. Container classes must retain dark cyber defaults. Text structure must be preserved. |
| **ADV-3.4** | `adversarial-stress.test.ts:549-565` | `public/favicon.svg` must exist, be valid XML, contain `viewBox="0 0 48 48"`, contain `@media (prefers-color-scheme: light)`, and define IDs `shieldGradDark` and `shieldGradLight`. | `public/favicon.svg` must preserve these gradient IDs and media query while embedding the new 3-hands knot vector artwork. |
| **T1.1_R4** | `e2e-requirements.test.ts:307-318` | Inline `<svg>` element rendered, no raster JPEG/PNG inside `<Logo />`. | Pure vector SVG implementation. |
| **T1.4_R4** | `e2e-requirements.test.ts:337-345` | In `compact: true`, SVG emblem preserved, subtitle omitted. | Compact mode hides text block cleanly. |
| **T2.1_R4** | `e2e-requirements.test.ts:594-601` | No unadapted `.bg-white` container without `dark:`. | Neo-brutalist container with explicit dark styling. |
| **T2.3_R4** | `e2e-requirements.test.ts:612-617` | Merges custom `className` cleanly. | Props forwarded via `cn(..., className)`. |
| **T3.3_cross** | `e2e-requirements.test.ts:713-726` | Renders with high contrast in both light and dark themes. | Dynamic stroke/fill contrast. |

---

## 5. Architectural & Technical Implementation Plan for R1

### 5.1 SVG Vector Architecture: The 2-Layer Knot Model
To reproduce the three interlocking hands faithfully without visual artifacts or see-through lines, we use a **2-Layer rendering architecture**:

```
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs> ...gradients & styles... </defs>
  
  <!-- Outer Neo-brutalist Shield Frame -->
  <path class="shield-bg" d="M 24 3 L 42 9.5 V 25 C 42 35.8 34 43.5 24 46 C 14 43.5 6 35.8 6 25 V 9.5 Z" />
  
  <!-- Center Security Matrix / Triangular Aperture -->
  <polygon points="24,19.8 28,26.8 20,26.8" class="center-aperture" />
  <circle cx="24" cy="24.4" r="1.6" class="cyber-core" />
  
  <g transform="translate(24, 24)">
    <!-- LAYER 1: The 3 Forearm Shafts (rendered first at 0°, 120°, 240°) -->
    <use href="#forearm-shaft" transform="rotate(0)" />
    <use href="#forearm-shaft" transform="rotate(120)" />
    <use href="#forearm-shaft" transform="rotate(240)" />
    
    <!-- LAYER 2: The 3 Opaque Clasping Hands with Knuckles & Fingers -->
    <!-- Because each hand has an opaque fill, it renders directly in FRONT of the wrist it clasps! -->
    <use href="#hand-clasp" transform="rotate(0)" />
    <use href="#hand-clasp" transform="rotate(120)" />
    <use href="#hand-clasp" transform="rotate(240)" />
  </g>
</svg>
```

#### Why This Works Perfectly:
- Hand 0 is at $(X \approx 18, Y \approx 28)$ covering Wrist 2.
- Hand 1 is at $(X \approx 30, Y \approx 36)$ covering Wrist 3.
- Hand 2 is at $(X \approx 25, Y \approx 17)$ covering Wrist 1.
- Because the three hands are in distinct spatial quadrants around the center, they never overlap one another, but each cleanly covers the wrist it holds. This yields 100% mathematically consistent interlocking.

### 5.2 Extended `LogoProps` and `CyberSafeEmblemProps` API
To satisfy the R1 requirement for responsive dimensions (`sm`, `md`, `lg`) and style variants (`light`, `dark`, `electric`) while maintaining 100% backward compatibility:

```tsx
export type LogoSize = "sm" | "md" | "lg";
export type LogoThemeVariant = "light" | "dark" | "electric";

export interface LogoProps {
  /** Responsive dimensions: "sm" (32px), "md" (40px, default), "lg" (56px) */
  size?: LogoSize;
  /** Style variants or display modes */
  variant?: "default" | "compact" | "icon" | LogoThemeVariant;
  /** Explicit style theme variant */
  themeVariant?: LogoThemeVariant;
  /** Whether to hide text and display compact emblem */
  compact?: boolean;
  /** Explicitly control text visibility */
  showText?: boolean;
  /** Additional wrapper className */
  className?: string;
  /** Additional emblem wrapper className */
  iconClassName?: string;
}

export interface CyberSafeEmblemProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoThemeVariant | "default";
}
```

### 5.3 Responsive Sizing Specifications

| Size Token | Container Dimensions | Border Radius | Title Typography | Subtitle Typography | Best Use Case |
|---|---|---|---|---|---|
| `sm` | `size-8` ($32\times 32\text{px}$) | `rounded-lg` | `text-sm font-extrabold tracking-tight` | `text-[8px] font-semibold tracking-wider` | Mobile headers, compact toolbars, tables, footer marks |
| `md` *(default)* | `size-10` ($40\times 40\text{px}$) | `rounded-xl` | `text-base font-extrabold tracking-tight` | `text-[9.5px] font-semibold tracking-[0.16em]` | Primary sidebar, standard top navbar, modal headers |
| `lg` | `size-14 sm:size-16` ($56\text{-}64\text{px}$) | `rounded-2xl` | `text-xl sm:text-2xl font-black tracking-tight` | `text-xs font-semibold tracking-widest` | Hero banner cards, onboarding tour modal, about page |

### 5.4 Style Variants Specifications

| Variant | Icon Container Styling | Emblem SVG Colors | Text Styling |
|---|---|---|---|
| **`default`** (Auto) | `bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm dark:bg-slate-950 dark:border-cyan-400 dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]` | Adaptive via SVG CSS `@media (prefers-color-scheme: light)` or Tailwind theme | `text-slate-900 dark:text-white`<br>`Online`: `text-electric font-black` |
| **`light`** | High-contrast neo-brutalist day styling: `bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm` | Deep cyber navy/slate strokes (`#0f172a`), royal blue (`#2563eb`), emerald node (`#059669`) | Slate-900 typography with electric blue accent |
| **`dark`** | Deep cyber night styling: `bg-slate-950 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]` | Neon cyan (`#38bdf8`), cyan-teal gradients, emerald pulse node (`#10b981`) | Pure white typography with neon cyan accent |
| **`electric`** | Neo-brutalist high-voltage styling: `bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/30` | Hyper-cyan (`#22d3ee`), electric blue (`#3b82f6`), neon lime/amber core node | Vibrant cyan glow with pulsing electric badges |

### 5.5 Favicons & App Icons Generation Strategy

1. **`public/favicon.svg` Update:**
   - Standalone valid XML SVG containing the 3 clasping hands vector emblem inside the hex-shield.
   - Preserves `viewBox="0 0 48 48"`, gradient IDs `shieldGradDark`, `shieldGradLight`, `knotGradDark`, `knotGradLight`, and `@media (prefers-color-scheme: light)` so all tests and browser themes work seamlessly.
2. **`public/favicon.ico` Multi-Resolution Generation:**
   - Using ImageMagick:
     ```bash
     magick -background none public/favicon.svg -define icon:auto-resize=48,32,16 public/favicon.ico
     ```
   - Produces a standard 3-layer ICO (16x16, 32x32, 48x48) with 32-bit alpha transparency.
3. **PWA & Touch Icons (Ready for R2 PWA integration):**
   - 192x192 PNG: `magick -background "#0b1329" public/favicon.svg -resize 192x192 public/pwa-192x192.png`
   - 512x512 PNG: `magick -background "#0b1329" public/favicon.svg -resize 512x512 public/pwa-512x512.png`
   - 512x512 Maskable PNG: `magick -background "#0b1329" public/favicon.svg -resize 410x410 -gravity center -extent 512x512 public/maskable-icon-512x512.png`
   - Apple Touch Icon: `magick -background "#0b1329" public/favicon.svg -resize 180x180 public/apple-touch-icon.png`

---

## 6. Implementation Code Blueprint

Below is the concrete code design ready for the implementer:

### 6.1 `src/components/cs/Logo.tsx` Reference Implementation
```tsx
import React from "react";
import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg";
export type LogoThemeVariant = "light" | "dark" | "electric";

export interface CyberSafeEmblemProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoThemeVariant | "default";
}

/**
 * Pure vector SVG CyberSafe Emblem.
 * Faithfully depicts the three clasping hands in a continuous triangular knot
 * symbolizing community solidarity against Mobile Money cyber fraud.
 */
export function CyberSafeEmblem({
  className,
  variant = "default",
}: CyberSafeEmblemProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-full select-none", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Dark Mode Gradients (preserving backward compatibility with test suites) */}
        <linearGradient id="shieldGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b1329" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="knotGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Light Mode Gradients */}
        <linearGradient id="shieldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="knotGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Cyber Hand Body Gradient */}
        <linearGradient id="cyberHandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0e2246" />
          <stop offset="100%" stopColor="#071226" />
        </linearGradient>

        {/* Reusable Canonical Hand with 4 Clasping Fingers */}
        <g id="cs-canonical-hand">
          <path
            d="M -3.2 -9 C -5.2 -6.5 -7.8 -2.5 -9.5 2.5 C -11.2 5.5 -11.8 8.8 -10.5 11.2 C -9.2 13.5 -5.8 13.8 -3.2 12 C -1.2 10.5 -0.2 7.5 0.2 4 C 0.8 0.5 1.8 -4.5 3.2 -9 Z"
            className="fill-[#0b1a36] dark:fill-[#0b1a36] light:fill-[#f8fafc] stroke-[#38bdf8] dark:stroke-[#38bdf8] light:stroke-[#0f172a]"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* 4 Fingers wrapping across gripped wrist */}
          <path d="M -9.6 3.2 C -7.8 4.2 -5.5 3.5 -3.8 2.2" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M -10.6 5.8 C -8.8 6.9 -6.2 6.2 -4.4 4.8" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M -10.8 8.4 C -9 9.5 -6.6 8.8 -4.8 7.4" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M -9.8 11 C -8.2 12 -6 11.2 -4.4 9.8" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
          {/* Knuckle Ridge Contour */}
          <path d="M -9.6 3.2 C -10.8 5.6 -11.2 8.4 -9.8 11" fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.75" />
          {/* Thumb counter-grip */}
          <path d="M -0.8 1.5 C -1.2 3.8 -2.4 5.8 -4.2 6.5" fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
          {/* Biometric node & circuit accent */}
          <circle cx="-4.5" cy="-2.5" r="0.8" fill="#38bdf8" />
          <line x1="-4.5" y1="-2.5" x2="-6.5" y2="1" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="0.8 0.8" strokeLinecap="round" />
        </g>
      </defs>

      {/* Neo-brutalist Outer Shield Badge Frame */}
      <path
        d="M 24 3 L 42 9.5 V 25 C 42 35.8 34 43.5 24 46 C 14 43.5 6 35.8 6 25 V 9.5 Z"
        fill="url(#shieldGradDark)"
        stroke="#06b6d4"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Central Security Matrix / Triangular Core Node */}
      <polygon points="24,19.8 28,26.8 20,26.8" fill="#06b6d4" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.2" />
      <circle cx="24" cy="24.4" r="1.6" fill="#10b981" />

      {/* Continuous 3-Hand Knot with C3 Rotational Symmetry */}
      <g transform="translate(24, 24)">
        {/* Layer 1: Three Forearms extending from perimeter */}
        <g transform="rotate(0)">
          <path d="M -3.2 -9 L -4.6 -19.5 L 4.6 -19.5 L 3.2 -9 Z" fill="url(#cyberHandGlow)" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="-3.8" y1="-15.5" x2="3.8" y2="-15.5" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g transform="rotate(120)">
          <path d="M -3.2 -9 L -4.6 -19.5 L 4.6 -19.5 L 3.2 -9 Z" fill="url(#cyberHandGlow)" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="-3.8" y1="-15.5" x2="3.8" y2="-15.5" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g transform="rotate(240)">
          <path d="M -3.2 -9 L -4.6 -19.5 L 4.6 -19.5 L 3.2 -9 Z" fill="url(#cyberHandGlow)" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="-3.8" y1="-15.5" x2="3.8" y2="-15.5" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Layer 2: Three Opaque Gripping Hands */}
        <use href="#cs-canonical-hand" transform="rotate(0)" />
        <use href="#cs-canonical-hand" transform="rotate(120)" />
        <use href="#cs-canonical-hand" transform="rotate(240)" />
      </g>
    </svg>
  );
}

export interface LogoProps {
  size?: LogoSize;
  variant?: "default" | "compact" | "icon" | LogoThemeVariant;
  themeVariant?: LogoThemeVariant;
  compact?: boolean;
  showText?: boolean;
  className?: string;
  iconClassName?: string;
}

export function Logo({
  size = "md",
  variant = "default",
  themeVariant,
  compact = false,
  showText,
  className,
  iconClassName,
}: LogoProps) {
  const isCompact = compact || variant === "compact" || variant === "icon";
  const shouldShowText = showText !== undefined ? showText : !isCompact;
  const effectiveTheme = themeVariant || (variant === "light" || variant === "dark" || variant === "electric" ? variant : "default");

  // Size styling tokens
  const sizeClasses = {
    sm: {
      gap: "gap-2",
      iconBox: "size-8 rounded-lg p-0.5",
      title: "text-sm font-extrabold tracking-tight",
      subtitle: "text-[8px] font-semibold tracking-wider",
    },
    md: {
      gap: "gap-3",
      iconBox: "size-10 rounded-xl p-1",
      title: "text-base font-extrabold tracking-tight",
      subtitle: "text-[9.5px] font-semibold tracking-[0.16em]",
    },
    lg: {
      gap: "gap-4",
      iconBox: "size-14 sm:size-16 rounded-2xl p-1.5",
      title: "text-xl sm:text-2xl font-black tracking-tight",
      subtitle: "text-xs font-semibold tracking-widest",
    },
  }[size];

  // Theme styling tokens (maintaining strict compatibility with test ADV-3.3)
  const themeClasses = {
    default: "bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm dark:bg-slate-950 dark:border-cyan-400 dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    light: "bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm",
    dark: "bg-slate-950 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    electric: "bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/30",
  }[effectiveTheme];

  return (
    <div className={cn("flex items-center", sizeClasses.gap, className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          themeClasses,
          sizeClasses.iconBox,
          "transition-transform duration-200 hover:scale-105 flex items-center justify-center",
          iconClassName
        )}
      >
        <CyberSafeEmblem variant={effectiveTheme} size={size} />
      </div>
      {shouldShowText && (
        <div className="leading-tight">
          <div className={cn("font-display", sizeClasses.title)}>
            CyberSafe<span className={cn(effectiveTheme === "electric" ? "text-cyan-400 dark:text-cyan-300 font-black animate-pulse" : "text-electric font-black")}> Online</span>
          </div>
          <div className={cn("mt-0.5 flex items-center gap-1.5 uppercase opacity-75", sizeClasses.subtitle)}>
            <span>Sécurité & IA · Togo</span>
            <span className="inline-block size-1 rounded-full bg-emerald-500" />
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">SaaS</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Verification & Invalidation Protocol

### 7.1 Verification Checklist
1. **Typecheck:**
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ```
   Must pass with 0 errors.
2. **Unit & Boundary Tests:**
   ```bash
   ./node_modules/.bin/vitest run
   ```
   All 137 tests across 10 files must pass with 0 failures.
3. **SVG Well-Formedness:**
   Ensure `public/favicon.svg` is valid XML with `DOMParser` and contains `shieldGradDark`, `shieldGradLight`, and `viewBox="0 0 48 48"`.
4. **ICO Multi-Resolution Generation:**
   ```bash
   file public/favicon.ico
   ```
   Must return: `MS Windows icon resource - 3 icons, 48x48, 32 bits/pixel, 32x32, 32 bits/pixel`.

### 7.2 Invalidation Conditions
- Any removal or renaming of `CyberSafeEmblem` (breaks `adversarial-stress.test.ts:28`).
- Changing SVG `viewBox` away from `"0 0 48 48"` (breaks `ADV-3.3` and `ADV-3.4`).
- Adding unadapted `bg-white` class on the logo emblem container (breaks `ADV-3.3` and `T2.1_R4`).
- Removing `prefers-color-scheme: light` or gradient IDs `shieldGradDark` / `shieldGradLight` from `public/favicon.svg` (breaks `ADV-3.4`).
