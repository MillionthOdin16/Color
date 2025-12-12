/**
 * FilamentColors.xyz API Client
 * Handles API calls to fetch real filament color data
 * NOTE: API may be unavailable due to CORS/Cloudflare protection
 * Falls back to local database of common filaments
 */

const FilamentAPI = {
    BASE_URL: 'https://filamentcolors.xyz/api',
    cache: new Map(),
    localDatabase: null,

    /**
     * Initialize local filament database
     */
    initLocalDatabase() {
        if (this.localDatabase) return;
        
        this.localDatabase = [
            // Bambu Lab PLA Basic
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Red', hexColor: '#E31E24' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Orange', hexColor: '#FF6600' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Yellow', hexColor: '#FFD700' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Green', hexColor: '#00A651' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Blue', hexColor: '#0066CC' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Purple', hexColor: '#8B3A9C' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Pink', hexColor: '#FF69B4' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'White', hexColor: '#F5F5F5' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Black', hexColor: '#1C1C1C' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Grey', hexColor: '#808080' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Light Blue', hexColor: '#87CEEB' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Teal', hexColor: '#008080' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Brown', hexColor: '#8B4513' },
            { brand: 'Bambu Lab', material: 'PLA Matte', colorName: 'Matte Black', hexColor: '#2B2B2B' },
            { brand: 'Bambu Lab', material: 'PLA Matte', colorName: 'Matte White', hexColor: '#E8E8E8' },
            
            // Polymaker PolyLite
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Red', hexColor: '#D32F2F' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Orange', hexColor: '#FF6F00' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Yellow', hexColor: '#FBC02D' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Green', hexColor: '#388E3C' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Blue', hexColor: '#1976D2' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Purple', hexColor: '#7B1FA2' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'White', hexColor: '#FAFAFA' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Black', hexColor: '#212121' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Grey', hexColor: '#757575' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Teal', hexColor: '#00897B' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Army Green', hexColor: '#4B5320' },
            
            // Hatchbox PLA
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Red', hexColor: '#C62828' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Orange', hexColor: '#EF6C00' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Yellow', hexColor: '#F9A825' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Green', hexColor: '#2E7D32' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Blue', hexColor: '#1565C0' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Purple', hexColor: '#6A1B9A' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'White', hexColor: '#FFFFFF' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Black', hexColor: '#000000' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Cyan', hexColor: '#00BCD4' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Magenta', hexColor: '#C2185B' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Light Grey', hexColor: '#BDBDBD' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Light Pink', hexColor: '#FFB6C1' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Light Blue', hexColor: '#ADD8E6' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Brown', hexColor: '#6D4C41' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'True Red', hexColor: '#E53935' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'True Blue', hexColor: '#1E88E5' },
            
            // Prusament PLA
            { brand: 'Prusament', material: 'PLA', colorName: 'Orange', hexColor: '#FF8C00' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Galaxy Black', hexColor: '#1A1A2E' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Prusa Orange', hexColor: '#FF6B35' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Azure Blue', hexColor: '#0077BE' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Lime Green', hexColor: '#9ACD32' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Mystic Green', hexColor: '#28B463' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Royal Blue', hexColor: '#4169E1' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Lipstick Red', hexColor: '#DC143C' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Vanilla White', hexColor: '#FFF8DC' },
            
            // eSUN PLA+
            { brand: 'eSUN', material: 'PLA+', colorName: 'Red', hexColor: '#DC143C' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Orange', hexColor: '#FF7F50' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Yellow', hexColor: '#FFD700' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Green', hexColor: '#32CD32' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Blue', hexColor: '#4169E1' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Purple', hexColor: '#9370DB' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'White', hexColor: '#F8F8FF' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Black', hexColor: '#0A0A0A' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Grey', hexColor: '#808080' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Pink', hexColor: '#FFC0CB' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Light Blue', hexColor: '#87CEFA' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Brown', hexColor: '#A0522D' },
            
            // Overture PLA
            { brand: 'Overture', material: 'PLA', colorName: 'Red', hexColor: '#FF0000' },
            { brand: 'Overture', material: 'PLA', colorName: 'Orange', hexColor: '#FFA500' },
            { brand: 'Overture', material: 'PLA', colorName: 'Yellow', hexColor: '#FFFF00' },
            { brand: 'Overture', material: 'PLA', colorName: 'Green', hexColor: '#008000' },
            { brand: 'Overture', material: 'PLA', colorName: 'Blue', hexColor: '#0000FF' },
            { brand: 'Overture', material: 'PLA', colorName: 'Purple', hexColor: '#800080' },
            { brand: 'Overture', material: 'PLA', colorName: 'White', hexColor: '#FFFFFF' },
            { brand: 'Overture', material: 'PLA', colorName: 'Black', hexColor: '#000000' },
            { brand: 'Overture', material: 'PLA', colorName: 'Space Grey', hexColor: '#4A4A4A' },
            { brand: 'Overture', material: 'PLA', colorName: 'Matte Black', hexColor: '#1A1A1A' },
            
            // Sunlu PLA+
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Red', hexColor: '#E31837' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Orange', hexColor: '#FF8800' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Yellow', hexColor: '#FFE135' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Green', hexColor: '#00A550' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Blue', hexColor: '#0055AA' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Purple', hexColor: '#663399' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'White', hexColor: '#F5F5F5' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Black', hexColor: '#000000' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Grey', hexColor: '#888888' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Pink', hexColor: '#FF1493' },
            
            // 3D Solutech
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Red', hexColor: '#D0312D' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Orange', hexColor: '#FF6A00' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Yellow', hexColor: '#FFDA1A' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Green', hexColor: '#2E7D32' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Blue', hexColor: '#1976D2' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Purple', hexColor: '#6A1B9A' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real White', hexColor: '#FAFAFA' },
            { brand: '3D Solutech', material: 'PLA', colorName: 'Real Black', hexColor: '#212121' },
            
            // MatterHackers PRO PLA
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Red', hexColor: '#C41E3A' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Orange', hexColor: '#FF6A00' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Yellow', hexColor: '#FFED00' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Green', hexColor: '#00A86B' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Blue', hexColor: '#0072CE' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Purple', hexColor: '#663399' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'White', hexColor: '#FFFFFF' },
            { brand: 'MatterHackers', material: 'PRO PLA', colorName: 'Black', hexColor: '#000000' },
            
            // CC3D Silk PLA
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Gold', hexColor: '#FFD700' },
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Silver', hexColor: '#C0C0C0' },
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Copper', hexColor: '#B87333' },
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Rainbow', hexColor: '#FF6B9D' },
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Red', hexColor: '#DC143C' },
            { brand: 'CC3D', material: 'Silk PLA', colorName: 'Silk Blue', hexColor: '#4169E1' },
        ];
    },

    /**
     * Search local database
     */
    searchLocalDatabase(query) {
        this.initLocalDatabase();
        
        const lowerQuery = query.toLowerCase();
        return this.localDatabase
            .filter(item => {
                const searchText = `${item.brand} ${item.material} ${item.colorName}`.toLowerCase();
                return searchText.includes(lowerQuery);
            })
            .map(item => ({
                ...item,
                id: `local-${item.brand}-${item.material}-${item.colorName}`.replace(/\s+/g, '-'),
                source: 'local'
            }))
            .slice(0, 20); // Limit results
    },

    /**
     * Search for filaments by query
     * First tries API, then falls back to local database
     */
    async searchFilaments(query) {
        if (!query || query.length < 2) {
            return [];
        }

        // Try API first (will likely fail due to CORS/Cloudflare)
        try {
            const response = await fetch(`${this.BASE_URL}/swatch/?color_name__icontains=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const apiResults = this.parseSearchResults(data);
            
            // If API works, return those results
            if (apiResults.length > 0) {
                return apiResults;
            }
        } catch (error) {
            console.warn('FilamentColors.xyz API unavailable, using local database:', error.message);
        }

        // Fall back to local database
        return this.searchLocalDatabase(query);
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
            brand: item.manufacturer?.name || item.manufacturer || item.brand || 'Unknown',
            material: item.filament_type?.name || item.filament_type || item.material || 'PLA',
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
