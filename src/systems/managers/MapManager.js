import Phaser from 'phaser';
import BuildSite from '../../entities/towers/BuildSite.js';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.paths = [];
        this.buildSites = scene.add.group();
    }

    createMap(levelData, theme) {
        const grid = levelData.mapGrid;
        if (!grid) return;
        
        const TILE_SIZE = 64; 
        const offsetX = 0; 
        const offsetY = 120;
        const graphics = this.scene.add.graphics();
        
        this.paths = []; 
        let startPoints = [];

        // Dibujar Grilla
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cell = grid[row][col];
                const x = col * TILE_SIZE + (TILE_SIZE/2) + offsetX;
                const y = row * TILE_SIZE + (TILE_SIZE/2) + offsetY;
                
                // Suelo (0, 3-5)
                if ([0, 3, 4, 5].includes(cell)) {
                    this.drawTile(x, y, cell, 'tile_0', theme.bg, graphics, TILE_SIZE);
                } 
                // Camino (1, 6-10)
                else if ([1, 6, 7, 8, 9, 10].includes(cell)) {
                    this.drawTile(x, y, cell, 'tile_1', theme.path, graphics, TILE_SIZE);
                    if (col === 0) startPoints.push({c: col, r: row, x, y}); // Inicio del camino
                } 
                // Sitio de Construcción (2)
                else if (cell === 2) {
                    this.drawTile(x, y, 0, 'tile_0', theme.bg, graphics, TILE_SIZE);
                    const site = new BuildSite(this.scene, x, y);
                    this.buildSites.add(site);
                    // El evento pointerdown se delegará en InputManager
                }
            }
        }

        // Generar Caminos (Pathfinding simplificado)
        this.generatePaths(startPoints, grid, TILE_SIZE, offsetX, offsetY);
    }

    drawTile(x, y, cell, defaultKey, color, graphics, size) {
        const key = this.scene.textures.exists(`tile_${cell}`) ? `tile_${cell}` : defaultKey;
        if (this.scene.textures.exists(key)) {
            this.scene.add.image(x, y, key).setDisplaySize(size, size);
        } else {
            graphics.fillStyle(color, 1);
            graphics.fillRect(x - size/2, y - size/2, size, size);
        }
    }

    generatePaths(startPoints, grid, tileSize, offX, offY) {
        // ... (Aquí va la lógica de pathfinding que ya tenías en GameScene, movida tal cual)
        // Por brevedad, asumo que copias el bloque del loop 'startPoints.forEach' aquí.
        // Si no, puedo pasarte el bloque completo.
        
        // --- COPIA EXACTA DE TU LÓGICA DE PATHS ---
        const validPathCells = [1, 6, 7, 8, 9, 10]; 
        let globalVisited = new Set();

        startPoints.forEach((startPoint, index) => {
            const path = new Phaser.Curves.Path(startPoint.x, startPoint.y);
            let current = startPoint; 
            let visited = new Set();
            visited.add(`${current.c},${current.r}`); globalVisited.add(`${current.c},${current.r}`);
            
            // Indicador visual
            this.createSpawnIndicator(startPoint.x, startPoint.y, index + 1);
            
            let steps = 0; let finished = false;
            while (steps < 300 && !finished) {
                const neighbors = [{c: current.c+1, r: current.r}, {c: current.c, r: current.r+1}, {c: current.c, r: current.r-1}, {c: current.c-1, r: current.r}];
                let foundNext = false;
                for (let n of neighbors) {
                    if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length) {
                        const cellVal = grid[n.r][n.c];
                        if (validPathCells.includes(cellVal) && !globalVisited.has(`${n.c},${n.r}`)) {
                            const nx = n.c * tileSize + (tileSize/2) + offX; 
                            const ny = n.r * tileSize + (tileSize/2) + offY;
                            path.lineTo(nx, ny); 
                            visited.add(`${n.c},${n.r}`); globalVisited.add(`${n.c},${n.r}`);
                            current = {c: n.c, r: n.r, x: nx, y: ny}; foundNext = true; break; 
                        }
                    }
                }
                if (!foundNext) finished = true; 
                steps++;
            }
            this.paths.push(path);
        });
    }

    createSpawnIndicator(x, y, num) {
        const marker = this.scene.add.circle(x, y, 20, 0xff0000);
        this.scene.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 });
        this.scene.add.text(x, y - 40, `RUTA ${num}`, { fontSize: '14px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5);
    }
}