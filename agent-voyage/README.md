# ✈️ Agent Voyage

Application de planification de voyages de luxe — vols + hôtels en temps réel, 3 scénarios de classe, résultats en CHF.

## Prérequis

- **Node.js** ≥ 18 — vérifier avec `node -v` (si absent : https://nodejs.org)
- **Git** — vérifier avec `git --version`
- **Une clé API Anthropic** — https://console.anthropic.com → "API Keys" → "Create Key"

---

## 🖥️ Étape 1 — Installation locale

```bash
# 1. Dans le dossier du projet
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env.local

# 3. Ouvrir .env.local et coller ta clé API
# ANTHROPIC_API_KEY=sk-ant-xxxxxx

# 4. Installer Vercel CLI (pour le dev local avec les fonctions /api)
npm install -g vercel

# 5. Lancer l'app en développement
npm run dev
```

L'app s'ouvre sur **http://localhost:3000**

> Le script `npm run dev` utilise `vercel dev` qui fait tourner à la fois
> le frontend Vite ET les fonctions serverless `/api` ensemble — c'est
> indispensable pour que les appels à `/api/search` fonctionnent en local.

---

## 🌐 Étape 2 — Déploiement sur Vercel

```bash
# 1. Créer un compte gratuit sur https://vercel.com

# 2. Se connecter via CLI
vercel login

# 3. Déployer (depuis le dossier du projet)
vercel

# Répondre aux questions :
#   Set up and deploy? → Y
#   Which scope? → ton compte
#   Link to existing project? → N
#   Project name? → agent-voyage (ou autre)
#   In which directory is your code? → ./
#   Override settings? → N

# 4. Ajouter la clé API dans les variables d'environnement Vercel
vercel env add ANTHROPIC_API_KEY
# Coller la clé → choisir "Production", "Preview", "Development"

# 5. Re-déployer pour appliquer les variables
vercel --prod
```

Tu obtiens une URL publique du type : **https://agent-voyage-xxx.vercel.app**

---

## 📁 Structure du projet

```
agent-voyage/
├── api/
│   └── search.js        ← Fonction serverless (appel API Anthropic sécurisé)
├── src/
│   ├── main.jsx         ← Point d'entrée React
│   └── App.jsx          ← Interface complète de l'agent
├── index.html
├── package.json
├── vite.config.js
├── vercel.json          ← Config Vercel (timeout 120s pour /api)
├── .env.example         ← Template variables d'environnement
├── .gitignore
└── README.md
```

## 🔐 Sécurité

- La clé API Anthropic est **uniquement côté serveur** (dans `api/search.js`)
- Elle ne transite jamais dans le navigateur
- Le fichier `.env.local` est ignoré par Git (voir `.gitignore`)

## 🛠️ Personnalisation

Pour modifier le profil voyageur (aéroports, critères hôtel, devise, etc.) :
→ Éditer le `SYSTEM_PROMPT` dans `api/search.js`

Pour modifier l'interface (formulaire, affichage des résultats) :
→ Éditer `src/App.jsx`

## 🆘 Problèmes courants

**`vercel` n'est pas reconnu** → `npm install -g vercel` puis relancer le terminal

**Erreur "ANTHROPIC_API_KEY non configurée"** → Vérifier que `.env.local` existe avec la bonne clé

**Timeout sur les recherches** → Normal pour les recherches complexes (plusieurs tours).
Le timeout est à 120s dans `vercel.json`. Vercel Pro permet d'aller jusqu'à 900s.

**Page blanche en local** → S'assurer d'utiliser `npm run dev` (pas `vite`) pour avoir les fonctions `/api`
