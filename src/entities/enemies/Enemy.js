// src/entities/enemies/Enemy.js
import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Rectangle {
    constructor(scene, path, speedMultiplier = 1, hpMultiplier = 1, isBoss = false) {
        // ... (Tu constructor sigue igual que antes) ...
        
        let color = 0xff0000; 
        let size = 32;        
        if (isBoss) {
            color = 0x800080; 
            size = 64;        
        }
        super(scene, path[0].x, path[0].y, size, size, color);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.isBoss = isBoss;
        let baseHp = 80;
        if (isBoss) baseHp = 2000;

        this.maxHp = baseHp * hpMultiplier;
        this.hp = this.maxHp;

        let baseSpeed = 50; 
        if (isBoss) baseSpeed = 30; 

        this.speed = baseSpeed * speedMultiplier;
        if (this.speed > 160) this.speed = 160;

        this.path = path;
        this.nextPointIndex = 1; 
        this.target = this.path[this.nextPointIndex];

        this.hpBar = scene.add.rectangle(this.x, this.y - (size/2 + 10), size, 5, 0x00ff00);
    }

    takeDamage(amount) {
        this.hp -= amount;
        
        const hpPercent = this.hp / this.maxHp;
        this.hpBar.width = (this.isBoss ? 64 : 32) * (hpPercent < 0 ? 0 : hpPercent);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 1
        });

        if (this.hp <= 0) {
            this.die(true); 
        }
    }

    // --- AQUÍ ESTÁ EL ARREGLO ---
    die(killedByPlayer) {
        const scene = this.scene; 
        if (this.hpBar) this.hpBar.destroy();
        
        if (killedByPlayer) {
            // Murió por disparos -> PREMIO
            if (scene.addEnemyReward) {
                const reward = this.coinReward || 20;
                scene.addEnemyReward(reward);
            }
            // Loot
            if (this.isBoss) {
                for(let i=0; i<5; i++) {
                    if (scene.spawnLoot) scene.spawnLoot(this.x + Phaser.Math.Between(-30,30), this.y + Phaser.Math.Between(-30,30));
                }
            } else {
                if (scene.spawnLoot) scene.spawnLoot(this.x, this.y);
            }
        } else {
            // --- CAMBIO: Murió por llegar al final -> CASTIGO ---
            // Llamamos a la función de la escena para quitar vida
            if (scene.onEnemyLeaks) {
                scene.onEnemyLeaks(10); // Quitamos 10 de vida
            }
        }
        
        this.destroy(); 
        
        // Avisar que la oleada puede avanzar
        if (scene && scene.checkWaveStatus) {
            scene.time.delayedCall(100, () => { scene.checkWaveStatus(); });
        }
    }

    update(time, delta) {
        if (!this.active) return;
        
        const offset = this.isBoss ? 40 : 20;
        if(this.hpBar) {
            this.hpBar.x = this.x;
            this.hpBar.y = this.y - offset;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (dist < 5) {
            this.nextPointIndex++;
            if (this.nextPointIndex >= this.path.length) {
                this.die(false); 
                return;
            }
            this.target = this.path[this.nextPointIndex];
        }

        this.scene.physics.moveToObject(this, this.target, this.speed);
    }
}