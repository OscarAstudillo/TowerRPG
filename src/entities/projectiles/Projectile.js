import Phaser from 'phaser';
import SoundManager from '../../systems/SoundManager.js'; 

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.sprite = scene.add.sprite(0, 0, 'base_projectile');
        this.add(this.sprite);
        
        this.resetValues(); // Inicialización limpia
        
        if (this.body) {
            this.body.setVelocity(0, 0);
            this.body.enable = true;
        }
    }

    resetValues() {
        this.speed = 600;
        this.damage = 10;
        this.isCrit = false; // NUEVO: Flag de crítico
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
        
        if (this.body) {
            this.body.setVelocity(0, 0);
            this.body.enable = true;
        }
        
        this.alpha = 1;
        this.scale = 1;
        this.rotation = 0;
    }

    fire(target, options) {
        this.resetValues();
        this.setActive(true);
        this.setVisible(true);

        this.sprite.setVisible(true);
        this.sprite.setTint(0xffffff);
        this.sprite.setScale(1);

        this.target = target;
        this.damage = options.damage || 10;
        this.isCrit = options.isCrit || false; // RECIBIR CRÍTICO
        this.aoeRadius = options.aoe || 0;
        this.effect = options.effect || null;
        this.type = options.type || 'arrow';
        
        if (this.effect && this.effect.type === 'chain') {
            this.chainCount = this.effect.val;
        }

        // Configuración visual según tipo
        if (this.type === 'cannon') {
            this.sprite.setTint(0x000000); 
            this.sprite.setScale(1.5);
            this.isParabolic = true;
            this.speed = 350; 
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;

        } else if (this.type === 'mage') {
            this.sprite.setTint(0x00ffff); 
            this.isParabolic = false;
            this.speed = 500;
            
        } else if (this.type === 'tesla') { 
            this.sprite.setTint(0xffff00); 
            this.isParabolic = false;
            this.speed = 800;
            
        } else if (this.type === 'poison') { 
            this.sprite.setTint(0x00ff00); 
            this.isParabolic = true; 
            this.speed = 400;
            
            this.startX = this.x;
            this.startY = this.y;
            this.destX = target.x;
            this.destY = target.y;
            
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.destX, this.destY);
            this.duration = (dist / this.speed) * 1000;
            
        } else if (this.type === 'quake') { 
            this.hit(null); 
            return; 
            
        } else { // Archer default
            this.sprite.setTint(0xffffff); 
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
        if (!this.active) return;

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
                            // Solo mostrar daño visual en charcos si es relevante, o muy pequeño
                            // if(this.scene.showDamage) this.scene.showDamage(e.x, e.y, 1, false);
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
            
            if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 20) {
                this.hit(this.target);
            }
        }
    }

    hit(directTarget) {
        if (!this.scene || !this.scene.enemies) {
            this.recycle();
            return;
        }
        
        if (this.isParabolic) {
            this.x = this.destX;
            this.y = this.destY;
        }

        // Lógica de Veneno (Puddle)
        if (this.type === 'poison') {
            this.isPuddle = true;
            this.body.setVelocity(0, 0); 
            this.lifespan = 1500; 
            this.aoeRadius = this.aoeRadius || 60; 
            
            this.sprite.setTint(0x00ff00);
            this.sprite.setAlpha(0.5);
            this.sprite.setScale(this.aoeRadius / 8); 
            
            this.createExplosion(0x00ff00);
            SoundManager.playSound('hit'); 
            return; 
        }

        // Lógica AOE (Explosión)
        if (this.aoeRadius > 0) {
            const colorExplosion = (this.type === 'quake') ? 0x8b4513 : 0xffa500;
            this.createExplosion(colorExplosion); 
            
            SoundManager.playSound('shoot_cannon'); 

            const enemies = this.scene.enemies.getChildren();
            enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.aoeRadius) {
                        let dmg = (this.type === 'poison') ? this.damage : Math.floor(this.damage * 0.5);
                        enemy.takeDamage(dmg);
                        
                        // Mostrar daño AOE
                        if(this.scene.showDamage) this.scene.showDamage(enemy.x, enemy.y, dmg, false);
                        
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
        // Lógica Single Target
        else if (directTarget && directTarget.active) {
            if (this.hitIds.includes(directTarget)) return;
            this.hitIds.push(directTarget);

            directTarget.takeDamage(this.damage);
            
            // --- NUEVO: MOSTRAR DAÑO FLOTANTE ---
            if(this.scene.showDamage) {
                this.scene.showDamage(directTarget.x, directTarget.y, Math.floor(this.damage), this.isCrit);
            }
            // -------------------------------------

            if (this.effect) directTarget.applyStatus(this.effect);
            
            SoundManager.playSound('hit');

            if (this.scene.createHitEffect) {
                this.scene.createHitEffect(this.x, this.y, this.sprite.tintTopLeft);
            }

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