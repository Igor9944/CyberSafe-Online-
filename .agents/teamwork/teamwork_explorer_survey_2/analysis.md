# Rapport d'Analyse & Étude Préalable (Survey Report)
## Exigences R3 (Modes Avancés FlashCards) & R2 (Visite Guidée Interactive)

**Auteur** : Teamwork Explorer (Instance 2 — Phase 0 Survey)  
**Date** : 2026-11-01  
**Projet** : CyberSafe Online (Transition Hackathon vers Produit SaaS Personnel)  
**Cible d'enquête** : Codebase `/home/ro0t_/Projects/les-bugs-busters`  

---

## Sommaire Exécutif

Cette enquête fournit les bases architecturales, les spécifications techniques détaillées et le plan de mise en œuvre pour deux fonctionnalités clés de l'application CyberSafe Online :
1. **R3. Modes avancés des FlashCards d'apprentissage** : Transformation du module de cartes passives en un système interactif d'entraînement à deux modes distincts — **Mode « Oui / Non »** (Vrai/Faux avec feedback immédiat) et **Mode « Bonne Réponse »** (QCM avec explication pédagogique instantanée), bascule fluide en cours de session et unification rigoureuse du score et du suivi de progression.
2. **R2. Visite guidée interactive (Guided Onboarding Tour)** : Conception d'un système d'accueil interactif, léger, accessible, non-bloquant et déclenchable à la demande ou au premier accès, guidant l'utilisateur à travers les points d'entrée vitaux (Dashboard, Scanners SMS/QR/Audio, Espace Étudiant, Assistant IA, Thèmes et Langues) sans dépendance lourde externe, conformément au mode d'intégrité démo.

---

# PARTIE 1 : Enquête Approfondie — Exigence R3 (Modes Avancés des FlashCards)

### 1.1 État des Lieux et Diagnostic du Code Existant

#### Fichiers et Composants Clés
* **Page Principale** : `src/routes/apprendre.tsx` (1480 lignes)
* **Génération Serveur Gemma 4** : `src/server/gemma.ts` (lignes 127-132, 596-660)
* **Routeur API Serveur** : `src/server/api-handler.ts` (lignes 133-144)
* **Client Gemma** : `src/lib/gemma-client.ts` (lignes 324-346)
* **Jeux de Données de Démonstration** : `src/lib/demo.ts` (`DEMO_COURSES`, lignes 35-86)
* **Stockage Local** : `localStorage` sous les clés :
  * `COURSES_STORAGE_KEY = "cybersafe_student_courses_v1"`
  * `QUIZ_HISTORY_KEY = "cybersafe_student_quiz_history_v1"`

#### Structure Actuelle des Données
Dans `src/routes/apprendre.tsx` (lignes 54-70) :
```typescript
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface StoredCourseItem {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  content: string;
  fileType: "pdf" | "docx" | "pptx" | "txt" | "md" | "manual";
  createdAt: string;
  flashcards: Flashcard[];
}
```

Dans `src/server/gemma.ts` (lignes 127-132) :
```typescript
export interface GemmaFlashcardItem {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}
```

#### Fonctionnement Actuel et Limites Observées
1. **Génération de Secours (Fallback hors-ligne)** :
   `generateFlashcardsForContent(title: string, text: string): Flashcard[]` (`src/routes/apprendre.tsx`, lignes 185-218) découpe le texte du cours par lignes et génère 3 cartes basiques avec des titres génériques (*"Définition / Règle clé"*, *"Notion essentielle"*).
2. **Génération IA par Gemma 4** :
   Dans `src/server/gemma.ts` (lignes 596-660), le prompt demande 4 à 6 fiches avec `front` et `back`.
3. **Affichage dans l'Interface Utilisateur** :
   Dans `src/routes/apprendre.tsx` (lignes 1177-1285), l'onglet `flashcards` affiche une carte rectangulaire cliquable qui bascule l'état `isFlipped` entre `front` et `back`.
