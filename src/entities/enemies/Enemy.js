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

        const levelId = (scene.currentLevelData && scene.currentLevelData.id) ? scene.currentLevelData.id : 1;

        // Configuración Base
        let color = 0xff0000;
        let size = 20;
        let hpBase = 100;
        let speedBase = 1.0;
        let armor = 0;
        let castleDamage = 1;
        let goldDrop = 25; 
        let xpDrop = 15;

        // Variantes
        if (type === 'normal') { 
            hpBase = 100; speedBase = 1.0; 
            if (levelId === 2) { color = 0xDAA520; speedBase = 1.2; hpBase = 90; } 
            else if (levelId === 3) { color = 0x8B0000; speedBase = 0.9; hpBase = 130; } 
        }
        else if (type === 'tank') { 
            hpBase = 250; speedBase = 0.6; armor = 5; color = 0x00008b; size = 26; goldDrop = 40; xpDrop = 30;
            if (levelId === 3) { color = 0x2F4F4F; armor = 10; hpBase = 300; } 
        }
        else if (type === 'speed') { 
            hpBase = 60; speedBase = 1.4; color = 0xffff00; size = 16; goldDrop = 15; 
        }
        else if (type === 'healer') { 
            hpBase = 120; speedBase = 0.9; color = 0xff69b4; size = 22; goldDrop = 30;
        }
        else if (type.startsWith('boss')) {
            speedBase = 0.4; armor = 10; size = 50; castleDamage = 20; goldDrop = 500; xpDrop = 200;
            if (type === 'boss_goblin') { hpBase = 2000; color = 0x006400; }
            else if (type === 'boss_golem') { hpBase = 3500; armor = 25; color = 0x808080; size = 60; speedBase = 0.3; }
            else if (type === 'boss_wizard') { hpBase = 1500; armor = 2; color = 0x4b0082; speedBase = 0.6; }
            else { hpBase = 2000; color = 0x880000; } 
        }

        this.hp = Math.floor(hpBase * levelDifficulty);
        this.maxHp = this.hp;
        this.baseSpeed = speedBase / 16000; 
        this.armor = armor;
        this.leakDamage = castleDamage;
        this.originalColor = color;
        this.coinReward = goldDrop;
        this.xpReward = xpDrop;
        this.damage = type.startsWith('boss') ? 50 : 15;

        // Visual
        this.bodyShape = scene.add.rectangle(0, 0, size, size, color);
        if (type.startsWith('boss')) this.bodyShape.setStrokeStyle(3, 0xffd700);
        else this.bodyShape.setStrokeStyle(1, 0x000000);
        this.add(this.bodyShape);
        
        this.hpBarBg = scene.add.rectangle(0, -size/2 - 10, 40, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -size/2 - 10, 38, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);

        this.setSize(size, size);

        this.lastAttackTime = 0;
        this.skillTimer = 0; 
        this.isShielded = false;

        // --- SISTEMA DE ESTADOS ---
        this.debuffs = {
            burn: { active: false, timer: 0, damage: 0, tickTimer: 0 },
            poison: { active: false, timer: 0, damage: 0, tickTimer: 0 },
            freeze: { active: false, timer: 0, factor: 0 },
            stun: { active: false, timer: 0 }
        };
    }

    update(time, delta) {
        if (!this.scene) return;

        // Actualizar Estados
        this.updateDebuffs(delta);

        // Movimiento
        if (!this.isShielded && !this.debuffs.stun.active) {
            let speedMod = 1.0;
            if (this.debuffs.freeze.active) speedMod *= (1 - this.debuffs.freeze.factor);
            if (speedMod < 0.1) speedMod = 0.1;

            this.follower.t += (this.baseSpeed * speedMod) * delta;
        }

        if (this.follower.t >= 1) { this.die(false); return; }
        
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

        // IA Básica
        if (this.type.startsWith('boss')) {
            this.skillTimer += delta;
            if (this.skillTimer > 5000) { this.useBossSkill(); this.skillTimer = 0; }
        }
        if (this.type === 'healer') {
            this.skillTimer += delta;
            if (this.skillTimer > 2000) { this.performHeal(); this.skillTimer = 0; }
        }
        this.checkAttackPlayer(time);
    }

    updateDebuffs(delta) {
        // Burn
        if (this.debuffs.burn.active) {
            this.debuffs.burn.timer -= delta;
            this.debuffs.burn.tickTimer += delta;
            if (this.debuffs.burn.tickTimer >= 500) {
                this.takeTrueDamage(this.debuffs.burn.damage, '#ff4500');
                this.debuffs.burn.tickTimer = 0;
            }
            if (this.debuffs.burn.timer <= 0) { this.debuffs.burn.active = false; this.clearTint(); }
        }
        // Poison
        if (this.debuffs.poison.active) {
            this.debuffs.poison.timer -= delta;
            this.debuffs.poison.tickTimer += delta;
            if (this.debuffs.poison.tickTimer >= 1000) {
                this.takeTrueDamage(this.debuffs.poison.damage, '#00ff00');
                this.debuffs.poison.tickTimer = 0;
            }
            if (this.debuffs.poison.timer <= 0) { this.debuffs.poison.active = false; this.clearTint(); }
        }
        // Freeze & Stun timers
        if (this.debuffs.freeze.active) {
            this.debuffs.freeze.timer -= delta;
            if (this.debuffs.freeze.timer <= 0) { this.debuffs.freeze.active = false; this.clearTint(); }
        }
        if (this.debuffs.stun.active) {
            this.debuffs.stun.timer -= delta;
            if (this.debuffs.stun.timer <= 0) { this.debuffs.stun.active = false; this.clearTint(); }
        }
    }

    applyStatusEffect(effect) {
        if (!effect || !this.active || this.isShielded) return;

        if (effect.type === 'burn') {
            this.debuffs.burn.active = true;
            this.debuffs.burn.damage = Math.max(this.debuffs.burn.damage, effect.val);
            this.debuffs.burn.timer = effect.duration;
            this.bodyShape.setFillStyle(0xff4500);
        } else if (effect.type === 'poison') {
            this.debuffs.poison.active = true;
            this.debuffs.poison.damage = Math.max(this.debuffs.poison.damage, effect.val);
            this.debuffs.poison.timer = effect.duration;
            this.bodyShape.setFillStyle(0x00ff00);
        } else if (effect.type === 'freeze') {
            this.debuffs.freeze.active = true;
            this.debuffs.freeze.factor = effect.val;
            this.debuffs.freeze.timer = effect.duration;
            this.bodyShape.setFillStyle(0x00ffff);
        } else if (effect.type === 'stun' && !this.type.startsWith('boss')) {
            this.debuffs.stun.active = true;
            this.debuffs.stun.timer = effect.duration;
            this.bodyShape.setFillStyle(0xffff00);
            this.scene.showFloatingText(this.x, this.y - 40, "¡STUN!", "#ffff00");
        }
    }

    clearTint() {
        if (this.active && this.bodyShape) {
            // Solo restaurar si no hay otros debuffs visuales activos
            if (!this.debuffs.burn.active && !this.debuffs.poison.active && !this.debuffs.freeze.active && !this.debuffs.stun.active) {
                this.bodyShape.setFillStyle(this.originalColor);
            }
        }
    }

    takeTrueDamage(amount, color) {
        if (!this.active) return;
        this.hp -= amount;
        if (this.scene && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y - 20, `-${amount}`, color);
        if (this.hp <= 0) this.die(true);
    }

    // --- CORRECCIÓN AQUÍ: Checks de seguridad (this.scene && this.active) ---
    useBossSkill() { 
        if (this.type === 'boss_goblin') { 
            if (this.scene && this.scene.spawnMinion) { 
                this.scene.showFloatingText(this.x, this.y - 50, "¡ESBIRROS!", "#00ff00"); 
                this.scene.spawnMinion(this); 
                
                // VALIDACIÓN EXTRA
                this.scene.time.delayedCall(500, () => {
                    if (this.active && this.scene && this.scene.spawnMinion) {
                        this.scene.spawnMinion(this); 
                    }
                }); 
            } 
        } else if (this.type === 'boss_golem') { 
            this.isShielded = true; 
            this.scene.showFloatingText(this.x, this.y - 50, "¡ESCUDO!", "#aaaaaa"); 
            const shield = this.scene.add.circle(0, 0, 40, 0xaaaaaa, 0.3); 
            shield.setStrokeStyle(2, 0xffffff); 
            this.add(shield); 
            this.scene.time.delayedCall(3000, () => { 
                this.isShielded = false; 
                if(shield.active) shield.destroy(); 
            }); 
        } else if (this.type === 'boss_wizard') { 
            this.follower.t = Math.min(1, this.follower.t + 0.05); 
            this.scene.showFloatingText(this.x, this.y - 50, "¡BLINK!", "#800080"); 
            const flash = this.scene.add.circle(this.x, this.y, 30, 0x800080); 
            this.scene.tweens.add({ targets: flash, scale: 0, duration: 300, onComplete: () => flash.destroy() }); 
        } 
    }

    performHeal() { 
        if (!this.scene || !this.scene.enemies) return; 
        const healRange = 150; let healed = false; 
        this.scene.enemies.children.iterate(e => { 
            if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < healRange) { 
                if (e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + 20); healed = true; } 
            } 
        }); 
        if (healed && this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "CURAR", "#ff69b4"); 
    }

    takeDamage(amount) { 
        if (this.isShielded) { if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa"); return; } 
        let dmg = Math.max(1, amount - this.armor); 
        this.hp -= dmg; 
        if (this.scene && this.scene.showFloatingText) { 
            const isCrit = Math.random() > 0.8; if (isCrit) dmg *= 1.5; 
            const color = isCrit ? '#ffaa00' : '#ffffff'; 
            this.scene.showFloatingText(this.x, this.y - 30, `-${Math.floor(dmg)}`, color); 
        } 
        if (this.hp <= 0) { this.die(true); } 
        else { this.scene.tweens.add({ targets: this, alpha: 0.5, yoyo: true, duration: 50 }); } 
    }

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
        
        // Llamada segura
        if (scene.checkWaveStatus) { 
            scene.time.delayedCall(100, () => {
                if (scene && scene.checkWaveStatus) scene.checkWaveStatus(); 
            }); 
        } 
    }
}