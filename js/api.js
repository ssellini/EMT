// js/api.js - Gestion des appels à l'API EMT Madrid avec fallback de web scraping

const API_BASE_URL = 'https://openapi.emtmadrid.es/v2/';
const LOGIN_ENDPOINT = 'user/login/';
const ARRIVALS_ENDPOINT = (stopId) => `transport/busemtmad/stops/${stopId}/arrives/`;

// Configuration du cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Stockage du token
let apiToken = null;
let tokenExpiration = null;

// Services proxy pour le fallback
const PROXY_SERVICES = [
    { url: 'https://api.codetabs.com/v1/proxy?quest=', name: 'CodeTabs' },
    { url: 'https://api.allorigins.win/raw?url=', name: 'AllOrigins' },
    { url: 'https://corsproxy.io/?', name: 'CorsProxy' }
];
let currentProxyIndex = 0;


// Messages d'erreur
const ERROR_MESSAGES = {
    NETWORK: "Connexion impossible. Vérifiez votre connexion internet.",
    NOT_FOUND: "Arrêt introuvable. Vérifiez le numéro.",
    INVALID_DATA: "Données invalides reçues de l'API.",
    AUTHENTICATION_FAILED: "Échec de l'authentification auprès de l'API EMT.",
    API_ERROR: "Erreur de l'API EMT. Veuillez réessayer plus tard.",
    TIMEOUT: "La requête a pris trop de temps. Réessayez.",
    OFFLINE: "Vous êtes hors ligne. Vérifiez votre connexion.",
    ALL_PROXIES_FAILED: "Tous les services de proxy ont échoué. Veuillez réessayer plus tard.",
};

/**
 * Fonction de login pour obtenir un token
 */
async function login() {
    console.log("Tentative de connexion à l'API EMT...");
    const url = API_BASE_URL + LOGIN_ENDPOINT;

    try {
        const response = await fetch(url, {
            method: 'GET', // La documentation indique GET pour le login
            headers: {
                'X-ClientId': EMT_CONFIG.xClientId,
                'passKey': EMT_CONFIG.passKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code === '00' && data.data.length > 0) {
            apiToken = data.data[0].accessToken;
            // Le token expire en `tokenSecsLife` secondes
            const tokenLifetime = data.data[0].tokenSecsLife * 1000;
            tokenExpiration = Date.now() + tokenLifetime;
            console.log("✅ Connexion réussie, token obtenu.");
            return apiToken;
        } else {
            throw new Error(data.description || ERROR_MESSAGES.AUTHENTICATION_FAILED);
        }
    } catch (error) {
        console.error("Erreur de connexion:", error);
        throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED);
    }
}

/**
 * Vérifier si le token est valide et en obtenir un nouveau si besoin
 */
async function getValidToken() {
    if (apiToken && tokenExpiration && Date.now() < tokenExpiration - 60000) { // Marge de 1 minute
        return apiToken;
    }
    return await login();
}

/**
 * Fetch avec retry
 */
async function fetchWithRetry(url, options, maxRetries = 2) {
    let lastError;

    if (!navigator.onLine) {
        throw new Error(ERROR_MESSAGES.OFFLINE);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });

            if (response.ok) {
                return response;
            }

            if (response.status === 401) { // Non autorisé, le token a peut-être expiré
                console.warn("Token non autorisé (401). Tentative de re-connexion...");
                apiToken = null; // Forcer le re-login
                throw new Error("Token expired");
            }

            if (response.status === 404) {
                 throw new Error(ERROR_MESSAGES.NOT_FOUND);
            }

            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
            if (error.name === 'AbortError') {
                 lastError = new Error(ERROR_MESSAGES.TIMEOUT);
            }

            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

/**
 * Essayer tous les proxies disponibles (pour le scraping)
 */
async function fetchWithProxyFallback(emtUrl) {
    const proxiesToTry = [...PROXY_SERVICES];
    let lastError;

    const prioritizedProxies = [
        proxiesToTry[currentProxyIndex],
        ...proxiesToTry.filter((_, i) => i !== currentProxyIndex)
    ];

    for (let i = 0; i < prioritizedProxies.length; i++) {
        const proxy = prioritizedProxies[i];
        const proxyUrl = proxy.url + encodeURIComponent(emtUrl);

        try {
            const response = await fetchWithRetry(proxyUrl, {}, 2);
            const htmlContent = await response.text();
            if (htmlContent && htmlContent.includes('<table')) {
                currentProxyIndex = PROXY_SERVICES.findIndex(p => p.name === proxy.name);
                return htmlContent;
            }
        } catch (error) {
            console.warn(`Proxy ${proxy.name} a échoué:`, error.message);
            lastError = error;
        }
    }

    throw new Error(ERROR_MESSAGES.ALL_PROXIES_FAILED);
}

/**
 * Parser les données HTML du scraping en format JSON
 */
function parseScrapedData(html, stopId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    let stopName = `Arrêt ${stopId}`;
    const headerElement = doc.querySelector('b');
    if (headerElement) {
        stopName = headerElement.textContent.replace('Parada:', '').trim();
    }

    const arrivals = [];
    if (table) {
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length < 3) continue;

            const timeStr = cells[2].textContent.trim();
            let seconds = 99 * 60; // Default to a high value
            if (timeStr.toLowerCase().includes('en parada')) {
                seconds = 15;
            } else {
                const minutesMatch = timeStr.match(/(\d+)/);
                if (minutesMatch) {
                    seconds = parseInt(minutesMatch[1], 10) * 60;
                }
            }

            arrivals.push({
                line: cells[0].textContent.trim(),
                destination: cells[1].textContent.trim(),
                time: seconds,
            });
        }
    }

    return {
        stopId: stopId,
        stopName: stopName,
        arrivals: arrivals,
        timestamp: Date.now()
    };
}


