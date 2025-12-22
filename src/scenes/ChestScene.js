// src/scenes/ChestScene.js
import Phaser from 'phaser';
import { gameState, RARITY } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import { RAW_MATERIALS } from '../config/Materials.js';

export default class ChestScene extends Phaser.Scene {
    constructor() { super('ChestScene'); }
    
    init(data) {
        this.biome = data.biome || 'forest';
        this.level = data.level || 1;
        // CORRECCIÓN CRÍTICA: success: true para que ResultScene sepa que ganamos
        this.winData = { 
            success: true, 
            levelId: this.level,
            gold: data.winData?.gold || 0,
            xp: data.winData?.xp || 0
        }; 
    }

    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
        
        this.add.text(w/2, h*0.15, "¡NIVEL COMPLETADO!", { fontFamily: 'Cinzel', fontSize: '40px', color: '#ffd700' }).setOrigin(0.5);
        this.add.text(w/2, h*0.22, `Bioma: ${this.biome.toUpperCase()} - Nivel ${this.level}`, { fontFamily: 'Roboto', fontSize: '20px', color: '#aaa' }).setOrigin(0.5);

        // Cofre cerrado
        this.chest = this.add.rectangle(w/2, h/2, 120, 100, 0x8B4513).setStrokeStyle(4, 0xffd700);
        this.chestText = this.add.text(w/2, h/2, "ABRIR COFRE", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.chest.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openChest());
    }

    openChest() {
        this.chest.disableInteractive();
        this.chestText.setVisible(false);
        
        this.tweens.add({ targets: this.chest, scale: 1.2, duration: 200, yoyo: true, onComplete: () => {
            this.chest.setFillStyle(0xDAA520); // Abierto (Dorado)
            this.generateDisplayLoot();
        }});
    }

    generateDisplayLoot() {
        const w = this.scale.width;
        
        // LLAMADA AL NUEVO SISTEMA DE LOOT
        const loot = RPGSystem.getChestLoot(this.biome, this.level);
        
        let textY = this.scale.height * 0.4;
        this.add.text(w/2, textY - 40, "- RECOMPENSAS -", { fontSize: '24px', color: '#fff' }).setOrigin(0.5);

        if (loot.length === 0) {
             this.add.text(w/2, textY, "¡El cofre estaba vacío!", { fontSize: '20px', color: '#aaa' }).setOrigin(0.5);
        } else {
            loot.forEach(item => {
                const rData = RARITY[item.rarity];
                const color = '#' + rData.color.toString(16).padStart(6,'0');
                const matName = RAW_MATERIALS[item.key] ? RAW_MATERIALS[item.key].name : item.key;
                
                const bonusText = item.bonus ? " (BONUS!)" : "";
                
                this.add.text(w/2, textY, `+${item.amount} ${matName} [${rData.name}]${bonusText}`, { 
                    fontFamily: 'Roboto', fontSize: '22px', color: color, stroke: '#000', strokeThickness: 2 
                }).setOrigin(0.5);
                textY += 35;
            });
        }

        const btn = this.add.rectangle(w/2, this.scale.height - 100, 200, 50, 0x006400).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0x00ff00);
        this.add.text(w/2, this.scale.height - 100, "CONTINUAR", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('ResultScene', this.winData); // Pasar datos correctos
        });
    }
}