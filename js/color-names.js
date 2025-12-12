/**
 * Color Naming System
 * Generates human-readable names for colors based on their HSL values
 */

const ColorNamer = {
    /**
     * Get a descriptive name for a color
     */
    getColorName(hexColor) {
        const hsl = ColorMixer.hexToHsl(hexColor);
        
        // Generate name components
        const lightnessMod = this.getLightnessMod(hsl.l);
        const saturationMod = this.getSaturationMod(hsl.s);
        const baseName = this.getBaseName(hsl.h);
        
        // Construct name
        let name = '';
        
        if (lightnessMod) {
            name += lightnessMod + ' ';
        }
        
        if (saturationMod) {
            name += saturationMod + ' ';
        }
        
        name += baseName;
        
        return name;
    },

    /**
     * Get lightness modifier
     */
    getLightnessMod(lightness) {
        if (lightness <= 10) return 'Very Dark';
        if (lightness <= 25) return 'Dark';
        if (lightness >= 90) return 'Very Light';
        if (lightness >= 75) return 'Light';
        return '';
    },

    /**
     * Get saturation modifier
     */
    getSaturationMod(saturation) {
        if (saturation <= 10) return 'Grayish';
        if (saturation <= 25) return 'Muted';
        if (saturation >= 90) return 'Vivid';
        if (saturation >= 75) return 'Bright';
        return '';
    },

    /**
     * Get base color name from hue
     */
    getBaseName(hue) {
        // Handle grayscale
        if (hue === 0) return 'Gray';
        
        // Define color ranges
        if (hue >= 0 && hue < 15) return 'Red';
        if (hue >= 15 && hue < 45) return 'Orange';
        if (hue >= 45 && hue < 70) return 'Yellow';
        if (hue >= 70 && hue < 150) return 'Green';
        if (hue >= 150 && hue < 200) return 'Cyan';
        if (hue >= 200 && hue < 260) return 'Blue';
        if (hue >= 260 && hue < 300) return 'Purple';
        if (hue >= 300 && hue < 330) return 'Magenta';
        if (hue >= 330 && hue < 360) return 'Pink';
        
        return 'Red'; // Wrap around
    },

    /**
     * Get a more detailed name with secondary hue
     */
    getDetailedName(hexColor) {
        const hsl = ColorMixer.hexToHsl(hexColor);
        
        // For very low saturation, use grayscale names
        if (hsl.s <= 10) {
            if (hsl.l <= 15) return 'Black';
            if (hsl.l <= 35) return 'Dark Gray';
            if (hsl.l <= 65) return 'Gray';
            if (hsl.l <= 85) return 'Light Gray';
            return 'White';
        }
        
        // Get detailed color name
        const lightnessMod = this.getLightnessMod(hsl.l);
        const saturationMod = this.getSaturationMod(hsl.s);
        const baseName = this.getDetailedBaseName(hsl.h);
        
        let name = '';
        
        if (lightnessMod) {
            name += lightnessMod + ' ';
        }
        
        if (saturationMod) {
            name += saturationMod + ' ';
        }
        
        name += baseName;
        
        return name;
    },

    /**
     * Get detailed base name with secondary hues
     */
    getDetailedBaseName(hue) {
        // More granular color names
        if (hue >= 0 && hue < 8) return 'Red';
        if (hue >= 8 && hue < 15) return 'Red-Orange';
        if (hue >= 15 && hue < 30) return 'Orange';
        if (hue >= 30 && hue < 45) return 'Yellow-Orange';
        if (hue >= 45 && hue < 60) return 'Yellow';
        if (hue >= 60 && hue < 70) return 'Yellow-Green';
        if (hue >= 70 && hue < 100) return 'Green';
        if (hue >= 100 && hue < 130) return 'Green';
        if (hue >= 130 && hue < 150) return 'Cyan-Green';
        if (hue >= 150 && hue < 180) return 'Cyan';
        if (hue >= 180 && hue < 200) return 'Blue-Cyan';
        if (hue >= 200 && hue < 240) return 'Blue';
        if (hue >= 240 && hue < 260) return 'Blue-Purple';
        if (hue >= 260 && hue < 280) return 'Purple';
        if (hue >= 280 && hue < 300) return 'Purple-Magenta';
        if (hue >= 300 && hue < 320) return 'Magenta';
        if (hue >= 320 && hue < 330) return 'Pink-Magenta';
        if (hue >= 330 && hue < 345) return 'Pink';
        if (hue >= 345 && hue < 360) return 'Pink-Red';
        
        return 'Red';
    }
};
