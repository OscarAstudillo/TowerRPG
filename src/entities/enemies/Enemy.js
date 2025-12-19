// src/entities/enemies/Enemy.js
import Phaser from 'phaser';
// YA NO IMPORTAMOS RPGSystem AQUÍ PARA EVITAR ERRORES

export default class Enemy extends Phaser.GameObjects.Rectangle {
    constructor(scene, path, levelDifficulty, type = 'normal') {
        let color = 0xff0000; 
        let size = 20;
        
        if (type === 'tank') { color = 0x00008b; size = 26; } 
        else if (type === 'speed') { color = 0xffff00; size = 16; } 
        else if (type === 'healer') { color = 0xff69b4; size = 22; } 
        else if (type === 'boss') { color = 0x880000; size = 45; } 

        super(scene, path[0].x, path[0].y, size, size, color);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.type = type;
        this.colorVal = color;

        let hpBase = 100;
        let speedBase = 1;
        let armor = 0; 
        let castleDamage = 1; 

        if (type === 'normal') { hpBase = 100; speedBase = 1.0; }
        else if (type === 'tank') { hpBase = 250; speedBase = 0.6; armor = 5; }
        else if (type === 'speed') { hpBase = 60; speedBase = 1.8; }
        else if (type === 'healer') { hpBase = 120; speedBase = 0.9; }
        else if (type === 'boss') { 
            hpBase = 1500; speedBase = 0.5; armor = 10; castleDamage = 10; 
        }

        this.hp = Math.floor(hpBase * levelDifficulty);
        this.maxHp = this.hp;
        this.baseSpeed = speedBase / 15000; 
        this.currentSpeed = this.baseSpeed;
        this.armor = armor;
        this.leakDamage = castleDamage;
        
        this.coinReward = (type === 'boss') ? 100 : (type === 'tank' ? 20 : 10);
        this.xpReward = (type === 'boss') ? 100 : (type === 'tank' ? 20 : 10); // Nueva propiedad para que GameScene la lea
        this.damage = (type === 'boss') ? 50 : 15;

        this.lastAttackTime = 0;
        this.attackRate = 1000;
        this.healTimer = 0;
        this.isSlowed = false;
        this.slowTimer = 0;

        this.hpBar = scene.add.rectangle(this.x, this.y - 20, 30, 5, 0x00ff00);
    }

    update(time, delta) {
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
        
        this.hpBar.setPosition(this.x, this.y - 20);
        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.hpBar.width = 30 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);
        
        if (this.type === 'healer') {
            this.healTimer += delta;
            if (this.healTimer > 2000) {
                this.performHeal();
                this.healTimer = 0;
            }
        }

        this.checkAttackPlayer(time);
    }

    performHeal() {
        if (!this.scene || !this.scene.enemies) return;
        const healRange = 100;
        const healAmount = 20;
        let healedSomeone = false;

        this.scene.enemies.children.iterate(enemy => {
            if (enemy !== this && enemy.active && !enemy.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist < healRange && enemy.hp < enemy.maxHp) {
                    enemy.hp = Math.min(enemy.hp + healAmount, enemy.maxHp);
                    healedSomeone = true;
                    if (this.scene.showFloatingText) this.scene.showFloatingText(enemy.x, enemy.y, "+HP", '#ff69b4');
                }
            }
        });

        if (healedSomeone) this.scene.tweens.add({ targets: this, scale: 1.5, yoyo: true, duration: 200 });
    }

    applySlow(factor, duration) {
        if (this.type === 'boss') return; 
        this.isSlowed = true;
        this.currentSpeed = this.baseSpeed * factor; 
        this.slowTimer = duration;
        this.setFillStyle(0x00ffff); 
    }

    takeDamage(amount) {
        const dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        
        if (this.scene && this.scene.showFloatingText) {
            const isCrit = Math.random() > 0.9; 
            const color = isCrit ? '#ffaa00' : '#ffffff';
            this.scene.showFloatingText(this.x, this.y - 20, `-${Math.floor(dmg)}`, color);
        }

        if (this.hp <= 0) {
            this.die(true);
        }
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

    die(killedByPlayer) {
        const currentScene = this.scene; 
        if (this.hpBar) this.hpBar.destroy();
        
        if (killedByPlayer) {
            // Delegamos la lógica de recompensas a la Escena
            if (currentScene && currentScene.onEnemyKilled) {
                currentScene.onEnemyKilled(this);
            }
        } else {
            // Se escapó
            if (currentScene && currentScene.onEnemyLeaks) {
                currentScene.onEnemyLeaks(this.leakDamage); 
            }
        }

        this.destroy(); 
        
        if (currentScene && currentScene.checkWaveStatus) {
            currentScene.time.delayedCall(100, () => { 
                currentScene.checkWaveStatus(); 
            });
        }
    }
}