import Phaser from 'phaser';
import { gameState, getCurrentHero } from '../../config/GameState.js';
import { TALENTS } from '../../config/Talents.js';
import SoundManager from '../../systems/SoundManager.js'; 

export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y, charClass, enemiesGroup, projectilesGroup) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.charClass = charClass;
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

        this.hpBarBg = scene.add.rectangle(0, -25, 40, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -25, 38, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);
        
        this.isDead = false;
        this.respawnTimer = 0;
        this.originalStats = {}; 
        
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

        if (this.skillCooldown > 0) this.skillCooldown -= delta;

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
            // --- CÁLCULO DE CRÍTICO ---
            const isCrit = Math.random() * 100 < stats.critChance;
            if (isCrit) {
                finalDamage *= (stats.critDamage / 100);
            }
            // ---------------------------

            if (SoundManager && SoundManager.playSound) SoundManager.playSound('shoot_arrow');

            projectile.fire(target, {
                damage: finalDamage,
                isCrit: isCrit, // PASAMOS EL FLAG
                type: 'arrow',
                effect: null
            });
        }
    }

    // ... (castSkill, takeDamage, die, respawn SIN CAMBIOS) ...
    // Asegúrate de mantener esos métodos igual que en tu código original
    castSkill() {
        if (this.skillCooldown > 0) return { success: false };
        const hero = getCurrentHero();
        if (!hero) return { success: false };

        this.skillCooldown = this.skillMaxCooldown;
        const stats = gameState.playerStats;

        if (this.charClass === 'guerrero') {
            const healAmount = stats.maxHp * 0.3;
            stats.hp = Math.min(stats.maxHp, stats.hp + healAmount);
            this.scene.showFloatingText(this.x, this.y, "¡FURIA!", "heal"); // Usamos tipo 'heal'
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
                    if(this.scene.showDamage) this.scene.showDamage(e.x, e.y, Math.floor(dmg), true); // Crit visual
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

    takeDamage(amount) {
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