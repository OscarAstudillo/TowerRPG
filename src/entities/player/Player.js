import Phaser from 'phaser';
import { gameState, getCurrentHero } from '../../config/GameState.js';
import { TALENTS } from '../../config/Talents.js';
import { PLAYER_SKILLS } from '../../config/GameConstants.js'; 
import SoundManager from '../../systems/SoundManager.js';
import { EventBus } from '../../utils/EventBus.js';

export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y, charClass, enemiesGroup, projectilesGroup) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.charClass = charClass || 'guerrero'; // Default por si acaso
        this.enemies = enemiesGroup;
        this.projectiles = projectilesGroup;
        
        const textureKey = `hero_${charClass}`; 
        
        if (scene.textures.exists(textureKey)) {
            this.bodySprite = scene.add.sprite(0, 0, textureKey);
            this.bodySprite.setDisplaySize(32, 32);
        } else {
            const stats = gameState.playerStats;
            const color = stats.color || 0xffff00; 
            this.bodySprite = scene.add.rectangle(0, 0, 32, 32, color);
        }
        this.add(this.bodySprite);

        this.body.setSize(32, 32);
        this.body.setCollideWorldBounds(true);
        this.body.setOffset(-16, -16); 

        this.attackTimer = 0;
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5000; 

        // --- VARIABLES DE ESTADO PARA SKILLS ---
        this.isDashing = false;
        this.dashTimer = 0;
        this.cooldowns = { dash: 0, q: 0, e: 0 };
        this.lastDirection = { x: 1, y: 0 };

        this.hpBarBg = scene.add.rectangle(0, -25, 40, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -25, 38, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);
        
        this.isDead = false;
        this.respawnTimer = 0;
        this.originalStats = {}; 
        
        this.skillKeys = scene.input.keyboard.addKeys({
            dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            skillQ: Phaser.Input.Keyboard.KeyCodes.Q,
            skillE: Phaser.Input.Keyboard.KeyCodes.E
        });

        EventBus.on('ui-trigger-skill', (key) => {
            if (this.isDead) return;
            if (key === 'q') this.performSkillQ();
            if (key === 'e') this.performSkillE();
            if (key === 'space' || key === 'main') this.castSkill();
        });

        this.loadPassives();
    }

    update(time, delta) {
        if (!this.scene) return;

        if (this.isDead) {
            this.respawnTimer -= delta;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }

        const stats = gameState.playerStats;

        // --- ACTUALIZAR COOLDOWNS ---
        if (this.cooldowns.dash > 0) this.cooldowns.dash -= delta;
        
        if (this.cooldowns.q > 0) {
            this.cooldowns.q -= delta;
            if (this.cooldowns.q <= 0) EventBus.emit('skill-cooldown', { key: 'q', current: 0 });
            else if (time % 10 < delta) EventBus.emit('skill-cooldown', { key: 'q', current: this.cooldowns.q });
        }
        
        if (this.cooldowns.e > 0) {
            this.cooldowns.e -= delta;
            if (this.cooldowns.e <= 0) EventBus.emit('skill-cooldown', { key: 'e', current: 0 });
            else if (time % 10 < delta) EventBus.emit('skill-cooldown', { key: 'e', current: this.cooldowns.e });
        }

        if (this.skillCooldown > 0) {
            this.skillCooldown -= delta;
            if (this.skillCooldown <= 0) EventBus.emit('skill-cooldown', { key: 'main', current: 0 });
            else if (time % 10 < delta) EventBus.emit('skill-cooldown', { key: 'main', current: this.skillCooldown });
        }

        // --- LÓGICA DE DASH ---
        if (this.isDashing) {
            this.dashTimer -= delta;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                if (this.bodySprite) this.bodySprite.setAlpha(1);
            }
            return; 
        }

        const cursors = this.scene.input.keyboard.createCursorKeys();
        const wasd = this.scene.input.keyboard.addKeys({ 
            'W': Phaser.Input.Keyboard.KeyCodes.W, 
            'A': Phaser.Input.Keyboard.KeyCodes.A, 
            'S': Phaser.Input.Keyboard.KeyCodes.S, 
            'D': Phaser.Input.Keyboard.KeyCodes.D 
        });

        let velocityX = 0;
        let velocityY = 0;

        if (cursors.left.isDown || wasd.A.isDown) velocityX = -1;
        else if (cursors.right.isDown || wasd.D.isDown) velocityX = 1;

        if (cursors.up.isDown || wasd.W.isDown) velocityY = -1;
        else if (cursors.down.isDown || wasd.S.isDown) velocityY = 1;

        if (velocityX !== 0 || velocityY !== 0) {
            this.lastDirection = { x: velocityX, y: velocityY };
        }

        if (this.skillKeys.dash.isDown && this.cooldowns.dash <= 0 && (velocityX !== 0 || velocityY !== 0)) {
            this.performDash(velocityX, velocityY);
            return; 
        }
        if (Phaser.Input.Keyboard.JustDown(this.skillKeys.skillQ)) {
            this.performSkillQ();
        }
        if (Phaser.Input.Keyboard.JustDown(this.skillKeys.skillE)) {
            this.performSkillE();
        }

        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        this.body.setVelocity(velocityX * stats.moveSpeed, velocityY * stats.moveSpeed);

        if (this.bodySprite && this.bodySprite.setFlipX) {
            if (velocityX < 0) this.bodySprite.setFlipX(true);
            else if (velocityX > 0) this.bodySprite.setFlipX(false);
        }

        if (stats.regenHp > 0) {
            stats.hp = Math.min(stats.maxHp, stats.hp + (stats.regenHp * delta / 1000));
        }

        this.attackTimer += delta;
        if (this.attackTimer >= stats.attackSpeed) {
            this.attackTimer = 0;
            this.autoAttack();
        }

        const hpPercent = Math.max(0, stats.hp / stats.maxHp);
        this.hpBar.width = 38 * hpPercent;
        this.hpBar.fillColor = hpPercent < 0.3 ? 0xff0000 : 0x00ff00;
        
        if (stats.hp <= 0) {
            this.die();
        }
    }

    performDash(dirX, dirY) {
        if (!PLAYER_SKILLS.DASH || this.cooldowns.dash > 0) return;
        
        this.isDashing = true;
        this.dashTimer = PLAYER_SKILLS.DASH.DURATION;
        this.cooldowns.dash = PLAYER_SKILLS.DASH.COOLDOWN;
        
        const speed = (gameState.playerStats.moveSpeed || 160) * PLAYER_SKILLS.DASH.SPEED_MULT;
        const vec = new Phaser.Math.Vector2(dirX, dirY).normalize().scale(speed);
        this.body.setVelocity(vec.x, vec.y);
        
        if (this.bodySprite) this.bodySprite.setAlpha(0.6);
        if (SoundManager) SoundManager.playSound('dash'); 
    }

    // --- LÓGICA GENÉRICA PARA EJECUTAR CUALQUIER SKILL (Q o E) ---
    executeSkillLogic(config) {
        if (!config) return;

        const damage = gameState.playerStats.damage * config.DAMAGE_MULT;
        const range = config.RANGE || 150;
        const color = config.COLOR || 0xffffff;

        // Efecto visual y Lógica según TYPE
        if (config.TYPE === 'area_self') {
            // Círculo alrededor del jugador (Guerrero Q, Mago Q)
            const circle = this.scene.add.circle(this.x, this.y, 10, color, 0.5);
            this.scene.tweens.add({ targets: circle, scale: range / 10, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
            
            if (this.enemies) {
                this.enemies.children.iterate(e => {
                    if (e && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= range) {
                        e.takeDamage(damage);
                        if(config.EFFECT === 'freeze') e.applyStatus({ type: 'freeze', val: 0.5, duration: 2000 });
                    }
                });
            }

        } else if (config.TYPE === 'line' || config.TYPE === 'cone') {
            // Ataque direccional hacia el mouse (Guerrero E, Mago E)
            const pointer = this.scene.input.activePointer;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
            
            const line = this.scene.add.rectangle(this.x, this.y, range, config.WIDTH || 50, color, 0.7);
            line.setOrigin(0, 0.5);
            line.rotation = angle;
            this.scene.tweens.add({ targets: line, alpha: 0, scaleY: 0, duration: 200, onComplete: () => line.destroy() });

            if (this.enemies) {
                this.enemies.children.iterate(e => {
                    if (e && e.active) {
                        const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
                        if (dist <= range) {
                            const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y);
                            let diff = Math.abs(angle - angleToEnemy);
                            if (diff > Math.PI) diff = (Math.PI * 2) - diff;
                            if (diff < 0.5) { // Cono de ~30 grados
                                e.takeDamage(damage);
                                if(config.EFFECT === 'stun') e.applyStatus({ type: 'stun', duration: 1500 });
                            }
                        }
                    }
                });
            }

        } else if (config.TYPE === 'projectile') {
            // Disparo único potente (Arquero E)
            const pointer = this.scene.input.activePointer;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
            
            // Creamos un proyectil "falso" o especial aquí, o usamos el sistema de proyectiles si es flexible
            // Por simplicidad visual rápida:
            const proj = this.scene.add.circle(this.x, this.y, 8, color, 1);
            this.scene.physics.add.existing(proj);
            const speed = config.SPEED || 600;
            proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            
            // Timeout para destruir
            this.scene.time.delayedCall(1000, () => proj.destroy());
            
            // Colisión manual simple
            this.scene.physics.add.overlap(proj, this.enemies, (p, e) => {
                if(e.active) {
                    e.takeDamage(damage);
                    p.destroy();
                }
            });

        } else if (config.TYPE === 'area_cursor') {
            // Lluvia de flechas en el mouse (Arquero Q)
            const pointer = this.scene.input.activePointer;
            const targetX = pointer.worldX;
            const targetY = pointer.worldY;

            const area = this.scene.add.circle(targetX, targetY, range, color, 0.3);
            this.scene.tweens.add({ targets: area, alpha: 0, duration: 1000, onComplete: () => area.destroy() });

            // Daño retardado (como caer flechas)
            this.scene.time.delayedCall(500, () => {
                if (this.enemies) {
                    this.enemies.children.iterate(e => {
                        if (e && e.active && Phaser.Math.Distance.Between(targetX, targetY, e.x, e.y) <= range) {
                            e.takeDamage(damage);
                        }
                    });
                }
            });
        }
    }

    performSkillQ() {
        // Verificar que existan las skills para esta clase
        const classSkills = PLAYER_SKILLS[this.charClass];
        if (!classSkills || !classSkills.Q) return;
        
        if (this.cooldowns.q > 0) return;

        const config = classSkills.Q;
        this.cooldowns.q = config.COOLDOWN;
        EventBus.emit('skill-cooldown', { key: 'q', current: this.cooldowns.q });
        
        this.scene.showFloatingText(this.x, this.y - 40, config.NAME, "#ffffff");
        this.executeSkillLogic(config);
    }

    performSkillE() {
        const classSkills = PLAYER_SKILLS[this.charClass];
        if (!classSkills || !classSkills.E) return;

        if (this.cooldowns.e > 0) return;

        const config = classSkills.E;
        this.cooldowns.e = config.COOLDOWN;
        EventBus.emit('skill-cooldown', { key: 'e', current: this.cooldowns.e });

        this.scene.showFloatingText(this.x, this.y - 40, config.NAME, "#ffffff");
        this.executeSkillLogic(config);
    }

    castSkill() {
        if (this.skillCooldown > 0) return { success: false };
        const hero = getCurrentHero();
        if (!hero) return { success: false };

        this.skillCooldown = this.skillMaxCooldown;
        EventBus.emit('skill-cooldown', { key: 'main', current: this.skillMaxCooldown });

        const stats = gameState.playerStats;

        // Mantengo tu lógica original para la habilidad de ESPACIO
        if (this.charClass === 'guerrero') {
            const healAmount = stats.maxHp * 0.3;
            stats.hp = Math.min(stats.maxHp, stats.hp + healAmount);
            this.scene.showFloatingText(this.x, this.y, "¡FURIA!", "heal"); 
            this.scene.showFloatingText(this.x, this.y - 20, `+${Math.floor(healAmount)} HP`, "heal");
            if(this.scene.createExplosion) this.scene.createExplosion(this.x, this.y, 0xff0000);

        } else if (this.charClass === 'mago') {
            this.scene.showFloatingText(this.x, this.y, "¡NOVA!", "#00ffff");
            if(this.scene.createExplosion) this.scene.createExplosion(this.x, this.y, 0x00ffff);
            const range = 150;
            this.enemies.children.iterate((e) => {
                if(e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < range) {
                    const dmg = stats.damage * 2;
                    e.takeDamage(dmg);
                    if(this.scene.showDamage) this.scene.showDamage(e.x, e.y, Math.floor(dmg), true);
                }
            });

        } else if (this.charClass === 'arquero') {
            this.scene.showFloatingText(this.x, this.y, "¡RÁPIDO!", "#00ff00");
            if (!this.originalStats.attackSpeed) this.originalStats.attackSpeed = stats.attackSpeed;
            stats.attackSpeed = Math.max(100, stats.attackSpeed * 0.4); 
            this.scene.time.delayedCall(5000, () => {
                if (this.originalStats.attackSpeed) {
                    stats.attackSpeed = this.originalStats.attackSpeed;
                    this.originalStats.attackSpeed = null;
                }
            });

        } else if (this.charClass === 'asesino') {
            this.scene.showFloatingText(this.x, this.y, "¡INSTINTO!", "#800080");
            if (!this.originalStats.critChance) this.originalStats.critChance = stats.critChance;
            stats.critChance = 100; 
            this.scene.time.delayedCall(4000, () => {
                if (this.originalStats.critChance) {
                    stats.critChance = this.originalStats.critChance;
                    this.originalStats.critChance = null;
                }
            });
        }
        return { success: true };
    }

    loadPassives() {
        this.passives = { blockChance: 0, doubleStrike: 0, pierce: 0, frostHit: 0 };
        if (gameState.talents) {
            const clsTalents = TALENTS[gameState.selectedClass] || [];
            clsTalents.forEach(t => {
                if (gameState.talents.includes(t.id) && t.effect) {
                    if (t.effect === 'block_chance') this.passives.blockChance = t.val;
                    if (t.effect === 'double_strike') this.passives.doubleStrike = t.val;
                    if (t.effect === 'pierce') this.passives.pierce = t.val;
                    if (t.effect === 'frost_hit') this.passives.frostHit = t.val;
                }
            });
        }
    }

    autoAttack() {
        const stats = gameState.playerStats;
        let target = null;
        let minDistance = stats.range;

        this.enemies.children.iterate((enemy) => {
            if (enemy.active && !enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= minDistance) {
                    minDistance = dist;
                    target = enemy;
                }
            }
        });

        if (target) {
            this.fireProjectile(target);
            if (Math.random() * 100 < stats.doubleAttack) {
                this.scene.time.delayedCall(100, () => {
                    if(target.active) this.fireProjectile(target);
                });
            }
        }
    }

    fireProjectile(target) {
        const stats = gameState.playerStats;
        const projectile = this.projectiles.get(this.x, this.y);
        
        if (projectile) {
            let finalDamage = stats.damage;
            const isCrit = Math.random() * 100 < stats.critChance;
            if (isCrit) {
                finalDamage *= (stats.critDamage / 100);
            }

            if (SoundManager && SoundManager.playSound) SoundManager.playSound('shoot_arrow');

            projectile.fire(target, {
                damage: finalDamage,
                isCrit: isCrit,
                type: 'arrow',
                effect: null
            });
        }
    }

    takeDamage(amount) {
        if (this.isDashing) return;

        const stats = gameState.playerStats;
        if (Math.random() * 100 < stats.blockChance) {
            this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa");
            return;
        }
        const mitigation = stats.defense * 0.5;
        const finalDamage = Math.max(1, amount - mitigation);
        stats.hp -= finalDamage;
        this.scene.cameras.main.shake(50, 0.002);
        this.scene.showFloatingText(this.x, this.y, `-${Math.floor(finalDamage)}`, "#ff0000");
    }

    die() {
        this.isDead = true;
        this.visible = false;
        this.respawnTimer = 5000;
        this.scene.showFloatingText(this.x, this.y, "MUERTO (5s)", "#ff0000");
        this.scene.cameras.main.flash(500, 255, 0, 0);
    }

    respawn() {
        this.isDead = false;
        this.visible = true;
        gameState.playerStats.hp = gameState.playerStats.maxHp;
        this.x = this.scene.scale.width / 2;
        this.y = this.scene.scale.height / 2;
        this.scene.showFloatingText(this.x, this.y, "¡REVIVIDO!", "#00ff00");
        if (this.originalStats.attackSpeed) gameState.playerStats.attackSpeed = this.originalStats.attackSpeed;
        if (this.originalStats.critChance) gameState.playerStats.critChance = this.originalStats.critChance;
        this.originalStats = {};
    }
}