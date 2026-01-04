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
import { GAME_CONSTANTS } from '../config/GameConstants.js'; // Importar constantes de dificultad
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import { BIOMES, getLevelData } from '../config/Levels.js'; 
import { BIOME_ENEMIES } from '../config/Enemies.js';
import SoundManager from '../systems/SoundManager.js'; 
import { EventBus } from '../utils/EventBus.js'; 
import GameUI from '../ui/GameUi.js';

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
        
        this.towerOrder = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
    }

    init(data) {
        this.level = data.level || 1;
        this.biome = data.biome || 'forest';
        // Dificultad seleccionada por el jugador (1=Fácil, 2=Normal, 3=Difícil)
        this.difficultyMode = data.difficulty || 1; 
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
        
        this.isSceneReady = false; 
        this.isPaused = false;
        this.time.paused = false;

        this.totalWaves = this.currentLevelData.waves || 5; // Por defecto 5 oleadas
        
        // --- CÁLCULO DE DIFICULTAD GLOBAL ---
        // 1. Escalado por Nivel de Mapa (Exponencial 15%)
        // Nivel 1 = 1.0, Nivel 10 = ~3.5
        const levelScaling = Math.pow(GAME_CONSTANTS.DIFFICULTY.LEVEL_SCALING_FACTOR, this.level - 1);
        
        // 2. Escalado por Modo de Dificultad (Fácil/Normal/Difícil)
        const modeMult = GAME_CONSTANTS.DIFFICULTY.MODE_MULTIPLIER[this.difficultyMode] || 1.0;

        // Multiplicador Final que se pasará a los enemigos
        this.levelDifficultyFactor = levelScaling * modeMult;
        
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

        this.createParticles(); 

        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true, maxSize: 200 });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: false });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.cameras.main.setBackgroundColor(this.theme.bg);
        const w = this.scale.width;
        const h = this.scale.height;
        this.physics.world.setBounds(0, 0, w, h); 

        // Oro inicial ajustado por dificultad (más difícil = menos oro inicial)
        const baseGold = 500 + (this.level * 50);
        this.coins = Math.floor(baseGold / (this.difficultyMode * 0.8)); // Pequeño ajuste
        
        this.currentWave = 0; 
        this.waveInProgress = false;
        this.sessionLoot = {}; 
        
        // Vida del Castillo
        gameState.baseHp = 20;
        this.maxBaseHp = 20; 

        this.createMapFromGrid();
        this.createUpgradeUI(); 
        this.createPauseMenu(); 

        // UI Desacoplada
        this.gameUI = new GameUI(this);
        EventBus.emit('gold-changed', this.coins);
        EventBus.emit('base-damaged', { current: gameState.baseHp, max: this.maxBaseHp });
        EventBus.emit('tower-selected', this.selectedTowerIndex);
        
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        this.player = new Player(this, centerX, centerY, gameState.selectedClass, this.enemies, this.projectiles);
        
        EventBus.on('ui-select-tower', this.selectTower, this);
        EventBus.on('ui-trigger-skill', this.triggerPlayerSkill, this);
        EventBus.on('ui-start-wave', this.startNextWaveAction, this);
        
        this.setupInputs();

        this.physics.add.overlap(this.enemies, this.projectiles, (e, p) => { 
            if(e.active && p.active) { 
                if(p.hit) p.hit(e); 
                else { e.takeDamage(p.damage||10); if(p.recycle) p.recycle(); else p.destroy(); }
            } 
        });
        this.physics.add.overlap(this.player, this.loots, (p, l) => this.collectLoot(l));

        this.startWaveTimer(20); 
        this.isSceneReady = true;
    }

    createParticles() {
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
    }

    setupInputs() {
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
            
            if (currentlyOver.length > 0) {
                if (pointer.y > this.scale.height - 140) return; 
            }

            if (this.upgradeContainer && this.upgradeContainer.visible) {
                const clickedOnUpgrade = currentlyOver.some(obj => 
                    obj === this.upgradeContainer || obj.parentContainer === this.upgradeContainer
                );
                const clickedOnTower = currentlyOver.some(obj => this.getTowerFromObject(obj) !== null);
                
                if (!clickedOnUpgrade && !clickedOnTower) {
                    this.closeUpgradeMenu();
                }
            }
            
            if (pointer.y > 100 && pointer.y < (this.scale.height - 140)) { 
                if (this.player && this.player.setTarget) {
                    this.player.setTarget(pointer.x, pointer.y);
                }
            }
        });
    }

    cleanUpScene() {
        this.isPaused = false;
        this.time.paused = false; 
        this.physics.resume();
        this.tweens.resumeAll();
        
        if (this.spawnTimer) this.spawnTimer.remove();
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();

        EventBus.off('ui-select-tower');
        EventBus.off('ui-trigger-skill');
        EventBus.off('ui-start-wave');
    }

    selectTower(index) {
        if (this.isPaused) return;
        if (index < 0 || index >= this.towerOrder.length) return;
        this.selectedTowerIndex = index;
        this.selectedTowerType = this.towerOrder[index];
        EventBus.emit('tower-selected', index); 
    }

    createMapFromGrid() {
        const grid = this.currentLevelData.mapGrid;
        if (!grid) return;
        const TILE_SIZE = 64; const offsetX = 0; const offsetY = 120; 
        const graphics = this.add.graphics();
        this.paths = []; let startPoints = []; 
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
                } else if (cell === 1 || (cell >= 6 && cell <= 10)) {
                    const tileKey = `tile_${cell}`;
                    if (this.textures.exists(tileKey)) this.add.image(x, y, tileKey).setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else if (this.textures.exists('tile_1')) this.add.image(x, y, 'tile_1').setDisplaySize(TILE_SIZE, TILE_SIZE);
                    else { graphics.fillStyle(this.theme.path, 1); graphics.fillRect(col * TILE_SIZE + offsetX, row * TILE_SIZE + offsetY, TILE_SIZE, TILE_SIZE); }
                    if (col === 0) startPoints.push({c: col, r: row, x, y});
                } else if (cell === 2) { 
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
            let current = startPoint; let visited = new Set();
            visited.add(`${current.c},${current.r}`); globalVisited.add(`${current.c},${current.r}`);
            this.createSpawnIndicator(startPoint.x, startPoint.y, index + 1);
            let steps = 0; let finished = false;
            while (steps < 300 && !finished) {
                const neighbors = [{c: current.c+1, r: current.r}, {c: current.c, r: current.r+1}, {c: current.c, r: current.r-1}, {c: current.c-1, r: current.r}];
                let foundNext = false;
                for (let n of neighbors) {
                    if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length) {
                        const cellVal = grid[n.r][n.c];
                        if (validPathCells.includes(cellVal) && !globalVisited.has(`${n.c},${n.r}`)) {
                            const nx = n.c * TILE_SIZE + (TILE_SIZE/2) + offsetX; const ny = n.r * TILE_SIZE + (TILE_SIZE/2) + offsetY;
                            path.lineTo(nx, ny); visited.add(`${n.c},${n.r}`); globalVisited.add(`${n.c},${n.r}`);
                            current = {c: n.c, r: n.r, x: nx, y: ny}; foundNext = true; break; 
                        }
                    }
                }
                if (!foundNext) {
                    for (let n of neighbors) {
                        if (n.r >= 0 && n.r < grid.length && n.c >= 0 && n.c < grid[0].length) {
                             const cellVal = grid[n.r][n.c];
                             if (validPathCells.includes(cellVal) && globalVisited.has(`${n.c},${n.r}`) && !visited.has(`${n.c},${n.r}`)) {
                                const nx = n.c * TILE_SIZE + (TILE_SIZE/2) + offsetX; const ny = n.r * TILE_SIZE + (TILE_SIZE/2) + offsetY;
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

        EventBus.emit('hero-stats-update');
        EventBus.emit('skill-cooldown', { current: this.player ? this.player.skillCooldown : 0, total: this.player ? this.player.skillMaxCooldown : 1000 });
        
        if (this.isTimerRunning) {
            this.timeToNextWave -= delta;
            if (this.timeToNextWave <= 0) {
                this.startWave();
            } else {
                EventBus.emit('wave-timer-tick', Math.ceil(this.timeToNextWave/1000));
            }
        }
        
        this.checkWaveStatus();
    }

    // --- NUEVO: SISTEMA DE SPAWN LOOT POR DIFICULTAD ---
    spawnLoot(x, y) { 
        // 30% chance de dropear algo (Ajustable en GAME_CONSTANTS)
        const chance = GAME_CONSTANTS.DROPS.GLOBAL_CHANCE || 0.30;
        if (Math.random() > chance) return; 
        
        let type = 'wood'; 
        let rarity = 'common'; 
        const roll = Math.random(); 
        const weights = GAME_CONSTANTS.DROPS.WEIGHTS;

        if (roll < weights.POTION) {
            type = 'potion_hp';
        } else if (roll < (weights.POTION + weights.COIN_BAG)) {
            type = 'coin_bag';
        } else {
            // Materiales según Dificultad (Tier)
            const matRoll = Math.random();
            if (this.difficultyMode === 1) {
                type = matRoll < 0.5 ? 'wood' : 'copper'; 
            } else if (this.difficultyMode === 2) {
                type = matRoll < 0.5 ? 'cedar' : 'iron'; 
            } else {
                type = matRoll < 0.5 ? 'ebony' : 'mithril'; 
            }
        }
        
        const item = new Loot(this, x, y, type, rarity);
        this.loots.add(item);
    }

    collectLoot(lootItem) { 
        if (lootItem.isConsumable) { 
            if (lootItem.typeKey === 'potion_hp') { 
                const heal = Math.floor(gameState.playerStats.maxHp * 0.25); 
                gameState.playerStats.hp = Math.min(gameState.playerStats.hp + heal, gameState.playerStats.maxHp); 
                this.showFloatingText(lootItem.x, lootItem.y, `+${heal} HP`, "heal"); 
            } else if (lootItem.typeKey === 'coin_bag') { 
                const gold = Phaser.Math.Between(30, 60) * this.difficultyMode; 
                this.coins += gold; 
                EventBus.emit('gold-changed', this.coins); 
                // Efecto de moneda
                if(this.spawnCoinEffect) this.spawnCoinEffect(lootItem.x, lootItem.y);
                this.showFloatingText(lootItem.x, lootItem.y, `+$${gold}`, "gold"); 
            } 
        } else { 
            this.generateLoot(lootItem.x, lootItem.y, lootItem.typeKey, 1);
            this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); 
        } 
        lootItem.destroy(); 
    }

    generateLoot(x, y, matKey, qty) {
        const rarity = RPGSystem.getDynamicRarity(this.level);
        if (!gameState.materials[matKey]) gameState.materials[matKey] = { common: 0, uncommon: 0, rare: 0, epic:0, legendary:0 };
        gameState.materials[matKey][rarity] += qty;
        if (!this.sessionLoot[matKey]) this.sessionLoot[matKey] = { common: 0 };
        if (!this.sessionLoot[matKey][rarity]) this.sessionLoot[matKey][rarity] = 0;
        this.sessionLoot[matKey][rarity] += qty;
    }

    startWaveTimer(seconds) { 
        this.isTimerRunning = true; 
        this.timeToNextWave = seconds * 1000; 
        EventBus.emit('wave-timer-toggle', true);
    }

    startNextWaveAction() { 
        if (this.isTimerRunning) this.startWave(); 
    }

    startWave() {
        this.isTimerRunning = false; 
        EventBus.emit('wave-timer-toggle', false);
        this.waveActive = true;
        this.currentWave++;
        this.isBossWave = (this.currentWave === this.totalWaves);
        this.bossSpawned = false;
        
        EventBus.emit('wave-changed', { current: this.currentWave, total: this.totalWaves, isBoss: this.isBossWave });
        
        let baseCount = 8 + (this.currentWave * 2); 
        let totalEnemies = Math.ceil(baseCount * this.spawnMult);
        let spawnDelay = 1000 - (this.currentWave * 50); 
        if (spawnDelay < 200) spawnDelay = 200; 
        if (this.isBossWave) { this.showFloatingText(this.scale.width/2, this.scale.height/2, "¡JEFE FINAL!", "#ff0000"); totalEnemies = 5; }
        
        let spawned = 0;
        this.spawnTimer = this.time.addEvent({ delay: spawnDelay, repeat: totalEnemies - 1, callback: () => {
                let targetPathIndex = 0; const pathCount = this.paths.length;
                if (pathCount > 1) { if (this.currentWave === 1) targetPathIndex = 0; else if (this.currentWave === 2) targetPathIndex = 1; else targetPathIndex = spawned % pathCount; }
                if (!this.paths[targetPathIndex]) targetPathIndex = 0;
                
                this.spawnEnemy(targetPathIndex); 
                spawned++;
                
                if (this.isBossWave && spawned === totalEnemies) this.time.delayedCall(3000, () => this.spawnBoss());
            }
        });
    }

    spawnEnemy(pathIndex = 0) {
        if (!this.paths || this.paths.length === 0) return;
        const selectedPath = this.paths[pathIndex] || this.paths[0]; 
        const pathPoints = selectedPath.getSpacedPoints(150); 
        
        // Seleccionar Tier de enemigos según progreso de oleadas
        // Oleada 1-2: Tier 1 (Early)
        // Oleada 3-4: Tier 2 (Mid)
        // Oleada 5+: Tier 3 (Late)
        let tierIdx = 0; 
        if (this.currentWave >= 3) tierIdx = 1; 
        if (this.currentWave >= 5) tierIdx = 2;
        
        const biomeConfig = BIOME_ENEMIES[this.biome]; 
        if (!biomeConfig) return; 
        
        // Asegurarse de que el tier existe, si no usar el último
        const possibleMobs = biomeConfig.tiers[Math.min(tierIdx, biomeConfig.tiers.length - 1)]; 
        const mobKey = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
        
        // Crear enemigo con el factor de dificultad del NIVEL DEL MAPA
        let enemy = this.enemies.getFirstDead();
        if (!enemy) {
            enemy = new Enemy(this, pathPoints, this.levelDifficultyFactor, mobKey);
            this.enemies.add(enemy);
        } else {
            enemy.initEnemy(this.levelDifficultyFactor, mobKey, pathPoints);
        }
    }

    spawnBoss() {
        this.bossSpawned = true; 
        const biomeConfig = BIOME_ENEMIES[this.biome]; 
        if (!biomeConfig) return;
        if (!this.paths || this.paths.length === 0) return;
        const randomPathIndex = Phaser.Math.Between(0, this.paths.length - 1); 
        const selectedPath = this.paths[randomPathIndex]; 
        const pathPoints = selectedPath.getSpacedPoints(150); 
        
        let bossKey = 'slime'; // Fallback
        
        // Jefes especiales en niveles 5 y 10
        if (this.level === 5 || this.level === 10) { 
            bossKey = biomeConfig.bosses[this.level]; 
            this.showFloatingText(this.scale.width/2, 200, "¡JEFE DE ZONA!", "crit"); 
        } 
        else { 
            // Mini-Jefes en otros niveles
            const minis = biomeConfig.miniBosses; 
            bossKey = minis[Math.floor(Math.random() * minis.length)]; 
            this.showFloatingText(this.scale.width/2, 200, "¡LÍDER ELITE!", "#ff8800"); 
        }
        
        let boss = this.enemies.getFirstDead();
        // El boss recibe un boost extra de stats (x1.5) además del nivel del mapa
        const bossDifficulty = this.levelDifficultyFactor * 1.5;
        
        if (!boss) {
            boss = new Enemy(this, pathPoints, bossDifficulty, bossKey);
            this.enemies.add(boss);
        } else {
            boss.initEnemy(bossDifficulty, bossKey, pathPoints);
            boss.setScale(1.5);
        }
    }

    checkWaveStatus() { if (this.isBossWave && !this.bossSpawned) return; if (this.waveActive && this.enemies.countActive() === 0 && (!this.spawnTimer || this.spawnTimer.getProgress() === 1)) { this.waveActive = false; if (this.currentWave >= this.totalWaves) this.victory(); else this.startWaveTimer(20); } }
    getTowerFromObject(obj) { if (obj instanceof Tower) return obj; if (obj.parentContainer instanceof Tower) return this.getTowerFromObject(obj.parentContainer); return null; }
    
    // --- UI HELPERS (Mantenidos) ---
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
            EventBus.emit('gold-changed', this.coins); 
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
            EventBus.emit('gold-changed', this.coins); 
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
    
    sellTower() { const t = this.selectedTowerToUpgrade; if (t) { this.coins += Math.floor(t.totalInvestment * 0.7); EventBus.emit('gold-changed', this.coins); if (t.buildSite) t.buildSite.free(); t.destroy(); this.closeUpgradeMenu(); this.showFloatingText(t.x, t.y - 50, `+$${Math.floor(t.totalInvestment*0.7)}`, '#ffff00'); } }
    
    triggerPlayerSkill() { if (!this.player) return; const result = this.player.castSkill(); if (result.success) { /* Animacion opcional */ } }
    
    createSpawnIndicator(x, y) { const marker = this.add.circle(x, y, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); this.add.text(x, y - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); }
    
    tryBuildTower(site) { 
        if (site.isOccupied) return; 
        const stats = TOWER_TYPES[this.selectedTowerType]; 
        if (this.coins >= stats.baseCost) { 
            this.coins -= stats.baseCost; 
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); 
            this.towers.add(tower); 
            site.occupy(); 
            EventBus.emit('gold-changed', this.coins); 
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
        
        const hpPercent = gameState.baseHp / this.maxBaseHp;
        let stars = 1;
        if (hpPercent >= 0.8) stars = 3;
        else if (hpPercent >= 0.5) stars = 2;

        const starKey = `${this.biome}_${this.difficultyMode}_${this.level}`;
        const prevStars = gameState.levelStars[starKey] || 0;
        if (stars > prevStars) {
            gameState.levelStars[starKey] = stars;
        }

        if (this.difficultyMode === 1 && this.level >= gameState.biomeLevels[this.biome]) {
            gameState.biomeLevels[this.biome] = this.level + 1;
        }
        
        SaveSystem.save(); 

        const rewardGold = 100 + (this.level * 50 * this.difficultyMode); 
        this.showFloatingText(this.scale.width/2, this.scale.height/2, `¡VICTORIA!\n${stars} ★`, "#ffd700", 3000); 
        SoundManager.playSound('upgrade'); 

        this.time.delayedCall(2000, () => { 
            this.scene.start('ChestScene', { biome: this.biome, level: this.level, winData: { gold: rewardGold, xp: 100 * this.level * this.difficultyMode, baseHp: gameState.baseHp, enemyLoot: this.sessionLoot } }); 
        }); 
    }
    
    onEnemyLeaks(damage) { 
        gameState.baseHp -= damage; 
        EventBus.emit('base-damaged', { current: gameState.baseHp, max: this.maxBaseHp }); 
        this.cameras.main.flash(200, 255, 0, 0); 
        if (gameState.baseHp <= 0) this.gameOver(); 
    }
    
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.scene.start('ResultScene', { success: false, levelId: this.currentLevelData.id }); }
    
    onEnemyKilled(enemy) { 
        try { 
            const reward = enemy.coinReward || 10;
            this.coins += reward; 
            
            if (RPGSystem && RPGSystem.gainHeroXP) { RPGSystem.gainHeroXP(enemy.xpReward || 10); } 
            RPGSystem.updateQuestProgress('kill', 'any', 1); 
            
            if (enemy.typeKey.includes('boss')) { 
                this.showFloatingText(enemy.x, enemy.y, "¡BOSS DERROTADO!", "crit"); 
                RPGSystem.updateQuestProgress('boss', 'any', 1); 
            }
            this.createExplosion(enemy.x, enemy.y, enemy.bodyShape ? enemy.bodyShape.fillColor : 0xff0000); 
            
            // Efecto moneda voladora
            this.spawnCoinEffect(enemy.x, enemy.y);
            this.showFloatingText(enemy.x, enemy.y - 30, `+$${reward}`, "gold"); 
            
            this.spawnLoot(enemy.x, enemy.y); 

            EventBus.emit('gold-changed', this.coins); 
            EventBus.emit('hero-stats-update');

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

    // EFECTOS VISUALES MEJORADOS
    showFloatingText(x, y, message, type = 'normal', duration = 800) { 
        let color = '#ffffff';
        let fontSize = '20px';
        let stroke = '#000';
        let strokeThick = 3;
        
        switch(type) {
            case 'crit': color = '#ffaa00'; fontSize = '32px'; strokeThick=5; break;
            case 'heal': color = '#00ff00'; break;
            case 'gold': color = '#ffd700'; fontSize = '24px'; break;
            case 'damage': color = '#ffffff'; break;
        }

        const text = this.add.text(x, y, message, { fontFamily: 'Cinzel', fontSize: fontSize, fontStyle: 'bold', color: color, stroke: stroke, strokeThickness: strokeThick }).setOrigin(0.5).setDepth(2000); 
        
        const angle = Phaser.Math.Between(-30, 30) * (Math.PI / 180); 
        const speed = type==='crit' ? 150 : 80;
        const vx = Math.sin(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
        const vy = -speed;

        this.tweens.addCounter({
            from: 0, to: 100, duration: 1000,
            onUpdate: (tween) => {
                const t = tween.getValue() / 100;
                text.x += vx * 0.05; text.y += (vy * 0.05) + (2 * t);
                if (t > 0.7) text.setAlpha(1 - ((t - 0.7) * 3));
            },
            onComplete: () => text.destroy()
        });
        
        if (type === 'crit') {
            text.setScale(0);
            this.tweens.add({ targets: text, scale: 1.5, duration: 200, yoyo: true, hold: 200 });
        }
    }

    showDamage(x, y, amount, isCrit) {
        const type = isCrit ? 'crit' : 'damage';
        const text = isCrit ? `¡${amount}!` : `${amount}`;
        this.showFloatingText(x, y, text, type);
    }

    spawnCoinEffect(startX, startY) {
        const coin = this.add.text(startX, startY, "🪙", { fontSize: '24px' }).setOrigin(0.5).setDepth(2000);
        const targetX = this.scale.width / 2; 
        const targetY = this.scale.height - 80; 

        this.tweens.add({
            targets: coin,
            x: targetX, y: targetY,
            duration: 800, ease: 'Sine.easeInOut',
            onComplete: () => {
                coin.destroy();
                if (this.gameUI && this.gameUI.pulseGoldIcon) this.gameUI.pulseGoldIcon();
            }
        });
    }

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
        
        exitBtn.on('pointerdown', () => { 
            this.cleanUpScene(); 
            this.scene.start('MainMenuScene'); 
        }); 

        this.pauseContainer.add([bg, panel, title, resumeBtn, resumeTxt, exitBtn, exitTxt]); 
    }
    
    togglePause() { 
        this.isPaused = !this.isPaused; 
        if (this.isPaused) { 
            this.physics.pause(); 
            this.tweens.pauseAll(); 
            this.time.paused = true; 
            if(this.enemies) this.enemies.runChildUpdate = false;
            if(this.projectiles) this.projectiles.runChildUpdate = false;
            this.pauseContainer.setVisible(true); 
            this.children.bringToTop(this.pauseContainer); 
        } else { 
            this.physics.resume(); 
            this.tweens.resumeAll(); 
            this.time.paused = false; 
            if(this.enemies) this.enemies.runChildUpdate = true;
            if(this.projectiles) this.projectiles.runChildUpdate = true;
            this.pauseContainer.setVisible(false); 
        } 
    }
}