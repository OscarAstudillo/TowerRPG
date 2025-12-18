// src/entities/enemies/Enemy.js
import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Rectangle {
    constructor(scene, path, speedMult, hpMult, isBoss) {
        // Boss es más grande y oscuro
        const size = isBoss ? 40 : 20; 
        const color = isBoss ? 0x880000 : 0xff0000;
        
        super(scene, path[0].x, path[0].y, size, size, color);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        
        // Stats
        this.hp = 100 * hpMult;
        this.maxHp = this.hp;
        
        // --- CORRECCIÓN CRÍTICA DE VELOCIDAD ---
        // Antes: (100 * speedMult) / 10000 -> Demasiado rápido (0.1s)
        // Ahora: speedMult / 15000 -> Velocidad normal (unos 15 segundos en cruzar)
        this.speed = speedMult / 15000; 

        this.isBoss = isBoss;
        this.coinReward = 10;

        // Combate
        this.damage = 15; 
        this.lastAttackTime = 0;
        this.attackRate = 1000; 

        // Barra de Vida
        this.hpBar = scene.add.rectangle(this.x, this.y - 15, 30, 5, 0x00ff00);
    }

    update(time, delta) {
        // Movimiento por el camino
        this.follower.t += this.speed * delta;
        
        // Si llega al final
        if (this.follower.t >= 1) {
            this.hpBar.destroy();
            this.die(false); // false = Se escapó (daño al castillo)
            return;
        }

        // Calcular posición en la ruta
        const p1 = this.path[Math.floor(this.follower.t * (this.path.length - 1))];
        const p2 = this.path[Math.ceil(this.follower.t * (this.path.length - 1))];
        
        if (p1 && p2) {
            const segmentT = (this.follower.t * (this.path.length - 1)) % 1;
            this.x = Phaser.Math.Linear(p1.x, p2.x, segmentT);
            this.y = Phaser.Math.Linear(p1.y, p2.y, segmentT);
        }

        // Actualizar barra de vida
        this.hpBar.setPosition(this.x, this.y - 20);
        const hpPercent = this.hp / this.maxHp;
        this.hpBar.width = 30 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);

        // Lógica de ataque al héroe
        this.checkAttackPlayer(time);
    }

    checkAttackPlayer(time) {
        const player = this.scene.player;
        if (!player || !player.active || player.isDead) return;

        // Si toca al jugador, muerde
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
        if (this.hp <= 0) {
            this.die(true);
        }
    }

    die(killedByPlayer) {
        this.hpBar.destroy();
        if (killedByPlayer) {
            // Premio por matar
            if (this.scene.addEnemyReward) this.scene.addEnemyReward(this.coinReward);
            if (this.scene.spawnLoot) this.scene.spawnLoot(this.x, this.y);
        } else {
            // Castigo por escapar (Daño a la base)
            if (this.scene.onEnemyLeaks) this.scene.onEnemyLeaks(1); 
        }
        this.destroy(); 
        
        // Avisar a la escena para revisar si acabó la oleada
        if (this.scene && this.scene.checkWaveStatus) {
            this.scene.time.delayedCall(100, () => { this.scene.checkWaveStatus(); });
        }
    }
}