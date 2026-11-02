# Rapport d'Enquête Approfondie — Architecture, R1 (Nettoyage Pitch) & R4 (Modernisation Logo)

**Date d'investigation** : 1er Novembre 2026  
**Auteur** : Teamwork Explorer (Instance 1 — Phase 0 Survey)  
**Projet** : CyberSafe Online — Les Bugs Busters  
**Statut** : Rapport d'analyse complet (Lecture seule)

---

## 1. Résumé Exécutif

L'investigation de CyberSafe Online a permis de cartographier avec une précision chirurgicale l'architecture générale du projet, l'intégralité des résidus de hackathon / pitch (R1) et la chaîne complète de rendu du logo et de la marque visuelle (R4).

- **Architecture & Santé globale** : Application moderne bâtie sur **TanStack Start**, **TanStack Router**, **React 19**, **Tailwind CSS v4** et **Vite 8 / Nitro**. La suite de tests Vitest (7 fichiers, 45 tests) passe à 100% avec succès, et le build de production s'exécute impeccablement en moins de 4,5 secondes (`./node_modules/.bin/vite build`).
- **R1 (Nettoyage Pitch & Hackathon)** : La présence d'éléments de concours est concentrée dans le composant `PitchModal.tsx` et ses déclencheurs dans `AppShell.tsx`, ainsi que dans la page `a-propos.tsx` (qui contient un panneau entier de 6 cartes dédié au barème 20/20 et au pitch 3 minutes). Des mentions textuelles spécifiques (« pour le Pitch en 1 clic », « Critère officiel Hackathon », badges « MLH × LBS 2026 », badge nav « MVP ») ont été répertoriées dans 7 fichiers distincts. Un faux positif critique a été isolé : `utterance.pitch = 1.0` dans `audio.tsx` relève de l'API standard Web Speech et **ne doit en aucun cas être supprimé**.
- **R4 (Modernisation du Logo & Intégration Visuelle)** : Le logo actuel est un fichier matriciel JPEG (`cybersafeimage.jpeg` de 15 Ko) encapsulé dans un carré blanc opaque avec bordure blanche (`bg-white p-1`). Cette solution produit un contraste inesthétique en thème sombre et une pixellisation lors des redimensionnements. De plus, `favicon.ico` est une copie binaire brute du JPEG, et `src/routes/__root.tsx` référence directement `/cybersafeimage.jpeg`. La création d'un composant SVG vectoriel natif adaptatif clair/sombre et de favicons vectoriels résoudra définitivement cette dette visuelle.

---

## 2. Architecture Globale et Configuration Technique

### 2.1 Arborescence Structurée du Projet

