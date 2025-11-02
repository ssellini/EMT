# Sécurité - EMT Madrid

## 🔒 Mesures de Sécurité Implémentées

### Headers de Sécurité (Phase 1 ✅)

- **Content Security Policy (CSP)** : Protection contre XSS et injection de code
- **X-Content-Type-Options** : Prévention du MIME sniffing
- **X-Frame-Options** : Protection contre clickjacking
- **X-XSS-Protection** : Protection XSS additionnelle pour navigateurs anciens
- **Referrer Policy** : Contrôle des informations de référence
- **Upgrade Insecure Requests** : Force HTTPS

### Limitations Actuelles

#### Subresource Integrity (SRI)

**❌ Non implémenté pour Tailwind CDN**
- Raison : Tailwind CDN génère du CSS dynamiquement, incompatible avec SRI
- Impact : Risque si le CDN est compromis
- Solution : Migration vers build Tailwind locale (Phase 2)

**Solution temporaire** :
```javascript
// Fallback si Tailwind CDN échoue
if (typeof tailwind === 'undefined') {
    console.error('Tailwind CDN indisponible');
    // Charger styles de fallback
}
```

### Vulnérabilités Connues

#### 1. Dépendance sur Proxies Tiers
- **Risque** : Les proxies (codetabs.com, allorigins.win, corsproxy.io) peuvent être compromis
- **Impact** : Interception/modification des données
- **Mitigation** : Utilisation de HTTPS, validation côté client
- **Solution long terme** : Backend propre avec API officielle EMT

#### 2. Web Scraping
- **Risque** : Dépendance sur structure HTML du site EMT
- **Impact** : Service cassé si EMT change son site
- **Mitigation** : Multiples sélecteurs de fallback
- **Solution long terme** : API officielle EMT

#### 3. LocalStorage
- **Risque** : Données non chiffrées (favoris, historique)
- **Impact** : Lecture possible par scripts malveillants si XSS
- **Mitigation** : CSP empêche injection de scripts
- **Données sensibles** : Aucune (uniquement numéros d'arrêts publics)

## 🛡️ Bonnes Pratiques

### Pour les Développeurs

1. **Ne jamais désactiver CSP** sans raison valide
2. **Valider toutes les entrées** utilisateur
3. **Utiliser HTTPS** partout
4. **Tester régulièrement** avec OWASP ZAP ou similaire
5. **Mettre à jour** les dépendances régulièrement

### Pour les Utilisateurs

1. **Vérifier l'URL** : `https://ssellini.github.io/EMT/`
2. **Autoriser uniquement géolocalisation** si nécessaire
3. **Notifications** : optionnelles, peuvent être désactivées
4. **Favoris** : stockés localement, non synchronisés

## 📋 Checklist Sécurité

### Phase 1 (Actuelle) ✅
- [x] CSP implémenté
- [x] Headers de sécurité ajoutés
- [x] Documentation sécurité créée
- [x] Limitation SRI documentée

### Phase 2 (Prévu)
- [ ] Migration vers build Tailwind locale (élimine besoin CDN)
- [ ] SRI pour toutes les dépendances externes
- [ ] Backend API sécurisé
- [ ] Rate limiting côté serveur
- [ ] CORS configuré proprement

### Phase 3 (Future)
- [ ] Authentification (si fonctionnalités multi-utilisateurs)
- [ ] Chiffrement des données sensibles
- [ ] Audit de sécurité professionnel
- [ ] Bug bounty program

## 🚨 Signalement de Vulnérabilités

Si vous découvrez une vulnérabilité de sécurité :

1. **NE PAS** créer d'issue publique GitHub
2. **Envoyer un email** à : mohamedsofiensellini@gmail.com
3. **Inclure** :
   - Description détaillée
   - Étapes pour reproduire
   - Impact potentiel
   - Solution suggérée (si possible)

**Réponse attendue** : 72 heures maximum

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SRI Guide](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [PWA Security](https://web.dev/pwa-checklist/)

## 🔄 Dernière Mise à Jour

**Date** : 2025-11-01
**Version** : 2.0.0
**Statut** : Phase 1 complétée
