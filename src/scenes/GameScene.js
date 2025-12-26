// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import Loot from '../entities/items/Loot.js';
import { gameState, updatePlayerStats, getCurrentHero } from '../config/GameState.js'; 
import { TOWER_TYPES } from '../config/TowerStats.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import { BIOMES, getLevelData } from '../config/Levels.js'; 

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 5000; 
        this.selectedTowerToUpgrade = null; 
        this.timeToNextWave = 0; 
        this.isTimerRunning = false;
        this.isPaused = false;
        this.isSceneReady = false; 
    }

    init(data) {
        this.level = data.level || 1;
        this.biome = data.biome || 'forest';
        this.config = data.config || {}; 
        this.currentLevelData = getLevelData(this.biome, this.level);
        this.theme = BIOMES[this.biome] ? BIOMES[this.biome].theme : { bg: 0x333333, path: 0x555555, accent: 0x00ffff, grid: 0x444444 };
        if (!gameState.playerStats) updatePlayerStats();
        const hero = getCurrentHero();
        this.lastHeroLevel = hero ? hero.level : 1;
        this.isSceneReady = false; 
        this.isPaused = false;
        this.totalWaves = this.config.waves || 3;
        this.hpMultiplier = this.config.hpMult || 1;
        this.spawnMult = this.currentLevelData.spawnMultiplier || 1;
        this.isBossWave = false;
        this.bossSpawned = false;
    }

    create() {
        updatePlayerStats(); 
        
        if (!this.textures.exists('pixel')) {
            const graphics = this.make.graphics({x: 0, y: 0, add: false});
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('pixel', 4, 4);
        }

        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: false });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.cameras.main.setBackgroundColor(this.theme.bg);
        const w = this.scale.width;
        const h = this.scale.height;
        this.physics.world.setBounds(0, 120, w, h - 240); 

        this.coins = 500 + (this.level * 50); 
        this.currentWave = 0; 
        this.waveInProgress = false;
        this.sessionLoot = {}; 
        this.bossLootLog = []; 
        gameState.baseHp = 20;

        const graphics = this.add.graphics();
        if (this.theme.grid) {
            graphics.lineStyle(2, this.theme.grid, 0.3);
            for(let i=0; i<w; i+=100) { graphics.moveTo(i,0); graphics.lineTo(i,h); }
            for(let j=0; j<h; j+=100) { graphics.moveTo(0,j); graphics.lineTo(w,j); }
            graphics.strokePath();
        }
        
        if (this.currentLevelData.paths) {
            this.currentLevelData.paths.forEach(path => {
                graphics.lineStyle(60, this.theme.path, 1);
                graphics.beginPath();
                if(path.length > 0) graphics.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) graphics.lineTo(path[i].x, path[i].y);
                graphics.strokePath();
                graphics.lineStyle(4, 0x000000, 0.5);
                graphics.strokePath();
                if(path.length > 0) this.createSpawnIndicator(path[0].x, path[0].y);
            });
        }

        this.createBuildSlots();

        this.player = new Player(this, w/2, h/2, gameState.selectedClass, this.enemies, this.projectiles);
        
        this.input.keyboard.on('keydown-SPACE', () => this.triggerPlayerSkill());
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        this.input.keyboard.on('keydown-ONE', () => { if(!this.isPaused) { this.selectedTowerType = 'archer'; this.updateUI(); }});
        this.input.keyboard.on('keydown-TWO', () => { if(!this.isPaused) { this.selectedTowerType = 'cannon'; this.updateUI(); }});
        this.input.keyboard.on('keydown-THREE', () => { if(!this.isPaused) { this.selectedTowerType = 'mage'; this.updateUI(); }});

        // Click Logic
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
                obj === this.upgradeContainer || 
                (obj.parentContainer && obj.parentContainer === this.upgradeContainer)
            );
            const clickedOnTower = currentlyOver.some(obj => this.getTowerFromObject(obj) !== null);

            if (!clickedOnUI && !clickedOnTower) {
                this.closeUpgradeMenu();
            }
        });

        this.physics.add.overlap(this.enemies, this.projectiles, (e, p) => { 
            if(e.active && p.active) { 
                if(p.hit) p.hit(e); 
                else { e.takeDamage(p.damage||10); p.destroy(); } 
            } 
        });
        this.physics.add.overlap(this.player, this.loots, (p, l) => this.collectLoot(l));

        this.createUI();
        this.createUpgradeUI();
        this.createPauseMenu();

        this.startWaveTimer(20); 
        this.updateUI();
        this.isSceneReady = true;
    }

    update(time, delta) {
        if (this.isPaused || !this.isSceneReady) return;

        if (this.player) this.player.update(time, delta);
        if (this.towers) { this.towers.children.iterate(t => { if (t && t.active) t.update(time, delta); }); }
        if (this.projectiles) { this.projectiles.children.iterate(p => { if (p && p.active && p.update) p.update(time, delta); }); }

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

    // --- HELPER ---
    getTowerFromObject(obj) {
        if (obj instanceof Tower) return obj;
        if (obj.parentContainer instanceof Tower) return this.getTowerFromObject(obj.parentContainer);
        return null;
    }

    // --- UI PRINCIPAL ---
    updateUI() { 
        const currentTower = TOWER_TYPES[this.selectedTowerType]; 
        if (currentTower) {
            if(this.economyText) this.economyText.setText(`$${this.coins}`); 
            if(this.buildText) this.buildText.setText(`> ${currentTower.name.toUpperCase()} <\nCOSTO: $${currentTower.baseCost}`); 
        }
        const pStats = gameState.playerStats; 
        if(this.livesText) this.livesText.setText(`❤️ HÉROE: ${Math.max(0, Math.floor(pStats.hp))}/${pStats.maxHp}`);
        if(this.castleText) this.castleText.setText(`🏰 CASTILLO: ${gameState.baseHp}`);
        
        const hero = getCurrentHero();
        if (hero && this.xpBarFill && this.lvlText) {
            const xpPercent = Math.min(1, hero.xp / hero.maxXp);
            this.xpBarFill.width = 200 * xpPercent;
            this.lvlText.setText(`Lvl ${hero.level}`);
        }
    }

    updateSkillUI() { 
        if (!this.player) return; 
        const cd = this.player.skillCooldown; 
        const maxCd = this.player.skillMaxCooldown; 
        if (cd > 0) { 
            const progress = 1 - (cd / maxCd); 
            if(this.skillBar) { this.skillBar.width = 200 * progress; this.skillBar.setFillStyle(0x555555); }
            if(this.skillText) this.skillText.setText(`${(cd / 1000).toFixed(1)}s`); 
        } else { 
            if(this.skillBar) { this.skillBar.width = 200; this.skillBar.setFillStyle(this.theme.accent); }
            if(this.skillText && this.skillText.text.includes("s")) this.skillText.setText("HABILIDAD\n(Espacio)"); 
        } 
    }

    // --- UI MEJORA ---
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

        this.upgradeBtn.setVisible(false); this.upgradeBtnText.setVisible(false);
        this.evoBtnA.setVisible(false); this.evoTxtA.setVisible(false);
        this.evoBtnB.setVisible(false); this.evoTxtB.setVisible(false);

        if (t.isEvolved) {
            this.upgradeText.setText(`${t.typeName} (MÁX)\nDaño: ${t.damage}`);
        }
        else if (t.level >= t.maxLevel) {
            this.upgradeText.setText(`¡EVOLUCIÓN DISPONIBLE!\nElige un destino:`);
            const evoA = stats.evolutions.pathA;
            const evoB = stats.evolutions.pathB;

            this.evoBtnA.setVisible(true); this.evoBtnA.setFillStyle(evoA.color);
            this.evoTxtA.setVisible(true); this.evoTxtA.setText(`${evoA.name}\n$${evoA.cost}`);
            
            this.evoBtnB.setVisible(true); this.evoBtnB.setFillStyle(evoB.color);
            this.evoTxtB.setVisible(true); this.evoTxtB.setText(`${evoB.name}\n$${evoB.cost}`);
        } 
        else {
            this.upgradeBtn.setVisible(true); this.upgradeBtnText.setVisible(true);
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
        } 
    }

    // --- AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA ---
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
        if (this.selectedTowerToUpgrade) this.selectedTowerToUpgrade.rangeCircle.setVisible(false); 
        this.selectedTowerToUpgrade = null; 
        this.upgradeContainer.setVisible(false); 
    }

    sellTower() { 
        const t = this.selectedTowerToUpgrade; 
        if (t) { 
            this.coins += Math.floor(t.totalInvestment * 0.7); 
            this.updateUI(); 
            if (t.buildSite) t.buildSite.free(); 
            t.destroy(); 
            this.closeUpgradeMenu(); 
            this.showFloatingText(t.x, t.y - 50, `+$${Math.floor(t.totalInvestment*0.7)}`, '#ffff00'); 
        } 
    }

    // --- GAMEPLAY UTILS ---
    startWaveTimer(seconds) { 
        this.isTimerRunning = true; 
        this.timeToNextWave = seconds * 1000; 
        if (this.waveTimerContainer) this.waveTimerContainer.setVisible(true); 
    }

    startNextWaveAction() { 
        if (this.isTimerRunning) this.startWave(); 
    }

    triggerPlayerSkill() { 
        if (!this.player) return; 
        const result = this.player.castSkill(); 
        if (result.success) { 
            this.tweens.add({ targets: this.skillBtnContainer, scale: 0.9, yoyo: true, duration: 100 }); 
        } 
    }

    createSpawnIndicator(x, y) { 
        const marker = this.add.circle(x, y, 20, 0xff0000); 
        this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); 
        this.add.text(x, y - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); 
    }

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
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); 
            this.towers.add(tower); 
            site.occupy(); 
            this.updateUI(); 
            this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' }); 
        } else { 
            this.cameras.main.shake(100, 0.005); 
        } 
    }

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
        
        let baseCount = 6 + (this.currentWave * 2);
        let totalEnemies = Math.ceil(baseCount * this.spawnMult);
        let spawnDelay = 2000 - (this.currentWave * 100);
        if (spawnDelay < 500) spawnDelay = 500;

        if (this.isBossWave) {
            this.showFloatingText(this.scale.width/2, this.scale.height/2, "¡JEFE FINAL!", "#ff0000", 2000);
            totalEnemies = 4 * (this.currentLevelData.pathCount || 1); 
        }

        let spawned = 0;
        this.spawnTimer = this.time.addEvent({
            delay: spawnDelay,
            repeat: totalEnemies - 1,
            callback: () => {
                this.spawnEnemy();
                spawned++;
                if (this.isBossWave && spawned === totalEnemies) {
                    this.time.delayedCall(3000, () => this.spawnBoss());
                }
            }
        });
    }

    spawnEnemy(hpMult = 1, type = 'normal') {
        const paths = this.currentLevelData.paths || [];
        if(paths.length === 0) return;
        const pathIndex = Math.floor(Math.random() * paths.length);
        const path = paths[pathIndex];
        
        if(this.currentWave > 2 && Math.random() > 0.8) type = 'speed';
        if(this.currentWave > 4 && Math.random() > 0.85) type = 'tank'; 
        if(this.currentWave > 5 && Math.random() > 0.9) type = 'healer';

        const enemy = new Enemy(this, path, this.hpMultiplier * hpMult, type);
        this.enemies.add(enemy);
    }

    spawnBoss() {
        this.bossSpawned = true; 
        let bossType = 'boss_goblin';
        if (this.biome === 'mountain') bossType = 'boss_golem';
        if (this.biome === 'volcano') bossType = 'boss_wizard';
        const paths = this.currentLevelData.paths || [];
        if(paths.length === 0) return;
        const path = paths[Math.floor(paths.length / 2)]; 
        const boss = new Enemy(this, path, this.hpMultiplier * 2.5, bossType);
        this.enemies.add(boss);
        this.showFloatingText(boss.x, boss.y - 50, "¡EL JEFE HA LLEGADO!", "#ff0000");
    }

    checkWaveStatus() {
        if (this.isBossWave && !this.bossSpawned) return;
        if (this.waveActive && this.enemies.getLength() === 0 && (!this.spawnTimer || this.spawnTimer.getProgress() === 1)) {
            this.waveActive = false;
            if (this.currentWave >= this.totalWaves) this.victory();
            else this.startWaveTimer(20);
        }
    }

    victory() { 
        this.physics.pause(); 
        if (this.spawnTimer) this.spawnTimer.remove(); 
        if (this.level >= (gameState.maxLevel || 1)) { gameState.maxLevel = this.level + 1; SaveSystem.save(); } 
        const rewardGold = 100 + (this.level * 50); 
        this.showFloatingText(this.scale.width/2, this.scale.height/2, "¡VICTORIA!", "#ffd700", 3000); 
        this.time.delayedCall(2000, () => { 
            this.scene.start('ChestScene', { biome: this.biome, level: this.level, winData: { gold: rewardGold, xp: 100 * this.level, baseHp: gameState.baseHp, enemyLoot: this.sessionLoot } }); 
        }); 
    }

    onEnemyLeaks(damage) { 
        gameState.baseHp -= damage; 
        this.cameras.main.flash(200, 255, 0, 0); 
        this.updateUI(); 
        if (gameState.baseHp <= 0) this.gameOver(); 
    }

    gameOver() { 
        this.physics.pause(); 
        if (this.spawnTimer) this.spawnTimer.remove(); 
        this.scene.start('ResultScene', { success: false, levelId: this.currentLevelData.id }); 
    }

    onEnemyKilled(enemy) { 
        try { 
            this.coins += (enemy.coinReward || 10); 
            if (RPGSystem && RPGSystem.gainHeroXP) { RPGSystem.gainHeroXP(enemy.xpReward || 10); } 
            RPGSystem.updateQuestProgress('kill', 'any', 1); 
            if (enemy.type.startsWith('boss')) { 
                this.generateBossLoot(enemy); 
                RPGSystem.updateQuestProgress('boss', 'any', 1); 
            } else { 
                this.spawnLoot(enemy.x, enemy.y); 
            } 
            this.createExplosion(enemy.x, enemy.y, enemy.colorVal); 
            this.showFloatingText(enemy.x, enemy.y - 30, `+$${enemy.coinReward}`, '#ffff00'); 
            this.updateUI(); 
        } catch (err) { console.warn("Error", err); } 
    }

    generateBossLoot(boss) { 
        const mats = ['wood', 'copper', 'scraps', 'hide']; 
        const matType = mats[Math.floor(Math.random() * mats.length)]; 
        const qty = Phaser.Math.Between(2, 5); 
        if(!gameState.materials[matType]) gameState.materials[matType] = {common:0}; 
        gameState.materials[matType]['common'] += qty; 
        this.bossLootLog.push({ text: `${qty}x ${matType.toUpperCase()}`, color: '#ffffff' }); 
        this.showFloatingText(boss.x, boss.y, "¡BONUS!", "#ffd700"); 
    }

    createExplosion(x, y, color) { 
        const circle = this.add.circle(x, y, 5, color); 
        this.tweens.add({ targets: circle, scale: 4, alpha: 0, duration: 300, onComplete: () => circle.destroy() }); 
    }

    spawnLoot(x, y) { 
        if (Math.random() > 0.30) return; 
        let type = 'wood'; let rarity = 'common'; 
        const roll = Math.random(); 
        if (roll < 0.15) type = 'potion_hp'; 
        else if (roll < 0.25) type = 'coin_bag'; 
        else { const m = Math.random(); if(m<0.25) type='wood'; else type='copper'; } 
        const item = new Loot(this, x, y, type, rarity); 
        this.loots.add(item); 
    }

    collectLoot(lootItem) { 
        if (lootItem.isConsumable) { 
            if (lootItem.typeKey === 'potion_hp') { 
                const heal = Math.floor(gameState.playerStats.maxHp * 0.25); 
                gameState.playerStats.hp = Math.min(gameState.playerStats.hp + heal, gameState.playerStats.maxHp); 
                this.showFloatingText(lootItem.x, lootItem.y, `+${heal} HP`, '#ff0000'); 
            } else if (lootItem.typeKey === 'coin_bag') { 
                const gold = Phaser.Math.Between(30, 60); 
                this.coins += gold; 
                this.updateUI(); 
                this.showFloatingText(lootItem.x, lootItem.y, `+$${gold}`, '#ffd700'); 
            } 
        } else { 
            if(gameState.materials[lootItem.typeKey]) { 
                gameState.materials[lootItem.typeKey][lootItem.rarityKey]++; 
                RPGSystem.updateQuestProgress('collect', lootItem.typeKey, 1); 
                if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {}; 
                if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0; 
                this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++; 
                this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); 
            } 
        } 
        lootItem.destroy(); 
    }

    showFloatingText(x, y, message, color = '#fff', duration = 800) { 
        const text = this.add.text(x, y, message, { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color: color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2000); 
        this.tweens.add({ targets: text, y: y - 50, alpha: 0, duration: duration, onComplete: () => text.destroy() }); 
    }

    showLevelUpEffect() { 
        const txt = this.add.text(this.scale.width/2, this.scale.height/2, "¡LEVEL UP!", { fontSize: '64px', fontStyle: 'bold', color: '#ffd700', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(3000).setScale(0); 
        this.tweens.add({ targets: txt, scale: 1.5, duration: 500, yoyo: true, onComplete: () => txt.destroy() }); 
        gameState.playerStats.hp = gameState.playerStats.maxHp; 
    }

    createPauseMenu() { 
        this.pauseContainer = this.add.container(640, 480).setDepth(20000).setVisible(false).setScrollFactor(0); 
        const w = this.scale.width; const h = this.scale.height; 
        this.pauseContainer.setPosition(w/2, h/2); 
        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setInteractive(); 
        const panel = this.add.rectangle(0, 0, 400, 300, 0x222222).setStrokeStyle(4, 0xffd700); 
        const title = this.add.text(0, -100, "PAUSA", { fontFamily: 'Cinzel', fontSize: '40px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5); 
        const resumeBtn = this.add.rectangle(0, 0, 250, 50, 0x006400).setInteractive({ useHandCursor: true }); 
        const resumeTxt = this.add.text(0, 0, "CONTINUAR", { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color:'#fff' }).setOrigin(0.5); 
        resumeBtn.on('pointerdown', () => this.togglePause()); 
        const exitBtn = this.add.rectangle(0, 80, 250, 50, 0xaa0000).setInteractive({ useHandCursor: true }); 
        const exitTxt = this.add.text(0, 80, "SALIR AL MENÚ", { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color:'#fff' }).setOrigin(0.5); 
        exitBtn.on('pointerdown', () => { this.isPaused = false; this.physics.resume(); this.scene.start('MainMenuScene'); }); 
        this.pauseContainer.add([bg, panel, title, resumeBtn, resumeTxt, exitBtn, exitTxt]); 
    }

    togglePause() { 
        this.isPaused = !this.isPaused; 
        if (this.isPaused) { 
            this.physics.pause(); 
            this.tweens.pauseAll(); 
            this.pauseContainer.setVisible(true); 
            this.children.bringToTop(this.pauseContainer); 
        } else { 
            this.physics.resume(); 
            this.tweens.resumeAll(); 
            this.pauseContainer.setVisible(false); 
        } 
    }

    createUI() { 
        const w = this.scale.width; const h = this.scale.height; const uiDepth = 1000; const accent = this.theme.accent; 
        
        // Paneles
        this.add.rectangle(w/2, 60, w, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth); 
        this.add.rectangle(w/2, 120, w, 4, accent).setScrollFactor(0).setDepth(uiDepth); 
        
        // Info
        this.livesText = this.add.text(30, 30, '', { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.castleText = this.add.text(30, 65, '', { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', color: '#ffaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1);
        
        this.xpContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(uiDepth + 1);
        this.add.text(300, 35, 'XP:', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.xpBarBg = this.add.rectangle(330, 42, 200, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.xpBarFill = this.add.rectangle(330, 42, 0, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.lvlText = this.add.text(540, 35, 'Lvl 1', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.waveInfoText = this.add.text(w - 30, 40, 'OLEADA: 1', { fontFamily: 'Cinzel', fontSize: '28px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.waveTimerContainer = this.add.container(w/2, 60).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.waveTimerContainer.setSize(320, 60); this.waveTimerContainer.setInteractive({ useHandCursor: true }); 
        const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff); 
        this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', align: 'center', color: '#ffffff' }).setOrigin(0.5); 
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]); 
        this.waveTimerContainer.setVisible(false); 
        this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction()); 
        
        const barHeight = 120; const botY = h - (barHeight / 2); 
        this.add.rectangle(w/2, botY, w, barHeight, 0x111111).setScrollFactor(0).setDepth(uiDepth); 
        this.add.rectangle(w/2, botY - (barHeight/2), w, 4, accent).setScrollFactor(0).setDepth(uiDepth); 
        
        const contentY = botY; 
        this.add.text(40, contentY - 30, 'TESORO:', { fontFamily: 'Cinzel', fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.economyText = this.add.text(40, contentY, '$0', { fontFamily: 'Cinzel', fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.add.text(300, contentY - 35, 'SELECTOR (Teclas 1-3)', { fontFamily: 'Roboto', fontSize: '12px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        const buildBg = this.add.rectangle(400, contentY + 10, 250, 60, 0x222222).setStrokeStyle(2, accent).setScrollFactor(0).setDepth(uiDepth); 
        this.buildText = this.add.text(400, contentY + 10, '', { fontFamily: 'Roboto', fontSize: '18px', color: '#ffffff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.skillBtnContainer = this.add.container(w/2 + 200, contentY + 10).setScrollFactor(0).setDepth(uiDepth + 1); 
        const skillBg = this.add.rectangle(0, 0, 180, 50, 0x222222).setStrokeStyle(2, 0x555555); 
        this.skillBar = this.add.rectangle(-90, 0, 0, 50, accent).setOrigin(0, 0.5); 
        this.skillBtn = this.add.rectangle(0, 0, 180, 50, 0x000000, 0).setInteractive({ useHandCursor: true }); 
        this.skillText = this.add.text(0, 0, "HABILIDAD\n(Espacio)", { fontFamily: 'Cinzel', fontSize: '14px', align: 'center', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5); 
        this.skillBtnContainer.add([skillBg, this.skillBar, this.skillBtn, this.skillText]); 
        this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill()); 
        
        const exitBtn = this.add.rectangle(w - 80, contentY, 120, 50, 0x8b0000).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(uiDepth + 1).setStrokeStyle(2, 0xffffff); 
        this.add.text(w - 80, contentY, 'SALIR', { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 2); 
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene')); 
    }
}