```
/home/ro0t_/Projects/les-bugs-busters/
├── package.json              # Dépendances et scripts de build
├── vite.config.ts            # Config Lovable TanStack + Nitro + middleware dev
├── vitest.config.ts          # Config Vitest (jsdom, setupFiles, alias @)
├── public/
│   ├── favicon.ico           # Identique en octets à cybersafeimage.jpeg
│   ├── cybersafeimage.jpeg   # Logo matriciel original
│   ├── cybersafeimage2.jpeg  # Bannière marque matricielle originale
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── cybersafeimage.jpeg   # 15.15 Ko (736x736 JPEG)
│   │   ├── cybersafeimage2.jpeg  # 125.89 Ko (1536x1024 JPEG)
│   │   └── hero-shield.jpg       # 92.05 Ko (Inutilisé dans le code)
│   ├── components/
│   │   ├── cs/               # Composants CyberSafe spécifiques
│   │   │   ├── AppShell.tsx         # Barre latérale, header sticky, navigation
│   │   │   ├── CyberDecorations.tsx # Primitives SVG néo-brutalistes (Stickers, Doodles, Grilles)
│   │   │   ├── Logo.tsx             # Composant Logo actuel
│   │   │   ├── PitchModal.tsx       # Modale de pitch 3 minutes (À retirer)
│   │   │   ├── ui.tsx               # Composants UI métier (PageHeader, Panel, RiskBadges)
│   │   │   └── VirusTotalCard.tsx   # Analyse VirusTotal v3
│   │   └── ui/               # Primitives shadcn/ui (Radix UI)
│   ├── lib/
│   │   ├── demo.ts           # Données de démonstration (SMS, cours, tontines)
│   │   ├── document-parser.ts# Extraction documents cours
│   │   ├── error-capture.ts  # Monitoring erreurs Lovable
│   │   ├── gemma-client.ts   # Client API Google Gemma
│   │   ├── history.ts        # Gestion de l'historique local
│   │   ├── i18n.tsx          # Système multilingue (fr, en, ee)
│   │   ├── ocr.ts            # Tesseract OCR local
│   │   ├── pdf-parser.ts     # Unpdf extraction
│   │   ├── rag-indexer.ts    # Indexation contextuelle RAG
│   │   ├── risk-engine.ts    # Moteur de risque T-Money / Moov Money
│   │   └── utils.ts          # clsx + twMerge helper
│   ├── locales/
│   │   ├── fr.json           # Français
│   │   ├── en.json           # Anglais
│   │   └── ee.json           # Éwé (langue locale Togo)
│   ├── routes/
│   │   ├── __root.tsx        # Shell racine HTML, métadonnées, favicons, AppShell
│   │   ├── index.tsx         # Tableau de bord d'accueil (Bento grid)
│   │   ├── sms.tsx           # Scanner SMS et détection de conformité syntaxique
│   │   ├── qr.tsx            # Scanner QR Code et réputation de liens URL
│   │   ├── audio.tsx         # Détection des fraudes par appel vocal
│   │   ├── assistant.tsx     # Assistant conversationnel Gemma 4
│   │   ├── apprendre.tsx     # Volet d'apprentissage étudiant et FlashCards
│   │   ├── historique.tsx    # Historique des scans et activités
│   │   ├── guide.tsx         # Guide pratique des arnaques et syntaxes officielles
│   │   ├── a-propos.tsx      # Page À Propos (contenant actuellement le barème 20/20)
│   │   └── parametres.tsx    # Préférences linguistiques et thèmes
│   ├── server/
│   │   ├── api-handler.ts    # Endpoint unifié /api/analyze
│   │   ├── gemma.ts          # Intégration backend Google GenAI SDK
│   │   └── virustotal.ts     # Intégration backend VirusTotal v3
│   └── styles.css            # Tailwind CSS v4, tokens OKLCH, ombres néo-brutalistes
```

### 2.2 Stack Technique et Dépendances Clés

| Domaine | Technologie | Rôle |
|---|---|---|
| **Framework Fullstack** | TanStack Start (`1.168.60`) + TanStack Router (`1.170.41`) | Rendu hybride SSR/client, typage strict des routes |
| **Bundler & Server** | Vite (`8.1.5`) + Nitro (`3.0.260603-beta`) | Compilation ultra-rapide, déploiement Cloudflare/Node |
| **Framework UI** | React (`19.2.0`) + Radix UI Primitives | Composants accessibles, réactivité moderne |
| **Styles & Thème** | Tailwind CSS v4 (`4.2.1`), `tw-animate-css` | Thème néo-brutaliste cyber, variables OKLCH |
| **Intelligence Artificielle** | `@google/genai` (`2.32.0`) | Google Gemma 4 (`gemma-4-26b-a4b-it`) et fallback |
| **Vision & Extraction** | Tesseract.js (`7.0.0`), unpdf (`2.1.0`), jsQR (`1.4.0`) | OCR sur captures d'écran, extraction PDF, décodage QR |
| **Sécurité & Réputation** | API VirusTotal v3 | Détection de phishing et d'URL malveillantes en direct |
| **Internationalisation** | Provider I18n sur mesure (`src/lib/i18n.tsx`) | Trilingue (Français, Anglais, Éwé) |
| **Tests** | Vitest (`4.1.12`), Testing Library, JSDOM | Tests unitaires et d'intégration automatisés |

### 2.3 Environnement d'Exécution & Commandes de Build/Test

