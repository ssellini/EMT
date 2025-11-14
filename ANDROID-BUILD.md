# Guide de Build TWA - EMT Madrid

## 📱 Vue d'ensemble

Ce document décrit le processus de build de l'application Android TWA (Trusted Web Activity) pour EMT Madrid.

## ✅ Prérequis installés

- ✅ Node.js v22.21.1
- ✅ npm 10.9.4
- ✅ Java JDK 21
- ✅ Bubblewrap CLI (@bubblewrap/cli)

## 🔑 Configuration de signature

### Keystore généré

Un keystore Android a été créé avec les informations suivantes :

```bash
Fichier: android.keystore
Alias: emt-madrid-key
Type: RSA 2048 bits
Validité: 10,000 jours
SHA256 Fingerprint: A8:30:A3:43:22:D3:E4:E9:E3:F6:05:96:6C:13:8E:97:6A:A2:E2:97:D8:E5:A8:62:FB:FC:7F:BE:1E:6A:9C:62
```

**⚠️ IMPORTANT - SÉCURITÉ:**
- Le keystore `android.keystore` NE DOIT JAMAIS être commité dans Git
- Conservez une copie de sauvegarde sécurisée du keystore
- Le mot de passe par défaut est: `emtmadrid2024` (à changer en production)
- Si vous perdez le keystore, vous ne pourrez plus mettre à jour l'application sur le Play Store

### Modifier le mot de passe du keystore (recommandé)

```bash
# Changer le mot de passe du keystore
keytool -storepasswd -keystore android.keystore

# Changer le mot de passe de l'alias
keytool -keypasswd -alias emt-madrid-key -keystore android.keystore
```

## 📦 Fichiers de configuration TWA

### 1. twa-manifest.json

Le fichier principal de configuration TWA contient :
- Package ID: `com.ssellini.emt`
- Host: `ssellini.github.io`
- Start URL: `/EMT/`
- Icônes et couleurs du thème
- Configuration de signature

### 2. .well-known/assetlinks.json

Fichier de vérification Digital Asset Links pour Android :
- Associe l'application au domaine web
- Contient l'empreinte SHA-256 du certificat
- **DOIT être déployé sur `https://ssellini.github.io/EMT/.well-known/assetlinks.json`**

## 🏗️ Processus de build

### Option 1: Build avec Bubblewrap CLI (Recommandé)

```bash
# 1. Naviguer dans le répertoire du projet
cd /home/user/EMT

# 2. Builder l'APK (Bubblewrap demandera d'installer Android SDK si nécessaire)
bubblewrap build --skipPwaValidation

# 3. L'APK sera généré dans: app-release-signed.apk
```

### Option 2: Build avec Android Studio

1. Ouvrir Android Studio
2. Importer le projet depuis le répertoire généré par Bubblewrap
3. Build → Generate Signed Bundle/APK
4. Sélectionner le keystore `android.keystore`
5. Entrer l'alias et les mots de passe

## 🧪 Test de l'APK

### Installation sur appareil Android

```bash
# Via ADB (Android Debug Bridge)
adb install app-release-signed.apk

# Ou transférer l'APK sur l'appareil et l'installer manuellement
```

### Vérification de Digital Asset Links

1. Installer l'application
2. Ouvrir `https://ssellini.github.io/EMT/`
3. Vérifier qu'Android propose d'ouvrir avec l'app EMT Madrid
4. Tester que les liens s'ouvrent dans l'app (pas dans le navigateur)

### Outils de vérification

```bash
# Vérifier l'empreinte du certificat
keytool -list -v -keystore android.keystore -alias emt-madrid-key -storepass emtmadrid2024

# Vérifier le contenu de l'APK
unzip -l app-release-signed.apk

# Vérifier la signature de l'APK
jarsigner -verify -verbose -certs app-release-signed.apk
```

## 📤 Déploiement sur Google Play Store

### Prérequis

1. **Compte Google Play Console** (25€ one-time fee)
   - Inscription: https://play.google.com/console/signup

2. **Fichier .well-known/assetlinks.json déployé**
   - URL: https://ssellini.github.io/EMT/.well-known/assetlinks.json
   - Vérifier l'accessibilité avant de soumettre l'app

