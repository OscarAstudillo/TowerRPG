// src/entities/towers/Tower.js
import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';
import { getTowerBonuses } from '../../config/GameState.js';
import Projectile from '../projectiles/Projectile.js';

export default class Tower extends Phaser.GameObjects.Container {
    constructor(scene, x, y, typeKey, enemiesGroup, projectilesGroup, buildSite, baseCost) {
        super(scene, x, y);
        scene.add.existing(this);

        this.typeKey = typeKey;
        this.type = typeKey; 
        this.enemies = enemiesGroup;
        this.projectiles = projectilesGroup;
        this.buildSite = buildSite; 
        this.baseCost = baseCost;
        this.totalInvestment = baseCost; 

        // Recuperar stats
        const stats = TOWER_TYPES[typeKey] || TOWER_TYPES['archer']; 
        this.stats = JSON.parse(JSON.stringify(stats)); 
        this.typeName = stats.name;
        this.baseColor = stats.color;
        
        // --- VISUALES (Interactivos para clic) ---
        this.base = scene.add.rectangle(0, 0, 40, 40, 0x808080).setInteractive();
        this.base.setStrokeStyle(2, 0x000000);
        
        this.turretGroup = scene.add.container(0, 0);
        const turretBody = scene.add.rectangle(0, 0, 24, 24, this.baseColor).setInteractive();
        this.turretGroup.add(turretBody);

        this.add([this.base, this.turretGroup]);
        
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        // Rango
        this.rangeCircle = scene.add.circle(0, 0, this.stats.range, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false); 
        this.add(this.rangeCircle);

        // Estado
        this.level = 1; 
        this.maxLevel = 5; 
        this.lastAttackTime = 0; 
        this.evolution = null;
        this.upgradeCost = 0; // Variable simple para evitar errores

        this.updateStats(); 
    }

    update(time, delta) {
        // Disparar si el cooldown lo permite
        if (time > this.lastAttackTime + this.attackSpeed) { 
            this.findTargetAndFire(time); 
        }
        if (this.typeKey === 'mage') { this.turretGroup.angle += 1; }
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
            let effect = null;
            if (this.typeKey === 'mage' || this.evolution === 'ice') effect = { type: 'freeze', val: 0.3, duration: 1500 };
            if (this.evolution === 'pyro') effect = { type: 'burn', val: 5, duration: 3000 };
            if (this.evolution === 'sniper') effect = { type: 'crit' };

            // Crear proyectil
            new Projectile(this.scene, this.x, this.y, target, this.damage, this.projectiles, effect);
        };

        fireProjectile();
        
        // Doble ataque
        if (this.doubleAttackChance > 0 && Math.random() * 100 < this.doubleAttackChance) {
            this.scene.time.delayedCall(150, fireProjectile); 
        }
        
        // Animación disparo
        this.scene.tweens.add({ targets: this.turretGroup, y: 5, yoyo: true, duration: 50 });
    }

    upgrade() {
        if (this.level >= this.maxLevel) return;
        this.level++;
        this.totalInvestment += this.upgradeCost; 
        this.updateStats(); 
        
        this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
        const ring = this.scene.add.circle(0, 0, 20, 0xffff00, 1);
        this.add(ring);
        this.scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 500, onComplete: ()=>ring.destroy() });
    }

    evolve(path) {
        this.evolution = path;
        this.level++; 
        this.updateStats();
        this.scene.tweens.add({ targets: this, scale: 1.3, yoyo: true, duration: 200 });
        
        if(path === 'sniper' || path === 'heavy') this.turretGroup.list[0].setFillStyle(0x000000); 
        if(path === 'ranger' || path === 'rapid') this.turretGroup.list[0].setFillStyle(0xffffff); 
        if(path === 'pyro') this.turretGroup.list[0].setFillStyle(0xff8800);
        if(path === 'ice') this.turretGroup.list[0].setFillStyle(0x00ffff);
    }

    updateStats() {
        const typeData = TOWER_TYPES[this.typeKey];
        const levelIndex = Math.min(this.level, typeData.levels.length) - 1; 
        const currentStats = typeData.levels[levelIndex];

        if (currentStats) {
            this.damage = currentStats.damage;
            this.range = currentStats.range;
            this.attackSpeed = currentStats.fireRate; 
            
            // CORRECCIÓN: Asignación directa
            this.upgradeCost = currentStats.upgradeCost || Math.floor(this.baseCost * Math.pow(1.5, this.level));

            const bonuses = getTowerBonuses(this.typeKey);
            this.damage += bonuses.damage;
            this.range += bonuses.range;
            this.attackSpeed = Math.max(100, this.attackSpeed - bonuses.attackSpeed);
            this.doubleAttackChance = bonuses.doubleAttack || 0;

            if (this.evolution === 'sniper') { this.damage *= 3; this.range += 150; this.attackSpeed *= 1.5; }
            if (this.evolution === 'ranger') { this.damage *= 0.8; this.attackSpeed *= 0.5; }
            if (this.evolution === 'heavy') { this.damage *= 2; this.range += 50; }
            if (this.evolution === 'rapid') { this.attackSpeed *= 0.5; }
            if (this.evolution === 'pyro') { this.damage *= 1.2; }

            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
        }
    }
}