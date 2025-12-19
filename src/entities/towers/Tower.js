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
        this.baseColor = stats.color;
        
        // Base (Suelo)
        this.base = scene.add.rectangle(0, 0, 40, 40, 0x808080);
        this.base.setStrokeStyle(2, 0x000000);
        
        // Torreta (Parte móvil/visual)
        this.turretGroup = scene.add.container(0, 0);
        
        this.add([this.base, this.turretGroup]);
        
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
        
        // Animación suave de la torreta (Idle)
        if (this.typeKey === 'mage') {
            this.turretGroup.angle += 1; // El mago rota siempre
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
            // Apuntar
            if (this.typeKey !== 'mage') { // El mago gira solo, los otros apuntan
                const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
                this.turretGroup.rotation = angle + (Math.PI / 2);
            }
            
            this.fire(target);
            this.lastAttackTime = time;
        }
    }

    fire(target) {
        const proj = this.projectiles.get(this.x, this.y - 10);
        if (proj) {
            proj.fire(target, {
                damage: this.damage,
                type: this.typeKey,
                aoeRadius: this.aoeRadius || 0,
                slowFactor: this.slowFactor || 1
            });
            
            // Retroceso visual al disparar
            this.scene.tweens.add({
                targets: this.turretGroup,
                y: 5,
                yoyo: true,
                duration: 50
            });
        }
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        
        this.totalInvestment += this.upgradeCost;
        this.level++;
        this.updateStats(); 
        
        // Efecto Level Up
        this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
        
        // Partículas doradas (simple circle flash)
        const flash = this.scene.add.circle(this.x, this.y, 10, 0xffff00, 0.8);
        this.scene.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
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
            this.aoeRadius = currentStats.aoe || 0;
            this.slowFactor = currentStats.slow || 1;
            
            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
            
            // --- ACTUALIZAR APARIENCIA ---
            this.updateAppearance();
        }
    }

    updateAppearance() {
        // Limpiar gráficos anteriores
        this.turretGroup.removeAll(true);
        const color = this.baseColor;
        
        if (this.typeKey === 'archer') {
            // ARQUERO: Torreta cuadrada que gana detalles
            const body = this.scene.add.rectangle(0, 0, 24, 24, color);
            this.turretGroup.add(body);
            
            // Nivel 3+: Ballesta (Triángulo)
            if (this.level >= 3) {
                const bow = this.scene.add.triangle(0, -10, 0, 0, -10, 10, 10, 10, 0xffffff);
                this.turretGroup.add(bow);
            }
            // Nivel 5: Bordes dorados
            if (this.level >= 5) {
                body.setStrokeStyle(4, 0xffd700);
            }

        } else if (this.typeKey === 'cannon') {
            // CAÑÓN: Barril negro/rojo
            const barrelWidth = this.level >= 3 ? 16 : 10;
            const barrelLen = this.level >= 3 ? 30 : 20;
            
            const barrel = this.scene.add.rectangle(0, -barrelLen/2, barrelWidth, barrelLen, 0x333333);
            const body = this.scene.add.circle(0, 0, 15, color);
            
            this.turretGroup.add([barrel, body]);

            // Nivel 5: Doble Cañón (Visual)
            if (this.level >= 5) {
                const barrel2 = this.scene.add.rectangle(8, -15, 8, 30, 0x333333);
                const barrel3 = this.scene.add.rectangle(-8, -15, 8, 30, 0x333333);
                this.turretGroup.add([barrel2, barrel3]);
            }

        } else if (this.typeKey === 'mage') {
            // MAGO: Cristal flotante
            const size = 10 + (this.level * 2);
            // Rombo
            const crystal = this.scene.add.rectangle(0, 0, size, size, color);
            crystal.rotation = Math.PI / 4; 
            
            this.turretGroup.add(crystal);
            
            if (this.level >= 3) {
                const inner = this.scene.add.rectangle(0, 0, size/2, size/2, 0xffffff);
                inner.rotation = Math.PI / 4;
                this.turretGroup.add(inner);
            }
            if (this.level >= 5) {
                // Aura giratoria extra
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