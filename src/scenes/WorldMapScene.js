// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { LEVELS } from '../config/Levels.js';
import { gameState } from '../config/GameState.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        // Fondo Mapa
        this.add.rectangle(640, 360, 1280, 720, 0x2b2b2b);
        
        // Título
        this.add.text(640, 50, "MAPA DE CAMPAÑA", { 
            fontSize: '40px', fontStyle: 'bold', color: '#ffd700' 
        }).setOrigin(0.5);

        // --- DIBUJAR CAMINOS (Líneas entre niveles) ---
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x666666, 1);

        for (let i = 0; i < LEVELS.length - 1; i++) {
            const curr = LEVELS[i];
            const next = LEVELS[i+1];
            
            // Dibujar línea punteada o sólida
            const isUnlocked = (gameState.levelsUnlocked > curr.id); 
            const color = isUnlocked ? 0xffd700 : 0x444444; // Dorado si completaste el anterior
            
            graphics.lineStyle(4, color, 1);
            graphics.lineBetween(curr.mapX, curr.mapY, next.mapX, next.mapY);
        }

        // --- DIBUJAR NODOS DE NIVEL ---
        LEVELS.forEach(level => {
            this.createLevelNode(level);
        });

        // Botón Volver
        const backBtn = this.add.rectangle(100, 50, 150, 50, 0xaa0000).setInteractive({useHandCursor:true});
        this.add.text(100, 50, "MENÚ", { fontSize: '20px', fontStyle:'bold' }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    createLevelNode(level) {
        const isUnlocked = level.id <= gameState.levelsUnlocked;
        
        // Color del nodo
        let color = 0x555555; 
        if (isUnlocked) color = 0x00aa00; 
        
        // Verificar si está completado (si hay estrellas guardadas)
        const stars = (gameState.levelStars && gameState.levelStars[level.id]) || 0;
        const isCompleted = stars > 0;
        
        if (isCompleted) color = 0xffd700; // Dorado si tiene al menos 1 estrella

        const container = this.add.container(level.mapX, level.mapY);

        const circle = this.add.circle(0, 0, 30, color).setStrokeStyle(3, 0xffffff);
        
        if (isUnlocked) {
            circle.setInteractive({ useHandCursor: true });
            circle.on('pointerdown', () => {
                this.scene.start('GameScene', { levelData: level });
            });
            circle.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.2, duration: 100 }));
            circle.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 100 }));
        }

        const label = isUnlocked ? level.id.toString() : "🔒";
        const text = this.add.text(0, 0, label, { fontSize: '20px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        const nameText = this.add.text(0, 45, level.name, { fontSize: '14px', color: isUnlocked ? '#fff' : '#888', align: 'center' }).setOrigin(0.5);

        container.add([circle, text, nameText]);

        // --- DIBUJAR ESTRELLAS ---
        if (isCompleted) {
            let starsStr = "";
            for(let i=0; i<3; i++) starsStr += (i < stars ? "⭐" : "☆");
            
            // Texto de estrellas amarillo
            const starText = this.add.text(0, -45, starsStr, { 
                fontSize: '16px', color: '#ffd700', stroke: '#000', strokeThickness: 2 
            }).setOrigin(0.5);
            container.add(starText);
        }
    }
}