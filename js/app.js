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
        this.stopInput = document.getElementById('stop-number-input');
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

    // Charger les favoris depuis l'URL si présents
    window.Favorites.loadFavoritesFromUrl();

    // Afficher les favoris et l'historique
    window.Favorites.renderFavorites();
    window.Utils.History.render();

    // Gestionnaire du formulaire
    DOM.stopForm.addEventListener('submit', handleFormSubmit);

    // Raccourcis clavier
    setupKeyboardShortcuts();

    // Enregistrer le service worker pour PWA
    registerServiceWorker();

    console.log('Application EMT Madrid initialisée');
}

/**
 * Gestionnaire de soumission du formulaire
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const stopId = DOM.stopInput.value.trim();
    if (stopId) {
        searchStop(stopId);
    }
}

/**
 * Rechercher un arrêt
 */
async function searchStop(stopId) {
    // Arrêter le rafraîchissement automatique précédent
    stopAutoRefresh();

    // Réinitialiser l'interface
    DOM.initialMessage.classList.add('hidden');
    DOM.errorMessage.classList.add('hidden');
    DOM.busCards.innerHTML = '';
    DOM.stopInfo.innerHTML = '';
    DOM.loader.classList.remove('hidden');
    AppState.currentStop = null;

    try {
        const data = await window.API.fetchBusTimes(stopId);
        parseAndDisplayData(data.html, stopId, data.fromCache, data.expired);

        // Ajouter à l'historique
        if (AppState.currentStop) {
            window.Utils.History.add(AppState.currentStop);
            window.Utils.History.render();
        }

        // Démarrer le rafraîchissement automatique
        startAutoRefresh(stopId);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        showError(error.message || 'Une erreur est survenue');
    } finally {
        DOM.loader.classList.add('hidden');
    }
}

/**
 * Parser et afficher les données
 */
function parseAndDisplayData(html, stopId, fromCache = false, expired = false) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (!table) {
        showError(`Aucun horaire n'est disponible pour l'arrêt ${stopId}.`);
        return;
    }

    // Extraire le nom de l'arrêt
    let stopName = `Arrêt ${stopId}`;
    const headerElement = doc.querySelector('b');
    if (headerElement) {
        stopName = headerElement.textContent.replace('Parada:', '').trim();
    }

    // Extraire l'adresse
    let address = '';
    const potentialAddressNode = doc.body.querySelector('b')?.nextSibling;
    if (potentialAddressNode && potentialAddressNode.nodeType === Node.TEXT_NODE) {
        address = potentialAddressNode.textContent.trim();
    }

    AppState.currentStop = { id: stopId, name: stopName, address };

    // Afficher les informations de l'arrêt
    displayStopInfo(stopName, address, stopId, fromCache, expired);

    // Parser les horaires
    const rows = table.querySelectorAll('tr');
    if (rows.length <= 1) {
        DOM.busCards.innerHTML = `
            <p class="text-slate-500 dark:text-slate-400 text-center col-span-full">
                Aucun bus n'est prévu pour cet arrêt prochainement.
            </p>
        `;
        return;
    }

    const busData = {};
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length < 3) continue;

        const line = cells[0].textContent.trim();
        const destination = cells[1].textContent.trim();
        const time = cells[2].textContent.trim();
        const key = `${line}-${destination}`;

        if (!busData[key]) {
            busData[key] = { line, destination, times: [] };
        }
        busData[key].times.push(time);
    }

    displayBusCards(busData);
}

/**
 * Afficher les informations de l'arrêt
 */
