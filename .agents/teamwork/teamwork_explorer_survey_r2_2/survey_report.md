# Technical Survey & Implementation Plan: Progressive Web App (PWA) Installability (R2)

**Project:** CyberSafe Online SaaS  
**Author:** teamwork_explorer_survey_r2_2  
**Date:** 2026-11-01  
**Target Requirement:** R2 — Configuration Progressive Web App (PWA) installable  
**Integrity Mode:** development  

---

## 1. Executive Summary

Requirement R2 tasks the team with turning the CyberSafe Online web application into a fully installable Progressive Web App (PWA) providing a native app-like experience (comparable to YouTube or Twitter PWA).

Key technical objectives:
1. **Web App Manifest (`public/manifest.webmanifest` & `public/manifest.json`)**: Full W3C compliance with `display: standalone`, branding colors (`#0f172a` / `#090d16`), rich description, icons (including 192x192, 512x512 with `maskable` support), and app shortcuts.
2. **Service Worker (`public/sw.js`)**: Root-scoped (`/`), offline caching engine with stale-while-revalidate for static assets, network-first for navigation, network-only for API calls, and resilient cache invalidation on updates.
3. **Root Document Integration (`src/routes/__root.tsx`)**: Dynamic SSR `<head>` injection via TanStack Start's `Route.head()` (`rel="manifest"`, Apple touch icons, theme colors, mobile capabilities) and SSR-safe client registration.
4. **Interactive In-App Install Prompt UI**: Custom `usePWAInstall` hook capturing the native `beforeinstallprompt` event, triggering `deferredPrompt.prompt()`, handling acceptance/dismissal, suppressing the prompt once installed or when running in `standalone` display mode, and integrating an ergonomic install button into `AppShell.tsx` (topbar on desktop, header/drawer on mobile).
5. **Robust Validation**: 100% compatibility with Nitro/Vite SSR build, zero TypeScript errors (`tsc --noEmit`), and comprehensive Vitest unit & E2E tests.

The investigation confirms that the project structure is ideally suited for this architecture without needing invasive changes to the bundler setup.

---

## 2. Project Architecture & Environment Analysis

### 2.1 Framework & Bundler Stack
- **Framework**: TanStack Start (`@tanstack/react-start` v1.168.60 + `@tanstack/react-router` v1.170.41) running on Vite 8.1.5 with React 19.2.0.
- **Vite Configuration**: Extends `@lovable.dev/vite-tanstack-config`, configuring Nitro `3.0.260603-beta` (preset: `cloudflare-module`).
- **SSR Execution**: TanStack Start compiles an SSR server bundle (`server: { entry: "server" }`) running in a Cloudflare / Node-compatible runtime, while client code is bundled into `.output/public/assets`.
- **HTML Document Shell**: There is **no static `index.html`** file in the project. The HTML document shell is generated exclusively in `src/routes/__root.tsx` via `createRootRouteWithContext<{ queryClient: QueryClient }>()` using `head: () => ({ meta: [...], links: [...] })` and `shellComponent: RootShell`.

### 2.2 Static Asset Pipeline
- Files located in `public/` are served at the root URL `/` in Vite development mode (`vite dev`) and copied verbatim to `.output/public/` during `vite build`.
- Verification test: When building the application, Nitro copies `public/favicon.svg`, `public/favicon.ico`, and `public/robots.txt` directly to `.output/public/`.
- Therefore, placing `manifest.webmanifest`, `sw.js`, and `icons/` into `public/` makes them immediately available at root paths:
  - `/manifest.webmanifest`
  - `/sw.js`
  - `/icons/icon-192x192.png`
  - `/icons/icon-512x512.png`
  - `/icons/icon-maskable-512x512.png`
  - `/icons/apple-touch-icon.png`

### 2.3 SSR vs Client-Side Execution Boundary
- Because TanStack Start executes `__root.tsx` on the server during SSR, direct references to browser-only globals (`window`, `navigator`, `localStorage`, `matchMedia`, `self`, `caches`) at module scope or during initial render will crash SSR.
- **Rule**: All Service Worker registrations and `beforeinstallprompt` event listeners must be guarded with `typeof window !== "undefined"` and executed within client lifecycle hooks (`useEffect`) or client components.

