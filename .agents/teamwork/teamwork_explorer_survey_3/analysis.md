# Rapport d'Investigation Approfondie — Phase 0 Survey
**Instance** : Teamwork Explorer 3  
**Date** : 2026-11-01  
**Périmètre** : Requirement R5 (Amélioration du thème sombre & Ergonomie) et Configuration Build & Tests.

---

## 1. Synthèse Exécutive

L'application **CyberSafe Online** est construite sur une stack moderne TanStack Start (v1.168.60) / React 19 / Vite 8 / Tailwind CSS v4 / Nitro SSR Cloudflare, configurée via le wrapper `@lovable.dev/vite-tanstack-config`.

L'examen du thème sombre et de l'ergonomie (Requirement R5) a mis en évidence :
1. **Un mécanisme de basculement de thème basique et isolé dans `AppShell.tsx`** : pas de hook ou contexte global réutilisable (`useTheme`), absence de détection automatique des préférences système (`prefers-color-scheme: dark`), et absence de script inline dans `__root.tsx` provoquant un flash visuel (FOUC) au chargement.
2. **Une définition incomplète des variables CSS dans `.dark` (`src/styles.css`)** : variables `--night`, `--night-foreground`, `--night-muted`, `--sidebar-accent`, `--gradient-hero` non redéfinies en mode sombre, entraînant l'effondrement du contraste entre le fond (`oklch(0.14)`) et les sections "night" (`oklch(0.16)`).
3. **Des incohérences et régressions visuelles cyber/néo-brutalistes** :
   - Conteneurs d'images hardcodés en `bg-white` (bannières, aperçus QR, logo) qui créent des pavés blancs éblouissants en mode sombre.
   - Badges et stickers pastel avec textes sombres hardcodés et ombres blanches translucides `rgba(255, 255, 255, 0.35)` créant un effet flou/fantôme au lieu d'arêtes néo-brutalistes nettes.
   - Le composant `CyberGlyph` en variante `dark` s'inverse en carré blanc vif (`dark:bg-white dark:text-slate-950`) au lieu de conserver un look cyber sombre texturé.
   - Nombreuses bordures affaiblies en opacité (`border-foreground/15`, `border-foreground/20`) peu lisibles sur fond sombre.
4. **Environnement d'exécution Build & Test** :
   - Node.js v26.12.0 est présent dans `/usr/bin/node`. L'exécutable système `npm` n'est pas installé dans le PATH de l'environnement Arch Linux, mais tous les exécutables locaux du projet (`vite`, `vitest`, `tsc`, `eslint`, `prettier`) sont présents et opérationnels dans `./node_modules/.bin/`.
   - La suite de tests Vitest (7 fichiers, 45 tests) s'exécute avec **100% de succès** en 3.1 secondes.
   - Le build de production (`./node_modules/.bin/vite build`) réussit impeccablement en 5.2 secondes.
   - Le typage TypeScript (`./node_modules/.bin/tsc --noEmit`) est 100% propre (0 erreur).
   - ESLint v9 signale 567 problèmes dont 476 erreurs Prettier sur le formatage du code existant.

---

## 2. Analyse Détaillée de l'Architecture Thème & CSS (Requirement R5)

### 2.1 Configuration Tailwind CSS v4 & Variables CSS (`src/styles.css`)

