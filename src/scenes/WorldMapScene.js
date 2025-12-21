// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { LEVELS } from '../config/Levels.js';
import { gameState } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.add.rectangle(cx, cy, w, h, 0x111111);
        this.add.text(cx, 50, "MAPA DEL MUNDO", { fontSize: '40px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);

        // Botón Volver al Menú
        const backBtn = this.add.text(50, 50, "< MENÚ", { fontSize: '24px', color: '#fff' }).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

        // Dibujar Conexiones (Líneas entre niveles)
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x555555);
        
        // Posiciones visuales en el mapa (ajustadas para 1280x960)
        const mapPositions = [
            { x: 200, y: cy },
            { x: cx, y: cy },
            { x: w - 200, y: cy }
        ];

        // Dibujar líneas primero
        for (let i = 0; i < LEVELS.length - 1; i++) {
            graphics.beginPath();
            graphics.moveTo(mapPositions[i].x, mapPositions[i].y);
            graphics.lineTo(mapPositions[i+1].x, mapPositions[i+1].y);
            graphics.strokePath();
        }

        // Dibujar Nodos de Nivel
        LEVELS.forEach((level, index) => {
            const pos = mapPositions[index];
            const isUnlocked = level.id <= gameState.levelsUnlocked;
            const stars = gameState.levelStars[level.id] || 0;

            // Círculo del Nivel
            const circleColor = isUnlocked ? (stars === 3 ? 0xffd700 : 0x00aa00) : 0x333333;
            const circle = this.add.circle(pos.x, pos.y, 50, circleColor).setInteractive({ useHandCursor: isUnlocked });
            
            if (isUnlocked) {
                circle.setStrokeStyle(4, 0xffffff);
                
                // Efecto Hover
                circle.on('pointerover', () => this.tweens.add({ targets: circle, scale: 1.1, duration: 100 }));
                circle.on('pointerout', () => this.tweens.add({ targets: circle, scale: 1.0, duration: 100 }));
                
                circle.on('pointerdown', () => {
                    this.scene.start('GameScene', { levelData: level });
                });
            } else {
                this.add.text(pos.x, pos.y, "🔒", { fontSize: '32px' }).setOrigin(0.5);
            }

            // Info del Nivel
            this.add.text(pos.x, pos.y + 70, level.name, { fontSize: '18px', fontStyle: 'bold', color: isUnlocked ? '#fff' : '#555' }).setOrigin(0.5);
            
            // Estrellas
            let starsStr = "";
            if (isUnlocked) {
                for(let i=0; i<3; i++) starsStr += (i < stars ? "⭐" : "☆");
            }
            this.add.text(pos.x, pos.y + 100, starsStr, { fontSize: '24px' }).setOrigin(0.5);
        });
    }
}