# 🎨 Filament Color Mixer

A web application that helps you discover what colors you can create by mixing your 3D printing filaments. Built specifically for use with filament color mixing systems from MakerWorld models 460079, 912395, and 1079318.

![Screenshot](screenshot.png)

## Features

### 🌈 Color Discovery
- **Forward-focused approach**: See what colors you CAN make from your filament inventory
- **Multiple mixing modes**: 2-way, 3-way, and 4-way color combinations
- **Scientifically accurate**: Uses Kubelka-Munk theory via spectral.js for realistic subtractive color mixing

### 📊 Multiple Visualization Modes
- **2D Color Map**: Interactive HSL color space projection with density heatmap
- **3D Color Space**: Immersive 3D visualization with rotating color point cloud
- **Grid View**: Traditional swatch grid for quick browsing

### 🎯 Smart Features
- **Real filament data**: Integration with FilamentColors.xyz API (3000+ real filament colors)
- **Target color search**: Find recipes to match a specific color you want
- **Interactive recipes**: Adjust mixing percentages in real-time with sliders
- **Alternative suggestions**: Discover similar colors with different recipes
- **Persistent storage**: Your filament inventory is saved locally

### 🚀 User Experience
- **Modern, dark UI**: Beautiful gradient-based design with smooth animations
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Fast**: Client-side processing for instant results
- **No backend required**: Runs entirely in your browser

## How It Works

### The Science
3D printer filament mixing uses **subtractive color mixing** (like paint), not additive RGB mixing (like light). This app uses the **Kubelka-Munk theory** to accurately predict how pigments blend when printed together.

### The Process
1. Add your available filaments (search real filaments or enter manually)
2. The app generates ALL possible color combinations
3. Visualize achievable colors in 2D/3D color space
4. Click any color to see the exact recipe
5. Adjust mixing percentages to fine-tune colors

### MakerWorld Models
This app is designed for use with filament mixer models from MakerWorld:

- **Model 460079** (jetpad): 2-4 color uniform mixing
- **Model 912395** (Molodos): Multi-color filament creator
- **Model 1079318** (fmod): Comprehensive mixing and multi-color system

When you print these models and set your mixing ratios, this app helps you know exactly what color you'll get!

## Getting Started

### Option 1: Open Locally
1. Clone this repository
2. Open `index.html` in a modern web browser
3. No build process or server required!

### Option 2: Use Sample Data
1. Click "Load Sample Set" to add 10 sample filaments
2. Explore ~500+ possible color combinations
3. Click colors to see recipes

### Option 3: Add Your Own Filaments
1. Click "Add Filament"
2. Search FilamentColors.xyz or enter manually
3. See your achievable color space update in real-time

## Usage Guide

### Adding Filaments
- **Search**: Type brand/color (e.g., "Bambu Lab Blue") to search real filament database
- **Manual**: Enter brand, material, color name, and hex code manually
- **Samples**: Load 10 pre-configured sample filaments

### Viewing Colors
- **2D Map**: Shows achievable colors in Hue × Saturation space
  - Adjust lightness slider to explore different brightness levels
  - Point size/density indicates number of recipes for that color
- **3D Space**: Rotate and zoom through full HSL cylinder
  - Drag to rotate, scroll to zoom
  - Each point is a unique achievable color
- **Grid View**: Traditional color swatches for quick browsing

### Creating Recipes
1. Click any color in the visualization
2. Recipe panel opens showing exact percentages
3. Adjust sliders to modify ratios in real-time
4. See color preview update instantly
5. View alternative recipes for similar colors

### Filtering
- Toggle 2-way, 3-way, 4-way mixes on/off
- Uncheck filaments to exclude them from combinations
- Filter by lightness in 2D view

### Target Color Search
1. Click the 🎯 button in bottom-right
2. Pick or enter your target color
3. See top 10 closest matches with similarity scores
4. Click any match to view its recipe

## Technical Details

### Technologies
- **Vanilla JavaScript** - No frameworks, just clean ES6+
- **spectral.js** - Kubelka-Munk color mixing implementation
- **Three.js** - 3D visualization
- **FilamentColors.xyz API** - Real filament color database
- **HTML5 Canvas** - 2D color space rendering
- **LocalStorage** - Persistent data storage

### Browser Requirements
- Modern browser with ES6+ support (Chrome, Firefox, Safari, Edge)
- Canvas 2D API support
- WebGL support (for 3D view)
- LocalStorage enabled

### Performance
- **4 filaments**: ~330 combinations (instant)
- **10 filaments**: ~23,500 combinations (~500ms)
- Optimized canvas rendering for smooth 60fps

### Color Mixing Algorithm
The app uses a hierarchical mixing approach:
- **2-way**: Direct spectral.js mixing at various ratios
- **3-way**: Mix first two colors, then mix result with third
- **4-way**: Mix pairs, then mix the two results

This approximates physical pigment mixing while keeping calculations fast.

## Project Structure

```
/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Styling with modern dark theme
├── js/
│   ├── app.js             # Main application orchestrator
│   ├── filament-manager.js # Filament inventory CRUD
│   ├── api-client.js      # FilamentColors.xyz API
│   ├── color-mixer.js     # Color mixing engine
│   ├── color-visualizer.js # 2D/3D/grid visualization
│   └── storage.js         # LocalStorage wrapper
└── README.md              # This file
```

## Contributing

Contributions welcome! Some ideas:
- Additional visualization modes
- Export recipes to PDF/JSON
- Import/export filament inventory
- Color naming algorithm
- Suggest filaments to expand color range
- Integration with other filament databases

## Credits

### APIs & Libraries
- [spectral.js](https://github.com/rvanwijnen/spectral.js) by rvanwijnen - Kubelka-Munk color mixing
- [FilamentColors.xyz](https://filamentcolors.xyz) - Real filament color database
- [Three.js](https://threejs.org/) - 3D graphics library

### MakerWorld Models
- **460079**: Multi Color Filament Mixer by jetpad
- **912395**: Multicolor filament V2 by Molodos
- **1079318**: Multi Color Filament 80g by fmod

### Research
- [Paint Mixing Theory for Custom Filament Colors - Hackaday](https://hackaday.com/2025/04/28/paint-mixing-theory-for-custom-filament-colors/)
- [SpecOptiBlend Software](https://www.fabbaloo.com/news/specoptiblend-software-solves-color-challenges-in-diy-filament-recycling)

## License

MIT License - feel free to use, modify, and distribute

## Author

Built with creativity and attention to detail for the 3D printing community.

---

**Happy mixing! 🎨🖨️**
