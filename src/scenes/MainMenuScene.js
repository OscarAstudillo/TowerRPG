// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, saveHeroEquipment } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import SoundManager from '../systems/SoundManager.js';

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
        this.selectedTab = 'hero'; 
        this.hasLoaded = false;
        
        // Estilos
        this.fontTitle = { fontFamily: 'Cinzel', fontSize: '64px', fontStyle: 'bold', color: '#FFD700', stroke: '#8B0000', strokeThickness: 6, shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true } };
        this.fontMenuBtn = { fontFamily: 'Cinzel', fontSize: '20px', color: '#FFFFFF' };
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // --- 1. LÓGICA DE CARGA DE DATOS (MANTENIDA) ---
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
        SoundManager.playMusic('music_menu');

        // --- 2. CONSTRUCCIÓN VISUAL ---
        const w = this.scale.width;
        const h = this.scale.height;

        // Fondo
        if (this.textures.exists('title_bg')) {
            this.add.image(w / 2, h / 2, 'title_bg').setDisplaySize(w, h);
        }
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85); // Overlay oscuro

        // Título Principal
        this.add.text(w / 2, h * 0.08, "TOWER RPG", this.fontTitle).setOrigin(0.5);
        this.goldText = this.add.text(w - 30, h * 0.05, `ORO: ${gameState.gold}`, { fontFamily: 'Cinzel', fontSize: '20px', color: '#ffd700' }).setOrigin(1, 0.5);

        // Contenedores Principales
        this.menuContainer = this.add.container(w * 0.15, h * 0.55); // Panel Izquierdo (Menú)
        this.contentContainer = this.add.container(w * 0.6, h * 0.55); // Panel Derecho (Contenido)

        // --- 3. CREAR MENÚ LATERAL ---
        this.createMenuPanel();

        // --- 4. INICIALIZAR PANELES DE LÓGICA ---
        // Estos paneles se renderizarán dentro de "contentContainer" o sobre la escena, según su implementación original
        // NOTA: Tus clases UI actuales (HeroPanel, etc.) usan `this.scene.add.container`.
        // Para adaptarlas sin reescribirlas, las instanciamos igual, pero controlaremos su visibilidad.
        
        this.heroPanel = new HeroPanel(this, 0, 0, w, h);
        this.inventoryPanel = new InventoryPanel(this, 0, 0, w, h);
        this.forgePanel = new ForgePanel(this, 0, 0, w, h);
        this.talentsPanel = new TalentTree(this, 0, 0, w, h);
        this.refiningPanel = new RefiningPanel(this, 0, 0, w, h);
        this.towersPanel = new TowersPanel(this, 0, 0, w, h);
        this.questBoard = new QuestBoard(this, 0, 0, w, h);

        // Iniciar en la pestaña por defecto
        this.switchTab('hero');

        // Footer
        this.add.text(w - 20, h - 20, "Ver. 0.9.5 - Dev Build", { fontFamily: 'Roboto', fontSize: '14px', color: '#666' }).setOrigin(1, 1);
    }

    createMenuPanel() {
        // Fondo del menú lateral
        const bg = this.add.rectangle(0, 0, 250, 600, 0x111111, 0.9).setStrokeStyle(2, 0x444444);
        const title = this.add.text(0, -260, "MENÚ", { fontFamily: 'Cinzel', fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        this.menuContainer.add([bg, title]);

        const buttons = [
            { label: "JUGAR", icon: "⚔️", key: 'play', action: () => this.scene.start('WorldMapScene') },
            { label: "HÉROE", icon: "🛡️", key: 'hero', action: () => this.switchTab('hero') },
            { label: "MOCHILA", icon: "🎒", key: 'inventory', action: () => this.switchTab('inventory') },
            { label: "TALENTOS", icon: "✨", key: 'talents', action: () => this.switchTab('talents') },
            { label: "TORRES", icon: "🏰", key: 'towers', action: () => this.switchTab('towers') },
            { label: "FORJA", icon: "🔨", key: 'forge', action: () => this.switchTab('forge') },
            { label: "REFINAR", icon: "🔥", key: 'refining', action: () => this.switchTab('refining') },
            { label: "MISIONES", icon: "📜", key: 'quests', action: () => this.questBoard.toggle() },
            { label: "CAMBIAR HÉROE", icon: "👤", key: 'change', action: () => this.changeHero() },
            { label: "RESET", icon: "❌", key: 'reset', action: () => this.resetGame() }
        ];

        this.menuButtons = [];
        let y = -200;
        
        buttons.forEach(btnData => {
            const btn = this.add.container(0, y);
            btn.key = btnData.key;

            // Estilo especial para JUGAR
            const isPlay = btnData.key === 'play';
            const color = isPlay ? 0x006400 : 0x222222;
            const stroke = isPlay ? 0x00ff00 : 0x666666;

            const btnBg = this.add.rectangle(0, 0, 220, 45, color).setInteractive({ useHandCursor: true });
            btnBg.setStrokeStyle(1, stroke);
            
            const icon = this.add.text(-90, 0, btnData.icon, { fontSize: '20px' }).setOrigin(0.5);
            const label = this.add.text(-60, 0, btnData.label, this.fontMenuBtn).setOrigin(0, 0.5);

            btnBg.on('pointerdown', () => {
                SoundManager.playSound('ui_click');
                this.updateMenuVisuals(btnData.key);
                btnData.action();
            });

            btnBg.on('pointerover', () => btnBg.setFillStyle(isPlay ? 0x008000 : 0x333333));
            btnBg.on('pointerout', () => {
                // Mantener color si está seleccionado
                if (this.selectedTab === btnData.key && !isPlay) btnBg.setFillStyle(0x444444);
                else btnBg.setFillStyle(color);
            });

            btn.bg = btnBg; // Referencia para actualizar
            btn.add([btnBg, icon, label]);
            this.menuContainer.add(btn);
            this.menuButtons.push(btn);

            y += 55;
        });
    }

    updateMenuVisuals(selectedKey) {
        this.selectedTab = selectedKey;
        this.menuButtons.forEach(btn => {
            if (btn.key === 'play' || btn.key === 'change' || btn.key === 'reset') return; // Botones de acción no cambian estado permanente
            
            if (btn.key === selectedKey) {
                btn.bg.setFillStyle(0x444444);
                btn.bg.setStrokeStyle(2, 0xFFD700);
            } else {
                btn.bg.setFillStyle(0x222222);
                btn.bg.setStrokeStyle(1, 0x666666);
            }
        });
    }

    switchTab(key) {
        // Ocultar todos
        this.heroPanel.hide();
        this.inventoryPanel.hide();
        this.forgePanel.hide();
        this.talentsPanel.hide();
        this.refiningPanel.hide();
        this.towersPanel.hide();
        // Misiones es un popup, no un panel principal, pero lo gestionamos
        if (key !== 'quests') this.questBoard.hide();

        this.updateMenuVisuals(key);

        switch(key) {
            case 'hero': this.heroPanel.show(); break;
            case 'inventory': this.inventoryPanel.show(); break;
            case 'forge': this.forgePanel.show(); break;
            case 'talents': this.talentsPanel.show(); break;
            case 'refining': this.refiningPanel.show(); break;
            case 'towers': this.towersPanel.show(); break;
        }
    }

    changeHero() {
        if(gameState.selectedClass) {
            saveHeroEquipment(gameState.selectedClass);
        }
        gameState.selectedClass = null; 
        this.scene.start('HeroSelectScene');
    }

    resetGame() {
        if(confirm("¿Estás seguro de BORRAR todo el progreso?")) { 
            SaveSystem.reset(); 
            location.reload(); 
        }
    }

    // --- FUNCIONES DE UTILIDAD (MANTENIDAS) ---
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