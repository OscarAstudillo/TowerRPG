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
        if (this.towerType === 'archer') this.setFillStyle(0x00ff00); // Verde
        else if (this.towerType === 'cannon') this.setFillStyle(0x000000); // Negro
        else if (this.towerType === 'mage') this.setFillStyle(0x00ffff); // Celeste
        else if (this.towerType === 'hero') this.setFillStyle(0xffff00); // Amarillo (Héroe)
    }

    update(time, delta) {
        // Si el objetivo muere o desaparece, destruir proyectil
        if (!this.target || !this.target.active || this.target.isDead) {
            this.destroy();
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.rotation = angle;
        
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        // --- CORRECCIÓN DE LÍMITES DINÁMICOS ---
        // Usamos el tamaño real de la pantalla + un margen de 100px
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        
        if (this.x < -100 || this.x > w + 100 || this.y < -100 || this.y > h + 100) {
            this.destroy();
        }
    }

    // Se llama cuando colisiona con el enemigo
    hit(enemy) {
        if (this.towerType === 'cannon') {
            this.explode();
        } else {
            // Daño directo
            enemy.takeDamage(this.damage);
            
            // Efecto Slow
            if (this.towerType === 'mage') {
                enemy.applySlow(this.slowFactor, 2000); 
            }
        }
        this.destroy();
    }

    explode() {
        // Efecto visual simple (compatible con todo)
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

        // Daño en área
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