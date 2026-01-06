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
import ProfessionsPanel from '../ui/ProfessionsPanel.js'; 

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedTab = 'hero'; 
        this.hasLoaded = false;
        
        // Estilos Premium
        this.fontTitle = { 
            fontFamily: 'Cinzel', fontSize: '60px', fontStyle: 'bold', 
            color: '#FFD700', 
            stroke: '#000000', strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 5, color: '#FF4500', blur: 15, stroke: true, fill: true } 
        };
        
        this.fontMenuBtn = { 
            fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#E0E0E0' 
        };
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        
        // --- 1. LÓGICA DE CARGA DE DATOS ---
        if (!this.hasLoaded) {
            const loaded = SaveSystem.load();
            this.ensureDataIntegrity();
            if (loaded) {
                console.log("✅ Progreso cargado.");
                SaveSystem.save(); 
            } else {
                console.log("ℹ️ Nueva partida.");
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

        // --- 2. LAYOUT VISUAL ---
        const w = this.scale.width;
        const h = this.scale.height;

        // --- FONDO ANIMADO ---
        this.createAnimatedBackground(w, h);

        // Overlay oscuro para UI (Glassmorphism)
        const contentX = 320; // Ancho del menú + margen
        const contentW = w - contentX - 20;

        // Panel de Contenido (Derecha)
        const contentBg = this.add.graphics();
        contentBg.fillStyle(0x000000, 0.75);
        contentBg.fillRoundedRect(contentX, 20, contentW, h - 40, 20); // Bordes redondeados
        contentBg.lineStyle(2, 0x444444, 1);
        contentBg.strokeRoundedRect(contentX, 20, contentW, h - 40, 20);

        // Título Principal
        this.add.text(w - 30, h - 50, "TOWER RPG", { fontFamily: 'Cinzel', fontSize: '30px', color: '#444' }).setOrigin(1, 1);
        
        // Oro (Esquina superior derecha)
        const goldContainer = this.add.container(w - 140, 50);
        const goldBg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.8).setStrokeStyle(2, 0xffd700);
        this.goldText = this.add.text(0, 0, `ORO: ${gameState.gold}`, { fontFamily: 'Cinzel', fontSize: '22px', color: '#ffd700' }).setOrigin(0.5);
        goldContainer.add([goldBg, this.goldText]);

        // --- 3. MENÚ LATERAL ---
        this.menuContainer = this.add.container(0, 0); 
        this.createMenuPanel(300, h); // Ancho 300px

        // --- 4. INICIALIZAR PANELES DE LÓGICA ---
        // Ajustamos offset para que entren en el panel derecho
        const panelOffsetX = contentX; 
        
        this.heroPanel = new HeroPanel(this, 0, 0, contentW, h);
        this.heroPanel.container.setPosition(panelOffsetX, 0);

        this.inventoryPanel = new InventoryPanel(this, 0, 0, contentW, h);
        this.inventoryPanel.container.setPosition(panelOffsetX, 0);

        this.forgePanel = new ForgePanel(this, 0, 0, contentW, h);
        this.forgePanel.container.setPosition(panelOffsetX, 0);

        this.talentsPanel = new TalentTree(this, 0, 0, contentW, h);
        this.talentsPanel.container.setPosition(panelOffsetX, 0);

        this.refiningPanel = new RefiningPanel(this, 0, 0, contentW, h);
        this.refiningPanel.container.setPosition(panelOffsetX, 0);

        this.towersPanel = new TowersPanel(this, 0, 0, contentW, h);
        this.towersPanel.container.setPosition(panelOffsetX, 0);
        
        this.professionsPanel = new ProfessionsPanel(this, 0, 0, contentW, h);
        this.professionsPanel.container.setPosition(panelOffsetX, 0);

        this.questBoard = new QuestBoard(this, 0, 0, w, h); // Quest ocupa todo (modal)

        this.switchTab('hero');
        
        // Versión
        this.add.text(20, h - 20, "v1.0.0 Alpha", { fontFamily: 'Roboto', fontSize: '12px', color: '#666' });
    }

    createAnimatedBackground(w, h) {
        // Rotar entre 3 fondos
        const bgs = ['Fondo_Bosque', 'Fondo_Montaña', 'Fondo_Volcan'];
        // Si no existen las texturas, usar color sólido
        const bgKey = bgs[Math.floor(Math.random() * bgs.length)];
        
        if (this.textures.exists(bgKey)) {
            const bgImage = this.add.image(w/2, h/2, bgKey).setDisplaySize(w, h).setAlpha(0.6);
            
            // Efecto de Zoom lento (Ken Burns effect)
            this.tweens.add({
                targets: bgImage,
                scaleX: 1.1, scaleY: 1.1,
                duration: 20000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.add.rectangle(w/2, h/2, w, h, 0x111111);
        }

        // Partículas de ambiente (Polvo/Ascuas)
        const particles = this.add.particles(0, 0, 'pixel', {
            x: { min: 0, max: w },
            y: h + 10,
            speedY: { min: -20, max: -50 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 8000,
            frequency: 200,
            tint: 0xffaa00,
            blendMode: 'ADD'
        }).setDepth(-1); // Detrás de todo
    }

    createMenuPanel(width, height) {
        // Panel Fondo del Menú (Izquierda)
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85); // Casi opaco
        bg.fillRect(0, 0, width, height);
        bg.lineStyle(2, 0xffd700, 0.3); // Línea dorada sutil a la derecha
        bg.beginPath();
        bg.moveTo(width, 0);
        bg.lineTo(width, height);
        bg.strokePath();

        this.menuContainer.add(bg);

        // Título del Menú
        const titleText = this.add.text(width/2, 60, "MENÚ", this.fontTitle).setOrigin(0.5);
        // Reducir un poco la fuente del título del menú
        titleText.setFontSize(40);
        this.menuContainer.add(titleText);

        const buttons = [
            { label: "JUGAR", icon: "⚔️", key: 'play', action: () => this.scene.start('WorldMapScene'), color: 0x006400 },
            { label: "HÉROE", icon: "🛡️", key: 'hero', action: () => this.switchTab('hero') },
            { label: "MOCHILA", icon: "🎒", key: 'inventory', action: () => this.switchTab('inventory') },
            { label: "TALENTOS", icon: "✨", key: 'talents', action: () => this.switchTab('talents') },
            { label: "TORRES", icon: "🏰", key: 'towers', action: () => this.switchTab('towers') },
            { label: "FORJA", icon: "🔨", key: 'forge', action: () => this.switchTab('forge') },
            { label: "REFINAR", icon: "🔥", key: 'refining', action: () => this.switchTab('refining') },
            { label: "MISIONES", icon: "📜", key: 'quests', action: () => this.questBoard.toggle() },
            { label: "PROFESIONES", icon: "⛏️", key: 'profs', action: () => this.switchTab('profs') },
            { label: "CAMBIAR HÉROE", icon: "👤", key: 'change', action: () => this.changeHero(), color: 0x444444 },
            { label: "RESET", icon: "❌", key: 'reset', action: () => this.resetGame(), color: 0x8b0000 }
        ];

        this.menuButtons = [];
        let y = 140; // Empezar más abajo

        buttons.forEach(btnData => {
            const btn = this.add.container(width/2, y);
            btn.key = btnData.key;
            btn.defaultColor = btnData.color || 0x222222;

            // Fondo del botón (Rounded Rect)
            const btnBg = this.add.graphics();
            btn.bgGraphics = btnBg; // Referencia para actualizar
            this.drawButtonBg(btnBg, 0, 0, width - 40, 50, btn.defaultColor, false);
            
            // Hitbox invisible para interacción
            const hitArea = this.add.rectangle(0, 0, width - 40, 50, 0x000000, 0).setInteractive({ useHandCursor: true });
            
            // Icono y Texto
            const icon = this.add.text(-100, 0, btnData.icon, { fontSize: '24px' }).setOrigin(0.5);
            const label = this.add.text(-70, 0, btnData.label, this.fontMenuBtn).setOrigin(0, 0.5);

            btn.add([btnBg, hitArea, icon, label]);
            this.menuContainer.add(btn);
            this.menuButtons.push(btn);

            // Eventos
            hitArea.on('pointerdown', () => {
                SoundManager.playSound('ui_click');
                this.updateMenuVisuals(btnData.key);
                // Pequeña animación de click
                this.tweens.add({
                    targets: btn, scale: 0.95, duration: 50, yoyo: true
                });
                btnData.action();
            });

            hitArea.on('pointerover', () => {
                this.drawButtonBg(btnBg, 0, 0, width - 30, 50, 0x444444, true); // Hover: más ancho y claro
                label.setColor('#ffd700');
            });
            
            hitArea.on('pointerout', () => {
                const isSelected = (this.selectedTab === btnData.key);
                const color = isSelected ? 0x555555 : btn.defaultColor;
                const border = isSelected;
                this.drawButtonBg(btnBg, 0, 0, width - 40, 50, color, border);
                label.setColor(isSelected ? '#ffd700' : '#E0E0E0');
            });

            y += 60; // Espacio entre botones
        });
    }

    drawButtonBg(graphics, x, y, w, h, color, border = false) {
        graphics.clear();
        graphics.fillStyle(color, 1);
        if (border) {
            graphics.lineStyle(2, 0xffd700, 1);
            graphics.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
        }
        graphics.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
    }

    updateMenuVisuals(selectedKey) {
        this.selectedTab = selectedKey;
        this.menuButtons.forEach(btn => {
            const isSelected = (btn.key === selectedKey);
            const isSpecial = (btn.key === 'play' || btn.key === 'change' || btn.key === 'reset');
            
            // Re-dibujar estado normal o seleccionado
            // Los botones especiales mantienen su color salvo hover
            if (!isSpecial) {
                const color = isSelected ? 0x444444 : 0x222222;
                this.drawButtonBg(btn.bgGraphics, 0, 0, 260, 50, color, isSelected);
                
                // Actualizar color de texto (buscamos el objeto Text dentro del container)
                const label = btn.list[3]; 
                if(label) label.setColor(isSelected ? '#ffd700' : '#E0E0E0');
            }
        });
    }

    switchTab(key) {
        this.heroPanel.hide();
        this.inventoryPanel.hide();
        this.forgePanel.hide();
        this.talentsPanel.hide();
        this.refiningPanel.hide();
        this.towersPanel.hide();
        this.professionsPanel.hide(); 

        if (key !== 'quests') this.questBoard.hide();

        this.updateMenuVisuals(key);

        switch(key) {
            case 'hero': this.heroPanel.show(); break;
            case 'inventory': this.inventoryPanel.show(); break;
            case 'forge': this.forgePanel.show(); break;
            case 'talents': this.talentsPanel.show(); break;
            case 'refining': this.refiningPanel.show(); break;
            case 'towers': this.towersPanel.show(); break;
            case 'profs': this.professionsPanel.show(); break;
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
        // Crear un modal personalizado en lugar de confirm() nativo para mantener el estilo
        if(confirm("¿Estás seguro de BORRAR todo el progreso?")) { 
            SaveSystem.reset(); 
            location.reload(); 
        }
    }

    updateGoldText() {
        if(this.goldText) this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    showCentralAlert(text, colorHex = '#ffffff') {
        const cx = this.scale.width / 2 + 140; // Centrado en el área de contenido
        const cy = this.scale.height / 2;
        const container = this.add.container(cx, cy).setDepth(3000);
        
        const bg = this.add.rectangle(0, 0, 500, 80, 0x000000, 0.9).setStrokeStyle(2, colorHex.replace('#', '0x'));
        const msg = this.add.text(0, 0, text, { fontFamily: 'Cinzel', fontSize: '24px', color: colorHex }).setOrigin(0.5);
        
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

    ensureDataIntegrity() {
        // Reparación de Saves antiguos y estructuras faltantes
        const allTowers = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
        if (!gameState.towerEquipment) gameState.towerEquipment = {};
        allTowers.forEach(t => { 
            if(!gameState.towerEquipment[t]) gameState.towerEquipment[t] = {slot1:null, slot2:null}; 
        });
        if (!gameState.biomeLevels) gameState.biomeLevels = { forest: 1, mountain: 1, volcano: 1 };
        if (!gameState.talents) gameState.talents = [];
        
        // Limpieza de inventario (equipmentInventory y inventory legacy)
        if (!gameState.equipmentInventory) gameState.equipmentInventory = [];
        
        // Mover items viejos si existen en save legacy
        if (gameState.inventory && Array.isArray(gameState.inventory) && gameState.inventory.length > 0) {
            // Verificar si es el inventario de recursos o equipo
            // Asumimos que inventory[] viejo tenía equipos mezclados
            const resources = {}; 
            gameState.inventory.forEach(item => {
                if(item.type === 'tower_part' || item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory' || item.type === 'offhand') {
                    if (!item.id) item.id = RPGSystem.getUniqueId();
                    gameState.equipmentInventory.push(item);
                } else {
                    // Si es material, sumar a gameState.materials
                    // (Lógica simplificada, mejor no tocar materiales si ya funcionan)
                }
            });
            gameState.inventory = []; // Limpiar legacy array
        }
    }
}