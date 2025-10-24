// api.js - Gestion des appels API avec fallback et retry

// Services proxy avec fallback
const PROXY_SERVICES = [
    { url: 'https://api.codetabs.com/v1/proxy?quest=', name: 'CodeTabs' },
    { url: 'https://api.allorigins.win/raw?url=', name: 'AllOrigins' },
    { url: 'https://corsproxy.io/?', name: 'CorsProxy' }
];

let currentProxyIndex = 0;

// Configuration du cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Messages d'erreur
const ERROR_MESSAGES = {
    NETWORK: "Connexion impossible. Vérifiez votre connexion internet.",
    NOT_FOUND: "Arrêt introuvable. Vérifiez le numéro.",
    PROXY_DOWN: "Service temporairement indisponible. Réessayez dans quelques minutes.",
    INVALID_DATA: "Données invalides reçues du serveur.",
    ALL_PROXIES_FAILED: "Tous les services de proxy ont échoué. Veuillez réessayer plus tard."
};

/**
 * Fetch avec retry automatique et backoff exponentiel
 */
async function fetchWithRetry(url, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (response.ok) {
                return response;
            }

            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error;

            // Si ce n'est pas la dernière tentative, attendre avant de réessayer
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
                console.log(`Tentative ${attempt + 1} échouée. Nouvelle tentative dans ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Essayer tous les proxies disponibles
 */
async function fetchWithProxyFallback(emtUrl) {
    const proxiesToTry = [...PROXY_SERVICES];
    let lastError;

    // Commencer par le proxy qui a fonctionné la dernière fois
    const prioritizedProxies = [
        proxiesToTry[currentProxyIndex],
        ...proxiesToTry.filter((_, i) => i !== currentProxyIndex)
    ];

    for (let i = 0; i < prioritizedProxies.length; i++) {
        const proxy = prioritizedProxies[i];
        const proxyUrl = proxy.url + encodeURIComponent(emtUrl);

        try {
            console.log(`Tentative avec proxy ${proxy.name}...`);
            const response = await fetchWithRetry(proxyUrl, 2);
            const htmlContent = await response.text();

            if (htmlContent && htmlContent.includes('<table')) {
                // Succès ! Mémoriser ce proxy
                currentProxyIndex = PROXY_SERVICES.findIndex(p => p.name === proxy.name);
                console.log(`Succès avec proxy ${proxy.name}`);
                return htmlContent;
            }
        } catch (error) {
            console.warn(`Proxy ${proxy.name} a échoué:`, error.message);
            lastError = error;
        }
    }

    // Tous les proxies ont échoué
    throw new Error(ERROR_MESSAGES.ALL_PROXIES_FAILED);
}

/**
 * Récupérer les horaires de bus avec cache
 */
async function fetchBusTimes(stopId) {
    // Vérifier le cache d'abord
    const cached = cache.get(stopId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Données récupérées du cache');
        return { ...cached.data, fromCache: true };
    }

    const emtUrl = `https://www.emtmadrid.es/PMVVisor/pmv.aspx?stopnum=${stopId}&size=3`;

    try {
        const htmlContent = await fetchWithProxyFallback(emtUrl);

        if (!htmlContent || !htmlContent.includes('<table')) {
            throw new Error(ERROR_MESSAGES.INVALID_DATA);
        }

        const data = {
            html: htmlContent,
            stopId: stopId,
            timestamp: Date.now()
        };

        // Mettre en cache
        cache.set(stopId, { data, timestamp: Date.now() });

        return data;
    } catch (error) {
        // Si erreur et cache expiré existe, l'utiliser quand même
        if (cached) {
            console.warn('Utilisation du cache expiré en raison d\'une erreur');
            return { ...cached.data, fromCache: true, expired: true };
        }
        throw error;
    }
}

/**
 * Nettoyer le cache
 */
function clearCache() {
    cache.clear();
    console.log('Cache nettoyé');
}

/**
 * Nettoyer les entrées expirées du cache
 */
function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
}

// Nettoyer le cache toutes les 10 minutes
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// Exporter les fonctions
window.API = {
    fetchBusTimes,
    clearCache,
    ERROR_MESSAGES
};
