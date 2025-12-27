// src/entities/enemies/Enemy.js
import Phaser from 'phaser';
import { ENEMY_DB } from '../../config/Enemies.js';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, path, levelDifficulty, typeKey = 'slime') {
        if (!path || path.length === 0) { super(scene, 0, 0); return; }

        super(scene, path[0].x, path[0].y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.typeKey = typeKey;
        this.levelDifficulty = levelDifficulty;

        const data = ENEMY_DB[typeKey] || ENEMY_DB['slime'];
        
        this.name = data.name;
        this.hp = Math.floor(data.hp * levelDifficulty);
        this.maxHp = this.hp;
        this.baseSpeed = (data.speed || 1.0) / 10000; 
        
        this.armor = data.armor || 0;
        this.isFlying = data.flying || false; 
        this.isHealer = data.healer || false;
        
        this.drops = data.drops || [];
        this.coinReward = Math.floor(15 * levelDifficulty);
        this.xpReward = Math.floor(10 * levelDifficulty);
        this.leakDamage = (data.hp > 2000) ? 5 : 1; 

        // Visual
        let color = 0xff0000;
        if (scene.biome === 'forest') color = 0x008000;   
        if (scene.biome === 'mountain') color = 0x8b4513; 
        if (scene.biome === 'volcano') color = 0xff4500;  

        if (this.isFlying) color = 0x00ffff; 
        if (this.isHealer) color = 0xff69b4; 
        if (typeKey.includes('boss')) color = 0x4b0082; 

        const size = (this.maxHp > 2000) ? 40 : 20;

        this.bodyShape = scene.add.rectangle(0, 0, size, size, color);
        if (this.isFlying) this.bodyShape.setStrokeStyle(2, 0xffffff); 
        else if (typeKey.includes('boss')) this.bodyShape.setStrokeStyle(3, 0xffd700); 
        else this.bodyShape.setStrokeStyle(1, 0x000000); 
        
        this.add(this.bodyShape);

        this.hpBarBg = scene.add.rectangle(0, -size/2 - 8, size + 10, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -size/2 - 8, size + 8, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);
        
        this.setSize(size, size);

        this.lastAttackTime = 0;
        this.skillTimer = 0; 
        this.isShielded = false;

        this.statusEffects = {
            slow: { active: false, factor: 0, timer: 0 },
            burn: { active: false, damage: 0, timer: 0, tickTimer: 0 },
            freeze: { active: false, factor: 0, timer: 0 },
            stun: { active: false, timer: 0 }
        };
    }

    update(time, delta) {
        if (!this.scene) return;

        this.updateDebuffs(delta);
        
        if (!this.isShielded && !this.statusEffects.stun.active) {
            let speedMod = 1.0;
            if (this.statusEffects.slow.active) speedMod *= (1 - this.statusEffects.slow.factor);
            if (this.statusEffects.freeze.active) speedMod *= (1 - this.statusEffects.freeze.factor);
            if (speedMod < 0.1) speedMod = 0.1;
            
            this.follower.t += (this.baseSpeed * speedMod) * delta;
        }
        
        if (this.follower.t >= 1) {
            this.die(false);
            return;
        }

        const pathLen = this.path.length;
        const idx = this.follower.t * (pathLen - 1);
        const p1Idx = Math.floor(idx);
        const p2Idx = Math.min(p1Idx + 1, pathLen - 1);
        const p1 = this.path[p1Idx];
        const p2 = this.path[p2Idx];

        if (p1 && p2) {
            const segT = idx - p1Idx;
            this.x = Phaser.Math.Linear(p1.x, p2.x, segT);
            this.y = Phaser.Math.Linear(p1.y, p2.y, segT);
        }

        const hpPct = Math.max(0, this.hp / this.maxHp);
        this.hpBar.width = (this.width + 8) * hpPct; 
        this.hpBar.setFillStyle(hpPct < 0.3 ? 0xff0000 : 0x00ff00);

        if (this.typeKey.includes('boss')) {
            this.skillTimer += delta;
            if (this.skillTimer > 5000) { this.useBossSkill(); this.skillTimer = 0; }
        }
        if (this.isHealer) {
            this.skillTimer += delta;
            if (this.skillTimer > 3000) { this.performHeal(); this.skillTimer = 0; }
        }
        
        this.checkAttackPlayer(time);
    }

    applyStatus(effect) {
        if (!effect || !this.active || this.isShielded) return;

        if (effect.type === 'burn') {
            this.statusEffects.burn.active = true;
            this.statusEffects.burn.damage = Math.max(this.statusEffects.burn.damage, effect.val);
            this.statusEffects.burn.timer = effect.duration;
            this.bodyShape.setFillStyle(0xff4500); 
        } 
        else if (effect.type === 'freeze' || effect.type === 'slow') {
            this.statusEffects.freeze.active = true;
            this.statusEffects.freeze.factor = effect.val;
            this.statusEffects.freeze.timer = effect.duration;
            this.bodyShape.setFillStyle(0x00ffff); 
        } 
        else if (effect.type === 'stun' && !this.typeKey.includes('boss')) {
            this.statusEffects.stun.active = true;
            this.statusEffects.stun.timer = effect.duration;
            this.bodyShape.setFillStyle(0xffff00); 
        }
    }

    updateDebuffs(delta) {
        if (this.statusEffects.burn.active) {
            this.statusEffects.burn.timer -= delta;
            this.statusEffects.burn.tickTimer += delta;
            if (this.statusEffects.burn.tickTimer >= 500) { 
                this.takeTrueDamage(this.statusEffects.burn.damage, '#ff4500');
                this.statusEffects.burn.tickTimer = 0;
            }
            if (this.statusEffects.burn.timer <= 0) {
                this.statusEffects.burn.active = false;
                this.clearTint();
            }
        }
        if (this.statusEffects.freeze.active) {
            this.statusEffects.freeze.timer -= delta;
            if (this.statusEffects.freeze.timer <= 0) {
                this.statusEffects.freeze.active = false;
                this.clearTint();
            }
        }
        if (this.statusEffects.stun.active) {
            this.statusEffects.stun.timer -= delta;
            if (this.statusEffects.stun.timer <= 0) {
                this.statusEffects.stun.active = false;
                this.clearTint();
            }
        }
    }

    clearTint() {
        if (this.active && this.bodyShape) {
            let color = 0xff0000;
            if (this.scene.biome === 'forest') color = 0x008000;
            if (this.scene.biome === 'mountain') color = 0x8b4513;
            if (this.scene.biome === 'volcano') color = 0xff4500;
            if (this.isFlying) color = 0x00ffff;
            if (this.isHealer) color = 0xff69b4;
            if (this.typeKey.includes('boss')) color = 0x4b0082;
            
            this.bodyShape.setFillStyle(color);
        }
    }

    takeTrueDamage(amount, color) {
        if (!this.active) return;
        this.hp -= amount;
        if (this.scene && this.scene.showFloatingText) 
            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(amount)}`, color);
        if (this.hp <= 0) this.die(true);
    }

    takeDamage(amount) {
        if (this.isShielded) {
            if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa");
            return;
        }
        let dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        if (this.scene && this.scene.showFloatingText) {
            const isCrit = Math.random() > 0.8; 
            this.scene.showFloatingText(this.x, this.y - 30, `-${Math.floor(dmg)}`, isCrit ? '#ffaa00' : '#ffffff', 800);
        }
        if (this.hp <= 0) {
            this.die(true);
        } else {
            this.scene.tweens.add({ targets: this, alpha: 0.5, yoyo: true, duration: 50 });
        }
    }

    useBossSkill() {
        if (this.typeKey.includes('boss')) {
             // Lógica genérica o específica si añades más bosses
             this.scene.showFloatingText(this.x, this.y - 50, "¡ATAQUE ESPECIAL!", "#ff0000");
        }
    }

    performHeal() {
        if (!this.scene || !this.scene.enemies) return;
        const healRange = 150;
        let healed = false;
        this.scene.enemies.children.iterate(e => {
            if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < healRange) {
                if (e.hp < e.maxHp) {
                    e.hp = Math.min(e.maxHp, e.hp + 50);
                    healed = true;
                }
            }
        });
        if (healed && this.scene.showFloatingText) 
            this.scene.showFloatingText(this.x, this.y, "CURAR", "#ff69b4");
    }

    checkAttackPlayer(time) {
        if (!this.scene || !this.scene.player) return;
        const player = this.scene.player;
        if (!player.active || player.isDead) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist < 50) {
            if (time > this.lastAttackTime + 1000) {
                player.takeDamage(this.leakDamage * 2); 
                this.lastAttackTime = time;
                this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
            }
        }
    }

    die(killedByPlayer) {
        if (!this.scene) return;
        const scene = this.scene;
        
        if (killedByPlayer) {
            if (scene.onEnemyKilled) scene.onEnemyKilled(this);
            
            if (this.drops && this.drops.length > 0) {
                this.drops.forEach(dropDef => {
                    const [matKey, chance, min, max] = dropDef;
                    // Probabilidad individual del enemigo (0.2 en la mayoría)
                    if (Math.random() < chance) {
                        const qty = Phaser.Math.Between(min, max);
                        scene.generateLoot(this.x, this.y, matKey, qty);
                    }
                });
            }
        } else {
            if (scene.onEnemyLeaks) scene.onEnemyLeaks(this.leakDamage);
        }
        
        this.destroy();
        
        if (scene.checkWaveStatus) {
            scene.time.delayedCall(50, () => {
                if (scene && scene.checkWaveStatus) scene.checkWaveStatus();
            });
        }
    }
}