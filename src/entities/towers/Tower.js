// src/entities/towers/Tower.js
import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';

export default class Tower extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, typeKey, enemiesGroup, projectilesGroup) {
        const typeData = TOWER_TYPES[typeKey];
        // Empezamos en Nivel 1 (índice 0)
        const stats = typeData.levels[0]; 

        super(scene, x, y, 32, 32, typeData.color);
        scene.add.existing(this);
        
        // Hacemos la torre interactiva para abrir menú de mejora
        this.setInteractive({ useHandCursor: true });

        this.typeKey = typeKey;
        this.typeName = typeData.name;
        this.enemiesGroup = enemiesGroup;
        this.projectilesGroup = projectilesGroup;
        
        this.level = 1;
        this.maxLevel = 5;
        this.attackCount = 0; // Para contar disparos del mago
        
        this.applyStats(stats);
        
        // Círculo de rango visual (invisible por defecto)
        this.rangeCircle = scene.add.circle(x, y, this.range, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false);

        this.lastFired = 0;
    }

    applyStats(stats) {
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.upgradeCost = stats.upgradeCost;
        // Propiedades especiales
        this.aoeRadius = stats.aoe || 0;
        this.hasChain = stats.chain || false;
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;

        // Subir nivel
        this.level++;
        const typeData = TOWER_TYPES[this.typeKey];
        const newStats = typeData.levels[this.level - 1];
        
        this.applyStats(newStats);

        // Feedback visual (Crece y brilla)
        this.scene.tweens.add({
            targets: this,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
        
        // Actualizar círculo de rango
        this.rangeCircle.setRadius(this.range);

        console.log(`Torre mejorada a Nivel ${this.level}`);
    }

    update(time, delta) {
        if (time > this.lastFired + this.fireRate) {
            this.findTargetAndFire(time);
        }
    }

    findTargetAndFire(time) {
        let closestEnemy = null;
        let closestDistance = Infinity;

        this.enemiesGroup.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range && dist < closestDistance) {
                    closestDistance = dist;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            this.fire(closestEnemy);
            this.lastFired = time;
        }
    }

    fire(target) {
        this.attackCount++;
        const stats = TOWER_TYPES[this.typeKey];

        // --- LÓGICA ESPECIAL DEL MAGO (Rayo en Cadena) ---
        // Dispara el rayo cada 2 ataques si tiene la habilidad desbloqueada
        if (this.typeKey === 'mage' && this.hasChain && this.attackCount % 2 === 0) {
            this.fireChainLightning(target);
        } else {
            // Disparo normal
            const projectile = this.projectilesGroup.get(this.x, this.y);
            if (projectile) {
                // Pasamos el aoeRadius al proyectil (para el cañón)
                projectile.fire(target, this.damage, stats.projectileColor, this.aoeRadius);
            }
        }
    }

    fireChainLightning(firstTarget) {
        // Daña al primer objetivo
        firstTarget.takeDamage(this.damage);
        this.drawLightning(this.x, this.y, firstTarget.x, firstTarget.y);

        // Buscar 2 objetivos más cercanos al primero
        let bounces = 0;
        let currentSource = firstTarget;
        const chainDamage = Math.floor(this.damage / 4); // 1/4 del daño
        const bounceRange = 150; // Rango de salto del rayo

        // Array temporal para no golpear al mismo dos veces
        const hitList = [firstTarget];

        this.enemiesGroup.children.iterate((enemy) => {
            if (bounces >= 2) return; // Máximo 2 rebotes extra (total 3 hits)
            if (!enemy.active || hitList.includes(enemy)) return;

            const dist = Phaser.Math.Distance.Between(currentSource.x, currentSource.y, enemy.x, enemy.y);
            
            if (dist <= bounceRange) {
                enemy.takeDamage(chainDamage);
                this.drawLightning(currentSource.x, currentSource.y, enemy.x, enemy.y);
                
                hitList.push(enemy);
                currentSource = enemy;
                bounces++;
            }
        });
    }

    drawLightning(x1, y1, x2, y2) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();

        // Desaparece rápido
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 200,
            onComplete: () => graphics.destroy()
        });
    }
}