Tailwind v4 est configuré via `@tailwindcss/vite` et importé dans `src/styles.css` :
```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

#### Anomalies Détectées dans `styles.css` :
1. **Sélecteur `@custom-variant dark` restrictif** :
   - L'instruction `@custom-variant dark (&:is(.dark *));` ne cible que les descendants stricts d'un élément ayant la classe `.dark`. Si des classes utilitaires sombres sont posées sur l'élément `.dark` lui-même (ex: `<html class="dark bg-background">`), elles ne sont pas activées.
   - La syntaxe canonique Tailwind v4 est :
     ```css
     @custom-variant dark (&:where(.dark, .dark *));
     ```
2. **Couleurs OKLCH et contraste en mode sombre** :
   - `:root` (Light) :
     - `--background: oklch(0.978 0.006 255);` (~98% luminance)
     - `--foreground: oklch(0.18 0.045 262);` (~18% luminance)
     - `--card: oklch(1 0 0);`
     - `--night: oklch(0.16 0.048 264);`
     - `--night-foreground: oklch(0.97 0.01 255);`
   - `.dark` :
     - `--background: oklch(0.14 0.038 264);` (~14% luminance)
     - `--foreground: oklch(0.96 0.01 255);` (~96% luminance)
     - `--card: oklch(0.185 0.045 264);` (~18.5% luminance)
     - `--muted: oklch(0.225 0.045 262);` (~22.5% luminance)
     - `--muted-foreground: oklch(0.72 0.035 258);` (~72% luminance)
     - `--border: oklch(0.27 0.045 262);`
     - `--sidebar: oklch(0.12 0.035 264);`
3. **Variables CSS manquantes dans le bloc `.dark`** :
   - Les variables suivantes sont déclarées dans `:root` mais **absentes** du bloc `.dark` :
     - `--night`: reste à `oklch(0.16 0.048 264)`. Conséquence : les panneaux utilisant `bg-night` (comme le bandeau de conseils quotidiens sur `index.tsx` ligne 288) ont presque exactement la même couleur que le fond `--background` (`oklch(0.14)`), annihilant la hiérarchie visuelle.
     - `--night-foreground`: reste à `oklch(0.97 0.01 255)`.
     - `--night-muted`: reste à `oklch(0.74 0.04 258)`.
     - `--sidebar-accent`: reste à `oklch(0.23 0.055 262)`, alors que `--sidebar` passe à `oklch(0.12)`.
     - `--sidebar-border`: passe à `oklch(0.23)`, mais manque de contraste néo-brutaliste.
     - `--gradient-hero`: utilise des teintes fixes non adaptées à un mode sombre néo-cyber éclatant.
4. **Ombres néo-brutalistes en mode sombre** :
   - Dans `:root` : `--shadow-neo: 3px 3px 0px 0px rgba(15, 23, 42, 0.95);` (ombre dure noire très marquée, signature néo-brutaliste).
   - Dans `.dark` : `--shadow-neo: 3px 3px 0px 0px rgba(255, 255, 255, 0.35);`.
   - L'ombre blanche semi-transparente à 35% donne un aspect de halo laiteux ou de bavure, très éloigné de l'esthétique cyber/néo-brutaliste qui exige des arêtes franches, des ombres noires profondes décalées (`3px 3px 0px 0px #000000`) combinées à des bordures cyber néon ou des accents électriques (`#38bdf8`, `#a855f7`, `#4ade80`).

---

### 2.2 Gestion du Thème (Theme Provider & Hooks)

Actuellement, la logique du thème réside uniquement dans `src/components/cs/AppShell.tsx` (lignes 101-121) :
```tsx
const [dark, setDark] = useState(false);

useEffect(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("cybersafe_theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }
}, []);

const toggleTheme = () => {
  const next = !dark;
  setDark(next);
  if (typeof window !== "undefined") {
    localStorage.setItem("cybersafe_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }
};
```

#### Faiblesses Identifiées :
1. **Absence de prise en compte des préférences système du navigateur/OS** :
   - Si `localStorage.getItem("cybersafe_theme")` est vide, `isDark` vaut `false`. Un utilisateur dont le système est en mode sombre voit l'application démarrer en mode clair.
   - Solution recommandée :
     ```ts
     const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
     const isDark = saved ? saved === "dark" : prefersDark;
     ```
2. **Flash de thème clair au rechargement (FOUC)** :
   - Dans `src/routes/__root.tsx` (lignes 108-119), `RootShell` génère `<html lang="fr">` sans classe `dark`.
   - L'effet de `AppShell` ne s'exécute qu'après le montage du composant React côté client. Pendant quelques millisecondes, la page est rendue en mode clair avant de basculer en mode sombre.
   - Solution recommandée : insérer un mini-script inline bloquant dans le `<head>` de `__root.tsx` pour ajouter la classe `dark` à `document.documentElement` immédiatement avant le premier rendu.
