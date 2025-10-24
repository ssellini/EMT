# 🚀 Guide de Déploiement sur GitHub Pages

Ce guide vous explique comment déployer l'application EMT Madrid sur GitHub Pages gratuitement.

---

## 📋 Prérequis

- Un compte GitHub
- Le repository EMT cloné et poussé sur GitHub
- Les modifications de la v2.0 committées

---

## 🎯 Méthode 1 : Déploiement Automatique avec GitHub Actions (Recommandé)

### Étape 1 : Activer GitHub Pages

1. Allez sur votre repository GitHub : `https://github.com/ssellini/EMT`
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Pages**
4. Sous **Build and deployment** :
   - **Source** : Sélectionnez **GitHub Actions**
   - (Pas besoin de sélectionner une branche)

### Étape 2 : Pousser sur la branche principale

```bash
# Fusionner votre branche de développement sur main
git checkout main
git merge claude/project-review-011CURg1uYCEEdez4EU2kRrV

# Pousser sur GitHub
git push origin main
```

### Étape 3 : Le déploiement se fait automatiquement

- GitHub Actions va automatiquement déployer le site
- Vous pouvez suivre le progrès dans l'onglet **Actions**
- Une fois terminé, votre site sera accessible à :
  ```
  https://ssellini.github.io/EMT/
  ```

### Étape 4 : Vérifier le déploiement

1. Allez dans **Actions** sur GitHub
2. Vous devriez voir un workflow "Deploy to GitHub Pages" en cours ou terminé
3. Une fois vert ✅, votre site est en ligne !

---

## 🎯 Méthode 2 : Déploiement Manuel (Simple)

Si vous ne voulez pas utiliser GitHub Actions :

### Étape 1 : Activer GitHub Pages avec une branche

1. Allez sur **Settings** → **Pages**
2. Sous **Build and deployment** :
   - **Source** : Sélectionnez **Deploy from a branch**
   - **Branch** : Sélectionnez `main` (ou `master`) et `/root`
   - Cliquez sur **Save**

### Étape 2 : Pousser vos changements

```bash
# Assurez-vous que tous vos changements sont sur main
git checkout main
git merge claude/project-review-011CURg1uYCEEdez4EU2kRrV
git push origin main
```

### Étape 3 : Attendre le déploiement

- GitHub Pages va automatiquement construire et déployer votre site
- Cela peut prendre 2-5 minutes
- Votre site sera accessible à : `https://ssellini.github.io/EMT/`

---

## 🔍 Vérification Post-Déploiement

Une fois déployé, vérifiez que tout fonctionne :

### ✅ Checklist

- [ ] La page se charge correctement
- [ ] Les styles CSS sont appliqués
- [ ] Les scripts JavaScript fonctionnent
- [ ] Le mode sombre fonctionne
- [ ] Les favoris peuvent être ajoutés/retirés
- [ ] La recherche d'arrêts fonctionne
- [ ] Les icônes s'affichent correctement
- [ ] Le Service Worker s'enregistre (vérifier dans DevTools)
- [ ] L'application peut être installée comme PWA

### 🐛 Débogage

Si quelque chose ne fonctionne pas :

1. **Ouvrir la Console du Navigateur** (F12)
   - Chercher des erreurs 404 (fichiers non trouvés)
   - Vérifier les erreurs JavaScript

2. **Vérifier les chemins**
   - Tous les chemins doivent être relatifs (`./` au lieu de `/`)
   - Les fichiers doivent correspondre à la structure

3. **Vider le cache**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

4. **Vérifier le Service Worker**
   - Ouvrir DevTools → Application → Service Workers
   - Désinstaller l'ancien SW si nécessaire
   - Recharger la page

---

## 🌐 URLs du Site

### Production
```
https://ssellini.github.io/EMT/
```

### URL Custom (Optionnel)

Vous pouvez utiliser un nom de domaine personnalisé :

1. Allez dans **Settings** → **Pages**
2. Sous **Custom domain**, entrez votre domaine
3. Suivez les instructions pour configurer le DNS

---

## 🔄 Mises à Jour Futures

Pour mettre à jour le site :

