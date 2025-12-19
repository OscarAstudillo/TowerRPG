// src/scenes/ResultScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
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
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.add.rectangle(cx, cy, w, h, 0x000000, 0.8);

        const panelColor = this.success ? 0x006400 : 0x8b0000;
        const panel = this.add.rectangle(cx, cy, 500, 400, panelColor).setStrokeStyle(4, 0xffffff);

        const titleText = this.success ? "¡VICTORIA!" : "DERROTA";
        this.add.text(cx, cy - 140, titleText, { fontSize: '48px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

        if (this.success) {
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
            this.add.text(cx, cy - 80, starsStr, { fontSize: '60px' }).setOrigin(0.5);

            this.add.text(cx, cy, `Castillo: ${this.castleHp} HP`, { fontSize: '20px' }).setOrigin(0.5);
            this.add.text(cx, cy + 40, `Oro Extra: +${this.rewards.gold}`, { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5);

        } else {
            this.add.text(cx, cy - 40, "El castillo ha caído...", { fontSize: '24px' }).setOrigin(0.5);
        }

        const btn = this.add.rectangle(cx, cy + 140, 200, 50, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xffffff);
        this.add.text(cx, cy + 140, "CONTINUAR", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            gameState.playerStats.hp = gameState.playerStats.maxHp;
            this.scene.start('WorldMapScene'); 
        });
    }
}