3. **Absence de Contexte / Hook Partagé (`useTheme`)** :
   - Aucun composant enfant ou route ne peut connaître l'état du thème ou basculer le thème.
   - La création d'un `ThemeContext` et d'un hook `useTheme()` permettra une gestion centralisée, propre et typée.

---

## 3. Analyse des Contrastes, Composants & Esthétique Néo-Brutaliste

### 3.1 Problèmes Spécifiques Identifiés par Fichier

| Emplacement | Élément | Constat & Problème de Contraste | Impact Visuel / Ergonomique |
| :--- | :--- | :--- | :--- |
| `src/components/cs/CyberDecorations.tsx:273-282` | `STICKER_STYLES` | `lime`, `yellow`, `cyan`, `purple`, etc. utilisent `text-slate-950` avec des fonds pastels clairs (`#D9F99D`, etc.) et une ombre blanche `dark:shadow-[...rgba(255,255,255,0.4)]`. | En mode sombre, les badges ressortent comme des blocs criards et délavés avec des ombres blanches spectrales, au lieu de finitions sombres avec bordures néon contrastées. |
| `src/components/cs/CyberDecorations.tsx:351` | `CyberGlyph (variant="dark")` | `dark: "bg-slate-950 text-white ... dark:bg-white dark:text-slate-950 dark:border-white/50"` | Le pictogramme s'inverse en carré blanc vif en mode sombre, créant un éblouissement agressif au lieu de préserver l'immersion dark mode. |
| `src/components/cs/CyberDecorations.tsx:383-395` | `CyberCard (tone="night")` | `border-2 border-border/70 bg-night text-night-foreground shadow-[3px_3px_0px_0px_rgba(56,189,248,0.25)]` | `--night` n'étant pas adapté au mode sombre, le fond se confond avec le background global. |
| `src/components/cs/AppShell.tsx:78-88` | Badges de navigation latérale | `bg-[#D9F99D] text-slate-950 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]` | Dans la sidebar sombre, les bordures et ombres sont noires sur fond sombre (`border-slate-900`), donc totalement invisibles. |
| `src/components/cs/Logo.tsx:7` | Boîte de l'icône du Logo | `bg-white p-1 shadow-glow ring-1 ring-white/20` | Fond blanc carré forcé derrière l'image JPEG. En mode sombre, cela forme un pavé blanc opaque discordant. |
| `src/routes/index.tsx:190` | Carte de bannière officielle | `border-2 border-slate-800 bg-white p-4 shadow-neo ring-1 ring-white/20` | Fond blanc pur (`bg-white`) non adapté au mode sombre, qui devrait utiliser un fond sombre feutré avec bordure cyber néon. |
| `src/routes/a-propos.tsx:56` | Carte de bannière de présentation | `border-2 border-foreground bg-white p-4 shadow-neo` | Même anomalie : fond blanc pur au milieu d'une page sombre. |
| `src/routes/qr.tsx:286` | Cadre de prévisualisation QR | `border-2 border-foreground bg-white p-2 shadow-neo-sm` | Pavé blanc vif non harmonisé avec les thèmes. |
| `src/routes/apprendre.tsx:1225` | Carte FlashCard 3D | `border-2 border-foreground/25 bg-card p-6 shadow-neo-lg` | Bordure à 25% d'opacité trop faible et ombre floue en mode sombre. Manque de punch néo-brutaliste (arête franche 2px, bordure électrique). |
| `src/routes/apprendre.tsx:1180, 1193, 1254, 1263, 1277` | Boutons & panneaux FlashCards | Multiples occurrences de `border-foreground/15` | Opacité 15% presque imperceptible sur fond sombre (`oklch(0.185)`). Les boutons semblent flotter sans délimitation nette. |
| `src/components/ui/button.tsx:22` | Variante de bouton `sticker` | `border-2 border-slate-900 bg-[#D9F99D] text-slate-950 font-bold shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,0.95)]` | Aucune variante `dark:` : bordure et ombre noires imperceptibles sur fond sombre. |
| `src/components/ui/button.tsx:14` | Variante de bouton `outline` | `border border-border bg-card/80` (bordure 1px fine) | Entre en conflit avec le reste de l'UI néo-brutaliste qui utilise systématiquement `border-2` (2px). |
| `src/components/cs/ui.tsx:278, 309, 343` | Cartes d'alerte et listes d'indicateurs | `bg-muted/40`, `border-border/70` | Textes secondaires et bordures à faible contraste. |

