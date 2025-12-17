// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
import { LEVELS } from '../config/Levels.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        // Fondo Azul oscuro (Océano/Mapa)
        this.add.rectangle(640, 360, 1280, 720, 0x001a33);
        
        this.add.text(640, 50, 'MAPA MUNDI', { fontSize: '40px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        this.add.text(640, 90, 'Selecciona tu destino', { fontSize: '20px', color: '#aaa' }).setOrigin(0.5);

        // Dibujar líneas entre niveles (camino visual)
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.3);
        
        // Coordenadas visuales de los nodos en el mapa
        const mapPositions = [
            { x: 200, y: 360 }, // Nivel 1
            { x: 640, y: 360 }, // Nivel 2
            { x: 1080, y: 360 } // Nivel 3
        ];

        // Dibujar conexiones
        graphics.beginPath();
        graphics.moveTo(mapPositions[0].x, mapPositions[0].y);
        for(let i=1; i<mapPositions.length; i++) graphics.lineTo(mapPositions[i].x, mapPositions[i].y);
        graphics.strokePath();

        // Crear Nodos de Nivel
        LEVELS.forEach((level, index) => {
            const pos = mapPositions[index];
            const isUnlocked = gameState.levelsUnlocked >= level.id;

            // Color: Verde si desbloqueado, Gris si bloqueado, Dorado si es el último
            let color = 0x555555;
            if (isUnlocked) color = 0x00aa00;
            if (gameState.levelsUnlocked === level.id) color = 0xffd700; // Nivel actual

            // Círculo del nivel
            const circle = this.add.circle(pos.x, pos.y, 40, color);
            
            // Texto del Nivel
            this.add.text(pos.x, pos.y - 60, `NIVEL ${level.id}`, { fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(pos.x, pos.y + 60, level.name, { fontSize: '14px', color: '#ccc' }).setOrigin(0.5);

            if (isUnlocked) {
                circle.setInteractive({ useHandCursor: true });
                
                // Efecto al pasar el mouse
                circle.on('pointerover', () => circle.setScale(1.2));
                circle.on('pointerout', () => circle.setScale(1));

                // AL HACER CLIC: Iniciar juego con los datos de este nivel
                circle.on('pointerdown', () => {
                    this.scene.start('GameScene', { levelData: level }); // <--- PASAMOS DATOS
                });
            } else {
                // Candado
                this.add.text(pos.x, pos.y, '🔒', { fontSize: '24px' }).setOrigin(0.5);
            }
        });

        // Botón Volver al Menú
        const backBtn = this.add.rectangle(100, 50, 150, 40, 0x333333).setInteractive({ useHandCursor: true });
        this.add.text(100, 50, '< MENÚ', { fontSize: '16px' }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}