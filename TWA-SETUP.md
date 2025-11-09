# 🚀 Guide de Mise en Place TWA (Trusted Web Activity)

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Phase 1 : Installation et Configuration](#phase-1--installation-et-configuration)
4. [Phase 2 : Build de l'APK](#phase-2--build-de-lapk)
5. [Phase 3 : Publication sur Play Store](#phase-3--publication-sur-play-store)
6. [Phase 4 : Maintenance](#phase-4--maintenance)
7. [Migration vers Capacitor (Optionnel)](#migration-vers-capacitor-optionnel)
8. [Troubleshooting](#troubleshooting)

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

# Si pas installé, télécharger depuis https://nodejs.org/
```

#### 2. Java Development Kit (JDK)
```bash
# Vérifier l'installation
java -version   # v11+ requis

# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# macOS
brew install openjdk@11

# Windows
# Télécharger depuis https://adoptium.net/
```

#### 3. Android SDK (optionnel pour tests locaux)
```bash
# Option 1: Android Studio (recommandé)
# Télécharger depuis https://developer.android.com/studio

# Option 2: Command Line Tools uniquement
# Télécharger depuis https://developer.android.com/studio#command-tools
```

#### 4. Bubblewrap CLI
```bash
# Installation globale
npm install -g @bubblewrap/cli

# Vérifier l'installation
bubblewrap --version
```

### 🌐 Compte Google Play Console

**Coût :** 25€ unique (frais Google, valable à vie)

1. Aller sur https://play.google.com/console/signup
2. Créer un compte développeur
3. Payer les frais d'inscription (25€)
4. Compléter le profil (peut prendre 24-48h pour validation)

---

## Phase 1 : Installation et Configuration

### Étape 1.1 : Initialiser Bubblewrap

```bash
# Naviguer vers le dossier du projet
cd /home/user/EMT

# Initialiser TWA
bubblewrap init --manifest https://ssellini.github.io/EMT/manifest.json
```

### Étape 1.2 : Configuration Interactive

Bubblewrap va poser plusieurs questions. Voici les réponses recommandées :

```
? Domain being opened in the TWA:
  → ssellini.github.io

? URL path being opened in the TWA:
  → /EMT/

? Application name:
  → EMT Madrid - Horaires Bus

? Short name (12 characters max):
  → EMT Madrid

? Package name (reverse domain notation):
  → com.sellini.emt

? Minimum Android version (API level):
  → 21

? Generate app signing key?
  → Yes

? Key store password (8+ characters):
  → [Choisir un mot de passe fort - NOTER PRÉCIEUSEMENT]

? Key password (8+ characters):
  → [Même mot de passe ou différent - NOTER PRÉCIEUSEMENT]

? First and Last name:
  → Mohamed Sofien Sellini

? Organization:
  → Sellini Apps

? Country (2-letter code):
  → ES (ou FR selon votre localisation)

? Include app shortcuts?
  → No (ou Yes si vous voulez ajouter des raccourcis)

? Include notification delegation?
  → No (Yes si vous prévoyez des notifications push)

? Fallback behavior when browser unavailable?
  → webview

? Enable site settings shortcut?
  → Yes

? Orientation:
  → portrait
```

### Étape 1.3 : Fichiers Générés

Après l'init, vous aurez :

```
EMT/
├── twa-manifest.json      # Configuration TWA
├── android.keystore       # Clé de signature (GARDER PRÉCIEUSEMENT!)
├── assetlinks.json        # Vérification Digital Asset Links
└── store_icon.png         # Icône pour Play Store (512x512)
```

### Étape 1.4 : Configurer Digital Asset Links

**Important :** Permet à Android de faire confiance à votre site.

1. Copier le contenu du fichier `assetlinks.json` généré

2. Créer le fichier `.well-known/assetlinks.json` dans votre repo :

```bash
# Créer le dossier
mkdir -p .well-known

# Copier le fichier
cp assetlinks.json .well-known/assetlinks.json

# Commit et push
git add .well-known/assetlinks.json
git commit -m "feat: Add Digital Asset Links for TWA"
git push origin main
```

3. Vérifier que le fichier est accessible :
   - Ouvrir : https://ssellini.github.io/EMT/.well-known/assetlinks.json
   - Doit retourner le JSON (pas 404)

4. Valider avec l'outil Google :
   - Aller sur : https://developers.google.com/digital-asset-links/tools/generator
   - Vérifier le lien

---

## Phase 2 : Build de l'APK

### Étape 2.1 : Build Initial

```bash
# Build l'APK de production
bubblewrap build

# Le processus prend 2-5 minutes
# Fichier généré : app-release-signed.apk
```

### Étape 2.2 : Tester l'APK Localement (Optionnel)

#### Option A : Avec un appareil Android physique

```bash
# Activer le mode développeur sur votre téléphone
# Paramètres > À propos > Taper 7 fois sur "Numéro de build"

# Activer le débogage USB
# Paramètres > Options développeur > Débogage USB

# Connecter le téléphone via USB

# Installer l'APK
adb install app-release-signed.apk

# Ou installer manuellement :
# 1. Transférer app-release-signed.apk sur le téléphone
# 2. Ouvrir le fichier avec un gestionnaire de fichiers
# 3. Autoriser l'installation depuis des sources inconnues
```

#### Option B : Avec un émulateur Android

```bash
# Lancer Android Studio
android-studio

# Créer un émulateur (AVD)
# Tools > Device Manager > Create Virtual Device

# Lancer l'émulateur

# Installer l'APK
adb install app-release-signed.apk
```

### Étape 2.3 : Vérifications

✅ **Checklist avant publication :**

- [ ] L'app s'ouvre correctement
- [ ] Le site GitHub Pages se charge
- [ ] Pas de barre d'adresse (mode fullscreen)
- [ ] Splash screen s'affiche (icône de l'app)
- [ ] Navigation fonctionne
- [ ] Retour en arrière fonctionne
- [ ] Liens externes s'ouvrent dans le navigateur
- [ ] Mode hors ligne fonctionne (Service Worker)
- [ ] Géolocalisation demande permission
- [ ] Thème couleur correspond (theme_color du manifest)

---

## Phase 3 : Publication sur Play Store

### Étape 3.1 : Préparer les Assets

#### 1. Icône de l'application (512x512)

```bash
# Déjà généré par Bubblewrap : store_icon.png
# Vérifier la qualité et remplacer si nécessaire
```

#### 2. Feature Graphic (1024x500)

Créer une bannière promotionnelle pour la page Play Store.

**Outils recommandés :**
- Canva : https://www.canva.com/
- Figma : https://www.figma.com/
- GIMP (gratuit) : https://www.gimp.org/

**Template suggéré :**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│   🚌  EMT MADRID                                │
│   Horaires Bus en Temps Réel                    │
│                                                  │
└──────────────────────────────────────────────────┘
    1024x500px, PNG ou JPG
```

#### 3. Screenshots (Minimum 2, recommandé 8)

**Dimensions :**
- Téléphone : 1080x1920 ou 1080x2340
- Tablette 7" : 1200x1920
- Tablette 10" : 1920x1200

**Comment créer :**

```bash
# Option 1: Depuis votre téléphone Android
# 1. Installer l'APK
# 2. Faire des captures d'écran (Power + Volume Down)
# 3. Transférer vers PC

# Option 2: Depuis émulateur Android
# 1. Lancer l'app dans l'émulateur
# 2. Cliquer sur l'icône caméra dans la barre latérale
# 3. Sauvegarder les screenshots

# Option 3: Avec Chrome DevTools (simulation)
# 1. Ouvrir https://ssellini.github.io/EMT/
# 2. F12 > Toggle Device Toolbar
# 3. Sélectionner "Pixel 5" ou autre device Android
# 4. Faire des captures d'écran
```

**Écrans recommandés à capturer :**
1. Page d'accueil (recherche)
2. Résultats d'un arrêt avec horaires
3. Liste des favoris
4. Mode sombre activé
5. Détails d'un bus
6. Menu de partage

#### 4. Description Play Store

**Titre court (50 caractères max) :**
```
EMT Madrid - Horaires Bus Temps Réel
```

**Description courte (80 caractères max) :**
```
Consultez les horaires des bus EMT Madrid en temps réel. Simple et rapide.
```

**Description complète (4000 caractères max) :**
```
🚌 EMT Madrid - Horaires Bus en Temps Réel

Consultez instantanément les prochains passages de bus EMT (Empresa Municipal de Transportes) de Madrid, directement sur votre téléphone !

✨ FONCTIONNALITÉS PRINCIPALES

🔍 Recherche Rapide
• Entrez le numéro d'arrêt pour voir les prochains bus
• Résultats en temps réel depuis l'API EMT officielle
• Interface claire et intuitive

⭐ Favoris
• Sauvegardez vos arrêts les plus fréquents
• Accès rapide en un clic
• Export/Import de vos favoris

🔄 Rafraîchissement Automatique
• Mise à jour toutes les 30 secondes
• Toujours les horaires les plus récents
• Indicateur visuel de chargement

🌙 Mode Sombre
• Confort visuel de nuit
• Détection automatique des préférences système
• Bascule rapide (Ctrl+D)

📍 Géolocalisation
• Trouvez les arrêts proches de vous
• Permission GPS respectueuse de la vie privée
• Recherche géographique optimisée

📱 Application Progressive (PWA)
• Fonctionne hors ligne avec les données en cache
• Installation sur écran d'accueil
• Notifications de mise à jour

🚀 PERFORMANCES

✅ Léger et rapide
✅ Fonctionne même avec connexion faible
✅ Cache intelligent (5 minutes)
✅ Optimisé pour économiser la batterie

🔒 CONFIDENTIALITÉ

• Aucune donnée personnelle collectée
• Pas de tracking publicitaire
• Code source ouvert (GitHub)
• Conforme RGPD

📞 SUPPORT

Des questions ? Un problème ?
Email : mohamedsofiensellini@gmail.com
GitHub : https://github.com/ssellini/EMT

⚠️ NOTE
Cette application utilise les données publiques de l'EMT Madrid.
Elle n'est pas officiellement affiliée à l'EMT.

---
Fait avec ❤️ à Madrid
```

### Étape 3.2 : Créer l'Application sur Play Console

1. **Aller sur Play Console**
   - https://play.google.com/console/

2. **Créer une nouvelle application**
   ```
   Cliquer sur "Créer une application"

   Nom de l'application : EMT Madrid - Horaires Bus
   Langue par défaut : Français (ou Espagnol)
   Application ou jeu : Application
   Gratuit ou payant : Gratuit

   ✅ Accepter les conditions
   ```

3. **Configuration de base**
   ```
   Tableau de bord > Commencer

   Catégorie : Voyages et infos locales

   Coordonnées :
   - Email : mohamedsofiensellini@gmail.com
   - Site web : https://ssellini.github.io/EMT/

   Confidentialité :
   - URL Politique de confidentialité :
     https://ssellini.github.io/EMT/ (ou créer une page dédiée)
   ```

4. **Fiche du Play Store**
   ```
   Production > Fiche du Play Store

   Détails de l'application :
   - Nom : EMT Madrid - Horaires Bus
   - Description courte : [Copier ci-dessus]
   - Description complète : [Copier ci-dessus]

   Assets graphiques :
   - Icône de l'app : store_icon.png (512x512)
   - Feature graphic : [Votre bannière 1024x500]
   - Screenshots téléphone : [Min 2, max 8]

   Catégorisation :
   - Catégorie : Voyages et infos locales
   - Tags : bus, madrid, transport, emt, horaires

   Coordonnées :
   - Email : mohamedsofiensellini@gmail.com
   - Téléphone : [Optionnel]
   - Site web : https://ssellini.github.io/EMT/
   ```

5. **Classification du contenu**
   ```
   Répondre au questionnaire :

   Catégorie d'application : Navigation

   Questions de sécurité :
   - Partage de position ? Oui (géolocalisation optionnelle)
   - Contenu généré par utilisateurs ? Non
   - Fonctions de réseau social ? Non
   - Achats dans l'app ? Non
   - Publicités ? Non

   Classification : PEGI 3 (tout public)
   ```

6. **Public cible**
   ```
   Groupe d'âge cible : 18 ans et plus

   L'app s'adresse-t-elle aux enfants ? Non
   ```

### Étape 3.3 : Upload de l'APK

1. **Production > Nouvelle version**
   ```
   Cliquer sur "Créer une version"

   Signer avec Google Play App Signing : Oui (recommandé)
   ```

2. **Upload APK**
   ```
   Glisser-déposer : app-release-signed.apk

   OU

   Cliquer sur "Parcourir les fichiers"
   Sélectionner : app-release-signed.apk
   ```

3. **Notes de version**
   ```
   Nom de la version : 1.0.0
   Code de version : 1

   Notes de version (pour chaque langue) :

   Français :
   ─────────
   🚀 Version initiale

   ✨ Fonctionnalités :
   • Recherche d'horaires en temps réel
   • Gestion des favoris
   • Mode sombre
   • Rafraîchissement automatique
   • Géolocalisation
   • Mode hors ligne

   Espagnol :
   ─────────
   🚀 Versión inicial

   ✨ Funcionalidades:
   • Búsqueda de horarios en tiempo real
   • Gestión de favoritos
   • Modo oscuro
   • Actualización automática
   • Geolocalización
   • Modo sin conexión
   ```

4. **Vérifications Google**
   ```
   Google va analyser automatiquement :
   ✅ Problèmes de sécurité
   ✅ Conformité des politiques
   ✅ Fonctionnement de l'app

   Si problèmes détectés → Corriger et re-uploader
   ```

### Étape 3.4 : Lancement

1. **Revue finale**
   ```
   Tableau de bord > Vérifier les éléments requis

   ✅ Fiche du Play Store complétée
   ✅ Classification du contenu validée
   ✅ Public cible défini
   ✅ Politique de confidentialité fournie
   ✅ APK uploadé et analysé
   ```

2. **Soumettre pour publication**
   ```
   Production > Nouvelle version > Vérifier > Lancer

   Choisir le déploiement :
   - Production (tout le monde)
   - Ou tests internes/fermés d'abord (recommandé)
   ```

3. **Délais**
   ```
   Tests internes : Disponible en quelques minutes
   Production :
   - Première soumission : 1-7 jours (examen manuel Google)
   - Mises à jour suivantes : Quelques heures généralement
   ```

---

## Phase 4 : Maintenance

### 4.1 Workflow de Mise à Jour

**La beauté de TWA : Mises à jour automatiques !**

```bash
# Développement normal
cd /home/user/EMT
vim js/app.js

# Commit et push
git add .
git commit -m "feat: Amélioration recherche"
git push origin main

# ✨ Magie : L'app Android se met à jour automatiquement !
# Aucune action supplémentaire nécessaire
```

**Pourquoi ?**
- L'app TWA pointe vers https://ssellini.github.io/EMT/
- GitHub Pages se met à jour automatiquement
- Les utilisateurs voient les changements immédiatement (ou au prochain lancement)

### 4.2 Quand Republier l'APK ?

Vous devez rebuild et republier l'APK **UNIQUEMENT** si vous changez :

- ✅ Nom de l'application
- ✅ Icône de l'application
- ✅ Couleur de thème principale
- ✅ URL de départ (start_url)
- ✅ Orientation (portrait/landscape)
- ✅ Configuration Digital Asset Links

**Pour tout le reste (99% des cas) :** Pas besoin de republier ! 🎉

### 4.3 Republier une Mise à Jour (si nécessaire)

```bash
# 1. Modifier twa-manifest.json si besoin
vim twa-manifest.json

# 2. Rebuild l'APK
bubblewrap build

# 3. Aller sur Play Console
# https://play.google.com/console/

# 4. Production > Créer une version

# 5. Upload le nouveau app-release-signed.apk

# 6. Incrémenter le code de version
# Exemple : 1 → 2

# 7. Ajouter notes de version

# 8. Vérifier > Lancer
```

### 4.4 Monitoring

**Google Play Console - Statistiques disponibles :**

```
Tableau de bord > Statistiques

📊 Métriques :
- Installations actives
- Installations / Désinstallations
- Évaluations et avis
- Crashs et ANR (Application Not Responding)
- Performances (temps de chargement)
- Utilisation par pays
- Utilisation par version Android
```

**Alertes importantes :**

```
Notifications automatiques pour :
⚠️ Taux de crash élevé (>2%)
⚠️ Avis négatifs en augmentation
⚠️ Problèmes de politique Google
⚠️ Mise à jour requise (version Android obsolète)
```

---

## Migration vers Capacitor (Optionnel)

### Quand Migrer ?

**Indicateurs :**
- 📊 L'app a du succès (>1000 installations)
- 💬 Les utilisateurs demandent des notifications
- 🚀 Vous voulez ajouter des fonctionnalités natives
- ⚡ Vous voulez plus de contrôle sur l'expérience

### Processus de Migration (Détaillé dans CAPACITOR-MIGRATION.md)

```bash
# 1. Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialiser
npx cap init "EMT Madrid" "com.sellini.emt"

# 3. Ajouter Android
npx cap add android

# 4. Synchroniser
npx cap sync

# 5. Build
npx cap build android

# 6. Publier nouvelle version sur Play Store
# (remplace la version TWA, les utilisateurs reçoivent une mise à jour)
```

**Avantages après migration :**
- ✅ Notifications locales programmées
- ✅ Accès fichiers système
- ✅ Plugins natifs (50+)
- ✅ Plus de contrôle

**Inconvénients :**
- ⚠️ Taille APK augmente (~5-8 MB vs ~500 KB)
- ⚠️ Build APK nécessaire pour chaque mise à jour importante
- ⚠️ Maintenance légèrement plus complexe

---

## Troubleshooting

### Problème 1 : Digital Asset Links Échoue

**Symptôme :**
```
L'app s'ouvre avec une barre d'adresse Chrome visible
(au lieu de fullscreen)
```

**Solution :**
```bash
# 1. Vérifier que le fichier est accessible
curl https://ssellini.github.io/EMT/.well-known/assetlinks.json

# 2. Vérifier le contenu JSON (doit être valide)
cat .well-known/assetlinks.json | jq .

# 3. Vérifier avec l'outil Google
# https://developers.google.com/digital-asset-links/tools/generator

# 4. Attendre 24-48h (cache Google)
# Parfois Google met du temps à indexer le fichier

# 5. Forcer le refresh
# Désinstaller l'app + Clear data Chrome + Réinstaller
```

### Problème 2 : Build Échoue

**Symptôme :**
```bash
bubblewrap build
# ERROR: JAVA_HOME not set
```

**Solution :**
```bash
# Ubuntu/Debian
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc

# macOS
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 11)' >> ~/.zshrc

# Windows
# Panneau de configuration > Système > Variables d'environnement
# Ajouter JAVA_HOME = C:\Program Files\Java\jdk-11
```

### Problème 3 : L'App ne Se Charge Pas

**Symptôme :**
```
Écran blanc ou "Site can't be reached"
```

**Solutions :**
```bash
# 1. Vérifier que GitHub Pages fonctionne
curl https://ssellini.github.io/EMT/

# 2. Vérifier la connexion internet du téléphone

# 3. Vérifier le start_url dans twa-manifest.json
cat twa-manifest.json | grep startUrl
# Doit être : /EMT/ (avec trailing slash)

# 4. Vérifier les permissions réseau dans AndroidManifest.xml
# (Bubblewrap les ajoute automatiquement normalement)

# 5. Clear cache de l'app
# Paramètres > Apps > EMT Madrid > Stockage > Vider le cache
```

### Problème 4 : Géolocalisation ne Fonctionne Pas

**Symptôme :**
```javascript
navigator.geolocation.getCurrentPosition() échoue
```

**Solution :**
```bash
# 1. Vérifier les permissions dans AndroidManifest.xml
# Devrait contenir :
# <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
# <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

# 2. Vérifier que l'utilisateur a accordé la permission
# Paramètres > Apps > EMT Madrid > Autorisations > Position

# 3. Vérifier que le site est en HTTPS
# GitHub Pages fournit HTTPS automatiquement

# 4. Tester dans Chrome mobile d'abord
# Si ça marche dans Chrome mais pas dans TWA, problème de config
```

### Problème 5 : Rejet sur Play Store

**Raisons communes :**

#### A. Politique de confidentialité manquante
```
Solution :
1. Créer une page privacy.html
2. Ajouter à GitHub Pages
3. Mettre à jour l'URL dans Play Console
```

#### B. Contenu dupliqué
```
Raison : Une app similaire existe déjà

Solution :
1. Ajouter des fonctionnalités uniques
2. Améliorer la description pour montrer la différence
3. Contacter le support Google si nécessaire
```

#### C. Icône non conforme
```
Raison : Icône floue ou avec texte

Solution :
1. Utiliser une icône haute résolution (512x512)
2. Éviter le texte sur l'icône
3. Fond transparent ou uni
```

#### D. Screenshots insuffisants
```
Raison : Moins de 2 screenshots

Solution :
1. Ajouter minimum 2 screenshots
2. Recommandé : 4-8 screenshots variés
```

### Problème 6 : Version Trop Ancienne d'Android

**Symptôme :**
```
L'app ne s'installe pas sur certains appareils
```

**Solution :**
```json
// Dans twa-manifest.json
{
  "minSdkVersion": 21  // Android 5.0 (2014)
  // Ou 19 pour supporter encore plus d'appareils (Android 4.4)
}
```

```bash
# Rebuild après modification
bubblewrap build
```

---

## Checklist Finale

### ✅ Avant le Premier Build

- [ ] Node.js installé (v16+)
- [ ] Java JDK installé (v11+)
- [ ] Bubblewrap CLI installé
- [ ] GitHub Pages déployé et accessible
- [ ] Manifest.json valide
- [ ] Service Worker fonctionnel
- [ ] HTTPS activé (GitHub Pages)
- [ ] Icônes multi-tailles présentes

### ✅ Configuration TWA

- [ ] `bubblewrap init` exécuté avec succès
- [ ] twa-manifest.json généré
- [ ] android.keystore généré (SAUVEGARDER!)
- [ ] Mots de passe keystore notés (IMPORTANT!)
- [ ] assetlinks.json créé dans .well-known/
- [ ] Digital Asset Links validé avec l'outil Google

### ✅ Build et Test

- [ ] `bubblewrap build` exécuté sans erreur
- [ ] app-release-signed.apk généré
- [ ] App testée sur émulateur ou appareil réel
- [ ] Navigation fonctionne
- [ ] Pas de barre d'adresse (fullscreen)
- [ ] Géolocalisation demande permission
- [ ] Mode hors ligne fonctionne

### ✅ Play Store

- [ ] Compte Google Play Console créé (25€ payés)
- [ ] Icône 512x512 prête (store_icon.png)
- [ ] Feature graphic 1024x500 créée
- [ ] Minimum 2 screenshots prêts
- [ ] Description courte/complète rédigées
- [ ] Politique de confidentialité accessible
- [ ] Classification du contenu complétée
- [ ] APK uploadé
- [ ] Notes de version rédigées
- [ ] Application soumise pour publication

### ✅ Post-Lancement

- [ ] App visible sur Play Store
- [ ] Installation testée depuis Play Store
- [ ] Statistiques configurées dans Play Console
- [ ] Alertes Google configurées
- [ ] Workflow GitHub Pages → TWA validé

---

## Ressources Utiles

### Documentation Officielle

- **Bubblewrap :** https://github.com/GoogleChromeLabs/bubblewrap
- **TWA Guide :** https://developer.chrome.com/docs/android/trusted-web-activity/
- **Play Console :** https://support.google.com/googleplay/android-developer
- **Digital Asset Links :** https://developers.google.com/digital-asset-links

### Outils

- **PWA Builder :** https://www.pwabuilder.com/ (Alternative à Bubblewrap)
- **Asset Links Generator :** https://developers.google.com/digital-asset-links/tools/generator
- **Lighthouse :** https://web.dev/lighthouse-pwa/ (Tester PWA)
- **Android ADB :** https://developer.android.com/studio/command-line/adb

### Communauté

- **Stack Overflow :** Tag `trusted-web-activity`
- **GitHub Issues :** https://github.com/GoogleChromeLabs/bubblewrap/issues
- **Reddit :** r/androiddev, r/PWA

---

## Notes Importantes

### 🔑 Sécurité du Keystore

**CRITIQUE :** Le fichier `android.keystore` est utilisé pour signer votre application.

⚠️ **À FAIRE ABSOLUMENT :**
```bash
# 1. Backup du keystore (MULTIPLE ENDROITS!)
cp android.keystore ~/Backups/emt-android.keystore
cp android.keystore /path/to/cloud/storage/emt-android.keystore

# 2. Noter les mots de passe
# Utiliser un gestionnaire de mots de passe (1Password, LastPass, Bitwarden)

# 3. Ne JAMAIS commiter dans Git
echo "android.keystore" >> .gitignore
echo "*.keystore" >> .gitignore
```

⚠️ **Si vous perdez le keystore :**
- ❌ Impossible de mettre à jour l'app sur Play Store
- ❌ Obligation de publier une nouvelle app (nouveau package name)
- ❌ Tous les utilisateurs doivent désinstaller/réinstaller
- ❌ Perte des avis et statistiques

### 📱 Compatibilité Android

**Versions supportées (avec minSdkVersion: 21) :**
- ✅ Android 5.0 Lollipop (2014) → Android 14 (2024)
- ✅ ~95% des appareils Android actuels

**Si vous voulez supporter Android 4.4 :**
```json
// twa-manifest.json
{
  "minSdkVersion": 19  // Android 4.4 KitKat
}
```
- ✅ ~98% des appareils Android
- ⚠️ Certaines fonctionnalités PWA limitées

### 🌍 Internationalisation

Pour ajouter d'autres langues sur le Play Store :

```
Play Console > Fiche du Play Store > Gérer les traductions

Ajouter :
- Espagnol (es-ES) - Important pour Madrid !
- Anglais (en-US)
- Autres langues selon votre public
```

Traduire :
- Titre
- Description courte
- Description complète
- Notes de version

---

## Prochaines Étapes

### Court Terme (Semaine 1-4)

1. ✅ **Lancer TWA** (Suivre ce guide)
2. 📊 **Observer les métriques** Play Console
3. 💬 **Récolter les retours** utilisateurs
4. 🐛 **Corriger les bugs** urgents (via GitHub Pages)

### Moyen Terme (Mois 1-3)

5. 🎯 **Analyser les besoins** fonctionnalités natives
6. 🔔 **Décider migration** Capacitor (si nécessaire)
7. 🌍 **Ajouter traductions** (Espagnol prioritaire)
8. 📈 **Optimiser SEO** Play Store (mots-clés, screenshots)

### Long Terme (Mois 3+)

9. 🚀 **Capacitor migration** (si demandé)
10. 🔔 **Notifications push** réelles
11. 📍 **Géolocalisation** avancée (arrêts proches)
12. 🎨 **Thèmes personnalisés** natifs

---

## Contact et Support

**Créateur du guide :** Claude Code (Anthropic)
**Développeur EMT Madrid :** Mohamed Sofien Sellini
**Email :** mohamedsofiensellini@gmail.com
**GitHub :** https://github.com/ssellini/EMT

---

**Bonne chance avec votre application TWA ! 🚀🚌**

_Dernière mise à jour : Novembre 2024_
