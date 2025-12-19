// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import Loot from '../entities/items/Loot.js';
import { gameState, updatePlayerStats } from '../config/GameState.js';
import { TOWER_TYPES } from '../config/TowerStats.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 0; 
        this.selectedTowerToUpgrade = null; 
        this.timeToNextWave = 0; 
        this.isTimerRunning = false;
        this.isPaused = false;
        this.isSceneReady = false; // Bandera de seguridad
    }

    init(data) {
        this.currentLevelData = data.levelData || { id: 1, name: "Nivel Debug", startCoins: 500, difficulty: 1, path: [], towerSlots: [] };
        
        this.theme = this.currentLevelData.theme || {
            background: 0x333333,
            path: 0x555555,
            accent: 0x00ffff 
        };

        if (!gameState.playerStats) updatePlayerStats();
        this.lastHeroLevel = gameState.heroLevel || 1;
        this.isSceneReady = false; // Resetear bandera
    }

    create() {
        // --- 1. GENERAR TEXTURA 'PIXEL' ---
        if (!this.textures.exists('pixel')) {
            const graphics = this.make.graphics({x: 0, y: 0, add: false});
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('pixel', 4, 4);
        }

        // --- 2. INICIALIZAR GRUPOS (CRÍTICO: HACERLO ANTES DE CUALQUIER LOGICA) ---
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: false });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        // CAMARA
        this.TOP_MARGIN = 120;
        this.cameras.main.scrollY = -this.TOP_MARGIN;
        this.cameras.main.setBackgroundColor(0x111111);

        // --- 3. RESPONSIVIDAD Y MAPA ---
        const w = this.scale.width;
        const h = this.scale.height;
        this.sx = w / 1280; 
        this.sy = h / 960;  

        const rawPath = this.currentLevelData.path;
        if (!rawPath || rawPath.length === 0) {
            console.error("¡ERROR DE CAMINO! Regresando al mapa..."); 
            this.scene.start('WorldMapScene'); 
            return; // Detenemos ejecución aquí, pero los grupos ya existen, así que update no fallará
        }

        // Escalar camino
        this.pathPoints = rawPath.map(p => ({ x: p.x * this.sx, y: p.y * this.sy }));
        
        this.coins = this.currentLevelData.startCoins || 500;
        this.currentWave = 1;
        this.totalWaves = 5;
        this.waveInProgress = false;
        this.sessionLoot = {}; 
        gameState.baseHp = 20;

        // DIBUJAR MAPA
        const graphics = this.add.graphics();
        graphics.fillStyle(this.theme.background, 1);
        graphics.fillRect(0, 0, w, h);
        
        graphics.lineStyle(50 * Math.min(this.sx, this.sy), this.theme.path, 1);
        graphics.beginPath();
        graphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) graphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        graphics.strokePath();
        graphics.lineStyle(4, 0x000000, 0.3);
        graphics.strokePath();

        // ENTIDADES
        this.createBuildSlots();
        this.createSpawnIndicator();
        this.player = new Player(this, w/2, h/2, gameState.selectedClass, this.enemies, this.projectiles);

        // INPUTS
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (this.isPaused) return; 
            let target = gameObject;
            if (gameObject.parentContainer instanceof Tower) target = gameObject.parentContainer;
            if (target instanceof Tower) this.openUpgradeMenu(target);
            else if (gameObject.parentContainer !== this.upgradeContainer && gameObject !== this.upgradeContainer) {
                this.closeUpgradeMenu();
            }
        });

        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (this.isPaused) return;
            if (currentlyOver.length === 0) this.closeUpgradeMenu();
        });

        this.input.keyboard.on('keydown-ONE', () => { if(!this.isPaused) { this.selectedTowerType = 'archer'; this.updateUI(); }});
        this.input.keyboard.on('keydown-TWO', () => { if(!this.isPaused) { this.selectedTowerType = 'cannon'; this.updateUI(); }});
        this.input.keyboard.on('keydown-THREE', () => { if(!this.isPaused) { this.selectedTowerType = 'mage'; this.updateUI(); }});

        // COLISIONES
        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            if (projectile.hit) projectile.hit(enemy);
            else { enemy.takeDamage(projectile.damage || 10); projectile.destroy(); }
        });
        this.physics.add.overlap(this.player, this.loots, (player, lootItem) => this.collectLoot(lootItem));

        // UI
        this.createUI();
        this.createUpgradeUI();
        this.createPauseMenu();

        this.startWaveTimer(15); 
        this.updateUI();

        // --- 4. MARCAR ESCENA COMO LISTA ---
        this.isSceneReady = true;
    }

    update(time, delta) {
        // Si la escena no está lista o está pausada, no hacer nada
        if (!this.isSceneReady || this.isPaused) return;

        if (this.player) this.player.update(time, delta);
        
        // Iterar torres de forma segura
        if (this.towers) {
            this.towers.children.iterate(tower => { 
                if (tower && tower.active) tower.update(time, delta); 
            });
        }

        if (gameState.heroLevel > this.lastHeroLevel) {
            this.showLevelUpEffect();
            this.lastHeroLevel = gameState.heroLevel;
        }

        this.updateUI();
        this.updateSkillUI();

        if (this.isTimerRunning) {
            this.timeToNextWave -= delta;
            if (this.timeToNextWave <= 0) {
                this.startNextWave();
            } else {
                const seconds = Math.ceil(this.timeToNextWave / 1000);
                if (this.waveTimerBtnText) this.waveTimerBtnText.setText(`SIGUIENTE OLEADA: ${seconds}s\n(Clic para iniciar)`);
            }
        }
    }

    // ... (El resto de funciones se mantienen idénticas a la versión anterior) ...
    // Copia y pega las funciones auxiliares aquí para que el archivo esté completo.
    
    // --- FUNCIONES AUXILIARES (Esenciales para que funcione) ---
    onEnemyKilled(enemy) { try { this.coins += (enemy.coinReward || 10); RPGSystem.gainHeroXP(enemy.xpReward || 10); this.spawnLoot(enemy.x, enemy.y); this.createExplosion(enemy.x, enemy.y, enemy.colorVal); this.showFloatingText(80, 850, `+$${enemy.coinReward}`, '#ffff00'); this.updateUI(); } catch (err) { console.error("Error kill:", err); } }
    onEnemyLeaks(damage) { gameState.baseHp -= damage; this.cameras.main.flash(200, 255, 0, 0); this.updateUI(); if (gameState.baseHp <= 0) this.gameOver(); }
    createPauseMenu() {
        this.pauseContainer = this.add.container(640, 480).setDepth(10000).setVisible(false).setScrollFactor(0);
        const w = this.scale.width; const h = this.scale.height; // Usar dimensiones reales
        this.pauseContainer.setPosition(w/2, h/2); // Centrar dinámicamente
        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setInteractive(); 
        const panel = this.add.rectangle(0, 0, 400, 300, 0x222222).setStrokeStyle(4, 0xffd700);
        const title = this.add.text(0, -100, "PAUSA", { fontSize: '40px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        const resumeBtn = this.add.rectangle(0, 0, 250, 50, 0x006400).setInteractive({ useHandCursor: true });
        const resumeTxt = this.add.text(0, 0, "CONTINUAR", { fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const resumeAction = () => this.togglePause();
        resumeBtn.on('pointerdown', resumeAction); resumeTxt.on('pointerdown', resumeAction);
        const exitBtn = this.add.rectangle(0, 80, 250, 50, 0xaa0000).setInteractive({ useHandCursor: true });
        const exitTxt = this.add.text(0, 80, "SALIR AL MENÚ", { fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const exitAction = () => { gameState.playerStats.hp = gameState.playerStats.maxHp; this.scene.start('MainMenuScene'); };
        exitBtn.on('pointerdown', exitAction); exitTxt.on('pointerdown', exitAction);
        this.pauseContainer.add([bg, panel, title, resumeBtn, resumeTxt, exitBtn, exitTxt]);
    }
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) { this.physics.pause(); this.pauseContainer.setVisible(true); this.tweens.pauseAll(); if (this.spawnTimer) this.spawnTimer.paused = true; } 
        else { this.physics.resume(); this.pauseContainer.setVisible(false); this.tweens.resumeAll(); if (this.spawnTimer) this.spawnTimer.paused = false; }
    }
    createExplosion(x, y, color) {
        const particles = this.add.particles('pixel');
        const emitter = particles.createEmitter({ x: x, y: y, speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 }, scale: { start: 2, end: 0 }, blendMode: 'ADD', lifespan: 500, gravityY: 200, quantity: 10, tint: color });
        this.time.delayedCall(600, () => { if(particles) particles.destroy(); });
    }
    showFloatingText(x, y, message, color = '#fff') {
        const isCrit = color === '#ffaa00'; const fontSize = isCrit ? '32px' : '20px';
        const text = this.add.text(x, y, message, { fontSize: fontSize, fontStyle: 'bold', color: color, stroke: '#000', strokeThickness: isCrit ? 6 : 3 }).setOrigin(0.5).setDepth(2000);
        this.tweens.add({ targets: text, y: y - 50, alpha: 0, scale: isCrit ? 1.5 : 1.2, duration: 800, ease: 'Power2', onComplete: () => text.destroy() });
    }
    showLevelUpEffect() {
        const w = this.scale.width; const h = this.scale.height;
        const txt = this.add.text(w/2, h/2, "¡LEVEL UP!", { fontSize: '64px', fontStyle: 'bold', color: '#ffd700', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(3000).setScale(0);
        this.tweens.add({ targets: txt, scale: 1.5, duration: 500, ease: 'Back.out', yoyo: true, hold: 1000, onComplete: () => txt.destroy() });
        this.cameras.main.flash(500, 255, 215, 0);
        gameState.playerStats.hp = gameState.playerStats.maxHp;
        if(this.player && this.player.createEffect) this.player.createEffect('heal');
    }
    startNextWaveAction() { if (this.isTimerRunning) this.startNextWave(); }
    startWaveTimer(seconds) { this.isTimerRunning = true; this.timeToNextWave = seconds * 1000; this.waveTimerContainer.setVisible(true); }
    startNextWave() {
        this.isTimerRunning = false; this.waveTimerContainer.setVisible(false);
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.currentWave > this.totalWaves) { this.victory(); return; }
        this.waveInProgress = true;
        const levelDiff = this.currentLevelData.difficulty || 1;
        let enemyType = 'normal'; let count = 5 + (this.currentWave * 2); let interval = 1500; let hpMult = levelDiff;
        if (this.currentWave === 1) { enemyType = 'normal'; hpMult *= 1.0; } 
        else if (this.currentWave === 2) { enemyType = 'speed'; count = 10; interval = 800; hpMult *= 0.8; } 
        else if (this.currentWave === 3) { enemyType = 'tank'; count = 4; interval = 2500; hpMult *= 1.5; } 
        else if (this.currentWave === 4) { enemyType = 'mix_healer'; count = 8; interval = 1200; hpMult *= 1.2; } 
        else if (this.currentWave === 5) { enemyType = 'boss'; count = 1; hpMult *= 5.0; this.waveInfoText.setText("OLEADA: BOSS!"); this.waveInfoText.setColor('#ff0000'); }
        if (this.currentWave !== 5) { this.waveInfoText.setText(`OLEADA: ${this.currentWave}/${this.totalWaves}`); this.waveInfoText.setColor(this.theme.accent); }
        this.enemiesToSpawn = count;
        this.spawnTimer = this.time.addEvent({ delay: interval, callback: () => {
            let actualType = enemyType; if (enemyType === 'mix_healer') actualType = Math.random() > 0.5 ? 'healer' : 'normal';
            this.spawnEnemy(hpMult, actualType); this.enemiesToSpawn--; if (this.enemiesToSpawn <= 0) this.spawnTimer.remove();
        }, repeat: count - 1 });
    }
    spawnEnemy(hpMult, type) { 
        const enemy = new Enemy(this, this.pathPoints, hpMult, type); 
        this.enemies.add(enemy); 
    }
    checkWaveStatus() { if (this.isTimerRunning) return; if (this.enemiesToSpawn <= 0 && this.enemies.countActive(true) === 0) { this.waveInProgress = false; this.currentWave++; if (this.currentWave > this.totalWaves) this.victory(); else this.startWaveTimer(12); } }
    addEnemyReward(amount) { this.coins += amount; this.updateUI(); this.showFloatingText(80, 850, `+$${amount}`, '#ffff00'); }
    createBuildSlots() { 
        const rawSlots = this.currentLevelData.towerSlots || []; 
        rawSlots.forEach(slot => { 
            const site = new BuildSite(this, slot.x * this.sx, slot.y * this.sy); 
            this.buildSites.add(site); 
            site.on('pointerdown', () => this.tryBuildTower(site)); 
        }); 
    }
    tryBuildTower(site) { if (site.isOccupied) return; const stats = TOWER_TYPES[this.selectedTowerType]; if (this.coins >= stats.baseCost) { this.coins -= stats.baseCost; const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); this.towers.add(tower); site.occupy(); this.updateUI(); this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' }); } else { this.cameras.main.shake(100, 0.005); } }
    createUpgradeUI() { this.upgradeContainer = this.add.container(0, 0).setDepth(2000); this.upgradeContainer.setVisible(false); const bg = this.add.rectangle(0, 0, 220, 160, 0x000000, 0.9).setStrokeStyle(2, 0xffffff).setInteractive(); this.upgradeText = this.add.text(0, -50, '', { fontSize: '14px', align: 'center', color: '#fff' }).setOrigin(0.5); this.upgradeBtn = this.add.rectangle(0, 0, 180, 35, 0x00aa00).setInteractive({ useHandCursor: true }); this.upgradeBtnText = this.add.text(0, 0, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.sellBtn = this.add.rectangle(0, 50, 180, 35, 0xaa0000).setInteractive({ useHandCursor: true }); this.sellBtnText = this.add.text(0, 50, 'VENDER', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower()); this.sellBtn.on('pointerdown', () => this.sellTower()); this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, this.upgradeBtnText, this.sellBtn, this.sellBtnText]); }
    openUpgradeMenu(tower) { this.selectedTowerToUpgrade = tower; this.upgradeContainer.setPosition(tower.x, tower.y - 100); this.upgradeContainer.setVisible(true); tower.rangeCircle.setVisible(true); this.updateUpgradeMenuText(); }
    closeUpgradeMenu() { if (this.selectedTowerToUpgrade) this.selectedTowerToUpgrade.rangeCircle.setVisible(false); this.selectedTowerToUpgrade = null; this.upgradeContainer.setVisible(false); }
    updateUpgradeMenuText() { if (!this.selectedTowerToUpgrade) return; const t = this.selectedTowerToUpgrade; if (t.level >= t.maxLevel) { this.upgradeText.setText(`${t.typeName} (MAX)\nDaño: ${t.damage}`); this.upgradeBtn.setVisible(false); this.upgradeBtnText.setVisible(false); } else { this.upgradeBtn.setVisible(true); this.upgradeBtnText.setVisible(true); this.upgradeText.setText(`${t.typeName} Lv ${t.level}\nDaño: ${t.damage} -> ${Math.floor(t.damage * 1.2)}`); this.upgradeBtnText.setText(`MEJORAR ($${t.upgradeCost})`); } this.sellBtnText.setText(`VENDER (+$${t.totalInvestment})`); }
    tryUpgradeTower() { const t = this.selectedTowerToUpgrade; if (t && this.coins >= t.upgradeCost) { this.coins -= t.upgradeCost; t.upgrade(); this.updateUpgradeMenuText(); this.updateUI(); } }
    sellTower() { const t = this.selectedTowerToUpgrade; if (t) { this.coins += t.totalInvestment; this.updateUI(); if (t.buildSite) t.buildSite.free(); t.destroy(); this.closeUpgradeMenu(); this.showFloatingText(t.x, t.y - 50, `+$${t.totalInvestment}`, '#ffff00'); } }
    updateUI() { const w = this.scale.width; const h = this.scale.height; const currentTower = TOWER_TYPES[this.selectedTowerType]; this.economyText.setText(`$${this.coins}`); this.buildText.setText(`> ${currentTower.name.toUpperCase()} <\nCOSTO: $${currentTower.baseCost}`); const pStats = gameState.playerStats; const heroHp = Math.max(0, Math.floor(pStats.hp)); this.livesText.setText(`❤️ HÉROE: ${heroHp}/${pStats.maxHp}\n🏰 CASTILLO: ${gameState.baseHp}`); if(this.xpBarFill) this.xpBarFill.width = 200 * Math.min(1, gameState.heroXP / gameState.heroMaxXP); if(this.lvlText) this.lvlText.setText(`Lvl ${gameState.heroLevel}`); }
    updateSkillUI() { if (!this.player) return; const cd = this.player.skillCooldown; const maxCd = this.player.skillMaxCooldown; if (cd > 0) { const progress = 1 - (cd / maxCd); this.skillBar.width = 200 * progress; this.skillBar.setFillStyle(0x555555); this.skillText.setText(`${(cd / 1000).toFixed(1)}s`); } else { this.skillBar.width = 200; this.skillBar.setFillStyle(this.theme.accent); if (this.skillText.text.includes("s")) this.skillText.setText("HABILIDAD\n(Espacio)"); } }
    triggerPlayerSkill() { if (!this.player) return; const result = this.player.castSkill(); if (result.success) { this.tweens.add({ targets: this.skillBtnContainer, scale: 0.9, yoyo: true, duration: 100 }); } }
    spawnLoot(x, y) { const levelId = this.currentLevelData.id || 1; if (Math.random() > 0.20) return; const luck = (levelId - 1) * 0.05; const roll = Math.random() * 100; let rarity = 'common'; const tGold = 0.01 + (luck * 0.01); const tRed = 0.10 + (luck * 0.05); const tPurple = 0.29 + (luck * 0.1); const tGreen = 5.09 + (luck * 0.5); if (roll < tGold) rarity = 'legendary'; else if (roll < tRed) rarity = 'epic'; else if (roll < tPurple) rarity = 'rare'; else if (roll < tGreen) rarity = 'uncommon'; else rarity = 'common'; const randType = Math.random(); let type = 'wood'; if (randType > 0.66) type = 'copper'; else if (randType > 0.33) type = 'cloth'; const item = new Loot(this, x, y, type, rarity); this.loots.add(item); }
    collectLoot(lootItem) { gameState.materials[lootItem.typeKey][lootItem.rarityKey]++; if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {}; if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0; this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++; this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); lootItem.destroy(); }
    createSpawnIndicator() { if (!this.pathPoints || this.pathPoints.length === 0) return; const startX = this.pathPoints[0].x; const startY = this.pathPoints[0].y; const marker = this.add.circle(startX, startY, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); this.add.text(startX, startY - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); }
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.scene.start('ResultScene', { success: false, levelId: this.currentLevelData.id }); }
    victory() { this.physics.pause(); const goldReward = this.currentLevelData.rewardGold || 100; gameState.gold += goldReward; this.scene.start('ResultScene', { success: true, levelId: this.currentLevelData.id, castleHp: gameState.baseHp, rewards: { gold: goldReward } }); }
    createUI() { const w = this.scale.width; const h = this.scale.height; const uiDepth = 1000; const accent = this.theme.accent; this.add.rectangle(w/2, 60, w, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth); this.add.rectangle(w/2, 120, w, 4, accent).setScrollFactor(0).setDepth(uiDepth); this.livesText = this.add.text(30, 15, '', { fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setScrollFactor(0).setDepth(uiDepth + 1); this.add.text(30, 45, 'XP:', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); this.xpBarBg = this.add.rectangle(60, 52, 200, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); this.xpBarFill = this.add.rectangle(60, 52, 0, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 2); this.lvlText = this.add.text(270, 45, 'Lvl 1', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); this.waveInfoText = this.add.text(w - 30, 40, 'OLEADA: 1', { fontSize: '28px', fontStyle: 'bold', color: accent }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); this.waveTimerContainer = this.add.container(w/2, 60).setScrollFactor(0).setDepth(uiDepth + 2); this.waveTimerContainer.setSize(320, 60); this.waveTimerContainer.setInteractive({ useHandCursor: true }); const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff); this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontSize: '18px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5); this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]); this.waveTimerContainer.setVisible(false); this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction()); const barHeight = 120; const botY = h - (barHeight / 2); this.add.rectangle(w/2, botY, w, barHeight, 0x111111).setScrollFactor(0).setDepth(uiDepth); this.add.rectangle(w/2, botY - (barHeight/2), w, 4, accent).setScrollFactor(0).setDepth(uiDepth); const contentY = botY; this.add.text(40, contentY - 30, 'TESORO:', { fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(uiDepth + 1); this.economyText = this.add.text(40, contentY, '$0', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(uiDepth + 1); this.add.text(300, contentY - 25, 'SELECTOR DE TORRES (1-3)', { fontSize: '14px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1); this.buildText = this.add.text(300, contentY, '', { fontSize: '20px', color: accent }).setScrollFactor(0).setDepth(uiDepth + 1); this.skillBtnContainer = this.add.container(w - 250, contentY).setScrollFactor(0).setDepth(uiDepth + 1); const skillBg = this.add.rectangle(0, 0, 200, 80, 0x222222).setStrokeStyle(2, 0x555555); this.skillBar = this.add.rectangle(-100, 0, 0, 80, accent).setOrigin(0, 0.5); this.skillBtn = this.add.rectangle(0, 0, 200, 80, 0x000000, 0).setInteractive({ useHandCursor: true }); this.skillText = this.add.text(0, 0, "HABILIDAD\n(Espacio)", { fontSize: '16px', align: 'center', fontStyle: 'bold' }).setOrigin(0.5); this.skillBtnContainer.add([skillBg, this.skillBar, this.skillBtn, this.skillText]); this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill()); const exitBtn = this.add.rectangle(w - 60, contentY, 80, 80, 0xaa0000).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(uiDepth + 1).setStrokeStyle(2, 0xffffff); this.add.text(w - 60, contentY, 'X', { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 2); exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene')); }
}