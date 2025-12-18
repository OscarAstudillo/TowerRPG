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
        
        // Velocidad corregida (Lenta para que no parpadeen)
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
        // Verificar que la escena y el jugador existan
        if (!this.scene || !this.scene.player) return;
        
        const player = this.scene.player;
        if (!player.active || player.isDead) return;

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
        // --- CORRECCIÓN AQUÍ ---
        // 1. Guardamos la referencia a la escena ANTES de destruirnos
        const currentScene = this.scene; 

        this.hpBar.destroy();
        
        if (killedByPlayer) {
            // Usamos currentScene por seguridad
            if (currentScene && currentScene.addEnemyReward) currentScene.addEnemyReward(this.coinReward);
            if (currentScene && currentScene.spawnLoot) currentScene.spawnLoot(this.x, this.y);
        } else {
            // Castigo por escapar (Daño a la base)
            if (currentScene && currentScene.onEnemyLeaks) currentScene.onEnemyLeaks(1); 
        }

        // 2. Ahora sí nos destruimos
        this.destroy(); 
        
        // 3. Avisar a la escena que alguien murió (usando la referencia guardada)
        // Esto asegura que la oleada avance incluso si "this.scene" ya es null
        if (currentScene && currentScene.checkWaveStatus) {
            currentScene.time.delayedCall(100, () => { 
                currentScene.checkWaveStatus(); 
            });
        }
    }
}