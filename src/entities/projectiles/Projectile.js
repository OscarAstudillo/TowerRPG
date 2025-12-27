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
        
        // Propiedades Nuevas
        this.chainCount = 0;   // Tesla
        this.isPuddle = false; // Veneno
        this.puddleTick = 0;
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
            
        } else if (this.type === 'tesla') { 
            this.bodyShape.setFillStyle(0xffff00); // Amarillo Rayo
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 800; // Rápido
            
        } else if (this.type === 'poison') { 
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
            
        } else if (this.type === 'quake') { 
            // QUAKE: Detonación Instantánea en el lugar de la torre
            this.hit(null); 
            return; // No sigue procesando movimiento
            
        } else { // Archer default
            this.bodyShape.setFillStyle(0xffffff); 
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 700;
        }

        // Iniciar movimiento si no es Quake (que ya retornó)
        if (!this.isParabolic && this.target && this.target.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
        }
    }

    update(time, delta) {
        // --- LÓGICA CHARCO DE VENENO ---
        if (this.isPuddle) {
            this.lifespan -= delta;
            this.puddleTick += delta;
            
            if (this.lifespan <= 0) {
                this.destroy();
                return;
            }

            // Aplicar veneno cada 200ms a quien pise el charco
            if (this.puddleTick >= 200) {
                this.puddleTick = 0;
                // Buscar enemigos en el área
                if (this.scene && this.scene.enemies) {
                    const enemies = this.scene.enemies.getChildren();
                    enemies.forEach(e => {
                        if (e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.aoeRadius) {
                            // Aplicar efecto de veneno si lo tiene
                            if (this.effect) e.applyStatus(this.effect);
                            // Pequeño daño por estar encima
                            e.takeDamage(1);
                        }
                    });
                }
            }
            return; // El charco no se mueve
        }

        // --- LÓGICA PROYECTIL NORMAL ---
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
            return;
        }

        if (this.isParabolic) {
            // Cañón / Veneno (Vuelo)
            this.timer += delta;
            const t = Math.min(this.timer / this.duration, 1);

            const cx = Phaser.Math.Linear(this.startX, this.destX, t);
            const cy = Phaser.Math.Linear(this.startY, this.destY, t);
            const height = 100 * Math.sin(t * Math.PI); // Arco
            
            this.x = cx;
            this.y = cy - height;

            if (t >= 1) {
                this.hit(null); 
            }
        } else {
            // Guiado simple (Homing)
            if (!this.target || !this.target.active) {
                this.destroy();
                return;
            }
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
            
            // Check manual de distancia por si la física falla a alta velocidad
            if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 10) {
                this.hit(this.target);
            }
        }
    }

    hit(directTarget) {
        if (!this.scene || !this.scene.enemies) {
            this.destroy();
            return;
        }

        // --- LÓGICA VENENO (CREAR CHARCO) ---
        if (this.type === 'poison') {
            this.isPuddle = true;
            this.body.setVelocity(0, 0); // Detener movimiento
            this.lifespan = 1500; // Duración del charco
            this.aoeRadius = this.aoeRadius || 60; // Radio por defecto si falta
            
            // Cambio visual a charco
            this.bodyShape.clear(); // Borrar círculo anterior
            this.bodyShape = this.scene.add.ellipse(0, 0, this.aoeRadius * 2, this.aoeRadius, 0x00ff00, 0.4);
            this.add(this.bodyShape);
            
            // Primer tick de daño inmediato
            this.createExplosion(0x00ff00);
            return; // NO DESTRUIR, ahora es un charco
        }

        // --- DAÑO EN ÁREA (Cañón / Quake) ---
        if (this.aoeRadius > 0) {
            const colorExplosion = (this.type === 'quake') ? 0x8b4513 : 0xffa500;
            this.createExplosion(colorExplosion); 
            
            const enemies = this.scene.enemies.getChildren();
            enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        enemy.takeDamage(this.damage);
                        if (this.effect) enemy.applyStatus(this.effect);
                    }
                }
            });
        } 
        // --- IMPACTO DIRECTO (Archer / Mage / Tesla) ---
        else if (directTarget && directTarget.active) {
            directTarget.takeDamage(this.damage);
            if (this.effect) directTarget.applyStatus(this.effect);
            
            // --- LÓGICA TESLA (CADENA) ---
            if (this.chainCount > 0) {
                const nextTarget = this.findNextChainTarget(directTarget);
                if (nextTarget) {
                    // Efecto visual del rayo
                    this.drawLightning(this.x, this.y, nextTarget.x, nextTarget.y);

                    // Reutilizar proyectil para saltar
                    this.x = directTarget.x;
                    this.y = directTarget.y;
                    this.target = nextTarget;
                    this.damage = Math.floor(this.damage * 0.8); // Reduce daño
                    this.chainCount--;
                    this.lifespan = 1000; // Reset vida
                    
                    // Recalcular velocidad hacia nuevo objetivo
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, nextTarget.x, nextTarget.y);
                    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
                    
                    return; // NO DESTRUIR
                }
            }
        }

        this.destroy();
    }

    findNextChainTarget(currentEnemy) {
        const range = 200; // Rango de salto del rayo
        let closest = null;
        let minDist = Infinity;
        
        if (!this.scene || !this.scene.enemies) return null;

        this.scene.enemies.children.iterate(e => {
            if (e !== currentEnemy && e.active && !e.isDead) { 
                const dist = Phaser.Math.Distance.Between(currentEnemy.x, currentEnemy.y, e.x, e.y);
                if (dist < range && dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            }
        });
        return closest;
    }

    drawLightning(x1, y1, x2, y2) {
        if(!this.scene) return;
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xffff00, 1);
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        // Pequeño efecto zig-zag simple
        const midX = (x1 + x2) / 2 + (Math.random() * 20 - 10);
        const midY = (y1 + y2) / 2 + (Math.random() * 20 - 10);
        graphics.lineTo(midX, midY);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
        
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 200,
            onComplete: () => graphics.destroy()
        });
    }

    createExplosion(color = 0xff4500) {
        if(!this.scene) return;
        const circle = this.scene.add.circle(this.x, this.y, 10, color, 0.6);
        this.scene.tweens.add({
            targets: circle,
            scale: this.aoeRadius / 5, // Escalar visualmente
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }
}