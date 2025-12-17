// src/scenes/GameScene.js
import Phaser from 'phaser';
import Player from '../entities/player/Player.js';
import Enemy from '../entities/enemies/Enemy.js';
import Projectile from '../entities/projectiles/Projectile.js';
import Tower from '../entities/towers/Tower.js';
import BuildSite from '../entities/towers/BuildSite.js';
import { gameState } from '../config/GameState.js';
import { TOWER_TYPES } from '../config/TowerStats.js';

// --- ¡ESTA ES LA LÍNEA QUE FALTA PARA EL PRIMER ERROR! ---
import Loot from '../entities/items/Loot.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.selectedTowerType = 'archer';
        this.coins = 0; // Monedas locales del nivel
        this.selectedTowerToUpgrade = null; // Torre seleccionada
    }

    init(data) {
        this.currentLevelData = data.levelData || { id: 1, name: "Test", startCoins: 500, difficulty: 1, path: [], towerSlots: [] };
    }

    create() {
        // 1. Configuración Inicial
        this.coins = this.currentLevelData.startCoins;
        this.currentWave = 1;
        this.totalWaves = 5; // <--- FORZAMOS QUE SIEMPRE SEA 5
        this.waveInProgress = false;
        this.isWaitingNextWave = false;

        // 2. Mapa y Camino
        const pathPoints = this.currentLevelData.path;
        this.pathPoints = pathPoints;
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x666666, 1);
        graphics.beginPath();
        graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
        graphics.strokePath();

        // 3. Grupos
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.towers = this.physics.add.group({ classType: Tower, runChildUpdate: true });
        this.buildSites = this.add.group();
        this.loots = this.physics.add.group({ classType: Loot });

        this.createBuildSlots();
        this.createSpawnIndicator();


        // 4. Jugador
        this.player = new Player(this, 640, 360, gameState.selectedClass, this.enemies, this.projectiles);

        // 5. Colisiones
        this.physics.add.overlap(this.enemies, this.projectiles, (enemy, projectile) => {
            // Si es cañón (AoE), explota. Si no, daño normal.
            if (projectile.aoeRadius > 0) {
                projectile.explode(this.enemies);
            } else {
                enemy.takeDamage(projectile.damage);
            }
            projectile.destroy();
        });

        // 6. Interacción con Torres (Para mejorar)
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Tower) {
                this.openUpgradeMenu(gameObject);
            } else {
                // Si haces clic fuera, cierras el menú
                this.closeUpgradeMenu();
            }
        });

        // Inputs Teclado
        this.input.keyboard.on('keydown-ONE', () => { this.selectedTowerType = 'archer'; this.updateUI(); });
        this.input.keyboard.on('keydown-TWO', () => { this.selectedTowerType = 'cannon'; this.updateUI(); });
        this.input.keyboard.on('keydown-THREE', () => { this.selectedTowerType = 'mage'; this.updateUI(); });

        // 7. UI
        this.createUI();
        this.createUpgradeUI(); // Panel oculto de mejoras

        this.startNextWave();
        this.updateUI();
    }

    update(time, delta) {
        if (this.player) this.player.update(time);
        this.updateUI();
    }

    // --- ECONOMÍA: GANAR MONEDAS AL MATAR ---
    addEnemyReward(amount) {
        this.coins += amount;
        // Animación de texto flotante
        /* Podríamos agregar "+10" flotando sobre el enemigo aquí */
    }

    // --- CONSTRUCCIÓN ---
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
        const cost = stats.baseCost;

        if (this.coins >= cost) {
            this.coins -= cost;
            const tower = new Tower(this, site.x, site.y, this.selectedTowerType, this.enemies, this.projectiles);
            this.towers.add(tower);
            site.occupy();
            this.updateUI();
        } else {
            console.log("No hay suficientes monedas");
            this.cameras.main.shake(100, 0.005);
        }
    }

    // --- SISTEMA DE MEJORAS (UPGRADE) ---
    createUpgradeUI() {
        // Contenedor del menú de mejora (Oculto al inicio)
        this.upgradeContainer = this.add.container(0, 0);
        this.upgradeContainer.setVisible(false);
        this.upgradeContainer.setDepth(100);

        // Fondo
        const bg = this.add.rectangle(0, 0, 200, 120, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.upgradeContainer.add(bg);

        // Texto Info
        this.upgradeText = this.add.text(0, -30, '', { fontSize: '14px', align: 'center' }).setOrigin(0.5);
        this.upgradeContainer.add(this.upgradeText);

        // Botón Mejorar
        this.upgradeBtn = this.add.rectangle(0, 20, 120, 30, 0x00aa00).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 20, 'MEJORAR', { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        this.upgradeContainer.add([this.upgradeBtn, btnText]);

        // Lógica del botón
        this.upgradeBtn.on('pointerdown', () => {
            if (this.selectedTowerToUpgrade) {
                this.tryUpgradeTower();
            }
        });
    }

    openUpgradeMenu(tower) {
        this.selectedTowerToUpgrade = tower;
        
        // Mover menú cerca de la torre (evitando salir de pantalla)
        let menuX = tower.x;
        let menuY = tower.y - 80;
        if (menuY < 60) menuY = tower.y + 80; // Si está muy arriba, mostrar abajo
        
        this.upgradeContainer.setPosition(menuX, menuY);
        this.upgradeContainer.setVisible(true);
        
        // Mostrar rango de la torre
        tower.rangeCircle.setVisible(true);

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
        const tower = this.selectedTowerToUpgrade;
        if (this.coins >= tower.upgradeCost) {
            this.coins -= tower.upgradeCost;
            tower.upgrade();
            this.updateUpgradeMenuText();
            this.updateUI();
        } else {
            console.log("Faltan monedas para mejorar");
        }
    }

    // --- UI PRINCIPAL ---
    createUI() {
        // Panel Monedas (Reemplaza a Materiales)
        this.add.rectangle(110, 210, 200, 80, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(1, 0xffd700);
        this.add.text(110, 180, 'ECONOMÍA', { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
        this.economyText = this.add.text(20, 200, '', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0);

        // Los otros paneles (Héroe, Wave, Construcción) se mantienen
        // ... (Copiar de la versión anterior o dejar que updateUI los maneje)
        this.add.rectangle(640, 40, 300, 60, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(2, 0xffffff);
        this.waveText = this.add.text(640, 40, 'PREPARANDO...', { fontSize: '24px', fontStyle: 'bold', color: '#ff0000' }).setOrigin(0.5).setScrollFactor(0);
        
        this.add.rectangle(1160, 85, 220, 150, 0x000000, 0.7).setScrollFactor(0).setStrokeStyle(1, 0x00ffff);
        this.add.text(1160, 25, 'CONSTRUCCIÓN', { fontSize: '16px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
        this.buildText = this.add.text(1060, 45, '', { fontSize: '12px', color: '#fff', lineHeight: 20 }).setScrollFactor(0);

        // Botón Salir
        const exitBtn = this.add.rectangle(1200, 680, 120, 40, 0xaa0000).setInteractive({ useHandCursor: true }).setScrollFactor(0);
        this.add.text(1200, 680, 'SALIR', { fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0);
        exitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    updateUI() {
        // Actualizar textos
        const currentTower = TOWER_TYPES[this.selectedTowerType];
        
        this.economyText.setText(`MONEDAS: $${this.coins}`);
        
        this.buildText.setText(
            `SELECCIONADA:\n> ${currentTower.name.toUpperCase()} <\n\n` +
            `COSTE: $${currentTower.baseCost}\n` +
            `(Teclas 1, 2, 3)`
        );
    }
    
    // --- OLEADAS Y ENEMIGOS (Modificado para dar Monedas) ---
    spawnEnemy(speedMult, hpMult, isBoss) {
        const enemy = new Enemy(this, this.pathPoints, speedMult, hpMult, isBoss);
        
        // --- CÁLCULO DE ORO ---
        // Base: 25 monedas.
        // Bono: +10% (0.10) por cada nivel extra.
        // Nivel 1: 25 * 1.0 = 25
        // Nivel 2: 25 * 1.1 = 27.5 -> Redondeamos a 28
        // Nivel 3: 25 * 1.2 = 30
        const levelIndex = this.currentLevelData.id || 1;
        const levelBonus = 1 + ((levelIndex - 1) * 0.10); 
        
        let baseReward = 25;
        if (isBoss) baseReward = 500;

        enemy.coinReward = Math.floor(baseReward * levelBonus);
        
        this.enemies.add(enemy);
    }

    // resto de funciones de oleadas (startNextWave, checkWaveStatus, victory) igual que antes...
    // IMPORTANTE: Asegúrate de copiar startNextWave y checkWaveStatus del código anterior
    
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
            // BOSS
            count = 1; 
            // Velocidad lenta (0.4 base)
            speedMult = 0.4 + (levelIndex * 0.05); 
            
            // --- CAMBIO: NERFEO MASIVO DE VIDA ---
            // Antes era 15.0, ahora es 2.5. (5000 HP aprox para Nivel 1)
            hpMult = 2.5 * levelDiff; 
            
            interval = 1000;
            isBossWave = true;
            this.updateWaveTitle("¡BOSS FINAL!");
        } else {
            // OLEADAS NORMALES
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

    // 2. NUEVA FUNCIÓN: CUANDO UN ENEMIGO SE ESCAPA
    onEnemyLeaks(damage) {
        // Restar vida al estado global
        gameState.playerStats.hp -= damage;
        
        // Feedback visual (Cámara roja)
        this.cameras.main.flash(200, 255, 0, 0);
        console.log(`¡Enemigo escapó! -${damage} HP. Vida restante: ${gameState.playerStats.hp}`);

        this.updateUI();

        // Game Over si la vida llega a 0
        if (gameState.playerStats.hp <= 0) {
            this.gameOver();
        }
    }

    updateWaveTitle(text) { this.waveText.setText(text); this.tweens.add({ targets: this.waveText, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 }); }
    checkWaveStatus() {
        // SEGURIDAD: Si ya estamos esperando la siguiente oleada, NO hacer nada.
        // Esto evita que si mueren 2 enemigos a la vez, se llame 2 veces.
        if (this.isWaitingNextWave) return;

        const enemiesAlive = this.enemies.countActive(true);

        // Si ya salieron todos (ToSpawn <= 0) Y no queda ninguno vivo (Alive === 0)
        if (this.enemiesToSpawn <= 0 && enemiesAlive === 0) {
            
            this.waveInProgress = false;
            this.isWaitingNextWave = true; // ACTIVAMOS EL CANDADO

            this.waveText.setText("¡OLEADA COMPLETADA!");
            
            // Esperamos 3 segundos antes de la siguiente
            this.time.delayedCall(3000, () => {
                this.currentWave++;
                this.startNextWave();
            });
        }
    }
    createSpawnIndicator() { /* ... igual ... */ }
    victory() {
        this.waveFinished = true;
        this.waveText.setText("¡VICTORIA!");
        this.waveText.setColor('#00ff00');
        
        if (this.currentLevelData.id >= gameState.levelsUnlocked) {
            gameState.levelsUnlocked = this.currentLevelData.id + 1;
        }

        // --- DAR PREMIO DE ORO GLOBAL ---
        // (Este oro sirve para comprar cofres en el menú)
        const goldReward = this.currentLevelData.rewardGold || 100;
        gameState.gold += goldReward;
        console.log(`Oro ganado: ${goldReward}. Total: ${gameState.gold}`);

        this.time.delayedCall(3000, () => {
            this.scene.start('WorldMapScene');
        });
    }

    ameOver() {
        // Pausar todo
        this.physics.pause();
        if (this.spawnTimer) this.spawnTimer.remove();
        
        this.waveText.setText("¡DERROTA!");
        this.waveText.setColor('#ff0000');
        this.waveText.setAlpha(1);

        // Volver al menú tras 3 segundos
        this.time.delayedCall(3000, () => {
            // Restaurar vida para la próxima vez (opcional)
            gameState.playerStats.hp = gameState.playerStats.maxHp; 
            this.scene.start('MainMenuScene');
        });
    }

    spawnLoot(x, y) {
        if (Math.random() > 0.3) {
            const randType = Math.random();
            let type = 'wood';
            if (randType > 0.9) type = 'copper'; 
            else if (randType > 0.6) type = 'cloth';

            // --- RNG DE RAREZA DEL MATERIAL ---
            const randRarity = Math.random();
            let rarity = 'common';
            // 5% Legendario, 15% Raro, etc.
            if (randRarity > 0.98) rarity = 'legendary';
            else if (randRarity > 0.90) rarity = 'epic';
            else if (randRarity > 0.80) rarity = 'rare';
            else if (randRarity > 0.60) rarity = 'uncommon';

            const item = new Loot(this, x, y, type, rarity);
            this.loots.add(item);
        }
    }

    collectLoot(lootItem) {
        // Guardamos en: gameState.materials['wood']['rare']
        gameState.materials[lootItem.typeKey][lootItem.rarityKey]++;
        
        // Texto flotante para saber qué recogiste
        const text = this.add.text(lootItem.x, lootItem.y, `+${lootItem.typeKey} (${lootItem.rarityKey})`, { 
            fontSize: '12px', color: '#ffffff', stroke: '#000', strokeThickness: 2 
        });
        
        this.tweens.add({
            targets: text,
            y: lootItem.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        lootItem.destroy();
        // Nota: updateUI del juego no muestra el inventario detallado porque es gigante, 
        // eso se verá en el Menú Principal.
    }

}