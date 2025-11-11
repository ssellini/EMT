// app.js - Logique principale de l'application

// État de l'application
const AppState = {
    currentStop: null,
    refreshInterval: null,
    isRefreshing: false,
    AUTO_REFRESH_DELAY: 30000 // 30 secondes
};

// Éléments du DOM
const DOM = {
    stopForm: null,
    stopInput: null,
    initialMessage: null,
    loader: null,
    errorMessage: null,
    stopInfo: null,
    busCards: null,
    favoritesContainer: null,
    historyContainer: null,

    init() {
        this.stopForm = document.getElementById('stop-form');
        this.stopInput = document.getElementById('stop-search-input');
        this.initialMessage = document.getElementById('initial-message');
        this.loader = document.getElementById('loader');
        this.errorMessage = document.getElementById('error-message');
        this.stopInfo = document.getElementById('stop-info');
        this.busCards = document.getElementById('bus-cards');
        this.favoritesContainer = document.getElementById('favorites-container');
        this.historyContainer = document.getElementById('history-container');
    }
};

/**
 * Initialisation de l'application
 */
function init() {
    DOM.init();
    window.Utils.setupErrorHandling();
    window.Utils.DarkMode.init();
    window.Favorites.loadFavoritesFromUrl();
    window.Favorites.renderFavorites();
    window.Utils.History.render();
    setupKeyboardShortcuts();
    registerServiceWorker();
    console.log('Application EMT Madrid initialisée');
}

/**
 * Formate le temps d'arrivée en secondes vers une chaîne de caractères.
 */
function formatArrivalTime(seconds) {
    if (seconds < 30) {
        return "En Parada";
    }
    const minutes = Math.round(seconds / 60);
    if (minutes > 20) {
        return "> 20 min";
    }
    return `≈ ${minutes} min`;
}


/**
 * Rechercher un arrêt
 */
async function searchStop(stopId) {
    console.time("Total Search Time");
    stopAutoRefresh();
    DOM.initialMessage.classList.add('hidden');
    DOM.errorMessage.classList.add('hidden');
    DOM.busCards.innerHTML = '';
    DOM.stopInfo.innerHTML = '';
    DOM.loader.classList.remove('hidden');
    AppState.currentStop = null;

    try {
        const data = await window.API.fetchBusTimes(stopId);
        console.time("Data Parsing and Rendering");
        parseAndDisplayData(data, data.fromCache, data.expired);
        console.timeEnd("Data Parsing and Rendering");

        if (AppState.currentStop) {
            window.Utils.History.add(AppState.currentStop);
            window.Utils.History.render();
        }

        startAutoRefresh(stopId);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        showError(error.message || 'Une erreur est survenue');
    } finally {
        DOM.loader.classList.add('hidden');
        console.timeEnd("Total Search Time");
    }
}

/**
 * Parser et afficher les données de l'API
 */
function parseAndDisplayData(data, fromCache = false, expired = false) {
    const { stopId, stopName, arrivals } = data;

    // L'API ne fournit pas l'adresse, nous laissons donc ce champ vide.
    const address = '';
    AppState.currentStop = { id: stopId, name: stopName, address };

    displayStopInfo(stopName, address, stopId, fromCache, expired);

    if (!arrivals || arrivals.length === 0) {
        DOM.busCards.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-center col-span-full">Aucun bus n'est prévu pour cet arrêt prochainement.</p>`;
        return;
    }

    const busData = {};
    arrivals.forEach(arrival => {
        const key = `${arrival.line}-${arrival.destination}`;
        if (!busData[key]) {
            busData[key] = { line: arrival.line, destination: arrival.destination, times: [] };
        }
        busData[key].times.push(formatArrivalTime(arrival.time));
    });

    displayBusCards(busData);
}

/**
 * Afficher les informations de l'arrêt
 */
