// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import Loot from '../entities/items/Loot.js';
import { gameState, updatePlayerStats, RARITY, getCurrentHero } from '../config/GameState.js'; 
import { TOWER_TYPES } from '../config/TowerStats.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import { RECIPES } from '../config/Recipes.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 0; 
        this.selectedTowerToUpgrade = null; 
        this.timeToNextWave = 0; 
        this.isTimerRunning = false;
        this.isPaused = false;
        this.isSceneReady = false; 
    }

    init(data) {
        this.currentLevelData = data.levelData || { id: 1, name: "Nivel Debug", startCoins: 500, difficulty: 1, path: [], towerSlots: [] };
        
        this.theme = this.currentLevelData.theme || {
            background: 0x333333, path: 0x555555, accent: 0x00ffff 
        };

        if (!gameState.playerStats) updatePlayerStats();
        const hero = getCurrentHero();
        this.lastHeroLevel = hero ? hero.level : 1;
        this.isSceneReady = false; 
        this.isPaused = false;
    }

    create() {
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

        this.TOP_MARGIN = 120; // Altura de barra superior
        this.cameras.main.scrollY = -this.TOP_MARGIN;
        this.cameras.main.setBackgroundColor(0x111111);

        const w = this.scale.width;
        const h = this.scale.height;
        this.sx = w / 1280; 
        this.sy = h / 960;  

        // CORRECCIÓN LÍMITES: Restar la altura de las barras UI superior e inferior
        // (y=0 a 120 es barra superior, y=h-120 a h es barra inferior)
        // El mundo físico empieza en 0,0 visualmente, pero la cámara está desplazada.
        // La cámara muestra desde y = -120.
        // Entonces la barra superior (visual) está en y=0 real del mundo.
        this.physics.world.setBounds(0, 0, w, h); 

        const rawPath = this.currentLevelData.path;
        if (!rawPath || rawPath.length === 0) {
            this.scene.start('WorldMapScene'); return; 
        }

        this.pathPoints = rawPath.map(p => ({ x: p.x * this.sx, y: p.y * this.sy }));
        
        this.coins = this.currentLevelData.startCoins || 500;
        this.currentWave = 1;
        this.totalWaves = 6; 
        this.waveInProgress = false;
        
        this.sessionLoot = {}; 
        this.bossLootLog = []; 
        gameState.baseHp = 20;

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

        this.createBuildSlots();
        this.createSpawnIndicator();
        this.player = new Player(this, w/2, h/2, gameState.selectedClass, this.enemies, this.projectiles);
        
        // Ajuste de colisión del jugador con los bordes visuales "reales" (evitar ir debajo de la UI)
        // La barra superior mide 120px. La inferior 120px.
        // El bounds del jugador debería ser: x=0, y=0, w=w, h=h-120 (aprox)
        this.physics.world.setBounds(0, 0, w, h - 120);

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

        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            if (enemy.active && projectile.active) {
                if (projectile.hit) projectile.hit(enemy);
                else { enemy.takeDamage(projectile.damage || 10); projectile.destroy(); }
            }
        });
        this.physics.add.overlap(this.player, this.loots, (player, lootItem) => this.collectLoot(lootItem));

        this.createUI();
        this.createUpgradeUI();
        this.createPauseMenu(); // Crear menú oculto

        this.startWaveTimer(15); 
        this.updateUI();

        this.isSceneReady = true;
    }

    update(time, delta) {
        if (this.isPaused) return; // Si está pausado, no actualizar lógica de juego
        if (!this.isSceneReady) return;

        if (this.player) this.player.update(time, delta);
        if (this.towers) { this.towers.children.iterate(tower => { if (tower && tower.active) tower.update(time, delta); }); }
        
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
                this.startNextWave();
            } else {
                const seconds = Math.ceil(this.timeToNextWave / 1000);
                if (this.waveTimerBtnText) this.waveTimerBtnText.setText(`SIGUIENTE OLEADA: ${seconds}s\n(Clic para iniciar)`);
            }
        }
    }

    // --- PAUSA CORREGIDA ---
    createPauseMenu() {
        this.pauseContainer = this.add.container(640, 480).setDepth(20000).setVisible(false).setScrollFactor(0);
        const w = this.scale.width; 
        const h = this.scale.height; 
        this.pauseContainer.setPosition(w/2, h/2); // Centrar en pantalla

        // Fondo oscuro que cubre todo
        const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setInteractive(); // Captura clics para que no pasen al juego
        
        const panel = this.add.rectangle(0, 0, 400, 300, 0x222222).setStrokeStyle(4, 0xffd700);
        const title = this.add.text(0, -100, "PAUSA", { fontSize: '40px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        
        // Botón Continuar
        const resumeBtn = this.add.rectangle(0, 0, 250, 50, 0x006400).setInteractive({ useHandCursor: true });
        const resumeTxt = this.add.text(0, 0, "CONTINUAR", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        
        resumeBtn.on('pointerdown', () => {
            this.togglePause();
        });
        
        // Botón Salir
        const exitBtn = this.add.rectangle(0, 80, 250, 50, 0xaa0000).setInteractive({ useHandCursor: true });
        const exitTxt = this.add.text(0, 80, "SALIR AL MENÚ", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        
        exitBtn.on('pointerdown', () => {
            this.isPaused = false; // Resetear flag
            this.time.paused = false; // Asegurar tiempo corre
            this.physics.resume();
            this.scene.start('MainMenuScene');
        });

        this.pauseContainer.add([bg, panel, title, resumeBtn, resumeTxt, exitBtn, exitTxt]);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.physics.pause();
            this.tweens.pauseAll();
            this.time.paused = true; // Pausa el reloj global de la escena
            this.pauseContainer.setVisible(true);
            // Asegurar que el contenedor de pausa esté encima de todo
            this.children.bringToTop(this.pauseContainer);
        } else {
            this.physics.resume();
            this.tweens.resumeAll();
            this.time.paused = false;
            this.pauseContainer.setVisible(false);
        }
    }

    // --- UI VISUAL MEJORADA ---
    createUI() { 
        const w = this.scale.width; const h = this.scale.height; const uiDepth = 1000; const accent = this.theme.accent; 
        
        // Barra Superior
        this.add.rectangle(w/2, 60, w, 120, 0x111111).setScrollFactor(0).setDepth(uiDepth); 
        this.add.rectangle(w/2, 120, w, 4, accent).setScrollFactor(0).setDepth(uiDepth); 
        
        this.livesText = this.add.text(30, 15, '', { fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.add.text(30, 45, 'XP:', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.xpBarBg = this.add.rectangle(60, 52, 200, 10, 0x333333).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.xpBarFill = this.add.rectangle(60, 52, 0, 10, 0x00ffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.lvlText = this.add.text(270, 45, 'Lvl 1', { fontSize: '14px', color: '#00ffff' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.waveInfoText = this.add.text(w - 30, 40, 'OLEADA: 1', { fontSize: '28px', fontStyle: 'bold', color: accent }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        this.waveTimerContainer = this.add.container(w/2, 60).setScrollFactor(0).setDepth(uiDepth + 2); 
        this.waveTimerContainer.setSize(320, 60); this.waveTimerContainer.setInteractive({ useHandCursor: true }); 
        const timerBg = this.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff); 
        this.waveTimerBtnText = this.add.text(0, 0, "INICIAR", { fontSize: '18px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5); 
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]); 
        this.waveTimerContainer.setVisible(false); 
        this.waveTimerContainer.on('pointerdown', () => this.startNextWaveAction()); 
        
        // Barra Inferior
        const barHeight = 120; const botY = h - (barHeight / 2); 
        this.add.rectangle(w/2, botY, w, barHeight, 0x111111).setScrollFactor(0).setDepth(uiDepth); 
        this.add.rectangle(w/2, botY - (barHeight/2), w, 4, accent).setScrollFactor(0).setDepth(uiDepth); 
        const contentY = botY; 
        
        this.add.text(40, contentY - 30, 'TESORO:', { fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        this.economyText = this.add.text(40, contentY, '$0', { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        // Selector de Torres (Mejorado visualmente)
        this.add.text(300, contentY - 35, 'SELECTOR (Teclas 1-3)', { fontSize: '12px', color: '#aaaaaa' }).setScrollFactor(0).setDepth(uiDepth + 1); 
        const buildBg = this.add.rectangle(400, contentY + 10, 250, 60, 0x222222).setStrokeStyle(2, accent).setScrollFactor(0).setDepth(uiDepth);
        this.buildText = this.add.text(400, contentY + 10, '', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 1); 
        
        // Botón Habilidad (Centrado abajo)
        this.skillBtnContainer = this.add.container(w/2 + 200, contentY + 10).setScrollFactor(0).setDepth(uiDepth + 1); 
        const skillBg = this.add.rectangle(0, 0, 180, 50, 0x222222).setStrokeStyle(2, 0x555555); 
        this.skillBar = this.add.rectangle(-90, 0, 0, 50, accent).setOrigin(0, 0.5); 
        this.skillBtn = this.add.rectangle(0, 0, 180, 50, 0x000000, 0).setInteractive({ useHandCursor: true }); 
        this.skillText = this.add.text(0, 0, "HABILIDAD\n(Espacio)", { fontSize: '14px', align: 'center', fontStyle: 'bold' }).setOrigin(0.5); 
        this.skillBtnContainer.add([skillBg, this.skillBar, this.skillBtn, this.skillText]); 
        this.skillBtn.on('pointerdown', () => this.triggerPlayerSkill()); 
        
        // Botón Salir
        const exitBtn = this.add.rectangle(w - 80, contentY, 120, 50, 0x8b0000).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(uiDepth + 1).setStrokeStyle(2, 0xffffff); 
        this.add.text(w - 80, contentY, 'SALIR', { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(uiDepth + 2); 
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene')); 
    }

    // ... (El resto de métodos se mantienen iguales: startNextWave, spawnEnemy, spawnMinion, onEnemyKilled, generateBossLoot, victory, createExplosion, spawnLoot, collectLoot, showFloatingText, showLevelUpEffect, startWaveTimer, startNextWaveAction, checkWaveStatus, onEnemyLeaks, gameOver, createBuildSlots, tryBuildTower, createUpgradeUI, openUpgradeMenu, closeUpgradeMenu, updateUpgradeMenuText, tryUpgradeTower, sellTower, updateUI, updateSkillUI, triggerPlayerSkill, createSpawnIndicator) ...
    // Asegúrate de copiarlos del archivo anterior si estás reemplazando todo.
    startNextWave() {
        this.isTimerRunning = false; this.waveTimerContainer.setVisible(false);
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.currentWave > this.totalWaves) { this.victory(); return; }
        this.waveInProgress = true;
        const levelId = this.currentLevelData.id || 1;
        const levelDiff = this.currentLevelData.difficulty || 1;
        let baseCount = 8;
        const levelMultiplier = 1 + ((levelId - 1) * 0.20);
        let count = Math.floor((baseCount + (this.currentWave * 2)) * levelMultiplier);
        let enemyType = 'normal'; let interval = 1200; let hpMult = levelDiff;
        if (this.currentWave === 1) { enemyType = 'normal'; } 
        else if (this.currentWave === 2) { enemyType = 'speed'; interval = 700; hpMult *= 0.9; } 
        else if (this.currentWave === 3) { enemyType = 'tank'; count = Math.max(3, Math.floor(count * 0.6)); interval = 2000; hpMult *= 1.3; } 
        else if (this.currentWave === 4) { enemyType = 'mix_healer'; interval = 1000; }
        else if (this.currentWave === 5) { enemyType = 'speed'; count = Math.floor(count * 1.5); interval = 500; }
        else if (this.currentWave === 6) { count = 1; if (levelId === 1) enemyType = 'boss_goblin'; else if (levelId === 2) enemyType = 'boss_golem'; else if (levelId === 3) enemyType = 'boss_wizard'; else enemyType = 'boss'; this.waveInfoText.setText("¡JEFE FINAL!"); this.waveInfoText.setColor('#ff0000'); this.cameras.main.shake(500, 0.01); }
        if (this.currentWave !== 6) { this.waveInfoText.setText(`OLEADA: ${this.currentWave}/${this.totalWaves}`); this.waveInfoText.setColor(this.theme.accent); }
        this.enemiesToSpawn = count;
        this.spawnTimer = this.time.addEvent({ delay: interval, callback: () => { let actualType = enemyType; if (enemyType === 'mix_healer') actualType = Math.random() > 0.5 ? 'healer' : 'normal'; this.spawnEnemy(hpMult, actualType); this.enemiesToSpawn--; if (this.enemiesToSpawn <= 0) this.spawnTimer.remove(); }, repeat: count - 1 });
    }
    spawnEnemy(hpMult, type) { const enemy = new Enemy(this, this.pathPoints, hpMult, type); this.enemies.add(enemy); }
    spawnMinion(parentBoss) { if (!parentBoss || !parentBoss.active) return; const minion = new Enemy(this, this.pathPoints, 0.3, 'speed'); minion.follower.t = Math.max(0, parentBoss.follower.t - 0.02); const p1 = this.pathPoints[Math.floor(minion.follower.t * (this.pathPoints.length - 1))]; const p2 = this.pathPoints[Math.ceil(minion.follower.t * (this.pathPoints.length - 1))]; if (p1 && p2) { const segmentT = (minion.follower.t * (this.pathPoints.length - 1)) % 1; minion.x = Phaser.Math.Linear(p1.x, p2.x, segmentT); minion.y = Phaser.Math.Linear(p1.y, p2.y, segmentT); } minion.setScale(0); this.tweens.add({ targets: minion, scale: 1, duration: 300, ease: 'Back.out' }); this.enemies.add(minion); }
    onEnemyKilled(enemy) { try { this.coins += (enemy.coinReward || 10); if (RPGSystem && RPGSystem.gainHeroXP) { RPGSystem.gainHeroXP(enemy.xpReward || 10); } if (enemy.type.startsWith('boss')) { this.generateBossLoot(enemy); } else { this.spawnLoot(enemy.x, enemy.y); } this.createExplosion(enemy.x, enemy.y, enemy.colorVal); this.showFloatingText(80, 850, `+$${enemy.coinReward}`, '#ffff00'); this.updateUI(); } catch (err) { console.warn("Error visual al matar enemigo:", err); } }
    generateBossLoot(boss) { const mats = ['wood', 'copper', 'cloth', 'leather']; const matType = mats[Math.floor(Math.random() * mats.length)]; const qty = Phaser.Math.Between(1, 3); gameState.materials[matType]['common'] += qty; this.bossLootLog.push({ text: `${qty}x ${matType.toUpperCase()} (Común)`, color: '#ffffff' }); this.showFloatingText(boss.x, boss.y, "¡DROP JEFE!", "#ffd700"); if (Math.random() < 0.20) { gameState.materials[matType]['uncommon'] += 1; this.bossLootLog.push({ text: `1x ${matType.toUpperCase()} (Poco Común)`, color: '#00ff00' }); } if (Math.random() < 0.05) { const weaponRecipe = RECIPES.find(r => r.type === 'weapon'); if (weaponRecipe) { const item = RPGSystem.generateItem(weaponRecipe, RARITY['common']); gameState.inventory.push(item); this.bossLootLog.push({ text: `ARMA: ${item.name}`, color: '#00ffff' }); } } }
    victory() { this.physics.pause(); const goldReward = this.currentLevelData.rewardGold || 100; gameState.gold += goldReward; SaveSystem.save(); this.scene.start('ResultScene', { success: true, levelId: this.currentLevelData.id, castleHp: gameState.baseHp, rewards: { gold: goldReward }, sessionLoot: this.sessionLoot, bossLoot: this.bossLootLog }); }
    createExplosion(x, y, color) { const circle = this.add.circle(x, y, 5, color); this.tweens.add({ targets: circle, scale: 4, alpha: 0, duration: 300, onComplete: () => circle.destroy() }); for(let i=0; i<4; i++) { const spark = this.add.rectangle(x, y, 4, 4, color); const angle = Phaser.Math.DegToRad(Math.random() * 360); const dist = 30; this.tweens.add({ targets: spark, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0, duration: 400, onComplete: () => spark.destroy() }); } }
    spawnLoot(x, y) { if (Math.random() > 0.30) return; let type = 'wood'; let rarity = 'common'; const rollType = Math.random(); if (rollType < 0.15) { type = 'potion_hp'; } else if (rollType < 0.25) { type = 'coin_bag'; } else if (rollType < 0.30) { type = 'xp_tome'; } else { const matRoll = Math.random(); if (matRoll < 0.25) type = 'wood'; else if (matRoll < 0.50) type = 'copper'; else if (matRoll < 0.75) type = 'cloth'; else type = 'leather'; const levelId = this.currentLevelData.id || 1; const luck = (levelId - 1) * 0.05; const rRoll = Math.random() * 100; const tGold = 0.5 + (luck * 1); const tPurple = 2 + (luck * 2); const tBlue = 10 + (luck * 5); if (rRoll < tGold) rarity = 'legendary'; else if (rRoll < tPurple) rarity = 'epic'; else if (rRoll < tBlue) rarity = 'rare'; else if (rRoll < 40) rarity = 'uncommon'; else rarity = 'common'; } const item = new Loot(this, x, y, type, rarity); this.loots.add(item); }
    collectLoot(lootItem) { if (lootItem.isConsumable) { if (lootItem.typeKey === 'potion_hp') { const heal = Math.floor(gameState.playerStats.maxHp * 0.25); gameState.playerStats.hp = Math.min(gameState.playerStats.hp + heal, gameState.playerStats.maxHp); this.showFloatingText(lootItem.x, lootItem.y, `+${heal} HP`, '#ff0000'); if(this.player) this.player.createEffect('heal'); } else if (lootItem.typeKey === 'coin_bag') { const gold = Phaser.Math.Between(30, 60); this.coins += gold; this.updateUI(); this.showFloatingText(lootItem.x, lootItem.y, `+$${gold}`, '#ffd700'); } else if (lootItem.typeKey === 'xp_tome') { const xp = 50; RPGSystem.gainHeroXP(xp); this.showFloatingText(lootItem.x, lootItem.y, `+${xp} XP`, '#0000ff'); } } else { gameState.materials[lootItem.typeKey][lootItem.rarityKey]++; if (!this.sessionLoot[lootItem.typeKey]) this.sessionLoot[lootItem.typeKey] = {}; if (!this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]) this.sessionLoot[lootItem.typeKey][lootItem.rarityKey] = 0; this.sessionLoot[lootItem.typeKey][lootItem.rarityKey]++; this.showFloatingText(lootItem.x, lootItem.y, `+1 ${lootItem.typeKey}`, '#ffffff'); } lootItem.destroy(); }
    showFloatingText(x, y, message, color = '#fff') { const isCrit = color === '#ffaa00'; const fontSize = isCrit ? '32px' : '20px'; const text = this.add.text(x, y, message, { fontSize: fontSize, fontStyle: 'bold', color: color, stroke: '#000', strokeThickness: isCrit ? 6 : 3 }).setOrigin(0.5).setDepth(2000); this.tweens.add({ targets: text, y: y - 50, alpha: 0, scale: isCrit ? 1.5 : 1.2, duration: 800, ease: 'Power2', onComplete: () => text.destroy() }); }
    showLevelUpEffect() { const w = this.scale.width; const h = this.scale.height; const txt = this.add.text(w/2, h/2, "¡LEVEL UP!", { fontSize: '64px', fontStyle: 'bold', color: '#ffd700', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(3000).setScale(0); this.tweens.add({ targets: txt, scale: 1.5, duration: 500, ease: 'Back.out', yoyo: true, hold: 1000, onComplete: () => txt.destroy() }); this.cameras.main.flash(500, 255, 215, 0); gameState.playerStats.hp = gameState.playerStats.maxHp; if(this.player && this.player.createEffect) this.player.createEffect('heal'); }
    startWaveTimer(seconds) { this.isTimerRunning = true; this.timeToNextWave = seconds * 1000; this.waveTimerContainer.setVisible(true); }
    startNextWaveAction() { if (this.isTimerRunning) this.startNextWave(); }
    checkWaveStatus() { if (this.isTimerRunning) return; if (this.enemiesToSpawn <= 0 && this.enemies.countActive(true) === 0) { this.waveInProgress = false; this.currentWave++; if (this.currentWave > this.totalWaves) this.victory(); else this.startWaveTimer(12); } }
    onEnemyLeaks(damage) { gameState.baseHp -= damage; this.cameras.main.flash(200, 255, 0, 0); this.updateUI(); if (gameState.baseHp <= 0) this.gameOver(); }
    gameOver() { this.physics.pause(); if (this.spawnTimer) this.spawnTimer.remove(); this.scene.start('ResultScene', { success: false, levelId: this.currentLevelData.id }); }
    createBuildSlots() { const rawSlots = this.currentLevelData.towerSlots || []; rawSlots.forEach(slot => { const site = new BuildSite(this, slot.x * this.sx, slot.y * this.sy); this.buildSites.add(site); site.on('pointerdown', () => this.tryBuildTower(site)); }); }
    tryBuildTower(site) { if (site.isOccupied) return; const stats = TOWER_TYPES[this.selectedTowerType]; if (this.coins >= stats.baseCost) { this.coins -= stats.baseCost; const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles, site, stats.baseCost); this.towers.add(tower); site.occupy(); this.updateUI(); this.tweens.add({ targets: tower, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.out' }); } else { this.cameras.main.shake(100, 0.005); } }
    createUpgradeUI() { this.upgradeContainer = this.add.container(0, 0).setDepth(2000); this.upgradeContainer.setVisible(false); const bg = this.add.rectangle(0, 0, 220, 160, 0x000000, 0.9).setStrokeStyle(2, 0xffffff).setInteractive(); this.upgradeText = this.add.text(0, -50, '', { fontSize: '14px', align: 'center', color: '#fff' }).setOrigin(0.5); this.upgradeBtn = this.add.rectangle(0, 0, 180, 35, 0x00aa00).setInteractive({ useHandCursor: true }); this.upgradeBtnText = this.add.text(0, 0, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.sellBtn = this.add.rectangle(0, 50, 180, 35, 0xaa0000).setInteractive({ useHandCursor: true }); this.sellBtnText = this.add.text(0, 50, 'VENDER', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); this.upgradeBtn.on('pointerdown', () => this.tryUpgradeTower()); this.sellBtn.on('pointerdown', () => this.sellTower()); this.upgradeContainer.add([bg, this.upgradeText, this.upgradeBtn, this.upgradeBtnText, this.sellBtn, this.sellBtnText]); }
    openUpgradeMenu(tower) { this.selectedTowerToUpgrade = tower; this.upgradeContainer.setPosition(tower.x, tower.y - 100); this.upgradeContainer.setVisible(true); tower.rangeCircle.setVisible(true); this.updateUpgradeMenuText(); }
    closeUpgradeMenu() { if (this.selectedTowerToUpgrade) this.selectedTowerToUpgrade.rangeCircle.setVisible(false); this.selectedTowerToUpgrade = null; this.upgradeContainer.setVisible(false); }
    updateUpgradeMenuText() { if (!this.selectedTowerToUpgrade) return; const t = this.selectedTowerToUpgrade; if (t.level >= t.maxLevel) { this.upgradeText.setText(`${t.typeName} (MAX)\nDaño: ${t.damage}`); this.upgradeBtn.setVisible(false); this.upgradeBtnText.setVisible(false); } else { this.upgradeBtn.setVisible(true); this.upgradeBtnText.setVisible(true); this.upgradeText.setText(`${t.typeName} Lv ${t.level}\nDaño: ${t.damage} -> ${Math.floor(t.damage * 1.2)}`); this.upgradeBtnText.setText(`MEJORAR ($${t.upgradeCost})`); } this.sellBtnText.setText(`VENDER (+$${t.totalInvestment})`); }
    tryUpgradeTower() { const t = this.selectedTowerToUpgrade; if (t && this.coins >= t.upgradeCost) { this.coins -= t.upgradeCost; t.upgrade(); this.updateUpgradeMenuText(); this.updateUI(); } }
    sellTower() { const t = this.selectedTowerToUpgrade; if (t) { this.coins += t.totalInvestment; this.updateUI(); if (t.buildSite) t.buildSite.free(); t.destroy(); this.closeUpgradeMenu(); this.showFloatingText(t.x, t.y - 50, `+$${t.totalInvestment}`, '#ffff00'); } }
    
    updateUI() { 
        const w = this.scale.width; const h = this.scale.height; const currentTower = TOWER_TYPES[this.selectedTowerType]; 
        this.economyText.setText(`$${this.coins}`); 
        this.buildText.setText(`> ${currentTower.name.toUpperCase()} <\nCOSTO: $${currentTower.baseCost}`); 
        
        const pStats = gameState.playerStats; 
        const heroHp = Math.max(0, Math.floor(pStats.hp)); 
        this.livesText.setText(`❤️ HÉROE: ${heroHp}/${pStats.maxHp}\n🏰 CASTILLO: ${gameState.baseHp}`); 
        
        const hero = getCurrentHero();
        if (hero) {
            const xpPercent = Math.min(1, hero.xp / hero.maxXp);
            if(this.xpBarFill) this.xpBarFill.width = 200 * xpPercent;
            if(this.lvlText) this.lvlText.setText(`Lvl ${hero.level}`);
        }
    }

    updateSkillUI() { if (!this.player) return; const cd = this.player.skillCooldown; const maxCd = this.player.skillMaxCooldown; if (cd > 0) { const progress = 1 - (cd / maxCd); this.skillBar.width = 200 * progress; this.skillBar.setFillStyle(0x555555); this.skillText.setText(`${(cd / 1000).toFixed(1)}s`); } else { this.skillBar.width = 200; this.skillBar.setFillStyle(this.theme.accent); if (this.skillText.text.includes("s")) this.skillText.setText("HABILIDAD\n(Espacio)"); } }
    triggerPlayerSkill() { if (!this.player) return; const result = this.player.castSkill(); if (result.success) { this.tweens.add({ targets: this.skillBtnContainer, scale: 0.9, yoyo: true, duration: 100 }); } }
    createSpawnIndicator() { if (!this.pathPoints || this.pathPoints.length === 0) return; const startX = this.pathPoints[0].x; const startY = this.pathPoints[0].y; const marker = this.add.circle(startX, startY, 20, 0xff0000); this.tweens.add({ targets: marker, scale: 1.5, alpha: 0, duration: 1000, repeat: -1 }); this.add.text(startX, startY - 40, '⬇ INICIO', { fontSize: '16px', fontStyle: 'bold', color: '#ff0000', backgroundColor: '#000000' }).setOrigin(0.5); }
}