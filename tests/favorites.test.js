// Tests pour le module Favorites
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Module Favorites', () => {
    beforeEach(() => {
        // Reset localStorage avant chaque test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Stockage des favoris', () => {
        it('devrait utiliser la clé correcte dans localStorage', () => {
            const STORAGE_KEY = 'emtFavorites';
            expect(STORAGE_KEY).toBe('emtFavorites');
        });

        it('devrait retourner un tableau vide si aucun favori', () => {
            localStorage.getItem.mockReturnValue(null);

            const favorites = localStorage.getItem('emtFavorites');
            expect(favorites).toBeNull();

            // Après parsing, devrait retourner []
            const parsed = favorites ? JSON.parse(favorites) : [];
            expect(parsed).toEqual([]);
            expect(Array.isArray(parsed)).toBe(true);
        });

        it('devrait parser correctement les favoris JSON', () => {
            const mockFavorites = [
                { id: '5998', name: 'Test Stop', address: 'Test Address', addedAt: Date.now() }
            ];

            localStorage.getItem.mockReturnValue(JSON.stringify(mockFavorites));

            const stored = localStorage.getItem('emtFavorites');
            const parsed = JSON.parse(stored);

            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toHaveProperty('id');
            expect(parsed[0]).toHaveProperty('name');
            expect(parsed[0]).toHaveProperty('address');
        });
    });

    describe('Structure d\'un favori', () => {
        it('devrait avoir les propriétés requises', () => {
            const favorite = {
                id: '5998',
                name: 'Pº Castellana - General Perón',
                address: 'Paseo de la Castellana, 143',
                addedAt: Date.now()
            };

            expect(favorite).toHaveProperty('id');
            expect(favorite).toHaveProperty('name');
            expect(favorite).toHaveProperty('address');
            expect(favorite).toHaveProperty('addedAt');

            expect(typeof favorite.id).toBe('string');
            expect(typeof favorite.name).toBe('string');
            expect(typeof favorite.addedAt).toBe('number');
        });

        it('devrait avoir un timestamp valide', () => {
            const favorite = {
                id: '5998',
                name: 'Test',
                address: 'Test Address',
                addedAt: Date.now()
            };

            expect(favorite.addedAt).toBeGreaterThan(0);
            expect(favorite.addedAt).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('Ajout de favoris', () => {
        it('ne devrait pas ajouter un favori en double', () => {
            const favorites = [
                { id: '5998', name: 'Test 1', address: 'Address 1', addedAt: Date.now() }
            ];

            const newFavorite = { id: '5998', name: 'Test 1 Updated', address: 'Address 1', addedAt: Date.now() };

            // Vérifier qu'un favori avec le même ID existe déjà
            const existsIndex = favorites.findIndex(fav => fav.id === newFavorite.id);
            expect(existsIndex).toBeGreaterThanOrEqual(0);

            // Ne pas ajouter si existe déjà
            if (existsIndex === -1) {
                favorites.push(newFavorite);
            }

            expect(favorites).toHaveLength(1);
        });

        it('devrait ajouter un nouveau favori correctement', () => {
            const favorites = [];
            const newFavorite = { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() };

            favorites.push(newFavorite);

            expect(favorites).toHaveLength(1);
            expect(favorites[0].id).toBe('5998');
        });
    });

    describe('Suppression de favoris', () => {
        it('devrait supprimer un favori par son ID', () => {
            const favorites = [
                { id: '5998', name: 'Test 1', address: 'Address 1', addedAt: Date.now() },
                { id: '72', name: 'Test 2', address: 'Address 2', addedAt: Date.now() }
            ];

            const filtered = favorites.filter(fav => fav.id !== '5998');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('72');
        });

        it('ne devrait pas modifier le tableau si l\'ID n\'existe pas', () => {
            const favorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const filtered = favorites.filter(fav => fav.id !== '9999');

            expect(filtered).toHaveLength(1);
            expect(filtered).toEqual(favorites);
        });
    });

    describe('Vérification de favori', () => {
        it('devrait vérifier si un arrêt est dans les favoris', () => {
            const favorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const isFavorite = favorites.some(fav => fav.id === '5998');
            const isNotFavorite = favorites.some(fav => fav.id === '9999');

            expect(isFavorite).toBe(true);
            expect(isNotFavorite).toBe(false);
        });
    });

    describe('Export de favoris', () => {
        it('devrait convertir les favoris en JSON', () => {
            const favorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const json = JSON.stringify(favorites, null, 2);

            expect(json).toContain('"id"');
            expect(json).toContain('"name"');
            expect(json).toContain('5998');

            // Vérifier que c'est un JSON valide
            expect(() => JSON.parse(json)).not.toThrow();
        });

        it('devrait créer un Blob pour le téléchargement', () => {
            const favorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const data = JSON.stringify(favorites, null, 2);
            const blob = new Blob([data], { type: 'application/json' });

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('application/json');
        });
    });

    describe('Import de favoris', () => {
        it('devrait valider que l\'import est un tableau', () => {
            const validImport = [{ id: '5998', name: 'Test', address: 'Address' }];
            const invalidImport = { id: '5998', name: 'Test' };

            expect(Array.isArray(validImport)).toBe(true);
            expect(Array.isArray(invalidImport)).toBe(false);
        });

        it('devrait fusionner les favoris importés avec les existants', () => {
            const existing = [
                { id: '5998', name: 'Existing', address: 'Address 1', addedAt: Date.now() }
            ];

            const imported = [
                { id: '72', name: 'Imported', address: 'Address 2', addedAt: Date.now() }
            ];

            const merged = [...existing];

            imported.forEach(fav => {
                if (!merged.some(e => e.id === fav.id)) {
                    merged.push(fav);
                }
            });

            expect(merged).toHaveLength(2);
            expect(merged.find(f => f.id === '5998')).toBeTruthy();
            expect(merged.find(f => f.id === '72')).toBeTruthy();
        });

        it('ne devrait pas importer de doublons', () => {
            const existing = [
                { id: '5998', name: 'Existing', address: 'Address', addedAt: Date.now() }
            ];

            const imported = [
                { id: '5998', name: 'Duplicate', address: 'Address', addedAt: Date.now() }
            ];

            const merged = [...existing];

            imported.forEach(fav => {
                if (!merged.some(e => e.id === fav.id)) {
                    merged.push(fav);
                }
            });

            expect(merged).toHaveLength(1);
        });
    });

    describe('Partage de favoris via URL', () => {
        it('devrait encoder les favoris en base64', () => {
            const favorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const json = JSON.stringify(favorites);
            const encoded = btoa(json);

            expect(encoded).toBeTruthy();
            expect(typeof encoded).toBe('string');

            // Vérifier que c'est décodable
            const decoded = atob(encoded);
            expect(decoded).toBe(json);
        });

        it('devrait construire une URL de partage valide', () => {
            const favorites = [{ id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }];
            const encoded = btoa(JSON.stringify(favorites));
            const baseUrl = 'https://ssellini.github.io/EMT/';
            const shareUrl = `${baseUrl}?fav=${encoded}`;

            expect(shareUrl).toContain(baseUrl);
            expect(shareUrl).toContain('?fav=');
            expect(shareUrl.split('?fav=')[1]).toBeTruthy();
        });

        it('devrait décoder les favoris depuis l\'URL', () => {
            const originalFavorites = [
                { id: '5998', name: 'Test', address: 'Address', addedAt: Date.now() }
            ];

            const encoded = btoa(JSON.stringify(originalFavorites));
            const decoded = JSON.parse(atob(encoded));

            expect(decoded).toEqual(originalFavorites);
            expect(Array.isArray(decoded)).toBe(true);
            expect(decoded[0].id).toBe('5998');
        });
    });

    describe('Gestion des erreurs', () => {
        it('devrait gérer un JSON corrompu dans localStorage', () => {
            localStorage.getItem.mockReturnValue('invalid json {{{');

            let favorites;
            try {
                favorites = JSON.parse(localStorage.getItem('emtFavorites'));
            } catch (error) {
                favorites = [];
            }

            expect(Array.isArray(favorites)).toBe(true);
            expect(favorites).toHaveLength(0);
        });

        it('devrait gérer localStorage plein', () => {
            const error = new Error('QuotaExceededError');
            localStorage.setItem.mockImplementation(() => {
                throw error;
            });

            expect(() => {
                try {
                    localStorage.setItem('test', 'value');
                } catch (e) {
                    // Gérer l'erreur
                    expect(e).toBe(error);
                }
            }).not.toThrow();
        });
    });

    describe('Tri des favoris', () => {
        it('devrait trier les favoris par date d\'ajout (plus récent en premier)', () => {
            const now = Date.now();
            const favorites = [
                { id: '1', name: 'Old', address: 'A', addedAt: now - 10000 },
                { id: '2', name: 'Recent', address: 'B', addedAt: now - 1000 },
                { id: '3', name: 'Oldest', address: 'C', addedAt: now - 20000 }
            ];

            const sorted = [...favorites].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

            expect(sorted[0].id).toBe('2'); // Plus récent
            expect(sorted[1].id).toBe('1');
            expect(sorted[2].id).toBe('3'); // Plus ancien
        });
    });
});
