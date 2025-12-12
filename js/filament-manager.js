/**
 * Filament Manager
 * Handles filament inventory CRUD operations
 */

const FilamentManager = {
    filaments: [],
    activeFilaments: new Set(),
    searchTimeout: null,
    onUpdate: null,
    undoStack: [],
    redoStack: [],
    maxUndoStackSize: 20,

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

        // Modal close buttons
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeAddModal();
        });

        document.getElementById('close-target-modal')?.addEventListener('click', () => {
            this.closeTargetModal();
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

        // FAB target color button
        document.getElementById('fab-target-color')?.addEventListener('click', () => {
            this.openTargetModal();
        });

        // Find matches button
        document.getElementById('find-matches-btn')?.addEventListener('click', () => {
            this.findTargetColorMatches();
        });

        // Export filaments button
        document.getElementById('export-filaments-btn')?.addEventListener('click', () => {
            this.exportFilaments();
        });

        // Import filaments button  
        document.getElementById('import-filaments-btn')?.addEventListener('click', () => {
            document.getElementById('import-file-input')?.click();
        });

        // File input change
        document.getElementById('import-file-input')?.addEventListener('change', (e) => {
            this.importFilaments(e.target.files[0]);
        });

        // Keyboard shortcuts for undo/redo
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
            if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
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
     * Save state to undo stack
     */
    saveToUndoStack() {
        const state = {
            filaments: JSON.parse(JSON.stringify(this.filaments)),
            activeFilaments: new Set(this.activeFilaments)
        };
        
        this.undoStack.push(state);
        
        // Limit stack size
        if (this.undoStack.length > this.maxUndoStackSize) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
    },

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            Toast.info('Nothing to undo');
            return;
        }

        // Save current state to redo stack
        const currentState = {
            filaments: JSON.parse(JSON.stringify(this.filaments)),
            activeFilaments: new Set(this.activeFilaments)
        };
        this.redoStack.push(currentState);

        // Restore previous state
        const previousState = this.undoStack.pop();
        this.filaments = previousState.filaments;
        this.activeFilaments = previousState.activeFilaments;
        
        this.saveFilaments();
        this.render();
        
        Toast.success('Undone');
        
        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) {
            Toast.info('Nothing to redo');
            return;
        }

        // Save current state to undo stack
        this.saveToUndoStack();

        // Restore redo state
        const redoState = this.redoStack.pop();
        this.filaments = redoState.filaments;
        this.activeFilaments = redoState.activeFilaments;
        
        this.saveFilaments();
        this.render();
        
        Toast.success('Redone');
        
        if (this.onUpdate) {
            this.onUpdate();
        }
    },

    /**
     * Add filament
     */
    addFilament(filament, showToast = true) {
        // Save state for undo
        this.saveToUndoStack();
        
        filament.id = filament.id || `fil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.filaments.push(filament);
        this.activeFilaments.add(filament.id);
        this.saveFilaments();
        this.render();

        // Show success toast
        if (showToast) {
            Toast.success(`Added ${filament.colorName} to your inventory`);
        }

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
        
        // Show confirmation dialog
        if (!confirm(`Remove ${colorName} from your inventory?\n\nThis will recalculate all color combinations.`)) {
            return;
        }
        
        // Save state for undo
        this.saveToUndoStack();
        
        this.filaments = this.filaments.filter(f => f.id !== id);
        this.activeFilaments.delete(id);
        this.saveFilaments();
        this.render();

        // Show success toast
        Toast.success(`Removed ${colorName} from inventory`);

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
                    <button class="icon-btn" data-action="remove" data-id="${filament.id}" title="Remove">🗑️</button>
                </div>
            `;

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
     * Load sample filaments
     */
    loadSampleFilaments() {
        const samples = [
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Blue', hexColor: '#0066CC' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Red', hexColor: '#CC0000' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Yellow', hexColor: '#FFCC00' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'White', hexColor: '#FFFFFF' },
            { brand: 'Bambu Lab', material: 'PLA Basic', colorName: 'Black', hexColor: '#000000' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Green', hexColor: '#00AA00' },
            { brand: 'Polymaker', material: 'PolyLite PLA', colorName: 'Orange', hexColor: '#FF6600' },
            { brand: 'eSUN', material: 'PLA+', colorName: 'Purple', hexColor: '#9933CC' },
            { brand: 'Hatchbox', material: 'PLA', colorName: 'Cyan', hexColor: '#00CCCC' },
            { brand: 'Prusament', material: 'PLA', colorName: 'Magenta', hexColor: '#CC0099' }
        ];

        samples.forEach(sample => this.addFilament({ ...sample, source: 'sample' }));
        Toast.success(`Loaded ${samples.length} sample filaments!`);
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
    },

    /**
     * Export filaments to JSON file
     */
    exportFilaments() {
        if (this.filaments.length === 0) {
            Toast.warning('No filaments to export');
            return;
        }

        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            filaments: this.filaments,
            activeFilaments: Array.from(this.activeFilaments)
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `filament-inventory-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.success(`Exported ${this.filaments.length} filaments!`);
    },

    /**
     * Import filaments from JSON file
     */
    importFilaments(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.filaments || !Array.isArray(data.filaments)) {
                    throw new Error('Invalid file format');
                }

                // Ask for confirmation if there are existing filaments
                if (this.filaments.length > 0) {
                    const replace = confirm(
                        `You currently have ${this.filaments.length} filament(s).\n\n` +
                        `Import will add ${data.filaments.length} filament(s) from the file.\n\n` +
                        `Do you want to continue?`
                    );
                    
                    if (!replace) {
                        return;
                    }
                }

                // Import filaments
                let imported = 0;
                let duplicates = 0;
                
                data.filaments.forEach(filament => {
                    // Check for duplicates (same brand, material, and color name)
                    const exists = this.filaments.some(f => 
                        f.brand === filament.brand && 
                        f.material === filament.material && 
                        f.colorName === filament.colorName
                    );
                    
                    if (!exists) {
                        this.addFilament(filament, false); // Don't show toast for each
                        imported++;
                    } else {
                        duplicates++;
                    }
                });

                // Restore active filaments if provided
                if (data.activeFilaments && Array.isArray(data.activeFilaments)) {
                    data.activeFilaments.forEach(id => {
                        if (this.filaments.some(f => f.id === id)) {
                            this.activeFilaments.add(id);
                        }
                    });
                }

                this.render();
                if (this.onUpdate) {
                    this.onUpdate();
                }

                let message = `Successfully imported ${imported} filament(s)!`;
                if (duplicates > 0) {
                    message += ` (${duplicates} duplicate(s) skipped)`;
                }
                Toast.success(message);

            } catch (error) {
                console.error('Import error:', error);
                Toast.error('Failed to import file. Please check the file format.');
            }
        };

        reader.readAsText(file);
        
        // Reset file input
        document.getElementById('import-file-input').value = '';
    }
};
