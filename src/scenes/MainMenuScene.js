// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, saveHeroEquipment } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';

// IMPORTAR PANELES UI
import InventoryPanel from '../ui/InventoryPanel.js';
import ForgePanel from '../ui/ForgePanel.js';
import HeroPanel from '../ui/HeroPanel.js';
import TalentTree from '../ui/TalentTree.js';
import RefiningPanel from '../ui/RefiningPanel.js';
import TowersPanel from '../ui/TowersPanel.js';
import QuestBoard from '../ui/QuestBoard.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.currentTab = 'hero';
        this.hasLoaded = false;
        
        // Estilos Globales
        this.fontTitle = { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000000', strokeThickness: 4 };
        this.fontHeader = { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
        this.fontBody = { fontFamily: 'Roboto', fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };
        this.fontBtn = { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // --- SISTEMA DE CARGA Y REPARACIÓN ---
        if (!this.hasLoaded) {
            const loaded = SaveSystem.load();
            
            // Reparación de Saves antiguos
            const allTowers = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
            if (!gameState.towerEquipment) gameState.towerEquipment = {};
            allTowers.forEach(t => { 
                if(!gameState.towerEquipment[t]) gameState.towerEquipment[t] = {slot1:null, slot2:null}; 
            });
            if (!gameState.biomeLevels) gameState.biomeLevels = { forest: 1, mountain: 1, volcano: 1 };
            
            if (loaded) {
                console.log("✅ Progreso cargado correctamente.");
                SaveSystem.save(); 
            } else {
                console.log("ℹ️ Nueva partida iniciada.");
                if (!gameState.talents) gameState.talents = [];
                this.sanitizeData(); 
                SaveSystem.save();
            }
            this.hasLoaded = true;
        }

        if (!gameState.selectedClass) {
            this.scene.start('HeroSelectScene');
            return;
        }

        updatePlayerStats();

        // --- UI GLOBAL ---
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.add.image(cx, cy, 'bg_menu').setDisplaySize(w, h);
        this.add.rectangle(cx, cy, w, h, 0x1a1a1a, 0.5); 

        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', this.fontTitle).setOrigin(0.5);
        this.goldText = this.add.text(w - 30, h * 0.05, `ORO: ${gameState.gold}`, { fontFamily: 'Cinzel', fontSize: '20px', color: '#ffd700' }).setOrigin(1, 0.5);

        // --- INSTANCIAR PANELES ---
        this.heroPanel = new HeroPanel(this, 0, 0, w, h);
        this.inventoryPanel = new InventoryPanel(this, 0, 0, w, h);
        this.forgePanel = new ForgePanel(this, 0, 0, w, h);
        this.talentsPanel = new TalentTree(this, 0, 0, w, h);
        this.refiningPanel = new RefiningPanel(this, 0, 0, w, h);
        this.towersPanel = new TowersPanel(this, 0, 0, w, h);
        this.questBoard = new QuestBoard(this, 0, 0, w, h);

        // --- TABS ---
        const tabY = h * 0.12; 
        const tabW = 140; 
        const startX = cx - (tabW * 2.5);

        this.createTabButton(startX, tabY, 'HÉROE', 'hero');
        this.createTabButton(startX + tabW, tabY, 'TALENTOS', 'talents');
        this.createTabButton(startX + tabW*2, tabY, 'MOCHILA', 'inventory');
        this.createTabButton(startX + tabW*3, tabY, 'REFINAR', 'refining');
        this.createTabButton(startX + tabW*4, tabY, 'FORJA', 'forge');
        this.createTabButton(startX + tabW*5, tabY, 'TORRES', 'towers');

        // Botón Misiones
        const questBtn = this.add.rectangle(w - 150, h * 0.2, 120, 40, 0x800080).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff);
        this.add.text(w - 150, h * 0.2, "MISIONES", { fontFamily:'Roboto', fontSize:'16px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
        questBtn.on('pointerdown', () => this.questBoard.toggle());

        // Botón Jugar
        const playBtn = this.add.rectangle(cx, h - 50, 220, 50, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00);
        this.add.text(cx, h - 50, 'IR AL MAPA', { fontFamily: 'Cinzel', fontSize: '24px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        // Botón Cambiar Héroe
        const changeHeroBtn = this.add.text(50, h - 50, 'CAMBIAR HÉROE', this.fontBtn).setInteractive({ useHandCursor: true }).setOrigin(0, 0.5).setColor('#00ffff');
        changeHeroBtn.on('pointerdown', () => {
            if(gameState.selectedClass) {
                // Usamos la función importada para guardar el estado
                saveHeroEquipment(gameState.selectedClass);
            }
            gameState.selectedClass = null; 
            this.scene.start('HeroSelectScene'); 
        });

        // Botón Reset
        const resetBtn = this.add.text(w - 50, h - 50, 'BORRAR DATOS', this.fontBtn).setInteractive({ useHandCursor: true }).setOrigin(1, 0.5).setColor('#ff5555');
        resetBtn.on('pointerdown', () => { 
            if(confirm("¿Borrar todo el progreso y reiniciar?")) { 
                SaveSystem.reset(); 
                location.reload(); 
            } 
        });

        this.switchTab('hero');
    }

    createTabButton(x, y, text, key) {
        const btn = this.add.rectangle(x, y, 130, 45, 0x222222).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x555555);
        const txt = this.add.text(x, y, text, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 50 });
            this.switchTab(key);
        });
    }

    switchTab(key) {
        this.currentTab = key;
        
        this.heroPanel.hide();
        this.inventoryPanel.hide();
        this.forgePanel.hide();
        this.talentsPanel.hide();
        this.refiningPanel.hide();
        this.towersPanel.hide();

        switch(key) {
            case 'hero': this.heroPanel.show(); break;
            case 'inventory': this.inventoryPanel.show(); break;
            case 'forge': this.forgePanel.show(); break;
            case 'talents': this.talentsPanel.show(); break;
            case 'refining': this.refiningPanel.show(); break;
            case 'towers': this.towersPanel.show(); break;
        }
    }

    updateGoldText() {
        if(this.goldText) this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    showCentralAlert(text, colorHex = '#ffffff') {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const container = this.add.container(cx, cy).setDepth(3000);
        
        const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.9).setStrokeStyle(4, colorHex.replace('#', '0x'));
        const msg = this.add.text(0, 0, text, { fontFamily: 'Cinzel', fontSize: '28px', color: colorHex }).setOrigin(0.5);
        
        container.add([bg, msg]);
        container.setScale(0);
        
        this.tweens.add({
            targets: container, scale: 1, ease: 'Back.out', duration: 300,
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({ targets: container, scale: 0, alpha: 0, duration: 300, onComplete: () => container.destroy() });
                });
            }
        });
    }

    sanitizeData() {
        const equippedIds = new Set();
        const getId = (i) => i && i.id ? String(i.id) : null;
        
        Object.values(gameState.equipment).forEach(i => { if(i) equippedIds.add(getId(i)); });
        Object.values(gameState.towerEquipment).forEach(t => { 
            if(t.slot1) equippedIds.add(getId(t.slot1)); 
            if(t.slot2) equippedIds.add(getId(t.slot2)); 
        });
        
        let cleanInv = []; 
        const seenIdsInInv = new Set();
        
        gameState.inventory.forEach(item => { 
            if (!item) return; 
            if (!item.id || typeof item.id !== 'string') item.id = RPGSystem.getUniqueId(); 
            
            const id = item.id; 
            if (equippedIds.has(id)) return;
            
            if (seenIdsInInv.has(id)) { item.id = RPGSystem.getUniqueId(); } 
            seenIdsInInv.add(item.id); 
            cleanInv.push(item); 
        });
        
        gameState.inventory = cleanInv; 
        SaveSystem.save(); 
    }
}