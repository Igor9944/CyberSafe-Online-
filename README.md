# 🛡️ CyberSafe Online 

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-en%20développement-or.svg)

**CyberSafe Online** est une plateforme SaaS citoyenne conçue pour sensibiliser et protéger les utilisateurs contre les fraudes et arnaques numériques en Afrique de l'Ouest, notamment au Togo (fraudes Mobile Money : **T-Money** et **Moov Money**).


---

## 📋 Table des Matières

1. [À Quoi Sert ce Projet ?](#-à-quoi-sert-ce-projet)
2. [Fonctionnalités Principales](#-fonctionnalités-principales)
3. [Architecture Technique](#-architecture technique)
4. [Installation Étape par Étape](#-installation-étape-par-étape)
5. [Configuration des Variables d'Environnement](#-configuration-des-variables-denvironnement)
6. [Lancement de l'Application](#-lancement-de-lapplication)
7. [Tests](#-tests)
8. [Structure du Projet](#-structure-du-projet)
9. [Contribution](#-contribution)
10. [Déploiement](#-déploiement)
11. [Équipe](#-équipe)
12. [Contact & Support](#-contact--support)

---

## 🎯 À Quoi Sert ce Projet ?

**CyberSafe Online** est une application web de **sécurité numérique** et **anti-fraude** conçue pour :

- 🔍 **Détecter** les messages SMS suspects (faux SMS de transactions Mobile Money, phishing, ingénierie sociale).
- 📱 **Analyser** les URL et QR Codes désignés (intégration VirusTotal pour vérifier la sécurité).
- 📞 **Reconnaître** les fraudes par appel / audio (analyse de transcriptions ou fichiers audio).
- 🤖 **Assister** l'utilisateur avec un IA anti-arnaque (Google Gemini / Gemma).
- 🌐 **Fournir** un historique et des statistiques locales des analyses effectuées.
- 📴 **Fonctionner** en mode hors-ligne (PWA-ready).

🎯 **Cible** : les citoyens, plus largement en Afrique de l'Ouest, pour une protection anti-fraude continue et accessible.

---

## ✨ Fonctionnalités Principales

| Fonctionnalité | Description |
|---|---|
| 🔍 **Scanner de SMS** | Détection des faux messages de transactions Mobile Money, phishing, ingénierie sociale. |
| 📱 **Scanner de QR / Liens** | Analyse de sécurité des URL et QR codes avec intégration VirusTotal. |
| 📞 **Détection d'appel / audio** | Analyse des transcriptions ou fichiers audio suspects. |
| 🤖 **Assistant IA** | Assistant interactif basé sur Google Gemma / Gemini pour répondre en langage naturel. |
| 🌐 **Multilingue** | Support du Français, Anglais et Ewé (langue locale). |
| 📴 **Mode hors-ligne & PWA** | Utilisation possible même avec une connectivité réduite. |
| 📊 **Historique & Statistiques** | Suivi des analyses et alertes de sécurité en local. |

---

## 🏗️ Architecture Technique

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

- **TanStack Start** — Framework full-stack pour React (SSR + routing).
- **TanStack Router** — Router typé (type-safe) pour React.
- **React 19** — Bibliothèque UI déclarative.
- **Tailwind CSS v4** — Styling utility-first.
- **Radix UI** — Composants accessibles (ARIA) réutilisables.
- **Lucide Icons** — IcônesSVG minimalistes.
- **Google Gemini / Gemma** — Modèle de langage pour l'assistant IA.
- **VirusTotal API** — Analyse de sécurité de fichiers et URLs.
- **Tesseract OCR** — Reconnaissance optique de caractères.
- **Vitest + Testing Library** — Framework de test.

---

## 📦 Installation Étape par Étape

### 1. Prérequis

| Outil | Version recommandée | Site |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Bun** | dernière stable | [bun.sh](https://bun.sh/) |
| **Git** | toute version récente | [git-scm.com](https://git-scm.com/) |

> 💡 **Astuce** : Tu peux utiliser **Bun** (plus rapide) ou **npm** — les deux fonctionnent.

### 2. Cloner le dépôt

```bash
git clone https://github.com/Igor9944/CyberSafe-Online
cd CyberSafe-Online
```

### 3. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvre le fichier `.env` et renseigne tes clés :

```env
GEMINI_API_KEY=votre_cle_gemini
VIRUSTOTAL_API_KEY=votre_cle_virustotal
```

> 🔑 **Où obtenir une clé ?**
> - **Google Gemini** : [aistudio.google.com](https://aistudio.google.com/)
> - **VirusTotal** : [app.virustotal.com](https://app.virustotal.com/)

### 5. Lancer le serveur de développement

```bash
npm run dev
# ou
bun run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## 🧪 Tests

```bash
npm run test
```

> Lance les tests unitaires (Vitest + Testing Library).

---

## 📁 Structure du Projet

```
CyberSafe Online/
├── public/                  # Ressources statiques (images, favicon, etc.)
├── src/                     # Code source principal
│   ├── components/          # Composants React réutilisables
│   ├── routes/              # Définitions de routes (TanStack Router)
│   ├── lib/                 # Logique métier, helpers, appels API
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

## 🤝 Contribution

Si tu veux contribuer au projet :

1. **Forke** le dépôt : `https://github.com/Igor9944/CyberSafe-Online`
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

## 🚀 Déploiement

### Pour la production

```bash
npm run build
npm run start
```

### Plateformes supportées

| Plateforme | Configuration |
|---|---|
| **Vercel** | Importe le projet, configure le build `npm run build` |
| **Netlify** | Même configuration de build |
| **Docker** | `docker build` puis `docker run` |
| **Cloud Run** | Container-ready, idéal pour une API backend |

---



## 📬 Contact & Support

- **GitHub** : [Igor9944/CyberSafe-Online](https://github.com/Igor9944/CyberSafe-Online)
- **Email** : *(à compléter)*
- **Site web** : *(à compléter)*

---

## 📄 Licence

Ce projet est sous licence MIT — voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

> 📜 *Dernière mise à jour : novembre 2026*
