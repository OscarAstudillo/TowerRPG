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
        this.buildSite = buildSite; // Referencia al sitio
        
        // ECONOMÍA
        this.totalInvestment = baseCost; // Cuánto vale esta torre ahora

        // Visuales
        const stats = TOWER_TYPES[typeKey];
        this.typeName = stats.name;
        
        // Base de la torre
        this.base = scene.add.rectangle(0, 0, 40, 40, stats.color);
        this.base.setStrokeStyle(2, 0x000000);
        
        // Torreta (Parte superior que podría rotar)
        this.turret = scene.add.rectangle(0, -10, 20, 20, 0xffffff);
        
        this.add([this.base, this.turret]);
        
        // Hacer interactiva la torre (el contenedor)
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        // Rango (Invisible por defecto)
        this.rangeCircle = scene.add.circle(x, y, stats.range, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false);
        this.rangeCircle.setDepth(5); // Debajo de la UI pero sobre el suelo

        // Stats Iniciales
        this.level = 1;
        this.maxLevel = 5;
        this.damage = stats.damage;
        this.range = stats.range;
        this.attackSpeed = stats.attackSpeed;
        this.lastAttackTime = 0;
        
        this.updateStats(); // Calcular costos iniciales
    }

    update(time, delta) {
        if (time > this.lastAttackTime + this.attackSpeed) {
            this.findTargetAndFire(time);
        }
    }

    findTargetAndFire(time) {
        let target = null;
        let minDist = this.range;

        this.enemies.children.iterate(enemy => {
            if (enemy.active && !enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    // Prioridad: El más cercano a la meta (mayor t) o el más cercano a la torre?
                    // Por ahora, el más cercano a la torre
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
            proj.fire(target, this.damage, this.typeKey);
        }
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        
        this.totalInvestment += this.upgradeCost; // Sumar al valor de venta
        this.level++;
        this.updateStats();
        
        // Efecto visual level up
        this.scene.tweens.add({
            targets: this, scale: 1.2, yoyo: true, duration: 100
        });
    }

    updateStats() {
        const base = TOWER_TYPES[this.typeKey];
        // Escalado simple de stats (20% por nivel)
        const multi = 1 + ((this.level - 1) * 0.2);
        
        this.damage = Math.floor(base.damage * multi);
        this.upgradeCost = Math.floor(base.baseCost * (0.5 * this.level)); // Costo sube con nivel
        
        // Ajustar rango visual
        this.rangeCircle.setRadius(this.range);
    }
    
    destroy() {
        if (this.rangeCircle) this.rangeCircle.destroy();
        super.destroy();
    }
}