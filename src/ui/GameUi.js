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
import ProfessionsPanel from './ProfessionsPanel.js'; // <--- IMPORT NUEVO

export default class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        
        // Contenedores principales
        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.towerCards = [];
        
        // Estilos
        this.theme = { accent: 0xffffff };
        
        this.createPanels(); // Crear paneles primero
        this.createTopHUD();
        this.createTowerSelector();
        this.createSkillButton();
        this.createWaveTimer();
        this.createBottomMenu(); // Menú abajo
        
        // --- ESCUCHA DE EVENTOS ---
        this.setupListeners();
        
        // Actualización inicial
        this.updateStats();
    }

    createPanels() {
        const w = this.width;
        const h = this.height;
        // Instancia de paneles
        this.heroPanel = new HeroPanel(this.scene, w/2, h/2, w, h);
        this.inventoryPanel = new InventoryPanel(this.scene, w/2, h/2, w, h);
        this.talentsPanel = new TalentTree(this.scene, w/2, h/2, w, h);
        this.forgePanel = new ForgePanel(this.scene, w/2, h/2, w, h);
        this.refiningPanel = new RefiningPanel(this.scene, w/2, h/2, w, h);
        this.questBoard = new QuestBoard(this.scene, w/2, h/2, w, h);
        this.towersPanel = new TowersPanel(this.scene, w/2, h/2, w, h);
        this.professionsPanel = new ProfessionsPanel(this.scene, w/2, h/2, w, h); // <--- NUEVO

        this.allPanels = [
            this.heroPanel, this.inventoryPanel, this.talentsPanel, 
            this.forgePanel, this.refiningPanel, this.questBoard, 
            this.towersPanel, this.professionsPanel
        ];
    }

    createBottomMenu() {
        const menuY = this.height - 40;
        
        const buttons = [
            { label: "HÉROE", icon: "👤", panel: this.heroPanel },
            { label: "MOCHILA", icon: "🎒", panel: this.inventoryPanel },
            { label: "TALENTOS", icon: "✨", panel: this.talentsPanel },
            { label: "FORJA", icon: "⚒️", panel: this.forgePanel },
            { label: "REFINAR", icon: "⚗️", panel: this.refiningPanel },
            { label: "MISIONES", icon: "📜", panel: this.questBoard },
            { label: "PROFESIONES", icon: "🔨", panel: this.professionsPanel } // <--- NUEVO
        ];

        const btnWidth = 100;
        const startX = this.width / 2 - ((buttons.length * (btnWidth + 10)) / 2) + (btnWidth/2);
        
        buttons.forEach((btn, i) => {
            const x = startX + (i * (btnWidth + 10));
            
            const btnBg = this.scene.add.rectangle(x, menuY, btnWidth, 60, 0x222222).setStrokeStyle(2, 0x555555).setInteractive({useHandCursor:true}).setDepth(91);
            const icon = this.scene.add.text(x, menuY - 15, btn.icon, { fontSize: '24px' }).setOrigin(0.5).setDepth(92);
            const label = this.scene.add.text(x, menuY + 15, btn.label, { fontFamily: 'Roboto', fontSize: '10px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(92);

            btnBg.on('pointerdown', () => {
                this.togglePanel(btn.panel);
                // SoundManager.playSound('ui_click'); // Opcional
            });
            
            btnBg.on('pointerover', () => btnBg.setFillStyle(0x444444));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x222222));
        });
    }

    togglePanel(targetPanel) {
        const isVisible = targetPanel.container.visible;
        // Cerrar todos
        this.allPanels.forEach(p => p.hide());
        
        // Si no estaba visible, abrirlo
        if (!isVisible) {
            targetPanel.show();
        }
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

        this.scene.events.once('shutdown', () => {
            EventBus.off('gold-changed');
            EventBus.off('base-damaged');
            EventBus.off('hero-stats-update');
            EventBus.off('wave-changed');
            EventBus.off('tower-selected');
            EventBus.off('skill-cooldown');
            EventBus.off('wave-timer-tick');
            EventBus.off('wave-timer-toggle');
        });
    }

    createTopHUD() {
        const w = this.width;
        const bg = this.scene.add.rectangle(w/2, 60, w, 80, 0x111111);
        const line = this.scene.add.rectangle(w/2, 100, w, 4, 0xffffff);
        
        this.livesText = this.scene.add.text(30, 30, '', { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' });
        this.castleText = this.scene.add.text(30, 65, '', { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', color: '#ffaaaa' });
        
        this.xpContainer = this.scene.add.container(0, 0);
        const xpLabel = this.scene.add.text(300, 35, 'XP:', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' });
        this.xpBarBg = this.scene.add.rectangle(330, 42, 200, 10, 0x333333).setOrigin(0, 0.5);
        this.xpBarFill = this.scene.add.rectangle(330, 42, 0, 10, 0x00ffff).setOrigin(0, 0.5);
        this.lvlText = this.scene.add.text(540, 35, 'Lvl 1', { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' });
        this.xpContainer.add([xpLabel, this.xpBarBg, this.xpBarFill, this.lvlText]);

        this.waveInfoText = this.scene.add.text(w - 30, 30, 'OLEADA: 1', { fontFamily: 'Cinzel', fontSize: '28px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5);

        this.container.add([bg, line, this.livesText, this.castleText, this.xpContainer, this.waveInfoText]);
    }

    createTowerSelector() {
        const w = this.width;
        const h = this.height;
        
        this.towerSelectorContainer = this.scene.add.container(w/2, h - 70);
        
        const selectorBg = this.scene.add.rectangle(0, 0, 680, 130, 0x000000, 0.5).setStrokeStyle(2, 0x444444);
        this.towerSelectorContainer.add(selectorBg);

        const economyBg = this.scene.add.rectangle(0, -80, 320, 30, 0x000000, 0.85).setStrokeStyle(1, 0xffd700);
        this.economyText = this.scene.add.text(0, -80, 'MONEDAS ACTUALES: 0', { fontFamily: 'Roboto', fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.towerSelectorContainer.add([economyBg, this.economyText]);

        const towerOrder = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
        const displayNames = { 'archer': 'ARQUERO', 'cannon': 'CAÑON', 'mage': 'MAGO', 'tesla': 'TESLA', 'poison': 'VENENO', 'quake': 'TERREMOTO' };
        
        const cardWidth = 100;
        const cardHeight = 120;
        const gap = 110;
        const startX = -((gap * 5) / 2);

        towerOrder.forEach((type, i) => {
            const card = this.scene.add.container(startX + (i * gap), 0);
            const cardBg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x222222).setInteractive({useHandCursor:true});
            cardBg.setStrokeStyle(1, 0xaaaaaa);
            
            const stats = TOWER_TYPES[type];
            const icon = this.scene.add.rectangle(0, -20, 50, 50, stats.color || 0x888888);
            const name = this.scene.add.text(0, -50, displayNames[type], { fontSize:'10px', fontStyle:'bold' }).setOrigin(0.5);
            const cost = TOWER_COSTS[type];
            const costText = this.scene.add.text(0, 25, `$${cost}`, { fontSize:'16px', color:'#ffd700', fontStyle:'bold' }).setOrigin(0.5);
            const key = this.scene.add.text(0, 45, `[${i+1}]`, { fontSize:'10px', color:'#888' }).setOrigin(0.5);

            cardBg.on('pointerdown', () => EventBus.emit('ui-select-tower', i));

            card.add([cardBg, icon, name, costText, key]);
            this.towerSelectorContainer.add(card);
            
            this.towerCards.push({ container: card, bg: cardBg, costText: costText, cost: cost });
        });

        this.container.add(this.towerSelectorContainer);
    }

    createSkillButton() {
        const w = this.width;
        const h = this.height;
        const skillY = h - 140;

        this.skillBtnContainer = this.scene.add.container(w - 90, skillY);
        this.skillBg = this.scene.add.circle(0, 0, 50, 0x222222).setStrokeStyle(3, 0x00ffff).setInteractive({ useHandCursor: true });
        
        const skillIcon = this.scene.add.text(0, -10, "⚡", { fontSize: '40px' }).setOrigin(0.5);
        const skillLabel = this.scene.add.text(0, 25, "Habilidad\n(Espacio)", { fontFamily: 'Roboto', fontSize: '12px', align: 'center', color: '#ffffff' }).setOrigin(0.5);
        
        this.skillOverlay = this.scene.add.circle(0, 0, 50, 0x000000, 0.7).setVisible(false);
        this.skillTimerText = this.scene.add.text(0, -10, "", { fontSize:'20px', fontStyle:'bold' }).setOrigin(0.5);

        this.skillBtnContainer.add([this.skillBg, skillIcon, skillLabel, this.skillOverlay, this.skillTimerText]);
        this.container.add(this.skillBtnContainer);

        this.skillBg.on('pointerdown', () => EventBus.emit('ui-trigger-skill'));
    }

    createWaveTimer() {
        const w = this.width;
        this.waveTimerContainer = this.scene.add.container(w/2, 60).setVisible(false);
        this.waveTimerContainer.setSize(320, 60);
        this.waveTimerContainer.setInteractive({ useHandCursor: true });
        
        const timerBg = this.scene.add.rectangle(0, 0, 320, 60, 0x006400).setStrokeStyle(2, 0xffffff);
        this.waveTimerBtnText = this.scene.add.text(0, 0, "INICIAR", { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold', align: 'center', color: '#ffffff' }).setOrigin(0.5);
        
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
        if(this.economyText) this.economyText.setText(`MONEDAS ACTUALES: ${amount}`);
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
            this.waveTimerBtnText.setText(`SIGUIENTE OLEADA: ${seconds}s\n(Clic para iniciar)`);
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