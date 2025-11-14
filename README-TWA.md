# 📱 EMT Madrid - Trusted Web Activity (TWA)

## Vue d'ensemble

Ce document décrit la mise en place de la **Trusted Web Activity (TWA)** pour l'application EMT Madrid. Une TWA permet d'encapsuler une Progressive Web App (PWA) dans une application Android native qui peut être publiée sur le Google Play Store.

## ✨ Avantages du TWA

- ✅ **Publication sur Play Store** - Application Android officielle
- ✅ **Pas de code natif à maintenir** - La PWA reste la source unique
- ✅ **Mises à jour automatiques** - Changements web propagés immédiatement
- ✅ **Performance native** - Utilise Chrome Custom Tabs
- ✅ **Expérience complète** - Pas de barre d'adresse, plein écran
- ✅ **App Shortcuts** - Raccourcis Android natifs
- ✅ **Notifications** - Support des notifications push (si activé)

## 📋 Prérequis

### Système

- **Node.js** 16+ (installé: v22.21.1)
- **npm** 8+ (installé: 10.9.4)
- **Java JDK** 11+ (installé: JDK 21)
- **Bubblewrap CLI** (installé via npm)

### PWA Requirements

- ✅ HTTPS obligatoire (GitHub Pages ✓)
- ✅ Manifest.json valide ✓
- ✅ Service Worker actif ✓
- ✅ Icons 192x192 et 512x512 ✓

## 🚀 Installation rapide

### 1. Installer Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

### 2. Vérifier le keystore

```bash
npm run android:verify
```

### 3. Builder l'APK

```bash
npm run android:build
```

## 📦 Fichiers créés

### Configuration TWA

```
EMT/
├── twa-manifest.json              # Configuration TWA principale
├── .well-known/
│   └── assetlinks.json           # Digital Asset Links (à déployer)
├── android.keystore              # Clé de signature (NEVER COMMIT!)
├── keystore-info.txt             # Infos keystore (NEVER COMMIT!)
├── build-android.sh              # Script de build automatisé
├── verify-keystore.sh            # Script de vérification
├── ANDROID-BUILD.md              # Documentation complète
└── README-TWA.md                 # Ce fichier
```

### Fichiers générés par Bubblewrap (après build)

```
app-release-signed.apk            # APK signé prêt pour publication
app-release-unsigned.apk          # APK non signé
build/                            # Fichiers de build Gradle
.gradle/                          # Cache Gradle
```

## 🔐 Sécurité

### ⚠️ CRITIQUE - Ne JAMAIS commiter

- ❌ `android.keystore` - Clé de signature
- ❌ `keystore-info.txt` - Informations sensibles
- ❌ `*.apk` - Fichiers APK
- ❌ `*.aab` - Bundles Android

Ces fichiers sont automatiquement exclus via `.gitignore`.

### 🔑 Informations du Keystore

```
Fichier: android.keystore
Alias: emt-madrid-key
Algorithm: RSA 2048-bit
Validity: 10,000 days (~27 ans)
SHA256: A8:30:A3:43:22:D3:E4:E9:E3:F6:05:96:6C:13:8E:97:6A:A2:E2:97:D8:E5:A8:62:FB:FC:7F:BE:1E:6A:9C:62
```

**Important**: Sauvegardez le keystore dans un endroit sécurisé !

## 🏗️ Processus de Build

### Méthode automatique (recommandée)

```bash
# Build complet avec vérifications
npm run android:build
```

Le script vérifie :
- ✅ Prérequis système
- ✅ Présence du keystore
- ✅ Validité de la PWA
- ✅ Configuration TWA
- ✅ Signature de l'APK

### Méthode manuelle

```bash
# 1. Vérifier les prérequis
node --version  # >= 16
java -version   # >= 11

# 2. Builder avec Bubblewrap
bubblewrap build --skipPwaValidation

# 3. Vérifier la signature
jarsigner -verify -verbose -certs app-release-signed.apk
```

## 📱 Configuration de l'Application

### Informations de base

```json
{
  "packageId": "com.ssellini.emt",
  "name": "Horaires Bus EMT Madrid",
  "launcherName": "EMT Madrid",
  "host": "ssellini.github.io",
  "startUrl": "/EMT/"
}
```

