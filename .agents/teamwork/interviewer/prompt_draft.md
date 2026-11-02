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
