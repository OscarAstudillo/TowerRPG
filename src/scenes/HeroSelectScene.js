// src/scenes/HeroSelectScene.js
import Phaser from 'phaser';
import { gameState, initHero, updatePlayerStats } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class HeroSelectScene extends Phaser.Scene {
    constructor() {
        super('HeroSelectScene');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // --- VISUAL: FONDO ---
        this.add.image(w/2, h/2, 'bg_menu').setDisplaySize(w, h).setAlpha(0.8);

        this.add.text(w / 2, 80, 'ELIGE TU HÉROE', {
            fontFamily: 'Cinzel', fontSize: '48px', color: '#ffd700', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        const heroes = [
            { id: 'guerrero', name: 'GUERRERO', desc: 'Tanque robusto.\nAlta vida y defensa.', color: 0xff0000, icon: 'hero_guerrero' },
            { id: 'mago', name: 'MAGO', desc: 'Daño mágico.\nExplosiones de área.', color: 0x00ffff, icon: 'hero_mago' },
            { id: 'arquero', name: 'ARQUERO', desc: 'Daño rápido.\nAlta velocidad de ataque.', color: 0x00ff00, icon: 'hero_arquero' },
            { id: 'asesino', name: 'ASESINO', desc: 'Daño crítico letal.\nBaja vida, alto riesgo.', color: 0x800080, icon: 'hero_asesino' }
        ];

        const startX = w / 2 - 350;
        const gap = 240;

        heroes.forEach((hData, index) => {
            const container = this.add.container(startX + (index * gap), h / 2);
            
            const bg = this.add.rectangle(0, 0, 220, 350, 0x000000, 0.7).setStrokeStyle(2, hData.color).setInteractive({ useHandCursor: true });
            
            // --- VISUAL: SPRITE ---
            let sprite;
            if (this.textures.exists(hData.icon)) {
                sprite = this.add.sprite(0, -60, hData.icon).setScale(1.5);
            } else {
                sprite = this.add.rectangle(0, -60, 64, 64, hData.color);
            }
            // ----------------------
            
            const title = this.add.text(0, 20, hData.name, { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
            const desc = this.add.text(0, 80, hData.desc, { fontSize: '14px', align: 'center', color: '#ccc' }).setOrigin(0.5);
            
            bg.on('pointerover', () => { 
                this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
                bg.setFillStyle(0x222222, 0.9);
            });
            bg.on('pointerout', () => { 
                this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
                bg.setFillStyle(0x000000, 0.7);
            });
            
            bg.on('pointerdown', () => this.selectHero(hData.id));

            container.add([bg, sprite, title, desc]);
        });
    }

    selectHero(classId) {
        // TU LÓGICA ORIGINAL RECUPERADA
        gameState.selectedClass = classId;
        
        // Aseguramos initHero por si hace falta resetear stats base en GameState
        if (typeof initHero === 'function') initHero(classId); 
        
        updatePlayerStats();
        SaveSystem.save();
        
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenuScene');
        });
    }
}