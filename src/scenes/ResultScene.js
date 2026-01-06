import Phaser from 'phaser';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { RARITY, gameState } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.success = data.success;
        this.levelId = data.levelId;
        this.gold = data.gold || 0; 
        this.xp = data.xp || 0;
        this.baseHp = data.baseHp || 0; 
        this.loot = data.loot || {};
        this.biome = data.biome || 'forest'; 
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        // Fondo semi-transparente
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);

        // Título
        const titleText = this.success ? "¡MISIÓN CUMPLIDA!" : "¡DERROTA!";
        const titleColor = this.success ? '#ffd700' : '#ff0000';
        this.add.text(w/2, 80, titleText, { fontFamily: 'Cinzel', fontSize: '48px', fontStyle: 'bold', color: titleColor }).setOrigin(0.5);

        if (this.success) {
            // Estrellas
            let stars = 1;
            if (this.baseHp >= 20) stars = 3;
            else if (this.baseHp > 10) stars = 2;
            
            let starString = "";
            for(let i=0; i<3; i++) starString += (i < stars ? "⭐" : "☆");
            
            this.add.text(w/2, 140, starString, { fontSize: '40px' }).setOrigin(0.5);
            
            // Resumen Stats
            const statsY = 190;
            this.add.text(w/2, statsY, `Vida Restante: ${this.baseHp}/20`, { fontFamily: 'Roboto', fontSize: '18px', color: '#fff' }).setOrigin(0.5);
            this.add.text(w/2, statsY + 30, `Oro Ganado: ${this.gold}`, { fontFamily: 'Roboto', fontSize: '18px', color: '#ffd700' }).setOrigin(0.5);
            this.add.text(w/2, statsY + 60, `XP Ganada: ${this.xp}`, { fontFamily: 'Roboto', fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);

            // Guardar Progreso
            const progressKey = `${this.biome}_${this.levelId}`;
            const currentStars = gameState.completedLevels[progressKey] || 0;
            if (stars > currentStars) gameState.completedLevels[progressKey] = stars;
            gameState.gold += this.gold;
            SaveSystem.save();

            // --- SECCIÓN DE LOOT MEJORADA (2 COLUMNAS) ---
            this.add.text(w/2, 300, "-- MATERIALES OBTENIDOS --", { fontSize: '20px', color: '#aaa' }).setOrigin(0.5);
            
            // Preparar lista plana de items para mostrarlos
            let lootItems = [];
            for (let matKey in this.loot) {
                const rarities = this.loot[matKey];
                for (let rarityKey in rarities) {
                    const count = rarities[rarityKey];
                    if (count > 0) {
                        const matDef = RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey];
                        const name = matDef ? matDef.name : matKey;
                        const rData = RARITY[rarityKey];
                        const color = '#' + rData.color.toString(16).padStart(6,'0');
                        
                        lootItems.push({ text: `${count}x ${name} (${rData.name})`, color: color });
                    }
                }
            }

            if (lootItems.length === 0) {
                this.add.text(w/2, 350, "(Ninguno)", { fontSize: '16px', color: '#555' }).setOrigin(0.5);
            } else {
                // Lógica de columnas
                const startY = 340;
                const lineHeight = 25;
                const columnGap = 300; // Separación entre col izq y der
                const maxPerColumn = 8; // Máximo ítems antes de saltar a la 2da columna

                lootItems.forEach((item, index) => {
                    // Calcular columna (0 o 1)
                    const col = Math.floor(index / maxPerColumn);
                    // Calcular fila (0 a maxPerColumn)
                    const row = index % maxPerColumn;

                    // Posición X: Si es col 0, resta gap/2 al centro. Si es col 1, suma.
                    // Si solo hay 1 columna (menos de 8 items), centrado.
                    let posX = w/2;
                    if (lootItems.length > maxPerColumn) {
                        posX = (w/2) - (columnGap/2) + (col * columnGap);
                    }

                    const posY = startY + (row * lineHeight);

                    this.add.text(posX, posY, item.text, { 
                        fontFamily: 'Roboto', fontSize: '16px', color: item.color 
                    }).setOrigin(0.5);
                });
            }

        } else {
            this.add.text(w/2, h/2, "El castillo ha caído...", { fontSize: '24px', color: '#aaa' }).setOrigin(0.5);
        }

        const btn = this.add.rectangle(w/2, h - 80, 200, 50, 0x444444).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xffffff);
        this.add.text(w/2, h - 80, "MENU PRINCIPAL", { fontSize: '20px' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
}