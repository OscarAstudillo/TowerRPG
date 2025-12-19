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
import RPGSystem from '../systems/RPGSystem.js'; // Importar RPGSystem

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 0; 
        this.selectedTowerToUpgrade = null; 
        this.timeToNextWave = 0; 
        this.isTimerRunning = false;
        this.TOP_MARGIN = 120;
    }

    init(data) {
        this.currentLevelData = data.levelData || { id: 1, name: "Nivel Debug", startCoins: 500, difficulty: 1, path: [], towerSlots: [] };
        
        this.theme = this.currentLevelData.theme || {
            background: 0x333333,
            path: 0x555555,
            accent: 0x00ffff 
        };

        updatePlayerStats();
        
        // Guardar nivel inicial para detectar subidas
        this.lastHeroLevel = gameState.heroLevel;
    }

    create() {
        // CAMARA
        this.cameras.main.scrollY = -this.TOP_MARGIN;
        this.cameras.main.setBackgroundColor(0x111111);

        const pathPoints = this.currentLevelData.path;
        if (!pathPoints || pathPoints.length === 0) {
            console.error("¡ERROR DE CAMINO!"); this.scene.start('WorldMapScene'); return; 
        }
        this.pathPoints = pathPoints;
        this.coins = this.currentLevelData.startCoins;
        this.currentWave = 1;
        this.totalWaves = 5;
        this.waveInProgress = false;
        this.sessionLoot = {}; 
        gameState.baseHp = 20;

        // MAPA
        const graphics = this.add.graphics();
        graphics.fillStyle(this.theme.background, 1);
        graphics.fillRect(0, 0, 1280, 720);
        
        graphics.lineStyle(50, this.theme.path, 1);
        graphics.beginPath();
        graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
        graphics.strokePath();
        
        graphics.lineStyle(4, 0x000000, 0.3);
        graphics.strokePath();

        // GRUPOS
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: false });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.createBuildSlots();
        this.createSpawnIndicator();

        this.player = new Player(this, 640, 360, gameState.selectedClass, this.enemies, this.projectiles);

        // INPUTS
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            let target = gameObject;
            if (gameObject.parentContainer instanceof Tower) target = gameObject.parentContainer;
            
            if (target instanceof Tower) this.openUpgradeMenu(target);
            else if (gameObject.parentContainer !== this.upgradeContainer && gameObject !== this.upgradeContainer) {
                this.closeUpgradeMenu();
            }
        });
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (currentlyOver.length === 0) this.closeUpgradeMenu();
        });

        this.input.keyboard.on('keydown-ONE', () => { this.selectedTowerType = 'archer'; this.updateUI(); });
        this.input.keyboard.on('keydown-TWO', () => { this.selectedTowerType = 'cannon'; this.updateUI(); });
        this.input.keyboard.on('keydown-THREE', () => { this.selectedTowerType = 'mage'; this.updateUI(); });

        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            // Usamos la lógica interna del proyectil
            if (projectile.hit) {
                projectile.hit(enemy);
            } else {
                // Fallback por si acaso
                enemy.takeDamage(projectile.damage || 10);
                projectile.destroy();
            }
        });
        this.physics.add.overlap(this.player, this.loots, (player, lootItem) => this.collectLoot(lootItem));

        // SISTEMAS
        this.createParticles();
        this.createUI();
        this.createUpgradeUI();

        this.startWaveTimer(15); 
        this.updateUI();
    }

    update(time, delta) {
        if (this.player) this.player.update(time, delta);
        
        this.towers.children.iterate(tower => {
            if (tower && tower.active) tower.update(time, delta);
        });

        // Chequear Level Up
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
                this.waveTimerBtnText.setText(`SIGUIENTE OLEADA: ${seconds}s\n(Clic para iniciar)`);
            }
        }
    }

    // --- EFECTOS VISUALES ---
    createParticles() {
        this.particleManager = this.add.particles('particle_texture'); 
        if (!this.textures.exists('pixel')) {
            const graphics = this.make.graphics({x: 0, y: 0, add: false});
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('pixel', 4, 4);
        }
    }

    createExplosion(x, y, color) {
        const emitter = this.add.particles(x, y, 'pixel', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 200,
            quantity: 10,
            tint: color
        });
        this.time.delayedCall(600, () => emitter.destroy());
    }

    showFloatingText(x, y, message, color = '#fff') {
        const isCrit = color === '#ffaa00'; // Detectar si es crítico por el color
        const fontSize = isCrit ? '32px' : '20px';
        
        const text = this.add.text(x, y, message, { 
            fontSize: fontSize, 
            fontStyle: 'bold',
            color: color, 
            stroke: '#000', 
            strokeThickness: isCrit ? 6 : 3 
        }).setOrigin(0.5).setDepth(2000);

        // Animación diferente para críticos
        if (isCrit) {
            this.tweens.add({
                targets: text,
                y: y - 80, // Sube más
                scale: { from: 2, to: 1 }, // Efecto de golpe "POP"
                alpha: 0,
                duration: 1200,
                ease: 'Bounce.easeOut',
                onComplete: () => text.destroy()
            });
        } else {
            this.tweens.add({
                targets: text,
                y: y - 50,
                alpha: 0,
                scale: 1.2,
                duration: 800,
                ease: 'Power2',
                onComplete: () => text.destroy()
            });
        }
    }

    showLevelUpEffect() {
        // Texto Glorioso
        const txt = this.add.text(640, 360, "¡LEVEL UP!", { 
            fontSize: '64px', fontStyle: 'bold', color: '#ffd700', stroke: '#fff', strokeThickness: 6 
        }).setOrigin(0.5).setDepth(3000).setScale(0);

        this.tweens.add({
            targets: txt,
            scale: 1.5,
            duration: 500,
            ease: 'Back.out',
            yoyo: true,
            hold: 1000,
            onComplete: () => txt.destroy()
        });

        // Efecto sonoro visual (Flash dorado)
        this.cameras.main.flash(500, 255, 215, 0);
        
        // Recuperar vida y maná (si hubiera)
        gameState.playerStats.hp = gameState.playerStats.maxHp;
        this.player.createEffect('heal');
    }

    // --- UI GLOBAL (CON BARRA DE XP) ---
    createUI() {
        const uiDepth = 1000;
        const accent = this.theme.accent;

        // TOP BAR
        this.add.rectangle(640, 60, 1280, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth);
        this.add.rectangle(640, 120, 1280, 4, accent).setScrollFactor(0).setDepth(uiDepth);
        
        // Info Vidas
        this.livesText = this.add.text(30, 15, '', { fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setScrollFactor(0).setDepth(uiDepth + 1);
        
        // BARRA DE XP (Nueva)
        this.add.text(30, 45, 'XP:', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.xpBarBg = this.add.rectangle(60, 52, 200, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 1);
        this.xpBarFill = this.add.rectangle(60, 52, 0, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 2);
        this.lvlText = this.add.text(270, 45, 'Lvl 1', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1);

        // Oleada
        this.waveInfoText = this.add.text(1250, 40, 'OLEADA: 1', { fontSize: '28px', fontStyle: 'bold', color: accent }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1);

        // Botón Timer
        this.waveTimerContainer = this.add.container(640, 60).setScrollFactor(0).setDepth(uiDepth + 2);
        this.waveTimerContainer.setSize(320, 60);
        this.waveTimerContainer.setInteractive({ useHandCursor: true });
        const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff);
        this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontSize: '18px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]);
        this.waveTimerContainer.setVisible(false);
        this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction());
        
        // BOTTOM BAR
        const botY = 900; 
        this.add.rectangle(640, botY, 1280, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth);
        this.add.rectangle(640, 840, 1280, 4, accent).setScrollFactor(0).setDepth(uiDepth);
        this.add.text(40, 860, 'TESORO:', { fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.economyText = this.add.text(40, 890, '$0', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.add.text(300, 865, 'SELECTOR DE TORRES (Teclas 1-3)', { fontSize: '14px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.buildText = this.add.text(300, 890, '', { fontSize: '20px', color: accent }).setScrollFactor(0).setDepth(uiDepth + 1);

        // Skill y Salir
        this.skillBtnContainer = this.add.container(1050, botY).setScrollFactor(0).setDepth(uiDepth + 1);
        const skillBg = this.add.rectangle(0, 0, 200, 80, 0x222222).setStrokeStyle(2, 0x555555);
        this.skillBar = this.add.rectangle(-100, 0, 0, 80, accent).setOrigin(0, 0.5); 
        this.skillBtn = this.add.rectangle(0, 0, 200, 80, 0x000000, 0).setInteractive({ useHandCursor: true });
        this.skillText = this.add.text(0, 0, "HABILIDAD\n(Espacio)", { fontSize: '16px', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
        this.skillBtnContainer.add([skillBg, this.skillBar, this.skillBtn, this.skillText]);
        this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill());

        const exitBtn = this.add.rectangle(1220, botY, 80, 80, 0xaa0000).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(uiDepth + 1).setStrokeStyle(2, 0xffffff);
        this.add.text(1220, botY, 'X', { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 2);
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    updateUI() {
        const currentTower = TOWER_TYPES[this.selectedTowerType];
        this.economyText.setText(`$${this.coins}`);
        this.buildText.setText(`> ${currentTower.name.toUpperCase()} <\nCOSTO: $${currentTower.baseCost}`);
        
        const pStats = gameState.playerStats;
        const heroHp = Math.max(0, Math.floor(pStats.hp));
        this.livesText.setText(`❤️ HÉROE: ${heroHp}/${pStats.maxHp}   |   🏰 CASTILLO: ${gameState.baseHp}`);

        // Actualizar Barra de XP
        const xpPercent = Math.min(1, gameState.heroXP / gameState.heroMaxXP);
        this.xpBarFill.width = 200 * xpPercent;
        this.lvlText.setText(`Lvl ${gameState.heroLevel}`);
    }

    // ... (Resto de funciones: updateSkillUI, startNextWave, etc. MANTENER IGUAL QUE ANTES) ...
    // Asegúrate de copiar las funciones auxiliares de tu versión anterior o del bloque anterior de respuestas.
    // Solo hemos modificado init, create, update, createUI, createParticles, createExplosion, showFloatingText, showLevelUpEffect.
    // Las funciones de lógica de juego (spawnEnemy, onEnemyLeaks, etc.) siguen igual.
    
    // REPITO FUNCIONES AUXILIARES CLAVE PARA COPIAR Y PEGAR SEGURO:
    startNextWaveAction() { if (this.isTimerRunning) this.startNextWave(); }
    startWaveTimer(seconds) { this.isTimerRunning = true; this.timeToNextWave = seconds * 1000; this.waveTimerContainer.setVisible(true); }
    startNextWave() {
        this.isTimerRunning = false;
        this.waveTimerContainer.setVisible(false);
        if (this.spawnTimer) this.spawnTimer.remove();
        
        if (this.currentWave > this.totalWaves) { this.victory(); return; }

        this.waveInProgress = true;
        
        // --- CONFIGURACIÓN DE LA OLEADA ---
        const levelDiff = this.currentLevelData.difficulty || 1;
        
        // Definir composición según número de oleada
        let enemyType = 'normal';
        let count = 5 + (this.currentWave * 2);
        let interval = 1500;
        let hpMult = levelDiff; // Base multiplier

        if (this.currentWave === 1) {
            // Oleada 1: Normales
            enemyType = 'normal';
            hpMult *= 1.0;
        } else if (this.currentWave === 2) {
            // Oleada 2: Rápidos (Prueba de DPS)
            enemyType = 'speed';
            count = 10;
            interval = 800; // Salen muy seguido
            hpMult *= 0.8;
        } else if (this.currentWave === 3) {
            // Oleada 3: Tanques (Prueba de Daño sostenido)
            enemyType = 'tank';
            count = 4;
            interval = 2500; // Lentos en salir
            hpMult *= 1.5;
        } else if (this.currentWave === 4) {
            // Oleada 4: Sanadores + Normales (Mezcla)
            // Para simplificar, usaremos un truco: alternar en el spawn
            enemyType = 'mix_healer'; 
            count = 8;
            interval = 1200;
            hpMult *= 1.2;
        } else if (this.currentWave === 5) {
            // Oleada 5: BOSS FINAL
            enemyType = 'boss';
            count = 1;
            hpMult *= 5.0; // Mucha vida
            this.waveInfoText.setText("OLEADA: BOSS!");
            this.waveInfoText.setColor('#ff0000');
        }

        if (this.currentWave !== 5) {
            this.waveInfoText.setText(`OLEADA: ${this.currentWave}/${this.totalWaves}`);
            this.waveInfoText.setColor(this.theme.accent);
        }

        this.enemiesToSpawn = count;
        
        // Timer de Spawn
        this.spawnTimer = this.time.addEvent({
            delay: interval,
            callback: () => {
                let actualType = enemyType;
                
                // Lógica para oleadas mixtas
                if (enemyType === 'mix_healer') {
                    // 50% Healer, 50% Normal
                    actualType = Math.random() > 0.5 ? 'healer' : 'normal';
                }

                this.spawnEnemy(hpMult, actualType); // Pasamos HP Mult y Tipo
                
                this.enemiesToSpawn--;
                if (this.enemiesToSpawn <= 0) this.spawnTimer.remove();
            },
            repeat: count - 1
        });
    }
    spawnEnemy(hpMult, type) {
        // Nota: Quitamos speedMult como parámetro porque ahora lo decide el 'type' dentro de Enemy
        const enemy = new Enemy(this, this.pathPoints, hpMult, type);
        this.enemies.add(enemy);
    }
    checkWaveStatus() { if (this.isTimerRunning) return; if (this.enemiesToSpawn <= 0 && this.enemies.countActive(true) === 0) { this.waveInProgress = false; this.currentWave++; if (this.currentWave > this.totalWaves) this.victory(); else this.startWaveTimer(12); } }
    addEnemyReward(amount) { this.coins += amount; this.updateUI(); this.showFloatingText(80, 850, `+$${amount}`, '#ffff00'); }
    createBuildSlots() { const slots = this.currentLevelData.towerSlots || []; slots.forEach(slot => { const site = new BuildSite(this, slot.x, slot.y); this.buildSites.add(site); site.on('pointerdown', () => this.tryBuildTower(site)); }); }
    tryBuildTower(site) { if (site.isOccupied) return; const stats = TOWER_TYPES[this.selectedTowerType]; if (this.coins >= stats.baseCost) { this.coins -= stats.baseCost; const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); this.towers.add(tower); site.occupy(); this.updateUI(); this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' }); } else { this.cameras.main.shake(100, 0.005); } }
    createUpgradeUI() { this.upgradeContainer = this.add.container(0, 0).setDepth(2000); this.upgradeContainer.setVisible(false); const bg = this.add.rectangle(0, 0, 220, 160, 0x000000, 0.9).setStrokeStyle(2, 0xffffff).setInteractive(); this.upgradeText = this.add.text(0, -50, '', { fontSize: '14px', align: 'center', color: '#fff' }).setOrigin(0.5); this.upgradeBtn = this.add.rectangle(0, 0, 180, 35, 0x00aa00).setInteractive({ useHandCursor: true }); this.upgradeBtnText = this.add.text(0, 0, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.sellBtn = this.add.rectangle(0, 50, 180, 35, 0xaa0000).setInteractive({ useHandCursor: true }); this.sellBtnText = this.add.text(0, 50, 'VENDER', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower()); this.sellBtn.on('pointerdown', () => this.sellTower()); this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, this.upgradeBtnText, this.sellBtn, this.sellBtnText]); }
    openUpgradeMenu(tower) { this.selectedTowerToUpgrade = tower; this.upgradeContainer.setPosition(tower.x, tower.y - 100); this.upgradeContainer.setVisible(true); tower.rangeCircle.setVisible(true); this.updateUpgradeMenuText(); }
    closeUpgradeMenu() { if (this.selectedTowerToUpgrade) this.selectedTowerToUpgrade.rangeCircle.setVisible(false); this.selectedTowerToUpgrade = null; this.upgradeContainer.setVisible(false); }
    updateUpgradeMenuText() { if (!this.selectedTowerToUpgrade) return; const t = this.selectedTowerToUpgrade; if (t.level >= t.maxLevel) { this.upgradeText.setText(`${t.typeName} (MAX)\nDaño: ${t.damage}`); this.upgradeBtn.setVisible(false); this.upgradeBtnText.setVisible(false); } else { this.upgradeBtn.setVisible(true); this.upgradeBtnText.setVisible(true); this.upgradeText.setText(`${t.typeName} Lv ${t.level}\nDaño: ${t.damage} -> ${Math.floor(t.damage * 1.2)}`); this.upgradeBtnText.setText(`MEJORAR ($${t.upgradeCost})`); } this.sellBtnText.setText(`VENDER (+$${t.totalInvestment})`); }
    tryUpgradeTower() { const t = this.selectedTowerToUpgrade; if (t && this.coins >= t.upgradeCost) { this.coins -= t.upgradeCost; t.upgrade(); this.updateUpgradeMenuText(); this.updateUI(); } }
    sellTower() { const t = this.selectedTowerToUpgrade; if (t) { this.coins += t.totalInvestment; this.updateUI(); if (t.buildSite) t.buildSite.free(); t.destroy(); this.closeUpgradeMenu(); this.showFloatingText(t.x, t.y - 50, `+$${t.totalInvestment}`, '#ffff00'); } }
    updateSkillUI() { if (!this.player) return; const cd = this.player.skillCooldown; const maxCd = this.player.skillMaxCooldown; if (cd > 0) { const progress = 1 - (cd / maxCd); this.skillBar.width = 200 * progress; this.skillBar.setFillStyle(0x555555); this.skillText.setText(`${(cd / 1000).toFixed(1)}s`); } else { this.skillBar.width = 200; this.skillBar.setFillStyle(this.theme.accent); if (this.skillText.text.includes("s")) this.skillText.setText("HABILIDAD\n(Espacio)"); } }
    triggerPlayerSkill() { if (!this.player) return; const result = this.player.castSkill(); if (result.success) { this.tweens.add({ targets: this.skillBtnContainer, scale: 0.9, yoyo: true, duration: 100 }); } }
    spawnLoot(x, y) { const levelId = this.currentLevelData.id || 1; if (Math.random() > 0.20) return; const luck = (levelId - 1) * 0.05; const roll = Math.random() * 100; let rarity = 'common'; const tGold = 0.01 + (luck * 0.01); const tRed = 0.10 + (luck * 0.05); const tPurple = 0.29 + (luck * 0.1); const tGreen = 5.09 + (luck * 0.5); if (roll < tGold) rarity = 'legendary'; else if (roll < tRed) rarity = 'epic'; else if (roll < tPurple) rarity = 'rare'; else if (roll < tGreen) rarity = 'uncommon'; else rarity = 'common'; const randType = Math.random(); let type = 'wood'; if (randType > 0.66) type = 'copper'; else if (randType > 0.33) type = 'cloth'; const item = new Loot(this, x, y, type, rarity); this.loots.add(item); }
    collectLoot(lootItem) { gameState.materials[lootItem.typeKey][lootItem.rarityKey]++; if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {}; if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0; this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++; this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); lootItem.destroy(); }
    onEnemyLeaks(damage) { gameState.baseHp -= 1; this.cameras.main.flash(200, 255, 0, 0); this.updateUI(); if (gameState.baseHp <= 0) this.gameOver(); }
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.waveInfoText.setText("DERROTA"); this.time.delayedCall(3000, () => { gameState.playerStats.hp = gameState.playerStats.maxHp; this.scene.start('MainMenuScene'); }); }
    victory() { this.physics.pause(); if (this.currentLevelData.id >= gameState.levelsUnlocked) gameState.levelsUnlocked = this.currentLevelData.id + 1; const goldReward = this.currentLevelData.rewardGold || 100; gameState.gold += goldReward; SaveSystem.save(); const panel = this.add.container(640, 360).setDepth(2000); const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9).setStrokeStyle(4, 0xffd700); const t1 = this.add.text(0, -100, "¡VICTORIA!", {fontSize:'40px', color:'#00ff00', fontStyle:'bold'}).setOrigin(0.5); const t2 = this.add.text(0, -40, `Oro: +${goldReward}`, {fontSize:'24px'}).setOrigin(0.5); const btn = this.add.rectangle(0, 80, 200, 50, 0x006400).setInteractive({useHandCursor:true}); const btnT = this.add.text(0, 80, "CONTINUAR", {fontSize:'20px'}).setOrigin(0.5); panel.add([bg, t1, t2, btn, btnT]); btn.on('pointerdown', ()=>this.scene.start('WorldMapScene')); }
    createSpawnIndicator() { if (!this.pathPoints || this.pathPoints.length === 0) return; const startX = this.pathPoints[0].x; const startY = this.pathPoints[0].y; const marker = this.add.circle(startX, startY, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); this.add.text(startX, startY - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); }
}