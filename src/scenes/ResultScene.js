// src/scenes/ResultScene.js
import Phaser from 'phaser';
import { gameState, RARITY } from '../config/GameState.js'; // Importar RARITY para nombres
import SaveSystem from '../systems/SaveSystem.js';

export default class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.success = data.success;
        this.levelId = data.levelId;
        this.rewards = data.rewards || { gold: 0 };
        this.castleHp = data.castleHp || 0;
        this.sessionLoot = data.sessionLoot || {};
        this.bossLoot = data.bossLoot || [];
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.add.rectangle(cx, cy, w, h, 0x000000, 0.85);

        const panelColor = this.success ? 0x006400 : 0x8b0000;
        this.add.rectangle(cx, cy, 600, 700, panelColor).setStrokeStyle(4, 0xffffff);

        const titleText = this.success ? "¡VICTORIA!" : "DERROTA";
        this.add.text(cx, cy - 300, titleText, { fontSize: '48px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

        if (this.success) {
            // Estrellas
            let stars = 1;
            if (this.castleHp >= 20) stars = 3; 
            else if (this.castleHp >= 10) stars = 2; 

            if (!gameState.levelStars) gameState.levelStars = {};
            const oldStars = gameState.levelStars[this.levelId] || 0;
            if (stars > oldStars) gameState.levelStars[this.levelId] = stars;

            if (this.levelId >= gameState.levelsUnlocked) {
                gameState.levelsUnlocked = this.levelId + 1;
            }
            
            SaveSystem.save();

            let starsStr = "";
            for(let i=0; i<3; i++) starsStr += (i < stars ? "⭐" : "☆");
            this.add.text(cx, cy - 240, starsStr, { fontSize: '60px' }).setOrigin(0.5);

            // Resumen Básico
            this.add.text(cx, cy - 180, `Castillo: ${this.castleHp} HP`, { fontSize: '20px' }).setOrigin(0.5);
            this.add.text(cx, cy - 150, `Oro Extra: +${this.rewards.gold}`, { fontSize: '24px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);

            // --- LISTA DE MATERIALES ---
            this.add.text(cx, cy - 100, "- MATERIALES RECOLECTADOS -", { fontSize: '16px', color: '#aaa' }).setOrigin(0.5);
            
            let lootY = cy - 70;
            let hasLoot = false;
            
            for (let type in this.sessionLoot) {
                for (let rarity in this.sessionLoot[type]) {
                    const count = this.sessionLoot[type][rarity];
                    if (count > 0) {
                        const rName = RARITY[rarity].name;
                        const col = '#' + RARITY[rarity].color.toString(16).padStart(6, '0');
                        this.add.text(cx, lootY, `${count}x ${type.toUpperCase()} (${rName})`, { fontSize: '14px', color: col }).setOrigin(0.5);
                        lootY += 25;
                        hasLoot = true;
                    }
                }
            }
            if (!hasLoot) this.add.text(cx, lootY, "(Ninguno)", { fontSize: '14px', color: '#888' }).setOrigin(0.5);

            // --- DROP DE JEFE ---
            lootY += 40;
            if (this.bossLoot.length > 0) {
                this.add.text(cx, lootY, "👑 BOTÍN DE JEFE 👑", { fontSize: '18px', color: '#ff00ff', fontStyle: 'bold' }).setOrigin(0.5);
                lootY += 30;
                
                this.bossLoot.forEach(itemLog => {
                    this.add.text(cx, lootY, itemLog.text, { fontSize: '16px', color: itemLog.color }).setOrigin(0.5);
                    lootY += 30;
                });
            }

        } else {
            this.add.text(cx, cy - 100, "El castillo ha caído...", { fontSize: '24px' }).setOrigin(0.5);
        }

        const btn = this.add.rectangle(cx, cy + 250, 250, 60, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xffffff);
        this.add.text(cx, cy + 250, "CONTINUAR", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            gameState.playerStats.hp = gameState.playerStats.maxHp;
            this.scene.start('WorldMapScene'); 
        });
    }
}