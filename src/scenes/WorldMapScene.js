// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { BIOME_ENEMIES, ENEMY_DB } from '../config/Enemies.js'; // Importamos datos de enemigos
import { RAW_MATERIALS } from '../config/Materials.js'; // Para nombres bonitos de drops

// Textos de Lore para el panel
const BIOME_LORE = {
    forest: "El Bosque Ancestral, hogar de criaturas que protegen la naturaleza con ferocidad. Se dice que los árboles susurran secretos de magia antigua.",
    mountain: "Las Cumbres de Hierro, una tierra implacable donde solo los más fuertes sobreviven. Bandidos y elementales custodian ricas vetas de mineral.",
    volcano: "Las Tierras de Ceniza. El calor es sofocante y el suelo tiembla bajo los pasos de demonios y bestias de fuego nacidas del núcleo del mundo."
};

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
        this.currentBiomeIndex = 0;
        this.biomeKeys = Object.keys(BIOMES);
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        const w = this.scale.width;
        const h = this.scale.height;

        // Fondo del Mapa (Gris oscuro por defecto)
        this.add.rectangle(w/2, h/2, w, h, 0x1a1a1a);
        
        // Título Principal
        this.add.text(w/2, 50, "MAPA DEL MUNDO", {
            fontFamily: 'Cinzel', fontSize: '32px', color: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        // Contenedor para el Panel de Información (Derecha)
        this.infoPanelContainer = this.add.container(w * 0.7, h * 0.5); // Posición base a la derecha
        this.add.existing(this.infoPanelContainer);
        
        // Inicializar UI de selección
        this.createBiomeSelect(w, h);
        
        // Inicializar Panel de Info
        this.createBiomeInfoPanel();

        // Cargar la vista del bioma actual
        this.updateBiomeView();

        // Botón Volver al Menú
        const backBtn = this.add.rectangle(100, h - 50, 150, 50, 0x8b0000)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xffffff);
        const backText = this.add.text(100, h - 50, "VOLVER", {
            fontFamily: 'Cinzel', fontSize: '20px', color: '#fff'
        }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }

    createBiomeSelect(w, h) {
        // Flechas de navegación de bioma
        const leftArrow = this.add.text(100, h/2, "<", { fontSize: '64px', color: '#ffd700' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        const rightArrow = this.add.text(w - 100, h/2, ">", { fontSize: '64px', color: '#ffd700' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);

        leftArrow.on('pointerdown', () => this.changeBiome(-1));
        rightArrow.on('pointerdown', () => this.changeBiome(1));

        // Contenedor de niveles (Centro-Izquierda)
        this.levelsContainer = this.add.container(w * 0.35, h * 0.5);
    }

    createBiomeInfoPanel() {
        // Fondo del panel
        const bg = this.add.rectangle(0, 0, 350, 500, 0x000000, 0.8)
            .setStrokeStyle(2, 0xffd700);
        
        // Título del Panel
        const title = this.add.text(0, -220, "INFORMACIÓN DE ZONA", {
            fontFamily: 'Cinzel', fontSize: '22px', color: '#ffd700'
        }).setOrigin(0.5);

        // Texto de Lore (Historia)
        this.loreText = this.add.text(0, -150, "", {
            fontFamily: 'Roboto', fontSize: '16px', color: '#ffffff', align: 'center',
            wordWrap: { width: 320 }
        }).setOrigin(0.5);

        // Sección Enemigos
        const enemiesHeader = this.add.text(0, -60, "-- ENEMIGOS --", {
            fontFamily: 'Cinzel', fontSize: '18px', color: '#ffaaaa'
        }).setOrigin(0.5);
        
        this.enemiesListText = this.add.text(0, 20, "", {
            fontFamily: 'Roboto', fontSize: '14px', color: '#dddddd', align: 'center',
            wordWrap: { width: 320 }
        }).setOrigin(0.5);

        // Sección Drops
        const dropsHeader = this.add.text(0, 100, "-- RECURSOS --", {
            fontFamily: 'Cinzel', fontSize: '18px', color: '#aaffaa'
        }).setOrigin(0.5);

        this.dropsListText = this.add.text(0, 160, "", {
            fontFamily: 'Roboto', fontSize: '14px', color: '#dddddd', align: 'center',
            wordWrap: { width: 320 }
        }).setOrigin(0.5);

        this.infoPanelContainer.add([bg, title, this.loreText, enemiesHeader, this.enemiesListText, dropsHeader, this.dropsListText]);
    }

    changeBiome(dir) {
        this.currentBiomeIndex += dir;
        if (this.currentBiomeIndex < 0) this.currentBiomeIndex = this.biomeKeys.length - 1;
        if (this.currentBiomeIndex >= this.biomeKeys.length) this.currentBiomeIndex = 0;
        this.updateBiomeView();
    }

    updateBiomeView() {
        const biomeKey = this.biomeKeys[this.currentBiomeIndex];
        const biomeData = BIOMES[biomeKey];

        // --- CORRECCIÓN: Limpiar texto anterior ---
        if (this.biomeTitle) this.biomeTitle.destroy();
        
        // Título del Bioma (Centro-Arriba)
        this.biomeTitle = this.add.text(this.scale.width / 2, 120, `ZONA: ${biomeData.name.toUpperCase()}`, {
            fontFamily: 'Cinzel', fontSize: '36px', color: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        // Cambiar fondo (color temático)
        this.cameras.main.setBackgroundColor(biomeData.theme.bg);

        // Actualizar Niveles
        this.levelsContainer.removeAll(true);
        this.createLevelButtons(biomeKey);

        // Actualizar Panel de Información
        this.updateInfoPanelContent(biomeKey);
    }

    updateInfoPanelContent(biomeKey) {
        // 1. Lore
        const lore = BIOME_LORE[biomeKey] || "Una zona misteriosa e inexplorada.";
        this.loreText.setText(lore);

        // 2. Enemigos
        const biomeConfig = BIOME_ENEMIES[biomeKey];
        let uniqueEnemies = new Set();
        
        if (biomeConfig) {
            // Recorrer tiers y bosses para sacar nombres únicos
            biomeConfig.tiers.forEach(tier => tier.forEach(k => uniqueEnemies.add(k)));
            biomeConfig.miniBosses.forEach(k => uniqueEnemies.add(k));
            Object.values(biomeConfig.bosses).forEach(k => uniqueEnemies.add(k));
        }

        let enemyNames = [];
        let uniqueDrops = new Set();

        uniqueEnemies.forEach(key => {
            const data = ENEMY_DB[key];
            if (data) {
                enemyNames.push(data.name);
                // Recolectar drops
                if (data.drops) {
                    data.drops.forEach(d => uniqueDrops.add(d[0]));
                }
            }
        });

        // Formatear lista de enemigos (Ej: Goblin, Lobo, Oso...)
        // Limitamos a mostrar unos cuantos para que no se sature
        const enemyTextStr = enemyNames.slice(0, 8).join(", ") + (enemyNames.length > 8 ? "..." : "");
        this.enemiesListText.setText(enemyTextStr || "Desconocidos");

        // 3. Drops (Materiales)
        let dropNames = [];
        uniqueDrops.forEach(matKey => {
            const matName = (RAW_MATERIALS[matKey] || {name: matKey}).name;
            dropNames.push(matName);
        });

        const dropTextStr = dropNames.slice(0, 10).join(", ") + (dropNames.length > 10 ? "..." : "");
        this.dropsListText.setText(dropTextStr || "Ninguno conocido");
    }

    createLevelButtons(biomeKey) {
        // Grid de niveles 2x5
        let x = -150;
        let y = -150;
        
        for (let i = 1; i <= 10; i++) {
            const levelId = i;
            const isUnlocked = levelId <= (gameState.maxLevel || 1); // Desbloqueo simple por ahora
            
            const btn = this.add.rectangle(x, y, 80, 80, isUnlocked ? 0x222222 : 0x111111)
                .setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x550000);
            
            const txt = this.add.text(x, y, `${i}`, {
                fontFamily: 'Cinzel', fontSize: '32px', color: isUnlocked ? '#fff' : '#555'
            }).setOrigin(0.5);

            if (isUnlocked) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => {
                    this.scene.start('GameScene', { 
                        biome: biomeKey, 
                        level: levelId,
                        config: LEVEL_CONFIG[levelId] || {}
                    });
                });
                
                // Efecto hover
                btn.on('pointerover', () => btn.setFillStyle(0x444444));
                btn.on('pointerout', () => btn.setFillStyle(0x222222));
            }

            x += 100;
            if (i % 4 === 0) { // Salto de línea cada 4
                x = -150;
                y += 100;
            }
        }
    }
}