- **Node.js** : Présent sur la machine hôte (`/usr/bin/node` en version **v26.12.0**).
- **Gestionnaire de paquets / Binaires** : La commande globale `npm` n'étant pas mappée dans le `$PATH` courant du sous-shell, les exécutables de développement sont directement et fiablement accessibles via le dossier `./node_modules/.bin/`.
- **Exécution des tests** :
  ```bash
  ./node_modules/.bin/vitest run
  ```
  *Résultat vérifié* : 7 fichiers de test passés, 45 tests réussis en 2,56 secondes.
- **Compilation de production** :
  ```bash
  ./node_modules/.bin/vite build
  ```
  *Résultat vérifié* : Compilation client (.output/public) en 2,65s et SSR Nitro (.output/server) en 1,42s sans aucune erreur.

---

## 3. Analyse Exhaustive de l'Exigence R1 : Retrait des Éléments de Pitch et Nettoyage du Code

### 3.1 Inventaire Précis de `PitchModal.tsx` et de ses Déclencheurs

Le composant `PitchModal` est un artefact conçu spécifiquement pour assister les présentateurs du hackathon pendant un pitch chronométré de 3 minutes.

- **Fichier source** : `src/components/cs/PitchModal.tsx` (197 lignes)
  - Chronomètre de 180 secondes avec boutons Lancer / Pause / Reset (`useState(180)`).
  - 4 étapes calquées sur le barème :
    1. `0:00 - 0:45` : *« 1. Le Problème Réel au Togo »*
    2. `0:45 - 1:45` : *« 2. Démo MVP Scanner SMS (Gemma 4) »*
    3. `1:45 - 2:30` : *« 3. Volet « Apprendre » (/apprendre) »*
    4. `2:30 - 3:00` : *« 4. Conclusion & Barème 20 / 20 »* (lien direct vers `/a-propos`).
  - Mentions textuelles :
    - Ligne 96 : `<h2>Aide de Pitch — 3 Minutes Chrono</h2>`
    - Ligne 99 : `<p>Suivez le timing parfait pour impressionner le jury MLH & LBS CS Club</p>`
    - Ligne 187 : `Équipe « Les Bugs Busters » — Lomé Business School`
- **Invocations dans `src/components/cs/AppShell.tsx`** :
  - Ligne 22 : `import { PitchModal } from "./PitchModal";`
  - Ligne 100 : `const [pitchOpen, setPitchOpen] = useState(false);`
  - Lignes 172-179 : Bouton icône Trophée dans le header mobile :
    ```tsx
    <button
      type="button"
      onClick={() => setPitchOpen(true)}
      title="Aide de Pitch 3 min"
      className="grid size-8 place-items-center rounded-lg border-2 border-amber-500/40 bg-amber-500/15 text-amber-400 ..."
    >
      <Trophy className="size-4" />
    </button>
    ```
  - Lignes 239-246 : Bouton « Pitch 3 min » dans la barre supérieure desktop :
    ```tsx
    <button
      type="button"
      onClick={() => setPitchOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-black text-amber-700 dark:text-amber-300 ..."
    >
      <Trophy className="size-3.5 text-amber-500" />
      <span>Pitch 3 min</span>
    </button>
    ```
  - Ligne 302 : Rendu de la modale :
    ```tsx
    <PitchModal open={pitchOpen} onClose={() => setPitchOpen(false)} />
    ```

### 3.2 L'Écran « À Propos » (`src/routes/a-propos.tsx`) & Le Panneau Barème 20/20

Dans la page `src/routes/a-propos.tsx`, plus de 100 lignes de code sont consacrées à l'évaluation du hackathon plutôt qu'à une présentation produit SaaS pérenne :

1. **Métadonnées et titres** :
   - Lignes 26-28 : `content: "Présentation du projet CyberSafe Online par l'équipe Les Bugs Busters pour le Hackathon Build with Gemma."`
   - Ligne 41 : `title="À Propos & Grille d'Évaluation du Hackathon"`
   - Ligne 42 : `subtitle="CyberSafe Online — Développé par l'équipe « Les Bugs Busters » lors du Hacktoberfest Hack Day Lomé × LBS CS Club."`
   - Lignes 48-50 : `<CyberSticker tone="yellow" icon={Trophy} rotate="none">MLH × LBS 2026</CyberSticker>`
