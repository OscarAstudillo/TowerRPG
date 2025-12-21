// src/entities/projectiles/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Arc {
    constructor(scene, x, y) {
        super(scene, x, y, 5, 0, 360, false, 0xffff00, 1);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.speed = 400;
        this.damage = 10;
        this.target = null;
        this.effectPayload = null; // NUEVO: Datos del efecto
    }

    fire(target, options) {
        this.target = target;
        this.damage = options.damage || 10;
        this.type = options.type || 'arrow';
        this.aoeRadius = options.aoeRadius || 0;
        this.effectPayload = options.effect || null; // Recibir efecto (ej: {type: 'burn', val: 5...})

        // Configuración visual según tipo
        if (this.type === 'cannon') {
            this.setFillStyle(0x000000); this.setRadius(8); this.speed = 300;
        } else if (this.type === 'mage') {
            this.setFillStyle(0x00ffff); this.setRadius(6); this.speed = 500;
        } else {
            this.setFillStyle(0xffff00); this.setRadius(4); this.speed = 600;
        }

        // Slow obsoleto (ahora usaremos effectPayload 'freeze')
        // Mantenemos compatibilidad por si acaso
        if (options.slowFactor && options.slowFactor < 1) {
            if (!this.effectPayload) {
                this.effectPayload = { type: 'freeze', val: 1 - options.slowFactor, duration: 2000 };
            }
        }
    }

    update(time, delta) {
        if (!this.target || !this.target.active) {
            this.destroy();
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 10) {
            this.hit(this.target);
        }
    }

    hit(enemy) {
        if (this.aoeRadius > 0) {
            this.scene.enemies.children.iterate(e => {
                if (e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.aoeRadius) {
                    e.takeDamage(this.damage);
                    if (this.effectPayload) e.applyStatusEffect(this.effectPayload); // Aplicar efecto AOE
                }
            });
            // Efecto visual explosión
            const boom = this.scene.add.circle(this.x, this.y, this.aoeRadius, 0xffa500, 0.5);
            this.scene.tweens.add({ targets: boom, alpha: 0, scale: 0.5, duration: 200, onComplete: () => boom.destroy() });
        } else {
            enemy.takeDamage(this.damage);
            if (this.effectPayload) enemy.applyStatusEffect(this.effectPayload); // Aplicar efecto Single
        }
        this.destroy();
    }
}