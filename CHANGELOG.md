# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [2.1.0] - 2025-11-01 (Phase 1)

### 🔒 Sécurité

#### Content Security Policy
- Ajout de CSP complète pour protection XSS
- Headers de sécurité : X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Upgrade-Insecure-Requests pour forcer HTTPS
- Referrer-Policy pour contrôle des informations de référence

#### Documentation Sécurité
- Nouveau fichier `SECURITY.md` documentant les mesures de sécurité
- Documentation des vulnérabilités connues
- Procédure de signalement de vulnérabilités
- Roadmap sécurité sur 3 phases

### ✨ SEO et Métadonnées

#### Open Graph et Réseaux Sociaux
- Meta tags Open Graph complets (og:title, og:description, og:image, og:url)
- Twitter Cards pour partage sur Twitter
- Structured Data (JSON-LD) pour moteurs de recherche
- Type WebApplication avec featureList et offers

### 📊 Données

#### Extension Base de Données
- **Passage de 6 à 40 arrêts** (+567%)
- Couverture des principaux échangeurs de Madrid
- Ajout d'arrêts stratégiques : Recoletos, Opera, Alonso Martínez, Argüelles, etc.
- Métadonnées enrichies (totalStops, coverage, lastExpansion)
- Version 1.0 → 1.1

### 🛠️ Gestion d'Erreurs Améliorée

#### Messages d'Erreur Détaillés
- 11 nouveaux types d'erreurs spécifiques
- Mapping des codes HTTP (400, 404, 429, 500, 502, 503, 504)
- Messages contextuels et actionnables
- Détection automatique du type d'erreur

#### Validation Robuste
- Nouvelle fonction `validateStopId()` pour valider les entrées
- Vérification des limites (1-99999)
- Détection des entrées non-numériques
- Messages d'erreur enrichis avec numéro d'arrêt

#### Retry Intelligent
- Timeout de 10 secondes par requête (AbortSignal)
- Pas de retry pour erreurs 400/404 (économie de ressources)
- Détection automatique en ligne/hors ligne
- Logs améliorés avec emojis (✅, ⚠️)

### 🧪 Tests et Qualité

#### Système de Tests
- Configuration Vitest complète avec happy-dom
- Globals activés (describe, it, expect)
- Setup avec mocks (localStorage, fetch, navigator)

#### Tests Unitaires
- **API tests** : 10 suites de tests couvrant :
  - Validation des IDs d'arrêt
  - Messages d'erreur
  - Gestion du cache
  - Retry et backoff exponentiel
  - Configuration des proxies
  - Timeout et validation HTML

- **Favorites tests** : 10 suites de tests couvrant :
  - Stockage localStorage
  - Structure des favoris
  - Ajout/suppression (sans doublons)
  - Export/import JSON
  - Partage via URL (base64)
  - Gestion d'erreurs
  - Tri par date

#### Tooling
- ESLint avec configuration JavaScript ES2021
- Prettier pour formatage automatique
- Scripts npm : test, test:ui, test:coverage, lint, format

### 🗂️ Fichiers Ajoutés

#### Configuration
- `package.json` - Dépendances et scripts npm
- `vitest.config.js` - Configuration Vitest
- `.eslintrc.json` - Configuration ESLint
- `.prettierrc` - Configuration Prettier

#### Tests
- `tests/setup.js` - Setup global des tests
- `tests/api.test.js` - Tests du module API (~500 lignes)
- `tests/favorites.test.js` - Tests du module Favorites (~500 lignes)
- `tests/README.md` - Documentation des tests

#### Documentation
- `SECURITY.md` - Documentation sécurité
- `PHASE1-IMPROVEMENTS.md` - Récapitulatif Phase 1

### 🔧 Modifié

#### Fichiers Principaux
- `index.html` - Ajout headers sécurité, Open Graph, Structured Data (+18 lignes)
- `js/api.js` - Gestion d'erreurs améliorée, validation (+54 lignes)
- `data/stops.json` - Extension à 40 arrêts (+163 lignes)
- `.gitignore` - Ajout coverage/, .eslintcache

### 📈 Statistiques

- **+41%** de code total (~2196 → ~3100 lignes)
- **+9** fichiers de configuration et tests
- **+2** fichiers de documentation
- **~65** tests unitaires
- **Couverture estimée** : 70-75%

### 🎯 Impact

#### Sécurité
- Protection renforcée contre XSS et injections
- Headers modernes conformes aux standards
- Documentation claire des risques