### Étapes de publication

1. **Créer une nouvelle application**
   - Nom: Horaires Bus EMT Madrid
   - Langue par défaut: Français
   - Type: Application
   - Gratuite/Payante: Gratuite

2. **Remplir la fiche du Play Store**
   - Description courte (80 caractères max)
   - Description complète (4000 caractères max)
   - Captures d'écran (min 2, max 8)
   - Icône de l'application (512x512 px)
   - Graphic feature (1024x500 px)

3. **Classification du contenu**
   - Catégorie: Voyages et infos locales
   - Public cible: Tous publics
   - Pas de publicité
   - Pas d'achats intégrés

4. **Télécharger l'APK ou AAB**
   - Production, Bêta fermée, ou Bêta ouverte
   - Version: 2.0.0 (code version: 20000)

5. **Soumettre pour révision**
   - Délai de révision: 1-7 jours généralement

## 🔄 Mise à jour de l'application

### Pour les modifications de la PWA uniquement

**Aucune action requise!**
- Les changements sur `https://ssellini.github.io/EMT/` sont automatiquement reflétés dans l'app
- Pas besoin de rebuilder l'APK
- Pas besoin de republier sur le Play Store

### Pour les modifications de l'APK (rare)

Cas nécessitant un rebuild :
- Changement de nom de l'app
- Changement d'icône
- Changement de start URL
- Changement de thème couleur Android
- Ajout de permissions Android

```bash
# 1. Incrémenter les versions dans twa-manifest.json
"appVersionName": "2.0.1",
"appVersionCode": 20001,

# 2. Rebuilder l'APK
bubblewrap build --skipPwaValidation

# 3. Publier la nouvelle version sur Play Store
```

## 📊 Monitoring et Analytics

### Play Console

- Statistiques d'installation
- Rapports de crash
- Notes et avis utilisateurs
- Métriques de performance

### Recommandations

- Intégrer Google Analytics dans la PWA
- Configurer les rapports d'erreurs (Sentry, etc.)
- Surveiller les performances (Lighthouse CI)

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter:**
   - `android.keystore`
   - Mots de passe
   - Clés API privées

2. **Sauvegarder:**
   - Le keystore dans un endroit sûr (cloud chiffré, coffre-fort)
   - Les mots de passe dans un gestionnaire de mots de passe

3. **Rotation des secrets:**
   - Changer les mots de passe après le développement initial
   - Limiter l'accès au keystore aux personnes autorisées

## 🐛 Dépannage

### Erreur "Digital Asset Links not verified"

1. Vérifier que `.well-known/assetlinks.json` est accessible
2. Vérifier que l'empreinte SHA-256 correspond
3. Attendre 24-48h pour la propagation DNS
4. Utiliser l'outil de test Google: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ssellini.github.io&relation=delegate_permission/common.handle_all_urls

### Erreur de build Bubblewrap

```bash
# Nettoyer le cache
rm -rf .gradle build app/build

# Mettre à jour Bubblewrap
npm update -g @bubblewrap/cli

# Rebuilder
bubblewrap build --skipPwaValidation
```

### Problèmes de certificat

```bash
# Vérifier la validité du keystore
keytool -list -v -keystore android.keystore

# Régénérer si nécessaire (ATTENTION: nouvelle app requise sur Play Store)
keytool -genkeypair -v -keystore android-new.keystore ...
```

## 📚 Ressources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

## 📝 Notes

- L'application TWA nécessite Android 5.0+ (API 21+)
- Chrome ou un navigateur basé sur Chromium doit être installé
- La PWA doit être valide (manifest, service worker, HTTPS)
- Le domaine doit avoir un certificat SSL valide

## 🚀 Prochaines étapes

1. [ ] Déployer `.well-known/assetlinks.json` sur GitHub Pages
2. [ ] Builder l'APK avec Bubblewrap
3. [ ] Tester l'APK sur un appareil Android
4. [ ] Créer un compte Google Play Console
5. [ ] Préparer les assets du Play Store (captures d'écran, descriptions)
6. [ ] Soumettre l'application pour révision
7. [ ] Publier sur le Play Store
