// utils.js - Fonctions utilitaires

/**
 * Afficher un message toast
 */
function showToast(message, type = 'info') {
    // Retirer les toasts existants
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const colors = {
        success: 'bg-green-600 dark:bg-green-700',
        error: 'bg-red-600 dark:bg-red-700',
        info: 'bg-blue-600 dark:bg-blue-700',
        warning: 'bg-yellow-600 dark:bg-yellow-700'
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.className = `toast ${colors[type] || colors.info}`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xl">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Retirer après 3 secondes
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Gérer l'historique des recherches
 */
const History = {
    MAX_ITEMS: 5,

    get() {
        try {
            return JSON.parse(localStorage.getItem('emtHistory')) || [];
        } catch {
            return [];
        }
    },

    add(stop) {
        if (!stop || !stop.id) return;

        const history = this.get();

        // Retirer si déjà présent
        const filtered = history.filter(item => item.id !== stop.id);

        // Ajouter au début
        filtered.unshift({
            id: stop.id,
            name: stop.name,
            address: stop.address || '',
            timestamp: Date.now()
        });

        // Garder seulement les N derniers
        const limited = filtered.slice(0, this.MAX_ITEMS);

        try {
            localStorage.setItem('emtHistory', JSON.stringify(limited));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    },

    clear() {
        localStorage.removeItem('emtHistory');
        showToast('Historique effacé', 'success');
    },

    render() {
        const history = this.get();
        const container = document.getElementById('history-container');
        if (!container || history.length === 0) return;

        let html = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold text-slate-600 dark:text-slate-300">
                        Recherches récentes
                    </h3>
                    <button
                        onclick="window.Utils.History.clear(); window.Utils.History.render();"
                        class="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        aria-label="Effacer l'historique">
                        Effacer
                    </button>
                </div>
                <div class="flex flex-wrap gap-2">
        `;

        history.forEach(item => {
            html += `
                <button
                    onclick="window.App.searchStop('${item.id}')"
                    class="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="${item.name}"
                    aria-label="Rechercher l'arrêt ${item.id}">
                    ${item.id}
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
};

/**
 * Gestion du mode sombre
 */
const DarkMode = {
    init() {
        // Charger la préférence sauvegardée ou utiliser la préférence système
        const saved = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (saved === 'true' || (saved === null && prefersDark)) {
            this.enable();
        }

        // Écouter les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                e.matches ? this.enable() : this.disable();
            }
        });
    },

    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        isDark ? this.disable() : this.enable();
    },

    enable() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
        this.updateButton();
    },

    disable() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
        this.updateButton();
    },

    updateButton() {
        const button = document.getElementById('dark-mode-toggle');
        if (!button) return;

        const isDark = document.documentElement.classList.contains('dark');
        button.innerHTML = isDark ? '☀️' : '🌙';
        button.setAttribute('aria-label', isDark ? 'Activer le mode clair' : 'Activer le mode sombre');
    }
};

/**
 * Géolocalisation pour trouver les arrêts proches
 */
const Geolocation = {
    async getCurrentPosition() {
        if (!navigator.geolocation) {
            throw new Error('La géolocalisation n\'est pas supportée par votre navigateur');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => {
                    let message = 'Erreur de géolocalisation';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Permission de géolocalisation refusée';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Position indisponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Délai de géolocalisation dépassé';
                            break;
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    },

    async findNearbyStops() {
        try {
            showToast('Recherche de votre position...', 'info');
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            // Note: L'API EMT ne fournit pas de service de recherche par géolocalisation public
            // Cette fonctionnalité nécessiterait une API backend ou un service tiers
            showToast('Fonctionnalité de recherche d\'arrêts proches en développement', 'info');

            console.log('Position:', latitude, longitude);
            // TODO: Implémenter la recherche d'arrêts proches
        } catch (error) {
            console.error('Erreur de géolocalisation:', error);
            showToast(error.message, 'error');
        }
    }
};

/**
 * Gestion des notifications push
 */
const Notifications = {
    async requestPermission() {
        if (!('Notification' in window)) {
            showToast('Les notifications ne sont pas supportées par votre navigateur', 'error');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    async show(title, options = {}) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        const notification = new Notification(title, {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            ...options
        });

        return notification;
    },

    async notifyBusArrival(line, destination, time) {
        await this.show(`Bus ${line} arrive`, {
            body: `Direction: ${destination}\nArrivée dans: ${time}`,
            tag: `bus-${line}`,
            requireInteraction: false
        });
    }
};

/**
 * Formatage de la date/heure
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Gestion des erreurs globales
 */
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('Erreur globale:', event.error);
        showToast('Une erreur est survenue', 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promesse rejetée non gérée:', event.reason);
        showToast('Une erreur est survenue lors du chargement', 'error');
    });
}

// Exporter les fonctions
window.Utils = {
    showToast,
    History,
    DarkMode,
    Geolocation,
    Notifications,
    formatTime,
    formatDate,
    debounce,
    setupErrorHandling
};
