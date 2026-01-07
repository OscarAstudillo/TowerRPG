import Phaser from 'phaser';
import { ENEMY_DB } from '../../config/Enemies.js';
import { GAME_CONSTANTS, BOSS_SKILLS } from '../../config/GameConstants.js'; 
import { ENEMY_SKILLS } from '../../config/EnemySkills.js'; 

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, path, levelDifficulty, typeKey = 'slime') {
        if (!path || path.length === 0) { super(scene, 0, 0); return; }

        super(scene, path[0].x, path[0].y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.typeKey = typeKey;
        this.levelDifficulty = levelDifficulty || 1; 

        // Cargar datos base
        const data = ENEMY_DB[typeKey] || ENEMY_DB['slime'];
        this.name = data.name;

        // --- ESCALADO DE STATS ---
        const scaleFactor = Math.pow(GAME_CONSTANTS.DIFFICULTY.LEVEL_SCALING_FACTOR || 1.15, this.levelDifficulty - 1);

        this.maxHp = Math.floor(data.hp * scaleFactor);
        this.hp = this.maxHp;
        this.damage = Math.floor((data.damage || 5) * scaleFactor);
        const armorFactor = Math.sqrt(scaleFactor);
        this.baseArmor = Math.floor((data.armor || 0) * armorFactor);
        this.armor = this.baseArmor;
        this.baseSpeed = (data.speed || 1.0) / 10000; 
        
        const baseCoin = GAME_CONSTANTS.REWARDS ? GAME_CONSTANTS.REWARDS.COIN_BASE : 15;
        const baseXP = GAME_CONSTANTS.REWARDS ? GAME_CONSTANTS.REWARDS.XP_BASE : 10;
        this.coinReward = Math.floor(baseCoin * scaleFactor);
        this.xpReward = Math.floor(baseXP * scaleFactor);

        this.isFlying = data.flying || false; 
        this.isHealer = data.healer || false;
        this.drops = data.drops || [];
        this.leakDamage = (this.maxHp > 2000) ? 5 : 1; 
        
        this.isBoss = (typeKey.includes('boss') || typeKey.includes('mini'));
        this.skillTimer = 0;
        this.isCasting = false; 

        this.skills = data.skills || []; 
        this.skillCooldowns = {}; 

        // Colores Base
        let color = 0xff0000;
        if (scene.biome === 'forest') color = 0x008000;   
        if (scene.biome === 'mountain') color = 0x8b4513; 
        if (scene.biome === 'volcano') color = 0xff4500;  

        if (this.isFlying) color = 0x00ffff; 
        if (this.isHealer) color = 0xff69b4; 
        if (this.isBoss) color = 0x4b0082; 

        this.originalColor = color; 
        const size = (this.maxHp > 2000 || this.isBoss) ? 45 : 20; 
        this.baseScale = 1.0; 

        const textureKey = `enemy_${typeKey}`;
        if (scene.textures.exists(textureKey)) {
            this.sprite = scene.add.sprite(0, 0, textureKey);
        } else {
            this.sprite = scene.add.sprite(0, 0, 'base_enemy');
        }
        this.sprite.setTint(color); 
        this.sprite.setDisplaySize(size, size);
        this.add(this.sprite);

        this.hpBarBg = scene.add.rectangle(0, -size/2 - 8, size + 10, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -size/2 - 8, size + 8, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);
        
        this.setSize(size, size);

        this.lastAttackTime = 0;
        this.isShielded = false;

        this.statusEffects = {
            slow: { active: false, factor: 0, timer: 0 },
            burn: { active: false, damage: 0, timer: 0, tickTimer: 0 },
            poison: { active: false, damage: 0, timer: 0, tickTimer: 0 }, 
            freeze: { active: false, factor: 0, timer: 0 },
            stun: { active: false, timer: 0 },
            armorBreak: { active: false, val: 0, timer: 0 }
        };
    }

    update(time, delta) {
        if (!this.scene || !this.active) return;
        this.updateDebuffs(delta);
        if (!this.active) return;

        if (this.isBoss) {
            const skillConfig = BOSS_SKILLS[this.typeKey] || BOSS_SKILLS['AOE_SMASH'];
            if (!this.isCasting) {
                this.skillTimer += delta;
                if (this.skillTimer > skillConfig.COOLDOWN) {
                    this.useBossSkill(skillConfig);
                    this.skillTimer = 0;
                }
            } else {
                if (skillConfig.TYPE !== 'projectile_barrage') return; 
            }
        } 
        else if (this.skills.length > 0 && !this.isCasting && !this.statusEffects.stun.active) {
            this.updateCommonSkills(delta);
        }

        if (!this.isCasting && !this.isShielded && !this.statusEffects.stun.active) {
            let speedMod = 1.0;
            if (this.statusEffects.slow.active) speedMod *= (1 - this.statusEffects.slow.factor);
            if (this.statusEffects.freeze.active) speedMod *= (1 - this.statusEffects.freeze.factor);
            if (speedMod < 0.1) speedMod = 0.1;
            
            this.follower.t += (this.baseSpeed * speedMod) * delta;
        }
        
        if (this.follower.t >= 1) {
            this.reachBase(); 
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

        if (this.isHealer && !this.isBoss) {
             this.skillTimer += delta;
             if (this.skillTimer > 3000) { this.performHeal(); this.skillTimer = 0; }
        }
        
        this.checkAttackPlayer(time);
    }

    takeTrueDamage(amount, color) { 
        if (!this.active) return; 
        this.hp -= amount; 
        this.flashWhite();
        if (this.scene && this.scene.showFloatingText) {
            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(amount)}`, color); 
        }
        if (this.hp <= 0) this.die(true); 
    }

    // --- NUEVO: TAKE DAMAGE CON SINERGIAS ---
    takeDamage(amount, type = 'physical') { 
        if (this.isShielded) { 
            if (this.scene && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa"); 
            return; 
        } 
        
        // 1. SINERGIA: QUEBRAR (Congelado + Físico)
        if (this.statusEffects.freeze.active && type === 'physical') {
            amount *= 1.5; // +50% Daño
            this.statusEffects.freeze.active = false; // Romper hielo
            this.clearTint();
            if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "¡QUEBRAR!", "#00ffff");
            if (this.scene.createExplosion) this.scene.createExplosion(this.x, this.y, 0x00ffff);
        }

        // 2. SINERGIA: ELECTRO-CARGA (Veneno + Mágico/Rayo)
        if (this.statusEffects.poison.active && type === 'magic') {
            // Detonar todo el daño de veneno restante
            // Estimamos daño restante: daño por tick * (tiempo restante / 1000)
            // Simplificado: daño actual * 3
            const poisonBurst = this.statusEffects.poison.damage * 3;
            amount += poisonBurst;
            
            this.statusEffects.poison.active = false; // Consumir veneno
            this.clearTint();
            if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "¡SOBRECARGA!", "#7cfc00");
            if (this.scene.createExplosion) this.scene.createExplosion(this.x, this.y, 0x7cfc00);
        }

        const reductionMult = 100 / (100 + this.armor); 
        let dmg = Math.floor(amount * reductionMult); 
        if (dmg < 1) dmg = 1; 
        
        this.hp -= dmg; 
        
        this.flashWhite();
        
        if (this.sprite) {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 1.3, 
                scaleY: 0.7,
                duration: 50,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        }

        if (this.scene.createHitEffect) {
            this.scene.createHitEffect(this.x, this.y, this.originalColor); 
        }

        if (this.scene && this.scene.showFloatingText) { 
            const isCrit = Math.random() > 0.8; 
            this.scene.showFloatingText(this.x, this.y - 30, `-${dmg}`, isCrit ? 'crit' : 'damage'); 
        } 
        
        if (this.hp <= 0) { 
            this.die(true); 
        } 
    }

    flashWhite() {
        if (!this.sprite) return;
        this.sprite.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.active && this.sprite) {
                if (this.statusEffects.freeze.active) this.sprite.setTint(0x00ffff);
                else if (this.statusEffects.burn.active) this.sprite.setTint(0xff4500);
                else if (this.statusEffects.poison.active) this.sprite.setTint(0x00ff00);
                else this.sprite.setTint(this.originalColor);
            }
        });
    }

    updateCommonSkills(delta) {
        if (!this.scene.player || this.scene.player.isDead) return;
        const player = this.scene.player;
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        for (let skillKey of this.skills) {
            const skillDef = ENEMY_SKILLS[skillKey];
            if (!skillDef) continue;

            if (!this.skillCooldowns[skillKey]) this.skillCooldowns[skillKey] = 0;
            this.skillCooldowns[skillKey] -= delta;

            if (this.skillCooldowns[skillKey] <= 0) {
                if (distToPlayer <= skillDef.range) {
                    this.executeCommonSkill(skillKey, skillDef);
                    this.skillCooldowns[skillKey] = skillDef.cooldown;
                    return; 
                }
            }
        }
    }

    executeCommonSkill(key, def) {
        if (def.type === 'projectile') {
            this.isCasting = true;
            const targetX = this.scene.player.x;
            const targetY = this.scene.player.y;

            this.scene.tweens.add({
                targets: this, scale: 1.2, duration: 200, yoyo: true,
                onComplete: () => {
                    this.isCasting = false;
                    if (!this.scene || !this.active) return; 

                    const proj = this.scene.projectiles.get(this.x, this.y);
                    if (proj) {
                        const dmg = Math.floor(this.damage * (def.damageMult || 1));
                        const fixedTarget = { x: targetX, y: targetY, active: true }; 

                        proj.fire(fixedTarget, {
                            damage: dmg,
                            speed: def.speed,
                            color: def.color,
                            type: 'enemy_arrow',
                            effect: def.effect,
                            isSkillshot: true 
                        }, true); 

                        if(this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y - 40, "¡DISPARO!", "#aaaaaa");
                    }
                }
            });
        } else if (def.type === 'dash') {
            this.isCasting = true;
            this.scene.showFloatingText(this.x, this.y - 40, "¡CARGA!", "#ff0000");
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
            
            this.scene.tweens.add({
                targets: this,
                x: this.x + Math.cos(angle) * 150,
                y: this.y + Math.sin(angle) * 150,
                duration: 400,
                ease: 'Cubic.out',
                onComplete: () => {
                    this.isCasting = false;
                    if (Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) < 50) {
                        const dmg = Math.floor(this.damage * (def.damageMult || 1.2));
                        this.scene.player.takeDamage(dmg);
                    }
                }
            });
        } else if (def.type === 'melee_buff') {
            this.scene.showFloatingText(this.x, this.y - 40, "¡GOLPE!", "#ff0000");
            const originalDmg = this.damage;
            this.damage = Math.floor(this.damage * def.damageMult);
            this.scene.time.delayedCall(2000, () => { this.damage = originalDmg; });
        }
    }

    useBossSkill(config) {
        if (!this.scene || !this.scene.player) return;
        const player = this.scene.player;
        
        if (this.scene.showFloatingText) {
            this.scene.showFloatingText(this.x, this.y - 60, config.NAME || "¡ATAQUE!", "#ff0000");
        }

        if (config.TYPE === 'shield_explode') {
            this.isCasting = true;
            this.isShielded = true; 
            this.sprite.setTint(0x888888); 
            
            this.scene.time.delayedCall(config.WARN_TIME, () => {
                this.isShielded = false;
                this.clearTint();
                this.createExplosion(this.x, this.y, config.RADIUS, config.DAMAGE, config.COLOR);
                this.isCasting = false;
            });
        } else if (config.TYPE === 'aoe_target' || config.TYPE === 'singularity') {
            this.isCasting = true;
            const targetX = player.x;
            const targetY = player.y;
            
            const indicator = this.scene.add.circle(targetX, targetY, 10, config.COLOR || 0xff0000, 0.4);
            
            if (config.TYPE === 'singularity') {
                this.scene.tweens.add({
                    targets: player,
                    x: targetX, y: targetY,
                    duration: config.WARN_TIME,
                    ease: 'Quad.easeIn'
                });
            }

            this.scene.tweens.add({
                targets: indicator,
                scale: config.RADIUS / 10,
                alpha: 0.8,
                duration: config.WARN_TIME,
                onComplete: () => {
                    indicator.destroy();
                    this.createExplosion(targetX, targetY, config.RADIUS, config.DAMAGE, config.COLOR);
                    this.isCasting = false;
                }
            });
        } else if (config.TYPE === 'projectile_barrage') {
            const shots = config.COUNT || 3;
            const shootEvent = this.scene.time.addEvent({
                delay: 300,
                repeat: shots - 1,
                callback: () => {
                    if (!this.active) return;
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    const proj = this.scene.add.circle(this.x, this.y, 8, config.COLOR, 1);
                    this.scene.physics.add.existing(proj);
                    proj.body.setVelocity(Math.cos(angle)*300, Math.sin(angle)*300);
                    this.scene.time.delayedCall(2000, () => proj.destroy());
                    this.scene.physics.add.overlap(proj, player, () => {
                        player.takeDamage(config.DAMAGE);
                        proj.destroy();
                    });
                }
            });
        }
    }

    createExplosion(x, y, radius, damage, color) {
        if (!this.scene) return;
        const boom = this.scene.add.circle(x, y, radius, color || 0xff0000, 0.7);
        this.scene.tweens.add({
            targets: boom, alpha: 0, scale: 1.1, duration: 200,
            onComplete: () => boom.destroy()
        });
        const player = this.scene.player;
        if (player && !player.isDead) {
            const dist = Phaser.Math.Distance.Between(x, y, player.x, player.y);
            if (dist <= radius) {
                player.takeDamage(damage);
                this.scene.cameras.main.shake(200, 0.01);
            }
        }
    }

    applyStatus(effect) {
        if (!effect || !this.active || this.isShielded) return;
        if (effect.type === 'burn') {
            this.statusEffects.burn.active = true;
            this.statusEffects.burn.damage = Math.max(this.statusEffects.burn.damage, effect.val);
            this.statusEffects.burn.timer = effect.duration;
            this.sprite.setTint(0xff4500); 
        } else if (effect.type === 'poison') { 
            this.statusEffects.poison.active = true;
            this.statusEffects.poison.damage = Math.max(this.statusEffects.poison.damage, effect.val);
            this.statusEffects.poison.timer = effect.duration;
            this.sprite.setTint(0x00ff00); 
        } else if (effect.type === 'armor_break') {
            this.statusEffects.armorBreak.active = true;
            this.statusEffects.armorBreak.val = effect.val;
            this.statusEffects.armorBreak.timer = effect.duration;
            this.armor = Math.max(0, this.baseArmor - effect.val);
            if(this.scene && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y - 40, "¡ROTO!", "#aaaaaa");
        } else if (effect.type === 'freeze' || effect.type === 'slow') {
            this.statusEffects.freeze.active = true;
            this.statusEffects.freeze.factor = effect.val;
            this.statusEffects.freeze.timer = effect.duration;
            this.sprite.setTint(0x00ffff); 
        } else if (effect.type === 'stun' && !this.typeKey.includes('boss')) {
            this.statusEffects.stun.active = true;
            this.statusEffects.stun.timer = effect.duration;
            this.sprite.setTint(0xffff00); 
        }
    }

    updateDebuffs(delta) {
        if (this.statusEffects.burn.active) {
            this.statusEffects.burn.timer -= delta;
            this.statusEffects.burn.tickTimer += delta;
            if (this.statusEffects.burn.tickTimer >= 500) { 
                this.takeTrueDamage(this.statusEffects.burn.damage, '#ff4500');
                if(this.scene && this.scene.createHitEffect) this.scene.createHitEffect(this.x, this.y, 0xff4500);
                this.statusEffects.burn.tickTimer = 0;
            }
            if (this.statusEffects.burn.timer <= 0) {
                this.statusEffects.burn.active = false;
                this.clearTint();
            }
        }
        if (this.statusEffects.poison.active) {
            this.statusEffects.poison.timer -= delta;
            this.statusEffects.poison.tickTimer += delta;
            if (this.statusEffects.poison.tickTimer >= 800) { 
                this.takeTrueDamage(this.statusEffects.poison.damage, '#00ff00');
                if(this.scene && this.scene.createHitEffect) this.scene.createHitEffect(this.x, this.y, 0x00ff00);
                this.statusEffects.poison.tickTimer = 0;
            }
            if (this.statusEffects.poison.timer <= 0) {
                this.statusEffects.poison.active = false;
                this.clearTint();
            }
        }
        if (this.statusEffects.armorBreak.active) {
            this.statusEffects.armorBreak.timer -= delta;
            if (this.statusEffects.armorBreak.timer <= 0) {
                this.statusEffects.armorBreak.active = false;
                this.armor = this.baseArmor;
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

    clearTint() { if (this.active && this.sprite) this.sprite.setTint(this.originalColor); }
    
    performHeal() { if (!this.scene || !this.scene.enemies) return; const healRange = 150; let healed = false; this.scene.enemies.children.iterate(e => { if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < healRange) { if (e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + 50); healed = true; } } }); if (healed && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "CURAR", "heal"); }
    
    checkAttackPlayer(time) { if (!this.scene || !this.scene.player) return; const player = this.scene.player; if (!player.active || player.isDead) return; const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y); if (dist < 50) { if (time > this.lastAttackTime + 1000) { player.takeDamage(this.damage); this.lastAttackTime = time; this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 }); } } }
    
    reachBase() { if (this.isDead) return; const damageToBase = Math.max(1, Math.floor(this.damage * 0.5)); if (this.scene.onEnemyLeaks) this.scene.onEnemyLeaks(damageToBase); this.die(false); }

    die(killedByPlayer) {
        if (!this.scene) return;
        const scene = this.scene;
        
        this.isDead = true; 
        this.body.enable = false; 
        this.hpBarBg.setVisible(false);
        this.hpBar.setVisible(false);

        if (scene.createExplosion) scene.createExplosion(this.x, this.y, this.originalColor);

        scene.tweens.add({
            targets: this,
            scale: 0,
            angle: 360,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (killedByPlayer) {
                    if (scene.onEnemyKilled) scene.onEnemyKilled(this);
                    this.dropLoot(scene);
                }
                this.destroy(); 
                if (scene.checkWaveStatus) scene.checkWaveStatus();
            }
        });
    }

    dropLoot(scene) {
        if (this.drops && this.drops.length > 0) {
            const difficulty = scene.difficultyMode || 1;

            this.drops.forEach(dropDef => {
                let [matKey, chance, min, max] = dropDef;
                
                if (difficulty === 2) { 
                    if (matKey === 'copper') matKey = 'iron';
                    if (matKey === 'wood') matKey = 'cedar';
                    if (matKey === 'hide') matKey = 'leather_rigid';
                    if (matKey === 'cloth_simple') matKey = 'cloth_fine';
                } 
                else if (difficulty === 3) { 
                    if (matKey === 'copper') matKey = 'ingot_steel'; 
                    if (matKey === 'wood') matKey = 'plank_ebony';
                    if (matKey === 'hide') matKey = 'leather_dragon';
                    if (matKey === 'cloth_simple') matKey = 'cloth_royal';
                }

                if (Math.random() < chance) {
                    const qty = Phaser.Math.Between(min, max);
                    scene.generateLoot(this.x, this.y, matKey, qty);
                }
            });
        }
    }
}