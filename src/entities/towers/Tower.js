// src/entities/towers/Tower.js
import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';
import { getTowerBonuses, getTalentBonuses } from '../../config/GameState.js';
import Projectile from '../projectiles/Projectile.js';

export default class Tower extends Phaser.GameObjects.Container {
    constructor(scene, x, y, typeKey, enemiesGroup, projectilesGroup, buildSite, baseCost) {
        super(scene, x, y);
        scene.add.existing(this);

        this.typeKey = typeKey;
        this.enemies = enemiesGroup;
        this.projectiles = projectilesGroup;
        this.buildSite = buildSite; 
        this.baseCost = baseCost;
        this.totalInvestment = baseCost; 

        const data = TOWER_TYPES[typeKey];
        this.typeName = data.name;
        this.baseColor = data.color;
        
        // --- VISUALES ---
        this.base = scene.add.rectangle(0, 0, 40, 40, 0x808080);
        this.base.setStrokeStyle(2, 0x000000);
        
        this.turretGroup = scene.add.container(0, 0);
        this.turretBody = scene.add.rectangle(0, 0, 24, 24, this.baseColor);
        this.turretGroup.add(this.turretBody);

        this.add([this.base, this.turretGroup]);
        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        this.rangeCircle = scene.add.circle(0, 0, 100, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false); 
        this.add(this.rangeCircle);

        // --- ESTADO ---
        this.level = 1; 
        this.maxLevel = 3; 
        this.isEvolved = false;
        this.evolutionKey = null; 
        this.lastAttackTime = 0; 
        this.upgradeCost = 0;
        
        // Cargar stats iniciales
        this.updateStats(); 
    }

    update(time, delta) {
        if (time > this.lastAttackTime + this.attackSpeed) { 
            this.findTargetAndFire(time); 
        }
        if (this.typeKey === 'mage' || this.evolutionKey === 'ice' || this.evolutionKey === 'fire') {
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
            let projectileType = this.typeKey;
            // Gatling dispara recto
            if (this.evolutionKey === 'gatling') projectileType = 'archer'; 

            const p = new Projectile(this.scene, this.x, this.y);
            if (this.projectiles) this.projectiles.add(p);
            
            let finalDamage = this.damage;
            // Crítico Francotirador
            if (this.evolutionKey === 'sniper' && Math.random() < 0.5) {
                finalDamage *= 2; 
                if(this.scene.showFloatingText) this.scene.showFloatingText(target.x, target.y, "CRIT!", "#ff0000");
            }

            p.fire(target, {
                damage: finalDamage,
                type: projectileType,
                effect: this.currentEffect,
                aoe: this.currentAoE || 0
            });
        };

        fireProjectile();
        
        if (this.doubleAttackChance > 0 && Math.random() * 100 < this.doubleAttackChance) {
            this.scene.time.delayedCall(100, fireProjectile); 
        }
        
        this.scene.tweens.add({ targets: this.turretGroup, y: (this.evolutionKey==='gatling'?2:5), yoyo: true, duration: 50 });
    }

    upgrade() {
        if (!this.isEvolved && this.level < this.maxLevel) {
            this.level++;
            this.updateStats();
            this.showLevelUpEffect();
        }
    }

    evolve(pathKey) { 
        const typeData = TOWER_TYPES[this.typeKey];
        const evoData = typeData.evolutions[pathKey];
        
        if (evoData) {
            this.isEvolved = true;
            this.evolutionKey = evoData.key;
            this.typeName = evoData.name;
            this.totalInvestment += evoData.cost;
            
            this.turretBody.setFillStyle(evoData.color);
            this.base.setStrokeStyle(3, 0xffd700); 
            
            // Aplicar stats base de evolución
            this.damage = evoData.stats.damage;
            this.range = evoData.stats.range;
            this.attackSpeed = evoData.stats.fireRate;
            this.currentEffect = evoData.stats.effect || null;
            this.currentAoE = evoData.stats.aoe || 0;
            
            // Re-aplicar bonos (equipo y talentos)
            this.applyGlobalBonuses();

            this.showLevelUpEffect();
            this.rangeCircle.setRadius(this.range);
        }
    }

    updateStats() {
        if (this.isEvolved) return; 

        const typeData = TOWER_TYPES[this.typeKey];
        const currentStats = typeData.levels[this.level - 1];

        if (currentStats) {
            this.damage = currentStats.damage;
            this.range = currentStats.range;
            this.attackSpeed = currentStats.fireRate; 
            this.upgradeCost = currentStats.upgradeCost || 0;
            this.currentEffect = currentStats.effect || null;
            this.currentAoE = currentStats.aoe || 0;

            this.applyGlobalBonuses();

            if (this.rangeCircle) this.rangeCircle.setRadius(this.range);
        }
    }

    applyGlobalBonuses() {
        // 1. Bonos de Equipo
        const equipBonuses = getTowerBonuses(this.typeKey);
        
        // 2. Bonos de Talentos (Se calculan en GameState)
        const talentBonuses = getTalentBonuses();

        this.damage += equipBonuses.damage + (talentBonuses.towerDamage || 0);
        this.range += equipBonuses.range + (talentBonuses.towerRange || 0);
        
        // Velocidad (reduce delay)
        const speedReduction = equipBonuses.attackSpeed; 
        this.attackSpeed = Math.max(100, this.attackSpeed - speedReduction);
        
        this.doubleAttackChance = equipBonuses.doubleAttack || 0;

        // Descuento
        if (talentBonuses.towerCost > 0 && !this.isEvolved) {
            this.upgradeCost = Math.floor(this.upgradeCost * (1 - (talentBonuses.towerCost / 100)));
        }
    }

    showLevelUpEffect() {
        this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
        const ring = this.scene.add.circle(0, 0, 20, 0xffff00, 1);
        this.add(ring);
        this.scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 500, onComplete: ()=>ring.destroy() });
    }
}