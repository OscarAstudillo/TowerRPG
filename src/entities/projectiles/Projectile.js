import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        // No agregamos a la escena manualmente aquí, el Group lo hace.
        
        // Forma inicial
        this.bodyShape = scene.add.circle(0, 0, 4, 0xffffff);
        this.add(this.bodyShape);
        
        scene.physics.add.existing(this);
        
        // Valores por defecto
        this.speed = 600;
        this.damage = 10;
        this.target = null;
        this.isParabolic = false;
        this.aoeRadius = 0;
        this.effect = null;
        this.lifespan = 2000;
        this.chainCount = 0;
        this.isPuddle = false;
        this.puddleTick = 0;
        this.type = 'arrow';
        this.destX = 0;
        this.destY = 0;
        this.timer = 0;
        this.duration = 0;
    }

    // Limpiar variables al reciclar para que no herede datos viejos
    resetValues() {
        this.speed = 600;
        this.damage = 10;
        this.target = null;
        this.isParabolic = false;
        this.aoeRadius = 0;
        this.effect = null;
        this.lifespan = 2000;
        this.chainCount = 0;   
        this.isPuddle = false; 
        this.puddleTick = 0;
        this.type = 'arrow';
        this.destX = 0;
        this.destY = 0;
        this.timer = 0;
        this.duration = 0;
        
        if (this.body) {
            this.body.setVelocity(0, 0);
            this.body.enable = true;
        }
        
        this.alpha = 1;
        this.scale = 1;
        this.rotation = 0;
    }

    fire(target, options) {
        // 1. REVIVIR Y RESETEAR (Lógica de Pooling)
        this.resetValues();
        this.setActive(true);
        this.setVisible(true);

        // Asegurar forma base (por si era un charco antes)
        if (this.bodyShape) this.bodyShape.destroy();
        this.bodyShape = this.scene.add.circle(0, 0, 4, 0xffffff);
        this.add(this.bodyShape);

        // 2. CONFIGURAR NUEVO DISPARO
        this.target = target;
        this.damage = options.damage || 10;
        this.aoeRadius = options.aoe || 0;
        this.effect = options.effect || null;
        this.type = options.type || 'arrow';
        
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

        } else if (this.type === 'mage') {
            this.bodyShape.setFillStyle(0x00ffff); 
            this.bodyShape.setRadius(4);
            this.isParabolic = false;
            this.speed = 500;
            
        } else if (this.type === 'tesla') { 
            this.bodyShape.setFillStyle(0xffff00); 
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 800;
            
        } else if (this.type === 'poison') { 
            this.bodyShape.setFillStyle(0x00ff00); 
            this.bodyShape.setRadius(5);
            this.isParabolic = true; 
            this.speed = 400;
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            
        } else if (this.type === 'quake') { 
            this.hit(null); // Instantáneo
            return; 
            
        } else { // Archer default
            this.bodyShape.setFillStyle(0xffffff); 
            this.bodyShape.setRadius(3);
            this.isParabolic = false;
            this.speed = 700;
        }

        if (!this.isParabolic && this.target && this.target.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
        }
    }

    update(time, delta) {
        if (!this.active) return; // Si está inactivo, no gastar CPU

        // --- CHARCO DE VENENO ---
        if (this.isPuddle) {
            this.lifespan -= delta;
            this.puddleTick += delta;
            
            if (this.lifespan <= 0) {
                this.recycle();
                return;
            }

            if (this.puddleTick >= 200) {
                this.puddleTick = 0;
                if (this.scene && this.scene.enemies) {
                    const enemies = this.scene.enemies.getChildren();
                    enemies.forEach(e => {
                        if (e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.aoeRadius) {
                            if (this.effect) e.applyStatus(this.effect);
                            e.takeDamage(1);
                        }
                    });
                }
            }
            return;
        }

        // --- PROYECTIL NORMAL ---
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.recycle();
            return;
        }

        if (this.isParabolic) {
            this.timer += delta;
            const t = Math.min(this.timer / this.duration, 1);

            const cx = Phaser.Math.Linear(this.startX, this.destX, t);
            const cy = Phaser.Math.Linear(this.startY, this.destY, t);
            const height = 100 * Math.sin(t * Math.PI);
            
            this.x = cx;
            this.y = cy - height;

            if (t >= 1) {
                this.hit(null); 
            }
        } else {
            if (!this.target || !this.target.active) {
                this.recycle();
                return;
            }
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
            
            if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 10) {
                this.hit(this.target);
            }
        }
    }

    hit(directTarget) {
        if (!this.scene || !this.scene.enemies) {
            this.recycle();
            return;
        }

        // --- VENENO (CREAR CHARCO) ---
        if (this.type === 'poison') {
            if (this.destX !== 0 && this.destY !== 0) {
                this.x = this.destX;
                this.y = this.destY;
            }

            this.isPuddle = true;
            this.body.setVelocity(0, 0); 
            this.lifespan = 1500; 
            this.aoeRadius = this.aoeRadius || 60; 
            
            if (this.bodyShape) this.bodyShape.destroy(); 
            this.bodyShape = this.scene.add.ellipse(0, 0, this.aoeRadius * 2, this.aoeRadius, 0x00ff00, 0.4);
            this.add(this.bodyShape);
            
            this.createExplosion(0x00ff00);
            return; // No reciclamos aún, se queda como charco
        }

        // --- DAÑO EN ÁREA ---
        if (this.aoeRadius > 0) {
            const colorExplosion = (this.type === 'quake') ? 0x8b4513 : 0xffa500;
            this.createExplosion(colorExplosion); 
            
            const enemies = this.scene.enemies.getChildren();
            enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        let dmg = (this.type === 'poison') ? this.damage : this.damage * 0.5;
                        enemy.takeDamage(dmg);
                        
                        // Chance Stun (Quake)
                        if (this.effect) {
                            if (this.effect.type === 'chance_stun') {
                                if (Math.random() < this.effect.chance) {
                                    enemy.applyStatus({ type: 'stun', duration: this.effect.duration });
                                }
                            } else {
                                enemy.applyStatus(this.effect);
                            }
                        }
                    }
                }
            });
        } 
        // --- IMPACTO DIRECTO ---
        else if (directTarget && directTarget.active) {
            directTarget.takeDamage(this.damage);
            if (this.effect) directTarget.applyStatus(this.effect);
            
            // Tesla Chain
            if (this.chainCount > 0) {
                const nextTarget = this.findNextChainTarget(directTarget);
                if (nextTarget) {
                    this.drawLightning(this.x, this.y, nextTarget.x, nextTarget.y);

                    // Reutilizar mismo proyectil para el salto
                    this.x = directTarget.x;
                    this.y = directTarget.y;
                    this.target = nextTarget;
                    this.damage = Math.floor(this.damage * 0.8); 
                    this.chainCount--;
                    this.lifespan = 1000; 
                    
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, nextTarget.x, nextTarget.y);
                    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
                    return; 
                }
            }
        }

        this.recycle();
    }

    // --- LA MAGIA DEL POOLING ---
    recycle() {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) this.body.stop();
        this.setPosition(-1000, -1000); // Fuera de cámara
    }

    findNextChainTarget(currentEnemy) {
        const range = 200; 
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
        const midX = (x1 + x2) / 2 + (Math.random() * 20 - 10);
        const midY = (y1 + y2) / 2 + (Math.random() * 20 - 10);
        graphics.lineTo(midX, midY);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
        this.scene.tweens.add({ targets: graphics, alpha: 0, duration: 200, onComplete: () => graphics.destroy() });
    }

    createExplosion(color = 0xff4500) {
        if(!this.scene) return;
        const circle = this.scene.add.circle(this.x, this.y, 10, color, 0.6);
        this.scene.tweens.add({ targets: circle, scale: this.aoeRadius / 5, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
    }
}