/**
 * Récupérer les horaires de bus via le web scraping (fallback)
 */
async function fetchBusTimesWithScraping(stopId) {
    console.warn(`API échouée, tentative avec le web scraping pour l'arrêt ${stopId}...`);
    const emtUrl = `https://www.emtmadrid.es/PMVVisor/pmv.aspx?stopnum=${stopId}&size=3`;
    const htmlContent = await fetchWithProxyFallback(emtUrl);

    if (!htmlContent || !htmlContent.includes('<table')) {
        if (htmlContent && (htmlContent.includes('no existe') || htmlContent.includes('not found'))) {
            throw new Error(ERROR_MESSAGES.NOT_FOUND);
        }
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return parseScrapedData(htmlContent, stopId);
}


/**
 * Récupérer les horaires de bus via l'API (méthode principale)
 */
async function fetchBusTimesWithApi(stopId) {
    const token = await getValidToken();
    const url = API_BASE_URL + ARRIVALS_ENDPOINT(stopId);

    const requestBody = {
        "cultureInfo": "ES",
        "Text_StopRequired_YN": "Y",
        "Text_EstimationsRequired_YN": "Y",
        "Text_IncidencesRequired_YN": "Y",
        "DateTime_Referenced_Incidencies_YYYYMMDD": ""
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'accessToken': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.code === '00' && data.data.length > 0 && data.data[0].Arrive) {
        return parseApiResponse(data, stopId);
    } else if (data.code === '80' && data.description.includes("No existen datos")) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
    } else {
        throw new Error(data.description || ERROR_MESSAGES.INVALID_DATA);
    }
}


/**
 * Récupérer les horaires de bus (contrôleur principal avec fallback)
 */
async function fetchBusTimes(stopId) {
    try {
        stopId = validateStopId(stopId);
    } catch (validationError) {
        throw validationError;
    }

    const cached = cache.get(stopId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Données récupérées du cache pour l'arrêt ${stopId}`);
        return { ...cached.data, fromCache: true };
    }

    try {
        const data = await fetchBusTimesWithApi(stopId);
        cache.set(stopId, { data, timestamp: Date.now() });
        console.log(`✅ Données API mises en cache pour l'arrêt ${stopId}`);
        return data;
    } catch (error) {
        console.error(`Erreur API pour l'arrêt ${stopId}:`, error.message);

        try {
            const data = await fetchBusTimesWithScraping(stopId);
            cache.set(stopId, { data, timestamp: Date.now() });
            console.log(`✅ Données SCRAPING mises en cache pour l'arrêt ${stopId}`);
            return { ...data, fromScraping: true };
        } catch (scrapingError) {
             console.error(`Erreur SCRAPING pour l'arrêt ${stopId}:`, scrapingError.message);
             if (cached) {
                console.warn(`⚠️ Utilisation du cache expiré pour l'arrêt ${stopId}`);
                return { ...cached.data, fromCache: true, expired: true };
            }
            throw new Error(`Arrêt ${stopId}: ${scrapingError.message}`);
        }
    }
}


/**
 * Parser la réponse de l'API dans un format unifié
 */
function parseApiResponse(apiResponse, stopId) {
    const stopInfo = apiResponse.data[0].StopInfo[0];
    const arrivals = apiResponse.data[0].Arrive;

    return {
        stopId: stopId,
        stopName: stopInfo ? stopInfo.StopInfo : 'Nom inconnu',
        arrivals: arrivals.map(arr => ({
            line: arr.line,
            destination: arr.destination,
            time: arr.estimateArrive,
            isHead: arr.isHead
        })),
        timestamp: Date.now()
    };
}


/**
 * Valider le numéro d'arrêt
 */
function validateStopId(stopId) {
    if (!stopId) {
        throw new Error('Veuillez entrer un numéro d\'arrêt.');
    }
    const stopNumber = parseInt(stopId, 10);
    if (isNaN(stopNumber) || stopNumber < 1 || stopNumber > 99999) {
        throw new Error('Le numéro d\'arrêt doit être un nombre entre 1 et 99999.');
    }
    return stopNumber.toString();
}


function clearCache() {
    cache.clear();
    console.log('Cache nettoyé');
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
}, 10 * 60 * 1000);


window.API = {
    fetchBusTimes,
    clearCache,
    ERROR_MESSAGES
};
