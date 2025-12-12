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
    lightnessFilter: 50,

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

        // Initial state
        this.updateUIState();
        this.updateCombinations();

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
        });

        // Shortcuts modal handlers
        document.getElementById('close-shortcuts')?.addEventListener('click', () => {
            this.closeShortcutsModal();
        });
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
                this.filters
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
        }, 50);
    },

    /**
     * Update visualization
     */
    updateVisualization() {
        ColorVisualizer.update(this.combinations, this.lightnessFilter);
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

        const recipePanel = document.getElementById('recipe-panel');
        const recipeContent = document.getElementById('recipe-content');
        const mainContent = document.querySelector('.main-content');

        if (!recipePanel || !recipeContent) return;

        // Build recipe HTML
        let html = `
            <div class="recipe-color-preview" style="background: ${combo.color}"></div>

            <div class="recipe-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Color: ${combo.color}</h3>
                    <span style="font-size: 0.875rem; color: #94a3b8;">${combo.type}</span>
                </div>

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

        // Add export button
        html += `
            <div style="margin: 1.5rem 0;">
                <button class="btn-secondary" id="export-recipe-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span>📋</span>
                    <span>Copy Recipe to Clipboard</span>
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

        // Add event listeners to sliders
        recipeContent.querySelectorAll('.percentage-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.handleSliderChange(e.target, combo);
            });
        });

        // Add event listener to export button
        const exportBtn = recipeContent.querySelector('#export-recipe-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportRecipe(combo);
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
     * Find alternative recipes for similar colors
     */
    findAlternativeRecipes(combo) {
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
    },

    /**
     * Close recipe panel
     */
    closeRecipe() {
        const recipePanel = document.getElementById('recipe-panel');
        const mainContent = document.querySelector('.main-content');

        recipePanel?.classList.remove('open');
        mainContent?.classList.remove('recipe-open');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
