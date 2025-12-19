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
        updatePlayerStats();
    }

    create() {
        // CAMARA Y MARGENES
        this.cameras.main.scrollY = -this.TOP_MARGIN;
        this.cameras.main.setBackgroundColor('#222222');

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
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(0, 0, 1280, 720);
        
        graphics.lineStyle(40, 0x555555, 1);
        graphics.beginPath();
        graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
        graphics.strokePath();
        
        graphics.lineStyle(2, 0x888888, 0.5);
        graphics.strokePath();

        // GRUPOS
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: true });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.createBuildSlots();
        this.createSpawnIndicator();

        this.player = new Player(this, 640, 360, gameState.selectedClass, this.enemies, this.projectiles);

        // INPUTS
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            // Detectar clic en torre (contenedor o sus hijos)
            let target = gameObject;
            if (gameObject.parentContainer instanceof Tower) target = gameObject.parentContainer;
            
            if (target instanceof Tower) this.openUpgradeMenu(target);
            else if (!(gameObject.parentContainer === this.upgradeContainer)) this.closeUpgradeMenu();
        });
        
        this.input.keyboard.on('keydown-ONE', () => { this.selectedTowerType = 'archer'; this.updateUI(); });
        this.input.keyboard.on('keydown-TWO', () => { this.selectedTowerType = 'cannon'; this.updateUI(); });
        this.input.keyboard.on('keydown-THREE', () => { this.selectedTowerType = 'mage'; this.updateUI(); });

        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            if (projectile.aoeRadius > 0) projectile.explode(this.enemies);
            else enemy.takeDamage(projectile.damage);
            projectile.destroy();
        });
        this.physics.add.overlap(this.player, this.loots, (player, lootItem) => this.collectLoot(lootItem));

        // UI
        this.createUI();
        this.createUpgradeUI();

        this.startWaveTimer(15); 
        this.updateUI();
    }

    update(time, delta) {
        if (this.player) this.player.update(time, delta);
        
        // --- CORRECCIÓN 1: ACTUALIZAR TORRES ---
        // Las torres son contenedores, Phaser no las actualiza automáticamente en grupos de físicas a veces.
        // Lo forzamos aquí:
        this.towers.children.iterate(tower => {
            if (tower && tower.active) {
                tower.update(time, delta);
            }
        });

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

    // --- ECONOMÍA ---
    addEnemyReward(amount) { 
        this.coins += amount;
        this.updateUI(); // Forzar actualización visual inmediata
        
        const floatTxt = this.add.text(80, 850, `+$${amount}`, { 
            fontSize: '24px', color: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 
        }).setScrollFactor(0).setDepth(2000);

        this.tweens.add({
            targets: floatTxt,
            y: 800,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatTxt.destroy()
        });
    }

    // --- CONSTRUCCIÓN Y VENTA ---
    createBuildSlots() {
        const slots = this.currentLevelData.towerSlots || [];
        slots.forEach(slot => {
            const site = new BuildSite(this, slot.x, slot.y);
            this.buildSites.add(site);
            site.on('pointerdown', () => this.tryBuildTower(site));
        });
    }

    tryBuildTower(site) {
        if (site.isOccupied) return;
        const stats = TOWER_TYPES[this.selectedTowerType];
        
        if (this.coins >= stats.baseCost) {
            this.coins -= stats.baseCost;
            
            // Pasamos el 'site' y el 'costo base' al crear la torre
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost);
            this.towers.add(tower);
            
            site.occupy(); // Ocultar sitio
            this.updateUI();
            
            // Sonido o efecto visual opcional
            this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' });
        } else {
            // Feedback de error (falta dinero)
            this.cameras.main.shake(100, 0.005);
        }
    }

    // --- MENÚ DE MEJORA / VENTA ---
    createUpgradeUI() {
        this.upgradeContainer = this.add.container(0, 0).setDepth(2000);
        this.upgradeContainer.setVisible(false);
        
        // Fondo Menú
        const bg = this.add.rectangle(0, 0, 220, 160, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        
        // Texto Info
        this.upgradeText = this.add.text(0, -50, '', { fontSize: '14px', align: 'center', color: '#fff' }).setOrigin(0.5);
        
        // Botón MEJORAR (Verde)
        this.upgradeBtn = this.add.rectangle(0, 0, 180, 35, 0x00aa00).setInteractive({ useHandCursor: true });
        this.upgradeBtnText = this.add.text(0, 0, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        
        // Botón VENDER (Rojo)
        this.sellBtn = this.add.rectangle(0, 50, 180, 35, 0xaa0000).setInteractive({ useHandCursor: true });
        this.sellBtnText = this.add.text(0, 50, 'VENDER', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);

        // Eventos
        this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower());
        this.sellBtn.on('pointerdown', () => this.sellTower());

        this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, this.upgradeBtnText, this.sellBtn, this.sellBtnText]);
    }

    openUpgradeMenu(tower) {
        this.selectedTowerToUpgrade = tower;
        
        // Posicionar menú sobre la torre (ajustado por scroll)
        // Como la UI no tiene scroll, usamos coordenadas de pantalla
        // Pero el contenedor está en el mundo... Un momento.
        // Mejor ponemos el contenedor en el mundo (con scroll)
        this.upgradeContainer.setPosition(tower.x, tower.y - 100);
        
        this.upgradeContainer.setVisible(true);
        tower.rangeCircle.setVisible(true); // Mostrar rango
        
        this.updateUpgradeMenuText();
    }

    closeUpgradeMenu() {
        if (this.selectedTowerToUpgrade) {
            this.selectedTowerToUpgrade.rangeCircle.setVisible(false);
        }
        this.selectedTowerToUpgrade = null;
        this.upgradeContainer.setVisible(false);
    }

    updateUpgradeMenuText() {
        if (!this.selectedTowerToUpgrade) return;
        const t = this.selectedTowerToUpgrade;
        
        // Texto Info
        if (t.level >= t.maxLevel) {
            this.upgradeText.setText(`${t.typeName} (MAX)\nDaño: ${t.damage}`);
            this.upgradeBtn.setVisible(false);
            this.upgradeBtnText.setVisible(false);
        } else {
            this.upgradeBtn.setVisible(true);
            this.upgradeBtnText.setVisible(true);
            this.upgradeText.setText(`${t.typeName} Lv ${t.level}\nDaño: ${t.damage} -> ${Math.floor(t.damage * 1.2)}`);
            this.upgradeBtnText.setText(`MEJORAR ($${t.upgradeCost})`);
        }

        // Texto Venta (Recuperas todo lo invertido)
        this.sellBtnText.setText(`VENDER (+$${t.totalInvestment})`);
    }

    tryUpgradeTower() {
        const t = this.selectedTowerToUpgrade;
        if (t && this.coins >= t.upgradeCost) {
            this.coins -= t.upgradeCost;
            t.upgrade();
            this.updateUpgradeMenuText();
            this.updateUI();
        }
    }

    sellTower() {
        const t = this.selectedTowerToUpgrade;
        if (t) {
            // 1. Reembolsar
            this.coins += t.totalInvestment;
            this.updateUI(); // Actualizar UI monedas
            
            // 2. Liberar Sitio
            if (t.buildSite) {
                t.buildSite.free();
            }

            // 3. Destruir y cerrar
            t.destroy();
            this.closeUpgradeMenu();
            
            // Feedback visual
            const txt = this.add.text(t.x, t.y - 50, `+$${t.totalInvestment}`, { fontSize: '24px', color: '#ffff00', stroke: '#000', strokeThickness: 3 });
            this.tweens.add({ targets: txt, y: t.y - 100, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
        }
    }

    // --- UI GLOBAL ---
    createUI() {
        const uiDepth = 1000;
        
        // TOP
        this.add.rectangle(640, 60, 1280, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth);
        this.add.rectangle(640, 120, 1280, 4, 0xffd700).setScrollFactor(0).setDepth(uiDepth);
        this.livesText = this.add.text(30, 25, '', { fontSize: '20px', fontStyle: 'bold', color: '#fff' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.waveInfoText = this.add.text(1250, 40, 'OLEADA: 1', { fontSize: '28px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1);

        // --- BOTÓN OLEADA SEGURO ---
        this.waveTimerContainer = this.add.container(640, 60).setScrollFactor(0).setDepth(uiDepth + 2);
        
        // Hacemos el CONTENEDOR interactivo, es más robusto
        this.waveTimerContainer.setSize(320, 60);
        this.waveTimerContainer.setInteractive({ useHandCursor: true });

        const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff);
        this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontSize: '18px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]);
        this.waveTimerContainer.setVisible(false);

        // Evento en el contenedor completo
        this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction());
        
        // BOTTOM
        const botY = 900; 
        this.add.rectangle(640, botY, 1280, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth);
        this.add.rectangle(640, 840, 1280, 4, 0xffd700).setScrollFactor(0).setDepth(uiDepth);
        this.add.text(40, 860, 'TESORO:', { fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.economyText = this.add.text(40, 890, '$0', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.add.text(300, 865, 'SELECTOR DE TORRES (Teclas 1-3)', { fontSize: '14px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1);
        this.buildText = this.add.text(300, 890, '', { fontSize: '20px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1);

        this.skillBtnContainer = this.add.container(1050, botY).setScrollFactor(0).setDepth(uiDepth + 1);
        const skillBg = this.add.rectangle(0, 0, 200, 80, 0x222222).setStrokeStyle(2, 0x555555);
        this.skillBar = this.add.rectangle(-100, 0, 0, 80, 0x0088ff).setOrigin(0, 0.5);
        this.skillBtn = this.add.rectangle(0, 0, 200, 80, 0x000000, 0).setInteractive({ useHandCursor: true });
        this.skillText = this.add.text(0, 0, "HABILIDAD\n(Espacio)", { fontSize: '16px', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
        this.skillBtnContainer.add([skillBg, this.skillBar, this.skillBtn, this.skillText]);
        this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill());

        const exitBtn = this.add.rectangle(1220, botY, 80, 80, 0xaa0000).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(uiDepth + 1).setStrokeStyle(2, 0xffffff);
        this.add.text(1220, botY, 'X', { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 2);
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    startNextWaveAction() {
        if (this.isTimerRunning) {
            this.startNextWave();
        }
    }

    updateUI() {
        const currentTower = TOWER_TYPES[this.selectedTowerType];
        this.economyText.setText(`$${this.coins}`);
        this.buildText.setText(`> ${currentTower.name.toUpperCase()} <\nCOSTO: $${currentTower.baseCost}`);
        const pStats = gameState.playerStats;
        const heroHp = Math.max(0, Math.floor(pStats.hp));
        this.livesText.setText(`❤️ HÉROE: ${heroHp}/${pStats.maxHp}\n🏰 CASTILLO: ${gameState.baseHp}`);
    }

    updateSkillUI() {
        if (!this.player) return;
        const cd = this.player.skillCooldown;
        const maxCd = this.player.skillMaxCooldown;
        if (cd > 0) {
            const progress = 1 - (cd / maxCd); 
            this.skillBar.width = 200 * progress; 
            this.skillBar.setFillStyle(0x555555);
            this.skillText.setText(`${(cd / 1000).toFixed(1)}s`);
        } else {
            this.skillBar.width = 200;
            this.skillBar.setFillStyle(0x0088ff);
            if (this.skillText.text.includes("s")) this.skillText.setText("HABILIDAD\n(Espacio)");
        }
    }

    // ... (Mantén spawnLoot, spawnEnemy, onEnemyLeaks, gameOver, victory, checkWaveStatus, startWaveTimer, startNextWave, collectLoot, triggerPlayerSkill, createSpawnIndicator igual que antes) ...
    // Asegúrate de que spawnEnemy llame a Enemy correctamente
    spawnEnemy(speedMult, hpMult, isBoss) {
        const enemy = new Enemy(this, this.pathPoints, speedMult, hpMult, isBoss);
        const levelBonus = 1 + ((this.currentLevelData.id - 1) * 0.10); 
        let baseReward = 25; if (isBoss) baseReward = 500;
        enemy.coinReward = Math.floor(baseReward * levelBonus);
        this.enemies.add(enemy);
    }

    // Funciones repetidas por seguridad del copy-paste
    startWaveTimer(seconds) {
        this.isTimerRunning = true;
        this.timeToNextWave = seconds * 1000;
        this.waveTimerContainer.setVisible(true);
    }
    startNextWave() {
        this.isTimerRunning = false;
        this.waveTimerContainer.setVisible(false);
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.currentWave > this.totalWaves) { this.victory(); return; }
        this.waveInProgress = true;
        
        let count = 4 + (this.currentWave * 2);
        let interval = 2000 - (this.currentWave * 200);
        let hpMult = 0.8 + (this.currentWave * 0.2);
        let speedMult = 0.6 + (this.currentWave * 0.1);
        let isBoss = false;
        if (this.currentWave === 5) { count = 1; interval = 1000; hpMult = 2.5; speedMult = 0.4; isBoss = true; 
            this.waveInfoText.setText("OLEADA: BOSS!"); this.waveInfoText.setColor('#ff0000'); }
        else { this.waveInfoText.setText(`OLEADA: ${this.currentWave}/${this.totalWaves}`); this.waveInfoText.setColor('#00ffff'); }

        this.enemiesToSpawn = count;
        this.spawnTimer = this.time.addEvent({
            delay: interval, callback: () => {
                this.spawnEnemy(speedMult, hpMult, isBoss);
                this.enemiesToSpawn--;
                if (this.enemiesToSpawn <= 0) this.spawnTimer.remove();
            }, repeat: count - 1
        });
    }
    checkWaveStatus() {
        if (this.isTimerRunning) return;
        if (this.enemiesToSpawn <= 0 && this.enemies.countActive(true) === 0) {
            this.waveInProgress = false; this.currentWave++;
            if (this.currentWave > this.totalWaves) this.victory();
            else this.startWaveTimer(12);
        }
    }
    collectLoot(lootItem) {
        gameState.materials[lootItem.typeKey][lootItem.rarityKey]++;
        if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {};
        if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0;
        this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++;
        const text = this.add.text(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, { fontSize: '14px', stroke: '#000', strokeThickness: 2 });
        this.tweens.add({ targets: text, y: lootItem.y - 50, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
        lootItem.destroy();
    }
    spawnLoot(x, y) {
        if (Math.random() > 0.3) return; 
        const types = ['wood', 'copper', 'cloth'];
        const type = types[Math.floor(Math.random() * types.length)];
        const item = new Loot(this, x, y, type, 'common');
        this.loots.add(item);
    }
    onEnemyLeaks(damage) { gameState.baseHp -= 1; this.cameras.main.flash(200, 255, 0, 0); this.updateUI(); if (gameState.baseHp <= 0) this.gameOver(); }
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.waveInfoText.setText("DERROTA"); this.time.delayedCall(3000, () => { gameState.playerStats.hp = gameState.playerStats.maxHp; this.scene.start('MainMenuScene'); }); }
    victory() { this.physics.pause(); if (this.currentLevelData.id >= gameState.levelsUnlocked) gameState.levelsUnlocked = this.currentLevelData.id + 1; const r = this.currentLevelData.rewardGold || 100; gameState.gold += r; SaveSystem.save(); this.add.rectangle(640, 360, 400, 300, 0x000000, 0.9).setDepth(200).setStrokeStyle(4, 0xffd700); this.add.text(640, 250, "VICTORIA", {fontSize:'40px', color:'#00ff00', fontStyle:'bold'}).setOrigin(0.5).setDepth(201); this.add.text(640, 300, `Oro: +${r}`, {fontSize:'24px'}).setOrigin(0.5).setDepth(201); const btn = this.add.rectangle(640, 400, 200, 50, 0x006400).setInteractive({useHandCursor:true}).setDepth(201); this.add.text(640, 400, "CONTINUAR", {fontSize:'20px'}).setOrigin(0.5).setDepth(201); btn.on('pointerdown', ()=>this.scene.start('WorldMapScene')); }
    triggerPlayerSkill() { if (!this.player) return; const res = this.player.castSkill(); if (res.success) this.tweens.add({ targets: this.skillBtn, scale: 0.9, yoyo: true, duration: 100 }); }
    createSpawnIndicator() { if (!this.pathPoints || this.pathPoints.length === 0) return; const startX = this.pathPoints[0].x; const startY = this.pathPoints[0].y; const marker = this.add.circle(startX, startY, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); }
}