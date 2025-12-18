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
        this.lastAttackTime = 0;

        // --- SISTEMA DE SKILLS ---
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5000; // 5 segundos base
        this.isBuffed = false; 

        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    // --- AQUÍ ESTABA EL ERROR: FALTABA 'delta' EN EL PARÉNTESIS ---
    update(time, delta) { 
        if (!this.body) return;

        // 1. Movimiento
        this.body.setVelocity(0);
        const speed = this.stats.moveSpeed;

        if (this.cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(speed);

        // 2. Reducir Cooldown de Skill (Ahora sí funciona porque delta existe)
        if (this.skillCooldown > 0) {
            this.skillCooldown -= delta;
        }

        // 3. Ataque Automático
        let currentAttackSpeed = this.stats.attackSpeed;
        if (this.isBuffed && gameState.selectedClass === 'arquero') {
            currentAttackSpeed /= 3; // Dispara 3 veces más rápido
        }

        if (time > this.lastAttackTime + currentAttackSpeed) {
            this.findTargetAndAttack(time);
        }
    }

    // --- NUEVA FUNCIÓN: ACTIVAR HABILIDAD ---
    castSkill() {
        if (this.skillCooldown > 0) return { success: false, msg: 'Cooldown!' };

        const cls = gameState.selectedClass;
        let skillName = "";

        if (cls === 'paladin') {
            const healAmount = Math.floor(this.stats.maxHp * 0.3);
            gameState.playerStats.hp = Math.min(gameState.playerStats.hp + healAmount, this.stats.maxHp);
            this.createEffect('heal');
            skillName = "¡Sanación!";
        
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

        this.skillCooldown = this.skillMaxCooldown;
        return { success: true, msg: skillName };
    }

    findClosestEnemy(range) {
        let closest = null;
        let minDist = Infinity;
        this.enemiesGroup.children.iterate(enemy => {
            if (enemy.active) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist < range && dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
        });
        return closest;
    }

    createAOE(radius, damage, color) {
        const circle = this.scene.add.circle(this.x, this.y, radius, color, 0.4);
        this.scene.tweens.add({ targets: circle, alpha: 0, scale: 1.2, duration: 300, onComplete: () => circle.destroy() });
        this.enemiesGroup.children.iterate(enemy => {
            if (enemy.active && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) <= radius) {
                enemy.takeDamage(damage);
            }
        });
    }

    createEffect(type) {
        if (type === 'heal') {
            const txt = this.scene.add.text(this.x, this.y - 40, "+HP", { fontSize: '20px', color: '#00ff00', fontStyle: 'bold' });
            this.scene.tweens.add({ targets: txt, y: this.y - 80, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
        } else if (type === 'buff') {
            this.setStrokeStyle(4, 0xffffff); 
            this.scene.time.delayedCall(3000, () => this.setStrokeStyle(0));
        }
    }

    findTargetAndAttack(time) {
        const target = this.findClosestEnemy(this.stats.range);
        if (target) {
            const projectile = this.projectilesGroup.get(this.x, this.y);
            if (projectile) projectile.fire(target, this.stats.damage, this.stats.color);
            this.lastAttackTime = time;
        }
    }
}