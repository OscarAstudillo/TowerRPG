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
        this.isParabolic = false; // MANTENIDO
        this.aoeRadius = 0;
        this.effect = null;
        this.lifespan = 2000;
        this.chainCount = 0; // Para Tesla
        this.type = 'arrow';
    }

    fire(target, options) {
        this.target = target;
        this.damage = options.damage || 10;
        this.aoeRadius = options.aoe || 0;
        this.effect = options.effect || null;
        this.type = options.type || 'arrow';
        
        // Configurar Cadena si es Tesla
        if (this.effect && this.effect.type === 'chain') {
            this.chainCount = this.effect.val;
        }

        // --- LÓGICA VISUAL Y DE MOVIMIENTO ---
        if (this.type === 'cannon') {
            this.bodyShape.setFillStyle(0x000000); 
            this.bodyShape.setRadius(6);
            this.isParabolic = true;
            this.speed = 350; 
            
            // Datos para parábola
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            this.timer = 0;

        } else if (this.type === 'mage') {
            this.bodyShape.setFillStyle(0x00ffff); 
            this.bodyShape.setRadius(4);
            this.isParabolic = false;
            this.speed = 500;
        } else if (this.type === 'tesla') { // NUEVO
            this.bodyShape.setFillStyle(0xffff00); // Amarillo Rayo
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 900; // Muy rápido
        } else if (this.type === 'poison') { // NUEVO
            this.bodyShape.setFillStyle(0x00ff00); // Verde Veneno
            this.bodyShape.setRadius(5);
            this.isParabolic = true; // Frasco parabólico
            this.speed = 400;
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            this.timer = 0;
        } else if (this.type === 'quake') { // NUEVO
            // Quake es instantáneo, no viaja. Se destruye al instante y aplica daño.
            this.destroy(); 
            return; 
        } else { // Archer default
            this.bodyShape.setFillStyle(0xffffff); 
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 700;
        }

        // Si no es parabólico, iniciar movimiento recto
        if (!this.isParabolic && this.target && this.target.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
        }
    }

    update(time, delta) {
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
            return;
        }

        if (this.isParabolic) {
            // Lógica parabólica (Cannon / Poison)
            this.timer += delta;
            const t = Math.min(this.timer / this.duration, 1);

            const cx = Phaser.Math.Linear(this.startX, this.destX, t);
            const cy = Phaser.Math.Linear(this.startY, this.destY, t);
            const height = 150 * Math.sin(t * Math.PI); // Arco
            
            this.x = cx;
            this.y = cy - height;

            if (t >= 1) {
                this.hit(null); 
            }
        } else {
            // Lógica guiada (Homing)
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
        // Validación de seguridad esencial
        if (!this.scene || !this.scene.enemies) {
            this.destroy();
            return;
        }

        // 1. Daño en Área (Cannon / Poison / Quake)
        if (this.aoeRadius > 0) {
            this.createExplosion(); // Efecto visual
            
            const enemies = this.scene.enemies.getChildren();
            
            enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        // Daño completo si es poison, mitad si es splash de cañón
                        let dmg = (this.type === 'poison') ? this.damage : this.damage * 0.5;
                        enemy.takeDamage(dmg);
                        if (this.effect) enemy.applyStatus(this.effect);
                    }
                }
            });
        } 
        // 2. Impacto Directo (Archer / Mage / Tesla)
        else if (directTarget && directTarget.active) {
            directTarget.takeDamage(this.damage);
            if (this.effect) directTarget.applyStatus(this.effect);
            
            // Lógica Tesla (Chain Lightning)
            if (this.chainCount > 0) {
                this.chainCount--;
                const nextTarget = this.findNextChainTarget(directTarget);
                if (nextTarget) {
                    // Reutilizar proyectil para saltar al siguiente
                    this.x = directTarget.x;
                    this.y = directTarget.y;
                    this.target = nextTarget;
                    this.damage *= 0.8; // Reducir daño por salto
                    this.lifespan = 1000; // Resetear vida
                    
                    // Recalcular trayectoria
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, nextTarget.x, nextTarget.y);
                    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
                    return; // NO DESTRUIR
                }
            }
        }

        this.destroy();
    }

    findNextChainTarget(currentEnemy) {
        const range = 150;
        let closest = null;
        let minDist = Infinity;
        
        if (!this.scene || !this.scene.enemies) return null;

        this.scene.enemies.children.iterate(e => {
            if (e !== currentEnemy && e.active && !e.isDead) { // No saltar al mismo
                const dist = Phaser.Math.Distance.Between(currentEnemy.x, currentEnemy.y, e.x, e.y);
                if (dist < range && dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            }
        });
        return closest;
    }

    createExplosion() {
        if(!this.scene) return;
        
        let color = 0xff4500; // Naranja explosión default
        if (this.type === 'poison') color = 0x00ff00; // Verde veneno
        
        const circle = this.scene.add.circle(this.x, this.y, 10, color, 0.7);
        this.scene.tweens.add({
            targets: circle,
            scale: this.aoeRadius / 10, 
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }
}