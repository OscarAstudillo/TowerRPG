// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { LEVELS } from '../config/Levels.js';
import { gameState } from '../config/GameState.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        // Fondo del mapa
        this.add.rectangle(640, 360, 1280, 720, 0x222222);
        this.add.text(640, 50, 'MAPA DEL REINO', { fontSize: '40px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);

        // Botón Volver al Menú
        const backBtn = this.add.rectangle(100, 50, 150, 50, 0x444444).setInteractive({ useHandCursor: true });
        this.add.text(100, 50, 'MENÚ', { fontSize: '20px' }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

        // DIBUJAR NIVELES
        // Recorremos la lista de niveles definida en Levels.js
        LEVELS.forEach((level, index) => {
            const isUnlocked = (index + 1) <= gameState.levelsUnlocked;
            
            // Posición en el mapa (ajustable)
            // Si no tiene coordenadas en Levels.js, las calculamos en fila
            const x = level.mapX || (200 + index * 250);
            const y = level.mapY || 360;

            // Línea conectora (si no es el primero)
            if (index > 0) {
                const prevLevel = LEVELS[index - 1];
                const prevX = prevLevel.mapX || (200 + (index - 1) * 250);
                const prevY = prevLevel.mapY || 360;
                
                const color = isUnlocked ? 0xffffff : 0x555555;
                this.add.line(0, 0, prevX, prevY, x, y, color).setOrigin(0).setLineWidth(4);
            }

            // El Nodo del Nivel (Círculo)
            const circleColor = isUnlocked ? (level.id === gameState.levelsUnlocked ? 0x00ff00 : 0x00aa00) : 0x550000;
            const btn = this.add.circle(x, y, 40, circleColor).setInteractive({ useHandCursor: isUnlocked });
            
            // Texto del Nivel
            this.add.text(x, y, level.id, { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(x, y + 60, level.name, { fontSize: '16px', color: isUnlocked ? '#fff' : '#888' }).setOrigin(0.5);

            // Evento: Iniciar Nivel
            if (isUnlocked) {
                btn.on('pointerdown', () => {
                    console.log(`Iniciando Nivel ${level.id}: ${level.name}`);
                    // AQUÍ ES DONDE OCURRE LA MAGIA (Transición)
                    this.scene.start('GameScene', { levelData: level });
                });
                
                // Efecto hover
                btn.on('pointerover', () => btn.setScale(1.1));
                btn.on('pointerout', () => btn.setScale(1.0));
            } else {
                // Icono de candado para niveles bloqueados
                this.add.text(x, y, '🔒', { fontSize: '20px' }).setOrigin(0.5);
            }
        });
    }
}