---

### 3.2 Raffinement de l'Esthétique Cyber/Néo-Brutaliste

Le style néo-brutaliste cyber repose sur :
1. **Des bordures franches et affirmées** : 2px (`border-2`) avec des couleurs contrastées (`border-border` rehaussé à `oklch(0.35)` ou bordures d'accent `border-primary/50`, `border-white/30`).
2. **Des ombres géométriques dures** : ombres franches décalées (offset 2.5px à 3.5px) sans flou (`0px` blur). En mode sombre, l'ombre doit être un noir profond (`#000000` à 90%) pour faire ressortir le composant de sa surface, doublée d'un léger liseré lumineux ou d'une ombre cyber colorée (ex: cyan `#0284c7` ou violet électrique).
3. **Une palette sombre enrichie** :
   - Fond d'application : `oklch(0.12 0.035 264)` (noir spatial profond bleuté).
   - Cartes et panneaux : `oklch(0.17 0.045 264)` (contraste élevé avec le fond, delta > 0.05).
   - Surfaces élevées (modales, popovers) : `oklch(0.21 0.05 264)`.
   - Textes :
     - Principal : `oklch(0.98 0.005 255)` (blanc éclatant).
     - Muted/Secondaire : rehaussé à `oklch(0.78 0.03 258)` pour garantir un ratio de contraste supérieur à 4.5:1 sur toutes les surfaces sombres (conforme WCAG AA / AAA).
4. **Des micro-interactions dynamiques** : translation active (`active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`) sur les cartes et boutons cliquables.

---

## 4. Analyse de l'Environnement de Build & Tests

### 4.1 Scripts & Configuration Système

1. **Environnement Système** :
   - OS : Linux x86_64 (Arch Linux).
   - Node.js : v26.12.0 (`/usr/bin/node`).
   - `npm` : Absent du système (paquet Arch Linux `nodejs` installé séparément de `npm`).
   - Binaires du projet : Disponibles dans `/home/ro0t_/Projects/les-bugs-busters/node_modules/.bin/`.
2. **Commandes de référence sans passer par `npm`** :
   - **Exécution des tests** : `./node_modules/.bin/vitest run`
   - **Compilation de production** : `./node_modules/.bin/vite build`
   - **Vérification TypeScript** : `./node_modules/.bin/tsc --noEmit`
   - **Linter** : `./node_modules/.bin/eslint .`
   - **Formatage** : `./node_modules/.bin/prettier --write .`

### 4.2 Résultats des Vérifications Indépendantes

1. **Compilation Production (`./node_modules/.bin/vite build`)** :
   - Environnement client généré : 17 chunks, assets CSS compressés (126.90 kB / 19.06 kB gzip).
   - Environnement SSR généré : bundle nitro auto-généré pour Cloudflare (`hacktoberfest-by-lbs-les-bugs-busters`).
   - Durée : ~5.2 secondes.
   - Code de retour : **0 (Succès)**.
2. **Vérification Statique TypeScript (`./node_modules/.bin/tsc --noEmit`)** :
   - Aucun fichier en erreur de typage.
   - Code de retour : **0 (Succès)**.
3. **Suite de Tests Vitest (`./node_modules/.bin/vitest run`)** :
   - Total de fichiers : 7 test files.
   - Total de tests : 45 tests unitaires & d'intégration.
   - Détail :
     - `src/lib/risk-engine.test.ts` (7 tests) : Heuristiques locales de risque, détection d'urgence et vol d'OTP.
     - `src/test/app-routing.test.tsx` (10 tests) : Résolution des 10 routes TanStack Start.
     - `src/test/document-parser.test.ts` (5 tests) : Analyse de formats de cours et extraction textuelle.
     - `src/test/gemma-api.test.ts` (5 tests) : Client API Gemma 4, parsing JSON structuré, fallback hors-ligne.
     - `src/test/pdf-parser.test.ts` (2 tests) : Extraction PDF universelle unpdf.
     - `src/test/rag-indexer.test.ts` (4 tests) : Indexation vectorielle/BM25 des documents de cours.
     - `src/test/virustotal.test.ts` (12 tests) : Analyse des URLs suspectes et croisement de réputation.
   - Durée : 3.14 secondes.
   - Code de retour : **0 (Tous les 45 tests passent)**.
4. **Analyse ESLint (`./node_modules/.bin/eslint .`)** :
   - Déclenche 567 problèmes (556 erreurs, 11 avertissements).
   - 476 erreurs proviennent de la règle `prettier/prettier` (retours à la ligne et espaces dans le code existant).
   - Avertissements résiduels : types `any` dans `vite.config.ts` et `AppShell.tsx`, ainsi que règles `react-refresh/only-export-components`.

---

## 5. Synthèse & Plan d'Action pour l'Implémentation (Requirement R5)

Pour satisfaire pleinement aux critères d'acceptation du Requirement R5 :
1. **Créer un module de thème unifié (`src/lib/theme.tsx`)** :
   - Contexte React `ThemeProvider` + hook `useTheme()`.
   - Support des trois modes : `"light"`, `"dark"`, `"system"`.
   - Écoute dynamique de `window.matchMedia("(prefers-color-scheme: dark)")`.
   - Synchronisation instantanée avec `localStorage` (`"cybersafe_theme"`).
2. **Éliminer le flash de thème dans `src/routes/__root.tsx`** :
   - Injecter un script inline ultra-léger dans `<head>` vérifiant immédiatement `localStorage` et les préférences système pour appliquer la classe `dark` avant le premier rendu HTML.
3. **Corriger et enrichir `src/styles.css`** :
   - Remplacer `@custom-variant dark (&:is(.dark *));` par `@custom-variant dark (&:where(.dark, .dark *));`.
   - Définir dans `.dark` les variables manquantes : `--night`, `--night-foreground`, `--night-muted`, `--sidebar-accent`, `--sidebar-primary`, etc.
   - Ajuster `--shadow-neo` en dark mode pour utiliser une ombre noire pure avec décalage franc (`3px 3px 0px 0px #000000`) et bordure néon rehaussée.
   - Rehausser le contraste de `--muted-foreground` et `--border` en mode sombre.
4. **Harmoniser les composants visuels et éliminer les éléments dégradés** :
   - `CyberDecorations.tsx` : ajuster `STICKER_STYLES` pour avoir des versions sombres soignées (fonds feutrés, bordures colorées néon, typographie éclatante au lieu de texte noir forcé).
   - `CyberGlyph` : ne pas forcer un fond blanc en mode sombre pour la variante `dark`.
   - `Logo.tsx` : remplacer le conteneur forcé `bg-white` par un style adaptable aux deux thèmes avec liseré cyber subtil.
   - Supprimer les pavés `bg-white` dans `index.tsx`, `a-propos.tsx` et `qr.tsx` pour utiliser des cartes adaptatives `bg-card` avec bordure néo-brutaliste.
   - Remplacer les bordures délavées `border-foreground/15` dans `apprendre.tsx` par des bordures nettes `border-2 border-border` ou `border-foreground/30`.
   - Harmoniser les boutons `sticker` et `neo` dans `button.tsx` pour inclure des ombres et bordures sombres contrastées.
