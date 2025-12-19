// src/entities/towers/Tower.js
import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';

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
        
        // Visual
        this.base = scene.add.rectangle(0, 0, 40, 40, stats.color);
        this.base.setStrokeStyle(2, 0x000000);
        this.turret = scene.add.rectangle(0, -10, 20, 20, 0xffffff);
        this.add([this.base, this.turret]);
        
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        // Rango Visual
        this.rangeCircle = scene.add.circle(x, y, 100, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false);
        this.rangeCircle.setDepth(5); 

        // Stats Iniciales
        this.level = 1;
        this.maxLevel = stats.levels.length; 
        this.lastAttackTime = 0;
        
        this.updateStats(); 
    }

    update(time, delta) {
        if (time > this.lastAttackTime + this.attackSpeed) {
            this.findTargetAndFire(time);
        }
    }

    findTargetAndFire(time) {
        let target = null;
        let minDist = this.range;

        // Prioridad: El enemigo que más ha avanzado (mayor 't')
        // Esto es mejor que "el más cercano" para evitar fugas
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
            this.fire(target);
            this.lastAttackTime = time;
        }
    }

    fire(target) {
        const proj = this.projectiles.get(this.x, this.y - 10);
        if (proj) {
            // Pasamos stats especiales
            proj.fire(target, {
                damage: this.damage,
                type: this.typeKey,
                aoeRadius: this.aoeRadius || 0,
                slowFactor: this.slowFactor || 1
            });
        }
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        
        this.totalInvestment += this.upgradeCost;
        this.level++;
        this.updateStats(); 
        
        this.scene.tweens.add({
            targets: this, scale: 1.2, yoyo: true, duration: 100
        });
    }

    updateStats() {
        const typeData = TOWER_TYPES[this.typeKey];
        const levelIndex = this.level - 1; 
        const currentStats = typeData.levels[levelIndex];

        if (currentStats) {
            this.damage = currentStats.damage;
            this.range = currentStats.range;
            this.attackSpeed = currentStats.fireRate; 
            this.upgradeCost = currentStats.upgradeCost;
            
            // Stats especiales
            this.aoeRadius = currentStats.aoe || 0;
            this.slowFactor = currentStats.slow || 1; // 1 = velocidad normal
            
            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
        }
    }
    
    destroy() {
        if (this.rangeCircle) this.rangeCircle.destroy();
        super.destroy();
    }
}