```bash
# Faire vos modifications
git add .
git commit -m "feat: vos modifications"
git push origin main

# Le site sera automatiquement redéployé !
```

---

## 📊 Configuration Avancée

### Variables d'Environnement

Pour ajouter des configurations spécifiques à la production, vous pouvez créer un fichier de config :

```javascript
// config.js
const CONFIG = {
  production: window.location.hostname === 'ssellini.github.io',
  baseUrl: window.location.hostname === 'ssellini.github.io'
    ? '/EMT/'
    : '/',
  version: '2.0.0'
};
```

### Optimisations

Pour de meilleures performances en production :

1. **Minifier les fichiers JS et CSS**
   ```bash
   # Avec terser (JS)
   npx terser js/app.js -o js/app.min.js -c -m

   # Avec cssnano (CSS)
   npx cssnano css/styles.css css/styles.min.css
   ```

2. **Utiliser un CDN pour les bibliothèques**
   - Tailwind CSS est déjà sur CDN ✅
   - Google Fonts est déjà sur CDN ✅

3. **Activer la compression**
   - GitHub Pages active automatiquement gzip ✅

---

## 🎨 Personnalisation du Domaine

### Avec GitHub Pages

1. Acheter un domaine (ex: emt-madrid.com)
2. Configurer les DNS :
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153

   Type: CNAME
   Host: www
   Value: ssellini.github.io
   ```
3. Dans GitHub : **Settings** → **Pages** → **Custom domain**

---

## 📱 Test PWA

Pour tester que la PWA fonctionne correctement :

### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Lighthouse**
3. Sélectionner **Progressive Web App**
4. Cliquer sur **Analyze page load**
5. Vous devriez obtenir un score de 90+ ✅

### Installation PWA

1. Ouvrir le site sur Chrome/Edge
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Suivre les instructions
4. L'application devrait s'ouvrir en mode standalone

---

## 🔒 Sécurité

### HTTPS

- GitHub Pages active automatiquement HTTPS ✅
- Certificat SSL gratuit fourni par Let's Encrypt ✅

### Headers de Sécurité

GitHub Pages configure automatiquement :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`

Pour des headers personnalisés, vous auriez besoin d'un serveur custom.

---

## 📈 Analytics (Optionnel)

Pour suivre les visites, vous pouvez ajouter :

### Google Analytics

```html
<!-- Dans index.html, avant </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible Analytics (Plus respectueux de la vie privée)

```html
<script defer data-domain="ssellini.github.io" src="https://plausible.io/js/script.js"></script>
```

---

## 🆘 Problèmes Courants

### Problème : Site non accessible après 5 minutes

**Solution** : Vérifiez que :
1. Le workflow GitHub Actions a réussi
2. GitHub Pages est activé dans Settings
3. La branche correcte est sélectionnée

### Problème : Erreurs 404 sur les fichiers

**Solution** :
1. Vérifiez que le fichier `.nojekyll` existe
2. Vérifiez les chemins (doivent être relatifs avec `./`)
3. Vérifiez la casse des noms de fichiers

### Problème : Service Worker ne fonctionne pas

**Solution** :
1. GitHub Pages doit être en HTTPS ✅ (automatique)
2. Vérifiez que `sw.js` est à la racine
3. Désinstallez l'ancien SW dans DevTools

### Problème : Les icônes ne s'affichent pas

**Solution** :
1. Les liens symboliques ne fonctionnent pas sur GitHub Pages
2. Convertir les SVG en vraies PNG :
   ```bash
   cd icons
   for size in 72 96 128 144 152 192 384 512; do
     convert icon.svg -resize ${size}x${size} icon-${size}.png
   done
   ```

---

## 🎉 Félicitations !

Votre application EMT Madrid est maintenant en ligne et accessible au monde entier ! 🌍

**URL de votre site** : https://ssellini.github.io/EMT/

---

## 📞 Support

En cas de problème :
- Consultez les [GitHub Pages docs](https://docs.github.com/pages)
- Ouvrez une issue sur le repository
- Vérifiez les logs dans l'onglet Actions

---

**Dernière mise à jour** : Octobre 2025
