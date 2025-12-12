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
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
                btn.classList.toggle('active', !isVisible);
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
            // ? to show keyboard shortcuts
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
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

        // Help button
        document.getElementById('fab-help')?.addEventListener('click', () => {
            this.openShortcutsModal();
        });

        // Close shortcuts modal
        document.getElementById('close-shortcuts-modal')?.addEventListener('click', () => {
            this.closeShortcutsModal();
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
        ColorVisualizer.update(this.combinations, this.lightnessFilter, this.colorFilters);
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
            <div class="recipe-color-preview" style="background: ${combo.color}" title="Click to copy color code"></div>

            <div class="recipe-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0;">Color: ${combo.color}</h3>
                    <span style="font-size: 0.875rem; color: #94a3b8;">${combo.type}</span>
                </div>
                <button class="btn-copy-color" data-color="${combo.color}" style="width: 100%; margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); cursor: pointer; font-size: 0.875rem; transition: all var(--transition-fast);">
                    📋 Copy Color Code
                </button>

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
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
