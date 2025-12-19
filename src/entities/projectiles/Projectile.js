// src/entities/projectiles/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 10, 10, 0xffff00);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 400;
        this.target = null;
        
        // Datos del disparo
        this.damage = 0;
        this.towerType = '';
        this.aoeRadius = 0;
        this.slowFactor = 1;
    }

    fire(target, stats) {
        this.target = target;
        this.damage = stats.damage;
        this.towerType = stats.type;
        this.aoeRadius = stats.aoeRadius;
        this.slowFactor = stats.slowFactor;

        this.setActive(true);
        this.setVisible(true);
        this.setPosition(this.x, this.y);

        // Color según tipo
        if (this.towerType === 'archer') this.setFillStyle(0x00ff00); // Flecha verde
        else if (this.towerType === 'cannon') this.setFillStyle(0x000000); // Bala negra
        else if (this.towerType === 'mage') this.setFillStyle(0x00ffff); // Rayo hielo
    }

    update(time, delta) {
        if (!this.target || !this.target.active || this.target.isDead) {
            this.destroy();
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.rotation = angle;
        
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        // Destrucción por distancia (failsafe)
        if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770) {
            this.destroy();
        }
    }

    // Se llama cuando colisiona con el enemigo principal
    hit(enemy) {
        if (this.towerType === 'cannon') {
            this.explode();
        } else {
            // Daño directo
            enemy.takeDamage(this.damage);
            
            // Efecto Mago (Slow)
            if (this.towerType === 'mage') {
                enemy.applySlow(this.slowFactor, 2000); // 2 segundos de slow
            }
        }
        this.destroy();
    }

    explode() {
        // Efecto visual
        const explosion = this.scene.add.circle(this.x, this.y, this.aoeRadius, 0xff4500, 0.6);
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.2,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Cámara sacudida leve
        this.scene.cameras.main.shake(100, 0.005);

        // Lógica de daño en área
        const enemies = this.scene.enemies.getChildren();
        enemies.forEach(e => {
            if (e.active && !e.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
                if (dist <= this.aoeRadius) {
                    e.takeDamage(this.damage);
                }
            }
        });
    }
}