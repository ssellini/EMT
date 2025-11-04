// search.js - Module de recherche et autocomplete

/**
 * Module de recherche d'arrêts avec autocomplete
 */
const SearchModule = {
    stops: [],
    selectedIndex: -1,
    isDropdownOpen: false,

    /**
     * Initialiser le module de recherche
     */
    async init() {
        // Charger les arrêts
        await this.loadStops();

        // Initialiser les éléments DOM
        this.searchInput = document.getElementById('stop-search-input');
        this.datalist = document.getElementById('stops-suggestions');
        this.dropdown = document.getElementById('suggestions-dropdown');
        this.form = document.getElementById('stop-form');

        if (!this.searchInput) {
            console.error('Élément de recherche non trouvé');
            return;
        }

        // Peupler la datalist HTML5 de base
        this.populateDatalist();

        // Événements
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('focus', (e) => this.handleFocus(e));
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Fermer dropdown en cliquant dehors
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        // Modifier le gestionnaire de soumission du formulaire
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        console.log('✅ Module de recherche initialisé avec', this.stops.length, 'arrêts');
    },

    /**
     * Charger les arrêts depuis le fichier JSON
     */
    async loadStops() {
        try {
            const response = await fetch('./data/stops.json');
            if (!response.ok) {
                throw new Error('Impossible de charger stops.json');
            }

            const data = await response.json();
            this.stops = data.stops || [];

            console.log(`✅ ${this.stops.length} arrêts chargés pour l'autocomplete`);
        } catch (error) {
            console.error('Erreur lors du chargement des arrêts:', error);
            this.stops = [];
        }
    },

    /**
     * Peupler la datalist HTML5 (fallback basique)
     */
    populateDatalist() {
        if (!this.datalist) return;

        this.datalist.innerHTML = this.stops.map(stop => `
            <option value="${stop.id}">
                ${stop.name} - ${stop.address}
            </option>
        `).join('');
    },

    /**
     * Gérer la saisie de l'utilisateur
     */
    handleInput(e) {
        const query = e.target.value.trim();

        if (query.length < 2) {
            this.hideDropdown();
            return;
        }

        const results = this.searchStops(query);
        this.showSuggestions(results, query);
    },

    /**
     * Gérer le focus sur le champ
     */
    handleFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            const results = this.searchStops(query);
            this.showSuggestions(results, query);
        }
    },

    /**
     * Rechercher des arrêts selon une requête
     */
    searchStops(query) {
        if (!query || query.length < 2) return [];

        const lowerQuery = query.toLowerCase();

        // Recherche dans : ID, nom, adresse
        const matches = this.stops.filter(stop => {
            const matchId = stop.id.toString().includes(query);
            const matchName = stop.name.toLowerCase().includes(lowerQuery);
            const matchAddress = stop.address && stop.address.toLowerCase().includes(lowerQuery);

            return matchId || matchName || matchAddress;
        });

        // Trier par pertinence
        return matches.sort((a, b) => {
            // Priorité 1: ID exact
            if (a.id === query) return -1;
            if (b.id === query) return 1;

            // Priorité 2: ID commence par la requête
            const aIdStarts = a.id.toString().startsWith(query);
            const bIdStarts = b.id.toString().startsWith(query);
            if (aIdStarts && !bIdStarts) return -1;
            if (!aIdStarts && bIdStarts) return 1;

            // Priorité 3: Nom commence par la requête
            const aNameStarts = a.name.toLowerCase().startsWith(lowerQuery);
            const bNameStarts = b.name.toLowerCase().startsWith(lowerQuery);
            if (aNameStarts && !bNameStarts) return -1;
            if (!aNameStarts && bNameStarts) return 1;

            // Par défaut: ordre alphabétique
            return a.name.localeCompare(b.name);
        }).slice(0, 5); // Limiter à 5 résultats
    },

    /**
     * Afficher les suggestions dans le dropdown custom
     */
    showSuggestions(results, query) {
        if (results.length === 0) {
            this.dropdown.innerHTML = `
                <div class="p-4 text-center text-slate-500 dark:text-slate-400">
                    <p class="text-sm">Aucun arrêt trouvé pour "${query}"</p>
                    <p class="text-xs mt-1">Essayez un autre nom ou numéro</p>
                </div>
            `;
            this.dropdown.classList.remove('hidden');
            this.isDropdownOpen = true;
            return;
        }

        this.dropdown.innerHTML = results.map((stop, index) => {
            const isFavorite = window.Favorites && window.Favorites.isFavorite(stop.id);
            const highlighted = this.highlightMatch(stop.name, query);

            return `
                <button
                    type="button"
                    class="suggestion-item w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3 ${index === this.selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
                    data-stop-id="${stop.id}"
                    data-index="${index}"
                    onclick="window.Search.selectStop('${stop.id}')"
                    role="option"
                    aria-selected="${index === this.selectedIndex}">
                    <span class="text-2xl flex-shrink-0">📍</span>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            ${highlighted}
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                            ${stop.address} • ${stop.id}
                        </div>
                        ${stop.lines && stop.lines.length > 0 ? `
                            <div class="flex gap-1 mt-1 flex-wrap">
                                ${stop.lines.slice(0, 4).map(line => `
                                    <span class="inline-block px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        ${line}
                                    </span>
                                `).join('')}
                                ${stop.lines.length > 4 ? `
                                    <span class="inline-block px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        +${stop.lines.length - 4}
                                    </span>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    ${isFavorite ? '<span class="text-yellow-400 text-xl">⭐</span>' : ''}
                </button>
            `;
        }).join('');

        this.dropdown.classList.remove('hidden');
        this.isDropdownOpen = true;
        this.selectedIndex = -1;
    },

    /**
     * Surligner les correspondances dans le texte
     */
    highlightMatch(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50">$1</mark>');
    },

    /**
     * Échapper les caractères spéciaux pour regex
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Masquer le dropdown
     */
    hideDropdown() {
        this.dropdown.classList.add('hidden');
        this.isDropdownOpen = false;
        this.selectedIndex = -1;
    },

    /**
     * Gérer les touches clavier
     */
    handleKeyDown(e) {
        if (!this.isDropdownOpen) return;

        const suggestions = this.dropdown.querySelectorAll('.suggestion-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
                this.updateSelection(suggestions);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(suggestions);
                break;

            case 'Enter':
                if (this.selectedIndex >= 0 && suggestions[this.selectedIndex]) {
                    e.preventDefault();
                    const stopId = suggestions[this.selectedIndex].dataset.stopId;
                    this.selectStop(stopId);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hideDropdown();
                break;
        }
    },

    /**
     * Mettre à jour la sélection visuelle
     */
    updateSelection(suggestions) {
        suggestions.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
                item.setAttribute('aria-selected', 'true');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                item.setAttribute('aria-selected', 'false');
            }
        });
    },

    /**
     * Sélectionner un arrêt
     */
    selectStop(stopId) {
        const stop = this.stops.find(s => s.id === stopId);

        if (stop) {
            // Mettre à jour l'input avec le nom complet
            this.searchInput.value = `${stop.name} (${stop.id})`;
            this.hideDropdown();

            // Lancer la recherche
            if (window.App && window.App.searchStop) {
                window.App.searchStop(stopId);
            }
        }
    },

    /**
     * Gérer la soumission du formulaire
     */
    handleFormSubmit(e) {
        e.preventDefault();

        const value = this.searchInput.value.trim();
        if (!value) return;

        // Extraire l'ID
        let stopId = this.extractStopId(value);

        if (stopId && window.App && window.App.searchStop) {
            window.App.searchStop(stopId);
        } else {
            window.Utils.showToast('Arrêt introuvable. Vérifiez le numéro ou le nom.', 'error');
        }
    },

    /**
     * Extraire l'ID de l'arrêt depuis la valeur
     */
    extractStopId(value) {
        // Cas 1: Numéro pur (ex: "5998")
        if (/^\d+$/.test(value)) {
            return value;
        }

        // Cas 2: Format "Nom (ID)" (ex: "Puerta del Sol (72)")
        const match = value.match(/\((\d+)\)$/);
        if (match) {
            return match[1];
        }

        // Cas 3: Recherche par nom
        const lowerValue = value.toLowerCase();
        const found = this.stops.find(stop =>
            stop.name.toLowerCase() === lowerValue ||
            stop.name.toLowerCase().includes(lowerValue)
        );

        if (found) {
            return found.id;
        }

        return null;
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    SearchModule.init();
});

// Exporter globalement
window.Search = SearchModule;
