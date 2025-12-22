// src/entities/towers/Tower.js
import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';
import { gameState, getTowerBonuses } from '../../config/GameState.js'; // Importar gameState

export default class Tower extends Phaser.GameObjects.Container {
    constructor(scene, x, y, typeKey, enemiesGroup, projectilesGroup, buildSite, baseCost) {
        super(scene, x, y);
        scene.add.existing(this);

        this.typeKey = typeKey;
        this.enemies = enemiesGroup;
        this.projectiles = projectilesGroup;
        this.buildSite = buildSite; 
        this.totalInvestment = baseCost; 

        const stats = TOWER_TYPES[typeKey];
        this.typeName = stats.name;
        this.baseColor = stats.color;
        
        this.base = scene.add.rectangle(0, 0, 40, 40, 0x808080);
        this.base.setStrokeStyle(2, 0x000000);
        
        this.turretGroup = scene.add.container(0, 0);
        this.add([this.base, this.turretGroup]);
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        this.rangeCircle = scene.add.circle(x, y, 100, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false);
        this.rangeCircle.setDepth(5); 

        this.upgradeBarBg = scene.add.rectangle(0, -30, 40, 6, 0x000000).setVisible(false);
        this.upgradeBarFill = scene.add.rectangle(-20, -30, 0, 6, 0x00ff00).setOrigin(0, 0.5).setVisible(false);
        this.add([this.upgradeBarBg, this.upgradeBarFill]);

        this.level = 1;
        this.maxLevel = stats.levels.length; 
        this.lastAttackTime = 0;
        this.isUpgrading = false; 
        
        this.updateStats(); 
    }

    update(time, delta) {
        if (this.isUpgrading) return;

        if (time > this.lastAttackTime + this.attackSpeed) {
            this.findTargetAndFire(time);
        }
        
        if (this.typeKey === 'mage') {
            this.turretGroup.angle += 1; 
        }
    }

    findTargetAndFire(time) {
        let target = null;
        let maxProgress = -1;
        this.enemies.children.iterate(enemy => {
            if (enemy.active && !enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    if (enemy.follower.t > maxProgress) {
                        maxProgress = enemy.follower.t;
                        target = enemy;
                    }
                }
            }
        });
        if (target) {
            if (this.typeKey !== 'mage') { 
                const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
                this.turretGroup.rotation = angle + (Math.PI / 2);
            }
            this.fire(target);
            this.lastAttackTime = time;
        }
    }

    fire(target) {
        const fireProjectile = () => {
            const proj = this.projectiles.get(this.x, this.y - 10);
            if (proj) {
                proj.fire(target, {
                    damage: this.damage,
                    type: this.typeKey,
                    aoeRadius: this.aoeRadius || 0,
                    slowFactor: this.slowFactor || 1
                });
            }
        };
        fireProjectile();
        if (this.doubleAttackChance > 0 && Math.random() * 100 < this.doubleAttackChance) {
            this.scene.time.delayedCall(100, fireProjectile); 
        }
        this.scene.tweens.add({ targets: this.turretGroup, y: 5, yoyo: true, duration: 50 });
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        if (this.isUpgrading) return; 

        this.isUpgrading = true;
        this.upgradeBarBg.setVisible(true);
        this.upgradeBarFill.setVisible(true);
        this.upgradeBarFill.width = 0;

        this.scene.tweens.add({
            targets: this.upgradeBarFill,
            width: 40,
            duration: 3000,
            onComplete: () => {
                this.finalizeUpgrade();
            }
        });
    }

    finalizeUpgrade() {
        this.totalInvestment += this.upgradeCost;
        this.level++;
        this.isUpgrading = false;
        
        this.upgradeBarBg.setVisible(false);
        this.upgradeBarFill.setVisible(false);

        this.updateStats(); 
        
        this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
        const flash = this.scene.add.circle(this.x, this.y, 10, 0xffff00, 0.8);
        this.scene.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
        
        if (this.scene && this.scene.selectedTowerToUpgrade === this) {
            this.scene.updateUpgradeMenuText();
        }
    }

    updateStats() {
        const typeData = TOWER_TYPES[this.typeKey];
        const levelIndex = this.level - 1; 
        const currentStats = typeData.levels[levelIndex];

        if (currentStats) {
            this.damage = currentStats.damage;
            this.range = currentStats.range;
            this.attackSpeed = currentStats.fireRate; 
            this.upgradeCost = currentStats.upgradeCost || 0;
            this.aoeRadius = currentStats.aoe || 0;
            this.slowFactor = currentStats.slow || 1;

            // --- APLICAR BONOS DE EQUIPAMIENTO ---
            // Leemos directamente del GameState actualizado
            const eq = gameState.towerEquipment[this.typeKey];
            if (eq) {
                [eq.slot1, eq.slot2].forEach(item => {
                    if (item && item.stats) {
                        this.damage += (item.stats.damage || 0);
                        this.range += (item.stats.range || 0);
                        // Velocidad: Restamos delay (mínimo 100ms)
                        this.attackSpeed = Math.max(100, this.attackSpeed - (item.stats.attackSpeed || 0));
                        this.doubleAttackChance = (this.doubleAttackChance || 0) + (item.stats.doubleAttack || 0);
                    }
                });
            }

            // Bonos de talentos globales (si existen)
            const bonuses = getTowerBonuses(this.typeKey);
            this.damage += bonuses.damage;
            this.range += bonuses.range;
            this.attackSpeed = Math.max(100, this.attackSpeed - bonuses.attackSpeed);
            this.doubleAttackChance = (this.doubleAttackChance || 0) + (bonuses.doubleAttack || 0);

            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
            this.updateAppearance();
        }
    }

    updateAppearance() {
        this.turretGroup.removeAll(true);
        const color = this.baseColor;
        
        if (this.typeKey === 'archer') {
            const body = this.scene.add.rectangle(0, 0, 24, 24, color);
            this.turretGroup.add(body);
            if (this.level >= 3) {
                const bow = this.scene.add.triangle(0, -10, 0, 0, -10, 10, 10, 10, 0xffffff);
                this.turretGroup.add(bow);
            }
            if (this.level >= 5) body.setStrokeStyle(4, 0xffd700);

        } else if (this.typeKey === 'cannon') {
            const barrelWidth = this.level >= 3 ? 16 : 10;
            const barrelLen = this.level >= 3 ? 30 : 20;
            const barrel = this.scene.add.rectangle(0, -barrelLen/2, barrelWidth, barrelLen, 0x333333);
            const body = this.scene.add.circle(0, 0, 15, color);
            this.turretGroup.add([barrel, body]);
            if (this.level >= 5) {
                const barrel2 = this.scene.add.rectangle(8, -15, 8, 30, 0x333333);
                const barrel3 = this.scene.add.rectangle(-8, -15, 8, 30, 0x333333);
                this.turretGroup.add([barrel2, barrel3]);
            }

        } else if (this.typeKey === 'mage') {
            const size = 10 + (this.level * 2);
            const crystal = this.scene.add.rectangle(0, 0, size, size, color);
            crystal.rotation = Math.PI / 4; 
            this.turretGroup.add(crystal);
            if (this.level >= 3) {
                const inner = this.scene.add.rectangle(0, 0, size/2, size/2, 0xffffff);
                inner.rotation = Math.PI / 4;
                this.turretGroup.add(inner);
            }
            if (this.level >= 5) {
                const aura = this.scene.add.circle(0, 0, size + 5, color, 0.3);
                this.turretGroup.add(aura);
            }
        }
    }
    
    destroy() {
        if (this.rangeCircle) this.rangeCircle.destroy();
        super.destroy();
    }
}