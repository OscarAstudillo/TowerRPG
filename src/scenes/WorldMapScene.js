// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { LEVELS } from '../config/Levels.js';
import { gameState } from '../config/GameState.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        // --- FACTOR DE ESCALA ---
        // Comparamos la resolución actual con la de diseño (1280x960)
        // Si tu pantalla es 1920x1080, el factor será aprox 1.5 en X y 1.12 en Y
        this.sx = w / 1280;
        this.sy = h / 960;

        // Fondo Mapa
        this.add.rectangle(w/2, h/2, w, h, 0x2b2b2b);
        
        // Título
        this.add.text(w/2, 50 * this.sy, "MAPA DE CAMPAÑA", { 
            fontSize: `${40 * Math.min(this.sx, this.sy)}px`, 
            fontStyle: 'bold', color: '#ffd700' 
        }).setOrigin(0.5);

        // --- DIBUJAR CAMINOS (Escalados) ---
        const graphics = this.add.graphics();
        graphics.lineStyle(4 * Math.min(this.sx, this.sy), 0x666666, 1);

        for (let i = 0; i < LEVELS.length - 1; i++) {
            const curr = LEVELS[i];
            const next = LEVELS[i+1];
            
            // Aplicar escala a las coordenadas
            const x1 = curr.mapX * this.sx;
            const y1 = curr.mapY * this.sy;
            const x2 = next.mapX * this.sx;
            const y2 = next.mapY * this.sy;

            const isUnlocked = (gameState.levelsUnlocked > curr.id); 
            const color = isUnlocked ? 0xffd700 : 0x444444; 
            
            graphics.lineStyle(4 * Math.min(this.sx, this.sy), color, 1);
            graphics.lineBetween(x1, y1, x2, y2);
        }

        // --- DIBUJAR NODOS (Escalados) ---
        LEVELS.forEach(level => {
            this.createLevelNode(level);
        });

        // Botón Volver
        const btnW = 150 * this.sx;
        const btnH = 50 * this.sy;
        const backBtn = this.add.rectangle(100 * this.sx, 50 * this.sy, btnW, btnH, 0xaa0000).setInteractive({useHandCursor:true});
        this.add.text(100 * this.sx, 50 * this.sy, "MENÚ", { fontSize: `${20 * Math.min(this.sx, this.sy)}px`, fontStyle:'bold' }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    createLevelNode(level) {
        // Coordenadas Escaladas
        const posX = level.mapX * this.sx;
        const posY = level.mapY * this.sy;
        const scaleAvg = Math.min(this.sx, this.sy);

        const isUnlocked = level.id <= gameState.levelsUnlocked;
        const stars = (gameState.levelStars && gameState.levelStars[level.id]) || 0;
        const isCompleted = stars > 0;
        
        let color = 0x555555; 
        if (isUnlocked) color = 0x00aa00; 
        if (isCompleted) color = 0xffd700; 

        const container = this.add.container(posX, posY);

        const circle = this.add.circle(0, 0, 30 * scaleAvg, color).setStrokeStyle(3 * scaleAvg, 0xffffff);
        
        if (isUnlocked) {
            circle.setInteractive({ useHandCursor: true });
            circle.on('pointerdown', () => {
                this.scene.start('GameScene', { levelData: level });
            });
            circle.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.2, duration: 100 }));
            circle.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 100 }));
        }

        const fontSize = 20 * scaleAvg;
        const label = isUnlocked ? level.id.toString() : "🔒";
        const text = this.add.text(0, 0, label, { fontSize: `${fontSize}px`, fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        
        const nameText = this.add.text(0, 45 * scaleAvg, level.name, { 
            fontSize: `${14 * scaleAvg}px`, 
            color: isUnlocked ? '#fff' : '#888', 
            align: 'center' 
        }).setOrigin(0.5);

        container.add([circle, text, nameText]);

        if (isCompleted) {
            let starsStr = "";
            for(let i=0; i<3; i++) starsStr += (i < stars ? "⭐" : "☆");
            const starText = this.add.text(0, -45 * scaleAvg, starsStr, { 
                fontSize: `${16 * scaleAvg}px`, color: '#ffd700', stroke: '#000', strokeThickness: 2 
            }).setOrigin(0.5);
            container.add(starText);
        }
    }
}