function displayStopInfo(stopName, address, stopId, fromCache, expired) {
    const isFav = window.Favorites.isFavorite(stopId);
    const lastUpdate = window.Utils.formatTime(Date.now());

    const cacheIndicator = fromCache
        ? `<span class="text-xs ${expired ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'} ml-2">${expired ? '⚠️ Cache expiré' : '💾 Depuis le cache'}</span>`
        : '';

    DOM.stopInfo.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">${stopName}</h2>
                    <p class="text-slate-500 dark:text-slate-400">${address || `Arrêt N° ${stopId}`}</p>
                    <div class="flex items-center gap-2 mt-3 text-xs text-slate-400 dark:text-slate-500">
                        <span class="update-indicator"></span>
                        <span>Dernière mise à jour: ${lastUpdate}</span>
                        ${cacheIndicator}
                    </div>
                </div>
                <div class="flex items-center">
                    <button id="fav-button" onclick="window.App.toggleCurrentFavorite()" class="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20" aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isFav ? 'text-yellow-400' : 'text-slate-400'}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button id="refresh-button" onclick="window.App.refreshCurrentStop()" class="p-2 ml-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-full" aria-label="Rafraîchir">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${AppState.isRefreshing ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Extraire les minutes depuis une chaîne de temps
 */
function extractMinutes(timeStr) {
    if (!timeStr) return null;
    if (timeStr.toLowerCase() === "en parada") return 0;
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Déterminer l'urgence basée sur le temps d'attente
 */
function getUrgency(minutes) {
    if (minutes === null) return 'normal';
    if (minutes <= 2) return 'critical';
    if (minutes <= 5) return 'soon';
    if (minutes <= 10) return 'normal';
    return 'later';
}

/**
 * Obtenir les couleurs selon l'urgence
 */
function getUrgencyColors(urgency) {
    const colors = {
        critical: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30' },
        soon: { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30' },
        normal: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/30' },
        later: { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', badge: 'bg-gray-100 dark:bg-gray-900/30' }
    };
    return colors[urgency] || colors.normal;
}

/**
 * Afficher les cartes de bus
 */
function displayBusCards(busData) {
    DOM.busCards.innerHTML = '';
    Object.values(busData).forEach(info => {
        const nextTime = info.times[0];
        const minutes = extractMinutes(nextTime);
        const urgency = getUrgency(minutes);
        const colors = getUrgencyColors(urgency);

        const card = document.createElement('div');
        card.className = `bg-white dark:bg-slate-800 rounded-lg shadow-md p-4`;
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center">
                    <span class="inline-block w-8 h-8 text-center leading-8 rounded-full ${colors.bg} text-white font-bold">${info.line}</span>
                    <span class="ml-3 font-semibold text-slate-800 dark:text-slate-100">${info.destination}</span>
                </div>
            </div>
            <div class="text-center py-4 rounded-lg ${colors.badge}">
                <p class="text-sm ${colors.text} font-medium mb-1">Prochain passage</p>
                <p class="text-3xl font-bold ${colors.text}">${nextTime}</p>
            </div>
            ${info.times.length > 1 ? `<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">Passages suivants: ${info.times.slice(1).join(', ')}</div>` : ''}
        `;
        DOM.busCards.appendChild(card);
    });
}


/**
 * Afficher un message d'erreur
 */
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.classList.remove('hidden');
}

/**
 * Basculer le favori actuel
 */
function toggleCurrentFavorite() {
    if (!AppState.currentStop) return;
    window.Favorites.toggleFavorite(AppState.currentStop);
    const isFav = window.Favorites.isFavorite(AppState.currentStop.id);
    const button = document.getElementById('fav-button');
    if (button) {
        const svg = button.querySelector('svg');
        svg.classList.toggle('text-yellow-400', isFav);
        svg.classList.toggle('text-slate-400', !isFav);
        svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    }
}

/**
 * Rafraîchir l'arrêt actuel
 */
async function refreshCurrentStop() {
    if (!AppState.currentStop || AppState.isRefreshing) return;
    AppState.isRefreshing = true;
    window.API.clearCache();
    try {
        const data = await window.API.fetchBusTimes(AppState.currentStop.id);
        parseAndDisplayData(data, false);
        window.Utils.showToast('Horaires mis à jour', 'success');
    } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        window.Utils.showToast('Erreur de rafraîchissement', 'error');
    } finally {
        AppState.isRefreshing = false;
        // Mettre à jour l'état du bouton de rafraîchissement si nécessaire
        const refreshBtn = document.getElementById('refresh-button');
        if(refreshBtn) {
            const svg = refreshBtn.querySelector('svg');
            if(svg) svg.classList.remove('animate-spin');
        }
    }
}


/**
 * Démarrer/arrêter le rafraîchissement automatique
 */
function startAutoRefresh(stopId) {
    stopAutoRefresh();
    AppState.refreshInterval = setInterval(() => refreshCurrentStop(), AppState.AUTO_REFRESH_DELAY);
}

function stopAutoRefresh() {
    clearInterval(AppState.refreshInterval);
}

/**
 * Configurer les raccourcis clavier
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            DOM.stopInput.focus();
        }
    });
}

/**
 * Enregistrer le service worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('Service worker enregistré.', reg);
            }).catch(err => {
                console.log('Service Worker: Erreur', err);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', stopAutoRefresh);

window.App = {
    searchStop,
    refreshCurrentStop,
    toggleCurrentFavorite,
    startAutoRefresh,
    stopAutoRefresh,
    displayBusCards
};
