// tests/api.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config
global.EMT_CONFIG = {
    xClientId: 'test-client-id',
    passKey: 'test-pass-key'
};

// Charger les scripts nécessaires dans l'environnement de test
import '../../js/config.js';
import '../../js/api.js';

describe('API Module', () => {

    beforeEach(() => {
        // Nettoyer les mocks et le cache avant chaque test
        vi.clearAllMocks();
        window.API.clearCache();
        // Simuler un état en ligne par défaut
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get: () => true,
        });
    });

    describe('Login and Token Management', () => {
        it('should login and retrieve a token successfully', async () => {
            const mockLoginResponse = {
                code: '00',
                description: 'Successful',
                data: [{
                    accessToken: 'test-token',
                    tokenSecsLife: 3600
                }]
            };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockLoginResponse),
            });

            // L'appel se fait en interne, donc nous appelons une fonction qui déclenche le login
            await window.API.fetchBusTimes('1234'); // Cet appel va échouer mais le login réussira

            const loginCall = fetch.mock.calls.find(call => call[0].includes('user/login'));
            expect(loginCall).toBeDefined();
            expect(loginCall[1].headers['X-ClientId']).toBe(EMT_CONFIG.xClientId);
            expect(loginCall[1].headers.passKey).toBe(EMT_CONFIG.passKey);
        });

        it('should handle login failure', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401
            });
            await expect(window.API.fetchBusTimes('1234')).rejects.toThrow();
        });
    });

    describe('fetchBusTimes', () => {
        const mockStopId = '5998';
        const mockApiResponse = {
            code: '00',
            data: [{
                StopInfo: [{ stopName: 'PUERTA DEL SOL' }],
                Arrive: [
                    { line: '1', destination: 'Pza. Cristo Rey', estimateArrive: 120 },
                    { line: '1', destination: 'Pza. Cristo Rey', estimateArrive: 600 },
                    { line: '51', destination: 'Sol', estimateArrive: 300 }
                ]
            }]
        };

        beforeEach(() => {
            // Simuler un login réussi pour ne pas avoir à le gérer dans chaque test
            const mockLoginResponse = {
                code: '00',
                data: [{ accessToken: 'fake-token', tokenSecsLife: 3600 }]
            };
            fetch.mockResolvedValue({ // Utiliser mockResolvedValue pour tous les appels fetch
                ok: true,
                json: () => Promise.resolve(mockLoginResponse),
            });
            fetch.mockResolvedValueOnce({ // ...mais pour le premier appel, simuler la réponse de login
                 ok: true,
                 json: () => Promise.resolve(mockLoginResponse),
            }).mockResolvedValueOnce({ // ...et pour le second, simuler la réponse des arrivées
                 ok: true,
                 json: () => Promise.resolve(mockApiResponse),
            });
        });

        it('should fetch and parse bus times correctly', async () => {
            const data = await window.API.fetchBusTimes(mockStopId);

            expect(data.stopId).toBe(mockStopId);
            expect(data.stopName).toBe('PUERTA DEL SOL');
            expect(data.arrivals).toHaveLength(3);
            expect(data.arrivals[0].line).toBe('1');
        });

        it('should use cache on subsequent calls', async () => {
            await window.API.fetchBusTimes(mockStopId);
            const dataFromCache = await window.API.fetchBusTimes(mockStopId);

            expect(fetch).toHaveBeenCalledTimes(2); // Login + 1er appel
            expect(dataFromCache.fromCache).toBe(true);
        });

        it('should handle API error for a non-existent stop', async () => {
             fetch.mockReset();
             const mockLoginResponse = {
                code: '00',
                data: [{ accessToken: 'fake-token', tokenSecsLife: 3600 }]
            };
            const errorResponse = { code: '80', description: 'No existen datos' };
            fetch.mockResolvedValueOnce({
                 ok: true,
                 json: () => Promise.resolve(mockLoginResponse),
            }).mockResolvedValueOnce({
                 ok: true,
                 json: () => Promise.resolve(errorResponse),
            });

            await expect(window.API.fetchBusTimes('9999')).rejects.toThrow(/Arrêt 9999: Arrêt introuvable/);
        });
    });

    describe('Error Handling', () => {
        it('should handle offline status', async () => {
            Object.defineProperty(navigator, 'onLine', {
                configurable: true,
                get: () => false,
            });
            await expect(window.API.fetchBusTimes('1234')).rejects.toThrow('Vous êtes hors ligne');
        });

         it('should throw an error for invalid stop ID', async () => {
            await expect(window.API.fetchBusTimes('abc')).rejects.toThrow('Le numéro d\'arrêt doit être un nombre entre 1 et 99999.');
        });
    });

});
