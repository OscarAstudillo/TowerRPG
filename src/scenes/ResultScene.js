import Phaser from 'phaser';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { RARITY, gameState } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';
import SoundManager from '../systems/SoundManager.js';

export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.success = data.success;
        this.levelId = data.levelId || 1;
        this.gold = data.gold || 0; 
        this.xp = data.xp || 0;
        this.baseHp = data.baseHp || 0; 
        this.loot = data.loot || {};
        this.biome = data.biome || 'forest';
        this.difficulty = data.difficulty || 1; 
        
        this.isEndless = (this.biome === 'endless');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setInteractive();

        const panelColor = this.success ? 0x111111 : 0x1a0000; 
        const strokeColor = this.success ? 0xffd700 : 0xff0000;
        
        const panel = this.add.graphics();
        panel.fillStyle(panelColor, 0.95);
        panel.fillRoundedRect(w/2 - 350, h/2 - 250, 700, 500, 20);
        panel.lineStyle(4, strokeColor, 1);
        panel.strokeRoundedRect(w/2 - 350, h/2 - 250, 700, 500, 20);

        const titleText = this.success ? "¡MISIÓN CUMPLIDA!" : "¡DERROTA!";
        this.add.text(w/2, h * 0.2, titleText, { 
            fontFamily: 'Cinzel', fontSize: '56px', fontStyle: 'bold', 
            color: this.success ? '#ffd700' : '#ff0000',
            stroke: '#000000', strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 4, color: '#000', blur: 10, fill: true }
        }).setOrigin(0.5);

        if (this.success) {
            this.createVictoryContent(w, h);
            SoundManager.playMusic('music_victory', false); 
        } else {
            this.createDefeatContent(w, h);
        }

        this.createButtons(w, h);
    }

    createVictoryContent(w, h) {
        let stars = 1;
        if (this.baseHp >= 20) stars = 3;
        else if (this.baseHp > 10) stars = 2;
        
        const starGroup = this.add.container(w/2, h * 0.32);
        const starSpacing = 80;
        
        for (let i = 0; i < 3; i++) {
            const isEarned = i < stars;
            const color = isEarned ? 0xffd700 : 0x444444;
            const star = this.add.text((i - 1) * starSpacing, 0, "★", { 
                fontSize: '80px', color: '#fff' 
            }).setOrigin(0.5).setTint(color);
            
            if (isEarned) {
                star.setScale(0);
                this.tweens.add({
                    targets: star, scale: 1, angle: 360,
                    duration: 600, delay: i * 300, ease: 'Back.out'
                });
            }
            starGroup.add(star);
        }

        const statsY = h * 0.45;
        this.add.text(w/2 - 150, statsY, `Vida: ${this.baseHp}/20`, { fontFamily: 'Roboto', fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        this.add.text(w/2, statsY, `Oro: +${this.gold}`, { fontFamily: 'Roboto', fontSize: '20px', color: '#ffd700' }).setOrigin(0.5);
        this.add.text(w/2 + 150, statsY, `XP: +${this.xp}`, { fontFamily: 'Roboto', fontSize: '20px', color: '#00ffff' }).setOrigin(0.5);

        // --- SECCIÓN DE LOOT RESUMIDA POR RAREZA ---
        this.add.text(w/2, statsY + 50, "-- MATERIALES OBTENIDOS --", { fontFamily: 'Cinzel', fontSize: '22px', color: '#aaa' }).setOrigin(0.5);
        
        // Agrupar loot por rareza
        const lootSummary = {
            common: { count: 0, color: RARITY.common.color },
            uncommon: { count: 0, color: RARITY.uncommon.color },
            rare: { count: 0, color: RARITY.rare.color },
            epic: { count: 0, color: RARITY.epic.color },
            legendary: { count: 0, color: RARITY.legendary.color },
            mythic: { count: 0, color: RARITY.mythic.color }
        };

        let totalItems = 0;
        for (let matKey in this.loot) {
            const rarities = this.loot[matKey];
            for (let rKey in rarities) {
                const qty = rarities[rKey];
                if (qty > 0 && lootSummary[rKey]) {
                    lootSummary[rKey].count += qty;
                    totalItems += qty;
                }
            }
        }

        if (totalItems === 0) {
            this.add.text(w/2, statsY + 90, "(Sin materiales extra)", { fontSize: '16px', color: '#555' }).setOrigin(0.5);
        } else {
            // Renderizar resumen horizontal
            const startX = w/2 - 200;
            const startY = statsY + 100;
            let currentX = w/2 - (Object.keys(lootSummary).filter(k => lootSummary[k].count > 0).length * 40); 

            Object.entries(lootSummary).forEach(([key, data]) => {
                if (data.count > 0) {
                    const colorHex = '#' + data.color.toString(16).padStart(6, '0');
                    
                    // Icono (Cuadrado de color)
                    const bg = this.add.rectangle(currentX, startY, 60, 40, data.color).setStrokeStyle(1, 0xffffff);
                    // Texto (Cantidad)
                    const txt = this.add.text(currentX, startY, `x${data.count}`, { 
                        fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', 
                        color: '#000', stroke: '#fff', strokeThickness: 2 
                    }).setOrigin(0.5);

                    // Etiqueta de rareza debajo (opcional, pequeña)
                    this.add.text(currentX, startY + 30, key.toUpperCase().substring(0,3), { 
                        fontSize: '10px', color: colorHex 
                    }).setOrigin(0.5);

                    currentX += 80; // Espaciado entre grupos
                }
            });
        }
    }

    createDefeatContent(w, h) {
        this.add.text(w/2, h * 0.4, "El castillo ha sido destruido.", { 
            fontFamily: 'Roboto', fontSize: '24px', color: '#aaaaaa' 
        }).setOrigin(0.5);
        
        this.add.text(w/2, h * 0.5, "Mejora tu equipo e inténtalo de nuevo.", { 
            fontFamily: 'Roboto', fontSize: '18px', color: '#888' 
        }).setOrigin(0.5);
    }

    createButtons(w, h) {
        const btnY = h - 140;

        // Botón: Menú Principal (Siempre visible)
        this.createBtn(w/2, btnY + 60, "MENÚ PRINCIPAL", 0x444444, () => {
            this.scene.start('MainMenuScene');
        });

        if (this.success) {
            // Botón: Repetir
            this.createBtn(w/2 - 160, btnY, "REPETIR", 0x224488, () => {
                this.restartLevel();
            });

            // Botón: Siguiente Nivel (Solo si no es el último y no es endless)
            if (!this.isEndless && this.levelId < 10) {
                this.createBtn(w/2 + 160, btnY, "SIGUIENTE NIVEL ➜", 0x006400, () => {
                    this.nextLevel();
                });
            }
        } else {
            // Derrota: Solo Reintentar grande
            this.createBtn(w/2, btnY, "REINTENTAR", 0x8b0000, () => {
                this.restartLevel();
            });
        }
    }

    createBtn(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 240, 50, color)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true });
        
        const txt = this.add.text(0, 0, text, { 
            fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#fff' 
        }).setOrigin(0.5);

        bg.on('pointerdown', () => {
            SoundManager.playSound('ui_click');
            this.tweens.add({
                targets: container, scale: 0.9, duration: 50, yoyo: true,
                onComplete: callback
            });
        });

        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout', () => bg.setAlpha(1));

        container.add([bg, txt]);
        return container;
    }

    restartLevel() {
        this.scene.start('GameScene', { 
            biome: this.biome, 
            level: this.levelId, 
            difficulty: this.difficulty 
        });
    }

    nextLevel() {
        const nextId = this.levelId + 1;
        this.scene.start('GameScene', { 
            biome: this.biome, 
            level: nextId, 
            difficulty: this.difficulty 
        });
    }
}