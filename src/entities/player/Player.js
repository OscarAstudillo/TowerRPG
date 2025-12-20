// src/entities/player/Player.js
import Phaser from 'phaser';
import { gameState } from '../../config/GameState.js'; 
import { TALENTS } from '../../config/Talents.js';

export default class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, charClass, enemiesGroup, projectilesGroup) {
        const stats = gameState.playerStats;
        const color = stats.color || 0xffff00;
        super(scene, x, y, 32, 32, color); 
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.enemiesGroup = enemiesGroup;
        this.projectilesGroup = projectilesGroup;
        
        this.lastAttackTime = 0;
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5000; 
        this.regenTimer = 0;
        this.auraTimer = 0;

        this.isBuffed = false; 
        this.isDead = false; 
        
        this.cursors = scene.input.keyboard.addKeys({ 
            up: Phaser.Input.Keyboard.KeyCodes.W, 
            down: Phaser.Input.Keyboard.KeyCodes.S, 
            left: Phaser.Input.Keyboard.KeyCodes.A, 
            right: Phaser.Input.Keyboard.KeyCodes.D 
        });

        // Cargar Efectos Pasivos
        this.loadPassives();
    }

    loadPassives() {
        this.passives = {
            blockChance: 0,
            doubleStrike: 0,
            pierce: 0,
            frostHit: 0
        };

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

    get stats() {
        return gameState.playerStats;
    }

    update(time, delta) {
        if (this.isDead) {
            if(this.body) this.body.setVelocity(0);
            return;
        }
        
        this.body.setVelocity(0);
        const speed = this.stats.moveSpeed; 
        if (this.cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(speed);

        if (this.skillCooldown > 0) this.skillCooldown -= delta;

        let currentAttackSpeed = this.stats.attackSpeed;
        if (this.isBuffed && gameState.selectedClass === 'arquero') currentAttackSpeed /= 3; 

        if (time > this.lastAttackTime + currentAttackSpeed) {
            this.findTargetAndAttack(time);
        }

        // Regeneración Pasiva (incluida en stats si talento aprendido)
        this.regenTimer += delta;
        if (this.regenTimer >= 5000) { 
            this.regenTimer = 0;
            if (this.stats.regenHp > 0 && this.stats.hp < this.stats.maxHp) {
                gameState.playerStats.hp = Math.min(this.stats.hp + this.stats.regenHp, this.stats.maxHp);
                if (this.scene.showFloatingText) {
                    this.scene.showFloatingText(this.x, this.y, `+${this.stats.regenHp}`, '#00ff00');
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        // TALENTO: Bloqueo (Paladin)
        if (this.passives.blockChance > 0 && Math.random() * 100 < this.passives.blockChance) {
            this.scene.showFloatingText(this.x, this.y - 40, "¡BLOQUEADO!", "#ffffff");
            return;
        }

        let safeAmount = Number(amount);
        if (isNaN(safeAmount)) safeAmount = 0;

        const def = this.stats.defense || 0;
        let finalDamage = Math.max(1, safeAmount - def);
        
        gameState.playerStats.hp -= finalDamage;
        
        if (this.scene && this.scene.showFloatingText) {
            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(finalDamage)}`, '#ff0000');
        }
        
        if ((this.stats.thorns || 0) > 0) {
            const attacker = this.findClosestEnemy(100);
            if (attacker) attacker.takeDamage(this.stats.thorns);
        }

        this.scene.tweens.add({ targets: this, alpha: 0.2, yoyo: true, duration: 100, repeat: 1 });

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    findTargetAndAttack(time) {
        const target = this.findClosestEnemy(this.stats.range);
        if (target) {
            // TALENTO: Doble Golpe (Guerrero)
            let hits = 1;
            if (this.passives.doubleStrike > 0 && Math.random() * 100 < this.passives.doubleStrike) {
                hits = 2;
                this.scene.showFloatingText(this.x, this.y - 40, "¡DOBLE!", "#ff0000");
            }

            for(let i=0; i<hits; i++) {
                this.scene.time.delayedCall(i * 100, () => {
                    const projectile = this.projectilesGroup.get(this.x, this.y);
                    if (projectile) {
                        let dmg = this.stats.damage;
                        let slow = 1;

                        // TALENTO: Perforación (Arquero) - Ignora armadura enemiga simulando más daño
                        if (this.passives.pierce > 0) dmg += 5; 

                        // TALENTO: Toque Gélido (Mago)
                        if (this.passives.frostHit > 0) slow = 0.7;

                        projectile.fire(target, {
                            damage: dmg,
                            type: 'hero',
                            aoeRadius: 0,
                            slowFactor: slow
                        });
                        
                        if (this.stats.lifesteal > 0) {
                            const heal = Math.ceil(this.stats.damage * (this.stats.lifesteal / 100));
                            if (heal > 0 && this.stats.hp < this.stats.maxHp) {
                                gameState.playerStats.hp += heal;
                            }
                        }
                    }
                });
            }
            this.lastAttackTime = time;
        }
    }

    // ... (Resto de funciones igual: castSkill, findClosestEnemy, createAOE, die, respawn)
    castSkill() {
        if (this.isDead) return { success: false, msg: '¡Estás muerto!' };
        if (this.skillCooldown > 0) return { success: false, msg: 'Cooldown!' };

        const cls = gameState.selectedClass;
        let skillName = "";

        if (cls === 'paladin') {
            const healAmount = Math.floor(this.stats.maxHp * 0.3);
            gameState.playerStats.hp = Math.min(this.stats.hp + healAmount, this.stats.maxHp);
            this.createEffect('heal');
            skillName = "¡Sanación!";
            if(this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, `+${healAmount}`, '#00ff00');
        
        } else if (cls === 'guerrero') {
            const damage = this.stats.damage * 2.5;
            this.createAOE(150, damage, 0xff0000);
            skillName = "¡Torbellino!";
        } else if (cls === 'mago') {
            const damage = this.stats.damage * 2;
            this.createAOE(200, damage, 0x00ffff);
            skillName = "¡Nova de Hielo!";
        } else if (cls === 'arquero') {
            this.isBuffed = true;
            this.scene.time.delayedCall(3000, () => { this.isBuffed = false; });
            this.createEffect('buff');
            skillName = "¡Instinto!";
        } else if (cls === 'asesino') {
            const target = this.findClosestEnemy(300);
            if (target) {
                target.takeDamage(this.stats.damage * 5); 
                this.scene.add.text(target.x, target.y - 20, "¡CRÍTICO!", { fontSize: '20px', color: '#ff0000' }).destroy();
                this.x = target.x;
                this.y = target.y;
            } else {
                return { success: false, msg: '¡Sin objetivo!' };
            }
            skillName = "¡Ejecución!";
        }

        const cdrMult = 1 - ((this.stats.cdr || 0) / 100);
        this.skillCooldown = this.skillMaxCooldown * cdrMult;
        return { success: true, msg: skillName };
    }

    findClosestEnemy(range) { let closest = null; let minDist = Infinity; this.enemiesGroup.children.iterate(enemy => { if (enemy.active) { const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y); if (dist < range && dist < minDist) { minDist = dist; closest = enemy; } } }); return closest; }
    createAOE(radius, damage, color) { const circle = this.scene.add.circle(this.x, this.y, radius, color, 0.4); this.scene.tweens.add({ targets: circle, alpha: 0, scale: 1.2, duration: 300, onComplete: () => circle.destroy() }); this.enemiesGroup.children.iterate(enemy => { if (enemy.active && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) <= radius) { enemy.takeDamage(damage); } }); }
    createEffect(type) { if (type === 'buff') { this.setStrokeStyle(4, 0xffffff); this.scene.time.delayedCall(3000, () => this.setStrokeStyle(0)); } }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        gameState.playerStats.hp = 0; 
        this.setFillStyle(0x555555); 
        this.scene.add.text(this.x - 20, this.y - 40, "☠️", { fontSize: '30px' }).destroy({delay: 1000});
        this.body.enable = false;
        this.respawnText = this.scene.add.text(this.x, this.y - 30, "Reviviendo...", { fontSize: '14px', color: '#fff', backgroundColor: '#000' }).setOrigin(0.5);
        this.scene.time.delayedCall(10000, () => { this.respawn(); });
    }

    respawn() {
        this.isDead = false;
        gameState.playerStats.hp = this.stats.maxHp; 
        this.body.enable = true; 
        this.lastAttackTime = 0; 
        this.setFillStyle(this.stats.color); 
        if (this.respawnText) this.respawnText.destroy();
        this.scene.tweens.add({ targets: this, scale: { from: 0, to: 1 }, duration: 500, ease: 'Back.out' });
        this.scene.showFloatingText(this.x, this.y - 50, "¡RESUCITADO!", "#00ff00");
    }
}