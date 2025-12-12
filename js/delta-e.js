/**
 * Delta E Color Difference Calculator
 * Implements CIEDE2000 for more accurate color difference measurement
 */

const DeltaE = {
    /**
     * Convert RGB to LAB color space
     */
    rgbToLab(r, g, b) {
        // Normalize RGB values
        r = r / 255;
        g = g / 255;
        b = b / 255;

        // Apply gamma correction
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        // Convert to XYZ
        let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

        // Normalize for D65 white point
        x = x / 0.95047;
        y = y / 1.00000;
        z = z / 1.08883;

        // Convert XYZ to LAB
        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

        const L = 116 * y - 16;
        const a = 500 * (x - y);
        const b_val = 200 * (y - z);

        return { L, a, b: b_val };
    },

    /**
     * Convert hex color to LAB
     */
    hexToLab(hex) {
        const rgb = ColorMixer.hexToRgb(hex);
        return this.rgbToLab(rgb.r, rgb.g, rgb.b);
    },

    /**
     * Calculate Delta E 2000 (CIEDE2000) - the most accurate color difference metric
     */
    deltaE2000(hex1, hex2) {
        const lab1 = this.hexToLab(hex1);
        const lab2 = this.hexToLab(hex2);

        // Calculate C (chroma) and h (hue) for both colors
        const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
        const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);

        const C_avg = (C1 + C2) / 2;

        const G = 0.5 * (1 - Math.sqrt(Math.pow(C_avg, 7) / (Math.pow(C_avg, 7) + Math.pow(25, 7))));

        const a1_prime = lab1.a * (1 + G);
        const a2_prime = lab2.a * (1 + G);

        const C1_prime = Math.sqrt(a1_prime * a1_prime + lab1.b * lab1.b);
        const C2_prime = Math.sqrt(a2_prime * a2_prime + lab2.b * lab2.b);

        let h1_prime = Math.atan2(lab1.b, a1_prime) * 180 / Math.PI;
        if (h1_prime < 0) h1_prime += 360;

        let h2_prime = Math.atan2(lab2.b, a2_prime) * 180 / Math.PI;
        if (h2_prime < 0) h2_prime += 360;

        // Calculate differences
        const delta_L_prime = lab2.L - lab1.L;
        const delta_C_prime = C2_prime - C1_prime;

        let delta_h_prime;
        if (C1_prime * C2_prime === 0) {
            delta_h_prime = 0;
        } else {
            delta_h_prime = h2_prime - h1_prime;
            if (delta_h_prime > 180) {
                delta_h_prime -= 360;
            } else if (delta_h_prime < -180) {
                delta_h_prime += 360;
            }
        }

        const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(delta_h_prime * Math.PI / 360);

        // Calculate averages
        const L_prime_avg = (lab1.L + lab2.L) / 2;
        const C_prime_avg = (C1_prime + C2_prime) / 2;

        let h_prime_avg;
        if (C1_prime * C2_prime === 0) {
            h_prime_avg = h1_prime + h2_prime;
        } else {
            h_prime_avg = (h1_prime + h2_prime) / 2;
            if (Math.abs(h1_prime - h2_prime) > 180) {
                if (h_prime_avg < 180) {
                    h_prime_avg += 180;
                } else {
                    h_prime_avg -= 180;
                }
            }
        }

        // Calculate weighting factors
        const T = 1
            - 0.17 * Math.cos((h_prime_avg - 30) * Math.PI / 180)
            + 0.24 * Math.cos(2 * h_prime_avg * Math.PI / 180)
            + 0.32 * Math.cos((3 * h_prime_avg + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * h_prime_avg - 63) * Math.PI / 180);

        const S_L = 1 + (0.015 * Math.pow(L_prime_avg - 50, 2)) / Math.sqrt(20 + Math.pow(L_prime_avg - 50, 2));
        const S_C = 1 + 0.045 * C_prime_avg;
        const S_H = 1 + 0.015 * C_prime_avg * T;

        const delta_theta = 30 * Math.exp(-Math.pow((h_prime_avg - 275) / 25, 2));
        const R_C = 2 * Math.sqrt(Math.pow(C_prime_avg, 7) / (Math.pow(C_prime_avg, 7) + Math.pow(25, 7)));
        const R_T = -R_C * Math.sin(2 * delta_theta * Math.PI / 180);

        // Calculate Delta E 2000
        const deltaE = Math.sqrt(
            Math.pow(delta_L_prime / S_L, 2) +
            Math.pow(delta_C_prime / S_C, 2) +
            Math.pow(delta_H_prime / S_H, 2) +
            R_T * (delta_C_prime / S_C) * (delta_H_prime / S_H)
        );

        return deltaE;
    },

    /**
     * Calculate a similarity score from Delta E (0-1, where 1 is identical)
     */
    similarityFromDeltaE(deltaE) {
        // Delta E < 1 is imperceptible
        // Delta E 1-2 is very slight
        // Delta E 2-10 is noticeable
        // Delta E > 10 is significant difference

        // Convert to similarity score (exponential decay)
        return Math.exp(-deltaE / 15);
    },

    /**
     * Find closest color matches using Delta E 2000
     */
    findClosestMatches(targetHex, combinations, limit = 10) {
        return combinations
            .map(combo => {
                const deltaE = this.deltaE2000(targetHex, combo.color);
                const similarity = this.similarityFromDeltaE(deltaE);

                return {
                    ...combo,
                    deltaE: deltaE,
                    similarity: similarity
                };
            })
            .sort((a, b) => a.deltaE - b.deltaE)
            .slice(0, limit);
    }
};