#### Fiabilité
- Messages d'erreur clairs et actionnables
- Validation stricte des entrées
- Meilleure gestion des cas limites

#### Qualité de Code
- Tests automatisés (base solide)
- Linting et formatage standardisés
- Documentation complète

#### Performance
- Timeout optimisé (10s)
- Retry intelligent économisant des ressources
- Cache amélioré avec logs détaillés

---

## [2.0.0] - 2025-10-24

### ✨ Ajouté

#### Sécurité et Fiabilité
- Système de fallback multi-proxy (3 services) avec basculement automatique
- Retry automatique avec backoff exponentiel (jusqu'à 3 tentatives)
- Gestion d'erreurs robuste avec messages clairs

#### Performance
- Cache API intelligent avec expiration (5 minutes)
- Service Worker pour mode hors ligne
- Rafraîchissement automatique des horaires (30 secondes)
- Optimisation du re-rendering des composants

#### Interface Utilisateur
- Mode sombre avec détection des préférences système
- Historique des 5 dernières recherches
- Notifications toast pour feedback des actions
- Indicateur de statut en ligne/hors ligne
- Animations d'apparition pour les cartes de bus
- Interface responsive améliorée

#### Accessibilité
- Attributs ARIA complets (labels, rôles, live regions)
- Support complet de la navigation au clavier
- Raccourcis clavier (Ctrl+K, Ctrl+D, Ctrl+R)
- Focus visible pour tous les éléments interactifs
- Contraste amélioré pour le mode clair et sombre
- Support des lecteurs d'écran

#### Favoris
- Export de favoris au format JSON
- Import de favoris depuis un fichier JSON
- Partage de favoris via URL encodée
- Tri par date d'ajout
- Interface améliorée avec boutons d'action

#### PWA (Progressive Web App)
- Manifest.json pour installation
- Service Worker pour mode hors ligne
- Cache des assets statiques
- Icônes adaptatives pour tous les appareils
- Mode standalone sur mobile

#### Fonctionnalités Bonus
- API de géolocalisation (interface prête)
- API de notifications push (interface prête)
- Indicateur de dernière mise à jour
- Bouton de rafraîchissement manuel

### 🔧 Modifié

#### Architecture
- Restructuration complète du code en modules
- Séparation en 4 fichiers JavaScript (app.js, api.js, favorites.js, utils.js)
- CSS externalisé dans un fichier séparé
- Organisation en dossiers (css/, js/, icons/)

#### Code
- Refactorisation complète avec patterns modernes
- Utilisation de async/await pour les appels API
- Gestion d'état centralisée dans AppState
- Meilleure séparation des responsabilités

#### Interface
- Design amélioré avec Tailwind CSS
- Cartes de bus redessinées
- En-tête avec barre d'outils
- Footer enrichi avec informations de version

### 📝 Documentation
- README.md complet avec guide d'utilisation
- CHANGELOG.md pour suivre les versions
- Commentaires de code améliorés
- Documentation inline des fonctions

### 🗂️ Fichiers Ajoutés
- `css/styles.css` - Styles personnalisés
- `js/app.js` - Logique principale
- `js/api.js` - Gestion des API
- `js/favorites.js` - Gestion des favoris
- `js/utils.js` - Fonctions utilitaires
- `manifest.json` - Manifest PWA
- `sw.js` - Service Worker
- `icons/` - Dossier d'icônes PWA
- `README.md` - Documentation complète
- `CHANGELOG.md` - Ce fichier
- `.gitignore` - Fichiers à ignorer

### 🐛 Corrigé
- Gestion des erreurs de proxy améliorée
- Pas de rechargement lors du clic sur favori
- Meilleure gestion du cache expiré
- Correction des fuites mémoire potentielles

## [1.0.0] - 2024

### Ajouté
- Recherche d'horaires de bus EMT Madrid
- Affichage des prochains passages
- Système de favoris basique
- Interface responsive avec Tailwind CSS
- Utilisation d'un proxy CORS unique

### Caractéristiques
- Fichier unique (index.html)
- Application monolithique
- Favoris en localStorage
- Design moderne avec animations

---

## Légende

- ✨ **Ajouté** : Nouvelles fonctionnalités
- 🔧 **Modifié** : Changements dans les fonctionnalités existantes
- 🐛 **Corrigé** : Corrections de bugs
- 🗑️ **Supprimé** : Fonctionnalités supprimées
- 🔒 **Sécurité** : Corrections de vulnérabilités
- 📝 **Documentation** : Changements dans la documentation
