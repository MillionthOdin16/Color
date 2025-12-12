/**
 * Color Mixing Engine
 * Uses spectral.js for scientifically accurate subtractive color mixing
 */

const ColorMixer = {
    /**
     * Mix two colors using spectral.js
     */
    mixTwo(color1, color2, ratio = 0.5) {
        // Ensure spectral is loaded
        if (typeof spectral === 'undefined') {
            console.warn('Spectral.js not loaded, using fallback');
            return this.mixTwoFallback(color1, color2, ratio);
        }

        try {
            const mixed = spectral.mix(color1, color2, ratio);
            return mixed;
        } catch (error) {
            console.error('Error in spectral mixing:', error);
            return this.mixTwoFallback(color1, color2, ratio);
        }
    },

    /**
     * Fallback RGB mixing (less accurate but works if spectral.js fails)
     */
    mixTwoFallback(color1, color2, ratio) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

        return this.rgbToHex(r, g, b);
    },

    /**
     * Mix three colors
     */
    mixThree(color1, color2, color3, percentages) {
        // Normalize percentages to sum to 1
        const total = percentages.reduce((a, b) => a + b, 0);
        const [p1, p2, p3] = percentages.map(p => p / total);

        // First mix color1 and color2 with their relative ratios
        const ratio12 = p2 / (p1 + p2);
        const mix12 = this.mixTwo(color1, color2, ratio12);

        // Then mix the result with color3
        const ratio3 = p3;
        return this.mixTwo(mix12, color3, ratio3);
    },

    /**
     * Mix four colors
     */
    mixFour(color1, color2, color3, color4, percentages) {
        // Normalize percentages
        const total = percentages.reduce((a, b) => a + b, 0);
        const [p1, p2, p3, p4] = percentages.map(p => p / total);

        // Mix first two
        const ratio12 = p2 / (p1 + p2);
        const mix12 = this.mixTwo(color1, color2, ratio12);

        // Mix last two
        const ratio34 = p4 / (p3 + p4);
        const mix34 = this.mixTwo(color3, color4, ratio34);

        // Mix the two results
        const ratioFinal = (p3 + p4) / total;
        return this.mixTwo(mix12, mix34, ratioFinal);
    },

    /**
     * Generate all possible 2-way combinations
     */
