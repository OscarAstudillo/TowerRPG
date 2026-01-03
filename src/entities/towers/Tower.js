import Phaser from 'phaser';
import { TOWER_TYPES } from '../../config/TowerStats.js';
import { getTowerBonuses, getTalentBonuses } from '../../config/GameState.js';
import Projectile from '../projectiles/Projectile.js';
import SoundManager from '../../systems/SoundManager.js'; 

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
        
        this.baseSprite = scene.add.sprite(0, 0, 'base_tower');
        this.baseSprite.setTint(this.baseColor); 
        this.baseSprite.setDisplaySize(40, 40);
        
        this.selectionRing = scene.add.graphics();
        this.selectionRing.lineStyle(2, 0x000000);
        this.selectionRing.strokeRect(-20, -20, 40, 40);

        this.add([this.baseSprite, this.selectionRing]);

        this.setSize(40, 40);
        this.setInteractive({ useHandCursor: true });

        this.rangeCircle = scene.add.circle(0, 0, 100, 0xffffff, 0.1);
        this.rangeCircle.setVisible(false); 
        this.add(this.rangeCircle);

        this.level = 1; 
        this.maxLevel = 3; 
        this.isEvolved = false;
        this.evolutionKey = null; 
        this.lastAttackTime = 0; 
        this.upgradeCost = 0;
        
        this.updateStats(); 
    }

    update(time, delta) {
        if (time > this.lastAttackTime + this.attackSpeed) { 
            this.findTargetAndFire(time); 
        }
        if (['mage', 'tesla', 'ice', 'fire'].includes(this.typeKey) || this.evolutionKey) {
            this.baseSprite.angle += 1; 
        }
    }

    findTargetAndFire(time) {
        let target = null; 
        let maxProgress = -1;
        let enemyInRange = false;

        this.enemies.children.iterate(enemy => {
            if (enemy.active && !enemy.isDead) {
                if ((this.typeKey === 'cannon' || this.typeKey === 'quake') && enemy.isFlying) return;

                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    enemyInRange = true;
                    if (enemy.follower.t > maxProgress) { 
                        maxProgress = enemy.follower.t; 
                        target = enemy; 
                    }
                }
            }
        });

        if (this.typeKey === 'quake' && enemyInRange) {
            this.fire(null); 
            this.lastAttackTime = time;
        } 
        else if (target) {
            if (this.typeKey !== 'mage' && this.typeKey !== 'tesla' && this.typeKey !== 'poison') { 
                const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
                this.baseSprite.rotation = angle + (Math.PI / 2);
            }
            this.fire(target);
            this.lastAttackTime = time;
        }
    }

    fire(target) {
        const fireProjectile = () => {
            let projectileType = this.typeKey;
            if (this.evolutionKey === 'gatling') projectileType = 'archer'; 

            const p = this.projectiles.get(this.x, this.y);
            
            if (p) {
                p.setActive(true);
                p.setVisible(true);

                let soundType = 'shoot_arrow';
                if (['cannon', 'quake'].includes(this.typeKey)) soundType = 'shoot_cannon';
                else if (['mage', 'tesla', 'ice', 'fire', 'poison'].includes(this.typeKey)) soundType = 'shoot_magic';
                
                SoundManager.playSound(soundType);

                let finalDamage = this.damage;
                // --- CÁLCULO DE CRÍTICO ---
                // Sniper o habilidad de torre pueden tener crítico
                let isCrit = false;
                if (this.evolutionKey === 'sniper' && Math.random() < 0.5) {
                    finalDamage *= 2; 
                    isCrit = true; // Flag para visual
                }
                // --------------------------

                p.fire(target, {
                    damage: finalDamage,
                    isCrit: isCrit, // Pasamos el flag
                    type: projectileType,
                    effect: this.currentEffect,
                    aoe: this.currentAoE || 0
                });
            }
        };

        fireProjectile();
        
        if (this.doubleAttackChance > 0 && Math.random() * 100 < this.doubleAttackChance && target) {
            this.scene.time.delayedCall(150, fireProjectile); 
        }
        
        const recoil = (this.evolutionKey==='gatling') ? 2 : 4;
        this.scene.tweens.add({ targets: this.baseSprite, y: recoil, yoyo: true, duration: 50 });
    }

    upgrade() {
        if (!this.isEvolved && this.level < this.maxLevel) {
            this.level++;
            this.updateStats();
            this.showLevelUpEffect();
            SoundManager.playSound('upgrade'); 
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
            this.baseSprite.setTint(evoData.color);
            this.selectionRing.lineStyle(3, 0xffd700); 
            this.selectionRing.strokeRect(-20, -20, 40, 40);
            
            this.damage = evoData.stats.damage;
            this.range = evoData.stats.range;
            this.attackSpeed = evoData.stats.fireRate;
            this.currentEffect = evoData.stats.effect || null;
            this.currentAoE = evoData.stats.aoe || 0;
            
            this.applyGlobalBonuses();
            this.showLevelUpEffect();
            this.rangeCircle.setRadius(this.range);
            SoundManager.playSound('upgrade'); 
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
        const equipBonuses = getTowerBonuses(this.typeKey);
        const talentBonuses = getTalentBonuses();
        this.damage += equipBonuses.damage + (talentBonuses.towerDamage || 0);
        this.range += equipBonuses.range + (talentBonuses.towerRange || 0);
        const speedReduction = equipBonuses.attackSpeed; 
        this.attackSpeed = Math.max(100, this.attackSpeed - speedReduction);
        this.doubleAttackChance = equipBonuses.doubleAttack || 0;
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