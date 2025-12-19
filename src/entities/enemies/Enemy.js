// src/entities/enemies/Enemy.js
import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Rectangle {
    constructor(scene, path, speedMult, hpMult, isBoss) {
        const size = isBoss ? 40 : 20; 
        const color = isBoss ? 0x880000 : 0xff0000;
        super(scene, path[0].x, path[0].y, size, size, color);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        
        this.hp = 100 * hpMult;
        this.maxHp = this.hp;
        this.speed = speedMult / 15000; 
        this.isBoss = isBoss;
        this.coinReward = isBoss ? 100 : 10;
        this.colorVal = color; // Guardamos color para partículas

        this.damage = 15; 
        this.lastAttackTime = 0;
        this.attackRate = 1000; 

        this.hpBar = scene.add.rectangle(this.x, this.y - 15, 30, 5, 0x00ff00);
    }

    update(time, delta) {
        this.follower.t += this.speed * delta;
        if (this.follower.t >= 1) {
            this.hpBar.destroy();
            this.die(false); 
            return;
        }
        const p1 = this.path[Math.floor(this.follower.t * (this.path.length - 1))];
        const p2 = this.path[Math.ceil(this.follower.t * (this.path.length - 1))];
        if (p1 && p2) {
            const segmentT = (this.follower.t * (this.path.length - 1)) % 1;
            this.x = Phaser.Math.Linear(p1.x, p2.x, segmentT);
            this.y = Phaser.Math.Linear(p1.y, p2.y, segmentT);
        }
        this.hpBar.setPosition(this.x, this.y - 20);
        const hpPercent = this.hp / this.maxHp;
        this.hpBar.width = 30 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);
        this.checkAttackPlayer(time);
    }

    checkAttackPlayer(time) {
        if (!this.scene || !this.scene.player) return;
        const player = this.scene.player;
        if (!player.active || player.isDead) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist < 40) {
            if (time > this.lastAttackTime + this.attackRate) {
                player.takeDamage(this.damage);
                this.lastAttackTime = time;
                this.scene.tweens.add({ targets: this, scale: 1.5, yoyo: true, duration: 100 });
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        
        // --- TEXTO FLOTANTE DE DAÑO ---
        if (this.scene && this.scene.showFloatingText) {
            const isCrit = Math.random() > 0.8; // Simulación de crítico (20%)
            const finalDamage = isCrit ? Math.floor(amount * 1.5) : amount;
            const color = isCrit ? '#ffaa00' : '#ffffff';
            const scale = isCrit ? 1.5 : 1;
            
            // Ajustamos HP real si fue crítico
            if (isCrit) this.hp -= (finalDamage - amount);

            this.scene.showFloatingText(this.x, this.y - 20, `-${finalDamage}`, color);
        }

        if (this.hp <= 0) {
            this.die(true);
        }
    }

    die(killedByPlayer) {
        const currentScene = this.scene; 
        this.hpBar.destroy();
        
        if (killedByPlayer) {
            if (currentScene) {
                if(currentScene.addEnemyReward) currentScene.addEnemyReward(this.coinReward);
                if(currentScene.spawnLoot) currentScene.spawnLoot(this.x, this.y);
                
                // --- EXPLOSIÓN DE PARTÍCULAS ---
                if (currentScene.createExplosion) {
                    currentScene.createExplosion(this.x, this.y, this.colorVal);
                }
            }
        } else {
            if (currentScene && currentScene.onEnemyLeaks) currentScene.onEnemyLeaks(1); 
        }

        this.destroy(); 
        
        if (currentScene && currentScene.checkWaveStatus) {
            currentScene.time.delayedCall(100, () => { 
                currentScene.checkWaveStatus(); 
            });
        }
    }
}