<<<<<<< HEAD
    generateTwoWayCombinations(filaments, activeFilaments, granularity = 5) {
=======
    generateTwoWayCombinations(filaments, activeFilaments) {
>>>>>>> origin/copilot/analyze-usability-changes
        const combinations = [];
        const active = filaments.filter(f => activeFilaments.has(f.id));

        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
<<<<<<< HEAD
                // Sample at specified granularity
                for (let pct = granularity; pct <= 100 - granularity; pct += granularity) {
=======
                // Sample at different ratios
                for (let pct = 10; pct <= 90; pct += 10) {
>>>>>>> origin/copilot/analyze-usability-changes
                    const ratio = pct / 100;
                    const mixedColor = this.mixTwo(
                        active[i].hexColor,
                        active[j].hexColor,
                        ratio
                    );

                    combinations.push({
                        id: `2-${active[i].id}-${active[j].id}-${pct}`,
                        type: '2-way',
                        color: mixedColor,
                        filaments: [active[i], active[j]],
                        percentages: [100 - pct, pct],
                        recipe: `${100 - pct}% ${active[i].colorName} + ${pct}% ${active[j].colorName}`
                    });
                }
            }
        }

        return combinations;
    },

    /**
     * Generate all possible 3-way combinations
     */
    generateThreeWayCombinations(filaments, activeFilaments) {
        const combinations = [];
        const active = filaments.filter(f => activeFilaments.has(f.id));

        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                for (let k = j + 1; k < active.length; k++) {
<<<<<<< HEAD
                    // Enhanced ratio samples with more granular options
                    const ratioSamples = [
                        // Equal parts
                        [33, 33, 34],
                        // One dominant
=======
                    // Sample various ratios (to keep it manageable)
                    const ratioSamples = [
                        [33, 33, 34],
>>>>>>> origin/copilot/analyze-usability-changes
                        [50, 25, 25],
                        [25, 50, 25],
                        [25, 25, 50],
                        [60, 20, 20],
                        [20, 60, 20],
<<<<<<< HEAD
                        [20, 20, 60],
                        [70, 15, 15],
                        [15, 70, 15],
                        [15, 15, 70],
                        // Graduated mixes
                        [40, 40, 20],
                        [40, 20, 40],
                        [20, 40, 40],
                        [45, 35, 20],
                        [45, 20, 35],
                        [35, 45, 20],
                        [35, 20, 45],
                        [20, 45, 35],
                        [20, 35, 45]
=======
                        [20, 20, 60]
>>>>>>> origin/copilot/analyze-usability-changes
                    ];

                    for (const percentages of ratioSamples) {
                        const mixedColor = this.mixThree(
                            active[i].hexColor,
                            active[j].hexColor,
                            active[k].hexColor,
                            percentages
                        );

                        combinations.push({
                            id: `3-${active[i].id}-${active[j].id}-${active[k].id}-${percentages.join('-')}`,
                            type: '3-way',
                            color: mixedColor,
                            filaments: [active[i], active[j], active[k]],
                            percentages: percentages,
                            recipe: `${percentages[0]}% ${active[i].colorName} + ${percentages[1]}% ${active[j].colorName} + ${percentages[2]}% ${active[k].colorName}`
                        });
                    }
                }
            }
        }

        return combinations;
    },

    /**
     * Generate all possible 4-way combinations
     */
    generateFourWayCombinations(filaments, activeFilaments) {
        const combinations = [];
        const active = filaments.filter(f => activeFilaments.has(f.id));

        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                for (let k = j + 1; k < active.length; k++) {
                    for (let l = k + 1; l < active.length; l++) {
<<<<<<< HEAD
                        // Enhanced ratio samples with more variations
                        const ratioSamples = [
                            // Equal parts
                            [25, 25, 25, 25],
                            // One dominant
                            [40, 20, 20, 20],
                            [20, 40, 20, 20],
                            [20, 20, 40, 20],
                            [20, 20, 20, 40],
                            [50, 20, 20, 10],
                            [50, 20, 10, 20],
                            [50, 10, 20, 20],
                            // Two dominant
                            [35, 35, 15, 15],
                            [35, 15, 35, 15],
                            [35, 15, 15, 35],
                            [40, 30, 20, 10],
                            [40, 30, 10, 20],
                            [40, 20, 30, 10],
                            [30, 40, 20, 10],
                            [30, 40, 10, 20]
=======
                        // Sample key ratios
                        const ratioSamples = [
                            [25, 25, 25, 25],
                            [40, 30, 20, 10],
                            [40, 20, 30, 10],
                            [40, 20, 10, 30],
                            [50, 20, 20, 10]
>>>>>>> origin/copilot/analyze-usability-changes
                        ];

                        for (const percentages of ratioSamples) {
                            const mixedColor = this.mixFour(
                                active[i].hexColor,
                                active[j].hexColor,
                                active[k].hexColor,
                                active[l].hexColor,
                                percentages
                            );

                            combinations.push({
                                id: `4-${active[i].id}-${active[j].id}-${active[k].id}-${active[l].id}-${percentages.join('-')}`,
                                type: '4-way',
                                color: mixedColor,
                                filaments: [active[i], active[j], active[k], active[l]],
                                percentages: percentages,
                                recipe: `${percentages[0]}% ${active[i].colorName} + ${percentages[1]}% ${active[j].colorName} + ${percentages[2]}% ${active[k].colorName} + ${percentages[3]}% ${active[l].colorName}`
                            });
                        }
                    }
                }
            }
        }

        return combinations;
    },

    /**
     * Generate all combinations based on filters
     */
<<<<<<< HEAD
    generateAllCombinations(filaments, activeFilaments, filters, granularity = 5) {
=======
    generateAllCombinations(filaments, activeFilaments, filters) {
>>>>>>> origin/copilot/analyze-usability-changes
        let combinations = [];

        if (filters.twoWay) {
            combinations = combinations.concat(
<<<<<<< HEAD
                this.generateTwoWayCombinations(filaments, activeFilaments, granularity)
=======
                this.generateTwoWayCombinations(filaments, activeFilaments)
>>>>>>> origin/copilot/analyze-usability-changes
            );
        }

        if (filters.threeWay) {
            combinations = combinations.concat(
                this.generateThreeWayCombinations(filaments, activeFilaments)
            );
        }

        if (filters.fourWay) {
            combinations = combinations.concat(
                this.generateFourWayCombinations(filaments, activeFilaments)
            );
        }

        return combinations;
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
     * Convert RGB to hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Convert hex to HSL
     */
    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
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

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    /**
     * Calculate color similarity (0-1)
     */
    colorSimilarity(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);

        const rDiff = rgb1.r - rgb2.r;
        const gDiff = rgb1.g - rgb2.g;
        const bDiff = rgb1.b - rgb2.b;

        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        const maxDistance = Math.sqrt(255 * 255 * 3);

        return 1 - (distance / maxDistance);
    },

    /**
     * Find closest color matches
     */
    findClosestMatches(targetColor, combinations, limit = 5) {
        return combinations
            .map(combo => ({
                ...combo,
                similarity: this.colorSimilarity(targetColor, combo.color)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }
};
