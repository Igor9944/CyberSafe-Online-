# Handoff Report — Phase 0 Survey (Teamwork Explorer 3)

## 1. Observation

### 1.1 Configuration CSS & Thème Sombre
- **`src/styles.css` (Ligne 5)** :  
  `@custom-variant dark (&:is(.dark *));`  
  Le sélecteur cible uniquement les descendants (`.dark *`) et non l'élément racine lui-même lorsque la classe `.dark` est posée sur `<html>` ou `<body>`.
- **`src/styles.css` (Lignes 53-103 vs 105-137)** :  
  Dans `:root`, les variables `--night` (`oklch(0.16 0.048 264)`), `--night-foreground` (`oklch(0.97 0.01 255)`), et `--night-muted` (`oklch(0.74 0.04 258)`) sont définies. Dans le bloc `.dark`, ces variables sont **totalement absentes**. En conséquence, le fond `--background` en mode sombre vaut `oklch(0.14)` tandis que les conteneurs `bg-night` valent `oklch(0.16)`, ce qui produit un différentiel de luminance de seulement 2%, imperceptible à l'œil.
- **`src/styles.css` (Lignes 134-136)** :  
  `--shadow-neo: 3px 3px 0px 0px rgba(255, 255, 255, 0.35);`  
  Les ombres néo-brutalistes en mode sombre sont définies avec du blanc semi-transparent à 35%, créant un halo laiteux flou plutôt qu'une ombre décalée dure et nette.

### 1.2 Basculement et Persistance du Thème
- **`src/components/cs/AppShell.tsx` (Lignes 101-121)** :  
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
  ```
  Le code ne consulte pas `window.matchMedia("(prefers-color-scheme: dark)")`. Si `cybersafe_theme` n'est pas encore stocké, le thème clair est imposé par défaut même si le système d'exploitation de l'utilisateur est configuré en mode sombre.
- **`src/routes/__root.tsx` (Lignes 108-119)** :  
  `RootShell` génère `<html lang="fr">` sans script inline préalable de vérification du thème. Le basculement vers le mode sombre s'effectue après hydratation React via `useEffect`, causant un flash visuel (FOUC).

### 1.3 Conteneurs et Éléments Visuels Non Adaptés
- **`src/routes/index.tsx` (Ligne 190) & `src/routes/a-propos.tsx` (Ligne 56)** :  
  `<div className="w-full rounded-2xl border-2 border-slate-800 bg-white p-4 shadow-neo ring-1 ring-white/20 transition-all hover:scale-[1.02] duration-300">` et `<div className="w-full md:w-1/2 overflow-hidden rounded-2xl border-2 border-foreground bg-white p-4 shadow-neo">` forcent un fond blanc pur (`bg-white`) autour de l'image de bannière officielle même en mode sombre.
- **`src/components/cs/Logo.tsx` (Ligne 7)** :  
  `<div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-glow ring-1 ring-white/20 transition-transform duration-200 hover:scale-105">` : conteneur blanc pur forcé derrière le logo raster JPEG.
- **`src/components/cs/CyberDecorations.tsx` (Ligne 351)** :  
  Dans `CyberGlyph`, la variante `dark` applique :  
  `dark: "bg-slate-950 text-white border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:bg-white dark:text-slate-950 dark:border-white/50 dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.4)]"`  
  En mode sombre, le glyphe bascule sur un fond blanc pur éclatant avec texte noir (`dark:bg-white dark:text-slate-950`), éblouissant l'utilisateur.
- **`src/components/cs/AppShell.tsx` (Lignes 81-86)** :  
  Les badges de la barre latérale ont pour style :  
  `bg-[#D9F99D] text-slate-950 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]`  
  Dans la barre latérale sombre (`bg-sidebar`), la bordure noire `border-slate-900` et l'ombre noire `#0f172a` sont invisibles sur fond sombre.
- **`src/components/ui/button.tsx` (Ligne 22)** :  
  `sticker: "border-2 border-slate-900 bg-[#D9F99D] text-slate-950 font-bold shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,0.95)] ..."`  
  Aucune règle `dark:` n'est définie pour la bordure ou l'ombre.
- **`src/routes/apprendre.tsx` (Lignes 1180, 1193, 1225, 1254, 1263, 1277)** :  
  Multiples bordures à faible opacité (`border-foreground/15`, `border-foreground/20`, `border-foreground/25`) rendant les cartes et boutons peu définis en mode sombre.

### 1.4 Commandes Build & Test
- **Commande `./node_modules/.bin/vitest run`** :  
  Sortie verbatim :  
  ```
  Test Files  7 passed (7)
  Tests  45 passed (45)
  Duration  3.14s
  ```