### 2.4 Existing Baseline Health
- Tests: 10 test suites, 137 tests passing (`./node_modules/.bin/vitest run`).
- TypeScript: Zero errors (`./node_modules/.bin/tsc --noEmit` exits code 0).
- Build: Production build succeeds without error (`./node_modules/.bin/vite build` exits code 0).

---

## 3. Web App Manifest Specification

### 3.1 File Locations & MIME Types
- Primary file: `public/manifest.webmanifest` (standard W3C file name, served as `application/manifest+json`).
- Fallback/Alias file: `public/manifest.json` (identical content, ensuring 100% compatibility with older crawlers, webview scrapers, or browser variants).

### 3.2 Manifest Content Definition
```json
{
  "id": "/",
  "name": "CyberSafe Online - Sécurité Mobile Money",
  "short_name": "CyberSafe",
  "description": "Protection contre les arnaques Mobile Money au Togo (T-Money, Moov Money). Détection intelligente par IA, analyse SMS, QR codes et éducation.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#090d16",
  "theme_color": "#0f172a",
  "lang": "fr",
  "dir": "ltr",
  "categories": ["security", "utilities", "education"],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ],
  "shortcuts": [
    {
      "name": "Scanner un SMS",
      "short_name": "SMS",
      "description": "Vérifier un message suspect ou tentative de fraude",
      "url": "/sms",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Scanner un QR Code",
      "short_name": "QR Code",
      "description": "Vérifier un QR Code de paiement Mobile Money",
      "url": "/qr",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Assistant IA",
      "short_name": "Assistant",
      "description": "Poser une question de sécurité à l'IA",
      "url": "/assistant",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Quiz Cyber",
      "short_name": "Quiz",
      "description": "Tester vos réflexes de détection d'arnaques",
      "url": "/apprendre",
      "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

### 3.3 Required App Icons
To satisfy Chrome/Chromium PWA installability requirements and iOS Home Screen guidelines:
1. `public/icons/icon-192x192.png`: 192x192 px standard square icon.
2. `public/icons/icon-512x512.png`: 512x512 px high-resolution splash/desktop icon.
3. `public/icons/icon-maskable-512x512.png`: 512x512 px maskable icon with safe zone padding (minimum 10% margin / 80% central emblem diameter) ensuring Android squircle/round cuts never crop the emblem.
4. `public/icons/apple-touch-icon.png`: 180x180 px iOS home screen icon.
5. `public/favicon.svg`: Scalable vector icon already present and updated.

*Asset generation note:* The system contains `/usr/bin/rsvg-convert` and `/usr/bin/magick`, allowing automated, lossless rasterization of the vector emblem SVG into these PNG dimensions.

---

## 4. Service Worker Architecture (`public/sw.js`)

### 4.1 Scope & Lifecycle
- Location: `public/sw.js` -> served at `/sw.js`.
- Scope: `/` (controls all application routes).
- Cache Versioning: `const CACHE_NAME = 'cybersafe-pwa-v1';`

### 4.2 Caching Strategies
| Request Type | Strategy | Implementation Rationale |
|---|---|---|
| **Navigation (`request.mode === 'navigate'`)** | **Network-First** with Cache Fallback | TanStack Start is an SSR application. When online, the user must receive fresh HTML. When offline, fallback to cached `/` ensures the SPA shell still boots and operates. |
| **Hashed Assets (`/assets/*`)** | **Cache-First** / Long-term | Vite generates content-hashed filenames for immutable bundles (e.g. `styles-BjR-EAj4.css`). Caching first gives instantaneous load times. |
| **Static Shell Assets (`/manifest.*`, `/favicon.*`, `/icons/*`)** | **Stale-While-Revalidate** | Immediate render from cache with non-blocking background network update. |
| **API Endpoints (`/api/*`, Google Gemini API)** | **Network-Only** (Bypass SW Cache) | Dynamic fraud analysis and LLM chats must never return stale cached predictions. Non-GET requests (POST) are automatically bypassed. |

### 4.3 Service Worker Implementation Code (`public/sw.js`)
```javascript
// CyberSafe Online PWA Service Worker
const CACHE_VERSION = 'cybersafe-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
];

// Install: pre-cache application shell and immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches and claim existing clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: smart strategy routing
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests (e.g., POST /api/analyze)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Bypass chrome-extension and non-http protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Bypass API requests and dynamic data
  if (url.pathname.startsWith('/api/') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // 1. Navigation requests: Network-First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Static Assets: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
```

---

## 5. Root Document & `<head>` Integration (`src/routes/__root.tsx`)

### 5.1 Updated `Route.head()` Configuration
In `src/routes/__root.tsx`, TanStack Start generates document meta and links through the `head` declaration.

```tsx
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "CyberSafe Online - Sécurité Mobile Money" },
      { name: "description", content: "Protection contre les arnaques Mobile Money au Togo (T-Money, Moov Money)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // PWA & Mobile Web App Meta
      { name: "theme-color", content: "#0f172a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "CyberSafe" },
      { name: "application-name", content: "CyberSafe Online" },
    ],
    links: [
      // Web App Manifest
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
```

### 5.2 SSR-Safe Service Worker Registration
Within `RootShell` or `RootComponent`, a client-side `useEffect` ensures registration occurs only in the browser:

```tsx
// Inside RootComponent or AppShell:
useEffect(() => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    // Register after page load to avoid competing with critical first paint
    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Listen for new service worker updates
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.info("[PWA] Nouvelle mise à jour CyberSafe disponible.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }
  }
}, []);
```

---

## 6. Interactive Install Prompt UI Architecture

### 6.1 Custom Hook: `usePWAInstall` (`src/hooks/usePWAInstall.ts`)
The hook encapsulates:
1. Native `beforeinstallprompt` event interception (calling `e.preventDefault()`).
2. Storing the `deferredPrompt`.
3. Detecting if the application is already running in `standalone` display mode (`window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone === true`).
4. Listening to `appinstalled` event to automatically update installed state and dismiss triggers.
5. Detecting iOS Safari to provide targeted installation guidance (Share -> Add to Home Screen).
6. Remembering user dismissal to respect user choice.

```typescript
import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) {
      return "unavailable";
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
      return choiceResult.outcome;
    } catch (err) {
      console.error("[PWA] Installation prompt error:", err);
      return "unavailable";
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
```

### 6.2 UI Integration in `src/components/cs/AppShell.tsx`

#### A. Desktop TopBar Integration
In the desktop sticky top bar (`sticky top-0 hidden lg:flex`), alongside the "Visite guidée", LanguageSelector, and ThemeToggle:
- Render an **"Installer l'app"** action button when `isInstallable` is true.
- Neo-brutalist styling: `border-2 border-border/90 bg-card px-2.5 py-1.5 text-xs font-bold text-foreground transition hover:bg-accent shadow-neo-sm active:translate-y-0.5 active:shadow-none`.
- Icon: `<ArrowDownToLine className="size-3.5 text-electric" />` or `<Download className="size-3.5 text-electric" />`.
- On click: calls `promptInstall()`. When `outcome === 'accepted'`, triggers a toast: `toast.success("Application installée avec succès !")`.

#### B. Mobile Header & Drawer Integration
In the mobile header (`header.sticky.top-0 lg:hidden`):
- Compact install icon button with tooltip.
- In the mobile slide-out drawer (`open && ...`):
  - A prominent card:
    ```tsx
    {isInstallable && (
      <div className="mb-3 rounded-xl border-2 border-electric/40 bg-electric/10 p-3">
        <div className="flex items-center gap-2 font-bold text-xs text-white">
          <Download className="size-4 text-electric" />
          <span>Installer CyberSafe Online</span>
        </div>
        <p className="mt-1 text-[11px] text-night-muted">
          Accédez à la détection d'arnaques en un clic et hors ligne.
        </p>
        <button
          onClick={handleInstall}
          className="mt-2.5 w-full rounded-lg bg-electric py-1.5 text-xs font-bold text-white shadow-neo-sm"
        >
          Installer maintenant
        </button>
      </div>
    )}
    ```

#### C. iOS Safari Informational Drawer/Modal
For iOS users (where `beforeinstallprompt` is not supported by WebKit):
- Clicking "Installer l'app" displays a lightweight bottom sheet / toast explaining:
  *« Pour installer CyberSafe sur iPhone/iPad : appuyez sur le bouton Partager ⎋ puis sur "Sur l'écran d'accueil" ⊞ ».*

---

## 7. Build, Bundler & Nitro Constraints

### 7.1 Static Asset Serving
- Nitro generates `.output/public/_headers` applying immutable caching only to `/assets/*`.
- Top-level files such as `/manifest.webmanifest`, `/manifest.json`, and `/sw.js` are not subject to immutable caching, ensuring that Service Worker updates and manifest updates are fetched by the browser according to standard HTTP semantics.
- To enforce optimal Service Worker lifecycle, we can verify that `/sw.js` headers do not retain long-lived caches (`Cache-Control: no-cache, no-store, must-revalidate`).

### 7.2 SSR Safety
- Since the server entry is compiled via `server: { entry: "server" }` into a Cloudflare / Node worker module, no client-side DOM objects exist at the root evaluation time.
- By placing all SW registrations and event hooks inside React `useEffect` and checking `typeof window !== "undefined"`, the SSR build remains 100% clean.

---

## 8. Vitest Test Architecture for PWA (M7)

To ensure zero regressions and rigorous automated verification, the following test suite will be integrated into `src/test/pwa-installable.test.ts` (or mapped into `e2e-requirements.test.ts`):

1. **Manifest File Conformance**:
   - Reads `public/manifest.webmanifest` and verifies valid JSON structure.
   - Verifies `name`, `short_name`, `start_url === "/"`, `display === "standalone"`, `theme_color`, `background_color`.
   - Validates that `icons` array contains 192x192, 512x512, and `purpose: "maskable"`.
   - Validates shortcuts pointing to `/sms`, `/qr`, `/assistant`, `/apprendre`.
2. **Service Worker Script Integrity**:
   - Reads `public/sw.js` and asserts presence of `install`, `activate`, and `fetch` event listeners.
   - Verifies network-first logic for navigate mode and bypass for `/api/`.
3. **Head Content Integration**:
   - Evaluates `Route.head()` and checks that `<link rel="manifest">` is present with `href="/manifest.webmanifest"`.
   - Checks presence of `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`.
4. **`usePWAInstall` Hook & Component Testing**:
   - Initial state: install button is not visible when no prompt event has fired.
   - Dispatches synthetic `beforeinstallprompt` event: verifies install button appears.
   - Simulates click on install button: verifies `event.prompt()` is called.
   - Simulates accepted outcome: verifies button disappears and installed state activates.
   - Simulates dismissal outcome: verifies graceful state retention.
   - Simulates `appinstalled` event: verifies prompt is closed.
   - Standalone display mode: verifies install button remains hidden if already running standalone.

---

## 9. Implementation Roadmap for Milestone 7 (M7)

| Step | Action | Files Touched / Created |
|---|---|---|
| **1** | Generate PWA icon assets (192x192, 512x512, maskable, apple-touch-icon) from vector logo | `public/icons/*` |
| **2** | Create W3C Web App Manifest files | `public/manifest.webmanifest`, `public/manifest.json` |
| **3** | Implement Service Worker with stale-while-revalidate & network-first navigation | `public/sw.js` |
| **4** | Update root shell `<head>` with manifest link, theme-color, and Apple tags | `src/routes/__root.tsx` |
| **5** | Add client-side Service Worker registration with update listener | `src/routes/__root.tsx` or `src/lib/pwa.ts` |
| **6** | Create `usePWAInstall` hook | `src/hooks/usePWAInstall.ts` |
| **7** | Integrate install button in desktop TopBar & mobile header/drawer | `src/components/cs/AppShell.tsx` |
| **8** | Add i18n translations for PWA strings (FR, EN, EE) | `src/locales/fr.json`, `en.json`, `ee.json` |
| **9** | Author and run comprehensive Vitest tests | `src/test/pwa-installable.test.ts` |
| **10**| Validate complete project build (`tsc --noEmit`, `vitest run`, `vite build`) | All targets verified |

---

## 10. Conclusion

The technical investigation confirms that requirement R2 (PWA installable) can be implemented cleanly, natively, and reliably in the CyberSafe Online TanStack Start architecture.

- **No external heavy PWA libraries required**: A native Service Worker script and a standard React hook avoid bundler incompatibilities with `@lovable.dev/vite-tanstack-config` and Nitro.
- **Zero regressions**: The solution preserves existing routing, SSR performance, and all 137 unit and boundary tests.
- **Immediate readiness**: All required native binaries (`rsvg-convert`, `magick`, `node`, `vitest`, `tsc`) are verified and functional on the system.
