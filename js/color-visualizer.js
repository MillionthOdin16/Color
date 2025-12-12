/**
 * Color Visualizer
 * Handles visualization of color combinations in 2D, 3D, and grid views
 */

const ColorVisualizer = {
    canvas: null,
    ctx: null,
    threeScene: null,
    threeCamera: null,
    threeRenderer: null,
    threeControls: null,
    currentView: '2d',
    combinations: [],
    lightnessFilter: 50,
    selectedColor: null,
    onColorClick: null,

    /**
     * Initialize visualizer
     */
    init() {
        this.canvas = document.getElementById('color-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvas();
        }

        this.setupEventListeners();
    },

    /**
     * Setup canvas size
     */
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas hover and click
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }

        // Resize handler
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    },

    /**
     * Update combinations data
     */
    update(combinations, lightnessFilter = 50) {
        this.combinations = combinations;
        this.lightnessFilter = lightnessFilter;
        this.render();
    },

    /**
     * Render current view
     */
    render() {
        switch (this.currentView) {
            case '2d':
                this.render2D();
                break;
            case '3d':
                this.render3D();
                break;
            case 'grid':
                this.renderGrid();
                break;
        }
    },

    /**
     * Render 2D color space map
     */
    render2D() {
        if (!this.ctx) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, width, height);

        if (this.combinations.length === 0) return;

        // Group combinations by position in color space
        const colorGrid = new Map();

        this.combinations.forEach(combo => {
            const hsl = ColorMixer.hexToHsl(combo.color);

            // Filter by lightness (with tolerance)
            const lightnessDiff = Math.abs(hsl.l - this.lightnessFilter);
            if (lightnessDiff > 15) return; // Skip colors too far from current lightness

            // Map to canvas position
            const x = Math.floor((hsl.h / 360) * width);
            const y = Math.floor((1 - hsl.s / 100) * height);

            const key = `${x},${y}`;

            if (!colorGrid.has(key)) {
                colorGrid.set(key, []);
            }

            colorGrid.get(key).push(combo);
        });

        // Draw points
        colorGrid.forEach((combos, key) => {
            const [x, y] = key.split(',').map(Number);

            // Use first combination's color
            const combo = combos[0];

            // Point size based on number of recipes for this color
            const size = Math.min(8, 3 + combos.length);

            // Opacity based on density
            const opacity = Math.min(1, 0.4 + (combos.length * 0.15));

            this.ctx.fillStyle = combo.color;
            this.ctx.globalAlpha = opacity;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Add a subtle glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
            gradient.addColorStop(0, combo.color);
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = opacity * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.globalAlpha = 1;

        // Draw axis labels
        this.drawAxisLabels();
    },

    /**
     * Draw axis labels
     */
    drawAxisLabels() {
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px Inter, sans-serif';

        // Hue labels
        this.ctx.fillText('Red', 10, this.canvas.height - 10);
        this.ctx.fillText('Yellow', this.canvas.width * 0.15, this.canvas.height - 10);
        this.ctx.fillText('Green', this.canvas.width * 0.35, this.canvas.height - 10);
        this.ctx.fillText('Cyan', this.canvas.width * 0.5, this.canvas.height - 10);
        this.ctx.fillText('Blue', this.canvas.width * 0.65, this.canvas.height - 10);
        this.ctx.fillText('Magenta', this.canvas.width * 0.85, this.canvas.height - 10);

        // Saturation labels
        this.ctx.save();
        this.ctx.translate(15, this.canvas.height - 30);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Saturation', 0, 0);
        this.ctx.restore();
    },

    /**
     * Handle canvas hover
     */
    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const combo = this.findCombinationAt(x, y);

        const tooltip = document.getElementById('hover-tooltip');

        if (combo) {
            tooltip.classList.add('visible');
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
            
            // Build enhanced tooltip with filament swatches
            const filamentSwatches = combo.filaments.map((f, i) => 
                `<div style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem;">
                    <div style="width: 12px; height: 12px; background: ${f.hexColor}; border-radius: 2px; border: 1px solid rgba(255,255,255,0.3);"></div>
                    <span style="color: #cbd5e1;">${combo.percentages[i]}% ${f.colorName}</span>
                </div>`
            ).join('');
            
            tooltip.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 32px; height: 32px; background: ${combo.color}; border-radius: 6px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                    <div>
                        <strong style="display: block; font-size: 0.875rem;">${combo.color}</strong>
                        <span style="font-size: 0.7rem; color: #94a3b8;">${combo.type}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    ${filamentSwatches}
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.7rem; color: #94a3b8; text-align: center;">
                    Click to view recipe
                </div>
            `;
            this.canvas.style.cursor = 'pointer';
        } else {
            tooltip.classList.remove('visible');
            this.canvas.style.cursor = 'crosshair';
        }
    },

    /**
     * Handle canvas click
     */
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const combo = this.findCombinationAt(x, y);

        if (combo && this.onColorClick) {
            this.onColorClick(combo);
        }
    },

    /**
     * Find combination at canvas position
     */
    findCombinationAt(x, y) {
        const hue = Math.floor((x / this.canvas.width) * 360);
        const saturation = Math.floor((1 - y / this.canvas.height) * 100);

        // Find closest combination
        let closest = null;
        let minDist = Infinity;

        this.combinations.forEach(combo => {
            const hsl = ColorMixer.hexToHsl(combo.color);

            // Filter by lightness
            const lightnessDiff = Math.abs(hsl.l - this.lightnessFilter);
            if (lightnessDiff > 15) return;

            const hueDist = Math.min(
                Math.abs(hsl.h - hue),
                360 - Math.abs(hsl.h - hue)
            );
            const satDist = Math.abs(hsl.s - saturation);

            const dist = Math.sqrt(hueDist * hueDist + satDist * satDist);

            if (dist < minDist && dist < 20) {
                minDist = dist;
                closest = combo;
            }
        });

        return closest;
    },

    /**
     * Render 3D color space
     */
    render3D() {
        if (!this.threeScene) {
            this.init3D();
        }

        // Clear existing points
        while (this.threeScene.children.length > 0) {
            this.threeScene.remove(this.threeScene.children[0]);
        }

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.threeScene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(5, 5, 5);
        this.threeScene.add(pointLight);

        // Create point cloud
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        this.combinations.forEach(combo => {
            const hsl = ColorMixer.hexToHsl(combo.color);

            // Convert HSL to cylindrical coordinates
            const h = (hsl.h * Math.PI) / 180;
            const s = hsl.s / 100;
            const l = hsl.l / 100;

            const x = s * Math.cos(h) * 2;
            const y = (l - 0.5) * 4;
            const z = s * Math.sin(h) * 2;

            positions.push(x, y, z);

            const rgb = ColorMixer.hexToRgb(combo.color);
            colors.push(rgb.r / 255, rgb.g / 255, rgb.b / 255);
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const points = new THREE.Points(geometry, material);
        this.threeScene.add(points);

        // Add axis helper
        const axesHelper = new THREE.AxesHelper(3);
        this.threeScene.add(axesHelper);

        // Render
        if (this.threeRenderer) {
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        }
    },

    /**
     * Initialize Three.js scene
     */
    init3D() {
        const container = document.getElementById('three-container');
        if (!container) return;

        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0x0f172a);

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.threeCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.threeCamera.position.set(3, 2, 3);

        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.threeRenderer.setSize(width, height);
        container.appendChild(this.threeRenderer.domElement);

        // Add orbit controls if available
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.threeControls = new THREE.OrbitControls(this.threeCamera, this.threeRenderer.domElement);
            this.threeControls.enableDamping = true;
            this.threeControls.dampingFactor = 0.05;
        }

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            if (this.threeControls) {
                this.threeControls.update();
            }
            if (this.threeRenderer && this.threeScene && this.threeCamera) {
                this.threeRenderer.render(this.threeScene, this.threeCamera);
            }
        };
        animate();
    },

    /**
     * Render grid view
     */
    renderGrid() {
        const gridContainer = document.getElementById('color-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        // Limit to reasonable number for performance
        const displayCombos = this.combinations.slice(0, 500);

        displayCombos.forEach(combo => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = combo.color;
            swatch.setAttribute('data-recipe', combo.recipe);

            swatch.addEventListener('click', () => {
                if (this.onColorClick) {
                    this.onColorClick(combo);
                }
            });

            gridContainer.appendChild(swatch);
        });
    },

    /**
     * Switch view
     */
    switchView(view) {
        this.currentView = view;

        // Hide all containers
        document.querySelectorAll('.viz-container').forEach(container => {
            container.classList.remove('active');
        });

        // Show selected container
        const container = document.getElementById(`viz-${view}`);
        if (container) {
            container.classList.add('active');
        }

        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`.toggle-btn[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.render();
    }
};