2. **Panneau Barème 20/20 (Lignes 89 à 187)** :
   - Titre du panel : `Conformité Intégrale aux 5 Critères du Hackathon (20 / 20)`
   - Sous-titre : `Vérification point par point des attentes du jury MLH & LBS CS Club`
   - Badge : `Objectif 20/20`
   - 5 cartes de critères (notées 4/4 chacune) :
     - *1. Compréhension du problème (4/4)*
     - *2. Innovation & Originalité (4/4)*
     - *3. Usage de Gemma (4/4)*
     - *4. Démo & Qualité Technique (4/4)*
     - *5. Impact & Respect des Règles (4/4)*
   - 1 carte chronomètre pitch :
     - Ligne 174 : `Chronomètre Pitch Démo`
     - Ligne 178 : `Script 3 Minutes Chrono`
     - Lignes 180-184 : découpage timing du pitch (`0:00 - 0:45 ... 2:30 - 3:00 : Impact direct & Barème 20/20`).

### 3.3 Autres Mentions Disséminées dans les Routes et Fichiers

| Fichier | Ligne(s) | Contenu Actuel | Correction Préconisée |
|---|---|---|---|
| `src/routes/qr.tsx` | 363 | `Exemples de démonstration pour le Pitch (1 clic) :` | `Exemples d'analyse rapide (1 clic) :` |
| `src/routes/audio.tsx` | 482 | `Scénarios d'appels réels au Togo (Prêts pour le Pitch en 1 clic) :` | `Scénarios d'appels réels au Togo (Prêts à tester en 1 clic) :` |
| `src/routes/guide.tsx` | 99 | `Critère officiel d'évaluation de conformité syntaxique (Hackathon Build with Gemma)` | `Référentiel officiel de conformité syntaxique et d'authenticité` |
| `src/routes/index.tsx` | 141 | `<CyberSticker tone="yellow" rotate="right">MLH × LBS 2026</CyberSticker>` | Remplacer par un badge SaaS : `<CyberSticker tone="yellow">Plateforme SaaS 2026</CyberSticker>` |
| `src/components/cs/AppShell.tsx` | 233 | `<CyberSticker tone="cyan" rotate="none">MLH × LBS 2026</CyberSticker>` | Remplacer par : `<CyberSticker tone="cyan">Protection Togo & Ouest-Africaine</CyberSticker>` |
| `src/components/cs/AppShell.tsx` | 37 | `badge: "MVP"` dans `NAV_ITEMS` pour `/sms` | Supprimer la propriété `badge: "MVP"` pour un aspect produit fini |
| `src/routes/apprendre.tsx` | 162 | `courseTitle: "Sécurité des Paiements Mobiles (LBS)"` | `courseTitle: "Sécurité des Paiements Mobiles"` |
| `src/lib/demo.ts` | 37-38 | `id: "cyber-lbs"`, `title: "Sécurité des Paiements Mobiles & Cryptographie (LBS)"` | `id: "cyber-securite"`, `title: "Sécurité des Paiements Mobiles & Cryptographie"` |
| `README.md` | 5-6, 41, 89 | Mentions du « cadre du HACKTOBERFEST By LBS » et « jury MLH » | Reformuler en application SaaS citoyenne pérenne |

### 3.4 Faux Positif Identifié (Attention Requise)

Dans `src/routes/audio.tsx` à la ligne 207 :
```typescript
utterance.pitch = 1.0;
```
Ce paramètre règle la hauteur tonale (pitch) de la voix dans l'API standard `window.speechSynthesis`. Il s'agit d'un appel API légitime et **non d'un reste de hackathon**. Il doit être impérativement conservé.

### 3.5 Analyse du Code Mort et Nettoyage Fichiers

