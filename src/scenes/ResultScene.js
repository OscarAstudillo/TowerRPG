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
        this.rewards = data.rewards || { gold: 0, materials: {} };
        this.castleHp = data.castleHp || 0;
    }

    create() {
        // Fondo semitransparente
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);

        // Panel Principal
        const panelColor = this.success ? 0x006400 : 0x8b0000;
        const panel = this.add.rectangle(640, 360, 500, 400, panelColor).setStrokeStyle(4, 0xffffff);

        // Título
        const titleText = this.success ? "¡VICTORIA!" : "DERROTA";
        this.add.text(640, 220, titleText, { fontSize: '48px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

        if (this.success) {
            // Calcular Estrellas
            let stars = 1;
            if (this.castleHp >= 20) stars = 3; // 100% (asumiendo baseHp=20)
            else if (this.castleHp >= 10) stars = 2; // 50%

            // Guardar Progreso
            if (!gameState.levelStars) gameState.levelStars = {};
            // Guardar solo si es mejor record
            const oldStars = gameState.levelStars[this.levelId] || 0;
            if (stars > oldStars) gameState.levelStars[this.levelId] = stars;

            if (this.levelId >= gameState.levelsUnlocked) {
                gameState.levelsUnlocked = this.levelId + 1;
            }
            
            // Recompensa de Oro (ya sumada en GameScene, aquí solo mostramos)
            // Guardar Juego
            SaveSystem.save();

            // Mostrar Estrellas
            let starsStr = "";
            for(let i=0; i<3; i++) starsStr += (i < stars ? "⭐" : "☆");
            this.add.text(640, 280, starsStr, { fontSize: '60px' }).setOrigin(0.5);

            // Resumen
            this.add.text(640, 360, `Castillo: ${this.castleHp} HP`, { fontSize: '20px' }).setOrigin(0.5);
            this.add.text(640, 400, `Oro Extra: +${this.rewards.gold}`, { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5);

        } else {
            this.add.text(640, 320, "El castillo ha caído...", { fontSize: '24px' }).setOrigin(0.5);
        }

        // Botón Continuar
        const btn = this.add.rectangle(640, 500, 200, 50, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xffffff);
        this.add.text(640, 500, "CONTINUAR", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            // Curar héroe al salir
            gameState.playerStats.hp = gameState.playerStats.maxHp;
            this.scene.start('WorldMapScene'); // Volver al mapa, no al menú principal
        });
    }
}