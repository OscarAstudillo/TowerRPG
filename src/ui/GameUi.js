import Phaser from 'phaser';
import { gameState, getCurrentHero, TOWER_COSTS } from '../config/GameState.js';
import { TOWER_TYPES } from '../config/TowerStats.js';
import { EventBus } from '../utils/EventBus.js';

export default class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        
        // Contenedores principales
        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.towerCards = [];
        this.skillButtons = {}; // Almacenar referencias a los botones de skill
        
        // Estilos
        this.theme = { accent: 0xffffff };
        
        this.createTopHUD();
        this.createTowerSelector();
        this.createSkillButtonsGroup(); // Renombrado para crear el grupo Q, Espacio, E
        this.createWaveTimer();
        
        // --- ESCUCHA DE EVENTOS ---
        this.setupListeners();
        
        // Actualización inicial
        this.updateStats();
    }

    setupListeners() {
        EventBus.on('gold-changed', this.updateGold, this);
        EventBus.on('base-damaged', this.updateBaseHealth, this);
        EventBus.on('hero-stats-update', this.updateHeroStats, this);
        EventBus.on('wave-changed', this.updateWaveInfo, this);
        
        EventBus.on('tower-selected', this.updateTowerSelection, this);
        
        // Evento de cooldown unificado. Espera datos como: { key: 'dash'|'q'|'e', current: 2000, total: 5000 }
        // Si no trae 'key', asume que es la habilidad principal (Espacio) por compatibilidad
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

    // --- NUEVO MÉTODO PARA CREAR EL GRUPO DE BOTONES DE HABILIDAD ---
    createSkillButtonsGroup() {
        const w = this.width;
        const h = this.height;
        const skillY = h - 140;
        
        // Contenedor general para las skills
        this.skillsContainer = this.scene.add.container(w - 120, skillY);
        
        // Definición de las 3 habilidades
        const skills = [
            { key: 'q', label: 'Q', icon: '🌪️', color: 0x00ffff, offsetX: -60 },
            { key: 'main', label: 'SPACE', icon: '⚡', color: 0xffff00, offsetX: 0, scale: 1.2 }, // Botón principal más grande
            { key: 'e', label: 'E', icon: '⚔️', color: 0xff00ff, offsetX: 60 }
        ];

        skills.forEach(skill => {
            const btnContainer = this.scene.add.container(skill.offsetX, 0);
            
            // Círculo de fondo
            const radius = 35 * (skill.scale || 1);
            const bg = this.scene.add.circle(0, 0, radius, 0x222222)
                .setStrokeStyle(2, skill.color)
                .setInteractive({ useHandCursor: true });

            // Icono y Etiqueta
            const icon = this.scene.add.text(0, -5, skill.icon, { fontSize: `${20 * (skill.scale||1)}px` }).setOrigin(0.5);
            const label = this.scene.add.text(0, radius + 15, skill.label, { fontFamily: 'Roboto', fontSize: '12px', color: '#fff', fontStyle:'bold' }).setOrigin(0.5);

            // Overlay de Cooldown (Círculo semitransparente)
            const overlay = this.scene.add.circle(0, 0, radius, 0x000000, 0.7).setVisible(false);
            const timerText = this.scene.add.text(0, 0, "", { fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

            // Interacción (Clic en UI dispara habilidad)
            bg.on('pointerdown', () => {
                if (skill.key === 'main') EventBus.emit('ui-trigger-skill', 'space'); // Asumiendo 'space' es el trigger default
                else EventBus.emit('ui-trigger-skill', skill.key);
            });

            btnContainer.add([bg, icon, overlay, timerText, label]);
            this.skillsContainer.add(btnContainer);

            // Guardar referencia para actualizar cooldown
            this.skillButtons[skill.key] = {
                bg: bg,
                overlay: overlay,
                timerText: timerText,
                baseColor: skill.color
            };
        });

        this.container.add(this.skillsContainer);
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

    // --- ACTUALIZACIÓN DE COOLDOWNS MÚLTIPLES ---
    updateSkillCooldown(data) {
        // data puede ser:
        // A) { current: 500 } -> Legacy (asume habilidad principal 'main')
        // B) { key: 'q', current: 2000 } -> Nueva estructura
        
        let key = data.key || 'main'; 
        const cd = data.current;

        const btn = this.skillButtons[key];
        if (!btn) return;

        if (cd > 0) { 
            btn.overlay.setVisible(true);
            btn.timerText.setText(Math.ceil(cd / 1000));
            btn.bg.setStrokeStyle(2, 0x555555); // Color apagado
        } else { 
            btn.overlay.setVisible(false);
            btn.timerText.setText("");
            btn.bg.setStrokeStyle(2, btn.baseColor); // Color original brillante
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
            onComplete: () => {
                this.economyText.setColor('#ffd700');
            }
        });
    }

    getGoldIconPosition() {
        return { 
            x: this.scene.scale.width / 2, 
            y: this.scene.scale.height - 80 
        };
    }
}