- **Asset orphelin** : `src/assets/hero-shield.jpg` (92 Ko) n'est importé ni référencé dans aucun fichier source.
- **Fichiers doublons à la racine** : `cybersafeimage.jpeg` et `cybersafeimage2.jpeg` sont présents à la fois à la racine (`/home/ro0t_/Projects/les-bugs-busters/`), dans `public/` et dans `src/assets/`. Une fois la modernisation du logo vectoriel SVG effectuée, ces fichiers matriciels redondants pourront être retirés ou archivés.
- **Commentaires et TODOs** : L'analyse regex systématique n'a révélé aucun marqueur négligé (`TODO`, `FIXME`, `HACK`, `TEMP`). Le code est rigoureux et propre, à l'exception des mentions textuelles de pitch identifiées ci-dessus.

---

## 4. Analyse Exhaustive de l'Exigence R4 : Modernisation du Logo et Intégration Visuelle

### 4.1 Inventaire des Fichiers de Marque Actuels

1. **`src/assets/cybersafeimage.jpeg`** :
   - Format : JPEG matriciel (non vectoriel), 736 × 736 px, 15 150 octets.
   - Visuel : Symbole abstrait noir composé d'un losange supérieur (forme de diamant) et d'une boucle inférieure en ruban / nœud infini (évoquant une silhouette protectrice ou un cadenas stylisé).
   - Fond : Blanc / gris clair uniforme non transparent (`#fbfbfb`).
2. **`src/assets/cybersafeimage2.jpeg`** :
   - Format : JPEG matriciel, 1536 × 1024 px, 125 893 octets.
   - Visuel : Bannière officielle complète avec le symbole à gauche, le texte « CYBERSAFE ONLINE », la mention « SÉCURITÉ & APPRENTISSAGE INTELLIGENT » et le slogan. Fond blanc opaque.
3. **`public/favicon.ico`** :
   - Taille : 15 150 octets.
   - Constat critique : Il ne s'agit pas d'un vrai fichier ICO multi-résolution, mais d'une **copie bit-à-bit du fichier JPEG `cybersafeimage.jpeg`**.
4. **`src/routes/__root.tsx`** :
   - Lignes 94-96 :
     ```tsx
     { rel: "icon", href: "/cybersafeimage.jpeg", type: "image/jpeg" },
     { rel: "shortcut icon", href: "/cybersafeimage.jpeg" },
     { rel: "apple-touch-icon", href: "/cybersafeimage.jpeg" },
     ```
     La balise favicon dans le HTML force le navigateur à charger un JPEG brut sans canal alpha au lieu d'un format favicon standard (`image/svg+xml` ou `.ico` / `.png`).

### 4.2 Chaîne de Rendu du Logo dans l'Application

Le logo est affiché à travers le composant `Logo.tsx` et directement dans deux bannières d'accueil :

#### A. Le Composant `src/components/cs/Logo.tsx`
```tsx
import logoMark from "@/assets/cybersafeimage.jpeg";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-glow ring-1 ring-white/20 transition-transform duration-200 hover:scale-105">
        <img
          src={logoMark}
          alt="CyberSafe Online Logo"
          className="size-full object-contain"
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-base font-extrabold tracking-tight">
            CyberSafe<span className="text-electric font-black"> Online</span>
          </div>
          <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.16em] opacity-75 font-semibold">
            Sécurité & IA · Togo
          </div>
        </div>
      )}
    </div>
  );
}
```

#### B. Points d'Intégration du Composant `Logo`
1. **Sidebar Desktop** (`src/components/cs/AppShell.tsx`, ligne 132) :
   - Dans le panneau latéral sombre fixe (`bg-sidebar`).
   - Le conteneur `bg-white p-1` du logo ressort comme une vignette blanche carrée sur le fond sombre de la sidebar.
2. **Header Mobile Sticky** (`src/components/cs/AppShell.tsx`, ligne 169) :
   - En haut de l'écran sur smartphone, affiché en format standard.
3. **Menu Tiroir Mobile (Drawer)** (`src/components/cs/AppShell.tsx`, ligne 203) :
   - Dans le menu hamburger déroulant.
4. **Bannière d'Accueil Desktop** (`src/routes/index.tsx`, ligne 192) :
   - Rendu direct de `brandBanner` (`cybersafeimage2.jpeg`) dans une carte blanche (`bg-white p-4 shadow-neo`).
