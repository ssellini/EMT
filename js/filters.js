// filters.js - Module de filtrage des résultats de bus

/**
 * Module de filtrage des bus
 */
const FiltersModule = {
    // État des filtres
    filters: {
        maxTime: null,
        lines: [],
        destination: ''
    },

    // Données originales (avant filtrage)
    originalBusData: null,
    isVisible: false,

    /**
     * Initialiser le module de filtres
     */
    init() {
        this.panel = document.getElementById('filters-panel');
        this.content = document.getElementById('filters-content');
        this.toggleButton = document.getElementById('filters-toggle');
        this.toggleText = document.getElementById('filters-toggle-text');
        this.linesContainer = document.getElementById('lines-filter-buttons');
        this.destinationInput = document.getElementById('destination-filter');
        this.countsSpan = document.getElementById('filters-count');

        console.log('✅ Module de filtres initialisé');
    },

    /**
     * Afficher le panneau de filtres
     */
    show() {
        if (this.panel) {
            this.panel.classList.remove('hidden');
            this.isVisible = true;
        }
    },

    /**
     * Masquer le panneau de filtres
     */
    hide() {
        if (this.panel) {
            this.panel.classList.add('hidden');
            this.isVisible = false;
        }
    },

    /**
     * Toggle la visibilité des filtres
     */
    toggle() {
        if (this.content) {
            const isContentVisible = !this.content.classList.contains('hidden');

            if (isContentVisible) {
                this.content.classList.add('hidden');
                this.toggleText.textContent = 'Afficher';
            } else {
                this.content.classList.remove('hidden');
                this.toggleText.textContent = 'Masquer';
            }
        }
    },

    /**
     * Définir le temps d'attente maximum
     */
    setMaxTime(minutes) {
        this.filters.maxTime = minutes;

        // Mettre à jour l'UI des boutons
        document.querySelectorAll('.filter-time').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');

            if ((minutes === null && btn.dataset.time === 'all') ||
                (minutes && btn.dataset.time === minutes.toString())) {
                btn.classList.add('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');
            }
        });

        this.apply();
    },

    /**
     * Toggle un filtre de ligne
     */
    toggleLine(line) {
        const index = this.filters.lines.indexOf(line);

        if (index === -1) {
            this.filters.lines.push(line);
        } else {
            this.filters.lines.splice(index, 1);
        }

        // Mettre à jour l'UI du bouton
        const btn = document.querySelector(`[data-line="${line}"]`);
        if (btn) {
            if (this.filters.lines.includes(line)) {
                btn.classList.add('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');
            } else {
                btn.classList.remove('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');
            }
        }

        this.apply();
    },

    /**
     * Définir le filtre de destination
     */
    setDestination(value) {
        this.filters.destination = value.trim();
        // Debounce l'application pour ne pas filtrer à chaque frappe
        clearTimeout(this.destinationTimeout);
        this.destinationTimeout = setTimeout(() => this.apply(), 300);
    },

    /**
     * Générer les boutons de lignes depuis les données
     */
    generateLinesButtons(busData) {
        if (!this.linesContainer || !busData) return;

        // Extraire toutes les lignes uniques
        const lines = new Set();
        Object.values(busData).forEach(bus => {
            lines.add(bus.line);
        });

        // Créer les boutons
        const sortedLines = Array.from(lines).sort((a, b) => {
            // Tri numérique si possible, sinon alphabétique
            const aNum = parseInt(a);
            const bNum = parseInt(b);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return a.localeCompare(b);
        });

        this.linesContainer.innerHTML = `
            <button
                onclick="window.Filters.clearLines()"
                class="filter-btn filter-line px-3 py-1.5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${this.filters.lines.length === 0 ? 'active bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700' : ''}"
                data-line="all">
                Toutes
            </button>
            ${sortedLines.map(line => `
                <button
                    onclick="window.Filters.toggleLine('${line}')"
                    class="filter-btn filter-line px-3 py-1.5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${this.filters.lines.includes(line) ? 'active bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700' : ''}"
                    data-line="${line}">
                    ${line}
                </button>
            `).join('')}
        `;
    },

    /**
     * Effacer le filtre des lignes
     */
    clearLines() {
        this.filters.lines = [];

        // Mettre à jour l'UI
        document.querySelectorAll('.filter-line').forEach(btn => {
            if (btn.dataset.line === 'all') {
                btn.classList.add('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');
            } else {
                btn.classList.remove('active', 'bg-blue-600', 'dark:bg-blue-700', 'text-white', 'border-blue-600', 'dark:border-blue-700');
            }
        });

        this.apply();
    },

    /**
     * Filtrer les données de bus
     */
    filterBusData(busData) {
        if (!busData) return null;

        let filtered = { ...busData };

        // Filtre par ligne
        if (this.filters.lines.length > 0) {
            filtered = Object.keys(filtered)
                .filter(key => this.filters.lines.includes(filtered[key].line))
                .reduce((obj, key) => {
                    obj[key] = filtered[key];
                    return obj;
                }, {});
        }

        // Filtre par temps d'attente
        if (this.filters.maxTime !== null) {
            filtered = Object.keys(filtered)
                .filter(key => {
                    const bus = filtered[key];
                    const firstTime = bus.times[0];

                    // Extraire le nombre de minutes
                    const minutes = this.extractMinutes(firstTime);

                    return minutes !== null && minutes <= this.filters.maxTime;
                })
                .reduce((obj, key) => {
                    obj[key] = filtered[key];
                    return obj;
                }, {});
        }

        // Filtre par destination
        if (this.filters.destination) {
            const searchTerm = this.filters.destination.toLowerCase();
            filtered = Object.keys(filtered)
                .filter(key => {
                    const destination = filtered[key].destination.toLowerCase();
                    return destination.includes(searchTerm);
                })
                .reduce((obj, key) => {
                    obj[key] = filtered[key];
                    return obj;
                }, {});
        }

        return filtered;
    },

    /**
     * Extraire les minutes depuis une chaîne de temps
     */
    extractMinutes(timeStr) {
        if (!timeStr) return null;

        // Gérer les formats : "5 min", "5min", "5'", ">20", etc.
        const match = timeStr.match(/(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }

        return null;
    },

    /**
     * Appliquer les filtres et re-render
     */
    apply() {
        if (!this.originalBusData) return;

        const filtered = this.filterBusData(this.originalBusData);
        const count = Object.keys(filtered).length;
        const total = Object.keys(this.originalBusData).length;

        // Mettre à jour le compteur
        if (this.countsSpan) {
            if (count === total) {
                this.countsSpan.textContent = `${total} bus`;
            } else {
                this.countsSpan.textContent = `${count} / ${total} bus`;
            }
        }

        // Re-render les cartes de bus
        if (window.App && window.App.displayBusCards) {
            window.App.displayBusCards(filtered);
        }

        // Afficher un message si aucun résultat
        if (count === 0) {
            const busCards = document.getElementById('bus-cards');
            if (busCards) {
                busCards.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <p class="text-lg text-slate-500 dark:text-slate-400 mb-2">
                            😔 Aucun bus ne correspond aux filtres sélectionnés
                        </p>
                        <button
                            onclick="window.Filters.reset()"
                            class="text-blue-600 dark:text-blue-400 hover:underline">
                            Réinitialiser les filtres
                        </button>
                    </div>
                `;
            }
        }

        console.log(`Filtres appliqués: ${count}/${total} bus affichés`);
    },

    /**
     * Réinitialiser tous les filtres
     */
    reset() {
        this.filters = {
            maxTime: null,
            lines: [],
            destination: ''
        };

        // Réinitialiser l'UI
        this.setMaxTime(null);
        this.clearLines();

        if (this.destinationInput) {
            this.destinationInput.value = '';
        }

        this.apply();

        window.Utils.showToast('Filtres réinitialisés', 'info');
    },

    /**
     * Sauvegarder les données originales et afficher les filtres
     */
    setData(busData) {
        this.originalBusData = busData;
        this.generateLinesButtons(busData);
        this.show();
        this.apply();
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    FiltersModule.init();
});

// Exporter globalement
window.Filters = FiltersModule;
