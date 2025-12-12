/**
 * Main Application
 * Orchestrates all components
 */

const App = {
    combinations: [],
    filters: {
        twoWay: true,
        threeWay: true,
        fourWay: true
    },
    mixGranularity: 5,
    lightnessFilter: 50,
    colorFilters: {
        hueMin: 0,
        hueMax: 360,
        satMin: 0,
        satMax: 100
    },
    favoriteColors: JSON.parse(localStorage.getItem('favoriteColors') || '[]'),
    recentColors: JSON.parse(localStorage.getItem('recentColors') || '[]'),
    colorPresets: {
        all: null,
        warm: null,
        cool: null,
        neutral: null
    },
    activePreset: 'all',

    /**
     * Initialize application
     */
    init() {
        console.log('🎨 Filament Color Mixer starting...');

        // Initialize components
        FilamentManager.onUpdate = () => this.updateCombinations();
        FilamentManager.init();

        ColorVisualizer.init();
        ColorVisualizer.onColorClick = (combo) => this.showRecipe(combo);

        // Setup event listeners
        this.setupEventListeners();
        
        // Setup history panel
        this.setupHistoryPanel();

        // Initial state
        this.updateUIState();
        this.updateCombinations();

        // Check for shared recipe in URL
        this.checkForSharedRecipe();

        // Expose app to window for debugging
        window.app = this;

        console.log('✅ Application initialized');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                ColorVisualizer.switchView(view);
            });
        });

        // Lightness slider
        const lightnessSlider = document.getElementById('lightness-slider');
        const lightnessValue = document.getElementById('lightness-value');

        if (lightnessSlider && lightnessValue) {
            lightnessSlider.addEventListener('input', (e) => {
                this.lightnessFilter = parseInt(e.target.value);
                lightnessValue.textContent = `${this.lightnessFilter}%`;
                this.updateVisualization();
            });
        }

        // Filter checkboxes
        document.getElementById('filter-2way')?.addEventListener('change', (e) => {
            this.filters.twoWay = e.target.checked;
            this.updateCombinations();
        });

        document.getElementById('filter-3way')?.addEventListener('change', (e) => {
            this.filters.threeWay = e.target.checked;
            this.updateCombinations();
        });

        document.getElementById('filter-4way')?.addEventListener('change', (e) => {
            this.filters.fourWay = e.target.checked;
            this.updateCombinations();
        });

        // Mix granularity selector
        document.getElementById('mix-granularity')?.addEventListener('change', (e) => {
            this.mixGranularity = parseInt(e.target.value);
            Toast.info(`Mix granularity set to ${this.mixGranularity}% steps`);
            this.updateCombinations();
        });

        // Advanced filter toggle
        document.getElementById('advanced-filter-toggle')?.addEventListener('click', () => {
            const panel = document.getElementById('advanced-filters');
            const btn = document.getElementById('advanced-filter-toggle');
            if (panel) {
                // If currently visible (display: block or not none), hide it. If hidden (display: none), show it.
                // The style.display might be empty string initially, which means visible in CSS if not overridden.
                // But inline style="display: none;" sets it.

                const currentDisplay = window.getComputedStyle(panel).display;
                const isVisible = currentDisplay !== 'none';

                panel.style.display = isVisible ? 'none' : 'block';
                if (btn) btn.classList.toggle('active', !isVisible);
            }
        });

        // Hue range filters
        const hueMin = document.getElementById('hue-min');
        const hueMax = document.getElementById('hue-max');
        const hueMinVal = document.getElementById('hue-min-val');
        const hueMaxVal = document.getElementById('hue-max-val');

        if (hueMin && hueMax) {
            hueMin.addEventListener('input', (e) => {
                this.colorFilters.hueMin = parseInt(e.target.value);
                hueMinVal.textContent = `${this.colorFilters.hueMin}°`;
                this.updateVisualization();
            });

            hueMax.addEventListener('input', (e) => {
                this.colorFilters.hueMax = parseInt(e.target.value);
                hueMaxVal.textContent = `${this.colorFilters.hueMax}°`;
                this.updateVisualization();
            });
        }

        // Saturation range filters
        const satMin = document.getElementById('sat-min');
        const satMax = document.getElementById('sat-max');
        const satMinVal = document.getElementById('sat-min-val');
        const satMaxVal = document.getElementById('sat-max-val');

        if (satMin && satMax) {
            satMin.addEventListener('input', (e) => {
                this.colorFilters.satMin = parseInt(e.target.value);
                satMinVal.textContent = `${this.colorFilters.satMin}%`;
                this.updateVisualization();
            });

            satMax.addEventListener('input', (e) => {
                this.colorFilters.satMax = parseInt(e.target.value);
                satMaxVal.textContent = `${this.colorFilters.satMax}%`;
                this.updateVisualization();
            });
        }

        // Reset filters button
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.colorFilters = { hueMin: 0, hueMax: 360, satMin: 0, satMax: 100 };
            if (hueMin) hueMin.value = 0;
            if (hueMax) hueMax.value = 360;
            if (satMin) satMin.value = 0;
            if (satMax) satMax.value = 100;
            if (hueMinVal) hueMinVal.textContent = '0°';
            if (hueMaxVal) hueMaxVal.textContent = '360°';
            if (satMinVal) satMinVal.textContent = '0%';
            if (satMaxVal) satMaxVal.textContent = '100%';
            this.updateVisualization();
        });

        // Close recipe panel
        document.getElementById('close-recipe')?.addEventListener('click', () => {
            this.closeRecipe();
        });

        // Empty state CTA buttons
        document.querySelector('.cta-add-filament')?.addEventListener('click', () => {
            FilamentManager.openAddModal();
        });

        document.querySelector('.cta-load-samples')?.addEventListener('click', () => {
            FilamentManager.loadSampleFilaments();
        });

        // Help button
        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.openShortcutsModal();
        });
        
        // Active filaments select all/none
        document.getElementById('select-all-active')?.addEventListener('click', () => {
            FilamentManager.selectAllActive();
        });
        
        document.getElementById('select-none-active')?.addEventListener('click', () => {
            FilamentManager.selectNoneActive();
        });
        
        // Color preset filters
        document.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const preset = e.target.getAttribute('data-preset');
                this.applyColorPreset(preset);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modals and recipe panel
            if (e.key === 'Escape') {
                this.closeRecipe();
                FilamentManager.closeAddModal();
                FilamentManager.closeTargetModal();
                this.closeShortcutsModal();
            }
            // Ctrl/Cmd + K to open add filament
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                FilamentManager.openAddModal();
            }
            // ? to show shortcuts
            if (e.key === '?' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.openShortcutsModal();
            }
            // 1, 2, 3 to switch views
            if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                ColorVisualizer.switchView('2d');
            }
            if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                ColorVisualizer.switchView('3d');
            }
            if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                ColorVisualizer.switchView('grid');
            }
        });

        // Shortcuts modal handlers
        document.getElementById('close-shortcuts')?.addEventListener('click', () => {
            this.closeShortcutsModal();
        });

        // Help button (FAB)
        document.getElementById('fab-help')?.addEventListener('click', () => {
            this.openShortcutsModal();
        });

        // Export palette button
        document.getElementById('export-palette-btn')?.addEventListener('click', () => {
            this.exportPalette();
        });
    },

    /**
     * Update UI state (show/hide empty state)
     */
    updateUIState() {
        const hasFilaments = FilamentManager.filaments.length > 0;
        const hasActiveCombinations = this.combinations.length > 0;

        const emptyState = document.getElementById('empty-state');
        const loadingState = document.getElementById('loading-state');

        if (!hasFilaments) {
            emptyState?.classList.add('visible');
            loadingState?.classList.remove('visible');
        } else if (!hasActiveCombinations) {
            emptyState?.classList.remove('visible');
            loadingState?.classList.add('visible');
        } else {
            emptyState?.classList.remove('visible');
            loadingState?.classList.remove('visible');
        }
    },

    /**
     * Update color combinations
     */
    updateCombinations() {
        console.log('♻️ Updating combinations...');

        const startTime = performance.now();

        // Show loading state
        document.getElementById('loading-state')?.classList.add('visible');

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            this.combinations = ColorMixer.generateAllCombinations(
                FilamentManager.filaments,
                FilamentManager.activeFilaments,
                this.filters,
                this.mixGranularity
            );

            const endTime = performance.now();
            console.log(`✅ Generated ${this.combinations.length} combinations in ${(endTime - startTime).toFixed(2)}ms`);

            // Update stats
            const colorCount = document.getElementById('color-count');
            if (colorCount) {
                colorCount.textContent = `${this.combinations.length} colors possible`;
            }
            
            // Update filter labels with counts
            this.updateFilterCounts();

            this.updateVisualization();
            this.updateUIState();

            // Hide loading state
            document.getElementById('loading-state')?.classList.remove('visible');

            // Show pending shared recipe if any
            this.showPendingSharedRecipe();
        }, 50);
    },

    /**
     * Update visualization
     */
    updateVisualization() {
        ColorVisualizer.update(this.combinations, this.lightnessFilter, this.colorFilters);
    },
    
    /**
     * Update filter labels with combination counts
     */
    updateFilterCounts() {
        const twoWayCount = this.combinations.filter(c => c.filaments.length === 2).length;
        const threeWayCount = this.combinations.filter(c => c.filaments.length === 3).length;
        const fourWayCount = this.combinations.filter(c => c.filaments.length === 4).length;
        
        const filter2way = document.querySelector('#filter-2way + span');
        const filter3way = document.querySelector('#filter-3way + span');
        const filter4way = document.querySelector('#filter-4way + span');
        
        if (filter2way) {
            filter2way.innerHTML = `2-way mixes <span class="hint-text">(${twoWayCount})</span>`;
        }
        if (filter3way) {
            filter3way.innerHTML = `3-way mixes <span class="hint-text">(${threeWayCount})</span>`;
        }
        if (filter4way) {
            filter4way.innerHTML = `4-way mixes <span class="hint-text">(${fourWayCount})</span>`;
        }
    },

    /**
     * Show recipe panel
     */
    showRecipe(combo) {
        console.log('🎨 Showing recipe for:', combo);
        
        // Add to recent colors
        this.addToRecentColors(combo);

        const recipePanel = document.getElementById('recipe-panel');
        const recipeContent = document.getElementById('recipe-content');
        const mainContent = document.querySelector('.main-content');

        if (!recipePanel || !recipeContent) return;
        
        const isFavorite = this.favoriteColors.some(f => f.id === combo.id);
        const difficulty = this.getRecipeDifficulty(combo);
        const harmony = this.detectColorHarmony(combo);

        // Build recipe HTML
        const colorName = typeof ColorNamer !== 'undefined' ? ColorNamer.getDetailedName(combo.color) : '';

        let html = `
            <div class="recipe-color-preview" style="background: ${combo.color}" title="Click to copy color code"></div>

            <div class="recipe-info">
                ${colorName ? `<div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">${colorName}</div>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-size: ${colorName ? '0.875rem' : '1rem'}; color: ${colorName ? 'var(--text-secondary)' : 'var(--text-primary)'};">${combo.color}</h3>
                    <span style="font-size: 0.875rem; color: #94a3b8;">${combo.type}</span>
                </div>
                <button class="btn-copy-color" data-color="${combo.color}" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); cursor: pointer; font-size: 0.875rem; transition: all var(--transition-fast);">
                    📋 Copy Color Code
                </button>
                <button class="btn-share-recipe" style="width: 100%; margin-bottom: 1rem; padding: 0.5rem; background: var(--secondary-color); border: 1px solid var(--secondary-color); border-radius: var(--radius-md); color: white; cursor: pointer; font-size: 0.875rem; transition: all var(--transition-fast); font-weight: 500;">
                    🔗 Share Recipe
                </button>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="icon-btn ${isFavorite ? 'favorited' : ''}" id="favorite-btn" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            ${isFavorite ? '⭐' : '☆'}
                        </button>
                        <span class="difficulty-badge ${difficulty.level}">${difficulty.icon} ${difficulty.label}</span>
                    </div>
                </div>
                
                ${harmony ? `<div class="harmony-badge">🎨 ${harmony}</div>` : ''}

                <div>
        `;

        // Add ingredient items
        combo.filaments.forEach((filament, index) => {
            html += `
                <div class="ingredient-item">
                    <div class="ingredient-header">
                        <div class="ingredient-swatch" style="background: ${filament.hexColor}"></div>
                        <div class="ingredient-name">${filament.colorName}</div>
                        <div class="ingredient-percentage">${combo.percentages[index]}%</div>
                    </div>
                    <input type="range" class="percentage-slider"
                           min="0" max="100" value="${combo.percentages[index]}"
                           data-index="${index}" data-combo-id="${combo.id}">
                </div>
            `;
        });

        html += `</div></div>`;

        // Add action buttons
        html += `
            <div class="recipe-actions">
                <button class="btn-secondary" id="export-recipe-btn" title="Copy recipe to clipboard">
                    📋 Copy Recipe
                </button>
                <button class="btn-secondary" id="share-image-btn" title="Share as image">
                    🖼️ Share Image
                </button>
                <button class="btn-secondary" id="print-recipe-btn" title="Print recipe">
                    🖨️ Print
                </button>
                <button class="btn-secondary" id="find-complementary-btn" title="Find complementary color">
                    🎨 Complementary
                </button>
                <button class="btn-secondary" id="analyze-color-btn" title="Analyze color properties">
                    📊 Analyze
                </button>
                <button class="btn-secondary" id="compare-color-btn" title="Compare with another color">
                    ↔️ Compare
                </button>
            </div>
        `;

        // Find alternative recipes
        const alternatives = this.findAlternativeRecipes(combo);

        if (alternatives.length > 0) {
            html += `
                <div class="alternatives">
                    <h3>Similar Colors</h3>
            `;

            alternatives.forEach(alt => {
                html += `
                    <div class="alternative-item" data-combo-id="${alt.id}">
                        <div class="alternative-color" style="background: ${alt.color}"></div>
                        <div class="alternative-recipe">${alt.recipe}</div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        recipeContent.innerHTML = html;

        // Add copy to clipboard functionality
        const copyBtn = recipeContent.querySelector('.btn-copy-color');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(combo.color);
            });
        }

        // Add share recipe functionality
        const shareBtn = recipeContent.querySelector('.btn-share-recipe');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareRecipe(combo);
            });
        }

        // Add click to color preview to copy
        const preview = recipeContent.querySelector('.recipe-color-preview');
        if (preview) {
            preview.style.cursor = 'pointer';
            preview.addEventListener('click', () => {
                this.copyToClipboard(combo.color);
            });
        }

        // Add event listeners to sliders
        recipeContent.querySelectorAll('.percentage-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.handleSliderChange(e.target, combo);
            });
        });
        
        // Add event listener to favorite button
        const favoriteBtn = recipeContent.querySelector('#favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite(combo);
            });
        }

        // Add event listener to export button
        const exportBtn = recipeContent.querySelector('#export-recipe-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportRecipe(combo);
            });
        }
        
        // Add event listener to share image button
        const shareImageBtn = recipeContent.querySelector('#share-image-btn');
        if (shareImageBtn) {
            shareImageBtn.addEventListener('click', () => {
                this.shareRecipeAsImage(combo);
            });
        }
        
        // Add event listener to print button
        const printBtn = recipeContent.querySelector('#print-recipe-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printRecipe(combo);
            });
        }
        
        // Add event listener to complementary button
        const complementaryBtn = recipeContent.querySelector('#find-complementary-btn');
        if (complementaryBtn) {
            complementaryBtn.addEventListener('click', () => {
                this.findComplementaryColor(combo);
            });
        }
        
        // Add event listener to analyze button
        const analyzeBtn = recipeContent.querySelector('#analyze-color-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeColor(combo);
            });
        }
        
        // Add event listener to compare button
        const compareBtn = recipeContent.querySelector('#compare-color-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareColors(combo);
            });
        }

        // Add event listeners to alternatives
        recipeContent.querySelectorAll('.alternative-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const altComboId = e.currentTarget.getAttribute('data-combo-id');
                const altCombo = this.combinations.find(c => c.id === altComboId);
                if (altCombo) {
                    this.showRecipe(altCombo);
                }
            });
        });

        // Show panel
        recipePanel.classList.add('open');
        mainContent?.classList.add('recipe-open');
    },

    /**
     * Export recipe to clipboard
     */
    exportRecipe(combo) {
        const recipeText = `
🎨 Filament Color Recipe
━━━━━━━━━━━━━━━━━━━━━
Color: ${combo.color}
Type: ${combo.type}

Ingredients:
${combo.filaments.map((f, i) => `  • ${combo.percentages[i]}% - ${f.colorName} (${f.brand} ${f.material})`).join('\n')}

Recipe: ${combo.recipe}

Generated by Filament Color Mixer
        `.trim();

        navigator.clipboard.writeText(recipeText).then(() => {
            Toast.success('Recipe copied to clipboard!');
        }).catch(() => {
            Toast.error('Failed to copy recipe');
        });
    },

    /**
     * Handle slider change
     */
    handleSliderChange(slider, combo) {
        const index = parseInt(slider.getAttribute('data-index'));
        const newValue = parseInt(slider.value);

        // Update percentages (keep others proportional)
        const newPercentages = [...combo.percentages];
        newPercentages[index] = newValue;

        // Normalize other values
        const remainingPercent = 100 - newValue;
        const otherTotal = combo.percentages.reduce((sum, val, i) => {
            return i === index ? sum : sum + val;
        }, 0);

        if (otherTotal > 0) {
            newPercentages.forEach((val, i) => {
                if (i !== index) {
                    newPercentages[i] = Math.round((val / otherTotal) * remainingPercent);
                }
            });
        }

        // Recalculate color
        let newColor;
        if (combo.filaments.length === 2) {
            newColor = ColorMixer.mixTwo(
                combo.filaments[0].hexColor,
                combo.filaments[1].hexColor,
                newPercentages[1] / 100
            );
        } else if (combo.filaments.length === 3) {
            newColor = ColorMixer.mixThree(
                combo.filaments[0].hexColor,
                combo.filaments[1].hexColor,
                combo.filaments[2].hexColor,
                newPercentages
            );
        } else if (combo.filaments.length === 4) {
            newColor = ColorMixer.mixFour(
                combo.filaments[0].hexColor,
                combo.filaments[1].hexColor,
                combo.filaments[2].hexColor,
                combo.filaments[3].hexColor,
                newPercentages
            );
        }

        // Update preview
        const preview = document.querySelector('.recipe-color-preview');
        if (preview) {
            preview.style.background = newColor;
        }

        // Update percentage displays
        const percentageDisplays = document.querySelectorAll('.ingredient-percentage');
        percentageDisplays.forEach((display, i) => {
            display.textContent = `${newPercentages[i]}%`;
        });

        // Update other sliders
        const sliders = document.querySelectorAll('.percentage-slider');
        sliders.forEach((s, i) => {
            if (i !== index) {
                s.value = newPercentages[i];
            }
        });

        // Update color display
        const colorDisplay = document.querySelector('.recipe-info h3');
        if (colorDisplay) {
            colorDisplay.textContent = `Color: ${newColor}`;
        }
    },

    /**
     * Find alternative recipes for similar colors using Delta E if available
     */
    findAlternativeRecipes(combo) {
        if (typeof DeltaE !== 'undefined') {
            // Use Delta E for more accurate color matching
            const alternatives = this.combinations
                .filter(c => c.id !== combo.id)
                .map(c => ({
                    ...c,
                    deltaE: DeltaE.deltaE2000(c.color, combo.color),
                    similarity: DeltaE.similarityFromDeltaE(DeltaE.deltaE2000(c.color, combo.color))
                }))
                .filter(c => c.deltaE < 10) // Delta E < 10 is noticeable but similar
                .sort((a, b) => a.deltaE - b.deltaE)
                .slice(0, 5);

            return alternatives;
        } else {
            // Fallback to RGB similarity
            const similar = this.combinations.filter(c => {
                if (c.id === combo.id) return false;

                const similarity = ColorMixer.colorSimilarity(c.color, combo.color);
                return similarity > 0.85;
            });

            return similar
                .sort((a, b) => {
                    const simA = ColorMixer.colorSimilarity(a.color, combo.color);
                    const simB = ColorMixer.colorSimilarity(b.color, combo.color);
                    return simB - simA;
                })
                .slice(0, 5);
        }
    },

    /**
     * Close recipe panel
     */
    closeRecipe() {
        const recipePanel = document.getElementById('recipe-panel');
        const mainContent = document.querySelector('.main-content');

        recipePanel?.classList.remove('open');
        mainContent?.classList.remove('recipe-open');
    },
    
    /**
     * Toggle favorite color
     */
    toggleFavorite(combo) {
        const index = this.favoriteColors.findIndex(f => f.id === combo.id);
        
        if (index >= 0) {
            this.favoriteColors.splice(index, 1);
            Toast.success('Removed from favorites');
        } else {
            this.favoriteColors.push({
                id: combo.id,
                color: combo.color,
                recipe: combo.recipe,
                filaments: combo.filaments.map(f => f.colorName)
            });
            Toast.success('Added to favorites ⭐');
        }
        
        localStorage.setItem('favoriteColors', JSON.stringify(this.favoriteColors));
        
        // Re-render recipe to update button
        this.showRecipe(combo);
    },
    
    /**
     * Add color to recent history
     */
    addToRecentColors(combo) {
        // Remove if already exists
        this.recentColors = this.recentColors.filter(r => r.id !== combo.id);
        
        // Add to beginning
        this.recentColors.unshift({
            id: combo.id,
            color: combo.color,
            recipe: combo.recipe,
            timestamp: Date.now()
        });
        
        // Keep only last 10
        this.recentColors = this.recentColors.slice(0, 10);
        
        localStorage.setItem('recentColors', JSON.stringify(this.recentColors));
        this.updateHistoryPanel();
    },
    
    /**
     * Setup history panel tabs and content
     */
    setupHistoryPanel() {
        const tabs = document.querySelectorAll('.history-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.history-content').forEach(c => c.classList.remove('active'));
                document.getElementById(targetTab === 'recent' ? 'recent-colors' : 'favorite-colors').classList.add('active');
            });
        });
        
        this.updateHistoryPanel();
    },
    
    /**
     * Update history panel display
     */
    updateHistoryPanel() {
        const recentContainer = document.getElementById('recent-colors');
        const favContainer = document.getElementById('favorite-colors');
        
        if (!recentContainer || !favContainer) return;
        
        // Update recent
        if (this.recentColors.length === 0) {
            recentContainer.innerHTML = '<p class="hint-text" style="padding: 1rem; text-align: center; color: var(--text-muted);">Recently viewed colors will appear here</p>';
        } else {
            recentContainer.innerHTML = this.recentColors.map(color => `
                <div class="history-item" data-combo-id="${color.id}">
                    <div class="history-color-swatch" style="background: ${color.color}"></div>
                    <div class="history-color-label">${color.color}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${color.recipe}</div>
                </div>
            `).join('');
            
            recentContainer.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const combo = this.combinations.find(c => c.id === e.currentTarget.getAttribute('data-combo-id'));
                    if (combo) this.showRecipe(combo);
                });
            });
        }
        
        // Update favorites
        if (this.favoriteColors.length === 0) {
            favContainer.innerHTML = '<p class="hint-text" style="padding: 1rem; text-align: center; color: var(--text-muted);">Your favorite colors will appear here</p>';
        } else {
            favContainer.innerHTML = this.favoriteColors.map(color => `
                <div class="history-item" data-combo-id="${color.id}">
                    <div class="history-color-swatch" style="background: ${color.color}"></div>
                    <div class="history-color-label">⭐ ${color.color}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${color.recipe}</div>
                </div>
            `).join('');
            
            favContainer.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const combo = this.combinations.find(c => c.id === e.currentTarget.getAttribute('data-combo-id'));
                    if (combo) this.showRecipe(combo);
                });
            });
        }
    },
    
    /**
     * Apply color preset filter
     */
    applyColorPreset(preset) {
        this.activePreset = preset;
        
        // Update active chip
        document.querySelectorAll('.preset-chip').forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-preset') === preset);
        });
        
        // Filter combinations based on preset
        let filteredCombinations = [...this.combinations];
        
        if (preset === 'warm') {
            filteredCombinations = this.combinations.filter(c => this.isWarmColor(c.color));
        } else if (preset === 'cool') {
            filteredCombinations = this.combinations.filter(c => this.isCoolColor(c.color));
        } else if (preset === 'neutral') {
            filteredCombinations = this.combinations.filter(c => this.isNeutralColor(c.color));
        } else if (preset === 'vibrant') {
            filteredCombinations = this.combinations.filter(c => this.isVibrantColor(c.color));
        } else if (preset === 'pastel') {
            filteredCombinations = this.combinations.filter(c => this.isPastelColor(c.color));
        }
        
        ColorVisualizer.update(filteredCombinations, this.lightnessFilter);
        Toast.info(`Showing ${preset} colors (${filteredCombinations.length})`);
    },
    
    /**
     * Check if color is warm
     */
    isWarmColor(hex) {
        const rgb = this.hexToRgb(hex);
        return rgb.r > rgb.b && (rgb.r > 150 || rgb.r > rgb.g);
    },
    
    /**
     * Check if color is cool
     */
    isCoolColor(hex) {
        const rgb = this.hexToRgb(hex);
        return rgb.b > rgb.r || (rgb.g > rgb.r && rgb.b > 100);
    },
    
    /**
     * Check if color is neutral
     */
    isNeutralColor(hex) {
        const rgb = this.hexToRgb(hex);
        const diff = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
        return diff < 30;
    },
    
    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },
    
    /**
     * Check if color is vibrant
     */
    isVibrantColor(hex) {
        const rgb = this.hexToRgb(hex);
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max / 255;
        return saturation > 0.5 && brightness > 0.4;
    },
    
    /**
     * Check if color is pastel
     */
    isPastelColor(hex) {
        const rgb = this.hexToRgb(hex);
        const max = Math.max(rgb.r, rgb.g, rgb.b);
        const min = Math.min(rgb.r, rgb.g, rgb.b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max / 255;
        return saturation < 0.5 && brightness > 0.6;
    },
    
    /**
     * Share recipe as image
     */
    shareRecipeAsImage(combo) {
        Toast.info('Generating image...');
        
        // Create a canvas to draw the recipe
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400 + (combo.filaments.length * 60);
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🎨 Filament Color Recipe', 30, 50);
        
        // Color preview
        ctx.fillStyle = combo.color;
        ctx.fillRect(30, 80, 540, 120);
        
        // Color code
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '18px Arial';
        ctx.fillText(`Color: ${combo.color}`, 30, 230);
        
        // Recipe type
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Arial';
        ctx.fillText(combo.type, 30, 260);
        
        // Ingredients
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Ingredients:', 30, 300);
        
        combo.filaments.forEach((filament, i) => {
            const y = 330 + (i * 60);
            
            // Swatch
            ctx.fillStyle = filament.hexColor;
            ctx.fillRect(30, y, 40, 40);
            
            // Name and percentage
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '14px Arial';
            ctx.fillText(`${filament.colorName}`, 85, y + 15);
            ctx.fillText(`${combo.percentages[i]}% - ${filament.brand} ${filament.material}`, 85, y + 35);
        });
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recipe-${combo.color.replace('#', '')}.png`;
            a.click();
            URL.revokeObjectURL(url);
            Toast.success('Recipe image downloaded!');
        });
    },
    
    /**
     * Print recipe
     */
    printRecipe(combo) {
        const printWindow = window.open('', '', 'height=600,width=800');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Color Recipe - ${combo.color}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #333;
                            border-bottom: 3px solid #6366f1;
                            padding-bottom: 10px;
                        }
                        .color-preview {
                            width: 100%;
                            height: 150px;
                            margin: 20px 0;
                            border: 2px solid #ddd;
                            border-radius: 8px;
                        }
                        .info {
                            margin: 20px 0;
                        }
                        .ingredient {
                            display: flex;
                            align-items: center;
                            margin: 15px 0;
                            padding: 10px;
                            background: #f5f5f5;
                            border-radius: 4px;
                        }
                        .swatch {
                            width: 40px;
                            height: 40px;
                            border: 1px solid #ddd;
                            margin-right: 15px;
                            border-radius: 4px;
                        }
                        .details {
                            flex: 1;
                        }
                        .percentage {
                            font-weight: bold;
                            font-size: 18px;
                        }
                        @media print {
                            body {
                                padding: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <h1>🎨 Filament Color Mixer</h1>
                    
                    <div class="color-preview" style="background: ${combo.color}"></div>
                    
                    <div class="info">
                        <p><strong>Color:</strong> ${combo.color}</p>
                        <p><strong>Type:</strong> ${combo.type}</p>
                        <p><strong>Recipe:</strong> ${combo.recipe}</p>
                    </div>
                    
                    <h2>Ingredients</h2>
                    ${combo.filaments.map((f, i) => `
                        <div class="ingredient">
                            <div class="swatch" style="background: ${f.hexColor}"></div>
                            <div class="details">
                                <div><strong>${f.colorName}</strong></div>
                                <div>${f.brand} - ${f.material}</div>
                            </div>
                            <div class="percentage">${combo.percentages[i]}%</div>
                        </div>
                    `).join('')}
                    
                    <p style="margin-top: 40px; color: #999; font-size: 12px;">
                        Generated by Filament Color Mixer
                    </p>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
        
        Toast.success('Print dialog opened');
    },
    
    /**
     * Get recipe difficulty level
     */
    getRecipeDifficulty(combo) {
        const filamentCount = combo.filaments.length;
        const hasUnevenMix = combo.percentages.some(p => p < 20 || p > 80);
        
        if (filamentCount === 2 && !hasUnevenMix) {
            return { level: 'easy', label: 'Easy', icon: '😊' };
        } else if (filamentCount === 2) {
            return { level: 'medium', label: 'Medium', icon: '😐' };
        } else if (filamentCount === 3 && !hasUnevenMix) {
            return { level: 'medium', label: 'Medium', icon: '😐' };
        } else {
            return { level: 'hard', label: 'Complex', icon: '🤔' };
        }
    },
    
    /**
     * Detect color harmony
     */
    detectColorHarmony(combo) {
        if (combo.filaments.length < 2) return null;
        
        const hues = combo.filaments.map(f => {
            const rgb = this.hexToRgb(f.hexColor);
            return this.rgbToHsl(rgb).h;
        });
        
        // Check for complementary (opposite on color wheel)
        if (hues.length === 2) {
            const diff = Math.abs(hues[0] - hues[1]);
            if (diff > 150 && diff < 210) return 'Complementary Harmony';
        }
        
        // Check for analogous (adjacent on color wheel)
        if (hues.every(h => Math.abs(h - hues[0]) < 30)) {
            return 'Analogous Harmony';
        }
        
        // Check for triadic (evenly spaced)
        if (hues.length === 3) {
            const sorted = [...hues].sort((a, b) => a - b);
            const diff1 = sorted[1] - sorted[0];
            const diff2 = sorted[2] - sorted[1];
            const diff3 = (360 - sorted[2]) + sorted[0];
            if (Math.abs(diff1 - 120) < 20 && Math.abs(diff2 - 120) < 20 && Math.abs(diff3 - 120) < 20) {
                return 'Triadic Harmony';
            }
        }
        
        return null;
    },
    
    /**
     * Convert RGB to HSL
     */
    rgbToHsl(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    },
    
    /**
     * Find complementary color
     */
    findComplementaryColor(combo) {
        const rgb = this.hexToRgb(combo.color);
        const complementary = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        };
        
        const compHex = '#' + [complementary.r, complementary.g, complementary.b]
            .map(x => x.toString(16).padStart(2, '0')).join('');
        
        // Find closest match in combinations
        const closest = this.combinations.reduce((prev, curr) => {
            const currDist = this.colorDistance(compHex, curr.color);
            const prevDist = this.colorDistance(compHex, prev.color);
            return currDist < prevDist ? curr : prev;
        });
        
        Toast.info(`Complementary color: ${compHex}. Showing closest match...`);
        this.showRecipe(closest);
    },
    
    /**
     * Calculate color distance
     */
    colorDistance(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    },
    
    /**
     * Analyze color properties
     */
    analyzeColor(combo) {
        const rgb = this.hexToRgb(combo.color);
        const hsl = this.rgbToHsl(rgb);
        
        const analysis = `
🎨 Color Analysis
━━━━━━━━━━━━━━━━━━━━━
Color: ${combo.color}

RGB Values:
  Red:   ${rgb.r}
  Green: ${rgb.g}
  Blue:  ${rgb.b}

HSL Values:
  Hue:        ${Math.round(hsl.h)}°
  Saturation: ${Math.round(hsl.s)}%
  Lightness:  ${Math.round(hsl.l)}%

Properties:
  ${this.isWarmColor(combo.color) ? '🔥 Warm color' : ''}
  ${this.isCoolColor(combo.color) ? '❄️ Cool color' : ''}
  ${this.isNeutralColor(combo.color) ? '⚪ Neutral color' : ''}
  ${this.isVibrantColor(combo.color) ? '🌈 Vibrant' : ''}
  ${this.isPastelColor(combo.color) ? '🎀 Pastel' : ''}

Mix Complexity: ${this.getRecipeDifficulty(combo).label}
        `.trim();
        
        navigator.clipboard.writeText(analysis).then(() => {
            Toast.success('Color analysis copied to clipboard!');
        });
        
        console.log(analysis);
    },
    
    /**
     * Compare colors
     */
    compareColors(combo) {
        // Store current color for comparison
        if (!this.comparisonColor) {
            this.comparisonColor = combo;
            Toast.info('Color saved! Select another color to compare.');
        } else {
            const color1 = this.comparisonColor;
            const color2 = combo;
            
            const distance = this.colorDistance(color1.color, color2.color);
            const similarity = Math.max(0, 100 - (distance / 441 * 100)); // 441 is max RGB distance
            
            const comparison = `
🎨 Color Comparison
━━━━━━━━━━━━━━━━━━━━━
Color 1: ${color1.color}
  ${color1.recipe}

Color 2: ${color2.color}
  ${color2.recipe}

Similarity: ${Math.round(similarity)}%
Distance: ${Math.round(distance)}

${similarity > 80 ? '✅ Very similar colors' : similarity > 50 ? '⚠️ Moderately similar' : '❌ Very different colors'}
            `.trim();
            
            navigator.clipboard.writeText(comparison).then(() => {
                Toast.success('Comparison copied to clipboard!');
            });
            
            console.log(comparison);
            this.comparisonColor = null;
        }
    },

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    Toast.success(`Copied ${text} to clipboard!`);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    this.fallbackCopyToClipboard(text);
                });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            Toast.success(`Copied ${text} to clipboard!`);
        } catch (err) {
            Toast.error('Failed to copy to clipboard');
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textArea);
    },

    /**
     * Open keyboard shortcuts modal
     */
    openShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.add('visible');
        }
    },

    /**
     * Close keyboard shortcuts modal
     */
    closeShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    },

    /**
     * Export color palette as JSON
     */
    exportPalette() {
        if (this.combinations.length === 0) {
            Toast.warning('No colors to export. Add some filaments first!');
            return;
        }

        // Apply filters to get the current visible colors
        const filteredColors = this.combinations.filter(combo => {
            const hsl = ColorMixer.hexToHsl(combo.color);

            // Lightness filter
            const lightnessDiff = Math.abs(hsl.l - this.lightnessFilter);
            if (lightnessDiff > 15) return false;

            // Color filters
            if (this.colorFilters) {
                const hueMin = this.colorFilters.hueMin;
                const hueMax = this.colorFilters.hueMax;

                if (hueMin <= hueMax) {
                    if (hsl.h < hueMin || hsl.h > hueMax) return false;
                } else {
                    if (hsl.h < hueMin && hsl.h > hueMax) return false;
                }

                if (hsl.s < this.colorFilters.satMin || hsl.s > this.colorFilters.satMax) return false;
            }

            return true;
        });

        // Create palette data
        const palette = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalColors: filteredColors.length,
            filters: {
                lightness: this.lightnessFilter,
                hueRange: [this.colorFilters.hueMin, this.colorFilters.hueMax],
                saturationRange: [this.colorFilters.satMin, this.colorFilters.satMax]
            },
            filaments: FilamentManager.filaments.map(f => ({
                brand: f.brand,
                material: f.material,
                colorName: f.colorName,
                hexColor: f.hexColor
            })),
            colors: filteredColors.slice(0, 1000).map(combo => ({
                hex: combo.color,
                recipe: combo.recipe,
                type: combo.type,
                hsl: ColorMixer.hexToHsl(combo.color)
            }))
        };

        const json = JSON.stringify(palette, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `color-palette-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.success(`Exported ${palette.colors.length} colors to palette file!`);
    },

    /**
     * Check for shared recipe in URL parameters
     */
    checkForSharedRecipe() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipe = urlParams.get('recipe');

        if (recipe) {
            try {
                const recipeData = JSON.parse(decodeURIComponent(recipe));

                // Validate recipe data
                if (recipeData.filaments && recipeData.percentages && recipeData.color) {
                    // Store recipe data for later display
                    this._pendingSharedRecipe = recipeData;
                }
            } catch (error) {
                console.error('Failed to parse shared recipe:', error);
                Toast.error('Failed to load shared recipe');
            }
        }
    },

    /**
     * Show pending shared recipe if combinations are ready
     */
    showPendingSharedRecipe() {
        if (!this._pendingSharedRecipe) return;

        const recipeData = this._pendingSharedRecipe;
        this._pendingSharedRecipe = null; // Clear pending recipe

        // Show success toast now that we're actually displaying it
        Toast.success('Loaded shared recipe from URL!');

        // Try to find matching combination
        const matchingCombo = this.combinations.find(c => c.color === recipeData.color);

        if (matchingCombo) {
            this.showRecipe(matchingCombo);
        } else {
            // Create a temporary combo object from the URL data
            const tempCombo = {
                id: 'shared',
                type: `${recipeData.filaments.length}-way`,
                color: recipeData.color,
                filaments: recipeData.filaments,
                percentages: recipeData.percentages,
                recipe: recipeData.recipe
            };
            this.showRecipe(tempCombo);
        }
    },

    /**
     * Share current recipe via URL
     */
    shareRecipe(combo) {
        const recipeData = {
            filaments: combo.filaments.map(f => ({
                brand: f.brand,
                material: f.material,
                colorName: f.colorName,
                hexColor: f.hexColor
            })),
            percentages: combo.percentages,
            color: combo.color,
            recipe: combo.recipe
        };

        const recipeParam = encodeURIComponent(JSON.stringify(recipeData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${recipeParam}`;

        // Copy to clipboard
        this.copyToClipboard(shareUrl);
        Toast.success('Recipe URL copied to clipboard! Share it with others!');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
