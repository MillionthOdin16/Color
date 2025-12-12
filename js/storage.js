/**
 * Local Storage Management
 * Handles persistence of filament inventory
 */

const Storage = {
    STORAGE_KEY: 'filament-mixer-inventory',

    /**
     * Save filaments to localStorage
     */
    saveFilaments(filaments) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filaments));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Load filaments from localStorage
     */
    loadFilaments() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    },

    /**
     * Clear all filaments
     */
    clearFilaments() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};
