// src/entities/enemies/Enemy.js
import Phaser from 'phaser';
import RPGSystem from '../../systems/RPGSystem.js';

export default class Enemy extends Phaser.GameObjects.Rectangle {
    constructor(scene, path, speedMult, hpMult, isBoss) {
        const size = isBoss ? 40 : 20; 
        const color = isBoss ? 0x880000 : 0xff0000;
        super(scene, path[0].x, path[0].y, size, size, color);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        
        // Seguridad en HP
        const safeHpMult = hpMult || 1;
        this.hp = Math.floor(100 * safeHpMult);
        this.maxHp = this.hp;
        
        this.baseSpeed = (speedMult || 1) / 15000; 
        this.currentSpeed = this.baseSpeed;
        
        this.isBoss = isBoss;
        this.coinReward = isBoss ? 100 : 10;
        this.colorVal = color; 

        this.damage = 15; 
        this.lastAttackTime = 0;
        this.attackRate = 1000; 

        this.isSlowed = false;
        this.slowTimer = 0;

        this.hpBar = scene.add.rectangle(this.x, this.y - 15, 30, 5, 0x00ff00);
    }

    update(time, delta) {
        // Slow
        if (this.isSlowed) {
            this.slowTimer -= delta;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
                this.currentSpeed = this.baseSpeed;
                this.setFillStyle(this.colorVal); 
            }
        }

        this.follower.t += this.currentSpeed * delta;
        
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
        
        // Actualizar barra de vida CON SEGURIDAD
        this.hpBar.setPosition(this.x, this.y - 20);
        
        let hpPercent = this.hp / this.maxHp;
        if (isNaN(hpPercent)) hpPercent = 0;
        else if (hpPercent < 0) hpPercent = 0;
        
        this.hpBar.width = 30 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);
        
        this.checkAttackPlayer(time);
    }

    applySlow(factor, duration) {
        if (this.isBoss) return;
        this.isSlowed = true;
        this.currentSpeed = this.baseSpeed * factor; 
        this.slowTimer = duration;
        this.setFillStyle(0x00ffff); 
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
        let safeAmount = Number(amount);
        if (isNaN(safeAmount)) safeAmount = 0;

        this.hp -= safeAmount;
        
        if (this.scene && this.scene.showFloatingText) {
            const isCrit = Math.random() > 0.8; 
            const finalDamage = isCrit ? Math.floor(safeAmount * 1.5) : safeAmount;
            const color = isCrit ? '#ffaa00' : '#ffffff';
            
            if (isCrit) this.hp -= (finalDamage - safeAmount);

            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(finalDamage)}`, color);
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
                if (currentScene.createExplosion) currentScene.createExplosion(this.x, this.y, this.colorVal);
            }
            const xpAmount = this.isBoss ? 50 : 10;
            RPGSystem.gainHeroXP(xpAmount);
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