4. **Limites Critiques Identifiées** :
   * **Absence d'interactivité évaluative** : L'utilisateur ne teste pas activement ses connaissances, il retourne simplement la carte de façon passive.
   * **Aucun Mode « Oui / Non »** : Pas d'affirmation binaire à valider, pas de retour de succès/erreur immédiat.
   * **Aucun Mode « Bonne Réponse » (QCM)** : Pas de liste d'options à choix multiples avec distracteurs et justification pédagogique contextuelle.
   * **Pas de bascule de mode** : Aucune option dans l'interface pour changer de paradigme d'apprentissage.
   * **Suivi de progression sommaire** : Seul un bouton *"Marquer comme su"* inverse `mastered: boolean`. Aucune métrique de réussite, précision ou mémorisation par mode.

---

### 1.2 Architecture Cible pour R3

#### 1.2.1 Modèle de Données Enrichi et Rétrocompatible
Pour préserver la compatibilité totale avec les cours existants tout en supportant les deux nouveaux modes :

```typescript
export type FlashcardMode = "binary" | "mcq";

export interface Flashcard {
  id: string;
  front: string;              // Recto classique / Concept fondamental
  back: string;               // Verso classique / Définition ou règle clé
  mastered: boolean;          // État global de maîtrise

  // --- Propriétés Mode « Oui / Non » (Affirmation binaire) ---
  binaryStatement?: string;   // Affirmation à juger (ex: "Un SMS officiel T-Money contient toujours un lien web.")
  binaryAnswer?: boolean;     // Réponse attendue : true (Oui/Vrai) ou false (Non/Faux)
  binaryExplanation?: string; // Explication pédagogique immédiate fournie après le clic

  // --- Propriétés Mode « Bonne Réponse » (QCM à choix multiples) ---
  mcqQuestion?: string;       // Question explicite (ex: "Quel code USSD officiel permet de vérifier son solde T-Money ?")
  mcqOptions?: string[];      // Liste de 3 ou 4 choix
  mcqAnswerIndex?: number;    // Index du choix correct (0 à N-1)
  mcqExplanation?: string;    // Justification détaillée de la réponse

  // --- Métriques de Progression par Carte ---
  stats?: {
    binaryAttempts: number;
    binaryCorrect: number;
    mcqAttempts: number;
    mcqCorrect: number;
    lastTrainedAt?: string;
  };
}
```

#### 1.2.2 Adaptateur Runtime et Remplissage Automatique (`normalizeFlashcard`)
Afin que les cartes existantes dans `localStorage` ou générées par un upload de document puissent immédiatement être jouées dans les deux modes, une fonction pure de normalisation garantit que chaque carte possède des valeurs par défaut pertinentes si les champs avancés sont manquants :

