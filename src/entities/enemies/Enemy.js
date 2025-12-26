// src/entities/enemies/Enemy.js
import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, path, levelDifficulty, type = 'normal') {
        if (!path || path.length === 0) { super(scene, 0, 0); return; }

        super(scene, path[0].x, path[0].y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.path = path;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.type = type;
        this.levelDifficulty = levelDifficulty;

        const biome = scene.biome || 'forest'; 

        // --- CONFIGURACIÓN BASE ---
        let color = 0xff0000;
        let size = 20;
        let hpBase = 100;
        let speedBase = 1.0;
        let armor = 0;
        let castleDamage = 1;
        let goldDrop = 25; 
        let xpDrop = 15;

        // --- BONIFICACIONES DE BIOMA (RESTAURADAS) ---
        let biomeHpMult = 1.0;
        let biomeSpeedMult = 1.0;
        let biomeArmorBonus = 0;

        if (biome === 'mountain') {
            biomeHpMult = 1.3;      // +30% Vida
            biomeArmorBonus = 3;    // +3 Armadura
            biomeSpeedMult = 0.8;   // -20% Velocidad
        } else if (biome === 'volcano') {
            biomeHpMult = 0.9;      // -10% Vida
            biomeSpeedMult = 1.2;   // +20% Velocidad
        }

        // --- AJUSTES POR TIPO ---
        if (type === 'normal') { 
            hpBase = 100; speedBase = 1.0; 
            if (biome === 'forest') color = 0x008000; // Verde
            else if (biome === 'mountain') color = 0x8b4513; // Marrón
            else if (biome === 'volcano') color = 0xff4500; // Naranja rojizo
        }
        else if (type === 'tank') { 
            hpBase = 250; speedBase = 0.6; armor = 5; size = 26;
            if (biome === 'forest') color = 0x556b2f; 
            else if (biome === 'mountain') { color = 0x708090; armor += 5; } 
            else if (biome === 'volcano') { color = 0x800000; hpBase = 300; } 
        }
        else if (type === 'speed') { 
            hpBase = 60; speedBase = 1.4; size = 16;
            if (biome === 'forest') color = 0xa0522d; 
            else if (biome === 'mountain') color = 0xd3d3d3; 
            else if (biome === 'volcano') color = 0xffa500; 
        }
        else if (type === 'healer') { 
            hpBase = 120; speedBase = 0.9; color = 0xff69b4; size = 22; goldDrop = 30;
        }
        else if (type.startsWith('boss')) {
            speedBase = 0.4; armor = 10; size = 50; castleDamage = 20; goldDrop = 500; xpDrop = 200;
            hpBase = 2000; 
            if (biome === 'mountain') armor += 15;
            if (type === 'boss_goblin') color = 0x006400;
            else if (type === 'boss_golem') color = 0x808080;
            else if (type === 'boss_wizard') color = 0x4b0082;
        }

        // --- CÁLCULO DE STATS FINALES ---
        this.hp = Math.floor(hpBase * levelDifficulty * biomeHpMult);
        this.maxHp = this.hp;
        // Ajuste de velocidad (división alta porque delta es milisegundos)
        this.baseSpeed = (speedBase * biomeSpeedMult) / 10000; 
        this.armor = armor + biomeArmorBonus;
        this.leakDamage = castleDamage;
        this.originalColor = color;
        this.coinReward = goldDrop;
        this.xpReward = xpDrop;
        this.damage = type.startsWith('boss') ? 50 : 15;

        // --- VISUAL ---
        if (isNaN(color)) color = 0xff0000;
        this.bodyShape = scene.add.rectangle(0, 0, size, size, color);
        
        if (this.bodyShape) {
            if (biome === 'mountain') this.bodyShape.setStrokeStyle(2, 0x000000);
            else if (biome === 'volcano') this.bodyShape.setStrokeStyle(2, 0xffff00);
            else this.bodyShape.setStrokeStyle(1, 0x000000);
            
            if (type.startsWith('boss')) this.bodyShape.setStrokeStyle(3, 0xffd700);
            this.add(this.bodyShape);
        }
        
        // Barra de Vida
        this.hpBarBg = scene.add.rectangle(0, -size/2 - 10, 40, 6, 0x000000);
        this.hpBar = scene.add.rectangle(0, -size/2 - 10, 38, 4, 0x00ff00);
        this.add([this.hpBarBg, this.hpBar]);

        this.setSize(size, size);

        // --- LÓGICA DE JUEGO ---
        this.lastAttackTime = 0;
        this.skillTimer = 0; 
        this.isShielded = false;

        // Sistema de Estados (Debuffs)
        this.statusEffects = {
            slow: { active: false, factor: 0, timer: 0 },
            burn: { active: false, damage: 0, timer: 0, tickTimer: 0 },
            freeze: { active: false, factor: 0, timer: 0 },
            stun: { active: false, timer: 0 }
        };
    }

    update(time, delta) {
        if (!this.scene) return;

        // 1. Gestionar Debuffs
        this.updateDebuffs(delta);
        
        // 2. Movimiento
        if (!this.isShielded && !this.statusEffects.stun.active) {
            let speedMod = 1.0;
            
            // Aplicar Slow o Freeze
            if (this.statusEffects.slow.active) speedMod *= (1 - this.statusEffects.slow.factor);
            if (this.statusEffects.freeze.active) speedMod *= (1 - this.statusEffects.freeze.factor);
            
            // Límite mínimo de velocidad (10%)
            if (speedMod < 0.1) speedMod = 0.1;
            
            this.follower.t += (this.baseSpeed * speedMod) * delta;
        }
        
        // Llegó al final
        if (this.follower.t >= 1) {
            this.die(false);
            return;
        }

        // Interpolación de posición en el camino
        const p1 = this.path[Math.floor(this.follower.t * (this.path.length - 1))];
        const p2 = this.path[Math.ceil(this.follower.t * (this.path.length - 1))];

        if (p1 && p2) {
            const segmentT = (this.follower.t * (this.path.length - 1)) % 1;
            this.x = Phaser.Math.Linear(p1.x, p2.x, segmentT);
            this.y = Phaser.Math.Linear(p1.y, p2.y, segmentT);
        }

        // Actualizar barra de vida
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBar.width = 38 * hpPercent;
        this.hpBar.setFillStyle(hpPercent < 0.3 ? 0xff0000 : 0x00ff00);

        // Habilidades especiales
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

    // --- FUNCIÓN RESTAURADA: APPLY STATUS ---
    // Esta función es llamada por los proyectiles (Mago/Cañón)
    applyStatus(effect) {
        if (!effect || !this.active || this.isShielded) return;

        if (effect.type === 'burn') {
            this.statusEffects.burn.active = true;
            this.statusEffects.burn.damage = Math.max(this.statusEffects.burn.damage, effect.val);
            this.statusEffects.burn.timer = effect.duration;
            this.bodyShape.setFillStyle(0xff4500); // Color fuego
        } 
        else if (effect.type === 'freeze' || effect.type === 'slow') {
            this.statusEffects.freeze.active = true;
            this.statusEffects.freeze.factor = effect.val;
            this.statusEffects.freeze.timer = effect.duration;
            this.bodyShape.setFillStyle(0x00ffff); // Color hielo
        } 
        else if (effect.type === 'stun' && !this.type.startsWith('boss')) {
            this.statusEffects.stun.active = true;
            this.statusEffects.stun.timer = effect.duration;
            this.bodyShape.setFillStyle(0xffff00); // Color stun
            if(this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y - 40, "¡STUN!", "#ffff00");
        }
    }

    updateDebuffs(delta) {
        // Quemadura
        if (this.statusEffects.burn.active) {
            this.statusEffects.burn.timer -= delta;
            this.statusEffects.burn.tickTimer += delta;
            
            if (this.statusEffects.burn.tickTimer >= 500) { // Daño cada 0.5s
                this.takeTrueDamage(this.statusEffects.burn.damage, '#ff4500');
                this.statusEffects.burn.tickTimer = 0;
            }
            if (this.statusEffects.burn.timer <= 0) {
                this.statusEffects.burn.active = false;
                this.clearTint();
            }
        }
        
        // Congelamiento
        if (this.statusEffects.freeze.active) {
            this.statusEffects.freeze.timer -= delta;
            if (this.statusEffects.freeze.timer <= 0) {
                this.statusEffects.freeze.active = false;
                this.clearTint();
            }
        }
        
        // Aturdimiento
        if (this.statusEffects.stun.active) {
            this.statusEffects.stun.timer -= delta;
            if (this.statusEffects.stun.timer <= 0) {
                this.statusEffects.stun.active = false;
                this.clearTint();
            }
        }
    }

    clearTint() {
        if (this.active && this.bodyShape) {
            // Solo restaurar color si no hay otros efectos activos importantes
            if (!this.statusEffects.burn.active && !this.statusEffects.freeze.active && !this.statusEffects.stun.active) {
                this.bodyShape.setFillStyle(this.originalColor);
            }
        }
    }

    takeTrueDamage(amount, color) {
        if (!this.active) return;
        this.hp -= amount;
        if (this.scene && this.scene.showFloatingText) 
            this.scene.showFloatingText(this.x, this.y - 20, `-${amount}`, color);
        if (this.hp <= 0) this.die(true);
    }

    takeDamage(amount) {
        if (this.isShielded) {
            if (this.scene.showFloatingText) this.scene.showFloatingText(this.x, this.y, "BLOQUEO", "#aaaaaa");
            return;
        }
        
        // Daño reducido por armadura
        let dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        
        if (this.scene && this.scene.showFloatingText) {
            // Chance crítica visual (solo estética)
            const isCrit = Math.random() > 0.8;
            const color = isCrit ? '#ffaa00' : '#ffffff';
            const scale = isCrit ? 1.5 : 1.0;
            // Solo mostrar visualmente crítico, no afecta lógica aquí
            this.scene.showFloatingText(this.x, this.y - 30, `-${Math.floor(dmg)}`, color, 800);
        }
        
        if (this.hp <= 0) {
            this.die(true);
        } else {
            // Feedback visual de golpe
            this.scene.tweens.add({ targets: this, alpha: 0.5, yoyo: true, duration: 50 });
        }
    }

    useBossSkill() {
        if (this.type === 'boss_goblin') {
            if (this.scene && this.scene.spawnMinion) {
                this.scene.showFloatingText(this.x, this.y - 50, "¡ESBIRROS!", "#00ff00");
                this.scene.spawnMinion(this);
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
            this.follower.t = Math.min(1, this.follower.t + 0.05); // Teleport adelante
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
        
        if (healed && this.scene.showFloatingText) 
            this.scene.showFloatingText(this.x, this.y, "CURAR", "#ff69b4");
    }

    checkAttackPlayer(time) {
        if (!this.scene || !this.scene.player) return;
        const player = this.scene.player;
        if (!player.active || player.isDead) return;
        
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // Rango de ataque melee al héroe
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
        const scene = this.scene; // Referencia local segura
        
        if (killedByPlayer) {
            if (scene.onEnemyKilled) scene.onEnemyKilled(this);
        } else {
            if (scene.onEnemyLeaks) scene.onEnemyLeaks(this.leakDamage);
        }
        
        this.destroy();
        
        // Verificar victoria/derrota en la escena de forma segura
        if (scene.checkWaveStatus) {
            scene.time.delayedCall(50, () => {
                if (scene && scene.checkWaveStatus) scene.checkWaveStatus();
            });
        }
    }
}