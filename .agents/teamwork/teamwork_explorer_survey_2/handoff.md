# Handoff Report — Phase 0 Survey (Requirements R3 & R2)

**From**: Teamwork Explorer (Instance 2 — Survey)  
**To**: Teamwork Orchestrator (`f1196ecd-9783-4010-bdd9-848bef435514`)  
**Date**: 2026-11-01  
**Scope**: 
- Requirement R3: Modes avancés des FlashCards d'apprentissage (Mode « Oui / Non » et Mode « Bonne Réponse »)
- Requirement R2: Visite guidée interactive (Guided Onboarding Tour)

---

## 1. Observation

### 1.1 Exigence R3 — FlashCards d'Apprentissage
- **Modèle de données actuel** (`src/routes/apprendre.tsx`, lignes 54-59) :
  ```typescript
  export interface Flashcard {
    id: string;
    front: string;
    back: string;
    mastered: boolean;
  }
  ```
  Et dans `src/server/gemma.ts` (lignes 127-132) :
  ```typescript
  export interface GemmaFlashcardItem {
    id: string;
    front: string;
    back: string;
    mastered: boolean;
  }
  ```
- **Stockage et cycle de vie** (`src/routes/apprendre.tsx`, lignes 83, 131-152) :
  Stocké dans `localStorage` sous la clé `COURSES_STORAGE_KEY = "cybersafe_student_courses_v1"`. Chaque cours contient `flashcards: Flashcard[]`. Si vide, initialisé avec `DEMO_COURSES` (`src/lib/demo.ts`, lignes 35-86) via la fonction de secours `generateFlashcardsForContent` (lignes 185-218).
- **Rendu actuel dans l'UI** (`src/routes/apprendre.tsx`, lignes 1177-1285) :
  Rendu sous forme d'une simple carte 3D à retournement au clic (`isFlipped: boolean`). Trois boutons de contrôle : *Précédent* (ligne 1246), *Marquer comme su* (ligne 1259) et *Suivant* (ligne 1269).
  *Aucun mode de validation binaire (Oui/Non).*
  *Aucun mode de question à choix multiples (Bonne Réponse).*
  *Aucun sélecteur de mode.*
  *Aucun système de score en cours de session.*
- **Suivi de progression actuel** (`src/routes/apprendre.tsx`, lignes 1304-1308) :
  Décompte statique : `courses.reduce((acc, c) => acc + c.flashcards.filter((f) => f.mastered).length, 0)`.

### 1.2 Exigence R2 — Visite Guidée Interactive & En-tête / Navigation
- **Modale héritée du hackathon** (`src/components/cs/PitchModal.tsx`, lignes 1-197) :
  Composant `PitchModal` déclenché dans `AppShell.tsx` par :
  * Le bouton de la barre supérieure desktop (`src/components/cs/AppShell.tsx`, lignes 239-246) avec icône `Trophy` et label *"Pitch 3 min"*.
  * Le bouton de l'en-tête mobile (`src/components/cs/AppShell.tsx`, lignes 172-179) avec icône `Trophy`.
- **Navigation et Points d'Accès** (`src/components/cs/AppShell.tsx`, lignes 35-46) :
  `NAV_ITEMS` définit les routes principales : `/` (Dashboard), `/sms`, `/qr`, `/audio`, `/assistant`, `/apprendre`, `/historique`, `/guide`, `/a-propos`, `/parametres`.
  L'application est enveloppée dans `AppShell` (`src/routes/__root.tsx`, ligne 128).
- **Bibliothèques d'interface installées** (`package.json`) :
  Radix Dialog (`@radix-ui/react-dialog`), Radix Popover (`@radix-ui/react-popover`), Lucide React (`lucide-react`), Sonner (`sonner`), Tailwind CSS v4 (`@tailwindcss/vite`).
  *Aucune bibliothèque tierce de visite guidée (pas de driver.js, intro.js, joyride).*
- **Règle d'intégrité démo** (`ORIGINAL_REQUEST.md`, ligne 9) :
  *"The team must NOT: copy code from existing open-source projects for core logic, use pre-built libraries or frameworks for core functionality..."*

### 1.3 Environnement & Commandes Exécutées
- Outils exécutables découverts :
  * `./node_modules/.bin/vitest run` ➔ Exécution réussie de 7 suites de tests (45 tests passés avec succès).
  * `./node_modules/.bin/vite build` ➔ Build de production réussi sans erreur en ~2.5s.

---

## 2. Logic Chain

1. **R3 — Évolution des FlashCards** :
   - *Observation* : `Flashcard` ne stocke actuellement que `front` et `back` pour une consultation passive.
   - *Raisonnement* : Pour implémenter le Mode « Oui / Non » et le Mode « Bonne Réponse » sans casser les cours préexistants, nous devons étendre `Flashcard` avec des champs optionnels (`binaryStatement`, `binaryAnswer`, `binaryExplanation`, `mcqQuestion`, `mcqOptions`, `mcqAnswerIndex`, `mcqExplanation`).
   - *Raisonnement* : Un adaptateur runtime `normalizeFlashcard()` garantit que même si un cours provient d'un ancien cache `localStorage` ou d'un document importé, des affirmations binaires et des options QCM cohérentes sont immédiatement générées à la volée.
   - *Raisonnement* : L'interface utilisateur de `apprendre.tsx` doit accueillir un sélecteur à deux modes au-dessus de la carte. Lorsqu'une réponse est cliquée (Oui/Non ou choix QCM), le composant applique un retour visuel instantané (vert succès / rouge erreur) et affiche immédiatement l'explication pédagogique.
   - *Raisonnement* : Le score de session s'incrémente en temps réel et la maîtrise (`mastered`) s'unifie automatiquement en fonction des réussites aux deux modes.

