// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { BIOME_ENEMIES, ENEMY_DB } from '../config/Enemies.js'; 
import { RAW_MATERIALS } from '../config/Materials.js'; 

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

        this.bgImage = this.add.image(w/2, h/2, 'bg_forest').setDisplaySize(w, h).setDepth(-10);
        
        this.add.text(w/2, 50, "MAPA DEL MUNDO", {
            fontFamily: 'Cinzel', fontSize: '32px', color: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.infoPanelContainer = this.add.container(w * 0.76, h * 0.5);
        this.add.existing(this.infoPanelContainer);
        
        this.createBiomeSelect(w, h);
        this.createBiomeInfoPanel();
        this.updateBiomeView();

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
        const leftArrow = this.add.text(100, h/2, "<", { fontSize: '64px', color: '#ffd700' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        const rightArrow = this.add.text(w - 100, h/2, ">", { fontSize: '64px', color: '#ffd700' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);

        leftArrow.on('pointerdown', () => this.changeBiome(-1));
        rightArrow.on('pointerdown', () => this.changeBiome(1));

        this.levelsContainer = this.add.container(w * 0.35, h * 0.5);
        this.add.existing(this.levelsContainer); 
    }

    createBiomeInfoPanel() {
        const bg = this.add.rectangle(0, 0, 400, 600, 0x000000, 0.85).setStrokeStyle(2, 0xffd700);
        const title = this.add.text(0, -260, "INFORMACIÓN DE ZONA", { fontFamily: 'Cinzel', fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);
        this.loreText = this.add.text(0, -180, "", { fontFamily: 'Roboto', fontSize: '16px', color: '#ffffff', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);
        const enemiesHeader = this.add.text(0, -80, "-- ENEMIGOS --", { fontFamily: 'Cinzel', fontSize: '20px', color: '#ffaaaa' }).setOrigin(0.5);
        this.enemiesListText = this.add.text(0, 0, "", { fontFamily: 'Roboto', fontSize: '15px', color: '#dddddd', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);
        const dropsHeader = this.add.text(0, 100, "-- RECURSOS --", { fontFamily: 'Cinzel', fontSize: '20px', color: '#aaffaa' }).setOrigin(0.5);
        this.dropsListText = this.add.text(0, 180, "", { fontFamily: 'Roboto', fontSize: '15px', color: '#dddddd', align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5);

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

        const bgKey = `bg_${biomeKey}`;
        if (this.textures.exists(bgKey)) this.bgImage.setTexture(bgKey);
        else this.bgImage.setTexture('bg_forest');

        if (this.biomeTitle) this.biomeTitle.destroy();
        this.biomeTitle = this.add.text(this.scale.width / 2, 100, `ZONA: ${biomeData.name.toUpperCase()}`, {
            fontFamily: 'Cinzel', fontSize: '40px', color: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.levelsContainer.removeAll(true);
        this.createLevelButtons(biomeKey);
        this.updateInfoPanelContent(biomeKey);
    }

    updateInfoPanelContent(biomeKey) {
        const lore = BIOME_LORE[biomeKey] || "Una zona misteriosa e inexplorada.";
        this.loreText.setText(lore);

        const biomeConfig = BIOME_ENEMIES[biomeKey];
        let uniqueEnemies = new Set();
        if (biomeConfig) {
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
                if (data.drops) data.drops.forEach(d => uniqueDrops.add(d[0]));
            }
        });

        const enemyTextStr = enemyNames.slice(0, 10).join(", ") + (enemyNames.length > 10 ? "..." : "");
        this.enemiesListText.setText(enemyTextStr || "Desconocidos");

        let dropNames = [];
        uniqueDrops.forEach(matKey => {
            const matName = (RAW_MATERIALS[matKey] || {name: matKey}).name;
            dropNames.push(matName);
        });

        const dropTextStr = dropNames.slice(0, 12).join(", ") + (dropNames.length > 12 ? "..." : "");
        this.dropsListText.setText(dropTextStr || "Ninguno conocido");
    }

    createLevelButtons(biomeKey) {
        let startX = -75;
        let startY = -200;
        let x = startX;
        let y = startY;
        
        // --- CORRECCIÓN: USAR PROGRESO POR BIOMA ---
        if (!gameState.biomeLevels) gameState.biomeLevels = { forest: 1, mountain: 1, volcano: 1 };
        const maxLevelForThisBiome = gameState.biomeLevels[biomeKey] || 1;
        // -------------------------------------------

        for (let i = 1; i <= 10; i++) {
            const levelId = i;
            
            // --- CORRECCIÓN: COMPARAR SOLO CON EL BIOMA ACTUAL ---
            const isUnlocked = levelId <= maxLevelForThisBiome;
            // -----------------------------------------------------
            
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
                
                btn.on('pointerover', () => btn.setFillStyle(0x444444));
                btn.on('pointerout', () => btn.setFillStyle(0x222222));
            }

            this.levelsContainer.add([btn, txt]);

            if (i % 2 === 0) { x = startX; y += 100; } else { x += 150; }
        }
    }
}