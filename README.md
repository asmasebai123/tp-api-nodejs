# TP — CI/CD avec GitHub Actions (Parties 0 → 5)

![CI Tests](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
![Coverage](https://github.com/USERNAME/REPO/actions/workflows/coverage.yml/badge.svg)

> API Node.js / Express de gestion des notes étudiants, utilisée comme support pour mettre en place un pipeline **CI** (Continuous Integration) avec **GitHub Actions**.
> Ce projet couvre les **parties 0 à 5** du TP (la partie 6 — déploiement continu — n'est pas incluse).

---

## Sommaire

- [Partie 0 — Comprendre le CI/CD](#partie-0--comprendre-le-cicd)
- [Partie 1 — Premier workflow GitHub Actions](#partie-1--premier-workflow-github-actions)
- [Partie 2 — Tester la robustesse du pipeline](#partie-2--tester-la-robustesse-du-pipeline)
- [Partie 3 — Enrichir le pipeline (matrix + coverage + badges)](#partie-3--enrichir-le-pipeline)
- [Partie 4 — Variables d'environnement et secrets](#partie-4--variables-denvironnement-et-secrets)
- [Partie 5 — Protection de la branche main](#partie-5--protection-de-la-branche-main)
- [Structure du projet](#structure-du-projet)
- [Lancer le projet en local](#lancer-le-projet-en-local)

---

## Partie 0 — Comprendre le CI/CD

**Le problème** : sans automatisation, chaque développeur doit exécuter les tests manuellement avant chaque merge. Ça marche… jusqu'au jour où quelqu'un oublie, ou que son environnement local est différent de celui des autres. Du code cassé finit par atterrir sur `main`.

**La solution** :

- **CI (Continuous Integration)** — à chaque `push` ou `pull_request`, une machine neutre (un *runner* GitHub) clone le code, installe les dépendances et exécute les tests. Si un test échoue, la PR est marquée en rouge et ne peut pas être mergée.
- **CD (Continuous Deployment)** — si les tests passent sur `main`, le code est automatiquement déployé en staging / production. *(Non implémenté ici.)*

**Avantages immédiats** : on garantit que `main` contient toujours du code testé, on détecte les régressions tôt, on teste sur plusieurs environnements en parallèle, et on documente automatiquement l'état du projet via des badges.

---

## Partie 1 — Premier workflow GitHub Actions

Le fichier [`.github/workflows/ci.yml`](.github/workflows/ci.yml) définit le pipeline.

**Éléments clés :**

| Élément | Rôle |
|---|---|
| `on: push` / `on: pull_request` | déclencheurs automatiques |
| `workflow_dispatch` | permet de lancer manuellement depuis l'onglet Actions |
| `runs-on: ubuntu-latest` | machine virtuelle utilisée |
| `actions/checkout@v4` | récupère le code du dépôt |
| `actions/setup-node@v4` | installe Node.js + active le cache npm |
| `npm ci` | installation reproductible (à préférer à `npm install` en CI) |
| `npm test` | exécution de la suite de tests Jest |
| Smoke test | démarre le serveur et vérifie que `GET /` répond 200 |

Une fois le fichier poussé sur GitHub, va dans l'onglet **Actions** : chaque push déclenche automatiquement le job *Tests Node.js*.

---

## Partie 2 — Tester la robustesse du pipeline

But : vérifier que le pipeline **bloque vraiment** une PR qui casse les tests.

### Scénario guidé

1. Créer une branche :
   ```bash
   git checkout -b test/casser-pipeline
   ```
2. Introduire un bug volontaire dans [`utils/calculNote.js`](utils/calculNote.js), par exemple remplacer la somme par une multiplication :
   ```js
   // AVANT
   const somme = notes.reduce((acc, n) => acc + n, 0);
   // APRÈS (bug volontaire)
   const somme = notes.reduce((acc, n) => acc * n, 1);
   ```
3. Commit + push + ouvrir une **Pull Request** vers `main`.
4. GitHub Actions démarre automatiquement → le job devient **rouge** ❌ : les tests `calculerMoyenne` échouent.
5. La PR affiche *"All checks have failed"* — impossible de merger si la protection de branche est activée (voir Partie 5).
6. Rétablir le bon code, re-pousser → le pipeline repasse en **vert** ✅.

---

## Partie 3 — Enrichir le pipeline

### 3.a Matrix — tester plusieurs versions de Node.js

Dans [`ci.yml`](.github/workflows/ci.yml) :

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
  fail-fast: false
```

Le job s'exécute en parallèle sur Node 18, 20 et 22. `fail-fast: false` garantit qu'un échec sur une version n'annule pas les autres.

### 3.b Workflow de couverture

Un second workflow [`coverage.yml`](.github/workflows/coverage.yml) :

- lance `npm run test:coverage` (Jest avec `--coverage`) ;
- publie le dossier `coverage/` comme **artefact** GitHub (rétention 7 jours).

Télécharge l'artefact `coverage-report` depuis l'onglet Actions, ouvre `coverage/lcov-report/index.html` dans un navigateur pour explorer le rapport interactif.

### 3.c Badges dans le README

En haut de ce README :

```markdown
![CI Tests](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
![Coverage](https://github.com/USERNAME/REPO/actions/workflows/coverage.yml/badge.svg)
```

Remplace `USERNAME/REPO` par le chemin exact de ton dépôt.

---

## Partie 4 — Variables d'environnement et secrets

### Règle d'or

**Aucune donnée sensible ne doit jamais être committée.** Ni mot de passe, ni clé API, ni URI MongoDB de production.

### Sur le dépôt

- `.env` — **jamais** committé (voir [`.gitignore`](.gitignore)).
- [`.env.example`](.env.example) — fichier d'exemple committé, contenant les **noms** des variables attendues.

### Variables utilisées par le projet

| Variable | Rôle |
|---|---|
| `PORT` | port d'écoute du serveur (par défaut 3000) |
| `MONGODB_URI` | URI de connexion MongoDB (ignorée si `USE_MEMORY_DB=true`) |
| `USE_MEMORY_DB` | si `true`, démarre un MongoDB en mémoire via `mongodb-memory-server` |
| `NODE_ENV` | environnement d'exécution (`test`, `development`, `production`) |

### Sur GitHub Actions

Les valeurs sensibles (en vrai projet : `MONGODB_URI` de production, clés API, secrets JWT…) sont stockées dans :

**Settings → Secrets and variables → Actions → New repository secret**

Puis injectées dans le workflow :

```yaml
env:
  PORT: ${{ secrets.PORT }}
  USE_MEMORY_DB: true
  NODE_ENV: test
```

GitHub masque automatiquement les valeurs des secrets dans les logs (`***`).

### Pourquoi les tests tournent sans vraie base MongoDB ?

Le fichier [`database.js`](database.js) utilise **`mongodb-memory-server`** : une base MongoDB éphémère est démarrée en RAM si `USE_MEMORY_DB=true` (ou si `MONGODB_URI` n'est pas défini). Aucune connexion externe → CI rapide, reproductible, sans secret.

---

## Partie 5 — Protection de la branche main

Objectif : **interdire tout merge sur `main` tant que le CI n'est pas vert.**

Dans ton dépôt GitHub :

1. **Settings → Branches → Branch protection rules → Add rule**.
2. **Branch name pattern** : `main`.
3. Cocher :
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - Sélectionne les jobs :
       - `Tests Node.js 18`
       - `Tests Node.js 20`
       - `Tests Node.js 22`
   - ✅ **Require branches to be up to date before merging**
4. **Create / Save changes**.

**Résultat** : le bouton *Merge pull request* reste grisé tant qu'un job est en échec. Couplé à la Partie 2, la branche `main` devient **non-cassable**.

---

## Structure du projet

```
CI-CD-TP/
├── .github/
│   └── workflows/
│       ├── ci.yml              ← Partie 1, 2, 3 (matrix + smoke test) — FOURNI PAR LE PROF
│       └── coverage.yml        ← Partie 3 (coverage + artefact)
├── models/
│   └── Etudiant.js             ← schéma Mongoose
├── routes/
│   └── etudiants.js            ← routes REST /api/etudiants
├── tests/
│   ├── setup.js                ← init MongoDB en mémoire pour les tests
│   ├── calculNote.test.js      ← tests unitaires (cible du bug Partie 2)
│   └── etudiants.test.js       ← tests d'intégration API
├── utils/
│   └── calculNote.js           ← logique métier : moyenne / mention / admission
├── app.js                      ← instance Express (exportée pour supertest)
├── database.js                 ← connectDB() — FOURNI PAR LE PROF
├── server.js                   ← entrée applicative (appelle connectDB + écoute)
├── .env.example                ← Partie 4
├── .gitignore                  ← Partie 4
├── package.json                ← FOURNI PAR LE PROF
└── README.md
```

---

## Lancer le projet en local

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'exemple
cp .env.example .env

# 3. Lancer les tests
npm test

# 4. Lancer avec la couverture
npm run test:coverage

# 5. Démarrer l'API (utilise MongoDB en mémoire par défaut)
npm start
# → http://localhost:3000
```

### Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Santé de l'API (utilisé par le smoke test) |
| `GET` | `/api/etudiants` | Liste des étudiants |
| `GET` | `/api/etudiants/:id` | Détails + moyenne + mention |
| `POST` | `/api/etudiants` | Créer un étudiant |
| `PUT` | `/api/etudiants/:id/notes` | Ajouter une note |
| `DELETE` | `/api/etudiants/:id` | Supprimer un étudiant |

---

## Licence

MIT — Projet pédagogique.
LabIDEURL	https://d3qx9j6mbrylbr.cloudfront.net/?folder=/home/ec2-user/environment
LabIDEPassword	76315990
