# CyberSafe Online — Les Bugs Busters 🛡️

**CyberSafe Online** est une application web conçue pour sensibiliser et protéger les utilisateurs contre les fraudes et arnaques numériques en Afrique de l'Ouest, notamment au Togo (fraudes Mobile Money : T-Money et Moov Money).

Développé par l'équipe **Les Bugs Busters** dans le cadre du **HACKTOBERFEST By LBS** (Lome Business School).

---

## 🚀 Fonctionnalités principales

- **Scanner de SMS & Messages Suspects** : Détection des faux messages de transactions Mobile Money, phishing, ingénierie sociale.
- **Scanner de QR Codes & Liens** : Analyse de sécurité des URLs et QR codes suspects avec intégration VirusTotal.
- **Détection des fraudes par Appel / Audio** : Analyse des transcriptions ou fichiers audio suspects.
- **Assistant IA Anti-Arnaque** : Assistant interactif basé sur Google Gemma / Gemini pour répondre aux questions de sécurité en langage naturel.
- **Multilingue** : Support du Français, Anglais et Ewé (langue locale).
- **Mode Hors-ligne & PWA-ready** : Utilisation possible même avec une connectivité réduite.
- **Historique & Statistiques** : Suivi des analyses et alertes de sécurité en local.

---

## 🛠️ Stack Technique

- **Framework** : [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI & Styles** : React 19, Tailwind CSS v4, Radix UI, Lucide Icons
- **IA & Sécurité** : Google Gemini API (Gemma), VirusTotal API, Tesseract OCR
- **Tests** : Vitest, Testing Library

---

## 📦 Installation et Démarrage

### Prérequis

- [Node.js](https://nodejs.org/) (v18+) ou [Bun](https://bun.sh/)
- Clé d'API Google Gemini (optionnel, pour l'IA)
- Clé d'API VirusTotal (optionnel, pour l'analyse de liens)

### 1. Cloner le projet

```bash
git clone https://github.com/HACKTOBERFEST-By-LBS/les-bugs-busters.git
cd les-bugs-busters
```

### 2. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 3. Configuration des variables d'environnement

Copiez le fichier `.env.example` en `.env` :

```bash
cp .env.example .env
```

Puis renseignez vos clés d'API dans `.env` :
```env
GEMINI_API_KEY=votre_cle_gemini
VIRUSTOTAL_API_KEY=votre_cle_virustotal
```

### 4. Lancer le serveur de développement

```bash
npm run dev
# ou
bun run dev
```

L'application sera accessible sur `http://localhost:3000`.

---

## 🧪 Tests

```bash
npm run test
```

---

## 👥 Équipe — Les Bugs Busters

Projet réalisé avec fierté pour le Hacktoberfest à **Lome Business School (LBS)**.
