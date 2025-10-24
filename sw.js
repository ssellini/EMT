// Service Worker pour EMT Madrid PWA

const CACHE_NAME = 'emt-madrid-v1.0.0';
const STATIC_CACHE_NAME = 'emt-static-v1';
const DYNAMIC_CACHE_NAME = 'emt-dynamic-v1';

// Assets statiques à mettre en cache
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/api.js',
    './js/favorites.js',
    './js/utils.js',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installation...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Mise en cache des assets statiques');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('Service Worker: Erreur lors de la mise en cache:', error);
            })
    );

    // Forcer l'activation immédiate
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activation...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Prendre le contrôle immédiatement
    return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ne pas intercepter les requêtes vers les APIs externes (proxy, EMT)
    if (
        url.hostname.includes('codetabs.com') ||
        url.hostname.includes('allorigins.win') ||
        url.hostname.includes('corsproxy.io') ||
        url.hostname.includes('emtmadrid.es')
    ) {
        return; // Laisser passer sans cache
    }

    // Pour les assets statiques: Cache First
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(cacheFirst(request));
    } else {
        // Pour le reste: Network First avec fallback sur cache
        event.respondWith(networkFirst(request));
    }
});

/**
 * Stratégie Cache First
 * Utile pour les assets statiques qui changent rarement
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Erreur réseau:', error);
        return new Response('Hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Stratégie Network First
 * Utile pour le contenu dynamique
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Récupération depuis le cache');
            return cachedResponse;
        }

        // Si pas de cache et pas de réseau, retourner une page offline
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }

        return new Response('Hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// Gestion des notifications push (pour future implémentation)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Nouvelle information disponible',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'EMT Madrid', options)
    );
});

// Gestion du clic sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

// Gestion de la synchronisation en arrière-plan (pour future implémentation)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
});

async function syncFavorites() {
    // Placeholder pour synchronisation future
    console.log('Service Worker: Synchronisation des favoris');
}

console.log('Service Worker: Chargé');
