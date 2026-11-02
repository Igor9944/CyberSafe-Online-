# Original User Request

## Initial Request — 2026-11-01T12:39:42Z

Transition de l'application CyberSafe Online d'un démonstrateur de hackathon vers un produit SaaS personnel complet, pérenne et soigné.

Working directory: /home/ro0t_/Projects/les-bugs-busters
Integrity mode: demo
The team must NOT: copy code from existing open-source projects for core logic, use pre-built libraries or frameworks for core functionality, read test source code to understand expected behaviour before implementing

## Requirements

### R1. Retrait des éléments de pitch et nettoyage du code
Supprimer toutes les mentions, modales et composants spécifiques au hackathon (notamment PitchModal, mentions de pitch de 3 minutes, barème 20/20 de la page À propos). Nettoyer les commentaires superflus (notes de hackathon, code mort, marqueurs temporaires) à travers la base de code tout en préservant la documentation nécessaire.

### R2. Visite guidée interactive (Guided Onboarding Tour)
Fournir une visite guidée interactive pour accueillir les nouveaux utilisateurs et leur faire découvrir les fonctionnalités clés de la plateforme. La visite doit être accessible à la demande, pouvoir être passée ou fermée à tout moment, et ne jamais bloquer la navigation normale.

### R3. Modes avancés des FlashCards d'apprentissage
Faire évoluer le module d'apprentissage FlashCards en proposant deux modes d'entraînement distincts : un mode « Oui / Non » (Vrai ou Faux avec retour immédiat) et un mode « Bonne Réponse » (QCM avec choix d'options et explication pédagogique immédiate). L'utilisateur peut facilement basculer entre les deux modes lors de ses sessions.

### R4. Modernisation du logo et intégration visuelle
Créer une version modernisée et optimisée du logo CyberSafe Online et harmoniser son intégration dans toute l'interface (header, sidebar, favicon et éléments de marque). Le logo doit s'afficher avec une clarté optimale et s'adapter parfaitement aux thèmes clair et sombre.

### R5. Amélioration du thème sombre
Rehausser le design du thème sombre pour offrir une expérience cyber/néo-brutaliste soignée, avec des contrastes nets, une hiérarchie visuelle claire et des finitions élégantes sans éléments illisibles ou dégradés.

## Acceptance Criteria

### Nettoyage Hackathon & Code
- [ ] Aucune occurrence ni rendu de PitchModal, de pitch 3 minutes ou de barème 20/20 n'apparaît dans l'interface utilisateur ni dans les routes actives
- [ ] Les commentaires de hackathon, TODOs obsolètes et blocs de code commenté sont supprimés de la base de code
- [ ] La compilation et le build de production (`npm run build`) s'exécutent avec succès sans erreur

### Visite Guidée (Onboarding Tour)
- [ ] La visite guidée peut être lancée depuis l'interface par un nouvel utilisateur ou via un déclencheur dédié
- [ ] L'utilisateur peut passer (skip), progresser étape par étape et fermer la visite guidée à n'importe quel moment
- [ ] L'interface redevient pleinement interactive et réactive une fois la visite terminée ou interrompue

### Module FlashCards
- [ ] Le module d'apprentissage permet de sélectionner explicitement le mode « Oui / Non » et le mode « Bonne Réponse »
- [ ] En mode « Oui / Non », chaque carte propose une affirmation binaire avec feedback immédiat de succès ou d'erreur
- [ ] En mode « Bonne Réponse », chaque carte présente plusieurs choix et affiche une explication détaillée dès la validation de la réponse
- [ ] Le score ou la progression de l'utilisateur est mis à jour de manière cohérente dans les deux modes

### Logo & Intégration
- [ ] Le nouveau logo vectoriel est intégré dans le header et la barre latérale (sidebar) de l'application
- [ ] Le logo maintient des proportions adaptées et une lisibilité sans distorsion en version compacte et étendue
- [ ] Le logo s'affiche avec un contraste suffisant en thème clair et en thème sombre

### Thème Sombre & Ergonomie
- [ ] Tous les textes, boutons, cartes et arrière-plans du thème sombre respectent un contraste de lisibilité élevé sans texte sombre sur fond sombre
- [ ] Les accents et touches visuelles cyber/néo-brutalistes restent cohérents sur l'ensemble des pages de l'application
- [ ] Aucun composant ne présente de régression visuelle ou fonctionnelle lors du basculement clair/sombre


## Follow-up — 2026-11-01T17:11:17Z

Création d'un logo vectoriel SVG moderne et embelli pour CyberSafe Online à partir de l'illustration fournie (trois mains unies en triangle), mise en place d'une Progressive Web App (PWA) installable via le navigateur, intégration d'animations fluides, et adaptation responsive mobile complète.

Integrity mode: development

Reference material:
- Image de référence utilisateur : `/home/ro0t_/.gemini/antigravity/brain/6b37c714-d31e-44dc-8a64-596acf2bcf6f/.user_uploaded/media_1793550518973_a74a7119.jpg` (Trois mains unies en triangle / prise solidaire de poignets)

## Requirements

### R1. Logo vectoriel moderne et embelli pour CyberSafe Online
Transformer l'illustration de référence (trois mains unies en triangle, symbole de solidarité et de sécurité anti-arnaque) en un logo vectoriel SVG moderne et embelli pour CyberSafe Online.
- Fournir le composant React `src/components/cs/Logo.tsx` avec dimensions responsives et support des variantes de style (thèmes light, dark, electric) avec des accents néo-brutalistes.
- Générer et intégrer les favicons et icônes d'application associés (SVG et ICO).

### R2. Configuration Progressive Web App (PWA) installable
Rendre l'application installable depuis le navigateur (expérience PWA similaire à YouTube) :
- Configurer un manifeste web complet (`manifest.webmanifest` ou `manifest.json`) avec métadonnées requises, icônes adaptées (incluant 192x192, 512x512 et support maskable), `theme_color`, `background_color`, `display: standalone` et raccourcis.
- Mettre en place un Service Worker assurant l'enregistrement et la mise en cache des ressources pour le fonctionnement PWA.
- Développer un élément d'interface interactif (bouton ou bannière ergonomique dans la navbar ou le header) captant l'événement natif `beforeinstallprompt` pour permettre à l'utilisateur d'installer l'application en un clic.

### R3. Animations et micro-interactions fluides et dynamiques
Enrichir l'expérience utilisateur du site avec des animations et micro-interactions soignées, dynamiques et conformes à l'esthétique néo-brutaliste :
- Ajouter des micro-interactions au survol et au clic sur les éléments interactifs (boutons, cartes, stickers, badges).
- Intégrer des animations fluides d'apparition des sections/éléments et des transitions d'état de chargement.
- Veiller à préserver la fluidité et les performances globales (sans saccades, respect de `prefers-reduced-motion`).

### R4. Optimisation et adaptation mobile complète (smartphones et tablettes)
Assurer une expérience utilisateur mobile de premier ordre :
- Adapter la disposition responsive sur smartphone et tablette (typographie lisible, espacements cohérents, cibles tactiles conformes d'au moins 44x44px, navigation et header fluides).
- Optimiser l'expérience PWA sur mobile (support des safe-areas / encoches iOS et Android, mode standalone plein écran sans barre d'URL parasite, invite ou bouton d'installation adapté au contexte mobile).
- Garantir le rendu impeccable du logo sur tous les formats d'écran (tailles sm/md/lg) sans rognage ni distorsion.

### R5. Vérification de la qualité et non-régression
Valider l'ensemble des intégrations sans aucune régression sur le projet.

## Acceptance Criteria

### Logo & Identité Visuelle
- [ ] Le composant `src/components/cs/Logo.tsx` restitue fidèlement le symbole des trois mains solidaires en triangle avec un rendu SVG vectoriel propre et des accents néo-brutalistes.
- [ ] Les variantes de thème (light, dark, electric) et les dimensions responsives (sm, md, lg) sont supportées et fonctionnelles sans débordement ni distorsion.
- [ ] Les favicons et icônes dérivés du logo sont présents dans le projet et correctement référencés.

### PWA & Installation Navigateur
- [ ] Le fichier de manifeste web est valide, accessible, lié dans `index.html` et contient `display: standalone`, `theme_color`, `background_color` et les icônes requises (au minimum 192x192 et 512x512 avec variante maskable).
- [ ] Le Service Worker est enregistré sans erreur au chargement de l'application.
- [ ] L'élément d'interface d'installation dans la navbar ou le header écoute l'événement `beforeinstallprompt`, s'affiche lorsque l'installation est disponible et déclenche l'invite native d'installation au clic.
- [ ] L'application répond aux critères d'installabilité PWA des navigateurs standards (desktop et mobile).

### Animations & Micro-interactions
- [ ] Les composants interactifs (boutons, cartes, stickers) bénéficient de micro-interactions fluides et réactives au survol/focus/clic.
- [ ] Les animations d'apparition ou de transition s'exécutent de manière fluide sans dégradation de performance ou saccades visuelles.
- [ ] Les animations respectent la préférence utilisateur de réduction de mouvement (`prefers-reduced-motion`).

### Ergonomie & Adaptation Mobile
- [ ] L'ensemble des pages et vues s'adapte aux largeurs mobiles et tablettes sans scroll horizontal involontaire.
- [ ] Les éléments cliquables et cibles tactiles respectent les recommandations d'accessibilité mobile (minimum 44x44px).
- [ ] La prise en compte des safe-areas (`safe-area-inset`) est assurée pour les affichages avec encoche et navigation système.

### Validation Technique
- [ ] `tsc --noEmit` s'exécute sans aucune erreur TypeScript.
- [ ] La suite de tests Vitest (incluant l'ensemble des tests existants) passe avec succès (`npm test` ou `npx vitest run`).
- [ ] Le build de production Vite (`npm run build` ou `npx vite build`) réussit sans erreur.