### Thème et couleurs

```json
{
  "themeColor": "#2563eb",          // Bleu EMT
  "backgroundColor": "#f8fafc",     // Gris clair
  "navigationColor": "#2563eb",     // Barre de navigation
  "display": "standalone"           // Plein écran
}
```

### Versions

```json
{
  "appVersionName": "2.0.0",        // Visible par l'utilisateur
  "appVersionCode": 20000,          // Code interne (incrémenté à chaque version)
  "minSdkVersion": 21,              // Android 5.0+
  "targetSdkVersion": 33            // Android 13
}
```

## 🔗 Digital Asset Links

### Qu'est-ce que c'est ?

Digital Asset Links permet à Android de vérifier que votre application est autorisée à ouvrir les liens de votre domaine.

### Fichier assetlinks.json

**Emplacement requis**: `https://ssellini.github.io/EMT/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ssellini.emt",
    "sha256_cert_fingerprints": [
      "A8:30:A3:43:22:D3:E4:E9:E3:F6:05:96:6C:13:8E:97:6A:A2:E2:97:D8:E5:A8:62:FB:FC:7F:BE:1E:6A:9C:62"
    ]
  }
}]
```

### Vérification

```bash
# Vérifier l'accessibilité
curl https://ssellini.github.io/EMT/.well-known/assetlinks.json

# Vérifier via l'API Google
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ssellini.github.io&relation=delegate_permission/common.handle_all_urls"
```

## 🧪 Tests

### Test sur émulateur Android

```bash
# Lancer l'émulateur (Android Studio)
# Puis installer l'APK
adb install app-release-signed.apk
```

### Test sur appareil physique

1. Activer le mode développeur sur l'appareil
2. Activer le débogage USB
3. Connecter l'appareil
4. `adb install app-release-signed.apk`

### Vérifications importantes

- [ ] L'app se lance correctement
- [ ] Pas de barre d'adresse Chrome visible
- [ ] Les liens externes s'ouvrent dans l'app
- [ ] L'app fonctionne hors ligne
- [ ] Le splash screen s'affiche
- [ ] Les couleurs du thème sont correctes
- [ ] L'orientation portrait est respectée

## 📤 Publication sur Google Play Store

### 1. Créer un compte Play Console

- Coût: **25€** (one-time fee)
- URL: https://play.google.com/console/signup

### 2. Préparer les assets

#### Requis

- **Icon**: 512x512 px (déjà disponible)
- **Feature Graphic**: 1024x500 px
- **Screenshots**: Minimum 2, maximum 8
  - Phone: 320-3840 px (min 1 dimension)
  - Tablet: 320-3840 px (optionnel)

#### Descriptions

```
Titre: Horaires Bus EMT Madrid

Description courte (80 caractères):
Consultez les temps d'attente des bus EMT Madrid en temps réel

Description complète:
Horaires Bus EMT Madrid vous permet de consulter en temps réel les temps d'attente
des bus de l'EMT (Empresa Municipal de Transportes) de Madrid.

Fonctionnalités principales:
• Temps d'attente en temps réel
• Recherche par numéro d'arrêt
• Gestion des favoris
• Export/Import des favoris
• Actualisation automatique
• Mode sombre
• Fonctionne hors ligne

L'application utilise l'API officielle de l'EMT Madrid pour fournir des informations
précises et à jour.
```

### 3. Soumettre l'application

1. **Créer une nouvelle app** dans Play Console
2. **Remplir les informations** obligatoires
3. **Télécharger l'APK** (ou AAB)
4. **Classification du contenu**
   - Catégorie: Voyages et infos locales
   - Public: Tous publics
5. **Tarification**: Gratuite
6. **Soumettre pour révision**

### 4. Délais

- Première révision: 1-7 jours
- Mises à jour: 1-3 jours généralement

## 🔄 Mises à jour

### Mise à jour de la PWA (fréquent)

**Aucune action requise !**

Les modifications de la PWA web sont automatiquement reflétées dans l'application Android :
- Changements de code JavaScript
- Modifications CSS
- Mises à jour de contenu
- Corrections de bugs

### Mise à jour de l'APK (rare)

