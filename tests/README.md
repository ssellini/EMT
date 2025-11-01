# Tests Unitaires - EMT Madrid

## 📋 Vue d'ensemble

Suite de tests unitaires pour l'application EMT Madrid utilisant **Vitest**.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Ou avec pnpm
pnpm install
```

## ▶️ Exécution des Tests

### Mode standard
```bash
npm test
```

### Mode watch (re-exécution automatique)
```bash
npm run test:watch
```

### Interface UI interactive
```bash
npm run test:ui
```

### Avec couverture de code
```bash
npm run test:coverage
```

## 📁 Structure des Tests

```
tests/
├── setup.js           # Configuration globale des tests
├── api.test.js        # Tests du module API
├── favorites.test.js  # Tests du module Favorites
└── README.md          # Ce fichier
```

## ✅ Tests Couverts

### Module API (`api.test.js`)
- ✅ Validation des IDs d'arrêt
- ✅ Messages d'erreur détaillés
- ✅ Gestion du cache
- ✅ Retry avec backoff exponentiel
- ✅ Configuration des proxies
- ✅ Détection en ligne/hors ligne
- ✅ Timeout de requêtes
- ✅ Validation des données HTML
- ✅ Construction des URLs

### Module Favorites (`favorites.test.js`)
- ✅ Stockage dans localStorage
- ✅ Structure des favoris
- ✅ Ajout de favoris (sans doublons)
- ✅ Suppression de favoris
- ✅ Vérification de présence
- ✅ Export JSON
- ✅ Import et fusion
- ✅ Partage via URL (base64)
- ✅ Gestion des erreurs
- ✅ Tri par date

## 🎯 Objectifs de Couverture

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Statements | ≥ 80% | À déterminer |
| Branches | ≥ 70% | À déterminer |
| Functions | ≥ 80% | À déterminer |
| Lines | ≥ 80% | À déterminer |

## 🔧 Configuration

### Vitest Config (`vitest.config.js`)

```javascript
{
  environment: 'happy-dom',  // Simule le DOM
  globals: true,             // Variables globales (describe, it, expect)
  setupFiles: './tests/setup.js'
}
```

### Setup (`tests/setup.js`)

Mocks automatiques pour :
- `localStorage`
- `navigator.onLine`
- `fetch`
- `console` (error, warn, log)

## 📝 Écrire un Nouveau Test

### Exemple

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Ma fonctionnalité', () => {
    beforeEach(() => {
        // Setup avant chaque test
    });

    it('devrait faire quelque chose', () => {
        const result = maFonction();
        expect(result).toBe(expectedValue);
    });
});
```

## 🐛 Debugging

### Afficher les logs
```bash
npm test -- --reporter=verbose
```

### Exécuter un seul fichier
```bash
npm test api.test.js
```

### Exécuter un seul test
```javascript
it.only('devrait tester ceci', () => {
    // Ce test sera le seul à s'exécuter
});
```

### Ignorer un test
```javascript
it.skip('devrait tester cela', () => {
    // Ce test sera ignoré
});
```

## 📊 Rapport de Couverture

Après avoir exécuté `npm run test:coverage`, consultez :

```
coverage/
├── index.html      # Rapport HTML interactif
├── coverage.json   # Données brutes
└── lcov.info       # Format LCOV
```

Ouvrez `coverage/index.html` dans votre navigateur pour voir un rapport détaillé.

## 🔍 Bonnes Pratiques

### ✅ À faire

- Tester les cas normaux ET les cas d'erreur
- Utiliser des noms de test descriptifs (en français)
- Nettoyer après chaque test (beforeEach/afterEach)
- Mocker les dépendances externes (fetch, localStorage)
- Viser une couverture > 80%

### ❌ À éviter

- Tests qui dépendent de l'ordre d'exécution
- Tests qui modifient l'état global sans le nettoyer
- Tests trop complexes (diviser en plusieurs tests)
- Tester l'implémentation au lieu du comportement

## 🚧 TODO

- [ ] Ajouter tests pour le module `utils.js`
- [ ] Ajouter tests pour le module `app.js`
- [ ] Tests d'intégration
- [ ] Tests E2E avec Playwright
- [ ] CI/CD avec GitHub Actions

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Happy DOM](https://github.com/capricorn86/happy-dom)

## 🤝 Contribution

Avant de soumettre un PR :

1. Exécuter tous les tests : `npm test`
2. Vérifier la couverture : `npm run test:coverage`
3. Vérifier le linting : `npm run lint`

## 📞 Support

Pour toute question sur les tests :
- 📧 Email : mohamedsofiensellini@gmail.com
- 🐛 Issues : [GitHub Issues](https://github.com/ssellini/EMT/issues)
