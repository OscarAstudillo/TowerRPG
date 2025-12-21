// src/entities/enemies/Enemy.js
import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, path, levelDifficulty, type = 'normal') {
        super(scene, path[0].x, path[0].y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.type = type;
        this.levelDifficulty = levelDifficulty;

        // Detectar Bioma (Nivel 1, 2, 3)
        const levelId = (scene.currentLevelData && scene.currentLevelData.id) ? scene.currentLevelData.id : 1;

        // Configuración Visual y Stats
        let color = 0xff0000;
        let size = 20;
        let hpBase = 100;
        let speedBase = 1.0;
        let armor = 0;
        let castleDamage = 1;
        
        // --- BALANCEO DE RECOMPENSAS ($$$) ---
        let goldDrop = 25; 
        let xpDrop = 15;

       // Tipos Normales
        if (type === 'normal') { 
            hpBase = 100; speedBase = 1.0; goldDrop = 25; 
            if (levelId === 2) { color = 0xDAA520; speedBase = 1.2; hpBase = 90; } // Arena
            else if (levelId === 3) { color = 0x8B0000; speedBase = 0.9; hpBase = 130; } // Magma
        }
        else if (type === 'tank') { 
            hpBase = 250; speedBase = 0.6; armor = 5; color = 0x00008b; size = 26; 
            goldDrop = 40; xpDrop = 30; 
            if (levelId === 2) { color = 0x8B4513; armor = 3; } // Escarabajo
            else if (levelId === 3) { color = 0x2F4F4F; armor = 10; hpBase = 300; } // Golem Obsidiana
        }
        else if (type === 'speed') { 
            hpBase = 60; 
            speedBase = 1.4; 
            color = 0xffff00; size = 16; 
            goldDrop = 15; 
            if (levelId === 2) { speedBase = 1.6; color = 0xFFD700; } // Escorpión
            else if (levelId === 3) { speedBase = 1.5; color = 0xFF4500; } // Diablillo
        }
        else if (type === 'healer') { 
            hpBase = 120; speedBase = 0.9; color = 0xff69b4; size = 22; 
            goldDrop = 30;
        }
        
        // JEFES
        else if (type.startsWith('boss')) {
            speedBase = 0.4; armor = 10; size = 50; castleDamage = 20;
            goldDrop = 500; 
            xpDrop = 200;

            if (type === 'boss_goblin') { hpBase = 2000; color = 0x006400; }
            else if (type === 'boss_golem') { hpBase = 3500; armor = 25; color = 0x808080; size = 60; speedBase = 0.3; }
            else if (type === 'boss_wizard') { hpBase = 1500; armor = 2; color = 0x4b0082; speedBase = 0.6; }
            else { hpBase = 2000; color = 0x880000; } 
        }

        // Stats Finales
        this.hp = Math.floor(hpBase * levelDifficulty);
        this.maxHp = this.hp;
        this.baseSpeed = speedBase / 16000; 
        this.currentSpeed = this.baseSpeed;
        this.armor = armor;
        this.leakDamage = castleDamage;
        this.colorVal = color;

        this.coinReward = goldDrop;
        this.xpReward = xpDrop;
        this.damage = type.startsWith('boss') ? 50 : 15;

        // Visual
        const bodyShape = scene.add.rectangle(0, 0, size, size, color);
        if (type.startsWith('boss')) bodyShape.setStrokeStyle(3, 0xffd700);
        

        // Efecto visual para niveles altos (Bordes más oscuros)
        if (levelId > 1 && !type.startsWith('boss')) {
            bodyShape.setStrokeStyle(1, 0x000000);
        }

        this.add(bodyShape);
        
        this.hpBarBg = scene.add.rectangle(0, -size/2 - 10, 40, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -size/2 - 10, 38, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);

        this.setSize(size, size);

        this.lastAttackTime = 0;
        this.skillTimer = 0; 
        this.skillCooldown = 5000;
        this.isShielded = false;
        this.speedModifier = 1.0;
    }

    update(time, delta) {
        if (!this.scene) return;

        if (!this.isShielded) {
            this.follower.t += this.currentSpeed * delta;
        }

        if (this.follower.t >= 1) {
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
        
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBar.width = 38 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);

        if (this.type.startsWith('boss')) {
            this.skillTimer += delta;
            if (this.skillTimer > this.skillCooldown) {
                this.useBossSkill();
                this.skillTimer = 0;
            }
        }
        
        if (this.type === 'healer') {
            this.skillTimer += delta;
            if (this.skillTimer > 2000) {
                this.performHeal();
                this.skillTimer = 0;
            }
        }

        this.checkAttackPlayer(time);
    }

    useBossSkill() {
        if (this.type === 'boss_goblin') {
            if (this.scene.spawnMinion) {
                this.scene.showFloatingText(this.x, this.y - 50, "¡ESBIRROS!", "#00ff00");
                this.scene.spawnMinion(this); 
                this.scene.time.delayedCall(500, () => this.scene.spawnMinion(this)); 
            }
        }
        else if (this.type === 'boss_golem') {
            this.isShielded = true;
            this.scene.showFloatingText(this.x, this.y - 50, "¡ESCUDO!", "#aaaaaa");
            const shield = this.scene.add.circle(0, 0, 40, 0xaaaaaa, 0.3);
            shield.setStrokeStyle(2, 0xffffff);
            this.add(shield);
            this.scene.time.delayedCall(3000, () => {
                this.isShielded = false;
                if(shield.active) shield.destroy();
            });
        }
        else if (this.type === 'boss_wizard') {
            this.follower.t = Math.min(1, this.follower.t + 0.05);
            this.scene.showFloatingText(this.x, this.y - 50, "¡BLINK!", "#800080");
            const flash = this.scene.add.circle(this.x, this.y, 30, 0x800080);
            this.scene.tweens.add({ targets: flash, scale: 0, duration: 300, onComplete: () => flash.destroy() });
        }
    }

    performHeal() {
        if (!this.scene || !this.scene.enemies) return;
        const healRange = 150;
        let healed = false;
        this.scene.enemies.children.iterate(e => {
            if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < healRange) {
                if (e.hp < e.maxHp) {
                    e.hp = Math.min(e.maxHp, e.hp + 20);
                    healed = true;
                }
            }
        });
        if (healed && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "CURAR", "#ff69b4");
    }

    takeDamage(amount) {
        if (this.isShielded) {
            if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa");
            return;
        }
        let dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        if (this.scene && this.scene.showFloatingText) {
            const isCrit = Math.random() > 0.8;
            if (isCrit) dmg *= 1.5;
            const color = isCrit ? '#ffaa00' : '#ffffff';
            this.scene.showFloatingText(this.x, this.y - 30, `-${Math.floor(dmg)}`, color);
        }
        if (this.hp <= 0) {
            this.die(true);
        } else {
            this.scene.tweens.add({ targets: this, alpha: 0.5, yoyo: true, duration: 50 });
        }
    }

    // --- AQUÍ ESTÁ EL ARREGLO ---
    applySlow(factor, duration) {
        // 1. Si no hay escena (objeto destruido) o no está activo, salimos inmediatamente.
        if (!this.scene || !this.active) return;

        if (this.type.startsWith('boss')) return; 
        if (this.isShielded) return;
        
        this.speedModifier = factor;
        
        // 2. Usamos el temporizador de la escena de forma segura
        this.scene.time.delayedCall(duration, () => { 
            // 3. Verificamos de nuevo al terminar el timer, por si murió mientras estaba lento
            if (this.active) {
                this.speedModifier = 1.0; 
            }
        });
    }
    
    get currentSpeed() { return (this.baseSpeed * (this.speedModifier || 1.0)); }
    set currentSpeed(val) { }

    checkAttackPlayer(time) {
        if (!this.scene || !this.scene.player) return;
        const player = this.scene.player;
        if (!player.active || player.isDead) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist < 50) {
            if (time > this.lastAttackTime + 1000) {
                player.takeDamage(this.damage);
                this.lastAttackTime = time;
                this.scene.tweens.add({ targets: this, scale: 1.2, yoyo: true, duration: 100 });
            }
        }
    }

    die(killedByPlayer) {
        if (!this.scene) return;
        const scene = this.scene;
        if (killedByPlayer) {
            if (scene.onEnemyKilled) scene.onEnemyKilled(this);
        } else {
            if (scene.onEnemyLeaks) scene.onEnemyLeaks(this.leakDamage);
        }
        this.destroy();
        if (scene.checkWaveStatus) {
            scene.time.delayedCall(100, () => scene.checkWaveStatus());
        }
    }
}