// src/scenes/ChestScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import { RARITY } from '../config/GameState.js';

export default class ChestScene extends Phaser.Scene {
    constructor() { super('ChestScene'); }
    
    init(data) {
        this.biome = data.biome || 'forest';
        this.level = data.level || 1;
        this.winData = data.winData; // Para pasar al ResultScene después
    }

    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
        
        this.add.text(w/2, h*0.2, "¡JEFE DERROTADO!", { fontFamily: 'Cinzel', fontSize: '40px', color: '#ffd700' }).setOrigin(0.5);
        
        // Cofre cerrado
        this.chest = this.add.rectangle(w/2, h/2, 100, 80, 0x8B4513).setStrokeStyle(4, 0xffd700);
        this.chestText = this.add.text(w/2, h/2, "ABRIR", { fontSize: '20px' }).setOrigin(0.5);
        
        this.chest.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openChest());
    }

    openChest() {
        this.chest.disableInteractive();
        this.chestText.setVisible(false);
        this.tweens.add({ targets: this.chest, scale: 1.2, duration: 200, yoyo: true, onComplete: () => {
            this.generateLoot();
        }});
    }

    generateLoot() {
        const w = this.scale.width;
        
        // Generar 3-5 materiales basados en el bioma
        const count = Phaser.Math.Between(3, 5);
        let textY = this.scale.height * 0.4;
        
        for(let i=0; i<count; i++) {
            const drop = RPGSystem.getDropForLevel(this.biome, this.level) || RPGSystem.getDropForLevel(this.biome, 1); // Fallback
            if(drop) {
                // Dar material
                if(!gameState.materials[drop.key]) gameState.materials[drop.key] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
                gameState.materials[drop.key][drop.rarity]++;
                
                const rData = RARITY[drop.rarity];
                const color = '#' + rData.color.toString(16).padStart(6,'0');
                
                this.add.text(w/2, textY, `+1 ${drop.key.toUpperCase()} (${rData.name})`, { 
                    fontFamily: 'Roboto', fontSize: '24px', color: color, stroke: '#000', strokeThickness: 2 
                }).setOrigin(0.5);
                textY += 40;
            }
        }

        const btn = this.add.rectangle(w/2, this.scale.height - 100, 200, 50, 0x006400).setInteractive();
        this.add.text(w/2, this.scale.height - 100, "CONTINUAR", { fontSize: '20px' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('ResultScene', this.winData); // Ir a resultados
        });
    }
}