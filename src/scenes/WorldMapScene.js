// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js'; // Importación Correcta
import { gameState } from '../config/GameState.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() { super('WorldMapScene'); }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);
        this.add.text(this.scale.width / 2, 50, "MAPA DEL MUNDO", { fontFamily: 'Cinzel', fontSize: '32px', color: '#ffd700' }).setOrigin(0.5);

        this.container = this.add.container(0, 0);
        
        // Estado inicial: Mostrando Biomas
        this.showBiomes();

        // Botón volver
        const backBtn = this.add.text(50, this.scale.height - 50, "VOLVER", { fontSize: '20px', color: '#fff' }).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            if (this.currentView === 'levels') {
                this.showBiomes();
            } else {
                this.scene.start('MainMenuScene');
            }
        });
    }

    showBiomes() {
        this.currentView = 'biomes';
        this.container.removeAll(true);
        
        let y = 150;
        Object.keys(BIOMES).forEach(key => {
            const biome = BIOMES[key];
            const btn = this.add.rectangle(this.scale.width / 2, y, 400, 80, biome.bg).setInteractive({ useHandCursor: true });
            btn.setStrokeStyle(2, 0xffffff);
            
            const title = this.add.text(this.scale.width / 2, y - 20, biome.name, { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
            const desc = this.add.text(this.scale.width / 2, y + 20, biome.desc, { fontSize: '14px' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => this.showLevels(key));
            
            this.container.add([btn, title, desc]);
            y += 100;
        });
    }

    showLevels(biomeKey) {
        this.currentView = 'levels';
        this.container.removeAll(true);
        const biome = BIOMES[biomeKey];

        this.add.text(this.scale.width/2, 100, `ZONA: ${biome.name}`, { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);

        let x = 100, y = 200;
        const cols = 5;

        // Mostrar 10 niveles
        for (let i = 1; i <= 10; i++) {
            const config = LEVEL_CONFIG[i];
            const color = (i <= (gameState.maxLevel || 1)) ? 0x006400 : 0x333333; // Desbloqueado vs Bloqueado
            
            const btn = this.add.rectangle(x, y, 80, 80, color).setInteractive({ useHandCursor: true });
            btn.setStrokeStyle(2, 0xffffff);
            
            const txt = this.add.text(x, y, `${i}`, { fontSize: '28px', fontStyle: 'bold' }).setOrigin(0.5);
            const info = this.add.text(x, y + 50, `Tier ${config.tier}`, { fontSize: '12px', color: '#aaa' }).setOrigin(0.5);

            if (i <= (gameState.maxLevel || 1)) {
                btn.on('pointerdown', () => {
                    // Iniciar juego con datos del bioma y nivel
                    this.scene.start('GameScene', { level: i, biome: biomeKey, config: config });
                });
            }

            this.container.add([btn, txt, info]);
            
            x += 120;
            if (i % cols === 0) { x = 100; y += 140; }
        }
    }
}