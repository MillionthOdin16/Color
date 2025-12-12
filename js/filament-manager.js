/**
 * Filament Manager
 * Handles filament inventory CRUD operations
 */

const FilamentManager = {
    filaments: [],
    activeFilaments: new Set(),
    searchTimeout: null,
    onUpdate: null,

    /**
     * Initialize manager
     */
    init() {
        this.loadFilaments();
        this.setupEventListeners();
        this.render();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add filament button
        document.getElementById('add-filament-btn')?.addEventListener('click', () => {
            this.openAddModal();
        });

        // Load samples button
        document.getElementById('load-samples-btn')?.addEventListener('click', () => {
            this.loadSampleFilaments();
        });

        // Clear all button
        document.getElementById('clear-all-btn')?.addEventListener('click', () => {
            this.clearAllFilaments();
        });

        // Export/Import buttons
        document.getElementById('export-filaments-btn')?.addEventListener('click', () => {
            this.exportFilaments();
        });

        document.getElementById('import-filaments-btn')?.addEventListener('click', () => {
            this.importFilaments();
        });

        // Modal close buttons
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeAddModal();
        });

        document.getElementById('close-target-modal')?.addEventListener('click', () => {
            this.closeTargetModal();
        });

        document.getElementById('close-edit-modal')?.addEventListener('click', () => {
            this.closeEditModal();
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('visible');
                }
            });
        });

        // Search input
        const searchInput = document.getElementById('filament-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }

        // Manual add button
        document.getElementById('add-manual-btn')?.addEventListener('click', () => {
            this.addManualFilament();
        });

        // Edit save button
        document.getElementById('save-edit-btn')?.addEventListener('click', () => {
            this.saveEditedFilament();
        });

        // Color picker sync with hex input
        const colorPicker = document.getElementById('manual-color-picker');
        const hexInput = document.getElementById('manual-hex');

        if (colorPicker && hexInput) {
            colorPicker.addEventListener('input', (e) => {
                hexInput.value = e.target.value;
            });

            hexInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorPicker.value = e.target.value;
                }
            });
        }

        // Edit color picker sync
        const editColorPicker = document.getElementById('edit-color-picker');
        const editHexInput = document.getElementById('edit-hex');

        if (editColorPicker && editHexInput) {
            editColorPicker.addEventListener('input', (e) => {
                editHexInput.value = e.target.value;
            });

            editHexInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    editColorPicker.value = e.target.value;
                }
            });
        }

        // FAB target color button
        document.getElementById('fab-target-color')?.addEventListener('click', () => {
            this.openTargetModal();
        });

        // Find matches button
        document.getElementById('find-matches-btn')?.addEventListener('click', () => {
            this.findTargetColorMatches();
        });
    },

    /**
     * Load filaments from storage
     */
    loadFilaments() {
        this.filaments = Storage.loadFilaments();
        this.filaments.forEach(f => this.activeFilaments.add(f.id));
    },

    /**
     * Save filaments to storage
     */
    saveFilaments() {
        Storage.saveFilaments(this.filaments);
    },

    /**
     * Add filament
     */
    addFilament(filament) {
        filament.id = filament.id || `fil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.filaments.push(filament);
        this.activeFilaments.add(filament.id);
        this.saveFilaments();
        this.render();

        // Show success toast
        Toast.success(`Added ${filament.colorName} to your inventory`);

        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Remove filament
     */
    removeFilament(id) {
        const filament = this.filaments.find(f => f.id === id);
        const colorName = filament ? filament.colorName : 'Filament';
        
        this.filaments = this.filaments.filter(f => f.id !== id);
        this.activeFilaments.delete(id);
        this.saveFilaments();
        this.render();

        // Show info toast
        Toast.info(`Removed ${colorName} from inventory`);

        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Toggle filament active state
     */
    toggleFilament(id) {
        if (this.activeFilaments.has(id)) {
            this.activeFilaments.delete(id);
        } else {
            this.activeFilaments.add(id);
        }

        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Render filament list
     */
    render() {
        const listContainer = document.getElementById('filament-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (this.filaments.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
                    <p>No filaments yet</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Add filaments or load samples to get started</p>
                </div>
            `;
            this.updateStats();
            return;
        }

        this.filaments.forEach(filament => {
            const item = document.createElement('div');
            item.className = 'filament-item';

            item.innerHTML = `
                <div class="filament-color-swatch" style="background: ${filament.hexColor}"></div>
                <div class="filament-info">
                    <div class="filament-name">${filament.colorName}</div>
                    <div class="filament-details">${filament.brand} ${filament.material}</div>
                </div>
                <div class="filament-actions">
                    <button class="icon-btn" data-action="edit" data-id="${filament.id}" title="Edit">✏️</button>
                    <button class="icon-btn" data-action="remove" data-id="${filament.id}" title="Remove">🗑️</button>
                </div>
            `;

            item.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editFilament(filament.id);
            });

            item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFilament(filament.id);
            });

            listContainer.appendChild(item);
        });

        this.renderActiveCheckboxes();
        this.updateStats();
    },

    /**
     * Render active filament checkboxes
     */
    renderActiveCheckboxes() {
        const container = document.getElementById('active-filament-checkboxes');
        if (!container) return;

        container.innerHTML = '';

        this.filaments.forEach(filament => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.activeFilaments.has(filament.id);
            checkbox.addEventListener('change', () => {
                this.toggleFilament(filament.id);
            });

            const colorSpan = document.createElement('span');
            colorSpan.style.display = 'inline-flex';
            colorSpan.style.alignItems = 'center';
            colorSpan.style.gap = '0.5rem';

            const swatch = document.createElement('span');
            swatch.style.width = '16px';
            swatch.style.height = '16px';
            swatch.style.borderRadius = '3px';
            swatch.style.background = filament.hexColor;
            swatch.style.border = '1px solid rgba(255,255,255,0.2)';

            colorSpan.appendChild(swatch);
            colorSpan.appendChild(document.createTextNode(filament.colorName));

            label.appendChild(checkbox);
            label.appendChild(colorSpan);

            container.appendChild(label);
        });
    },

    /**
     * Update statistics
     */
    updateStats() {
        const filamentCount = document.getElementById('filament-count');
        if (filamentCount) {
            const count = this.filaments.length;
            filamentCount.textContent = `${count} filament${count !== 1 ? 's' : ''}`;
        }
    },

    /**
     * Open add filament modal
     */
    openAddModal() {
        const modal = document.getElementById('add-filament-modal');
        if (modal) {
            modal.classList.add('visible');
            document.getElementById('filament-search')?.focus();
        }
    },

    /**
     * Close add filament modal
     */
    closeAddModal() {
        const modal = document.getElementById('add-filament-modal');
        if (modal) {
            modal.classList.remove('visible');

            // Clear inputs
            document.getElementById('filament-search').value = '';
            document.getElementById('manual-brand').value = '';
            document.getElementById('manual-material').value = '';
            document.getElementById('manual-color-name').value = '';
            document.getElementById('manual-hex').value = '';
            document.getElementById('search-results').innerHTML = '';
        }
    },

    /**
     * Open target color modal
     */
    openTargetModal() {
        const modal = document.getElementById('target-color-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    },

    /**
     * Close target color modal
     */
    closeTargetModal() {
        const modal = document.getElementById('target-color-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    },

    /**
     * Handle search
     */
    async handleSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center;">Searching...</div>';

        try {
            const results = await FilamentAPI.searchFilaments(query);

            if (results.length === 0) {
                resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #94a3b8;">No results found. Try manual entry below.</div>';
                return;
            }

            resultsContainer.innerHTML = '';
            
            // Show info badge if using local database
            const usingLocal = results.length > 0 && results[0].source === 'local';
            if (usingLocal) {
                const infoBanner = document.createElement('div');
                infoBanner.style.cssText = 'padding: 0.5rem; margin-bottom: 0.5rem; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; font-size: 0.875rem; color: #94a3b8;';
                infoBanner.innerHTML = '💡 Showing results from local database (120+ colors)';
                resultsContainer.appendChild(infoBanner);
            }

            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'search-result-item';

                item.innerHTML = `
                    <div class="filament-color-swatch" style="background: ${result.hexColor}; width: 30px; height: 30px;"></div>
                    <div class="filament-info">
                        <div class="filament-name">${result.colorName}</div>
                        <div class="filament-details">${result.brand} ${result.material}</div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    this.addFilament(result);
                    this.closeAddModal();
                });

                resultsContainer.appendChild(item);
            });
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #ef4444;">Unable to search. Please try manual entry below.</div>';
        }
    },

    /**
     * Add manual filament
     */
    addManualFilament() {
        const brand = document.getElementById('manual-brand').value.trim();
        const material = document.getElementById('manual-material').value.trim();
        const colorName = document.getElementById('manual-color-name').value.trim();
        const hexColor = document.getElementById('manual-hex').value.trim() ||
                        document.getElementById('manual-color-picker').value;

        if (!brand || !material || !colorName || !hexColor) {
            Toast.warning('Please fill in all fields');
            return;
        }

        this.addFilament({
            brand,
            material,
            colorName,
            hexColor,
            source: 'manual'
        });

        this.closeAddModal();
    },

    /**
     * Load sample filaments - Real filaments from popular brands
     */
    loadSampleFilaments() {
        const samples = [
            // Bambu Lab PLA Basic
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Red', hexColor: '#D32F2F' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Blue', hexColor: '#1976D2' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Yellow', hexColor: '#FBC02D' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'White', hexColor: '#FAFAFA' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Black', hexColor: '#212121' },
            
            // Polymaker PolyLite PLA
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Army Green', hexColor: '#4A5D23' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Orange', hexColor: '#FF6F00' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Teal', hexColor: '#00897B' },
            
            // eSUN PLA+
            { brand: 'eSUN', material: 'PLA+', colorName: 'Purple', hexColor: '#7B1FA2' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Light Blue', hexColor: '#4FC3F7' },
            
            // Hatchbox PLA
            { brand: 'Hatchbox', material: 'PLA', colorName: 'True Red', hexColor: '#C62828' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'True Green', hexColor: '#2E7D32' },
            
            // Prusament PLA
            { brand: 'Prusament', material: 'PLA', colorName: 'Galaxy Purple', hexColor: '#6A1B9A' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Prusa Orange', hexColor: '#F57C00' },
            
            // Additional popular colors
            { brand: 'Overture', material: 'PLA', colorName: 'White', hexColor: '#F5F5F5' },
            { brand: 'Sunlu', material: 'PLA+', colorName: 'Marble', hexColor: '#E0E0E0' }
        ];

        // Clear existing filaments first
        if (this.filaments.length > 0) {
            const confirmClear = confirm(`You have ${this.filaments.length} filaments. Replace them with samples?`);
            if (!confirmClear) return;
            this.filaments = [];
            this.activeFilaments.clear();
        }

        samples.forEach(sample => this.addFilament({ ...sample, source: 'sample' }));
        Toast.success(`Loaded ${samples.length} real-world sample filaments!`);
    },

    /**
     * Edit filament
     */
    editFilament(id) {
        const filament = this.filaments.find(f => f.id === id);
        if (!filament) return;

        this.editingFilamentId = id;

        // Populate edit form
        document.getElementById('edit-brand').value = filament.brand;
        document.getElementById('edit-material').value = filament.material;
        document.getElementById('edit-color-name').value = filament.colorName;
        document.getElementById('edit-hex').value = filament.hexColor;
        document.getElementById('edit-color-picker').value = filament.hexColor;

        // Open edit modal
        document.getElementById('edit-modal')?.classList.add('visible');
    },

    /**
     * Save edited filament
     */
    saveEditedFilament() {
        const brand = document.getElementById('edit-brand').value.trim();
        const material = document.getElementById('edit-material').value.trim();
        const colorName = document.getElementById('edit-color-name').value.trim();
        const hexColor = document.getElementById('edit-hex').value.trim();

        if (!brand || !material || !colorName || !hexColor) {
            Toast.warning('Please fill in all fields');
            return;
        }

        if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
            Toast.error('Invalid hex color format');
            return;
        }

        const filament = this.filaments.find(f => f.id === this.editingFilamentId);
        if (filament) {
            filament.brand = brand;
            filament.material = material;
            filament.colorName = colorName;
            filament.hexColor = hexColor.toUpperCase();

            this.saveFilaments();
            this.render();

            Toast.success(`Updated ${colorName}`);
        }

        this.closeEditModal();
    },

    /**
     * Close edit modal
     */
    closeEditModal() {
        document.getElementById('edit-modal')?.classList.remove('visible');
        this.editingFilamentId = null;
    },

    /**
     * Clear all filaments
     */
    clearAllFilaments() {
        if (this.filaments.length === 0) {
            Toast.info('No filaments to clear');
            return;
        }

        const confirmed = confirm(`Are you sure you want to remove all ${this.filaments.length} filaments?`);
        if (!confirmed) return;

        this.filaments = [];
        this.activeFilaments.clear();
        this.saveFilaments();
        this.render();

        Toast.info('All filaments cleared');

        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Export filaments to JSON
     */
    exportFilaments() {
        if (this.filaments.length === 0) {
            Toast.warning('No filaments to export');
            return;
        }

        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            filaments: this.filaments
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filament-inventory-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.success('Filaments exported successfully!');
    },

    /**
     * Import filaments from JSON
     */
    importFilaments() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (!data.filaments || !Array.isArray(data.filaments)) {
                        Toast.error('Invalid file format');
                        return;
                    }

                    const confirmReplace = this.filaments.length > 0 
                        ? confirm(`You have ${this.filaments.length} filaments. Replace them with imported data?`)
                        : true;

                    if (!confirmReplace) return;

                    this.filaments = [];
                    this.activeFilaments.clear();

                    data.filaments.forEach(filament => {
                        this.addFilament({
                            brand: filament.brand,
                            material: filament.material,
                            colorName: filament.colorName,
                            hexColor: filament.hexColor,
                            source: 'import'
                        });
                    });

                    Toast.success(`Imported ${data.filaments.length} filaments!`);
                } catch (error) {
                    Toast.error('Failed to import filaments: Invalid JSON');
                    console.error(error);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    },

    /**
     * Find target color matches
     */
    findTargetColorMatches() {
        const targetHex = document.getElementById('target-hex').value.trim() ||
                         document.getElementById('target-color-picker').value;

        if (!targetHex) {
            Toast.warning('Please select a target color');
            return;
        }

        if (this.filaments.length === 0) {
            Toast.error('Add some filaments first to find matches');
            return;
        }

        // Generate combinations
        const filters = { twoWay: true, threeWay: true, fourWay: true };
        const combinations = ColorMixer.generateAllCombinations(
            this.filaments,
            this.activeFilaments,
            filters
        );

        if (combinations.length === 0) {
            Toast.warning('No combinations available. Make sure filaments are active.');
            return;
        }

        // Find matches
        const matches = ColorMixer.findClosestMatches(targetHex, combinations, 10);

        // Display results
        const container = document.getElementById('matches-container');
        if (!container) return;

        container.innerHTML = '';

        if (matches.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: #94a3b8;">No matches found. Try adding more filaments!</div>';
            return;
        }

        Toast.success(`Found ${matches.length} matching color combinations!`);

        matches.forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'alternative-item';

            const matchPercent = Math.round(match.similarity * 100);

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <strong>${index + 1}.</strong>
                    <div style="width: 40px; height: 40px; background: ${match.color}; border-radius: 4px; border: 2px solid rgba(255,255,255,0.2);"></div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${matchPercent}% match</div>
                        <div style="font-size: 0.875rem; color: #cbd5e1;">${match.recipe}</div>
                    </div>
                </div>
            `;

            item.addEventListener('click', () => {
                if (window.app && window.app.showRecipe) {
                    window.app.showRecipe(match);
                    this.closeTargetModal();
                }
            });

            container.appendChild(item);
        });
    }
};
