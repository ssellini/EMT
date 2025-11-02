import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Utiliser happy-dom pour simuler le DOM
    environment: 'happy-dom',

    // Inclure les fichiers de test
    include: ['tests/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/**/*.js'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.config.js'
      ]
    },

    // Globals (pour éviter d'importer vi, describe, it, expect partout)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.js']
  }
});
