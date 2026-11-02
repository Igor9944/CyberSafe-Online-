# 🛠️ CyberSafe Online — Tuteuriel Détaillé

> **CyberSafe Online** est une plateforme SaaS citoyenne qui sensibilise et protège les utilisateurs contre les fraudes et arnaques numériques en Afrique de l'Ouest (notamment au Togo : fraudes Mobile Money — **T-Money** et **Moov Money**).
> Développé par l'équipe **Les Bugs Busters** (Lomé Business School).

---

## 📋 Table des Matières

1. [À Quoi Sert ce Projet ?](#1-à-quoi-sert-ce-projet)
2. [Fonctionnalités Principales](#2-fonctionnalités-principales)
3. [Prérequis (Outils Nécessaires)](#3-prérequis-outils-nécessaires)
4. [Installation Étape par Étape](#4-installation-étape-par-étape)
5. [Configuration des Variables d'Environnement](#5-configuration-des-variables-denvironnement)
6. [Lancement de l'Application](#6-lancement-de-lapplication)
7. [Exécution des Tests](#7-exécution-des-tests)
8. [Architecture Technique](#8-architecture-technique)
9. [Structure du Projet](#9-structure-du-projet)
10. [Contribution](#10-contribution)
11. [Dépolyement](#11-dépolyement)
12. [Dépannage](#12-dépannage)

---

## 1. À Quoi Sert ce Projet ?

CyberSafe Online est une application web **anti-fraude** conçue pour :

- ✅ **Détecter** les messages SMS suspects (faux SMS de transactions Mobile Money, phishing, ingénierie sociale).
- ✅ **Analyser** les URL et QR Codes désignés (intégration VirusTotal pour vérifier la sécurité).
- ✅ **Reconnaître** les fraudes par appel / audio (analyse de transcriptions ou fichiers audio).
- ✅ **Assister** l'utilisateur avec un IA anti-arnaque (Google Gemini / Gemma).
- ✅ **Fournir** un historique et des statistiques locales des analyses effectuées.

🎯 **Cible** : les citoyens, notamment au Togo et plus largement en Afrique de l'Ouest.

---

## 2. Fonctionnalités Principales

| Fonctionnalité | Description |
|---|---|
| 🔍 **Scanner SMS** | Détection des faux messages de transactions Mobile Money, phishing, ingénierie sociale. |
| 📱 **Scanner QR / Liens** | Analyse de sécurité des URL et QR codes avec intégration VirusTotal. |
| 📞 **Détection d'appel / audio** | Analyse des transcriptions ou fichiers audio suspects. |
| 🤖 **Assistant IA** | Assistant interactif sur Google Gemma / Gemini pour répondre en langage naturel. |
| 🌐 **Multilingue** | Support du Français, Anglais et Ewé (langue locale). |
| 📴 **Mode hors-ligne** | Utilisation possible avec une connectivité réduite. |
| 📊 **Historique & Statistiques** | Suivi des analyses et alertes de sécurité en local. |

---

## 3. Prérequis (Outils Nécessaires)

Avant de commencer, assure-toi d'avoir installé :

| Outil | Version recommandée | Site |
|---|---|---|
| **Node.js** | v18 ou + | [nodejs.org](https://nodejs.org/) |
| **Bun** | dernière version | [bun.sh](https://bun.sh/) |
| **Git** | toute version récente | [git-scm.com](https://git-scm.com/) |

> 💡 **Astuce** : Tu peux utiliser **Bun** (plus rapide et plus simple) ou **npm** — les deux fonctionnent.

### Vérifier les installations

```bash
node -v   # doit afficher v18+
npm -v    # ou bun -v
git --version
```

---

## 4. Installation Étape par Étape

### Étape 1 — Cloner le dépôt

```bash
git clone https://github.com/HACKTOBERFEST-By-LBS/les-bugs-busters.git
cd les-bugs-busters
```

### Étape 2 — Installer les dépendances

```bash
# Avec npm
npm install

# OU avec Bun (plus rapide)
bun install
```

> C'est ici que se passe le téléchargement de toutes les bibliothèques utilisées dans le projet.

---

## 5. Configuration des Variables d'Environnement

### 5.1 Créer le fichier `.env`

```bash
cp .env.example .env
```

### 5.2 Renseigner les clés d'API

Ouvre le fichier `.env` créé et ajoute tes clés :

```env
GEMINI_API_KEY=votre_cle_gemini
VIRUSTOTAL_API_KEY=votre_cle_virustotal
```

> 🔑 **Où obtenir une clé ?**
> - **Google Gemini / Gemma** : [aistudio.google.com](https://aistudio.google.com/)
> - **VirusTotal** : [app.virustotal.com](https://app.virustotal.com/)

> ⚠️ **Securité** : Jamais de clé d'API dans le code. Le fichier `.env` est ignoré par Git (voir `.gitignore`).

### 5.3 Vérifier que tout est bien configuré

```bash
ls -la .env  # doit exister
cat .env     # vérifier le contenu
```

---

## 6. Lancement de l'Application

### En mode développement

```bash
# Avec npm
npm run dev

# OU avec Bun
bun run dev
```

L'application sera accessible sur : **http://localhost:3000**

### Arrêter l'application

Appuie sur `Ctrl + C` dans le terminal où le serveur tourne.

---

## 7. Exécution des Tests

```bash
npm run test
```

> Cette commande lance les tests unitaires (Vitest + Testing Library) pour vérifier que le code fonctionne correctement.

---

## 8. Architecture Technique

### Stack utilisée

```
┌─────────────────────────────────────────┐
│  Frontend (React 19 + TypeScript)        │
│  • TanStack Start + TanStack Router     │
│  • Tailwind CSS v4                      │
│  • Radix UI (composants accessible)     │
│  • Lucide Icons                         │
└─────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────┐
│  Backend / API                          │
│  • Google Gemini / Gemma (IA)           │
│  • VirusTotal API (analyse URLs)        │
│  • Tesseract OCR (OCR audio)            │
└─────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────┐
│  Tests                                  │
│  • Vitest                               │
│  • Testing Library                      │
└─────────────────────────────────────────┘
```

### Composants clés

- **TanStack Start** : framework full-stack pour React.
- **TanStack Router** : routing type type-safe.
- **Tailwind CSS v4** : styling utility-first.
- **Radix UI** : composants accessibles (ARIA).
- **Google Gemini** : génération de texte / IA.
- **VirusTotal** : analyse de sécurité de fichiers et URLs.
- **Tesseract OCR** : reconnaissance optique de caractères.

---

## 9. Structure du Projet

```
CyberSafe Online/
├── public/                  # Ressources statiques (images, favicon, etc.)
├── src/                     # Code source principal
│   ├── components/          # Composants React réutilisables
│   ├── routes/              # Définitions de routes (TanStack Router)
│   ├── lib/                 # Logique métier, helpers, API
│   ├── types/               # Définitions TypeScript
│   └── app.tsx              # Point d'entrée de l'application
├── tests/                   # Fichiers de test
├── .env.example             # Modèle de fichier de configuration
├── .gitignore               # Fichiers ignorés par Git
├── package.json             # Dépendances et scripts
├── tsconfig.json            # Configuration TypeScript
├── vite.config.ts           # Configuration Vite
└── vitest.config.ts         # Configuration Vitest
```

---

## 10. Contribution

Si tu veux contribuer au projet :

1. **Forke** le dépôt GitHub : `HACKTOBERFEST-By-LBS/les-bugs-busters`
2. **Crée une branche** pour ton travail :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
3. **Fais tes modifications** et teste-les :
   ```bash
   npm run test
   ```
4. **Commit tes changements** :
   ```bash
   git add .
   git commit -m "feat: ajoute une nouvelle fonctionnalité"
   ```
5. **Push vers ta branche** :
   ```bash
   git push origin feature/ma-fonctionnalité
   ```
6. **Ouvre une Pull Request** sur GitHub.

> 💬 **Guidelines** : Respecte le code existant, ajoute des tests pour tes nouvelles fonctionnalités, et documente ce que tu fais.

---

## 11. Déploiement

### Pour la production

1. **Build** :
   ```bash
   npm run build
   ```
   (ou `bun run build`)

2. **Lancer la build** :
   ```bash
   npm run start
   ```
   (ou `bun run start`)

3. L'application sera disponible en production.

### Alternatives de déploiement

| Plateforme | Commande / Notes |
|---|---|
| **Vercel** | Importe le projet, configure le build `npm run build` |
| **Netlify** | Même configuration de build |
| **Docker** | Si un `Dockerfile` est fourni, `docker build` puis `docker run` |
| **Cloud Run** | Container-ready, idéal pour une API backend |

---

## 12. Dépannage

| Problème | Solution |
|---|---|
| `npm install` échoue | Vérifie que Node.js v18+ est installé ; essaye `rm -rf node_modules && npm install` |
| `GEMINI_API_KEY` mal renseignée | Vérifie le fichier `.env` ; redémarre le serveur après modification |
| Erreur de port 3000 occupé | Change le port ou termina l'ancien processus : `lsof -i :3000` |
| Tests échouent | Assure-toi que toutes les dépendances sont installées (`npm install`) |
| Build échoue | Vérifie les erreurs TypeScript dans ton éditeur ; exécute `npm run lint` |

---

## ✅ Résumé Rapide

```bash
# 1. Cloner
git clone https://github.com/HACKTOBERFEST-By-LBS/les-bugs-busters.git
cd les-bugs-busters

# 2. Installer
npm install   # ou bun install

# 3. Configurer
cp .env.example .env

# 4. Lancer
npm run dev   # ou bun run dev → http://localhost:3000

# 5. Tester
npm run test
```

---

## 📬 Contact / Équipe

**Les Bugs Busters** — Lome Business School (LBS)  
*Plateforme conçue et développée avec fierté pour un impact citoyen durable.*

---

> 📜 *Dernière mise à jour : novembre 2026*
