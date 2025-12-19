// src/entities/player/Player.js
import Phaser from 'phaser';
import { gameState } from '../../config/GameState.js'; 

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
        this.stats = gameState.playerStats; 
        
        // Timers
        this.lastAttackTime = 0;
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5000; 
        this.regenTimer = 0;
        this.auraTimer = 0;

        this.isBuffed = false; 
        this.isDead = false; 
        this.cursors = scene.input.keyboard.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S, left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D });
    }

    update(time, delta) {
        if (!this.body || this.isDead) {
            if(this.body) this.body.setVelocity(0);
            return;
        }
        
        // Movimiento
        this.body.setVelocity(0);
        const speed = this.stats.moveSpeed;
        if (this.cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(speed);

        // Cooldowns
        if (this.skillCooldown > 0) this.skillCooldown -= delta;

        // Ataque
        let currentAttackSpeed = this.stats.attackSpeed;
        if (this.isBuffed && gameState.selectedClass === 'arquero') currentAttackSpeed /= 3; 
        if (time > this.lastAttackTime + currentAttackSpeed) {
            this.findTargetAndAttack(time);
        }

        // --- SISTEMAS PASIVOS (Regen y Auras) ---
        this.regenTimer += delta;
        if (this.regenTimer >= 5000) { // Cada 5 segundos
            this.regenTimer = 0;
            if (this.stats.regenHp > 0 && this.stats.hp < this.stats.maxHp) {
                this.stats.hp = Math.min(this.stats.hp + this.stats.regenHp, this.stats.maxHp);
                if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, `+${this.stats.regenHp}`, '#00ff00');
            }
        }

        // Auras cada 1 segundo
        this.auraTimer += delta;
        if (this.auraTimer >= 1000) {
            this.auraTimer = 0;
            this.applyAuras();
        }
    }

    applyAuras() {
        if (this.stats.coldAura > 0) {
            this.enemiesGroup.children.iterate(enemy => {
                if (enemy.active && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < 200) {
                    // Ralentizar enemigo (asumiendo que Enemy tiene propiedad speed)
                    // Nota: Esto requiere que Enemy.js soporte cambios de velocidad dinámica, 
                    // por ahora es solo visual si no modificamos Enemy.js profundamente.
                    // enemy.speed *= (1 - (this.stats.coldAura / 100)); 
                }
            });
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        // Seguridad contra NaN
        let safeAmount = Number(amount);
        if (isNaN(safeAmount)) safeAmount = 0;

        const def = this.stats.defense || 0;
        let finalDamage = Math.max(1, safeAmount - def);
        
        this.stats.hp -= finalDamage;
        
        // Feedback Daño
        if (this.scene && this.scene.showFloatingText) {
            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(finalDamage)}`, '#ff0000');
        }
        
        // Espinas
        if ((this.stats.thorns || 0) > 0) {
            const attacker = this.findClosestEnemy(100);
            if (attacker) attacker.takeDamage(this.stats.thorns);
        }

        this.scene.tweens.add({ targets: this, alpha: 0.2, yoyo: true, duration: 100, repeat: 1 });

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    // ... (Mantén castSkill, die, respawn, findTargetAndAttack, fireProjectile, etc. del código anterior) ...
    // Asegúrate de copiar las funciones que no cambiaron.
    // Solo añado la lógica de Lifesteal al atacar:

    findTargetAndAttack(time) {
        const target = this.findClosestEnemy(this.stats.range);
        if (target) {
            const projectile = this.projectilesGroup.get(this.x, this.y);
            if (projectile) {
                projectile.fire(target, this.stats.damage, this.stats.color);
                
                // --- ROBO DE VIDA ---
                if (this.stats.lifesteal > 0) {
                    const heal = Math.ceil(this.stats.damage * (this.stats.lifesteal / 100));
                    if (heal > 0 && this.stats.hp < this.stats.maxHp) {
                        this.stats.hp += heal;
                        // Feedback sutil para no llenar la pantalla
                    }
                }
            }
            this.lastAttackTime = time;
        }
    }
    
    // Funciones auxiliares repetidas para seguridad
    findClosestEnemy(range) { let closest = null; let minDist = Infinity; this.enemiesGroup.children.iterate(enemy => { if (enemy.active) { const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y); if (dist < range && dist < minDist) { minDist = dist; closest = enemy; } } }); return closest; }
    createAOE(radius, damage, color) { const circle = this.scene.add.circle(this.x, this.y, radius, color, 0.4); this.scene.tweens.add({ targets: circle, alpha: 0, scale: 1.2, duration: 300, onComplete: () => circle.destroy() }); this.enemiesGroup.children.iterate(enemy => { if (enemy.active && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) <= radius) { enemy.takeDamage(damage); } }); }
    createEffect(type) { if (type === 'heal') {} else if (type === 'buff') { this.setStrokeStyle(4, 0xffffff); this.scene.time.delayedCall(3000, () => this.setStrokeStyle(0)); } }
    die() { this.isDead = true; this.stats.hp = 0; this.setFillStyle(0x555555); this.scene.add.text(this.x - 20, this.y - 40, "☠️", { fontSize: '30px' }).destroy({delay: 1000}); this.body.enable = false; this.respawnText = this.scene.add.text(this.x, this.y - 30, "Reviviendo...", { fontSize: '14px', color: '#fff', backgroundColor: '#000' }).setOrigin(0.5); this.scene.time.delayedCall(10000, () => { this.respawn(); }); }
    respawn() { this.isDead = false; this.stats.hp = this.stats.maxHp; this.body.enable = true; this.setFillStyle(this.stats.color); if (this.respawnText) this.respawnText.destroy(); this.scene.tweens.add({ targets: this, scale: { from: 0, to: 1 }, duration: 500, ease: 'Back.out' }); }
    castSkill() { if (this.isDead) return { success: false, msg: '¡Estás muerto!' }; if (this.skillCooldown > 0) return { success: false, msg: 'Cooldown!' }; const cls = gameState.selectedClass; let skillName = ""; if (cls === 'paladin') { const healAmount = Math.floor(this.stats.maxHp * 0.3); gameState.playerStats.hp = Math.min(gameState.playerStats.hp + healAmount, this.stats.maxHp); this.createEffect('heal'); skillName = "¡Sanación!"; this.scene.showFloatingText(this.x, this.y, `+${healAmount}`, '#00ff00'); } else if (cls === 'guerrero') { const damage = this.stats.damage * 2.5; this.createAOE(150, damage, 0xff0000); skillName = "¡Torbellino!"; } else if (cls === 'mago') { const damage = this.stats.damage * 2; this.createAOE(200, damage, 0x00ffff); skillName = "¡Nova de Hielo!"; } else if (cls === 'arquero') { this.isBuffed = true; this.scene.time.delayedCall(3000, () => { this.isBuffed = false; }); this.createEffect('buff'); skillName = "¡Instinto!"; } else if (cls === 'asesino') { const target = this.findClosestEnemy(300); if (target) { target.takeDamage(this.stats.damage * 5); this.scene.add.text(target.x, target.y - 20, "¡CRÍTICO!", { fontSize: '20px', color: '#ff0000' }).destroy(); this.x = target.x; this.y = target.y; } else { return { success: false, msg: '¡Sin objetivo!' }; } skillName = "¡Ejecución!"; } this.skillCooldown = this.skillMaxCooldown; return { success: true, msg: skillName }; }
}