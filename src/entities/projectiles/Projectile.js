import Phaser from 'phaser';
import SoundManager from '../../systems/SoundManager.js'; 

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.sprite = scene.add.sprite(0, 0, 'base_projectile');
        this.add(this.sprite);
        
        this.resetValues();
        
        if (this.body) {
            this.body.setVelocity(0, 0);
            this.body.enable = true;
            this.body.setCircle(5); // Colisión circular pequeña
        }
    }

    resetValues() {
        this.speed = 600;
        this.damage = 10;
        this.isCrit = false;
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
        this.hitIds = [];
        this.startX = 0;
        this.startY = 0;
        
        // NUEVO: Flag para saber si daña al jugador
        this.isHostile = false; 

        if (this.body) {
            this.body.setVelocity(0, 0);
            this.body.enable = true;
        }
        
        this.alpha = 1;
        this.scale = 1;
        this.rotation = 0;
    }

    // `isHostile` indica si lo disparó un enemigo
    fire(target, options, isHostile = false) {
        this.resetValues();
        this.setActive(true);
        this.setVisible(true);

        this.sprite.setVisible(true);
        this.sprite.setTint(options.color || 0xffffff); // Soporte color personalizado
        this.sprite.setScale(1);

        this.target = target;
        this.damage = options.damage || 10;
        this.isCrit = options.isCrit || false; 
        this.aoeRadius = options.aoe || 0;
        this.effect = options.effect || null;
        this.type = options.type || 'arrow';
        this.isHostile = isHostile;

        if (this.effect && this.effect.type === 'chain') {
            this.chainCount = this.effect.val;
        }

        // Si es hostil, el sprite puede rotar diferente o ser más visible
        if (this.isHostile) {
            this.sprite.setTint(0xff0000); // Tinte rojo por defecto si es enemigo
            if (options.color) this.sprite.setTint(options.color);
        }

        // Lógica de Movimiento (Igual que antes, pero adaptada)
        // ... (Copio tu lógica existente de cannon, mage, tesla, etc. para mantener compatibilidad)
        if (this.type === 'cannon') {
            this.sprite.setScale(1.5);
            this.isParabolic = true;
            this.speed = 350; 
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;

        } else if (this.type === 'mage' || this.type === 'magic') { // 'magic' para enemigos
            this.isParabolic = false;
            this.speed = 500;
            
        } else if (this.type === 'tesla') { 
            this.isParabolic = false;
            this.speed = 800;
            
        } else if (this.type === 'poison') { 
            this.isParabolic = true; 
            this.speed = 400;
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            
        } else { // Default (Flechas, Rocas)
            this.isParabolic = false;
            this.speed = options.speed || 700; // Usar velocidad de options si existe
        }

        if (!this.isParabolic && this.target && this.target.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.rotation = angle;
        }
    }

    update(time, delta) {
        if (!this.active) return;

        // ... (Lógica Puddle igual que antes) ...
        if (this.isPuddle) {
            this.lifespan -= delta;
            this.puddleTick += delta;
            if (this.lifespan <= 0) { this.recycle(); return; }
            if (this.puddleTick >= 200) {
                this.puddleTick = 0;
                // Si es hostil, daña al jugador. Si no, a enemigos.
                if (this.isHostile) {
                    const p = this.scene.player;
                    if (p && p.active && Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) <= this.aoeRadius) {
                        p.takeDamage(1);
                    }
                } else if (this.scene.enemies) {
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

        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.recycle();
            return;
        }

        if (this.isParabolic) {
            // ... (Lógica parabólica igual) ...
            // Solo actualizamos destino si el target sigue vivo
            if (this.target && this.target.active) {
                this.destX = this.target.x;
                this.destY = this.target.y;
            }
            this.timer += delta;
            const t = Math.min(this.timer / this.duration, 1);
            const cx = Phaser.Math.Linear(this.startX, this.destX, t);
            const cy = Phaser.Math.Linear(this.startY, this.destY, t);
            const height = 100 * Math.sin(t * Math.PI);
            this.x = cx;
            this.y = cy - height;
            if (t >= 1) { this.hit(null); }
        } else {
            // Movimiento directo
            // Si no hay target o murió, sigue recto (para que se pueda esquivar)
            // A diferencia de torres que reciclan, los proyectiles enemigos deben seguir viajando
            if (!this.target || !this.target.active) {
                // Sigue trayectoria actual
            } else {
                // Homing (Perseguir) ligero o directo
                // Para esquivar, es mejor NO actualizar el ángulo constantemente si es skill de "skillshot"
                // Pero por ahora dejémoslo teledirigido suave o directo
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
                this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
                this.rotation = angle;
                
                if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 20) {
                    this.hit(this.target);
                }
            }
        }
    }

    hit(directTarget) {
        // ... (Lógica de impacto) ...
        if (this.isParabolic) {
            this.x = this.destX;
            this.y = this.destY;
        }

        // Si es Hostil (Enemigo -> Jugador)
        if (this.isHostile) {
            // AOE Hostil
            if (this.aoeRadius > 0) {
                this.createExplosion(this.sprite.tintTopLeft);
                const p = this.scene.player;
                if (p && p.active && Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) <= this.aoeRadius) {
                    p.takeDamage(this.damage);
                    if (this.effect && p.applyStatus) p.applyStatus(this.effect); // Si el player soporta estados
                }
            } 
            // Single Target Hostil
            else if (directTarget && directTarget.active && directTarget === this.scene.player) {
                directTarget.takeDamage(this.damage);
                if (this.scene.cameras.main) this.scene.cameras.main.shake(100, 0.002);
            }
            this.recycle();
            return;
        }

        // Si es Amistoso (Jugador/Torre -> Enemigo) - Lógica original
        if (this.type === 'poison') {
             // ... (Lógica veneno igual) ...
             this.isPuddle = true;
             this.body.setVelocity(0,0);
             this.lifespan = 1500;
             this.aoeRadius = this.aoeRadius || 60;
             this.sprite.setTint(0x00ff00);
             this.sprite.setAlpha(0.5);
             this.sprite.setScale(this.aoeRadius / 8);
             this.createExplosion(0x00ff00);
             return;
        }

        if (this.aoeRadius > 0) {
            // ... (Lógica AOE Amistoso) ...
            const colorExplosion = (this.type === 'quake') ? 0x8b4513 : 0xffa500;
            this.createExplosion(colorExplosion);
            const enemies = this.scene.enemies.getChildren();
            enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        let dmg = (this.type === 'poison') ? this.damage : Math.floor(this.damage * 0.5);
                        enemy.takeDamage(dmg);
                        if(this.scene.showDamage) this.scene.showDamage(enemy.x, enemy.y, dmg, false);
                        if (this.effect) enemy.applyStatus(this.effect);
                    }
                }
            });
        } else if (directTarget && directTarget.active) {
            // ... (Lógica Single Amistoso) ...
            if (this.hitIds.includes(directTarget)) return;
            this.hitIds.push(directTarget);
            directTarget.takeDamage(this.damage);
            if(this.scene.showDamage) this.scene.showDamage(directTarget.x, directTarget.y, Math.floor(this.damage), this.isCrit);
            if (this.effect) directTarget.applyStatus(this.effect);
            SoundManager.playSound('hit');
            if (this.scene.createHitEffect) this.scene.createHitEffect(this.x, this.y, this.sprite.tintTopLeft);
            
            // Chain Logic
            if (this.chainCount > 0) {
                const nextTarget = this.findNextChainTarget(this.hitIds); 
                if (nextTarget) {
                    this.drawLightning(this.x, this.y, nextTarget.x, nextTarget.y);
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

    recycle() {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) this.body.stop();
        this.setPosition(-1000, -1000);
    }

    // ... (findNextChainTarget, drawLightning, createExplosion iguales) ...
    findNextChainTarget(excludedEnemies) {
        const range = 250; 
        let closest = null;
        let minDist = Infinity;
        if (!this.scene || !this.scene.enemies) return null;
        this.scene.enemies.children.iterate(e => {
            if (e.active && !e.isDead && !excludedEnemies.includes(e)) { 
                const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
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
        if (this.scene.createExplosion) {
            this.scene.createExplosion(this.x, this.y, color);
        } else {
            const circle = this.scene.add.circle(this.x, this.y, 10, color, 0.6);
            this.scene.tweens.add({ targets: circle, scale: this.aoeRadius / 5, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
        }
    }
}