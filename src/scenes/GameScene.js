// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import Loot from '../entities/items/Loot.js';
import { gameState, updatePlayerStats } from '../config/GameState.js'; // Importar updatePlayerStats
import { TOWER_TYPES } from '../config/TowerStats.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 0; 
        this.selectedTowerToUpgrade = null; 
    }

    init(data) {
        // Asegurar que existan datos válidos
        this.currentLevelData = data.levelData || { 
            id: 1, 
            name: "Nivel Debug", 
            startCoins: 500, 
            difficulty: 1, 
            path: [], 
            towerSlots: [] 
        };
        
        // Forzar actualización de stats del héroe al entrar
        updatePlayerStats();
    }

    create() {
        // --- 1. SEGURIDAD ANTI-CRASH (Esto arregla el congelamiento) ---
        const pathPoints = this.currentLevelData.path;
        
        // Si el camino está vacío o indefinido, volver al mapa en vez de congelar
        if (!pathPoints || pathPoints.length === 0) {
            console.error("¡ERROR DE CAMINO! Volviendo al mapa...");
            this.scene.start('WorldMapScene');
            return; 
        }

        this.pathPoints = pathPoints; // Guardar referencia segura

        // Variables de sesión
        this.coins = this.currentLevelData.startCoins;
        this.currentWave = 1;
        this.totalWaves = 5;
        this.waveInProgress = false;
        this.isWaitingNextWave = false;
        this.sessionLoot = {}; 

        // Dibujar Camino
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x666666, 1);
        graphics.beginPath();
        graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
        graphics.strokePath();

        // Grupos
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: true });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.createBuildSlots();
        this.createSpawnIndicator();

        // Jugador
        this.player = new Player(this, 640, 360, gameState.selectedClass, this.enemies, this.projectiles);

        // --- INPUTS ---
        // Tecla de Habilidad
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        
        // Torres
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Tower) this.openUpgradeMenu(gameObject);
            else this.closeUpgradeMenu();
        });

        this.input.keyboard.on('keydown-ONE', () => { this.selectedTowerType = 'archer'; this.updateUI(); });
        this.input.keyboard.on('keydown-TWO', () => { this.selectedTowerType = 'cannon'; this.updateUI(); });
        this.input.keyboard.on('keydown-THREE', () => { this.selectedTowerType = 'mage'; this.updateUI(); });

        // Colisiones
        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            if (projectile.aoeRadius > 0) projectile.explode(this.enemies);
            else enemy.takeDamage(projectile.damage);
            projectile.destroy();
        });

        this.physics.add.overlap(this.player, this.loots, (player, lootItem) => {
            this.collectLoot(lootItem);
        });

        this.createUI();
        this.createUpgradeUI();

        // Iniciar
        this.startNextWave();
        this.updateUI();
    }

    update(time, delta) {
        if (this.player) this.player.update(time, delta);
        this.updateUI();
        this.updateSkillUI(); // Actualizar barra de skill
    }

    // --- LÓGICA DE HABILIDAD ---
    triggerPlayerSkill() {
        if (!this.player) return;
        const result = this.player.castSkill();
        
        if (result.success) {
            this.tweens.add({ targets: this.skillBtn, scale: 0.9, yoyo: true, duration: 100 });
            this.skillText.setText(result.msg);
            this.time.delayedCall(1000, () => this.skillText.setText("ESPACIO"));
        } else {
            this.skillBtn.setStrokeStyle(2, 0xff0000);
            this.time.delayedCall(200, () => this.skillBtn.setStrokeStyle(2, 0xffd700));
        }
    }

    updateSkillUI() {
        if (!this.player) return;
        const cd = this.player.skillCooldown;
        const maxCd = this.player.skillMaxCooldown;
        
        if (cd > 0) {
            const progress = 1 - (cd / maxCd);
            this.skillBar.width = 200 * progress;
            this.skillBar.setFillStyle(0x555555);
            this.skillText.setText((cd / 1000).toFixed(1) + "s");
        } else {
            this.skillBar.width = 200;
            this.skillBar.setFillStyle(0x0088ff);
            if (this.skillText.text.includes("s")) this.skillText.setText("¡LISTO! (Espacio)");
        }
    }

    // --- RESTO DE FUNCIONES (Loot, Oleadas, UI) ---
    spawnLoot(x, y) {
        if (Math.random() > 0.7) return; 
        const randType = Math.random();
        let type = 'wood';
        if (randType > 0.9) type = 'copper'; 
        else if (randType > 0.6) type = 'cloth';

        const randRarity = Math.random();
        let rarity = 'common';
        if (randRarity > 0.98) rarity = 'legendary';
        else if (randRarity > 0.90) rarity = 'epic';
        else if (randRarity > 0.80) rarity = 'rare';
        else if (randRarity > 0.60) rarity = 'uncommon';

        const item = new Loot(this, x, y, type, rarity);
        this.loots.add(item);
    }

    collectLoot(lootItem) {
        gameState.materials[lootItem.typeKey][lootItem.rarityKey]++;
        if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {};
        if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0;
        this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++;

        const text = this.add.text(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, { 
            fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 3 
        });
        this.tweens.add({ targets: text, y: lootItem.y - 50, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
        lootItem.destroy();
    }

    victory() {
        this.waveFinished = true;
        this.physics.pause();
        if (this.currentLevelData.id >= gameState.levelsUnlocked) gameState.levelsUnlocked = this.currentLevelData.id + 1;
        
        const goldReward = this.currentLevelData.rewardGold || 100;
        gameState.gold += goldReward;
        SaveSystem.save();

        // Panel Resumen
        this.add.rectangle(640, 360, 500, 400, 0x000000, 0.9).setStrokeStyle(4, 0xffd700);
        this.add.text(640, 180, "¡VICTORIA!", { fontSize: '40px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(640, 230, "Recompensas:", { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        this.add.text(640, 270, `💰 Oro: +${goldReward}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);

        let lootList = "";
        for (let mat in this.sessionLoot) {
            for (let rar in this.sessionLoot[mat]) {
                const count = this.sessionLoot[mat][rar];
                lootList += `${count}x ${mat.toUpperCase()} (${rar})\n`;
            }
        }
        if (lootList === "") lootList = "(Sin materiales)";
        this.add.text(640, 350, lootList, { fontSize: '16px', color: '#aaa', align: 'center' }).setOrigin(0.5);

        const btn = this.add.rectangle(640, 480, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(640, 480, "CONTINUAR", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        btn.on('pointerdown', () => this.scene.start('WorldMapScene'));
    }

    startNextWave() {
        if (this.spawnTimer) this.spawnTimer.remove();
        const maxWaves = this.totalWaves || 5; 
        if (this.currentWave > maxWaves) { this.victory(); return; }

        this.waveInProgress = true;
        this.isWaitingNextWave = false;
        const levelDiff = this.currentLevelData.difficulty || 1;
        const levelIndex = this.currentLevelData.id || 1;
        let count, speedMult, hpMult, interval;
        let isBossWave = false;

        if (this.currentWave === 5) {
            count = 1; 
            speedMult = 0.4 + (levelIndex * 0.05); 
            hpMult = 2.5 * levelDiff; 
            interval = 1000;
            isBossWave = true;
            this.updateWaveTitle("¡BOSS FINAL!");
        } else {
            count = 4 + (this.currentWave * 2);
            speedMult = 0.6 + (this.currentWave * 0.1) + (levelIndex * 0.05);
            hpMult = (0.8 + (this.currentWave * 0.2)) * levelDiff;
            interval = 2000 - (this.currentWave * 200);
            this.updateWaveTitle(`OLEADA ${this.currentWave} / ${maxWaves}`);
        }

        this.enemiesToSpawn = count;
        this.spawnTimer = this.time.addEvent({
            delay: interval,
            callback: () => {
                this.spawnEnemy(speedMult, hpMult, isBossWave);
                this.enemiesToSpawn--;
                if (this.enemiesToSpawn <= 0) this.spawnTimer.remove();
            },
            repeat: count - 1
        });
    }

    spawnEnemy(speedMult, hpMult, isBoss) {
        const enemy = new Enemy(this, this.pathPoints, speedMult, hpMult, isBoss);
        const levelIndex = this.currentLevelData.id || 1;
        const levelBonus = 1 + ((levelIndex - 1) * 0.10); 
        let baseReward = 25;
        if (isBoss) baseReward = 500;
        enemy.coinReward = Math.floor(baseReward * levelBonus);
        this.enemies.add(enemy);
    }

    onEnemyLeaks(damage) {
        gameState.playerStats.hp -= damage;
        this.cameras.main.flash(200, 255, 0, 0);
        this.updateUI();
        if (gameState.playerStats.hp <= 0) this.gameOver();
    }

    gameOver() {
        this.physics.pause();
        if (this.spawnTimer) this.spawnTimer.remove();
        this.waveText.setText("¡DERROTA!");
        this.waveText.setColor('#ff0000');
        this.time.delayedCall(3000, () => {
            gameState.playerStats.hp = gameState.playerStats.maxHp; 
            this.scene.start('MainMenuScene');
        });
    }

    checkWaveStatus() {
        if (this.isWaitingNextWave) return;
        const enemiesAlive = this.enemies.countActive(true);
        if (this.enemiesToSpawn <= 0 && enemiesAlive === 0) {
            this.waveInProgress = false;
            this.isWaitingNextWave = true; 
            this.waveText.setText("¡OLEADA COMPLETADA!");
            this.time.delayedCall(3000, () => {
                this.currentWave++;
                this.startNextWave();
            });
        }
    }

    addEnemyReward(amount) { this.coins += amount; }
    
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
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles);
            this.towers.add(tower);
            site.occupy();
            this.updateUI();
        }
    }

    createUpgradeUI() {
        this.upgradeContainer = this.add.container(0, 0);
        this.upgradeContainer.setVisible(false);
        this.upgradeContainer.setDepth(100);
        const bg = this.add.rectangle(0, 0, 200, 120, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.upgradeText = this.add.text(0, -30, '', { fontSize: '14px', align: 'center' }).setOrigin(0.5);
        this.upgradeBtn = this.add.rectangle(0, 20, 120, 30, 0x00aa00).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 20, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower());
        this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, btnText]);
    }

    openUpgradeMenu(tower) {
        this.selectedTowerToUpgrade = tower;
        let menuX = tower.x;
        let menuY = tower.y - 80;
        if (menuY < 60) menuY = tower.y + 80; 
        this.upgradeContainer.setPosition(menuX, menuY);
        this.upgradeContainer.setVisible(true);
        tower.rangeCircle.setVisible(true);
        this.updateUpgradeMenuText();
    }

    closeUpgradeMenu() {
        if (this.selectedTowerToUpgrade) this.selectedTowerToUpgrade.rangeCircle.setVisible(false);
        this.selectedTowerToUpgrade = null;
        this.upgradeContainer.setVisible(false);
    }

    updateUpgradeMenuText() {
        if (!this.selectedTowerToUpgrade) return;
        const tower = this.selectedTowerToUpgrade;
        if (tower.level >= tower.maxLevel) {
            this.upgradeText.setText(`NIVEL MÁXIMO (Lvl ${tower.level})`);
            this.upgradeBtn.setVisible(false);
        } else {
            this.upgradeBtn.setVisible(true);
            this.upgradeText.setText(`${tower.typeName}\nLvl ${tower.level} -> ${tower.level + 1}\nCosto: $${tower.upgradeCost}`);
        }
    }

    tryUpgradeTower() {
        if (this.selectedTowerToUpgrade && this.coins >= this.selectedTowerToUpgrade.upgradeCost) {
            this.coins -= this.selectedTowerToUpgrade.upgradeCost;
            this.selectedTowerToUpgrade.upgrade();
            this.updateUpgradeMenuText();
            this.updateUI();
        }
    }

    createUI() {
        this.add.rectangle(110, 210, 200, 80, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(1, 0xffd700);
        this.add.text(110, 180, 'ECONOMÍA', { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
        this.economyText = this.add.text(20, 200, '', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0);
        
        this.add.rectangle(640, 40, 300, 60, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(2, 0xffffff);
        this.waveText = this.add.text(640, 40, 'PREPARANDO...', { fontSize: '24px', fontStyle: 'bold', color: '#ff0000' }).setOrigin(0.5).setScrollFactor(0);
        
        this.add.rectangle(1160, 85, 220, 150, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(1, 0x00ffff);
        this.add.text(1160, 25, 'CONSTRUCCIÓN', { fontSize: '16px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
        this.buildText = this.add.text(1060, 45, '', { fontSize: '12px', color: '#fff', lineHeight: 20 }).setScrollFactor(0);
        
        const exitBtn = this.add.rectangle(1200, 680, 120, 40, 0xaa0000).setInteractive({ useHandCursor: true }).setScrollFactor(0);
        this.add.text(1200, 680, 'SALIR', { fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0);
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

        // --- BOTÓN DE SKILL ---
        this.skillBtnContainer = this.add.container(640, 650).setScrollFactor(0);
        this.add.rectangle(0, 0, 200, 40, 0x333333).setContainer(this.skillBtnContainer);
        this.skillBar = this.add.rectangle(-100, 0, 200, 40, 0x0088ff).setOrigin(0, 0.5);
        this.skillBtnContainer.add(this.skillBar);
        this.skillBtn = this.add.rectangle(0, 0, 200, 40, 0x000000, 0).setStrokeStyle(2, 0xffd700).setInteractive({ useHandCursor: true });
        this.skillText = this.add.text(0, 0, "HABILIDAD (Espacio)", { fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        this.skillBtnContainer.add([this.skillBtn, this.skillText]);
        this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill());
    }

    updateUI() {
        const currentTower = TOWER_TYPES[this.selectedTowerType];
        this.economyText.setText(`MONEDAS: $${this.coins}`);
        this.buildText.setText(`SELECCIONADA:\n> ${currentTower.name.toUpperCase()} <\n\nCOSTE: $${currentTower.baseCost}\n(Teclas 1, 2, 3)`);
    }

    updateWaveTitle(text) { 
        this.waveText.setText(text); 
        this.tweens.add({ targets: this.waveText, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 }); 
    }

    createSpawnIndicator() { 
        if (!this.pathPoints || this.pathPoints.length === 0) return;
        const startX = this.pathPoints[0].x;
        const startY = this.pathPoints[0].y;
        const marker = this.add.circle(startX, startY, 20, 0xff0000);
        this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 });
        this.add.text(startX, startY - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5);
    }
}