# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

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