- **Commande `./node_modules/.bin/vite build`** :  
  Sortie verbatim :  
  ```
  ✓ 1966 modules transformed.
  ✓ built in 3.14s (client)
  ✓ built in 2.04s (ssr)
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  Code de retour : 0.
- **Commande `./node_modules/.bin/tsc --noEmit`** :  
  Code de retour : 0 (aucune erreur de compilation TypeScript).
- **Commande `./node_modules/.bin/eslint .`** :  
  Code de retour : 1 (567 problèmes, dont 476 erreurs `prettier/prettier` dues à l'intégration du plugin Prettier dans ESLint v9).

---

## 2. Logic Chain

1. **De l'observation 1.1 à la hiérarchie visuelle sombre** :  
   Les variables `--night`, `--night-foreground`, et `--night-muted` sont exploitées dans `AppShell.tsx` (sidebar) et `index.tsx` (bandeau de conseils informels). Leur absence dans `.dark` fait que ces conteneurs gardent la valeur par défaut de `:root` (`oklch(0.16)`). Comme le fond de page en mode sombre vaut `oklch(0.14)`, il n'y a plus aucune séparation d'élévation ni de profondeur visuelle, ce qui contrevient à l'exigence R5 ("hiérarchie visuelle claire et finitions élégantes").
2. **De l'observation 1.2 à l'expérience utilisateur (FOUC & Préférence système)** :  
   L'initialisation de `dark` avec `useState(false)` et la vérification différée dans `useEffect` imposent le rendu initial en mode clair par le serveur et le client avant la bascule. Sans détection de `prefers-color-scheme`, les utilisateurs système sombre voient un thème clair par défaut. Un contexte global et un script d'amorce inline dans le `<head>` éliminent directement ce défaut ergonomique.
3. **De l'observation 1.3 à la correction des éléments dégradés / illisibles** :  
   L'utilisation de `bg-white` sur les bannières, le logo et les aperçus QR génère des zones blanches aveuglantes dans une interface sombre. De même, la variante `dark` de `CyberGlyph` forçant un fond blanc `dark:bg-white` rompt l'harmonie sombre. Corriger ces classes et fournir des badges stylisés adaptés avec bordures néon permet d'atteindre le critère d'acceptation "Tous les textes, boutons, cartes et arrière-plans du thème sombre respectent un contraste de lisibilité élevé sans texte sombre sur fond sombre".
4. **De l'observation 1.4 aux scripts de construction et tests de validation** :  
   L'absence de `npm` dans le PATH système sous Arch Linux est contournée avec succès en appelant directement les binaires locaux `./node_modules/.bin/vitest` et `./node_modules/.bin/vite`. Toutes les suites de tests actuelles sont saines (45/45 pass) et la compilation est fonctionnelle, fournissant une base de non-régression solide pour les modifications ultérieures.

---

## 3. Caveats

- **Mode d'investigation en lecture seule** : Aucune modification de code n'a été apportée aux fichiers sources hors du répertoire d'exploration `.agents/teamwork/teamwork_explorer_survey_3/`.
- **Règles de style ESLint existantes** : Le projet a activé `eslint-plugin-prettier/recommended` dans `eslint.config.js`. Tout fichier source touché sans un formatage strict Prettier déclenchera des erreurs ESLint. Il est conseillé de passer `./node_modules/.bin/prettier --write .` ou d'exécuter Prettier après modification.
- **Règles Lovable** : Ne pas modifier l'historique git publié (pas de rebase/amend) conformément à `AGENTS.md`.

---

## 4. Conclusion

1. **Le Requirement R5 est clairement circonscrit et réalisable** :  
   - Les modifications prioritaires concernent la configuration des variables CSS dans `src/styles.css` (redéfinition de `--night`, `--border`, `--muted-foreground`, `--shadow-neo` en dark mode).
   - La centralisation de la gestion du thème dans un hook/provider dédié (`src/lib/theme.tsx`) avec support de `prefers-color-scheme` et insertion d'un script d'amorce dans `src/routes/__root.tsx`.
   - L'harmonisation des composants cyber (`CyberDecorations.tsx`, `Logo.tsx`, `button.tsx`) pour remplacer les pavés `bg-white`, les stickers aux ombres laiteuses et les bordures délavées par des bordures franches (2px) et des accents contrastés.
2. **L'environnement de test et de build est vérifié et opérationnel** :  
   - Les commandes `./node_modules/.bin/vite build` et `./node_modules/.bin/vitest run` sont stables, rapides et validées.

---

## 5. Verification Method

Pour reproduire et vérifier de manière indépendante les conclusions :
1. **Vérifier l'exécution de la suite de tests** :
   ```bash
   ./node_modules/.bin/vitest run
   ```
   *Résultat attendu* : 7 fichiers testés, 45 tests avec statut `passed`.
2. **Vérifier le build de production** :
   ```bash
   ./node_modules/.bin/vite build
   ```
   *Résultat attendu* : Code de retour 0, génération complète de l'environnement client et SSR dans `.output/`.
3. **Vérifier le typage TypeScript** :
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ```
   *Résultat attendu* : Code de retour 0, aucune erreur.
4. **Inspecter les fichiers sources pour confirmer les observations** :
   - Inspecter `src/styles.css` lignes 5 et 105-137.
   - Inspecter `src/components/cs/AppShell.tsx` lignes 101-121.
   - Inspecter `src/components/cs/CyberDecorations.tsx` lignes 273-282 et ligne 351.
   - Inspecter `src/routes/index.tsx` ligne 190.
