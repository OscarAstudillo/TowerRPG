// src/scenes/WorldMapScene.js
import Phaser from 'phaser';
import { gameState } from '../config/GameState.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { BIOME_ENEMIES, ENEMY_DB } from '../config/Enemies.js'; 
import { RAW_MATERIALS } from '../config/Materials.js'; 
import SoundManager from '../systems/SoundManager.js';

const BIOME_LORE = {
    forest: "El Bosque Ancestral, hogar de criaturas que protegen la naturaleza con ferocidad. Se dice que los árboles susurran secretos de magia antigua.",
    mountain: "Las Cumbres de Hierro, una tierra implacable donde solo los más fuertes sobreviven. Bandidos y elementales custodian ricas vetas de mineral.",
    volcano: "Las Tierras de Ceniza. El calor es sofocante y el suelo tiembla bajo los pasos de demonios y bestias de fuego nacidas del núcleo del mundo.",
    endless: "Una dimensión retorcida donde el tiempo no existe. Las criaturas de todos los reinos convergen aquí para probar la valía de los héroes legendarios."
};

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
        this.currentBiomeIndex = 0;
        this.biomeKeys = Object.keys(BIOMES); // Incluye 'endless' si está en Levels.js
        this.currentSelectedDifficulty = 1;
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        const w = this.scale.width;
        const h = this.scale.height;

        this.bgImage = this.add.image(w/2, h/2, 'bg_forest')
            .setDisplaySize(w, h)
            .setDepth(-10);
        
        this.add.text(w/2, 50, "MAPA DEL MUNDO", {
            fontFamily: 'Cinzel', fontSize: '32px', color: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.infoPanelContainer = this.add.container(w * 0.76, h * 0.5);
        this.levelsContainer = this.add.container(w * 0.35, h * 0.5); 
        
        this.createDifficultySelector(w);
        this.createBiomeSelect(w, h);
        this.createBiomeInfoPanel();
        
        this.updateBiomeView();

        const backBtn = this.add.rectangle(100, h - 50, 150, 50, 0x8b0000)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xffffff);
        this.add.text(100, h - 50, "VOLVER", {
            fontFamily: 'Cinzel', fontSize: '20px', color: '#fff'
        }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => {
            SoundManager.playSound('ui_click');
            this.scene.start('MainMenuScene');
        });
    }

    createDifficultySelector(w) {
        const startX = w * 0.35; 
        const y = 130;
        
        this.diffButtons = [];
        const diffs = [
            { val: 1, label: 'FÁCIL', color: 0x00aa00 },
            { val: 2, label: 'NORMAL', color: 0x0000aa },
            { val: 3, label: 'DIFÍCIL', color: 0xaa0000 }
        ];

        const totalW = (diffs.length * 150);
        const offset = startX - (totalW / 2) + 75;

        diffs.forEach((d, i) => {
            const btn = this.add.container(offset + (i * 150), y);
            const bg = this.add.rectangle(0, 0, 140, 40, 0x222222).setInteractive({useHandCursor:true});
            bg.setStrokeStyle(2, d.color);
            const txt = this.add.text(0, 0, d.label, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
            const lock = this.add.text(50, 0, "🔒", { fontSize: '16px' }).setOrigin(0.5).setVisible(false);

            bg.on('pointerdown', () => this.trySelectDifficulty(d.val));

            btn.add([bg, txt, lock]);
            btn.bg = bg; btn.lock = lock; btn.diffValue = d.val; btn.baseColor = d.color;
            this.add.existing(btn);
            this.diffButtons.push(btn);
        });
    }

    trySelectDifficulty(diff) {
        const currentBiome = this.biomeKeys[this.currentBiomeIndex];
        if (currentBiome === 'endless') return; // Bloquear cambio de dificultad en endless

        if (diff > 1) {
            const prevDiff = diff - 1;
            const stars = this.getBiomeTotalStars(currentBiome, prevDiff);
            
            if (stars < 30) {
                this.cameras.main.shake(100, 0.005);
                SoundManager.playSound('ui_click'); 
                const toast = this.add.text(this.scale.width/2, this.scale.height/2, 
                    `¡BLOQUEADO!\nNecesitas 30 estrellas en dificultad anterior.\nTienes: ${stars}/30`, 
                    { fontSize:'24px', backgroundColor:'#000000', color:'#ff0000', padding: {x:10, y:10}, align: 'center' }
                ).setOrigin(0.5).setDepth(2000);
                this.tweens.add({ targets: toast, alpha: 0, duration: 2000, delay: 1000, onComplete: () => toast.destroy() });
                return;
            }
        }

        this.currentSelectedDifficulty = diff;
        SoundManager.playSound('ui_click');
        this.updateDifficultyButtonsVisuals();
        this.levelsContainer.removeAll(true); // Limpiar contenedor antes de recrear
        this.createLevelButtons(currentBiome);
        this.updateInfoPanelContent(currentBiome); 
    }

    getBiomeTotalStars(biomeKey, difficulty) {
        let total = 0;
        for (let i = 1; i <= 10; i++) {
            const key = `${biomeKey}_${difficulty}_${i}`;
            total += (gameState.levelStars[key] || 0);
        }
        return total;
    }

    updateDifficultyButtonsVisuals() {
        const currentBiome = this.biomeKeys[this.currentBiomeIndex];
        const isEndless = (currentBiome === 'endless');
        this.diffButtons.forEach(btn => btn.setVisible(!isEndless));

        if (!isEndless) {
            this.diffButtons.forEach(btn => {
                const d = btn.diffValue;
                let locked = false;
                if (d > 1) {
                    const prevDiff = d - 1;
                    const stars = this.getBiomeTotalStars(currentBiome, prevDiff);
                    if (stars < 30) locked = true;
                }
                btn.lock.setVisible(locked);
                if (this.currentSelectedDifficulty === d) {
                    btn.bg.setFillStyle(0x555555);
                    btn.bg.setStrokeStyle(3, 0xffd700); 
                } else {
                    btn.bg.setFillStyle(locked ? 0x111111 : 0x222222);
                    btn.bg.setStrokeStyle(1, locked ? 0x555555 : btn.baseColor);
                }
            });
        }
    }

    createBiomeSelect(w, h) {
        const leftArrow = this.add.text(100, h/2, "<", { fontSize: '64px', color: '#ffd700' }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        const rightArrow = this.add.text(w - 100, h/2, ">", { fontSize: '64px', color: '#ffd700' }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        leftArrow.on('pointerdown', () => this.changeBiome(-1));
        rightArrow.on('pointerdown', () => this.changeBiome(1));
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
        this.currentSelectedDifficulty = 1;
        this.updateBiomeView();
    }

    updateBiomeView() {
        const biomeKey = this.biomeKeys[this.currentBiomeIndex];
        const biomeData = BIOMES[biomeKey];

        let targetBgKey = `bg_${biomeKey}`; 
        if (biomeKey === 'forest') {
            if (this.textures.exists('Fondo_Bosque')) targetBgKey = 'Fondo_Bosque';
            else if (this.textures.exists('bg_map_forest')) targetBgKey = 'bg_map_forest';
        }
        else if (biomeKey === 'mountain') {
            if (this.textures.exists('Fondo_Montaña')) targetBgKey = 'Fondo_Montaña';
            else if (this.textures.exists('bg_map_mountain')) targetBgKey = 'bg_map_mountain';
        }
        else if (biomeKey === 'volcano') {
            if (this.textures.exists('Fondo_Volcan')) targetBgKey = 'Fondo_Volcan';
            else if (this.textures.exists('bg_map_volcano')) targetBgKey = 'bg_map_volcano';
        }

        if (this.textures.exists(targetBgKey)) {
            this.bgImage.setTexture(targetBgKey);
            this.bgImage.setTint(0xffffff); 
        } else {
            this.bgImage.setTexture('pixel'); 
            this.bgImage.setTint(biomeData.color || 0x000000); 
        }
        this.bgImage.setDisplaySize(this.scale.width, this.scale.height);

        if (this.biomeTitle) this.biomeTitle.destroy();
        this.biomeTitle = this.add.text(this.scale.width / 2, 80, `ZONA: ${biomeData.name.toUpperCase()}`, {
            fontFamily: 'Cinzel', fontSize: '40px', color: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.updateDifficultyButtonsVisuals();
        
        this.levelsContainer.removeAll(true);
        this.createLevelButtons(biomeKey);
        
        this.updateInfoPanelContent(biomeKey);
    }

    updateInfoPanelContent(biomeKey) {
        const lore = BIOME_LORE[biomeKey] || "Una zona misteriosa e inexplorada.";
        this.loreText.setText(lore);

        if (biomeKey === 'endless') {
            this.enemiesListText.setText("¡TODOS LOS ENEMIGOS!");
            this.dropsListText.setText("Tier 1, 2 y 3 (Según Oleada)");
            return;
        }

        const biomeConfig = BIOME_ENEMIES[biomeKey];
        let uniqueEnemies = new Set();
        
        if (biomeConfig) {
            if (biomeConfig.tiers) {
                biomeConfig.tiers.forEach(tier => {
                    if (Array.isArray(tier)) tier.forEach(k => uniqueEnemies.add(k));
                });
            }

            let diffKey = 'easy';
            if (this.currentSelectedDifficulty === 2) diffKey = 'normal';
            if (this.currentSelectedDifficulty === 3) diffKey = 'hard';

            const diffConfig = biomeConfig[diffKey];
            if (diffConfig) {
                if (diffConfig.miniBosses) diffConfig.miniBosses.forEach(k => uniqueEnemies.add(k));
                if (diffConfig.bosses) Object.values(diffConfig.bosses).forEach(k => uniqueEnemies.add(k));
            }
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
        // --- CASO ENDLESS (1 solo botón grande) ---
        if (biomeKey === 'endless') {
            const starsForest = this.getBiomeTotalStars('forest', 1);
            const starsMountain = this.getBiomeTotalStars('mountain', 1);
            const starsVolcano = this.getBiomeTotalStars('volcano', 1);
            const isUnlocked = (starsForest >= 30 && starsMountain >= 30 && starsVolcano >= 30);

            const btn = this.add.container(0, 0);
            const bg = this.add.rectangle(0, 0, 250, 80, isUnlocked ? 0x4b0082 : 0x111111).setStrokeStyle(3, isUnlocked ? 0xff00ff : 0x555555);
            const txt = this.add.text(0, 0, isUnlocked ? "ENTRAR AL ABISMO" : "BLOQUEADO", { fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
            
            btn.add([bg, txt]);
            
            if (!isUnlocked) {
                const req = this.add.text(0, 60, "Requiere 30★ en Fácil\nen todos los biomas.", { fontFamily: 'Roboto', fontSize: '14px', color: '#ffaaaa', align: 'center' }).setOrigin(0.5);
                this.levelsContainer.add(req);
            } else {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerdown', () => {
                    SoundManager.playSound('ui_click');
                    this.scene.start('GameScene', { 
                        biome: 'endless', 
                        level: 999, 
                        difficulty: 1, 
                        config: LEVEL_CONFIG[999] 
                    });
                });
                this.tweens.add({ targets: btn, scale: 1.05, duration: 800, yoyo: true, repeat: -1 });
            }
            this.levelsContainer.add(btn);
            return;
        }

        // --- CASO NORMAL (10 niveles) ---
        let startX = -120; 
        let startY = -150;
        let x = startX;
        let y = startY;
        
        for (let i = 1; i <= 10; i++) {
            const levelId = i;
            let isUnlocked = false;

            if (levelId === 1) {
                isUnlocked = true; 
            } else {
                const prevLevelKey = `${biomeKey}_${this.currentSelectedDifficulty}_${levelId-1}`;
                if (gameState.levelStars[prevLevelKey] && gameState.levelStars[prevLevelKey] > 0) {
                    isUnlocked = true;
                }
                
                if (this.currentSelectedDifficulty === 1) {
                    if (!gameState.biomeLevels) gameState.biomeLevels = { forest: 1, mountain: 1, volcano: 1 };
                    if (levelId <= gameState.biomeLevels[biomeKey]) isUnlocked = true;
                }
            }
            
            const btn = this.add.rectangle(x, y, 70, 70, isUnlocked ? 0x222222 : 0x111111)
                .setStrokeStyle(2, isUnlocked ? 0x00ff00 : 0x550000);
            
            const txt = this.add.text(x, y - 10, `${i}`, {
                fontFamily: 'Cinzel', fontSize: '24px', color: isUnlocked ? '#fff' : '#555'
            }).setOrigin(0.5);

            const starKey = `${biomeKey}_${this.currentSelectedDifficulty}_${levelId}`;
            const stars = gameState.levelStars[starKey] || 0;
            const starTxt = this.add.text(x, y + 15, "★".repeat(stars), { 
                fontSize: '14px', color: '#ffd700', stroke: '#000', strokeThickness: 2 
            }).setOrigin(0.5);

            if (isUnlocked) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => {
                    SoundManager.playSound('ui_click');
                    this.scene.start('GameScene', { 
                        biome: biomeKey, 
                        level: levelId,
                        difficulty: this.currentSelectedDifficulty,
                        config: LEVEL_CONFIG[levelId] || {}
                    });
                });
                
                btn.on('pointerover', () => btn.setFillStyle(0x444444));
                btn.on('pointerout', () => btn.setFillStyle(0x222222));
            }

            this.levelsContainer.add([btn, txt, starTxt]);

            x += 90;
            if (i === 5) { 
                x = startX; 
                y += 100; 
            }
        }
    }
}