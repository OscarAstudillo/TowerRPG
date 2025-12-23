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
        const biome = scene.biome || 'forest'; // Detectar Bioma

        // Configuración Base
        let color = 0xff0000;
        let size = 20;
        let hpBase = 100;
        let speedBase = 1.0;
        let armor = 0;
        let castleDamage = 1;
        let goldDrop = 25; 
        let xpDrop = 15;

        // --- LÓGICA DE BIOMAS ---
        // Modificadores globales por bioma
        let biomeHpMult = 1.0;
        let biomeSpeedMult = 1.0;
        let biomeArmorBonus = 0;

        if (biome === 'mountain') {
            biomeHpMult = 1.3;      // Más vida
            biomeArmorBonus = 3;    // Más armadura base
            biomeSpeedMult = 0.8;   // Más lentos
        } else if (biome === 'volcano') {
            biomeHpMult = 0.9;      // Menos vida
            biomeSpeedMult = 1.2;   // Más rápidos
            // (El daño se ajusta luego)
        }

        // Variantes
        // Variantes y Tipos
        if (type === 'normal') { 
            hpBase = 100; speedBase = 1.0; 
            // Colores por bioma
            if (biome === 'forest') color = 0x008000; // Goblin
            if (biome === 'mountain') color = 0x8b4513; // Kobold
            if (biome === 'volcano') color = 0xff4500; // Imp
        }
        else if (type === 'tank') { 
            hpBase = 250; speedBase = 0.6; armor = 5; size = 26;
            if (biome === 'forest') color = 0x556b2f; // Ent
            if (biome === 'mountain') { color = 0x708090; armor += 5; } // Golem (Muy duro)
            if (biome === 'volcano') { color = 0x800000; hpBase = 300; } // Magma Golem
        }
        else if (type === 'speed') { 
            hpBase = 60; speedBase = 1.4; size = 16;
            if (biome === 'forest') color = 0xa0522d; // Lobo
            if (biome === 'mountain') color = 0xd3d3d3; // Águila/Gárgola
            if (biome === 'volcano') color = 0xffa500; // Llama
        }
        else if (type.startsWith('boss')) {
            speedBase = 0.4; armor = 10; size = 50; castleDamage = 20; goldDrop = 500; xpDrop = 200;
            // Bosses específicos ya definidos en GameScene, aquí solo stats base
            hpBase = 2000; 
            if (biome === 'mountain') armor += 15;
        }

        // Cálculo Final de Stats
        this.hp = Math.floor(hpBase * levelDifficulty * biomeHpMult);
        this.maxHp = this.hp;
        this.baseSpeed = (speedBase * biomeSpeedMult) / 16000; 
        this.armor = armor + biomeArmorBonus;
        this.leakDamage = castleDamage;
        this.originalColor = color;
        this.coinReward = goldDrop;
        this.xpReward = xpDrop;
        
        // Daño extra en volcán
        this.damage = type.startsWith('boss') ? 50 : 15;
        if (biome === 'volcano') this.damage += 5;

        // Diferenciación visual extra
        if (biome === 'mountain') this.bodyShape.setStrokeStyle(2, 0x000000); // Borde duro
        if (biome === 'volcano') this.bodyShape.setStrokeStyle(2, 0xffff00); // Borde brillante

        if (type.startsWith('boss')) this.bodyShape.setStrokeStyle(3, 0xffd700);
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