```typescript
export function normalizeFlashcard(fc: Partial<Flashcard>, index: number, courseTitle: string): Flashcard {
  const isBinaryTrue = index % 2 === 0;
  return {
    id: fc.id || `fc-${index + 1}`,
    front: fc.front || `Notion clé ${index + 1} : ${courseTitle}`,
    back: fc.back || "Consultez les notes du cours pour approfondir cette notion.",
    mastered: Boolean(fc.mastered),
    
    // Mode Oui / Non
    binaryStatement: fc.binaryStatement || (isBinaryTrue 
      ? `Règle confirmée : ${fc.front || courseTitle} implique que ${fc.back || "cette procédure est obligatoire."}`
      : `Piège fréquent : Il est conseillé d'ignorer les vérifications officielles pour ${fc.front || courseTitle}.`),
    binaryAnswer: fc.binaryAnswer !== undefined ? fc.binaryAnswer : isBinaryTrue,
    binaryExplanation: fc.binaryExplanation || (fc.back 
      ? `Explication : ${fc.back}` 
      : "Révisez les principes fondamentaux de cette leçon pour consolider votre compréhension."),

    // Mode Bonne Réponse (QCM)
    mcqQuestion: fc.mcqQuestion || `Concernant « ${fc.front || courseTitle} », quelle est l'affirmation correcte ?`,
    mcqOptions: (fc.mcqOptions && fc.mcqOptions.length >= 3) ? fc.mcqOptions : [
      fc.back || "C'est la définition officielle conforme et sécurisée.",
      "C'est une procédure non vérifiée qui présente des risques.",
      "C'est une recommandation obsolète qui n'est plus en vigueur.",
    ],
    mcqAnswerIndex: fc.mcqAnswerIndex !== undefined ? fc.mcqAnswerIndex : 0,
    mcqExplanation: fc.mcqExplanation || fc.back || "Cette réponse découle des règles établies dans le cours.",

    stats: fc.stats || {
      binaryAttempts: 0,
      binaryCorrect: 0,
      mcqAttempts: 0,
      mcqCorrect: 0,
    },
  };
}
```

#### 1.2.3 Enrichissement des Cours Démo (`src/lib/demo.ts`)
Les 3 cours démo intégrés bénéficient de fiches rédigées sur mesure :
1. **Cybersécurité & Réseaux** (Paiements Mobiles T-Money / Moov Money) :
   * *Oui/Non 1* : « Un SMS officiel de T-Money ou Moov Money intègre systématiquement un lien web cliquable (.xyz ou .top) pour valider l'opération. » ➔ **NON** (Explication : Zéro lien web dans les SMS officiels).
   * *Oui/Non 2* : « Le code secret USSD (*145# ou *155#) ne doit jamais être communiqué, même à un prétendu agent opérateur. » ➔ **OUI** (Explication : Le PIN est un secret cryptographique strictly personnel).
   * *QCM 1* : « Que faire face à un appel affirmant un dépôt d'argent 'par erreur' et exigeant un renvoi immédiat ? » ➔ Options : [A. Vérifier soi-même son solde via *145# ou *155#, B. Renvoyer l'argent tout de suite, C. Cliquer sur le lien du SMS, D. Envoyer son mot de passe] ➔ Bonne réponse : A.
2. **Droit Commercial & Cybercriminalité** (OHADA et Loi n° 2018-026 au Togo).
3. **Algorithmique & Python** (Complexité Big-O et mutabilité des structures).

#### 1.2.4 Évolution du Prompt Gemma 4 (`src/server/gemma.ts`)
Mise à jour de `generateFlashcardsWithGemma` pour retourner les deux modes dans le payload JSON :
```json
{
  "flashcards": [
    {
      "id": "fc-1",
      "front": "Notion ou question",
      "back": "Définition synthétique",
      "binaryStatement": "Affirmation concrète à valider",
      "binaryAnswer": true,
      "binaryExplanation": "Pourquoi c'est vrai ou faux...",
      "mcqQuestion": "Question précise à choix multiple",
      "mcqOptions": ["Bonne réponse", "Mauvaise réponse A", "Mauvaise réponse B"],
      "mcqAnswerIndex": 0,
      "mcqExplanation": "Explication pédagogique complète..."
    }
  ]
}
```

---

### 1.3 Expérience Utilisateur & Gestion d'État en Session

#### Bascule Dynamique des Modes (Toggle Switcher)
Au-dessus du plateau de flashcards, un sélecteur à deux boutons néo-brutalistes avec icônes distinctives :
```tsx
<div className="flex p-1 rounded-2xl border-2 border-foreground/20 bg-muted/60 shadow-neo-sm max-w-sm mx-auto">
  <button
    onClick={() => setMode("binary")}
    className={cn(
      "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
      mode === "binary" ? "bg-card text-foreground shadow-neo-sm border-2 border-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    <CheckCircle2 className="size-4 text-emerald-500" /> Mode « Oui / Non »
  </button>
  <button
    onClick={() => setMode("mcq")}
    className={cn(
      "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
      mode === "mcq" ? "bg-card text-foreground shadow-neo-sm border-2 border-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    <HelpCircle className="size-4 text-electric" /> Mode « Bonne Réponse »
  </button>
</div>
```
* **Principe clé** : L'utilisateur peut basculer de mode à n'importe quel moment de la session sans perdre sa progression, la carte courante ou l'historique du cours.

#### Interaction & Feedback Immédiat en Mode « Oui / Non »
1. **Affichage** : La carte présente l'affirmation en typographie large et lisible avec un badge de thématique.
2. **Actions** : Deux boutons d'action proéminents :
   * `[ ✓ OUI / VRAI ]` (vert émeraude)
   * `[ ✗ NON / FAUX ]` (rouge corail / ambre)
3. **Validation instantanée** :
   * Dès le clic, les boutons sont verrouillés pour cette carte.
   * Si la réponse est correcte : Bordure vert néon, badge *"🎉 Excellente réponse !"*, affichage de l'explication immédiate. Le compteur de score de session s'incrémente (`+1`).
   * Si la réponse est fausse : Bordure rouge/orange, badge *"❌ Réponse incorrecte"*, affichage en surbrillance de la réponse attendue et de l'explication pédagogique pour corriger l'erreur sans délai.
4. **Action suivante** : Bouton *"Carte suivante →"* déverrouillé, avec possibilité de *"Revoir cette carte plus tard"*.

#### Interaction & Feedback Immédiat en Mode « Bonne Réponse » (QCM)
1. **Affichage** : La question est formulée au centre, suivie d'une liste de 3 ou 4 options cliquables avec repères lettrés (A, B, C, D).
2. **Validation instantanée** :
   * Au clic sur une option :
     * L'option sélectionnée est surlignée : verte si correcte, rouge si incorrecte.
     * La bonne réponse est révélée en vert avec une coche `CheckCircle2`.
     * Une boîte d'explication pédagogique détaillée (`bg-accent/40 border-2`) apparaît immédiatement en dessous, détaillant les motifs de la règle et les pièges d'examen.
3. **Mise à jour du score** : Le score de session est actualisé en temps réel (`X/Y réussies`).

---

### 1.4 Unification du Score et Suivi de Progression

#### Formule de Maîtrise Globale (Mastery Score)
Pour qu'une carte soit considérée comme `mastered: true` :
* Une réussite en Mode « Oui / Non » apporte 50 points d'ancrage mémoriel.
* Une réussite en Mode « Bonne Réponse » apporte 50 points d'ancrage mémoriel.
* Lorsque les deux modes sont validés ou que 2 réussites consécutives sont enregistrées, la carte est marquée comme **Maîtrisée**.
* L'utilisateur conserve la possibilité manuelle de forcer le statut *"Maîtrisé"* ou *"À réviser"*.

#### Tableau de Bord « Progression & Résultats »
Dans l'onglet `progress` de `apprendre.tsx` :
* **Cartes Flashcards Maîtrisées** : Décompte agrégé sur tous les cours.
* **Taux de Succès Mode « Oui / Non »** : Pourcentage de réponses justes sur les affirmations binaires.
* **Taux de Succès Mode « Bonne Réponse »** : Pourcentage de bonnes réponses aux QCM.
* **Score Global de Mémorisation** : Barre de progression néo-brutaliste consolidée.

---

# PARTIE 2 : Enquête Approfondie — Exigence R2 (Visite Guidée Interactive)

### 2.1 État des Lieux et Diagnostic du Code Existant

#### Fichiers et Éléments Pertinents
* **Modale Hackathon Héritée** : `src/components/cs/PitchModal.tsx` (197 lignes)
* **Shell & En-tête Principal** : `src/components/cs/AppShell.tsx` (306 lignes)
  * Déclencheur Desktop (lignes 240-246) : Bouton *"Pitch 3 min"* avec icône `Trophy`.
  * Déclencheur Mobile (lignes 172-179) : Bouton icône `Trophy`.
* **Racine de l'Application** : `src/routes/__root.tsx` (lignes 122-135)
* **Page d'Accueil (Dashboard)** : `src/routes/index.tsx` (369 lignes)
* **Composants d'interface disponibles** : Radix Dialog (`@radix-ui/react-dialog`), Radix Popover (`@radix-ui/react-popover`), Tailwind CSS v4, Lucide React.
* **Règle d'Intégrité Démo** :
  > *"The team must NOT: copy code from existing open-source projects for core logic, use pre-built libraries or frameworks for core functionality, read test source code to understand expected behaviour before implementing"*
  > ➔ **Interdiction stricte d'installer des bibliothèques externes lourdes de visite guidée (intro.js, driver.js, react-joyride, shepherd.js)**. La solution doit être un composant React natif, autonome, propre et ultra-léger.

---

### 2.2 Points d'Entrée et Éléments Clés de l'Interface à Présenter

La visite guidée doit valoriser les modules essentiels de la plateforme dans un ordre logique d'utilisation :

| Étape | Cible / Éléments Clés | Contenu Pédagogique du Tour | Action Disponible |
|---|---|---|---|
| **1. Bienvenue & Mission** | Logo CyberSafe & Hero Banner (`/`) | Présentation de CyberSafe Online comme solution personnelle de protection contre les arnaques financières mobiles (T-Money & Moov Money) au Togo et hub de révision IA. | Découvrir les outils → |
| **2. Barre de Navigation** | Sidebar Desktop / Menu Mobile (`AppShell.tsx`) | Explication de la navigation unifiée : accès immédiat aux scanners spécialisés, à l'espace étudiant, au bot et à l'historique chiffré localement. | Étape suivante → |
| **3. Scanner SMS & Captures** | Raccourci vers `/sms` (MVP Scanner) | Audit en 1 clic de SMS suspects ou de captures d'écran : conformité syntaxique officielle, vérification des numéros et détection des faux transferts. | Voir la démo SMS → |
| **4. Espace Révision & FlashCards** | Raccourci vers `/apprendre` (Espace Étudiant) | Entraînement mémoriel avec les deux nouveaux modes de FlashCards (« Oui / Non » et « Bonne Réponse »), génération de quiz par Gemma 4 et bibliothèque de cours. | Découvrir les FlashCards → |
| **5. Assistant CyberSafe** | Raccourci vers `/assistant` (Bot Gemma) | Conseils en temps réel, alertes audio multilingues (Français, Anglais, Éwé) et commandes rapides (`/apprendre`, `/quiz`, `/plan`). | Étape suivante → |
| **6. Personnalisation & Thèmes** | Contrôles Header (Thème clair/sombre & Sélecteur de langue) | Adaptation ergonomique optimale : thème sombre cyber néo-brutaliste, contraste renforcé et support complet des langues locales. | Terminer la visite ✓ |

---

### 2.3 Architecture Technique : Non-Bloquante et Résiliente

#### Exigences Fondamentales d'Ergonomie (Acceptance Criteria)
1. **Jamais bloquante** : La visite ne doit en aucun cas geler l'écran, capturer agressivement les clics ou empêcher la navigation fluide entre les pages.
2. **Accessibilité et Contrôle Utilisateur** :
   * Sauter à tout moment via un bouton discret *"Passer la visite"*.
   * Fermer instantanément via la touche `Échap`, la croix `(X)` ou le bouton *"Fermer"*.
   * Navigation pas à pas avec *"Précédent"* et *"Suivant"*.
3. **Persistance discrète** :
   * Clé `localStorage` : `"cybersafe_onboarding_completed"`.
   * Proposition d'accueil non intrusive lors de la toute première visite d'un utilisateur.
   * Déclencheur permanent et visible à la demande dans l'en-tête (remplaçant idéalement le bouton hackathon *"Pitch 3 min"*).

#### Conception du Composant `OnboardingTour.tsx`
Un composant React autonome combinant un widget flottant (Card néo-brutaliste ancrée en bas à droite sur desktop, ou en bas d'écran sur mobile) et un système d'accentuation visuelle douce (Spotlight Glow / Ring) sur l'élément ciblé :

```tsx
// Structure Conceptuelle de OnboardingTour
export interface TourStep {
  id: string;
  targetQuery?: string;     // Sélecteur optionnel pour highlight (ex: "[data-tour='sidebar']")
  title: string;
  description: string;
  badge?: string;
  route?: string;           // Navigation optionnelle pour amener l'utilisateur sur la bonne page
}

export function OnboardingTour({
  open,
  onClose,
  initialStep = 0,
}: {
  open: boolean;
  onClose: () => void;
  initialStep?: number;
}) {
  // Gestion de l'état, de la progression (1 à 6), et de l'accessibilité clavier (Escape, Flèches)
}
```

#### Avantages de l'Approche Flottante Non-Bloquante
* **Zéro Overlay Bloquant** : Contrairement aux bibliothèques classiques qui injectent une div `fixed inset-0` avec `pointer-events: auto` (empêchant l'utilisateur de cliquer sur un bouton de la page sans fermer le tour), la visite flottante laisse l'arrière-plan interactif.
* **Intégration Design Néo-Brutaliste** : Bordures marquées (`border-2 border-foreground`), ombres décalées (`shadow-neo-lg`), stickers d'étape et typographie Sora/Manrope.
* **Aucune Régression** : Si l'utilisateur clique sur une autre page du menu, la visite s'adapte ou se referme proprement sans laisser de restes dans le DOM.

---

# PARTIE 3 : Matrice de Synthèse et Plan de Mise en Œuvre

| Exigence | Composant Impacté | Fichiers Cibles | Type de Modification |
|---|---|---|---|
| **R3. Modes FlashCards** | Plateau d'apprentissage & Fiches | `src/routes/apprendre.tsx` | Ajout du sélecteur de mode, enrichissement de l'interface de carte (Oui/Non + QCM), feedback immédiat visuel et sonore/toast. |
| **R3. Normalisation & Fallback** | Algorithme de génération hors-ligne | `src/routes/apprendre.tsx` | Implémentation de `normalizeFlashcard` et mise à jour de `generateFlashcardsForContent`. |
| **R3. Datasets Démo** | Cours par défaut | `src/lib/demo.ts` | Ajout d'affirmations et de questions/réponses riches pour les 3 cours de démonstration. |
| **R3. Prompt Gemma 4** | Moteur IA Serveur | `src/server/gemma.ts` | Enrichissement du prompt JSON pour générer directement `binary*` et `mcq*`. |
| **R3. Progression & Score** | Tableau de bord étudiant | `src/routes/apprendre.tsx` | Intégration des taux de succès et maîtrise consolidée dans l'onglet `progress`. |
| **R2. Composant Visite Guidée** | Nouveau composant UI interactif | `src/components/cs/OnboardingTour.tsx` | Création du composant autonome, des étapes et du système de surbrillance non-bloquant. |
| **R2. Déclencheur En-tête & Menu** | Remplacement de PitchModal | `src/components/cs/AppShell.tsx` | Remplacement du bouton Pitch par le bouton « 🧭 Visite Guidée » (Desktop + Mobile) et gestion de l'état d'ouverture. |
| **R2. Invitation Premier Accès** | Bannière d'accueil Dashboard | `src/routes/index.tsx` | Ajout d'une invitation non intrusive sur le hero pour les nouveaux visiteurs. |

---

# PARTIE 4 : Recommandations pour l'Équipe d'Implémentation

1. **Rétrocompatibilité Totale des Données** :
   Conserver l'usage de la clé `COURSES_STORAGE_KEY` et veiller à ce que l'adaptateur `normalizeFlashcard` enveloppe tout accès aux cartes existantes pour éviter toute exception `undefined`.
2. **Qualité Pédagogique du Feedback Immédiat** :
   En mode « Oui / Non », l'explication doit toujours rappeler la bonne réponse et le motif de sécurité (ex : *"Zéro lien dans les SMS officiels"*). En mode « Bonne Réponse », l'option choisie doit être comparée à l'option correcte avec une justification claire.
3. **Élimination Définitive du Hackathon Pitch** :
   La suppression de `PitchModal.tsx` et des boutons associés (Exigence R1) coïncide exactement avec l'insertion du déclencheur de la visite guidée (Exigence R2). L'échange est immédiat et harmonieux.
4. **Validation des Tests Automatisés** :
   Vérifier systématiquement `./node_modules/.bin/vitest run` et le build de production `./node_modules/.bin/vite build` après chaque modification de composant.
