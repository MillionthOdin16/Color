/**
 * FilamentColors.xyz API Client
 * Handles API calls to fetch real filament color data
 */

const FilamentAPI = {
    BASE_URL: 'https://filamentcolors.xyz/api',
    cache: new Map(),

    /**
     * Search for filaments by query
     */
    async searchFilaments(query) {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const response = await fetch(`${this.BASE_URL}/swatch/?q=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return this.parseSearchResults(data);
        } catch (error) {
            console.error('Error searching filaments:', error);
            // Return empty array on error instead of failing
            return [];
        }
    },

    /**
     * Parse search results from API
     */
    parseSearchResults(data) {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.map(item => ({
            id: item.id || Math.random().toString(36),
            brand: item.manufacturer || item.brand || 'Unknown',
            material: item.filament_type || item.material || 'PLA',
            colorName: item.color_name || item.name || 'Unknown',
            hexColor: item.hex_color || this.extractHexColor(item),
            source: 'api'
        })).filter(item => item.hexColor); // Only return items with valid colors
    },

    /**
     * Extract hex color from various API response formats
     */
    extractHexColor(item) {
        // Try different possible field names
        const colorFields = ['hex_color', 'color', 'hex', 'color_hex'];

        for (const field of colorFields) {
            if (item[field]) {
                const color = item[field];
                // Ensure it starts with #
                return color.startsWith('#') ? color : `#${color}`;
            }
        }

        return null;
    },

    /**
     * Get swatches by manufacturer
     */
    async getByManufacturer(manufacturer) {
        try {
            const response = await fetch(
                `${this.BASE_URL}/swatch/?manufacturer=${encodeURIComponent(manufacturer)}`
            );

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return this.parseSearchResults(data);
        } catch (error) {
            console.error('Error fetching by manufacturer:', error);
            return [];
        }
    }
};
