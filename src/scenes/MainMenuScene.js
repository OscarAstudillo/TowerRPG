// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { CLASS_STATS } from '../entities/player/PlayerStats.js'; // Importar stats de clases
import WorldMapScene from './WorldMapScene.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        
        this.add.text(640, 40, 'TITAN DEFENSE RPG', { fontSize: '40px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);

        // --- SELECCIÓN DE CLASE (NUEVO) ---
        this.add.text(640, 90, `Clase Actual: ${gameState.selectedClass.toUpperCase()}`, { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
        
        // Crear botones para cada clase
        const classes = ['paladin', 'guerrero', 'arquero', 'mago', 'asesino'];
        let xPos = 340;
        
        classes.forEach(cls => {
            const btn = this.add.rectangle(xPos, 130, 100, 30, 0x444444).setInteractive({ useHandCursor: true });
            const txt = this.add.text(xPos, 130, cls.toUpperCase(), { fontSize: '12px' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                gameState.selectedClass = cls;
                this.scene.restart(); // Reiniciar escena para actualizar textos
            });
            
            xPos += 150;
        });

        // --- PANELES EXISTENTES ---
        this.add.text(50, 180, 'ESTADÍSTICAS', { fontSize: '24px', color: '#fff' });
        this.statsText = this.add.text(50, 220, '', { fontSize: '18px', color: '#aaaaaa', lineHeight: 30 });

        this.add.text(450, 180, 'HERRERÍA', { fontSize: '24px', color: '#fff' });
        this.createCraftingList();

        const playBtn = this.add.rectangle(640, 680, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(640, 680, 'IR A BATALLA', { fontSize: '24px' }).setOrigin(0.5);

        playBtn.on('pointerdown', () => {
            // Actualizar las stats base según la clase elegida antes de jugar
            // Nota: Aquí sobrescribimos las stats base con las de la clase elegida
            const baseClass = CLASS_STATS[gameState.selectedClass];
            
            // Truco: Actualizamos las INITIAL_STATS en memoria temporalmente (o simplemente reseteamos)
            // Para simplificar, asumimos que al entrar al juego el Player leerá su clase.
            this.scene.start('WorldMapScene'); 
        });

        this.refreshUI();
    }

    refreshUI() {
        const s = gameState.playerStats;
        const inv = gameState.inventory;
        const eq = gameState.equipment;

        this.statsText.setText(
            `Clase: ${gameState.selectedClass}\n` +
            `Vida Base: ${CLASS_STATS[gameState.selectedClass].hp}\n` +
            `-- INVENTARIO --\n` +
            `Madera: ${inv.wood}\n` +
            `Tela: ${inv.cloth}\n` +
            `Cobre: ${inv.copper}\n\n` +
            `-- EQUIPADO --\n` +
            `Arma: ${eq.weapon ? eq.weapon.name : 'Nada'}\n` +
            `Armadura: ${eq.armor ? eq.armor.name : 'Nada'}\n`
        );
    }

    createCraftingList() {
        let yPos = 220;
        RECIPES.forEach(recipe => {
            this.add.rectangle(640, yPos, 400, 40, 0x333333);
            this.add.text(450, yPos - 10, `${recipe.name} (${recipe.bonus.stat} +${recipe.bonus.value})`, { fontSize: '14px', color: '#ffffff' });
            
            const costTxt = `M:${recipe.cost.wood} T:${recipe.cost.cloth} C:${recipe.cost.copper}`;
            this.add.text(450, yPos + 5, costTxt, { fontSize: '12px', color: '#888888' });

            const btn = this.add.rectangle(800, yPos, 50, 25, 0x555555).setInteractive({ useHandCursor: true });
            this.add.text(800, yPos, 'Crear', { fontSize: '10px' }).setOrigin(0.5);

            btn.on('pointerdown', () => {
                this.tryCraft(recipe);
            });
            yPos += 50;
        });
    }

    tryCraft(recipe) {
        const inv = gameState.inventory;
        const cost = recipe.cost;

        if (inv.wood >= cost.wood && inv.cloth >= cost.cloth && inv.copper >= cost.copper) {
            inv.wood -= cost.wood;
            inv.cloth -= cost.cloth;
            inv.copper -= cost.copper;
            gameState.equipment[recipe.type] = { id: recipe.id, name: recipe.name, bonus: recipe.bonus };
            updatePlayerStats();
            this.refreshUI();
        }
    }
}