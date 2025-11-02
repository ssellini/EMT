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

// Messages d'erreur détaillés
const ERROR_MESSAGES = {
    NETWORK: "Connexion impossible. Vérifiez votre connexion internet.",
    NOT_FOUND: "Arrêt introuvable. Vérifiez le numéro.",
    PROXY_DOWN: "Service temporairement indisponible. Réessayez dans quelques minutes.",
    INVALID_DATA: "Données invalides reçues du serveur.",
    ALL_PROXIES_FAILED: "Tous les services de proxy ont échoué. Veuillez réessayer plus tard.",
    TIMEOUT: "La requête a pris trop de temps. Réessayez.",
    BAD_REQUEST: "Numéro d'arrêt invalide. Utilisez un numéro à 4 ou 5 chiffres.",
    TOO_MANY_REQUESTS: "Trop de requêtes. Veuillez patienter 30 secondes.",
    SERVER_ERROR: "Erreur du serveur EMT. Réessayez dans quelques minutes.",
    CORS_ERROR: "Erreur de connexion au serveur (CORS). Essai d'un autre proxy...",
    OFFLINE: "Vous êtes hors ligne. Vérifiez votre connexion."
};

// Codes HTTP et leurs messages
const HTTP_STATUS_MESSAGES = {
    400: ERROR_MESSAGES.BAD_REQUEST,
    404: ERROR_MESSAGES.NOT_FOUND,
    429: ERROR_MESSAGES.TOO_MANY_REQUESTS,
    500: ERROR_MESSAGES.SERVER_ERROR,
    502: ERROR_MESSAGES.SERVER_ERROR,
    503: ERROR_MESSAGES.PROXY_DOWN,
    504: ERROR_MESSAGES.TIMEOUT
};

/**
 * Fetch avec retry automatique et backoff exponentiel
 */
async function fetchWithRetry(url, maxRetries = 3) {
    let lastError;

    // Vérifier si l'utilisateur est en ligne
    if (!navigator.onLine) {
        throw new Error(ERROR_MESSAGES.OFFLINE);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
            });

            if (response.ok) {
                return response;
            }

            // Gérer les codes HTTP spécifiques
            const statusMessage = HTTP_STATUS_MESSAGES[response.status];
            if (statusMessage) {
                lastError = new Error(statusMessage);
            } else {
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Ne pas réessayer pour certaines erreurs (400, 404)
            if (response.status === 400 || response.status === 404) {
                throw lastError;
            }

        } catch (error) {
            // Gérer les différents types d'erreur
            if (error.name === 'AbortError') {
                lastError = new Error(ERROR_MESSAGES.TIMEOUT);
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                lastError = new Error(ERROR_MESSAGES.CORS_ERROR);
            } else if (!navigator.onLine) {
                lastError = new Error(ERROR_MESSAGES.OFFLINE);
                throw lastError; // Pas de retry si hors ligne
            } else {
                lastError = error;
            }

            // Si ce n'est pas la dernière tentative, attendre avant de réessayer
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
                console.log(`Tentative ${attempt + 1}/${maxRetries} échouée. Nouvelle tentative dans ${delay}ms...`);
                console.log(`Erreur: ${lastError.message}`);
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
 * Valider le numéro d'arrêt
 */
function validateStopId(stopId) {
    if (!stopId) {
        throw new Error('Veuillez entrer un numéro d\'arrêt.');
    }

    const stopNumber = parseInt(stopId, 10);

    if (isNaN(stopNumber)) {
        throw new Error('Le numéro d\'arrêt doit être un nombre.');
    }

    if (stopNumber < 1 || stopNumber > 99999) {
        throw new Error('Le numéro d\'arrêt doit être entre 1 et 99999.');
    }

    return stopNumber.toString();
}

/**
 * Récupérer les horaires de bus avec cache
 */
async function fetchBusTimes(stopId) {
    // Valider l'ID de l'arrêt
    try {
        stopId = validateStopId(stopId);
    } catch (validationError) {
        throw validationError;
    }

    // Vérifier le cache d'abord
    const cached = cache.get(stopId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Données récupérées du cache pour l'arrêt ${stopId}`);
        return { ...cached.data, fromCache: true };
    }

    const emtUrl = `https://www.emtmadrid.es/PMVVisor/pmv.aspx?stopnum=${stopId}&size=3`;

    try {
        const htmlContent = await fetchWithProxyFallback(emtUrl);

        if (!htmlContent || !htmlContent.includes('<table')) {
            // Vérifier si la page indique que l'arrêt n'existe pas
            if (htmlContent && (htmlContent.includes('no existe') || htmlContent.includes('not found'))) {
                throw new Error(ERROR_MESSAGES.NOT_FOUND);
            }
            throw new Error(ERROR_MESSAGES.INVALID_DATA);
        }

        const data = {
            html: htmlContent,
            stopId: stopId,
            timestamp: Date.now()
        };

        // Mettre en cache
        cache.set(stopId, { data, timestamp: Date.now() });
        console.log(`✅ Données mises en cache pour l'arrêt ${stopId}`);

        return data;
    } catch (error) {
        // Si erreur et cache expiré existe, l'utiliser quand même
        if (cached) {
            console.warn(`⚠️ Utilisation du cache expiré pour l'arrêt ${stopId} en raison d'une erreur`);
            return { ...cached.data, fromCache: true, expired: true };
        }

        // Enrichir le message d'erreur avec le numéro d'arrêt
        if (!error.message.includes(stopId)) {
            error.message = `Arrêt ${stopId}: ${error.message}`;
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
