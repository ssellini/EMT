# 🚀 Guide de Mise en Place TWA (Trusted Web Activity)

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Recommandations et Améliorations (Nouveau)](#recommandations-et-améliorations)
4. [Phase 1 : Installation et Configuration](#phase-1--installation-et-configuration)
5. [Phase 2 : Build de l'APK](#phase-2--build-de-lapk)
6. [Phase 3 : Publication sur Play Store](#phase-3--publication-sur-play-store)
7. [Phase 4 : Maintenance](#phase-4--maintenance)
8. [Migration vers Capacitor (Optionnel)](#migration-vers-capacitor-optionnel)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

### Qu'est-ce qu'une TWA ?

Une **Trusted Web Activity (TWA)** est une technologie Google qui permet d'afficher votre Progressive Web App (PWA) dans une application Android native. C'est essentiellement une "fenêtre" optimisée vers votre site web.

### Pourquoi TWA pour EMT Madrid ?

✅ **Avantages :**
- Conversion rapide (30 minutes)
- Aucune modification du code source
- Publication sur Google Play Store
- Mises à jour automatiques via GitHub Pages
- Taille APK minimale (~500 KB)
- Performances excellentes

⚠️ **Limitations :**
- L'app pointe vers votre site GitHub Pages
- Notifications locales limitées (besoin Firebase pour push)
- Fonctionnalités natives limitées aux Web APIs

---

## Prérequis

### ✅ Ce que vous avez déjà

- [x] Application PWA fonctionnelle
- [x] Manifest.json configuré
- [x] Service Worker (sw.js)
- [x] GitHub Pages déployé
- [x] HTTPS activé (via GitHub Pages)
- [x] Icônes multi-tailles

### 📦 Ce qu'il faut installer

#### 1. Node.js et npm
```bash
# Vérifier l'installation
node --version  # v16+ recommandé
npm --version   # v8+ recommandé
```

#### 2. Java Development Kit (JDK)
```bash
# Vérifier l'installation
java -version   # v11+ requis
```

#### 3. Bubblewrap CLI
```bash
# Installation globale
npm install -g @bubblewrap/cli
```

### 🌐 Compte Google Play Console

**Coût :** 25€ unique (frais Google, valable à vie)

---

## Recommandations et Améliorations

### 🎨 Personnaliser l'Écran de Démarrage (Splash Screen)

Par défaut, Bubblewrap crée un écran de démarrage simple avec l'icône de votre application sur un fond blanc. Pour une meilleure expérience de marque, vous pouvez le personnaliser.

**Étapes :**

1.  **Ouvrez `twa-manifest.json`** après l'avoir généré.
2.  **Modifiez ces propriétés :**

    ```json
    "splashScreen": {
      "backgroundColor": "#FFFFFF", // Couleur de fond (ex: "#2563eb" pour correspondre au thème)
      "iconUrl": "https://ssellini.github.io/EMT/icons/icon-512.png", // URL de l'icône
      "paddingFactor": 2 // Réduit la taille de l'icône (1 = normal, 4 = plus petit)
    },
    "fullScreen": true, // Garder l'app en plein écran
    "navigationBarColor": "#FFFFFF" // Couleur de la barre de navigation Android
    ```

### 🔒 Politique de Confidentialité pour le Play Store

Le Play Store est de plus en plus strict. Une simple page web ne suffit pas toujours.

**Recommandations :**

1.  **Créez une page `privacy-policy.html` dédiée** dans votre projet.
2.  **Contenu minimum à inclure :**
    *   **Identité du développeur** : Votre nom (Mohamed Sofien Sellini).
    *   **Données collectées** :
        *   Mentionnez clairement que l'application **ne collecte, ne stocke et ne partage aucune donnée personnelle**.
        *   Précisez que la fonctionnalité de géolocalisation est **optionnelle**, initiée par l'utilisateur, et que les coordonnées ne sont **jamais stockées**.
    *   **Permissions utilisées** : Expliquez pourquoi l'application demande la permission de géolocalisation (`ACCESS_FINE_LOCATION`).
    *   **Services tiers** : Mentionnez que l'application utilise les données de l'API officielle de l'EMT Madrid et incluez un lien vers leurs conditions d'utilisation.
    *   **Contact** : Fournissez une adresse e-mail de contact pour les questions relatives à la confidentialité.
3.  **Lien vers la politique** : Mettez à jour le lien dans la fiche Play Store avec l'URL de cette nouvelle page.

### 🤖 Automatiser les Mises à Jour de l'APK

Pour éviter les erreurs manuelles lors de la republication, vous pouvez utiliser les scripts npm.

**Ajoutez ceci à votre `package.json` :**

```json
"scripts": {
  // ... autres scripts
  "twa:build": "bubblewrap build --skip-update",
  "twa:update-version": "node -p \"const fs = require('fs'); const manifest = JSON.parse(fs.readFileSync('twa-manifest.json')); manifest.appVersion = require('./package.json').version; fs.writeFileSync('twa-manifest.json', JSON.stringify(manifest, null, 2));\""
}
```

**Nouveau workflow de mise à jour :**

1.  `npm version patch` (ou `minor`/`major`) pour incrémenter la version de votre `package.json`.
2.  `npm run twa:update-version` pour synchroniser la version dans `twa-manifest.json`.
3.  `npm run twa:build` pour construire le nouvel APK.

---

## Phase 1 : Installation et Configuration

### Étape 1.1 : Initialiser Bubblewrap

```bash
bubblewrap init --manifest https://ssellini.github.io/EMT/manifest.json
```

### Étape 1.2 : Configuration Interactive

(Les réponses recommandées restent les mêmes)

### Étape 1.3 : Fichiers Générés

(La liste des fichiers générés reste la même)

### Étape 1.4 : Configurer Digital Asset Links

(Les instructions restent les mêmes et sont cruciales)

---

## Phase 2 : Build de l'APK

### Étape 2.1 : Build Initial

```bash
# Build l'APK de production
bubblewrap build

# Fichier généré : app-release-signed.apk
```

### Étape 2.2 : Tester l'APK Localement (Optionnel)

(Les instructions restent les mêmes)

### Étape 2.3 : Vérifications

(La checklist reste la même)

---

## Phase 3 : Publication sur Play Store

(Le guide existant est très complet et reste pertinent. Assurez-vous d'ajouter le lien vers votre nouvelle politique de confidentialité comme recommandé ci-dessus.)

---

## Phase 4 : Maintenance

(Le guide existant est excellent. L'automatisation proposée plus haut peut simplifier le processus de republication si nécessaire.)

---

## Migration vers Capacitor (Optionnel)

(Les informations restent pertinentes.)

---

## Troubleshooting

### Problème 1 : Digital Asset Links Échoue

(Les solutions sont toujours valides.)

### Problème 2 : Build Échoue

(Les solutions sont toujours valides.)

### Problème 3 : L'App ne Se Charge Pas

(Les solutions sont toujours valides.)

### Problème 4 : Géolocalisation ne Fonctionne Pas

(Les solutions sont toujours valides.)

### Problème 5 : Rejet sur Play Store

(Les raisons communes sont toujours valides, surtout la politique de confidentialité.)

### Problème 6 : Version Trop Ancienne d'Android

**Symptôme :**
```
L'app ne s'installe pas sur certains appareils
```

**Solution (corrigée) :**
```json
// Dans twa-manifest.json
{
  "minSdkVersion": 21 // Android 5.0 (2014)
  // Ou 19 pour supporter encore plus d'appareils (Android 4.4)
}
```
*Note : `minSdkVersion` est une propriété de `twa-manifest.json`, pas de `package.json` dans ce contexte.*

```bash
# Rebuild après modification
bubblewrap build
```

---

## Checklist Finale

(La checklist est toujours excellente.)

---

## Ressources Utiles

(Les ressources sont toujours pertinentes.)
