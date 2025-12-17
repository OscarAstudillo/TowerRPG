// src/entities/player/Player.js
import Phaser from 'phaser';
import { gameState } from '../../config/GameState.js'; // <--- IMPORTANTE

export default class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, charClass, enemiesGroup, projectilesGroup) {
        super(scene, x, y, 32, 32, 0xffff00); // Amarillo por defecto
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.enemiesGroup = enemiesGroup;
        this.projectilesGroup = projectilesGroup;
        this.lastAttackTime = 0;

        // --- AHORA USAMOS LAS STATS GLOBALES ---
        // Referencia directa al objeto global
        this.stats = gameState.playerStats; 

        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(time) {
        if (!this.body) return;

        this.body.setVelocity(0);
        // Usamos this.stats.moveSpeed que viene del GameState
        const speed = this.stats.moveSpeed;

        if (this.cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(speed);

        // Usamos this.stats.attackSpeed
        if (time > this.lastAttackTime + this.stats.attackSpeed) {
            this.findTargetAndAttack(time);
        }
    }

    findTargetAndAttack(time) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        // Rango fijo por ahora, o podrías añadirlo a stats
        const range = 200; 

        this.enemiesGroup.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist <= range && dist < closestDistance) {
                    closestDistance = dist;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            this.fireProjectile(closestEnemy);
            this.lastAttackTime = time;
        }
    }

    fireProjectile(target) {
        const projectile = this.projectilesGroup.get(this.x, this.y);
        if (projectile) {
            // Usamos this.stats.damage
            projectile.fire(target, this.stats.damage, 0xffff00);
        }
    }
}