5. **Bannière Page À Propos** (`src/routes/a-propos.tsx`, ligne 58) :
   - Rendu direct de `brandBanner` (`cybersafeimage2.jpeg`) dans un conteneur similaire.

### 4.3 Diagnostic des Faiblesses et Proposition de Modernisation Vectorielle

1. **Absence de transparence & Problème de thème sombre** :
   - Étant en JPEG, le fond blanc du logo force l'utilisation de `bg-white` autour de l'image. En thème sombre, cela crée une « boîte blanche » agressive en totale rupture avec l'esthétique néo-brutaliste cyber de l'application.
2. **Qualité et mise à l'échelle** :
   - En petite résolution (favicon 16x16, 32x32) ou en version agrandie sur écran Retina, le JPEG subit des artefacts de compression.
3. **Spécification du nouveau logo vectoriel SVG** :
   - **Emblème vectoriel pur** : Recréer la silhouette emblématique (diamant supérieur + nœud de sécurité infini) sous forme de tracés SVG vectoriels nets (`<path>` avec `fill` et `stroke`).
   - **Adaptabilité dynamique clair / sombre** :
     - En mode clair : traits noirs profonds / bleu électrique avec accents néo-brutalistes nets.
     - En mode sombre : lueurs cyan néon (`#38bdf8`), vert électrique lime (`#a3e635`) ou dégradé cyber sans boîte blanche de fond.
   - **Typographie intégrée** : Préservation de la police `Sora` (font-display) pour « CyberSafe » avec « Online » en bleu électrique et sous-titre clair.
   - **Favicon vectoriel moderne** : Créer `public/favicon.svg` et un véritable `public/favicon.ico` transparent, et mettre à jour `src/routes/__root.tsx` avec :
     ```html
     <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
     ```

---

## 5. Synthèse des Impacts et Interdépendances

| Exigence | Interaction avec R1 & R4 | Points d'Attention |
|---|---|---|
| **R1 (Nettoyage Hackathon)** | Affecte `AppShell.tsx` et `a-propos.tsx` | La suppression de `PitchModal` libère de l'espace dans la barre supérieure pour le déclencheur de l'Onboarding Tour (R2). |
| **R2 (Onboarding Tour)** | S'insère dans `AppShell.tsx` | Le bouton de lancement de la visite guidée peut avantageusement remplacer le bouton « Pitch 3 min » retiré dans le header. |
| **R4 (Logo Vectoriel)** | Modifie `Logo.tsx`, `AppShell.tsx`, `__root.tsx` | Un logo vectoriel SVG transparent s'intègre harmonieusement dans la sidebar et améliore immédiatement le contraste du thème sombre (R5). |
| **R5 (Thème Sombre)** | Aligné sur `styles.css` et `Logo.tsx` | La disparition de la boîte blanche du logo JPEG élimine le principal défaut de contraste identifié dans la sidebar sombre. |

---

## 6. Prochaines Étapes pour l'Équipe d'Implémentation

1. **Retirer `PitchModal.tsx`** et nettoyer les états `pitchOpen`, les boutons de déclenchement dans `AppShell.tsx`, et les badges `MVP` / `MLH × LBS 2026`.
2. **Refondre la page `a-propos.tsx`** pour substituer au barème 20/20 une présentation SaaS de CyberSafe Online (mission citoyenne, technologies IA Gemma 4, architecture de sécurité et engagement en Afrique de l'Ouest).
3. **Mettre à jour les formulations textuelles** dans `qr.tsx`, `audio.tsx`, `guide.tsx`, `apprendre.tsx` et `demo.ts`.
4. **Concevoir le logo SVG vectoriel** dans `src/components/cs/Logo.tsx` avec support natif clair/sombre, générer `public/favicon.svg` et actualiser les liens d'icônes dans `__root.tsx`.
5. **Vérifier en continu** que `./node_modules/.bin/vitest run` et `./node_modules/.bin/vite build` demeurent exempts de la moindre régression.
