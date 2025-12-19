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

        // Visuales
        const stats = TOWER_TYPES[typeKey];
        this.typeName = stats.name;
        
        // Base
        this.base = scene.add.rectangle(0, 0, 40, 40, stats.color);
        this.base.setStrokeStyle(2, 0x000000);
        
        // Torreta
        this.turret = scene.add.rectangle(0, -10, 20, 20, 0xffffff);
        
        this.add([this.base, this.turret]);
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        // Stats Iniciales
        this.level = 1;
        this.maxLevel = stats.levels.length; // Leemos el máximo de la config
        this.lastAttackTime = 0;
        
        // Rango Visual
        this.rangeCircle = scene.add.circle(x, y, 100, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false);
        this.rangeCircle.setDepth(5); 

        // --- CORRECCIÓN CLAVE: Cargar stats iniciales correctamente ---
        this.updateStats(); 
    }

    update(time, delta) {
        // Disparar si pasó el tiempo
        if (time > this.lastAttackTime + this.attackSpeed) {
            this.findTargetAndFire(time);
        }
    }

    findTargetAndFire(time) {
        let target = null;
        let minDist = this.range;

        // Buscar enemigo más cercano dentro del rango
        this.enemies.children.iterate(enemy => {
            if (enemy.active && !enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    if (dist < minDist) {
                        minDist = dist;
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
            // Pasamos el tipo de torre para que el proyectil sepa su color/velocidad
            proj.fire(target, this.damage, this.typeKey);
        }
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        
        this.level++;
        this.updateStats(); // Actualizar stats al nuevo nivel
        this.totalInvestment += this.upgradeCost; 
        
        this.scene.tweens.add({
            targets: this, scale: 1.2, yoyo: true, duration: 100
        });
    }

    updateStats() {
        // --- CORRECCIÓN: LEER DATOS DESDE 'levels' ---
        const typeData = TOWER_TYPES[this.typeKey];
        const levelIndex = this.level - 1; // Array empieza en 0
        const currentStats = typeData.levels[levelIndex];

        if (currentStats) {
            this.damage = currentStats.damage;
            this.range = currentStats.range;
            this.attackSpeed = currentStats.fireRate; // Mapear fireRate a attackSpeed
            this.upgradeCost = currentStats.upgradeCost; // Costo exacto de la config
            
            // Actualizar círculo visual
            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
        }
    }
    
    destroy() {
        if (this.rangeCircle) this.rangeCircle.destroy();
        super.destroy();
    }
}