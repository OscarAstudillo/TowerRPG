// src/entities/projectiles/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 10, 10, 0xffffff);
        this.speed = 600;
        this.target = null;
        this.damage = 0;
        this.aoeRadius = 0;
    }

    fire(target, damage, color, aoeRadius = 0) {
        this.target = target;
        this.damage = damage;
        this.aoeRadius = aoeRadius;
        this.setFillStyle(color);
        this.setActive(true);
        this.setVisible(true);

        // Seguridad: Destruir si lleva mucho tiempo volando
        this.scene.time.delayedCall(2000, () => { if (this.active) this.destroy(); });
    }

    update(time, delta) {
        if (!this.target || !this.target.active) {
            this.destroy();
            return;
        }
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }
    
    // --- FUNCIÓN CORREGIDA PARA EVITAR CONGELAMIENTO ---
    explode(enemiesGroup) {
        if (this.aoeRadius > 0) {
            // Efecto visual de explosión
            const circle = this.scene.add.circle(this.x, this.y, this.aoeRadius, 0xffaa00, 0.5);
            this.scene.tweens.add({ 
                targets: circle, 
                alpha: 0, 
                scale: 0.1, 
                duration: 200, 
                onComplete: () => circle.destroy() 
            });

            // TRUCO: Creamos una COPIA de la lista (.slice())
            // Así, si un enemigo muere y se borra del grupo original, nuestro bucle no se rompe.
            const enemies = enemiesGroup.getChildren().slice();

            enemies.forEach((enemy) => {
                if (enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        enemy.takeDamage(this.damage);
                    }
                }
            });
        }
    }
}