// src/entities/projectiles/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.bodyShape = scene.add.circle(0, 0, 4, 0xffffff);
        this.add(this.bodyShape);
        
        this.speed = 600;
        this.damage = 10;
        this.target = null;
        this.isParabolic = false;
        this.aoeRadius = 0;
        this.effect = null;
        this.lifespan = 2000;
    }

    fire(target, options) {
        this.target = target;
        this.damage = options.damage || 10;
        this.aoeRadius = options.aoe || 0;
        this.effect = options.effect || null;
        
        const type = options.type || 'arrow';

        if (type === 'cannon') {
            this.bodyShape.setFillStyle(0x000000); 
            this.bodyShape.setRadius(6);
            this.isParabolic = true;
            this.speed = 350; 
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            this.timer = 0;

        } else if (type === 'mage') {
            this.bodyShape.setFillStyle(0x00ffff); 
            this.bodyShape.setRadius(4);
            this.isParabolic = false;
            this.speed = 500;
        } else {
            this.bodyShape.setFillStyle(0xffff00); 
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 700;
        }
    }

    update(time, delta) {
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
            return;
        }

        if (this.isParabolic) {
            this.timer += delta;
            const t = Math.min(this.timer / this.duration, 1);

            const cx = Phaser.Math.Linear(this.startX, this.destX, t);
            const cy = Phaser.Math.Linear(this.startY, this.destY, t);
            const height = 150 * Math.sin(t * Math.PI);
            
            this.x = cx;
            this.y = cy - height;

            if (t >= 1) {
                this.hit(null); 
            }
        } else {
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
        // --- CORRECCIÓN AQUÍ: Validación de seguridad ---
        if (!this.scene || !this.scene.enemies) {
            this.destroy();
            return;
        }

        if (this.aoeRadius > 0) {
            this.createExplosion();
            
            // Usar getChildren() para obtener un array seguro y validar 'active'
            const enemies = this.scene.enemies.getChildren();
            
            enemies.forEach(enemy => {
                // Verificar que el enemigo existe y está activo antes de calcular distancia
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        enemy.takeDamage(this.damage);
                        if (this.effect) enemy.applyStatus(this.effect);
                    }
                }
            });
        } 
        else if (directTarget && directTarget.active) {
            directTarget.takeDamage(this.damage);
            if (this.effect) directTarget.applyStatus(this.effect);
        }

        this.destroy();
    }

    createExplosion() {
        if(!this.scene) return;
        const circle = this.scene.add.circle(this.x, this.y, 10, 0xff4500, 0.7);
        this.scene.tweens.add({
            targets: circle,
            scale: this.aoeRadius / 10, 
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }
}