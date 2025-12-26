// src/entities/projectiles/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Visual del proyectil (por defecto un punto, se cambia al disparar)
        this.bodyShape = scene.add.circle(0, 0, 4, 0xffffff);
        this.add(this.bodyShape);
        
        this.speed = 400;
        this.target = null;
        this.damage = 10;
        this.aoeRadius = 0; // Radio de explosión
        this.effect = null; // Efectos (slow, burn)
        this.isParabolic = false; // Para cañones
        this.lifespan = 2000; // Tiempo de vida en ms
    }

    fire(target, options) {
        this.target = target;
        this.damage = options.damage || 10;
        this.effect = options.effect || null;
        this.aoeRadius = options.aoe || 0;
        
        // Configuración visual según tipo
        const type = options.type || 'arrow';
        
        if (type === 'archer') {
            this.bodyShape.setFillStyle(0xffff00); // Flecha amarilla
            this.bodyShape.setRadius(3);
            this.speed = 600;
            this.isParabolic = false;
        } else if (type === 'cannon') {
            this.bodyShape.setFillStyle(0x000000); // Bala negra
            this.bodyShape.setRadius(6);
            this.speed = 300;
            this.isParabolic = true;
            this.aoeRadius = 100; // Radio de explosión por defecto
            this.startX = this.x;
            this.startY = this.y;
            this.progress = 0; // Para la parábola
        } else if (type === 'mage') {
            this.bodyShape.setFillStyle(0x00ffff); // Magia cyan
            this.bodyShape.setRadius(4);
            this.speed = 450;
            this.isParabolic = false;
        }

        // Si es parabólico, calculamos la duración estimada para llegar
        if (this.isParabolic && target) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
            this.duration = (dist / this.speed) * 1000;
            this.timer = 0;
            // Predecir dónde estará el enemigo (básico)
            this.destX = target.x;
            this.destY = target.y;
        }
    }

    update(time, delta) {
        // Matar si sale de límites o tiempo
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
            return;
        }

        if (this.isParabolic) {
            // Movimiento Parabólico (Cañón)
            this.timer += delta;
            this.progress = this.timer / this.duration;
            
            if (this.progress >= 1) {
                this.hit(null); // Impacto en el suelo/destino
                return;
            }

            // Interpolación lineal hacia el destino
            const currentX = Phaser.Math.Linear(this.startX, this.destX, this.progress);
            const currentY = Phaser.Math.Linear(this.startY, this.destY, this.progress);
            
            // Arco de altura
            const height = 100 * Math.sin(this.progress * Math.PI); // Sube y baja
            
            this.x = currentX;
            this.y = currentY - height;

        } else {
            // Movimiento Directo (Arquero/Mago)
            if (!this.target || !this.target.active) {
                this.destroy();
                return;
            }

            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
        }
    }

    hit(directTarget) {
        // 1. Daño en Área (Cañones)
        if (this.aoeRadius > 0) {
            this.createExplosionEffect();
            if (this.scene && this.scene.enemies) {
                this.scene.enemies.children.iterate(enemy => {
                    if (enemy.active && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) <= this.aoeRadius) {
                        enemy.takeDamage(this.damage);
                        if (this.effect) enemy.applyStatusEffect(this.effect);
                    }
                });
            }
        } 
        // 2. Daño Directo (Arqueros/Magos)
        else if (directTarget) {
            directTarget.takeDamage(this.damage);
            if (this.effect) directTarget.applyStatusEffect(this.effect);
        }

        this.destroy();
    }

    createExplosionEffect() {
        // Efecto visual simple de explosión
        const circle = this.scene.add.circle(this.x, this.y, 10, 0xffaa00, 0.8);
        this.scene.tweens.add({
            targets: circle,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }
}