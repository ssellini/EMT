// favorites.js - Gestion des favoris

/**
 * Récupérer les favoris du localStorage
 */
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('emtFavorites')) || [];
    } catch (error) {
        console.error('Erreur lors de la lecture des favoris:', error);
        return [];
    }
}

/**
 * Sauvegarder les favoris dans le localStorage
 */
function saveFavorites(favorites) {
    try {
        localStorage.setItem('emtFavorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris:', error);
        window.Utils.showToast('Erreur lors de la sauvegarde des favoris', 'error');
    }
}

/**
 * Vérifier si un arrêt est dans les favoris
 */
function isFavorite(stopId) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === stopId);
}

/**
 * Ajouter ou retirer un arrêt des favoris
 */
function toggleFavorite(stop) {
    if (!stop || !stop.id) return;

    const favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === stop.id);

    if (index !== -1) {
        // Retirer des favoris
        favorites.splice(index, 1);
        window.Utils.showToast(`Arrêt ${stop.id} retiré des favoris`, 'success');
    } else {
        // Ajouter aux favoris
        favorites.push({
            id: stop.id,
            name: stop.name,
            address: stop.address || '',
            addedAt: Date.now()
        });
        window.Utils.showToast(`Arrêt ${stop.id} ajouté aux favoris`, 'success');
    }

    saveFavorites(favorites);
    renderFavorites();
    return !isFavorite(stop.id); // Retourner le nouveau statut
}

/**
 * Supprimer un favori
 */
function removeFavorite(stopId) {
    const favorites = getFavorites();
    const newFavorites = favorites.filter(fav => fav.id !== stopId);
    saveFavorites(newFavorites);
    renderFavorites();
    window.Utils.showToast(`Arrêt ${stopId} retiré des favoris`, 'success');
}

/**
 * Afficher les favoris
 */
function renderFavorites() {
    const favoritesContainer = document.getElementById('favorites-container');
    if (!favoritesContainer) return;

    const favorites = getFavorites();
    favoritesContainer.innerHTML = '';

    if (favorites.length === 0) return;

    // Trier par date d'ajout (plus récent en premier)
    favorites.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">
                    Arrêts favoris
                </h2>
                <div class="flex gap-2">
                    <button
                        onclick="window.Favorites.exportFavorites()"
                        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Exporter les favoris"
                        aria-label="Exporter les favoris en JSON">
                        📥 Exporter
                    </button>
                    <button
                        onclick="window.Favorites.importFavorites()"
                        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Importer des favoris"
                        aria-label="Importer des favoris depuis un fichier JSON">
                        📤 Importer
                    </button>
                </div>
            </div>
            <div class="flex flex-wrap gap-3" role="list" aria-label="Liste des arrêts favoris">
    `;

    favorites.forEach((fav, index) => {
        html += `
            <div class="relative group" role="listitem">
                <button
                    onclick="window.App.searchStop('${fav.id}')"
                    class="favorite-btn bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold py-2 px-4 pr-10 border border-blue-500 dark:border-blue-600 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Consulter les horaires de l'arrêt ${fav.id} - ${fav.name}"
                    tabindex="0">
                    <span class="font-bold">${fav.id}</span> - ${fav.name}
                </button>
                <button
                    onclick="window.Favorites.removeFavorite('${fav.id}'); event.stopPropagation();"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Retirer des favoris"
                    aria-label="Retirer l'arrêt ${fav.id} des favoris">
                    ✕
                </button>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    favoritesContainer.innerHTML = html;
}

/**
 * Exporter les favoris en JSON
 */
function exportFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        window.Utils.showToast('Aucun favori à exporter', 'info');
        return;
    }

    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emt-favoris-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.Utils.showToast('Favoris exportés avec succès', 'success');
}

/**
 * Importer des favoris depuis un fichier JSON
 */
function importFavorites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported)) {
                    throw new Error('Format invalide');
                }

                // Fusionner avec les favoris existants
                const existing = getFavorites();
                const merged = [...existing];

                imported.forEach(fav => {
                    if (fav.id && fav.name && !merged.some(e => e.id === fav.id)) {
                        merged.push(fav);
                    }
                });

                saveFavorites(merged);
                renderFavorites();
                window.Utils.showToast(`${imported.length} favoris importés`, 'success');
            } catch (error) {
                console.error('Erreur lors de l\'import:', error);
                window.Utils.showToast('Erreur lors de l\'import des favoris', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * Générer une URL de partage des favoris
 */
function shareFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) {
        window.Utils.showToast('Aucun favori à partager', 'info');
        return;
    }

    try {
        const encoded = btoa(JSON.stringify(favorites));
        const shareUrl = `${window.location.origin}${window.location.pathname}?fav=${encoded}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            window.Utils.showToast('Lien de partage copié dans le presse-papier', 'success');
        } else {
            // Fallback pour les navigateurs sans clipboard API
            prompt('Copiez ce lien pour partager vos favoris:', shareUrl);
        }
    } catch (error) {
        console.error('Erreur lors du partage:', error);
        window.Utils.showToast('Erreur lors de la création du lien de partage', 'error');
    }
}

/**
 * Charger les favoris depuis l'URL
 */
function loadFavoritesFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const favParam = urlParams.get('fav');

    if (favParam) {
        try {
            const decoded = JSON.parse(atob(favParam));
            if (Array.isArray(decoded)) {
                const existing = getFavorites();
                const merged = [...existing];

                decoded.forEach(fav => {
                    if (fav.id && fav.name && !merged.some(e => e.id === fav.id)) {
                        merged.push(fav);
                    }
                });

                saveFavorites(merged);
                window.Utils.showToast('Favoris importés depuis le lien', 'success');

                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des favoris depuis l\'URL:', error);
        }
    }
}

// Exporter les fonctions
window.Favorites = {
    getFavorites,
    saveFavorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    renderFavorites,
    exportFavorites,
    importFavorites,
    shareFavorites,
    loadFavoritesFromUrl
};