Nécessaire uniquement pour :
- Changement de nom de l'app
- Changement d'icône
- Changement de start URL
- Changement de permissions Android
- Mise à jour de targetSdkVersion

```bash
# 1. Modifier twa-manifest.json
nano twa-manifest.json

# Incrémenter les versions
"appVersionName": "2.0.1",    # 2.0.0 -> 2.0.1
"appVersionCode": 20001,      # 20000 -> 20001

# 2. Rebuilder
npm run android:build

# 3. Publier sur Play Console
```

## 📊 Monitoring

### Google Play Console

- **Statistiques d'installation**
  - Installations actives
  - Nouveaux utilisateurs
  - Désinstallations

- **Rapports de crash**
  - Taux de crash
  - Traces de pile
  - Appareils affectés

- **Avis utilisateurs**
  - Notes (1-5 étoiles)
  - Commentaires
  - Réponses

### Analytics (recommandé)

Intégrez Google Analytics dans votre PWA :

```javascript
// Dans votre PWA
gtag('event', 'app_opened', {
  'platform': 'android_twa'
});
```

## 🛠️ Scripts NPM disponibles

```bash
# Builder l'APK Android
npm run android:build

# Vérifier le keystore
npm run android:verify

# Initialiser un nouveau projet TWA
npm run android:init
```

## 🐛 Dépannage

### Erreur: "Digital Asset Links not verified"

**Causes possibles:**
1. Fichier assetlinks.json non déployé
2. Empreinte SHA-256 incorrecte
3. Package name incorrect
4. Propagation DNS non complète

**Solution:**
```bash
# Vérifier l'empreinte
npm run android:verify

# Vérifier l'accessibilité du fichier
curl https://ssellini.github.io/EMT/.well-known/assetlinks.json

# Attendre 24-48h pour la propagation
```

### Erreur: "Build failed"

**Solution:**
```bash
# Nettoyer le cache
rm -rf .gradle build app/build

# Rebuilder
npm run android:build
```

### Erreur: "Keystore not found"

**Solution:**
```bash
# Générer un nouveau keystore
keytool -genkeypair -v -keystore android.keystore \
  -alias emt-madrid-key -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass VOTRE_MOT_DE_PASSE

# Mettre à jour assetlinks.json avec la nouvelle empreinte
npm run android:verify
```

## 📚 Ressources

### Documentation officielle

- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Play Console](https://support.google.com/googleplay/android-developer/)

### Outils utiles

- [PWA Builder](https://www.pwabuilder.com/) - Alternative à Bubblewrap
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) - Générateur d'icônes
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit PWA

## ✅ Checklist de déploiement

### Avant le premier build

- [ ] Node.js, npm, Java installés
- [ ] Bubblewrap CLI installé
- [ ] Keystore généré et sauvegardé
- [ ] twa-manifest.json configuré
- [ ] assetlinks.json créé

### Avant la publication

- [ ] APK testé sur appareil Android
- [ ] Digital Asset Links vérifié
- [ ] assetlinks.json déployé sur le serveur web
- [ ] Compte Google Play Console créé (25€)
- [ ] Assets préparés (icônes, screenshots)
- [ ] Descriptions rédigées
- [ ] APK signé et vérifié

### Après la publication

- [ ] Vérifier les statistiques Play Console
- [ ] Répondre aux avis utilisateurs
- [ ] Surveiller les rapports de crash
- [ ] Mettre à jour la PWA régulièrement

## 🎯 Objectifs atteints

✅ **TWA configuré** - Fichiers de configuration créés
✅ **Keystore généré** - Clé de signature créée
✅ **Digital Asset Links** - Fichier assetlinks.json prêt
✅ **Scripts automatisés** - Build et vérification simplifiés
✅ **Documentation complète** - Guides et références
✅ **Sécurité** - Fichiers sensibles exclus de Git

## 🚀 Prochaines étapes

1. **Déployer assetlinks.json** sur GitHub Pages
2. **Builder l'APK** avec `npm run android:build`
3. **Tester** sur appareil Android
4. **Créer compte** Play Console
5. **Publier** l'application

---

**Pour plus de détails**, consultez [ANDROID-BUILD.md](./ANDROID-BUILD.md)

**Questions ?** Ouvrez une issue sur [GitHub](https://github.com/ssellini/EMT/issues)