2. **R2 — Visite Guidée Interactive** :
   - *Observation* : L'exigence R1 demande de retirer le composant `PitchModal` et les mentions de pitch 3 minutes. Ces boutons occupent actuellement un emplacement privilégié dans l'en-tête desktop et mobile de `AppShell.tsx`.
   - *Raisonnement* : Remplacer directement ce bouton par un déclencheur dédié « 🧭 Visite Guidée » résout à la fois l'accessibilité à la demande de R2 et le nettoyage de R1 sans perturber la disposition visuelle.
   - *Raisonnement* : Selon la contrainte d'intégrité démo, aucune dépendance externe lourde ne doit être introduite. Un composant React natif flottant (`OnboardingTour.tsx`) positionné en bas à droite (desktop) ou en bas d'écran (mobile) permet de naviguer pas à pas (Étape 1 à 6) sans jamais capturer les clics sur le reste de la page ni bloquer la navigation normale.
   - *Raisonnement* : L'utilisateur peut sauter (`Passer`), fermer (`Échap`, `X`) ou terminer la visite à tout instant. L'état d'achèvement est mémorisé dans `localStorage("cybersafe_onboarding_completed")`.

---

## 3. Caveats

- **Absence de réseau externe en sandbox** : Les appels vers l'API externe Gemma (`generativelanguage.googleapis.com`) échouent silencieusement dans l'environnement de test automatisé sans accès Internet. Les tests unitaires gèrent déjà ce cas via un fallback pédagogique déterministe.
- **Données en `localStorage` existantes** : Les utilisateurs existants peuvent avoir des structures `Flashcard` sans les nouveaux champs. L'utilisation systématique de l'adaptateur de normalisation est indispensable pour prévenir toute erreur de type `undefined`.
- **Z-Index et Conflits de Couches** : Le composant de visite guidée flottante doit avoir un z-index adéquat (`z-40` ou `z-50`) sans masquer les menus déroulants ou le sélecteur de langue.

---

## 4. Conclusion

1. **R3 (Modes FlashCards)** est prêt pour implémentation directe dans `src/routes/apprendre.tsx`, `src/lib/demo.ts` et `src/server/gemma.ts` :
   - Modèle enrichi rétrocompatible.
   - Mode « Oui / Non » avec affirmation binaire, sélection Vrai/Faux et feedback immédiat.
   - Mode « Bonne Réponse » avec choix multiples et explication pédagogique instantanée.
   - Bascule instantanée entre modes lors des sessions d'entraînement.
   - Suivi unifié du score de session et des taux de maîtrise dans l'onglet progression.
2. **R2 (Visite Guidée)** est prêt pour implémentation via la création de `src/components/cs/OnboardingTour.tsx` et son intégration dans `src/components/cs/AppShell.tsx` :
   - Remplacement du bouton Pitch de hackathon par le déclencheur de visite guidée.
   - Parcours en 6 étapes présentant Dashboard, Scanners, Espace Étudiant, Assistant et Thèmes.
   - Composant non-bloquant, accessible, skippable et fermable à tout moment.

---

## 5. Verification Method

Pour vérifier indépendamment cette analyse et valider l'implémentation ultérieure :

1. **Tests unitaires et de routage** :
   ```bash
   ./node_modules/.bin/vitest run
   ```
   Doit afficher 7 test suites passées avec 45 tests réussis.
2. **Compilation et Build de Production** :
   ```bash
   ./node_modules/.bin/vite build
   ```
   Doit générer le bundle SSR et client sans erreur TypeScript ni alerte critique.
3. **Vérification Fonctionnelle R3** :
   - Ouvrir la route `/apprendre` ➔ Sélectionner un cours ➔ Onglet "Flashcards Mémo".
   - Vérifier la présence du sélecteur à deux modes (« Oui / Non » et « Bonne Réponse »).
   - Cliquer sur « Oui » ou « Non » : vérifier l'affichage immédiat du verdict (vert/rouge) et de l'explication.
   - Basculer en mode « Bonne Réponse » : vérifier l'affichage des 3-4 options et l'explication détaillée au clic.
   - Consulter l'onglet « Progression & Résultats » : vérifier que les scores et pourcentages sont mis à jour de façon cohérente.
4. **Vérification Fonctionnelle R2** :
   - Vérifier que le bouton *"Pitch 3 min"* est absent de l'en-tête et remplacé par le bouton de visite guidée.
   - Cliquer sur le déclencheur : la visite guidée s'affiche sans bloquer la page.
   - Cliquer sur *"Suivant"*, *"Précédent"*, *"Passer"*, ou appuyer sur la touche `Échap` : la visite réagit immédiatement et se ferme proprement sans geler la navigation.

**Conditions d'invalidation** :
- Régression de la persistance des cours dans `localStorage`.
- Échec du build de production (`./node_modules/.bin/vite build`).
- Blocage des clics sur la barre de navigation pendant la visite guidée.
