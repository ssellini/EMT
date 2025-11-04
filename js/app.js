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
        // Utiliser le nouvel input de recherche avec autocomplete
        this.stopInput = document.getElementById('stop-search-input') || document.getElementById('stop-number-input');
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

    // Note: Le gestionnaire du formulaire est maintenant géré par search.js
    // pour supporter l'autocomplete avancé
    // DOM.stopForm.addEventListener('submit', handleFormSubmit);

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

    // Utiliser les filtres si disponibles
    if (window.Filters) {
        window.Filters.setData(busData);
    } else {
        displayBusCards(busData);
    }
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
 * Extraire les minutes depuis une chaîne de temps
 */
function extractMinutes(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Déterminer l'urgence basée sur le temps d'attente
 */
function getUrgency(minutes) {
    if (minutes === null) return 'normal';
    if (minutes <= 2) return 'critical';  // Rouge
    if (minutes <= 5) return 'soon';      // Orange
    if (minutes <= 10) return 'normal';   // Bleu
    return 'later';                        // Gris
}

/**
 * Obtenir les couleurs selon l'urgence
 */
function getUrgencyColors(urgency) {
    const colors = {
        critical: {
            bg: 'bg-gradient-to-br from-red-500 to-red-600',
            text: 'text-red-600 dark:text-red-400',
            badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            border: 'border-red-500 dark:border-red-600',
            icon: '🚨'
        },
        soon: {
            bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
            text: 'text-orange-600 dark:text-orange-400',
            badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            border: 'border-orange-500 dark:border-orange-600',
            icon: '⏰'
        },
        normal: {
            bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            text: 'text-blue-600 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            border: 'border-blue-500 dark:border-blue-600',
            icon: '🚌'
        },
        later: {
            bg: 'bg-gradient-to-br from-slate-500 to-slate-600',
            text: 'text-slate-600 dark:text-slate-400',
            badge: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
            border: 'border-slate-500 dark:border-slate-600',
            icon: '🕐'
        }
    };
    return colors[urgency] || colors.normal;
}

/**
 * Afficher les cartes de bus avec améliorations visuelles
 */
function displayBusCards(busData) {
    DOM.busCards.innerHTML = '';
    let delay = 0;

    Object.entries(busData).forEach(([key, info]) => {
        const card = document.createElement('div');

        // Déterminer l'urgence
        const nextTime = info.times[0];
        const minutes = extractMinutes(nextTime);
        const urgency = getUrgency(minutes);
        const colors = getUrgencyColors(urgency);

        // Calculer la fréquence
        const frequency = info.times.length;
        const frequencyLabel = frequency >= 3 ? 'Fréquent' : frequency === 2 ? 'Modéré' : 'Rare';

        card.className = `card-enter bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-500 border-l-4 ${colors.border}`;
        card.style.animationDelay = `${delay}s`;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Bus ligne ${info.line} vers ${info.destination}`);
        card.setAttribute('data-urgency', urgency);

        card.innerHTML = `
            <div class="p-4 sm:p-6">
                <!-- Header avec ligne et destination -->
                <div class="flex items-start justify-between gap-2 sm:gap-4 mb-4">
                    <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span class="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full ${colors.bg} text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0" aria-hidden="true">
                            ${info.line}
                        </span>
                        <div class="flex-1 min-w-0">
                            <div class="tracking-wide text-[10px] sm:text-xs ${colors.text} font-bold uppercase">
                                Ligne ${info.line}
                            </div>
                            <p class="block mt-0.5 text-sm sm:text-base leading-tight font-semibold text-slate-800 dark:text-slate-100 truncate" title="${info.destination}">
                                ${info.destination}
                            </p>
                        </div>
                    </div>
                    <!-- Badge de fréquence -->
                    ${frequency >= 2 ? `
                        <span class="text-[10px] sm:text-xs px-2 py-1 ${colors.badge} rounded-full font-semibold whitespace-nowrap flex-shrink-0">
                            <span class="hidden sm:inline">${colors.icon} </span>${frequencyLabel}
                        </span>
                    ` : ''}
                </div>

                <!-- Temps principal -->
                <div class="text-center py-3 sm:py-4 mb-3 sm:mb-4 ${colors.badge} rounded-lg">
                    <p class="text-xs sm:text-sm ${colors.text} font-medium mb-1">Prochain passage</p>
                    <p class="text-3xl sm:text-4xl font-bold ${colors.text}" aria-label="${nextTime}">
                        ${nextTime.replace('>', '&gt;')}
                    </p>
                    ${urgency === 'critical' ? `
                        <p class="text-xs ${colors.text} font-semibold mt-1 animate-pulse">
                            Dépêchez-vous !
                        </p>
                    ` : urgency === 'soon' ? `
                        <p class="text-xs ${colors.text} font-medium mt-1">
                            Arrivée imminente
                        </p>
                    ` : ''}
                </div>

                <!-- Timeline des prochains passages -->
                ${info.times.length > 1 ? `
                    <div class="space-y-2">
                        <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">Passages suivants :</p>
                        <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                            ${info.times.slice(0, 4).map((time, idx) => {
                                const mins = extractMinutes(time);
                                const timeUrgency = getUrgency(mins);
                                const timeColors = getUrgencyColors(timeUrgency);

                                return `
                                    <div class="flex flex-col items-center gap-1 min-w-[45px] sm:min-w-[55px]">
                                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full ${timeColors.bg} flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow ${idx === 0 ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ' + timeColors.border.replace('border-', 'ring-') : ''}">
                                            ${time.replace('>', '')}
                                        </div>
                                        ${idx < info.times.length - 1 && idx < 3 ? `
                                            <div class="h-0.5 sm:h-1 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('<div class="text-xs sm:text-sm text-slate-300 dark:text-slate-600">→</div>')}
                            ${info.times.length > 4 ? `
                                <span class="text-xs text-slate-500 dark:text-slate-400 ml-1 sm:ml-2 flex-shrink-0">
                                    +${info.times.length - 4}
                                </span>
                            ` : ''}
                        </div>
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
    stopAutoRefresh,
    displayBusCards // Utilisé par le module Filters
};
