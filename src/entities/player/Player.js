// src/entities/player/Player.js
import Phaser from 'phaser';
import { gameState } from '../../config/GameState.js'; 

export default class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, charClass, enemiesGroup, projectilesGroup) {
        // --- CORRECCIÓN: Usar color real ---
        const stats = gameState.playerStats;
        const color = stats.color || 0xffff00;

        super(scene, x, y, 32, 32, color); 
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.enemiesGroup = enemiesGroup;
        this.projectilesGroup = projectilesGroup;
        this.lastAttackTime = 0;
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
        const speed = this.stats.moveSpeed;

        if (this.cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(speed);

        if (time > this.lastAttackTime + this.stats.attackSpeed) {
            this.findTargetAndAttack(time);
        }
    }

    findTargetAndAttack(time) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        // --- CORRECCIÓN: Usar rango real (Melee 60 vs Ranged 200+) ---
        const range = this.stats.range; 

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
            // Pasamos el color del héroe al proyectil también
            projectile.fire(target, this.stats.damage, this.stats.color);
        }
    }
}