function displayStopInfo(stopName, address, stopId, fromCache, expired) {
    const isFav = window.Favorites.isFavorite(stopId);
    const lastUpdate = window.Utils.formatTime(Date.now());

    const cacheIndicator = fromCache
        ? `<span class="text-xs ${expired ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'} ml-2">
               ${expired ? '⚠️ Cache expiré' : '💾 Depuis le cache'}
           </span>`
        : '';

    DOM.stopInfo.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            ${stopName}
                        </h2>
                        <button
                            id="fav-button"
                            onclick="window.App.toggleCurrentFavorite()"
                            class="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                            title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isFav ? 'text-yellow-400' : 'text-slate-400'}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400">${address}</p>
                    <div class="flex items-center gap-2 mt-3 text-xs text-slate-400 dark:text-slate-500">
                        <span class="update-indicator"></span>
                        <span>Dernière mise à jour: ${lastUpdate}</span>
                        ${cacheIndicator}
                    </div>
                </div>
                <button
                    onclick="window.App.refreshCurrentStop()"
                    class="refresh-btn p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Rafraîchir les horaires"
                    title="Rafraîchir les horaires"
                    ${AppState.isRefreshing ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${AppState.isRefreshing ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>
    `;
}

/**
 * Afficher les cartes de bus
 */
function displayBusCards(busData) {
    DOM.busCards.innerHTML = '';
    let delay = 0;

    Object.entries(busData).forEach(([key, info]) => {
        const card = document.createElement('div');
        card.className = 'card-enter bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500';
        card.style.animationDelay = `${delay}s`;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Bus ligne ${info.line} vers ${info.destination}`);

        const nextTime = info.times[0];
        const otherTimes = info.times.slice(1).join(', ');

        card.innerHTML = `
            <div class="p-6">
                <div class="flex items-center gap-4">
                    <span class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-bold text-xl" aria-hidden="true">
                        ${info.line}
                    </span>
                    <div class="flex-1 min-w-0">
                        <div class="tracking-wide text-sm text-blue-600 dark:text-blue-400 font-bold">
                            Ligne ${info.line}
                        </div>
                        <p class="block mt-1 text-lg leading-tight font-semibold text-black dark:text-white truncate" title="${info.destination}">
                            ${info.destination}
                        </p>
                    </div>
                </div>
                <div class="mt-6 text-center">
                    <p class="text-slate-500 dark:text-slate-400 text-sm">Prochain passage dans</p>
                    <p class="text-5xl font-bold text-slate-800 dark:text-slate-100 mt-2" aria-label="${nextTime}">
                        ${nextTime.replace('>', '&gt;')}
                    </p>
                </div>
                ${otherTimes ? `
                    <div class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        <span>Suivants: ${otherTimes}</span>
                    </div>
                ` : ''}
            </div>
        `;

        DOM.busCards.appendChild(card);
        delay += 0.05;
    });
}

/**
 * Afficher un message d'erreur
 */
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.classList.remove('hidden');
    DOM.errorMessage.setAttribute('role', 'alert');
}

/**
 * Basculer le favori actuel
 */
function toggleCurrentFavorite() {
    if (!AppState.currentStop) return;

    window.Favorites.toggleFavorite(AppState.currentStop);

    // Mettre à jour le bouton
    const isFav = window.Favorites.isFavorite(AppState.currentStop.id);
    const button = document.getElementById('fav-button');
    if (button) {
        const svg = button.querySelector('svg');
        svg.classList.toggle('text-yellow-400', isFav);
        svg.classList.toggle('text-slate-400', !isFav);
        svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
        button.setAttribute('aria-label', isFav ? 'Retirer des favoris' : 'Ajouter aux favoris');
        button.setAttribute('title', isFav ? 'Retirer des favoris' : 'Ajouter aux favoris');
    }
}

/**
 * Rafraîchir l'arrêt actuel
 */
async function refreshCurrentStop() {
    if (!AppState.currentStop || AppState.isRefreshing) return;

    AppState.isRefreshing = true;
    const stopId = AppState.currentStop.id;

    try {
        // Forcer un nouveau fetch (vider le cache pour cet arrêt)
        window.API.clearCache();

        const data = await window.API.fetchBusTimes(stopId);
        parseAndDisplayData(data.html, stopId, false);

        window.Utils.showToast('Horaires mis à jour', 'success');
    } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        window.Utils.showToast('Erreur lors du rafraîchissement', 'error');
    } finally {
        AppState.isRefreshing = false;
    }
}

/**
 * Démarrer le rafraîchissement automatique
 */
function startAutoRefresh(stopId) {
    stopAutoRefresh(); // Arrêter l'ancien interval

    AppState.refreshInterval = setInterval(() => {
        if (AppState.currentStop && AppState.currentStop.id === stopId) {
            console.log('Rafraîchissement automatique...');
            refreshCurrentStop();
        }
    }, AppState.AUTO_REFRESH_DELAY);
}

/**
 * Arrêter le rafraîchissement automatique
 */
function stopAutoRefresh() {
    if (AppState.refreshInterval) {
        clearInterval(AppState.refreshInterval);
        AppState.refreshInterval = null;
    }
}

/**
 * Configurer les raccourcis clavier
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K : Focus sur la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            DOM.stopInput.focus();
            DOM.stopInput.select();
        }

        // Ctrl/Cmd + D : Basculer le mode sombre
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            window.Utils.DarkMode.toggle();
        }

        // Ctrl/Cmd + R : Rafraîchir (si un arrêt est affiché)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && AppState.currentStop) {
            e.preventDefault();
            refreshCurrentStop();
        }
    });
}

/**
 * Enregistrer le service worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker enregistré:', registration);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        }
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', init);

// Arrêter le rafraîchissement quand on quitte la page
window.addEventListener('beforeunload', stopAutoRefresh);

// Exporter les fonctions publiques
window.App = {
    searchStop,
    refreshCurrentStop,
    toggleCurrentFavorite,
    startAutoRefresh,
    stopAutoRefresh
};
