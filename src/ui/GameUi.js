import Phaser from 'phaser';
import { gameState, getCurrentHero, TOWER_COSTS } from '../config/GameState.js';
import { TOWER_TYPES } from '../config/TowerStats.js';
import { EventBus } from '../utils/EventBus.js';
import HeroPanel from './HeroPanel.js';
import InventoryPanel from './InventoryPanel.js';
import TalentTree from './TalentTree.js';
import ForgePanel from './ForgePanel.js';
import RefiningPanel from './RefiningPanel.js';
import QuestBoard from './QuestBoard.js';
import TowersPanel from './TowersPanel.js';
import ProfessionsPanel from './ProfessionsPanel.js';

export default class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        
        // Contenedor principal (Capa UI alta)
        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.towerCards = [];
        
        this.theme = { accent: 0xffffff };
        
        this.createPanels(); 
        this.createTopHUD();
        this.createTowerSelector(); // Abajo del todo
        this.createBottomMenu();    // Justo encima del selector
        this.createSkillButton();
        this.createWaveTimer();
        
        this.setupListeners();
        this.updateStats();
    }

    createPanels() {
        const w = this.width;
        const h = this.height;
        this.heroPanel = new HeroPanel(this.scene, w/2, h/2, w, h);
        this.inventoryPanel = new InventoryPanel(this.scene, w/2, h/2, w, h);
        this.talentsPanel = new TalentTree(this.scene, w/2, h/2, w, h);
        this.forgePanel = new ForgePanel(this.scene, w/2, h/2, w, h);
        this.refiningPanel = new RefiningPanel(this.scene, w/2, h/2, w, h);
        this.questBoard = new QuestBoard(this.scene, w/2, h/2, w, h);
        this.towersPanel = new TowersPanel(this.scene, w/2, h/2, w, h);
        this.professionsPanel = new ProfessionsPanel(this.scene, w/2, h/2, w, h);

        this.allPanels = [
            this.heroPanel, this.inventoryPanel, this.talentsPanel, 
            this.forgePanel, this.refiningPanel, this.questBoard, 
            this.towersPanel, this.professionsPanel
        ];
    }

    createBottomMenu() {
        // CORRECCIÓN: Subimos el menú para que no lo tape la barra de torres
        // La barra de torres mide ~130px de alto y está pegada al fondo.
        // Pondremos el menú en Y = height - 155 (encima de la barra)
        const menuY = this.height - 155;
        
        const buttons = [
            { label: "HÉROE", icon: "👤", panel: this.heroPanel },
            { label: "MOCHILA", icon: "🎒", panel: this.inventoryPanel },
            { label: "TALENTOS", icon: "✨", panel: this.talentsPanel },
            { label: "FORJA", icon: "⚒️", panel: this.forgePanel },
            { label: "REFINAR", icon: "⚗️", panel: this.refiningPanel },
            { label: "MISIONES", icon: "📜", panel: this.questBoard },
            { label: "PROFS", icon: "🔨", panel: this.professionsPanel }
        ];

        const btnWidth = 80; 
        const gap = 5;
        // Centramos los botones horizontalmente
        const totalWidth = buttons.length * (btnWidth + gap);
        const startX = (this.width - totalWidth) / 2 + (btnWidth / 2);
        
        // Fondo semitransparente para el menú
        const menuBg = this.scene.add.rectangle(this.width/2, menuY, totalWidth + 20, 50, 0x000000, 0.6);
        this.container.add(menuBg);

        buttons.forEach((btn, i) => {
            const x = startX + (i * (btnWidth + gap));
            
            // Botón Fondo
            const btnBg = this.scene.add.rectangle(0, 0, btnWidth, 40, 0x222222)
                .setStrokeStyle(1, 0x555555)
                .setInteractive({useHandCursor:true});

            // Icono y Texto
            const label = this.scene.add.text(0, 0, `${btn.icon} ${btn.label}`, { 
                fontFamily: 'Roboto', fontSize: '10px', fontStyle: 'bold' 
            }).setOrigin(0.5);

            // Grupo del botón
            const btnContainer = this.scene.add.container(x, menuY, [btnBg, label]);

            btnBg.on('pointerdown', () => {
                this.togglePanel(btn.panel);
            });
            
            btnBg.on('pointerover', () => btnBg.setFillStyle(0x444444));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x222222));
            
            // IMPORTANTE: Añadir al container principal para que se vea
            this.container.add(btnContainer);
        });
    }

    createTowerSelector() {
        const w = this.width;
        const h = this.height;
        
        // Posición: Fondo de la pantalla
        this.towerSelectorContainer = this.scene.add.container(w/2, h - 65);
        
        const selectorBg = this.scene.add.rectangle(0, 0, 700, 130, 0x000000, 0.8).setStrokeStyle(2, 0x444444);
        this.towerSelectorContainer.add(selectorBg);

        // Texto de Dinero (Integrado en la barra)
        const economyBg = this.scene.add.rectangle(0, -80, 200, 25, 0x000000, 0.9).setStrokeStyle(1, 0xffd700);
        this.economyText = this.scene.add.text(0, -80, 'ORO: 0', { fontFamily: 'Roboto', fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.towerSelectorContainer.add([economyBg, this.economyText]);

        const towerOrder = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
        const displayNames = { 'archer': 'ARQUERO', 'cannon': 'CAÑON', 'mage': 'MAGO', 'tesla': 'TESLA', 'poison': 'VENENO', 'quake': 'TERREMOTO' };
        
        const cardWidth = 90;
        const cardHeight = 100;
        const gap = 100;
        const startX = -((gap * 5) / 2);

        towerOrder.forEach((type, i) => {
            const card = this.scene.add.container(startX + (i * gap), 10);
            const cardBg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x222222).setInteractive({useHandCursor:true});
            cardBg.setStrokeStyle(1, 0xaaaaaa);
            
            const stats = TOWER_TYPES[type];
            const icon = this.scene.add.rectangle(0, -15, 40, 40, stats.color || 0x888888);
            const name = this.scene.add.text(0, -40, displayNames[type], { fontSize:'9px', fontStyle:'bold' }).setOrigin(0.5);
            const cost = TOWER_COSTS[type];
            const costText = this.scene.add.text(0, 20, `$${cost}`, { fontSize:'14px', color:'#ffd700', fontStyle:'bold' }).setOrigin(0.5);
            const key = this.scene.add.text(0, 40, `[${i+1}]`, { fontSize:'10px', color:'#888' }).setOrigin(0.5);

            cardBg.on('pointerdown', () => EventBus.emit('ui-select-tower', i));

            card.add([cardBg, icon, name, costText, key]);
            this.towerSelectorContainer.add(card);
            
            this.towerCards.push({ container: card, bg: cardBg, costText: costText, cost: cost });
        });

        this.container.add(this.towerSelectorContainer);
    }

    // ... (El resto de métodos: togglePanel, updateStats, createTopHUD, etc. se mantienen IGUAL que antes) ...

    togglePanel(targetPanel) {
        const isVisible = targetPanel.container.visible;
        this.allPanels.forEach(p => p.hide());
        if (!isVisible) targetPanel.show();
    }

    setupListeners() {
        EventBus.on('gold-changed', this.updateGold, this);
        EventBus.on('base-damaged', this.updateBaseHealth, this);
        EventBus.on('hero-stats-update', this.updateHeroStats, this);
        EventBus.on('wave-changed', this.updateWaveInfo, this);
        EventBus.on('tower-selected', this.updateTowerSelection, this);
        EventBus.on('skill-cooldown', this.updateSkillCooldown, this);
        EventBus.on('wave-timer-tick', this.updateWaveTimer, this);
        EventBus.on('wave-timer-toggle', (visible) => this.waveTimerContainer.setVisible(visible), this);
        EventBus.on('profession-levelup', (data) => {
            if(this.showCentralAlert) this.showCentralAlert(`¡NIVEL UP: ${data.key.toUpperCase()}!`, '#00ff00');
        });
        
        this.scene.events.once('shutdown', () => {
            EventBus.off('gold-changed');
            EventBus.off('base-damaged');
            EventBus.off('hero-stats-update');
            EventBus.off('wave-changed');
            EventBus.off('tower-selected');
            EventBus.off('skill-cooldown');
            EventBus.off('wave-timer-tick');
            EventBus.off('wave-timer-toggle');
            EventBus.off('profession-levelup');
        });
    }

    createTopHUD() {
        const w = this.width;
        const bg = this.scene.add.rectangle(w/2, 40, w, 60, 0x111111); // HUD más compacto arriba
        const line = this.scene.add.rectangle(w/2, 70, w, 2, 0xffffff);
        
        this.livesText = this.scene.add.text(30, 20, '', { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', color: '#ffffff' });
        this.castleText = this.scene.add.text(30, 45, '', { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#ffaaaa' });
        
        this.xpContainer = this.scene.add.container(0, -10); // Ajuste posición
        const xpLabel = this.scene.add.text(300, 35, 'XP:', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' });
        this.xpBarBg = this.scene.add.rectangle(330, 42, 200, 10, 0x333333).setOrigin(0, 0.5);
        this.xpBarFill = this.scene.add.rectangle(330, 42, 0, 10, 0x00ffff).setOrigin(0, 0.5);
        this.lvlText = this.scene.add.text(540, 35, 'Lvl 1', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' });
        this.xpContainer.add([xpLabel, this.xpBarBg, this.xpBarFill, this.lvlText]);

        this.waveInfoText = this.scene.add.text(w - 30, 30, 'OLEADA: 1', { fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5);

        this.container.add([bg, line, this.livesText, this.castleText, this.xpContainer, this.waveInfoText]);
    }

    createSkillButton() {
        const w = this.width;
        const h = this.height;
        // Mover botón de skill arriba a la derecha o a un lado para no estorbar
        const skillY = h - 220; 

        this.skillBtnContainer = this.scene.add.container(w - 60, skillY);
        this.skillBg = this.scene.add.circle(0, 0, 40, 0x222222).setStrokeStyle(3, 0x00ffff).setInteractive({ useHandCursor: true });
        
        const skillIcon = this.scene.add.text(0, -5, "⚡", { fontSize: '30px' }).setOrigin(0.5);
        
        this.skillOverlay = this.scene.add.circle(0, 0, 40, 0x000000, 0.7).setVisible(false);
        this.skillTimerText = this.scene.add.text(0, -5, "", { fontSize:'18px', fontStyle:'bold' }).setOrigin(0.5);

        this.skillBtnContainer.add([this.skillBg, skillIcon, this.skillOverlay, this.skillTimerText]);
        this.container.add(this.skillBtnContainer);

        this.skillBg.on('pointerdown', () => EventBus.emit('ui-trigger-skill'));
    }

    createWaveTimer() {
        const w = this.width;
        this.waveTimerContainer = this.scene.add.container(w/2, 100).setVisible(false);
        this.waveTimerContainer.setSize(200, 40);
        this.waveTimerContainer.setInteractive({ useHandCursor: true });
        
        const timerBg = this.scene.add.rectangle(0, 0, 200, 40, 0x006400).setStrokeStyle(2, 0xffffff);
        this.waveTimerBtnText = this.scene.add.text(0, 0, "INICIAR", { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', align: 'center', color: '#ffffff' }).setOrigin(0.5);
        
        this.waveTimerContainer.add([timerBg, this.waveTimerBtnText]);
        this.container.add(this.waveTimerContainer);

        this.waveTimerContainer.on('pointerdown', () => EventBus.emit('ui-start-wave'));
    }

    updateStats() {
        this.updateGold(gameState.gold || 0);
        this.updateBaseHealth(gameState.baseHp || 0);
        this.updateHeroStats();
    }

    updateGold(amount) {
        if(this.economyText) this.economyText.setText(`ORO: ${amount}`);
        if (this.towerCards) {
            this.towerCards.forEach(card => {
                const canAfford = amount >= card.cost;
                card.costText.setColor(canAfford ? '#ffd700' : '#ff0000');
                card.container.setAlpha(canAfford ? 1 : 0.6);
            });
        }
    }

    updateBaseHealth(amount) {
        if(this.castleText) this.castleText.setText(`🏰 CASTILLO: ${amount}`);
    }

    updateHeroStats() {
        const pStats = gameState.playerStats;
        const hero = getCurrentHero();
        if(this.livesText) this.livesText.setText(`❤️ HÉROE: ${Math.max(0, Math.floor(pStats.hp))}/${pStats.maxHp}`);
        if (hero && this.xpBarFill && this.lvlText) { 
            const xpPercent = Math.min(1, hero.xp / hero.maxXp); 
            this.xpBarFill.width = 200 * xpPercent; 
            this.lvlText.setText(`Lvl ${hero.level}`); 
        }
    }

    updateWaveInfo(info) {
        if(this.waveInfoText && info) {
            this.waveInfoText.setText(info.isBoss ? "¡JEFE FINAL!" : `OLEADA: ${info.current}/${info.total}`);
            this.waveInfoText.setColor(info.isBoss ? '#ff0000' : '#ffffff');
        }
    }

    updateTowerSelection(index) {
        if (this.towerCards) {
            this.towerCards.forEach((card, i) => {
                const isSelected = (i === index);
                card.bg.setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0x00ff00 : 0xaaaaaa);
                card.bg.setFillStyle(isSelected ? 0x444444 : 0x222222);
                card.container.setScale(isSelected ? 1.1 : 1.0);
            });
        }
    }

    updateSkillCooldown(data) {
        const cd = data.current;
        if (cd > 0) { 
            this.skillOverlay.setVisible(true);
            this.skillTimerText.setText(Math.ceil(cd / 1000));
            this.skillBg.setStrokeStyle(3, 0x555555); 
        } else { 
            this.skillOverlay.setVisible(false);
            this.skillTimerText.setText("");
            this.skillBg.setStrokeStyle(3, 0x00ffff); 
        } 
    }

    updateWaveTimer(seconds) {
        if(this.waveTimerBtnText) {
            this.waveTimerBtnText.setText(`SIGUIENTE: ${seconds}s`);
        }
    }

    pulseGoldIcon() {
        if (!this.economyText) return;
        this.scene.tweens.add({
            targets: this.economyText,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            color: '#ffff00', 
            onComplete: () => { this.economyText.setColor('#ffd700'); }
        });
    }

    updateGoldText() { this.updateGold(gameState.gold); }
    
    showCentralAlert(msg, color) {
        const txt = this.scene.add.text(this.width/2, this.height/2 - 100, msg, {
            fontFamily: 'Cinzel', fontSize: '30px', fontStyle:'bold', color: color, stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(3000);
        this.scene.tweens.add({ targets: txt, scale: 1.5, alpha: 0, duration: 1500, ease: 'Power2', onComplete: () => txt.destroy() });
    }
}