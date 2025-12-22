// src/scenes/ResultScene.js
import Phaser from 'phaser';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { RARITY } from '../config/GameState.js';

export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.success = data.success;
        this.levelId = data.levelId;
        this.gold = data.gold || 0;
        this.xp = data.xp || 0;
        this.baseHp = data.baseHp || 0; // Vida restante del castillo
        this.loot = data.loot || {};
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85);

        const titleText = this.success ? "¡MISIÓN CUMPLIDA!" : "¡DERROTA!";
        const titleColor = this.success ? '#ffd700' : '#ff0000';
        
        this.add.text(w/2, 100, titleText, { fontFamily: 'Cinzel', fontSize: '48px', fontStyle: 'bold', color: titleColor }).setOrigin(0.5);

        if (this.success) {
            // Cálculo de Estrellas
            // 20 HP = 3 estrellas, > 10 HP = 2 estrellas, > 0 = 1 estrella
            let stars = 1;
            if (this.baseHp >= 20) stars = 3;
            else if (this.baseHp > 10) stars = 2;

            // --- NUEVO: GUARDAR PROGRESO ---
            // this.levelId viene de GameScene (ej: 1, 2, 10...)
            // Necesitamos saber el bioma actual. Si no lo pasamos a ResultScene, 
            // podemos asumirlo o pasarlo en winData.
            // Para simplificar, asumo que 'GameScene' pasa el 'biome' a 'ChestScene' y este a 'ResultScene'.
            // SI NO: El mapa desbloqueará basandose en el ID numérico global.
            
            // Asumiendo que pasamos 'biome' en el objeto data.
            const biome = this.data.biome || 'forest'; // Default si falla
            const progressKey = `${biome}_${this.levelId}`;
            
            // Guardar solo si mejoramos el record
            const currentStars = gameState.completedLevels[progressKey] || 0;
            if (stars > currentStars) {
                gameState.completedLevels[progressKey] = stars;
                SaveSystem.save();
            }
            
            let starString = "";
            for(let i=0; i<3; i++) starString += (i < stars ? "⭐" : "☆");
            
            this.add.text(w/2, 160, starString, { fontSize: '40px' }).setOrigin(0.5);
            this.add.text(w/2, 210, `Vida Restante: ${this.baseHp}/20`, { fontFamily: 'Roboto', fontSize: '18px', color: '#fff' }).setOrigin(0.5);
            this.add.text(w/2, 240, `Oro Ganado: ${this.gold}`, { fontFamily: 'Roboto', fontSize: '18px', color: '#ffd700' }).setOrigin(0.5);
            this.add.text(w/2, 270, `XP Ganada: ${this.xp}`, { fontFamily: 'Roboto', fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);

            // Lista de Materiales
            this.add.text(w/2, 320, "-- MATERIALES OBTENIDOS --", { fontSize: '20px', color: '#aaa' }).setOrigin(0.5);
            
            let lootY = 360;
            let hasLoot = false;
            
            // Iterar loot acumulado { tipo: { rareza: cantidad } }
            for (let matKey in this.loot) {
                const rarities = this.loot[matKey];
                for (let rarityKey in rarities) {
                    const count = rarities[rarityKey];
                    if (count > 0) {
                        hasLoot = true;
                        const matDef = RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey];
                        const name = matDef ? matDef.name : matKey;
                        const rData = RARITY[rarityKey];
                        const color = '#' + rData.color.toString(16).padStart(6,'0');
                        
                        this.add.text(w/2, lootY, `${count}x ${name} (${rData.name})`, { 
                            fontFamily: 'Roboto', fontSize: '16px', color: color 
                        }).setOrigin(0.5);
                        lootY += 25;
                    }
                }
            }
            
            if (!hasLoot) {
                this.add.text(w/2, lootY, "(Ninguno)", { fontSize: '16px', color: '#555' }).setOrigin(0.5);
            }

        } else {
            this.add.text(w/2, h/2, "El castillo ha caído...", { fontSize: '24px', color: '#aaa' }).setOrigin(0.5);
        }

        const btn = this.add.rectangle(w/2, h - 100, 200, 50, 0x444444).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xffffff);
        this.add.text(w/2, h - 100, "MENU PRINCIPAL", { fontSize: '20px' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
}