// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { gameState } from '../config/GameState.js';

export default class WorldMapScene extends Phaser.Scene {
    constructor() { super('WorldMapScene'); }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);
        this.add.text(this.scale.width / 2, 50, "MAPA DEL MUNDO", { fontFamily: 'Cinzel', fontSize: '35px', color: '#ffd700' }).setOrigin(0.5);

        this.container = this.add.container(0, 0);
        
        // Estado inicial: Mostrando Biomas
        this.showBiomes();

        // Botón volver
        const backBtn = this.add.text(50, this.scale.height - 50, "VOLVER", { fontSize: '30px', color: '#ffffffff' }).setInteractive({ useHandCursor: true });
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
            // Todos los biomas desbloqueados por diseño, el jugador elige donde farmear
            const btn = this.add.rectangle(this.scale.width / 2, y, 400, 80, biome.bg).setInteractive({ useHandCursor: true });
            btn.setStrokeStyle(2, 0xffffff);
            
            const title = this.add.text(this.scale.width / 2, y - 20, biome.name, { fontSize: '30px', fontStyle: 'bold' }).setOrigin(0.5);
            const desc = this.add.text(this.scale.width / 2, y + 20, biome.desc, { fontSize: '19px' }).setOrigin(0.5);
            
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
            
            // LÓGICA DE BLOQUEO
            // Nivel 1 siempre abierto.
            // Nivel > 1 requiere que el nivel anterior tenga estrellas registradas.
            let isLocked = false;
            let stars = 0;
            const progressKey = `${biomeKey}_${i}`;
            const prevKey = `${biomeKey}_${i-1}`;

            if (i > 1) {
                // Si el nivel anterior no tiene estrellas, este está bloqueado
                if (!gameState.completedLevels[prevKey]) {
                    isLocked = true;
                }
            }
            
            if (gameState.completedLevels[progressKey]) {
                stars = gameState.completedLevels[progressKey];
            }

            // Visuales
            const color = isLocked ? 0x333333 : 0x006400;
            const stroke = isLocked ? 0x555555 : 0xffffff;
            
            const btn = this.add.rectangle(x, y, 100, 100, color).setInteractive({ useHandCursor: !isLocked });
            btn.setStrokeStyle(2, stroke);
            
            if (isLocked) {
                // Icono Candado (Texto simple por ahora)
                const lock = this.add.text(x, y, "🔒", { fontSize: '32px' }).setOrigin(0.5);
                this.container.add([btn, lock]);
            } else {
                // Nivel desbloqueado
                const txt = this.add.text(x, y, `${i}`, { fontSize: '32px', fontStyle: 'bold' }).setOrigin(0.5);
                const info = this.add.text(x, y + 70, `Nivel ${config.tier}`, { fontSize: '24px', color: '#ffffffff' }).setOrigin(0.5);
                
                // Dibujar Estrellas obtenidas
                let starStr = "";
                for(let s=0; s<stars; s++) starStr += "⭐";
                const starsTxt = this.add.text(x, y - 50, starStr, { fontSize: '12px' }).setOrigin(0.5);

                btn.on('pointerdown', () => {
                    this.scene.start('GameScene', { level: i, biome: biomeKey, config: config });
                });
                
                this.container.add([btn, txt, info, starsTxt]);
            }
            
            x += 120;
            if (i % cols === 0) { x = 100; y += 140; }
        }
    }
}