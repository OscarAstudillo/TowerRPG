// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import Loot from '../entities/items/Loot.js';
import { gameState, updatePlayerStats, getCurrentHero, TOWER_COSTS } from '../config/GameState.js'; 
import { TOWER_TYPES } from '../config/TowerStats.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import { BIOMES, getLevelData } from '../config/Levels.js'; 
import { BIOME_ENEMIES } from '../config/Enemies.js';
import SoundManager from '../systems/SoundManager.js'; 

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.selectedTowerIndex = 0; 
        this.coins = 5000; 
        this.selectedTowerToUpgrade = null; 
        this.timeToNextWave = 0; 
        this.isTimerRunning = false;
        this.isPaused = false;
        this.isSceneReady = false;
        
        // Orden y nombres cortos
        this.towerOrder = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
        this.towerDisplayNames = {
            'archer': 'ARQUERO',
            'cannon': 'CAÑON',
            'mage': 'MAGO',
            'tesla': 'TESLA',
            'poison': 'VENENO',
            'quake': 'TERREMOTO'
        };
    }

    init(data) {
        this.level = data.level || 1;
        this.biome = data.biome || 'forest';
        this.config = data.config || {}; 
        
        this.currentLevelData = getLevelData(this.biome, this.level);
        
        const biomeInfo = BIOMES[this.biome] || BIOMES.forest;
        this.theme = { 
            bg: biomeInfo.color, 
            path: biomeInfo.pathColor, 
            accent: 0xffffff, 
            grid: 0x000000 
        };

        if (!gameState.playerStats) updatePlayerStats();
        const hero = getCurrentHero();
        this.lastHeroLevel = hero ? hero.level : 1;
        
        // --- CORRECCIÓN IMPORTANTE: RESETEAR ESTADOS ---
        this.isSceneReady = false; 
        this.isPaused = false;
        this.time.paused = false; // Asegurar que el reloj no esté pausado de una sesión anterior
        // -----------------------------------------------

        this.totalWaves = this.currentLevelData.waves || 3;
        this.hpMultiplier = this.currentLevelData.hpMult || 1;
        this.spawnMult = 1;
        this.isBossWave = false;
        this.bossSpawned = false;
        
        this.paths = []; 
    }

    create() {
        updatePlayerStats(); 
        
        if (!this.textures.exists('pixel')) {
            const graphics = this.make.graphics({x: 0, y: 0, add: false});
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('pixel', 4, 4);
        }

        this.explosionEmitter = this.add.particles(0, 0, 'pixel', {
            speed: { min: 50, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 0,
            emitting: false,
            blendMode: 'ADD'
        }).setDepth(900);

        this.hitEmitter = this.add.particles(0, 0, 'pixel', {
            speed: { min: 20, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            emitting: false,
            blendMode: 'ADD'
        }).setDepth(900);

        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true, maxSize: 200 });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: false });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.cameras.main.setBackgroundColor(this.theme.bg);
        const w = this.scale.width;
        const h = this.scale.height;
        this.physics.world.setBounds(0, 0, w, h); 

        this.coins = 500 + (this.level * 50); 
        this.currentWave = 0; 
        this.waveInProgress = false;
        this.sessionLoot = {}; 
        gameState.baseHp = 20;

        this.createMapFromGrid();
        this.createUpgradeUI(); 
        this.createUI(); 
        this.createPauseMenu();

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        this.player = new Player(this, centerX, centerY, gameState.selectedClass, this.enemies, this.projectiles);
        
        // --- INPUTS: Limpiar antes de agregar para evitar duplicados ---
        this.input.keyboard.removeAllListeners(); 
        
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        
        this.input.keyboard.on('keydown-ONE', () => this.selectTower(0));
        this.input.keyboard.on('keydown-TWO', () => this.selectTower(1));
        this.input.keyboard.on('keydown-THREE', () => this.selectTower(2));
        this.input.keyboard.on('keydown-FOUR', () => this.selectTower(3));
        this.input.keyboard.on('keydown-FIVE', () => this.selectTower(4));
        this.input.keyboard.on('keydown-SIX', () => this.selectTower(5));

        this.input.on('gameobjectdown', (pointer, obj) => {
            if (this.isPaused) return; 
            let tower = this.getTowerFromObject(obj);
            if (tower) { 
                pointer.event.stopPropagation(); 
                this.openUpgradeMenu(tower); 
            } 
        });

        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (this.isPaused) return;
            
            const clickedOnUI = currentlyOver.some(obj => 
                (this.upgradeContainer && this.upgradeContainer.visible && (obj === this.upgradeContainer || obj.parentContainer === this.upgradeContainer)) ||
                (this.towerSelectorContainer && (obj === this.towerSelectorContainer || obj.parentContainer === this.towerSelectorContainer)) ||
                (this.skillBtnContainer && (obj === this.skillBtnContainer || obj.parentContainer === this.skillBtnContainer))
            );

            if (this.upgradeContainer && this.upgradeContainer.visible) {
                const clickedOnTower = currentlyOver.some(obj => this.getTowerFromObject(obj) !== null);
                if (!clickedOnUI && !clickedOnTower) {
                    this.closeUpgradeMenu();
                }
            }
            
            if (!clickedOnUI && pointer.y > 100 && pointer.y < (this.scale.height - 140)) { 
                const clickedOnInteractive = currentlyOver.length > 0;
                if (!clickedOnInteractive && this.player && this.player.setTarget) {
                    this.player.setTarget(pointer.x, pointer.y);
                }
            }
        });

        this.physics.add.overlap(this.enemies, this.projectiles, (e, p) => { 
            if(e.active && p.active) { 
                if(p.hit) p.hit(e); 
                else { e.takeDamage(p.damage||10); if(p.recycle) p.recycle(); else p.destroy(); }
            } 
        });
        this.physics.add.overlap(this.player, this.loots, (p, l) => this.collectLoot(l));

        this.startWaveTimer(20); 
        this.updateUI();
        this.isSceneReady = true;
    }

    // --- LIMPIEZA DE ESCENA (NUEVO) ---
    // Este método asegura que todo se apague correctamente al salir
    cleanUpScene() {
        this.isPaused = false;
        this.time.paused = false; // CRÍTICO: Reactivar el reloj interno
        this.physics.resume();
        this.tweens.resumeAll();
        
        if (this.spawnTimer) this.spawnTimer.remove();
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
    }

    selectTower(index) {
        if (this.isPaused) return;
        if (index < 0 || index >= this.towerOrder.length) return;
        this.selectedTowerIndex = index;
        this.selectedTowerType = this.towerOrder[index];
        this.updateUI(); 
    }

    createMapFromGrid() {
        const grid = this.currentLevelData.mapGrid;
        if (!grid) return;

        const TILE_SIZE = 64;
        const offsetX = 0; 
        const offsetY = 120; 

        const graphics = this.add.graphics();
        this.paths = []; 
        let startPoints = []; 

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cell = grid[row][col];
                const x = col * TILE_SIZE + (TILE_SIZE/2) + offsetX;
                const y = row * TILE_SIZE + (TILE_SIZE/2) + offsetY;

                if (cell === 0 || cell === 3 || cell === 4 || cell === 5) {
                    const tileKey = `tile_${cell}`;
                    if (this.textures.exists(tileKey)) this.add.image(x, y, tileKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else if (this.textures.exists('tile_0')) this.add.image(x, y, 'tile_0').setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else { graphics.fillStyle(this.theme.bg, 1); graphics.fillRect(col * TILE_SIZE + offsetX, row * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE); }
                }
                else if (cell === 1 || (cell >= 6 && cell <= 10)) {
                    const tileKey = `tile_${cell}`;
                    if (this.textures.exists(tileKey)) this.add.image(x, y, tileKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else if (this.textures.exists('tile_1')) this.add.image(x, y, 'tile_1').setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else { graphics.fillStyle(this.theme.path, 1); graphics.fillRect(col * TILE_SIZE + offsetX, row * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE); }
                    if (col === 0) startPoints.push({c: col, r: row, x, y});
                } 
                else if (cell === 2) { 
                    if (this.textures.exists('tile_0')) this.add.image(x, y, 'tile_0').setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else { graphics.fillStyle(this.theme.bg, 1); graphics.fillRect(col * TILE_SIZE + offsetX, row * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE); }
                    const site = new BuildSite(this, x, y);
                    this.buildSites.add(site);
                    site.on('pointerdown', () => this.tryBuildTower(site));
                }
            }
        }

        if (startPoints.length === 0) {
            for (let r=0; r<grid.length; r++) {
                for (let c=0; c<grid[0].length; c++) {
                    if (grid[r][c] === 1 || (grid[r][c] >= 6 && grid[r][c] <= 10)) {
                        const x = c * TILE_SIZE + (TILE_SIZE/2) + offsetX;
                        const y = r * TILE_SIZE + (TILE_SIZE/2) + offsetY;
                        startPoints.push({c:c, r:r, x, y}); break; 
                    }
                }
                if(startPoints.length > 0) break;
            }
        }

        let globalVisited = new Set();
        const validPathCells = [1, 6, 7, 8, 9, 10]; 

        startPoints.forEach((startPoint, index) => {
            const path = new Phaser.Curves.Path(startPoint.x, startPoint.y);
            let current = startPoint;
            let visited = new Set();
            visited.add(`${current.c},${current.r}`);
            globalVisited.add(`${current.c},${current.r}`);
            this.createSpawnIndicator(startPoint.x, startPoint.y, index + 1);

            let steps = 0;
            let finished = false;
            while (steps < 300 && !finished) {
                const neighbors = [{c: current.c+1, r: current.r}, {c: current.c, r: current.r+1}, {c: current.c, r: current.r-1}, {c: current.c-1, r: current.r}];
                let foundNext = false;
                for (let n of neighbors) {
                    if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length) {
                        const cellVal = grid[n.r][n.c];
                        if (validPathCells.includes(cellVal) && !globalVisited.has(`${n.c},${n.r}`)) {
                            const nx = n.c * TILE_SIZE + (TILE_SIZE/2) + offsetX;
                            const ny = n.r * TILE_SIZE + (TILE_SIZE/2) + offsetY;
                            path.lineTo(nx, ny);
                            visited.add(`${n.c},${n.r}`); globalVisited.add(`${n.c},${n.r}`);
                            current = {c: n.c, r: n.r, x: nx, y: ny}; foundNext = true; break; 
                        }
                    }
                }
                if (!foundNext) {
                    for (let n of neighbors) {
                        if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length) {
                             const cellVal = grid[n.r][n.c];
                             if (validPathCells.includes(cellVal) && globalVisited.has(`${n.c},${n.r}`) && !visited.has(`${n.c},${n.r}`)) {
                                const nx = n.c * TILE_SIZE + (TILE_SIZE/2) + offsetX;
                                const ny = n.r * TILE_SIZE + (TILE_SIZE/2) + offsetY;
                                path.lineTo(nx, ny); finished = true; foundNext = true; break;
                            }
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
        const marker = this.add.circle(x, y, 20, 0xff0000); 
        this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); 
        this.add.text(x, y - 40, `RUTA ${num}`, { fontSize: '14px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); 
    }

    update(time, delta) {
        if (this.isPaused || !this.isSceneReady) return;

        if (this.player) this.player.update(time, delta);
        if (this.towers) { this.towers.children.iterate(t => { if (t && t.active) t.update(time, delta); }); }
        
        const hero = getCurrentHero();
        if (hero && hero.level > this.lastHeroLevel) {
            this.showLevelUpEffect();
            this.lastHeroLevel = hero.level;
        }

        this.updateUI(); 
        this.updateSkillUI();
        
        if (this.isTimerRunning) {
            this.timeToNextWave -= delta;
            if (this.timeToNextWave <= 0) {
                this.startWave();
            } else if (this.waveTimerBtnText) {
                this.waveTimerBtnText.setText(`SIGUIENTE OLEADA: ${Math.ceil(this.timeToNextWave/1000)}s\n(Clic para iniciar)`);
            }
        }
        
        this.checkWaveStatus();
    }

    generateLoot(x, y, matKey, qty) {
        const rarity = RPGSystem.getDynamicRarity(this.level);
        if (!gameState.materials[matKey]) gameState.materials[matKey] = { common: 0, uncommon: 0, rare: 0, epic:0, legendary:0 };
        gameState.materials[matKey][rarity] += qty;
        if (!this.sessionLoot[matKey]) this.sessionLoot[matKey] = { common: 0 };
        if (!this.sessionLoot[matKey][rarity]) this.sessionLoot[matKey][rarity] = 0;
        this.sessionLoot[matKey][rarity] += qty;
        const item = new Loot(this, x, y, matKey, rarity);
        this.loots.add(item);
    }
    startWaveTimer(seconds) { this.isTimerRunning = true; this.timeToNextWave = seconds * 1000; if (this.waveTimerContainer) this.waveTimerContainer.setVisible(true); }
    startNextWaveAction() { if (this.isTimerRunning) this.startWave(); }
    startWave() {
        this.isTimerRunning = false; 
        if(this.waveTimerContainer) this.waveTimerContainer.setVisible(false);
        this.waveActive = true;
        this.currentWave++;
        this.isBossWave = (this.currentWave === this.totalWaves);
        this.bossSpawned = false;
        if(this.waveInfoText) {
            this.waveInfoText.setText(this.isBossWave ? "¡JEFE FINAL!" : `OLEADA: ${this.currentWave}/${this.totalWaves}`);
            if(this.isBossWave) this.waveInfoText.setColor('#ff0000');
        }
        let baseCount = 8 + (this.currentWave * 3); 
        let totalEnemies = Math.ceil(baseCount * this.spawnMult);
        let spawnDelay = 1000 - (this.currentWave * 50); 
        if (spawnDelay < 200) spawnDelay = 200; 
        if (this.isBossWave) { this.showFloatingText(this.scale.width/2, this.scale.height/2, "¡JEFE FINAL!", "#ff0000", 2000); totalEnemies = 5; }
        let spawned = 0;
        this.spawnTimer = this.time.addEvent({ delay: spawnDelay, repeat: totalEnemies - 1, callback: () => {
                let targetPathIndex = 0; const pathCount = this.paths.length;
                if (pathCount > 1) { if (this.currentWave === 1) targetPathIndex = 0; else if (this.currentWave === 2) targetPathIndex = 1; else targetPathIndex = spawned % pathCount; }
                if (!this.paths[targetPathIndex]) targetPathIndex = 0;
                this.spawnEnemy(1, targetPathIndex); spawned++;
                if (this.isBossWave && spawned === totalEnemies) this.time.delayedCall(3000, () => this.spawnBoss());
            }
        });
    }
    spawnEnemy(hpMult = 1, pathIndex = 0) {
        if (!this.paths || this.paths.length === 0) return;
        const selectedPath = this.paths[pathIndex] || this.paths[0]; const pathPoints = selectedPath.getSpacedPoints(150); 
        let tierIdx = 0; if (this.level >= 4) tierIdx = 1; if (this.level >= 8) tierIdx = 2;
        const biomeConfig = BIOME_ENEMIES[this.biome]; if (!biomeConfig) return; 
        const possibleMobs = biomeConfig.tiers[tierIdx]; const mobKey = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
        const enemy = new Enemy(this, pathPoints, this.hpMultiplier * hpMult, mobKey); this.enemies.add(enemy);
    }
    spawnBoss() {
        this.bossSpawned = true; const biomeConfig = BIOME_ENEMIES[this.biome]; if (!biomeConfig) return;
        if (!this.paths || this.paths.length === 0) return;
        const randomPathIndex = Phaser.Math.Between(0, this.paths.length - 1); const selectedPath = this.paths[randomPathIndex]; const pathPoints = selectedPath.getSpacedPoints(150); 
        let bossKey = 'slime'; 
        if (this.level === 5 || this.level === 10) { bossKey = biomeConfig.bosses[this.level]; this.showFloatingText(this.scale.width/2, 200, "¡JEFE LEGENDARIO!", "#ff0000"); } 
        else { const minis = biomeConfig.miniBosses; bossKey = minis[Math.floor(Math.random() * minis.length)]; this.showFloatingText(this.scale.width/2, 200, "¡LÍDER DE MANADA!", "#ff8800"); }
        const boss = new Enemy(this, pathPoints, this.hpMultiplier * 2.5, bossKey); this.enemies.add(boss);
    }
    checkWaveStatus() { if (this.isBossWave && !this.bossSpawned) return; if (this.waveActive && this.enemies.getLength() === 0 && (!this.spawnTimer || this.spawnTimer.getProgress() === 1)) { this.waveActive = false; if (this.currentWave >= this.totalWaves) this.victory(); else this.startWaveTimer(20); } }
    getTowerFromObject(obj) { if (obj instanceof Tower) return obj; if (obj.parentContainer instanceof Tower) return this.getTowerFromObject(obj.parentContainer); return null; }
    
    createUI() { 
        const w = this.scale.width; 
        const h = this.scale.height; 
        const uiDepth = 1000; 
        const accent = this.theme.accent; 
        
        // 1. Barra Superior (Reducida)
        this.add.rectangle(w/2, 60, w, 80, 0x111111).setScrollFactor(0).setDepth(uiDepth); 
        this.add.rectangle(w/2, 100, w, 4, accent).setScrollFactor(0).setDepth(uiDepth); 
        
        // Stats
        this.livesText = this.add.text(30, 30, '', { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.castleText = this.add.text(30, 65, '', { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', color: '#ffaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1);
        
        // XP
        this.xpContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(uiDepth + 1);
        this.add.text(300, 35, 'XP:', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.xpBarBg = this.add.rectangle(330, 42, 200, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.xpBarFill = this.add.rectangle(330, 42, 0, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.lvlText = this.add.text(540, 35, 'Lvl 1', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        // Oleada
        this.waveInfoText = this.add.text(w - 30, 30, 'OLEADA: 1', { fontFamily: 'Cinzel', fontSize: '28px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 

        // ORO
        this.economyText = this.add.text(w - 30, 70, '$0', { fontFamily: 'Cinzel', fontSize: '24px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1);

        // Timer
        this.waveTimerContainer = this.add.container(w/2, 60).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.waveTimerContainer.setSize(320, 60); this.waveTimerContainer.setInteractive({ useHandCursor: true }); 
        const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff); 
        this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', align: 'center', color: '#ffffff' }).setOrigin(0.5); 
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]); 
        this.waveTimerContainer.setVisible(false); 
        this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction()); 

        // 2. NUEVA BARRA INFERIOR (Selector de Torres)
        this.towerSelectorContainer = this.add.container(w/2, h - 70).setScrollFactor(0).setDepth(uiDepth);
        
        // Fondo semi-transparente para las cartas
        const selectorBg = this.add.rectangle(0, 0, 680, 130, 0x000000, 0.5).setStrokeStyle(2, 0x444444);
        this.towerSelectorContainer.add(selectorBg);

        // Generar Cartas (1-6) - 100x120
        this.towerCards = [];
        const cardWidth = 100;
        const cardHeight = 120;
        const gap = 110; 
        const startX = -((gap * 5) / 2); 

        this.towerOrder.forEach((type, i) => {
            const card = this.add.container(startX + (i * gap), 0);
            
            // Fondo carta
            const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x222222).setInteractive({useHandCursor:true});
            cardBg.setStrokeStyle(1, 0xaaaaaa);
            
            // Icono
            const stats = TOWER_TYPES[type];
            const icon = this.add.rectangle(0, -20, 50, 50, stats.color || 0x888888);

            // Nombre
            const displayName = this.towerDisplayNames[type] || "TORRE";
            const name = this.add.text(0, -50, displayName, { fontSize:'10px', fontStyle:'bold' }).setOrigin(0.5);
            
            // Costo
            const cost = TOWER_COSTS[type];
            const costText = this.add.text(0, 25, `$${cost}`, { fontSize:'16px', color:'#ffd700', fontStyle:'bold' }).setOrigin(0.5);
            
            // Hotkey
            const key = this.add.text(0, 45, `[${i+1}]`, { fontSize:'10px', color:'#888' }).setOrigin(0.5);

            cardBg.on('pointerdown', () => this.selectTower(i));

            card.add([cardBg, icon, name, costText, key]);
            this.towerSelectorContainer.add(card);
            
            this.towerCards.push({ container: card, bg: cardBg, costText: costText, cost: cost });
        });

        // 3. BOTÓN HABILIDAD
        this.skillBtnContainer = this.add.container(w - 70, h - 70).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.skillBg = this.add.circle(0, 0, 40, 0x222222).setStrokeStyle(3, 0x00ffff).setInteractive({ useHandCursor: true }); 
        const skillIcon = this.add.text(0, 0, "⚡", { fontSize: '32px' }).setOrigin(0.5);
        this.skillOverlay = this.add.circle(0, 0, 40, 0x000000, 0.7).setVisible(false);
        this.skillTimerText = this.add.text(0, 0, "", { fontSize:'16px', fontStyle:'bold' }).setOrigin(0.5);

        this.skillBtnContainer.add([this.skillBg, skillIcon, this.skillOverlay, this.skillTimerText]); 
        this.skillBg.on('pointerdown', () => this.triggerPlayerSkill()); 
    }
    
    updateUI() { 
        // Actualizar textos básicos
        const pStats = gameState.playerStats; 
        if(this.livesText) this.livesText.setText(`❤️ HÉROE: ${Math.max(0, Math.floor(pStats.hp))}/${pStats.maxHp}`); 
        if(this.castleText) this.castleText.setText(`🏰 CASTILLO: ${gameState.baseHp}`); 
        if(this.economyText) this.economyText.setText(`$${this.coins}`);

        const hero = getCurrentHero(); 
        if (hero && this.xpBarFill && this.lvlText) { 
            const xpPercent = Math.min(1, hero.xp / hero.maxXp); 
            this.xpBarFill.width = 200 * xpPercent; 
            this.lvlText.setText(`Lvl ${hero.level}`); 
        } 

        // Actualizar Cartas
        if (this.towerCards) {
            this.towerCards.forEach((card, i) => {
                const isSelected = (i === this.selectedTowerIndex);
                const canAfford = this.coins >= card.cost;
                card.bg.setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0x00ff00 : 0xaaaaaa);
                card.bg.setFillStyle(isSelected ? 0x444444 : 0x222222);
                card.costText.setColor(canAfford ? '#ffd700' : '#ff0000');
                card.container.setScale(isSelected ? 1.1 : 1.0);
            });
        }
    }
    
    updateSkillUI() { 
        if (!this.player) return; 
        const cd = this.player.skillCooldown; 
        
        if (cd > 0) { 
            this.skillOverlay.setVisible(true);
            this.skillTimerText.setText(Math.ceil(cd / 1000));
            this.skillBg.setStrokeStyle(3, 0x555555); 
        } else { 
            this.skillOverlay.setVisible(false);
            this.skillTimerText.setText("");
            this.skillBg.setStrokeStyle(3, 0x00ffff); 
        } 
    }
    
    createUpgradeUI() { 
        this.upgradeContainer = this.add.container(0, 0).setDepth(2000).setVisible(false); 
        const bg = this.add.rectangle(0, 0, 300, 220, 0x000000, 0.9).setStrokeStyle(2, 0xffffff).setInteractive(); 
        this.upgradeText = this.add.text(0, -80, '', { fontSize: '14px', align: 'center', color: '#fff', wordWrap: {width: 280} }).setOrigin(0.5); 
        
        this.upgradeBtn = this.add.rectangle(0, -20, 250, 40, 0x00aa00).setInteractive({ useHandCursor: true }); 
        this.upgradeBtnText = this.add.text(0, -20, 'MEJORAR', { fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5); 
        this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower()); 
        
        this.evoBtnA = this.add.rectangle(-70, -10, 130, 60, 0x444444).setInteractive({ useHandCursor: true }).setVisible(false); 
        this.evoTxtA = this.add.text(-70, -10, '', { fontSize: '12px', align: 'center', wordWrap:{width:120} }).setOrigin(0.5).setVisible(false); 
        this.evoBtnA.on('pointerdown', () => this.tryEvolveTower('pathA')); 
        
        this.evoBtnB = this.add.rectangle(70, -10, 130, 60, 0x444444).setInteractive({ useHandCursor: true }).setVisible(false); 
        this.evoTxtB = this.add.text(70, -10, '', { fontSize: '12px', align: 'center', wordWrap:{width:120} }).setOrigin(0.5).setVisible(false); 
        this.evoBtnB.on('pointerdown', () => this.tryEvolveTower('pathB')); 
        
        this.sellBtn = this.add.rectangle(0, 70, 250, 30, 0xaa0000).setInteractive({ useHandCursor: true }); 
        this.sellBtnText = this.add.text(0, 70, 'VENDER', { fontSize: '14px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5); 
        this.sellBtn.on('pointerdown', () => this.sellTower()); 
        
        this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, this.upgradeBtnText, this.evoBtnA, this.evoTxtA, this.evoBtnB, this.evoTxtB, this.sellBtn, this.sellBtnText]); 
    }
    
    updateUpgradeMenuText() { 
        if (!this.selectedTowerToUpgrade) return; 
        const t = this.selectedTowerToUpgrade; 
        const stats = TOWER_TYPES[t.typeKey]; 
        
        this.upgradeBtn.setVisible(false); 
        this.upgradeBtnText.setVisible(false); 
        this.evoBtnA.setVisible(false); 
        this.evoTxtA.setVisible(false); 
        this.evoBtnB.setVisible(false); 
        this.evoTxtB.setVisible(false); 
        
        if (t.isEvolved) { 
            this.upgradeText.setText(`${t.typeName} (MÁX)\nDaño: ${t.damage}`); 
        } else if (t.level >= t.maxLevel) { 
            this.upgradeText.setText(`¡EVOLUCIÓN DISPONIBLE!\nElige un destino:`); 
            const evoA = stats.evolutions.pathA; 
            const evoB = stats.evolutions.pathB; 
            
            this.evoBtnA.setVisible(true); 
            this.evoBtnA.setFillStyle(evoA.color); 
            this.evoTxtA.setVisible(true); 
            this.evoTxtA.setText(`${evoA.name}\n$${evoA.cost}`); 
            
            this.evoBtnB.setVisible(true); 
            this.evoBtnB.setFillStyle(evoB.color); 
            this.evoTxtB.setVisible(true); 
            this.evoTxtB.setText(`${evoB.name}\n$${evoB.cost}`); 
        } else { 
            this.upgradeBtn.setVisible(true); 
            this.upgradeBtnText.setVisible(true); 
            this.upgradeText.setText(`${t.typeName} Nvl ${t.level}\nDaño: ${t.damage}`); 
            this.upgradeBtnText.setText(`MEJORAR ($${t.upgradeCost})`); 
        } 
        this.sellBtnText.setText(`VENDER (+$${Math.floor(t.totalInvestment * 0.7)})`); 
    }
    
    tryUpgradeTower() { 
        const t = this.selectedTowerToUpgrade; 
        if (t && !t.isEvolved && t.level < t.maxLevel && this.coins >= t.upgradeCost) { 
            this.coins -= t.upgradeCost; 
            t.upgrade(); 
            this.updateUpgradeMenuText(); 
            this.updateUI(); 
            SaveSystem.save(); 
        } 
    }
    
    tryEvolveTower(pathKey) { 
        const t = this.selectedTowerToUpgrade; 
        if (!t) return; 
        const stats = TOWER_TYPES[t.typeKey]; 
        const evoData = stats.evolutions[pathKey]; 
        if (this.coins >= evoData.cost) { 
            this.coins -= evoData.cost; 
            t.evolve(pathKey); 
            this.updateUpgradeMenuText(); 
            this.updateUI(); 
            SaveSystem.save(); 
        } else { 
            this.showFloatingText(t.x, t.y, "¡Falta Oro!", "#ff0000"); 
        } 
    }
    
    openUpgradeMenu(tower) { 
        this.selectedTowerToUpgrade = tower; 
        this.upgradeContainer.setPosition(tower.x, tower.y - 150); 
        this.upgradeContainer.setVisible(true); 
        tower.rangeCircle.setVisible(true); 
        this.updateUpgradeMenuText(); 
    }
    
    closeUpgradeMenu() { 
        if (this.selectedTowerToUpgrade && this.selectedTowerToUpgrade.rangeCircle) {
            this.selectedTowerToUpgrade.rangeCircle.setVisible(false); 
        }
        this.selectedTowerToUpgrade = null; 
        if (this.upgradeContainer) {
            this.upgradeContainer.setVisible(false); 
        }
    }
    
    sellTower() { const t = this.selectedTowerToUpgrade; if (t) { this.coins += Math.floor(t.totalInvestment * 0.7); this.updateUI(); if (t.buildSite) t.buildSite.free(); t.destroy(); this.closeUpgradeMenu(); this.showFloatingText(t.x, t.y - 50, `+$${Math.floor(t.totalInvestment*0.7)}`, '#ffff00'); } }
    triggerPlayerSkill() { if (!this.player) return; const result = this.player.castSkill(); if (result.success) { this.tweens.add({ targets: this.skillBtnContainer, scale: 0.9, yoyo: true, duration: 100 }); } }
    createSpawnIndicator(x, y) { const marker = this.add.circle(x, y, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); this.add.text(x, y - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); }
    
    tryBuildTower(site) { 
        if (site.isOccupied) return; 
        const stats = TOWER_TYPES[this.selectedTowerType]; 
        if (this.coins >= stats.baseCost) { 
            this.coins -= stats.baseCost; 
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); 
            this.towers.add(tower); 
            site.occupy(); 
            this.updateUI(); 
            this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' }); 
            SaveSystem.save(); 
            SoundManager.playSound('build');
        } else { 
            this.cameras.main.shake(100, 0.005); 
        } 
    }
    
    victory() { 
        this.physics.pause(); 
        if (this.spawnTimer) this.spawnTimer.remove(); 
        if (!gameState.biomeLevels) gameState.biomeLevels = { forest: 1, mountain: 1, volcano: 1 };
        if (this.level >= gameState.biomeLevels[this.biome]) {
            gameState.biomeLevels[this.biome] = this.level + 1;
        }
        SaveSystem.save(); 

        const rewardGold = 100 + (this.level * 50); 
        this.showFloatingText(this.scale.width/2, this.scale.height/2, "¡VICTORIA!", "#ffd700", 3000); 
        SoundManager.playSound('upgrade'); 

        this.time.delayedCall(2000, () => { 
            this.scene.start('ChestScene', { biome: this.biome, level: this.level, winData: { gold: rewardGold, xp: 100 * this.level, baseHp: gameState.baseHp, enemyLoot: this.sessionLoot } }); 
        }); 
    }
    
    onEnemyLeaks(damage) { gameState.baseHp -= damage; this.cameras.main.flash(200, 255, 0, 0); this.updateUI(); if (gameState.baseHp <= 0) this.gameOver(); }
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.scene.start('ResultScene', { success: false, levelId: this.currentLevelData.id }); }
    
    onEnemyKilled(enemy) { 
        try { 
            this.coins += (enemy.coinReward || 10); 
            if (RPGSystem && RPGSystem.gainHeroXP) { RPGSystem.gainHeroXP(enemy.xpReward || 10); } 
            RPGSystem.updateQuestProgress('kill', 'any', 1); 
            if (enemy.typeKey.includes('boss')) { 
                this.showFloatingText(enemy.x, enemy.y, "¡BOSS DERROTADO!", "#ffd700"); 
                RPGSystem.updateQuestProgress('boss', 'any', 1); 
            }
            this.createExplosion(enemy.x, enemy.y, enemy.bodyShape ? enemy.bodyShape.fillColor : 0xff0000); 
            this.showFloatingText(enemy.x, enemy.y - 30, `+$${enemy.coinReward}`, '#ffff00'); 
            this.updateUI(); 
        } catch (err) { console.warn("Error", err); } 
    }
    
    createExplosion(x, y, color) {
        if (!this.explosionEmitter) return;
        this.explosionEmitter.setPosition(x, y);
        this.explosionEmitter.setParticleTint(color); 
        this.explosionEmitter.explode(20); 
        this.cameras.main.shake(100, 0.005);
    }

    createHitEffect(x, y, color) {
        if (!this.hitEmitter) return;
        this.hitEmitter.setPosition(x, y);
        this.hitEmitter.setParticleTint(color); 
        this.hitEmitter.explode(5); 
    }

    spawnLoot(x, y) { if (Math.random() > 0.30) return; let type = 'wood'; let rarity = 'common'; const roll = Math.random(); if (roll < 0.15) type = 'potion_hp'; else if (roll < 0.25) type = 'coin_bag'; else { const m = Math.random(); if(m<0.25) type='wood'; else type='copper'; } const item = new Loot(this, x, y, type, rarity); this.loots.add(item); }
    collectLoot(lootItem) { if (lootItem.isConsumable) { if (lootItem.typeKey === 'potion_hp') { const heal = Math.floor(gameState.playerStats.maxHp * 0.25); gameState.playerStats.hp = Math.min(gameState.playerStats.hp + heal, gameState.playerStats.maxHp); this.showFloatingText(lootItem.x, lootItem.y, `+${heal} HP`, '#ff0000'); } else if (lootItem.typeKey === 'coin_bag') { const gold = Phaser.Math.Between(30, 60); this.coins += gold; this.updateUI(); this.showFloatingText(lootItem.x, lootItem.y, `+$${gold}`, '#ffd700'); } } else { if(gameState.materials[lootItem.typeKey]) { gameState.materials[lootItem.typeKey][lootItem.rarityKey]++; RPGSystem.updateQuestProgress('collect', lootItem.typeKey, 1); if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {common:0}; if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0; this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++; this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); } } lootItem.destroy(); }
    showFloatingText(x, y, message, color = '#fff', duration = 800) { const text = this.add.text(x, y, message, { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color: color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2000); this.tweens.add({ targets: text, y: y - 50, alpha: 0, duration: duration, onComplete: () => text.destroy() }); }
    showLevelUpEffect() { const txt = this.add.text(this.scale.width/2, this.scale.height/2, "¡LEVEL UP!", { fontSize: '64px', fontStyle: 'bold', color: '#ffd700', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(3000).setScale(0); this.tweens.add({ targets: txt, scale: 1.5, duration: 500, yoyo: true, onComplete: () => txt.destroy() }); gameState.playerStats.hp = gameState.playerStats.maxHp; }
    
    createPauseMenu() { 
        this.pauseContainer = this.add.container(640, 480).setDepth(20000).setVisible(false).setScrollFactor(0); 
        const w = this.scale.width; 
        const h = this.scale.height; 
        this.pauseContainer.setPosition(w/2, h/2); 
        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setInteractive(); 
        const panel = this.add.rectangle(0, 0, 400, 300, 0x222222).setStrokeStyle(4, 0xffd700); 
        const title = this.add.text(0, -100, "PAUSA", { fontFamily: 'Cinzel', fontSize: '40px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5); 
        const resumeBtn = this.add.rectangle(0, 0, 250, 50, 0x006400).setInteractive({ useHandCursor: true }); 
        const resumeTxt = this.add.text(0, 0, "CONTINUAR", { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color:'#fff' }).setOrigin(0.5); 
        resumeBtn.on('pointerdown', () => this.togglePause()); 
        const exitBtn = this.add.rectangle(0, 80, 250, 50, 0xaa0000).setInteractive({ useHandCursor: true }); 
        const exitTxt = this.add.text(0, 80, "SALIR AL MENÚ", { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color:'#fff' }).setOrigin(0.5); 
        
        // --- CORRECCIÓN AQUÍ: Limpiar todo antes de salir ---
        exitBtn.on('pointerdown', () => { 
            this.cleanUpScene(); 
            this.scene.start('MainMenuScene'); 
        }); 
        // ----------------------------------------------------

        this.pauseContainer.add([bg, panel, title, resumeBtn, resumeTxt, exitBtn, exitTxt]); 
    }
    
    togglePause() { 
        this.isPaused = !this.isPaused; 
        if (this.isPaused) { 
            this.physics.pause(); 
            this.tweens.pauseAll(); 
            this.time.paused = true; // Pausar reloj interno
            
            if(this.enemies) this.enemies.runChildUpdate = false;
            if(this.projectiles) this.projectiles.runChildUpdate = false;

            this.pauseContainer.setVisible(true); 
            this.children.bringToTop(this.pauseContainer); 
        } else { 
            this.physics.resume(); 
            this.tweens.resumeAll(); 
            this.time.paused = false; // Reanudar reloj interno
            
            if(this.enemies) this.enemies.runChildUpdate = true;
            if(this.projectiles) this.projectiles.runChildUpdate = true;

            this.pauseContainer.setVisible(false); 
        } 
    }
}