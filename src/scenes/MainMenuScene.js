// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, RARITY, getCurrentHero } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import { RECIPES } from '../config/Recipes.js';
import { TALENTS } from '../config/Talents.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { ITEM_SETS } from '../config/ItemSets.js'; 

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.currentTab = 'hero'; 
        
        this.inventoryCategory = 'all'; 
        this.refiningFilter = 'wood'; 
        this.forgeFilter = 'weapon'; 
        this.forgeSubFilter = 'all';

        this.selectedItem = null;
        this.itemToFuse1 = null; 
        this.itemToFuse2 = null; 
        this.expandedRecipeId = null; 
        this.craftSelection = { type: null, recipe: null, rarity: null };
        this.hasLoaded = false;

        this.fontTitle = { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000000', strokeThickness: 4 };
        this.fontHeader = { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
        this.fontBody = { fontFamily: 'Roboto', fontSize: '14px', color: '#eeeeee', stroke: '#000000', strokeThickness: 2 };
        this.fontBtn = { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };
        this.fontSmall = { fontFamily: 'Roboto', fontSize: '12px', color: '#aaaaaa' };
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        if (!this.hasLoaded) {
            SaveSystem.load();
            if (!gameState.talents) gameState.talents = [];
            this.sanitizeData(); 
            this.hasLoaded = true;
        }

        if (!gameState.selectedClass) {
            this.scene.start('HeroSelectScene');
            return;
        }

        updatePlayerStats();

        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.add.rectangle(cx, cy, w, h, 0x1a1a1a);
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', this.fontTitle).setOrigin(0.5);
        this.goldText = this.add.text(w - 30, h * 0.05, `ORO: ${gameState.gold}`, { ...this.fontHeader, color: '#ffd700' }).setOrigin(1, 0.5);

        const tabY = h * 0.12; const tabW = 140; const startX = cx - (tabW * 2.5);
        this.createTabButton(startX, tabY, 'HÉROE', 'hero', tabW);
        this.createTabButton(startX + tabW, tabY, 'TALENTOS', 'talents', tabW);
        this.createTabButton(startX + tabW*2, tabY, 'MOCHILA', 'inventory', tabW);
        this.createTabButton(startX + tabW*3, tabY, 'REFINAR', 'refining', tabW);
        this.createTabButton(startX + tabW*4, tabY, 'CREACIÓN', 'forge', tabW); 
        this.createTabButton(startX + tabW*5, tabY, 'TORRES', 'towers', tabW);

        this.heroContainer = this.add.container(0, 0);
        this.talentsContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.refiningContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);
        this.towersContainer = this.add.container(0, 0);

        this.createHeroView(w, h, cx, cy);
        this.createTalentsView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy);
        this.createRefiningView(w, h, cx, cy);
        this.createForgeView(w, h, cx, cy);
        this.createTowersView(w, h, cx, cy);

        this.switchTab('hero');

        const botY = h - 50;
        const playBtn = this.add.rectangle(cx, botY, 220, 50, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00);
        this.add.text(cx, botY, 'IR AL MAPA', { ...this.fontTitle, fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        // BOTÓN DE MISIONES
        const questBtn = this.add.rectangle(w - 150, h * 0.2, 120, 40, 0x800080).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff);
        this.add.text(w - 150, h * 0.2, "MISIONES", this.fontBtn).setOrigin(0.5);
        questBtn.on('pointerdown', () => this.toggleQuestModal());

        // Inicializar misiones si no hay
        RPGSystem.generateDailyQuests();
        
        // Crear el contenedor del modal (oculto al inicio)
        this.createQuestModal(w, h, cx, cy);

        const changeHeroBtn = this.add.text(50, botY, 'CAMBIAR HÉROE', { ...this.fontBtn, color: '#00ffff' }).setInteractive({ useHandCursor: true }).setOrigin(0, 0.5);
        changeHeroBtn.on('pointerdown', () => { gameState.selectedClass = null; this.scene.start('HeroSelectScene'); });

        const resetBtn = this.add.text(w - 50, botY, 'BORRAR DATOS', { ...this.fontBtn, color: '#ff5555' }).setInteractive({ useHandCursor: true }).setOrigin(1, 0.5);
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo el progreso?")) { SaveSystem.reset(); } });
    }

    sanitizeData() {
        const equippedIds = new Set();
        const getId = (i) => i && i.id ? String(i.id) : null;
        Object.values(gameState.equipment).forEach(i => { if(i) equippedIds.add(getId(i)); });
        Object.values(gameState.towerEquipment).forEach(t => { if(t.slot1) equippedIds.add(getId(t.slot1)); if(t.slot2) equippedIds.add(getId(t.slot2)); });
        let cleanInv = []; const seenIdsInInv = new Set();
        gameState.inventory.forEach(item => { if (!item) return; if (!item.id || typeof item.id !== 'string') item.id = RPGSystem.getUniqueId(); const id = item.id; if (equippedIds.has(id)) return; if (seenIdsInInv.has(id)) { item.id = RPGSystem.getUniqueId(); } seenIdsInInv.add(item.id); cleanInv.push(item); });
        gameState.inventory = cleanInv; SaveSystem.save();
    }
    safeAddItemToInventory(item) { if (!item) return; const exists = gameState.inventory.some(i => i.id === item.id); if (!exists) gameState.inventory.push(item); else { item.id = RPGSystem.getUniqueId(); gameState.inventory.push(item); } }
    createTabButton(x, y, text, tabKey, width) { const btn = this.add.rectangle(x, y, width - 8, 45, 0x222222).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x555555); const txt = this.add.text(x, y, text, this.fontBtn).setOrigin(0.5); btn.on('pointerdown', () => { this.switchTab(tabKey); this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 50 }); }); }
    switchTab(tabKey) { this.currentTab = tabKey; [this.heroContainer, this.talentsContainer, this.invContainer, this.refiningContainer, this.forgeContainer, this.towersContainer].forEach(c => c.setVisible(false)); if (tabKey === 'hero') { this.heroContainer.setVisible(true); this.refreshHero(); } if (tabKey === 'talents') { this.talentsContainer.setVisible(true); this.refreshTalents(); } if (tabKey === 'inventory') { this.invContainer.setVisible(true); this.refreshInventory(); } if (tabKey === 'refining') { this.refiningContainer.setVisible(true); this.refreshRefining(); } if (tabKey === 'forge') { this.forgeContainer.setVisible(true); this.refreshForge(); } if (tabKey === 'towers') { this.towersContainer.setVisible(true); this.refreshTowersView(); } }
    createActionButton(x, y, text, callback, color = 0x006400) { const container = this.add.container(x, y); const bg = this.add.rectangle(0, 0, 200, 35, color).setInteractive({ useHandCursor: true }); const txt = this.add.text(0, 0, text, this.fontBtn).setOrigin(0.5); bg.on('pointerdown', callback); container.add([bg, txt]); return container; }
    showCentralAlert(text, colorHex = '#ffffff') { const cx = this.scale.width / 2; const cy = this.scale.height / 2; const container = this.add.container(cx, cy).setDepth(3000); const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.9).setStrokeStyle(4, colorHex.replace('#', '0x')); const msg = this.add.text(0, 0, text, { ...this.fontTitle, fontSize: '28px', color: colorHex }).setOrigin(0.5); container.add([bg, msg]); container.setScale(0); this.tweens.add({ targets: container, scale: 1, ease: 'Back.out', duration: 300, onComplete: () => { this.time.delayedCall(2000, () => { this.tweens.add({ targets: container, scale: 0, alpha: 0, duration: 300, onComplete: () => container.destroy() }); }); }}); }

    getSetInfoText(recipeId) {
        let text = "";
        for (let setKey in ITEM_SETS) {
            const set = ITEM_SETS[setKey];
            if (set.items.includes(recipeId)) {
                text += `\n✨ SET: ${set.name} ✨\n`;
                set.bonuses.forEach(b => {
                    text += `  (${b.count}) ${b.desc}\n`;
                });
            }
        }
        return text;
    }

    // --- VISTA INVENTARIO ---
    createInventoryView(w, h, cx, cy) {
        const catY = h * 0.18;
        this.createInvCategoryBtn(cx - 300, catY, "EQUIPO", 'all'); 
        this.createInvCategoryBtn(cx, catY, "TORRES", 'tower_part'); 
        this.createInvCategoryBtn(cx + 300, catY, "MATERIALES", 'mats');
        
        this.invMatsText = this.add.text(50, catY + 60, '', { ...this.fontBody, lineHeight: 20 }); 
        this.invContainer.add(this.invMatsText);
        
        const gridX = w * 0.28; const gridY = h * 0.3;
        this.invItemsContainer = this.add.container(gridX, gridY); 
        this.invContainer.add(this.invItemsContainer);
        
        // Contenedor para el detalle (se reconstruirá)
        const detailX = w * 0.78;
        this.itemDetailContainer = this.add.container(detailX, gridY); 
        this.itemDetailContainer.setVisible(false); 
        this.invContainer.add(this.itemDetailContainer);
        
        this.createFusionModals(cx, cy);
    }
    
    createFusionModals(cx, cy) {
        this.fusionListModal = this.add.container(cx, cy).setVisible(false).setDepth(2000);
        
        // Modal de Lista
        const fBg = this.add.rectangle(0, 0, 600, 500, 0x000000).setStrokeStyle(2, 0x00ffff).setInteractive();
        const fTitle = this.add.text(0, -220, "SELECCIONA 2° ITEM (SACRIFICIO)", { ...this.fontHeader, fontSize: '24px' }).setOrigin(0.5);
        this.fusionList = this.add.container(0, -180); // Subimos un poco el contenedor
        const fCancel = this.add.text(0, 220, "CANCELAR", { ...this.fontBtn, color: '#ff0000' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        fCancel.on('pointerdown', () => this.fusionListModal.setVisible(false));
        this.fusionListModal.add([fBg, fTitle, this.fusionList, fCancel]);

        // Modal de Confirmación
        this.fusionConfirmModal = this.add.container(cx, cy).setVisible(false).setDepth(2100);
        const fcBg = this.add.rectangle(0, 0, 900, 600, 0x111111).setStrokeStyle(3, 0xffd700).setInteractive();
        const fcTitle = this.add.text(0, -260, "CONFIRMAR FUSIÓN", { ...this.fontTitle, fontSize:'32px' }).setOrigin(0.5);
        const fcInfo = this.add.text(0, -220, "El resultado heredará los stats de UNO de los dos (50/50).\nEl nivel de encantamiento subirá +1.", { ...this.fontBody, color: '#aaa', align: 'center' }).setOrigin(0.5);

        // Paneles visuales para los items
        const panelY = 0;
        // Panel Izquierdo (Item Base)
        const leftBg = this.add.rectangle(-220, panelY, 350, 400, 0x000000).setStrokeStyle(2, 0x00ffff);
        const leftTitle = this.add.text(-220, panelY - 180, "ITEM BASE", { ...this.fontHeader, color: '#00ffff' }).setOrigin(0.5);
        this.fusionItem1Info = this.add.text(-220, panelY, "", { ...this.fontBody, align: 'center', wordWrap: {width: 320} }).setOrigin(0.5);

        // Panel Derecho (Sacrificio)
        const rightBg = this.add.rectangle(220, panelY, 350, 400, 0x000000).setStrokeStyle(2, 0xff00ff);
        const rightTitle = this.add.text(220, panelY - 180, "SACRIFICIO", { ...this.fontHeader, color: '#xff00ff' }).setOrigin(0.5);
        this.fusionItem2Info = this.add.text(220, panelY, "", { ...this.fontBody, align: 'center', wordWrap: {width: 320} }).setOrigin(0.5);

        // Flecha central
        const arrow = this.add.text(0, panelY, "➡", { fontSize: '64px', color: '#fff' }).setOrigin(0.5);

        const confirmBtn = this.add.rectangle(0, 250, 300, 60, 0x006400).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0x00ff00);
        const confirmTxt = this.add.text(0, 250, "¡FUSIONAR!", this.fontBtn).setOrigin(0.5);
        confirmBtn.on('pointerdown', () => this.executeFusion());
        
        const backBtn = this.add.text(0, 310, "Volver", { ...this.fontBody, color: '#888' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        backBtn.on('pointerdown', () => { this.fusionConfirmModal.setVisible(false); this.fusionListModal.setVisible(true); });

        this.fusionConfirmModal.add([fcBg, fcTitle, fcInfo, leftBg, leftTitle, this.fusionItem1Info, rightBg, rightTitle, this.fusionItem2Info, arrow, confirmBtn, confirmTxt, backBtn]);
    }

    createInvCategoryBtn(x, y, label, cat) { 
        const btn = this.add.text(x, y, label, { ...this.fontHeader, color: '#888' }).setInteractive({ useHandCursor: true }).setOrigin(0.5); 
        btn.on('pointerdown', () => { 
            this.inventoryCategory = cat; 
            this.selectedItem = null; 
            this.itemDetailContainer.setVisible(false); 
            this.refreshInventory(); 
            this.invContainer.list.forEach(c => { if(c.setColor) c.setColor('#888'); });
            btn.setColor('#fff');
        }); 
        this.invContainer.add(btn); 
    }

    refreshInventory() { 
        let matContent = ""; 
        if (this.inventoryCategory === 'mats') { 
            matContent += "--- RECURSOS ---\n";
            for(let k in gameState.materials) {
                const mat = gameState.materials[k];
                let hasAny = false;
                let line = `${(RAW_MATERIALS[k] || REFINED_MATERIALS[k] || {name:k}).name}: `;
                Object.keys(RARITY).forEach(r => { if(mat[r] > 0) { hasAny=true; line+=`[${RARITY[r].name.substr(0,1)}:${mat[r]}] `; } });
                if(hasAny) matContent += line + "\n";
            }
        } 
        this.invMatsText.setText(matContent); 
        this.invItemsContainer.removeAll(true); 
        
        const filteredItems = gameState.inventory.filter(i => { 
            if (!i) return false; 
            if (this.inventoryCategory === 'mats') return false; 
            if (this.inventoryCategory === 'all') return i.type !== 'tower_part'; 
            if (this.inventoryCategory === 'tower_part') return i.type === 'tower_part'; 
            return true; 
        }); 
        
        let col = 0; let row = 0; 
        filteredItems.forEach(item => { 
            const itemContainer = this.add.container(col * 180, row * 50); 
            const bg = this.add.rectangle(85, 20, 170, 40, 0x333333).setInteractive({ useHandCursor: true }); 
            bg.setStrokeStyle(1, item.color); 
            const nameTxt = this.add.text(10, 12, item.name, { ...this.fontBody, fontSize:'12px', color: '#fff', wordWrap: {width: 150} }); 
            bg.on('pointerdown', () => this.selectItem(item)); 
            itemContainer.add([bg, nameTxt]); 
            this.invItemsContainer.add(itemContainer); 
            col++; if (col >= 3) { col = 0; row++; } 
        }); 
        this.goldText.setText(`ORO: ${gameState.gold}`); 
    }

    // --- FUNCIÓN DE DETALLE INVENTARIO (RECONSTRUIDA) ---
    selectItem(item) { 
        this.selectedItem = item; 
        this.itemDetailContainer.removeAll(true); // Limpiar panel
        this.itemDetailContainer.setVisible(true); 

        const itemColor = item.color || 0xffffff; 
        const colorHex = '#' + itemColor.toString(16).padStart(6, '0'); 
        
        const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats"; 
        let infoText = `Nivel: +${item.enchant}\nRareza: ${RARITY[item.rarity].name}\nStats:\n${statsStr}`; 
        
        const setInfo = this.getSetInfoText(item.recipeId);
        infoText += setInfo ? `\n${setInfo}` : "";

        if (item.type !== 'tower_part') { 
            let equipped = null; 
            if (item.type === 'weapon') equipped = gameState.equipment.mainHand; 
            else if (item.type === 'offhand') equipped = gameState.equipment.offHand; 
            else if (item.type === 'armor') equipped = gameState.equipment.armor; 
            else if (item.type === 'accessory') equipped = gameState.equipment.accessory; 
            
            if (equipped) { 
                infoText += `\n\n-- VS EQUIPADO --\n${equipped.name}\n`; 
                for (let key in item.stats) { 
                    const newVal = item.stats[key]; const oldVal = equipped.stats[key] || 0; 
                    const diff = newVal - oldVal; 
                    let isBetter = diff > 0; if (key === 'attackSpeed' || key === 'cdr') isBetter = diff < 0; 
                    infoText += `${key}: ${newVal} (${diff > 0 ? '+' : ''}${diff}) ${isBetter ? '▲' : '▼'}\n`; 
                } 
            }
        } 
        
        // Construcción Limpia del Panel
        let currentY = 0;
        const title = this.add.text(0, currentY, item.name, { ...this.fontHeader, fontSize: '18px', color: colorHex, align: 'center', wordWrap: {width: 280} }).setOrigin(0.5, 0);
        currentY += title.height + 20;

        const stats = this.add.text(0, currentY, infoText, { ...this.fontBody, fontSize: '13px', align: 'left', wordWrap: {width: 280} }).setOrigin(0.5, 0);
        currentY += stats.height + 30;

        const equipLabel = item.type === 'tower_part' ? "EQUIPAR EN..." : "EQUIPAR";
        const equipBtn = this.createActionButton(0, currentY, equipLabel, () => this.actionEquip(), 0x006400);
        currentY += 50;
        const fuseBtn = this.createActionButton(0, currentY, "FUSIONAR...", () => this.initiateFusion(), 0x00008b);
        currentY += 50;
        const sellBtn = this.createActionButton(0, currentY, "VENDER", () => this.actionSell(), 0x8b0000);
        currentY += 50;

        // Fondo ajustado al contenido total
        const bgHeight = currentY + 20;
        const bg = this.add.rectangle(0, bgHeight/2 - 20, 320, bgHeight, 0x000000, 0.95).setStrokeStyle(2, itemColor);
        
        this.itemDetailContainer.add([bg, title, stats, equipBtn, fuseBtn, sellBtn]);
    }

    actionEquip() { 
        if (!this.selectedItem) return; 
        const idx = gameState.inventory.findIndex(i => String(i.id) === String(this.selectedItem.id));
        if (idx === -1) { this.refreshInventory(); return; }
        const item = gameState.inventory[idx];
        gameState.inventory.splice(idx, 1);
        if (item.type === 'tower_part') { 
            const type = item.towerType || item.subType; 
            if (!gameState.towerEquipment[type].slot1) { gameState.towerEquipment[type].slot1 = item; } 
            else if (!gameState.towerEquipment[type].slot2) { gameState.towerEquipment[type].slot2 = item; } 
            else { const old = gameState.towerEquipment[type].slot1; this.safeAddItemToInventory(old); gameState.towerEquipment[type].slot1 = item; } 
            this.finishAction('towers'); return; 
        } 
        const cls = gameState.selectedClass; 
        if (item.type === 'armor') this.swapping('armor', item); 
        else if (item.type === 'accessory') this.swapping('accessory', item); 
        else if (item.type === 'offhand') this.swapping('offHand', item); 
        else if (item.type === 'weapon') { 
            if (item.twoHanded) { this.forceUnequip('mainHand'); this.forceUnequip('offHand'); gameState.equipment.mainHand = item; } 
            else { if (!gameState.equipment.mainHand) { gameState.equipment.mainHand = item; } else if (this.canDualWield(cls) && !gameState.equipment.offHand) { gameState.equipment.offHand = item; } else { this.swapping('mainHand', item); } } 
        } 
        this.finishAction('inventory');
    }
    finishAction(targetTab) { updatePlayerStats(); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save(); if(targetTab === 'towers') this.switchTab('towers'); }
    actionSell() { if (!this.selectedItem) return; const idx = gameState.inventory.findIndex(i => i.id === this.selectedItem.id); if (idx === -1) return; const item = gameState.inventory[idx]; let sellPrice = 50; gameState.gold += sellPrice; gameState.inventory.splice(idx, 1); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save(); }
    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) { this.safeAddItemToInventory(gameState.equipment[slot]); } gameState.equipment[slot] = newItem; }
    forceUnequip(slot) { if (gameState.equipment[slot]) { this.safeAddItemToInventory(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    initiateFusion() { if (!this.selectedItem) return; this.itemToFuse1 = this.selectedItem; this.fusionListModal.setVisible(true); this.populateFusionList(); }
    populateFusionList() { this.fusionList.removeAll(true); const candidates = gameState.inventory.filter(i => String(i.id) !== String(this.itemToFuse1.id) && i.type === this.itemToFuse1.type && i.rarity === this.itemToFuse1.rarity && i.enchant === this.itemToFuse1.enchant); if (candidates.length === 0) { this.fusionList.add(this.add.text(0, 0, "No hay items compatibles", { ...this.fontBody }).setOrigin(0.5)); return; } let y = 0; candidates.forEach(item => { const btn = this.add.rectangle(0, y, 400, 40, 0x333333).setInteractive({useHandCursor:true}); const txt = this.add.text(0, y, `${item.name}`, { ...this.fontBody }).setOrigin(0.5); btn.on('pointerdown', () => this.selectSecondItemForFusion(item)); this.fusionList.add([btn, txt]); y += 50; }); }
    selectSecondItemForFusion(item2) { 
        this.itemToFuse2 = item2; 
        this.fusionListModal.setVisible(false); 
        this.fusionConfirmModal.setVisible(true); 
        
        // Helper para formatear stats
        const formatItemInfo = (item) => {
            const colorHex = '#' + (item.color || 0xffffff).toString(16).padStart(6, '0');
            const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '');
            return `[color=${colorHex}]${item.name}[/color]\n\nNivel: +${item.enchant}\nRareza: ${RARITY[item.rarity].name}\n\nSTATS:\n${statsStr}`;
        };

        // NOTA: Phaser Text normal no soporta BBCode ([color]) por defecto sin configuración avanzada,
        // así que usaremos setColor en el objeto si es necesario, o texto plano limpio.
        // Aquí uso texto plano limpio para asegurar compatibilidad.
        
        const getInfo = (item) => {
            let s = `** ${item.name} **\n`;
            s += `Nivel: +${item.enchant} | ${RARITY[item.rarity].name}\n`;
            s += `----------------\n`;
            for (let k in item.stats) {
                s += `${k}: ${item.stats[k]}\n`;
            }
            return s;
        };

        this.fusionItem1Info.setText(getInfo(this.itemToFuse1)); 
        this.fusionItem1Info.setColor('#' + (this.itemToFuse1.color || 0xffffff).toString(16).padStart(6,'0'));
        
        this.fusionItem2Info.setText(getInfo(this.itemToFuse2));
        this.fusionItem2Info.setColor('#' + (this.itemToFuse2.color || 0xffffff).toString(16).padStart(6,'0'));
    }
    executeFusion() { const item1 = gameState.inventory.find(i => i.id === this.itemToFuse1.id); const item2 = gameState.inventory.find(i => i.id === this.itemToFuse2.id); if (!item1 || !item2) return; const result = RPGSystem.fuseSpecificItems(item1, item2); if (result.success) { gameState.inventory = gameState.inventory.filter(i => i.id !== item1.id && i.id !== item2.id); this.safeAddItemToInventory(result.item); this.fusionConfirmModal.setVisible(false); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save(); this.showCentralAlert(`FUSIÓN EXITOSA: ${result.item.name}`, '#00ff00'); } }

    // --- VISTA FORJA ORGANIZADA ---
    createForgeView(w, h, cx, cy) {
        this.profText = this.add.text(cx, h * 0.15, '', { ...this.fontBody, color: '#00ff00', align: 'center' }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);
        this.forgeMsg = this.add.text(cx, h - 50, '', { ...this.fontHeader }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);
        
        const catY = h * 0.22;
        this.createForgeCatBtn(w * 0.2, catY, "ARMAS", 'weapon');
        this.createForgeCatBtn(w * 0.4, catY, "ARMADURAS", 'armor');
        this.createForgeCatBtn(w * 0.6, catY, "JOYAS", 'accessory');
        this.createForgeCatBtn(w * 0.8, catY, "TORRES", 'tower_part');
        
        this.forgeSubFilterContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.forgeSubFilterContainer);

        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);
        
        // Contenedor para el detalle (se reconstruirá)
        const detailX = w * 0.78; const detailY = h * 0.55; 
        this.recipeDetailContainer = this.add.container(detailX, detailY); 
        this.recipeDetailContainer.setVisible(false);
        this.forgeContainer.add(this.recipeDetailContainer); 
    }

    createForgeCatBtn(x, y, label, cat) { 
        const btn = this.add.text(x, y, label, { ...this.fontHeader, color: '#888' }).setInteractive({useHandCursor:true}).setOrigin(0.5); 
        btn.on('pointerdown', () => { 
            this.forgeCategory = cat; 
            this.forgeSubFilter = 'all'; 
            this.expandedRecipeId = null; 
            this.craftSelection = { type: null, recipe: null, rarity: null }; 
            this.recipeDetailContainer.setVisible(false); 
            this.refreshForge(); 
            this.forgeContainer.list.forEach(c => { if(c.text && ["ARMAS","ARMADURAS","JOYAS","TORRES"].includes(c.text)) c.setColor('#888'); });
            btn.setColor('#ffd700');
        }); 
        this.forgeContainer.add(btn); 
    }

    refreshForge() {
        this.forgeSubFilterContainer.removeAll(true);
        let subs = [];
        if (this.forgeCategory === 'weapon') subs = [['TODAS','all'], ['ESPADAS','sword'], ['ARCOS','bow'], ['BASTONES','staff'], ['DAGAS','dagger']];
        else if (this.forgeCategory === 'armor') subs = [['TODAS','all'], ['TELA','cloth'], ['CUERO','leather'], ['PLACAS','plate'], ['ESCUDOS','shield']];
        
        let subX = this.scale.width * 0.2;
        subs.forEach(s => {
            const btn = this.add.text(subX, this.scale.height * 0.28, s[0], { ...this.fontSmall, fontSize: '16px', color: this.forgeSubFilter === s[1] ? '#fff' : '#666' })
                .setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.forgeSubFilter = s[1]; this.refreshForge(); });
            this.forgeSubFilterContainer.add(btn);
            subX += 150;
        });

        this.goldText.setText(`ORO: ${gameState.gold}`);
        const p = gameState.professions;
        this.profText.setText(`Niveles: Armas ${p.weaponsmith.level} | Armaduras ${p.armorsmith.level} | Joyas ${p.jewelry.level}`);
        
        this.recipesContainer.removeAll(true);
        let startX = this.scale.width * 0.15; let startY = this.scale.height * 0.35; let col = 0;
        
        const categoryRecipes = RECIPES.filter(r => {
            // --- NUEVO: FILTRO DE RECETAS BLOQUEADAS ---
            if (r.isLocked) {
                // Solo mostrar si está en unlockedRecipes
                if (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id)) {
                    return false; // Ocultar
                }
            }

            if (this.forgeCategory === 'tower_part') return r.type === 'tower_part';
            if (this.forgeCategory === 'accessory') return r.type === 'accessory';
            if (this.forgeCategory === 'weapon') {
                if (r.type !== 'weapon') return false;
                if (this.forgeSubFilter !== 'all' && r.subType !== this.forgeSubFilter) return false;
                return true;
            }
            if (this.forgeCategory === 'armor') {
                if (r.type !== 'armor' && r.type !== 'offhand') return false;
                if (this.forgeSubFilter === 'shield') return r.subType === 'shield';
                if (this.forgeSubFilter !== 'all' && r.subType !== this.forgeSubFilter) return false;
                return true;
            }
            return false;
        });

        // ... (resto de refreshForge igual que antes: categoryRecipes.forEach...)
        categoryRecipes.forEach(recipe => {
            // Color especial si es desbloqueada
            const isSpecial = recipe.isLocked; 
            const strokeColor = isSpecial ? 0x00ffff : 0xffffff;

            const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(isSpecial ? 2 : 1, strokeColor);
            const txt = this.add.text(startX + (col * 250), startY, recipe.name, { ...this.fontBody, color: isSpecial ? '#00ffff' : '#fff'}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.expandedRecipeId = (this.expandedRecipeId === recipe.id) ? null : recipe.id; this.refreshForge(); });
            this.recipesContainer.add([btn, txt]); startY += 55;
            
            if (this.expandedRecipeId === recipe.id) {
                ['common', 'uncommon', 'rare'].forEach(rarity => { 
                    const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, { ...this.fontBody, fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
                    rBtn.on('pointerdown', () => this.selectNormalRecipe(recipe, rarity)); 
                    this.recipesContainer.add([rBtn, rTxt]); 
                    startY += 40;
                }); 
                startY += 10;
            }
            if (startY > this.scale.height * 0.8) { col++; startY = this.scale.height * 0.35; }
        });
    

        categoryRecipes.forEach(recipe => {
            const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, 0xffffff);
            const txt = this.add.text(startX + (col * 250), startY, recipe.name, { ...this.fontBody, color:'#fff'}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.expandedRecipeId = (this.expandedRecipeId === recipe.id) ? null : recipe.id; this.refreshForge(); });
            this.recipesContainer.add([btn, txt]); startY += 55;
            
            if (this.expandedRecipeId === recipe.id) {
                ['common', 'uncommon', 'rare'].forEach(rarity => { 
                    const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, { ...this.fontBody, fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
                    rBtn.on('pointerdown', () => this.selectNormalRecipe(recipe, rarity)); 
                    this.recipesContainer.add([rBtn, rTxt]); 
                    startY += 40;
                }); 
                startY += 10;
            }
            if (startY > this.scale.height * 0.8) { col++; startY = this.scale.height * 0.35; }
        });
    }

    // --- FUNCIÓN DE DETALLE FORJA (RECONSTRUIDA) ---
    selectNormalRecipe(recipe, rarityKey) {
        this.recipeDetailContainer.removeAll(true); // Limpiar panel
        this.recipeDetailContainer.setVisible(true); 

        this.craftSelection = { type: 'item', recipe: recipe, rarity: rarityKey };
        const rarity = RARITY[rarityKey]; 
        const cost = Math.floor(recipe.cost * rarity.mult); 
        const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');
        
        const matName = (REFINED_MATERIALS[recipe.mat] || {name: recipe.mat}).name;
        
        let infoText = `Rareza: ${rarity.name}\nCosto: $${cost}\nMaterial: 3 ${matName}\n\n`; 
        infoText += "-- BASE --\n"; 
        for (let key in recipe.baseStats) { infoText += `${key}: ${recipe.baseStats[key]}\n`; } 
        
        const setInfo = this.getSetInfoText(recipe.id);
        infoText += setInfo ? `\n${setInfo}` : "";
        
        // Construcción Limpia del Panel
        let currentY = 0;
        const title = this.add.text(0, currentY, recipe.name, { ...this.fontHeader, fontSize: '18px', color: hexColor, align: 'center', wordWrap: {width: 280} }).setOrigin(0.5, 0);
        currentY += title.height + 20;

        const stats = this.add.text(0, currentY, infoText, { ...this.fontBody, fontSize: '13px', align: 'left', wordWrap: {width: 280} }).setOrigin(0.5, 0);
        currentY += stats.height + 30;

        const craftBtn = this.createActionButton(0, currentY, "FORJAR", () => this.handleCraftButton());
        currentY += 50;

        // Fondo ajustado al contenido total
        const bgHeight = currentY + 20;
        const bg = this.add.rectangle(0, bgHeight/2 - 20, 320, bgHeight, 0x000000, 0.95).setStrokeStyle(2, 0xffd700);
        
        this.recipeDetailContainer.add([bg, title, stats, craftBtn]);
        this.forgeMsg.setText("");
    }

    handleCraftButton() { const sel = this.craftSelection; if (!sel.type) return; this.executeCraftItem(sel.recipe, sel.rarity); }
    executeCraftItem(recipe, rarityKey) {
        const rarity = RARITY[rarityKey]; const cost = Math.floor(recipe.cost * rarity.mult);
        if (gameState.gold < cost) { this.forgeMsg.setText("¡Falta Oro!"); this.forgeMsg.setColor('#ff0000'); return; }
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        if (result.success) { 
            gameState.gold -= cost; this.safeAddItemToInventory(result.item); this.goldText.setText(`ORO: ${gameState.gold}`); SaveSystem.save(); 
            this.showCentralAlert(`¡CREADO: ${result.item.name}!`, '#' + RARITY[rarityKey].color.toString(16).padStart(6,'0')); 
        } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); } 
    }
    
    // --- VISTA TALENTOS (SCROLLABLE) ---
    createTalentsView(w, h, cx, cy) {
        this.talentPointsText = this.add.text(cx, h * 0.18, "PUNTOS: 0", { ...this.fontTitle, fontSize: '24px' }).setOrigin(0.5);
        this.talentsContainer.add(this.talentPointsText);
        
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(w * 0.1, h * 0.25, w * 0.8, h * 0.6); 
        const mask = maskShape.createGeometryMask();
        
        this.talentTreeContainer = this.add.container(0, h * 0.3);
        this.talentTreeContainer.setMask(mask);
        this.talentsContainer.add(this.talentTreeContainer);
        
        const upBtn = this.add.text(w - 50, h * 0.3, "▲", { fontSize: '40px', color: '#00ff00' }).setInteractive();
        const downBtn = this.add.text(w - 50, h * 0.8, "▼", { fontSize: '40px', color: '#00ff00' }).setInteractive();
        
        upBtn.on('pointerdown', () => { this.talentTreeContainer.y = Math.min(h * 0.3, this.talentTreeContainer.y + 100); });
        downBtn.on('pointerdown', () => { this.talentTreeContainer.y -= 100; }); 
        
        this.talentsContainer.add([upBtn, downBtn]);
    }

    refreshTalents() { 
        const hero = getCurrentHero(); 
        this.talentPointsText.setText(`PUNTOS DE TALENTO: ${hero.talentPoints}`); 
        this.talentTreeContainer.removeAll(true); 
        
        const cls = gameState.selectedClass; 
        const allTalents = TALENTS[cls] || []; 
        const w = this.scale.width; 
        let currentY = 0; 
        
        const tiers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; 
        tiers.forEach(tierLevel => { 
            const tierTalents = allTalents.filter(t => t.tier === tierLevel); 
            if (tierTalents.length === 0) return; 
            
            const isUnlocked = hero.level >= tierLevel; 
            const pickedTalent = tierTalents.find(t => hero.talents.includes(t.id)); 
            
            const rowLabel = this.add.text(w * 0.15, currentY, `NIVEL ${tierLevel}`, { ...this.fontHeader, fontSize:'18px', color: isUnlocked ? '#fff' : '#555' }).setOrigin(0, 0.5); 
            this.talentTreeContainer.add(rowLabel); 
            
            tierTalents.forEach((talent, idx) => { 
                const isSelected = (pickedTalent && pickedTalent.id === talent.id); 
                const isBlocked = (pickedTalent && pickedTalent.id !== talent.id); 
                const btnX = w/2 + (idx === 0 ? -150 : 150); 
                
                let color = 0x333333; 
                if (isSelected) color = 0x006400; 
                else if (isBlocked || !isUnlocked) color = 0x111111; 
                
                const btn = this.add.rectangle(btnX, currentY, 280, 60, color).setStrokeStyle(1, isSelected ? 0x00ff00 : 0xaaaaaa); 
                const nameTxt = this.add.text(btnX, currentY - 15, talent.name, { ...this.fontBtn, fontSize:'14px', color: isBlocked ? '#555' : '#fff' }).setOrigin(0.5); 
                const descTxt = this.add.text(btnX, currentY + 15, talent.desc, { ...this.fontSmall, fontSize:'10px', wordWrap: { width: 260 } }).setOrigin(0.5); 
                
                if (isUnlocked && !pickedTalent && hero.talentPoints > 0) { 
                    btn.setInteractive({ useHandCursor: true }); 
                    btn.on('pointerdown', () => this.learnTalent(talent)); 
                    btn.setStrokeStyle(2, 0xffd700); 
                } 
                this.talentTreeContainer.add([btn, nameTxt, descTxt]); 
            }); 
            currentY += 90; 
        }); 
    }
    learnTalent(talent) { if (RPGSystem.spendTalentPoint(talent.id, 1)) { updatePlayerStats(); SaveSystem.save(); this.refreshTalents(); this.showCentralAlert(`¡TALENTO APRENDIDO!`, '#00ff00'); } }

    // --- VISTA REFINACIÓN ---
    createRefiningView(w, h, cx, cy) {
        this.refiningTitle = this.add.text(cx, h * 0.15, "REFINACIÓN", this.fontTitle).setOrigin(0.5);
        this.refiningContainer.add(this.refiningTitle);
        this.refiningProfText = this.add.text(cx, h * 0.2, "", { ...this.fontBody, color: '#00ff00' }).setOrigin(0.5);
        this.refiningContainer.add(this.refiningProfText);
        
        const cats = ['wood', 'ore', 'cloth', 'leather'];
        const labels = ['MADERA', 'MINERAL', 'TELA', 'CUERO'];
        let rx = cx - 300;
        
        cats.forEach((cat, i) => {
            const btn = this.add.text(rx + (i * 200), h * 0.28, labels[i], { ...this.fontHeader, color: '#888' })
                .setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.refiningFilter = cat;
                this.refreshRefining();
                this.refiningContainer.list.forEach(c => { if(c.text && labels.includes(c.text)) c.setColor('#888'); });
                btn.setColor('#fff');
            });
            this.refiningContainer.add(btn);
        });

        this.refineList = this.add.container(0, 0);
        this.refiningContainer.add(this.refineList);
    }

    refreshRefining() {
        const p = gameState.professions.refining || { level: 1, xp: 0, maxXp: 100 };
        this.refiningProfText.setText(`Nivel: ${p.level} (${p.xp}/${p.maxXp})`);
        
        this.refineList.removeAll(true);
        let y = this.scale.height * 0.35;
        
        const filteredRecipes = REFINING_RECIPES.filter(r => {
            if (this.refiningFilter === 'wood') return r.input.wood || r.input.cedar || r.input.ebony;
            if (this.refiningFilter === 'ore') return r.input.copper || r.input.iron || r.input.mithril;
            if (this.refiningFilter === 'cloth') return r.input.scraps || r.input.cotton || r.input.silk;
            if (this.refiningFilter === 'leather') return r.input.hide || r.input.leather || r.input.scale;
            return true;
        });

        filteredRecipes.forEach(recipe => {
            let canCraft = true;
            let reqText = "";
            for(let mat in recipe.input) {
                const avail = gameState.materials[mat]?.common || 0;
                reqText += `${recipe.input[mat]} ${(RAW_MATERIALS[mat]||{name:mat}).name} `;
                if (avail < recipe.input[mat]) canCraft = false;
            }
            const product = REFINED_MATERIALS[recipe.output]?.name || recipe.output;
            
            const btn = this.add.rectangle(this.scale.width/2, y, 700, 50, canCraft ? 0x222222 : 0x111111).setStrokeStyle(1, canCraft ? 0x00ff00 : 0x550000);
            if (canCraft) { btn.setInteractive({useHandCursor:true}); btn.on('pointerdown', () => this.executeRefine(recipe.id)); }
            
            const txt = this.add.text(this.scale.width/2, y, `${recipe.name}: ${reqText} -> ${product}`, { ...this.fontBody, color: canCraft ? '#fff' : '#555' }).setOrigin(0.5);
            this.refineList.add([btn, txt]);
            y += 60;
        });
    }
    executeRefine(id) { const res = RPGSystem.refineMaterial(id); if(res.success) { SaveSystem.save(); this.refreshRefining(); this.showCentralAlert("REFINADO OK", '#00ff00'); } }

    // --- VISTAS HEROE Y TORRES (SIN CAMBIOS) ---
    createHeroView(w, h, cx, cy) { this.heroLevelText = this.add.text(cx, h * 0.17, '', { ...this.fontHeader, fontSize: '28px', color: '#00ffff' }).setOrigin(0.5); this.heroContainer.add(this.heroLevelText); const leftX = w * 0.3; const contentY = h * 0.3; const panelWidth = 450; const panelHeight = 550; const statsBg = this.add.rectangle(leftX, cy + 20, panelWidth, panelHeight, 0x000000, 0.8).setStrokeStyle(2, 0x555555); this.heroContainer.add(statsBg); const textStartX = leftX - (panelWidth / 2) + 20; const textStartY = (cy + 20) - (panelHeight / 2) + 20; this.heroStatsText = this.add.text(textStartX, textStartY, '', { ...this.fontBody, fontSize: '15px', lineHeight: 22 }); this.heroContainer.add(this.heroStatsText); this.equippedTextContainer = this.add.container(0, 0); this.heroContainer.add(this.equippedTextContainer); const rightX = w * 0.75; let upgradeY = h * 0.3; this.pointsText = this.add.text(rightX, upgradeY, "Puntos: 0", { ...this.fontHeader, color: '#ffd700' }).setOrigin(0.5); this.heroContainer.add(this.pointsText); upgradeY += 60; const statsToUpgrade = [ { label: "Daño (+1)", key: 'damage' }, { label: "Vida (+10)", key: 'hp' }, { label: "Vel. Atq (+10ms)", key: 'speed' }, { label: "Defensa (+1)", key: 'defense' } ]; statsToUpgrade.forEach((s, i) => { this.createStatButton(rightX, upgradeY + (i * 60), s.label, s.key); }); }
    createStatButton(x, y, label, statKey) { const btn = this.add.rectangle(x, y, 220, 45, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00); const txt = this.add.text(x, y, label, this.fontBtn).setOrigin(0.5); btn.on('pointerdown', () => { if (RPGSystem.spendStatPoint(statKey)) { this.refreshHero(); SaveSystem.save(); } }); this.heroContainer.add([btn, txt]); }
    refreshHero() { updatePlayerStats(); const s = gameState.playerStats; const eq = gameState.equipment; const hero = getCurrentHero(); const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase(); let setsText = ""; if (gameState.activeSets && gameState.activeSets.length > 0) { setsText = "\n\n-- SETS ACTIVOS --\n"; gameState.activeSets.forEach(set => { setsText += `[${set.name}]\n`; set.bonuses.forEach(b => setsText += `  ${b}\n`); }); } const details = `Crítico: ${s.critChance}% (x${s.critDamage}%) \nRobo Vida: ${s.lifesteal}%  |  Regen HP: ${s.regenHp}/5s \nDoble Ataque: ${s.doubleAttack}%  |  Espinas: ${s.thorns} \nCooldown: -${s.cdr}%${setsText}`; this.heroStatsText.setText(`CLASE: [ ${clsName} ]\n\n-- ATRIBUTOS BASE --\n❤️ Vida: ${Math.floor(s.hp)}/${s.maxHp}\n⚔️ Daño: ${s.damage}\n🛡️ Defensa: ${s.defense}\n⚡ Delay Atq: ${s.attackSpeed}ms\n📏 Rango: ${s.range}\n\n-- EXTRAS --\n${details}`); this.heroLevelText.setText(`NIVEL ${hero.level} (XP: ${hero.xp}/${hero.maxXp})`); this.pointsText.setText(`PUNTOS DE STAT: ${hero.statPoints}`); this.equippedTextContainer.removeAll(true); const startX = this.heroStatsText.x; let startY = this.heroStatsText.y + 300; this.equippedTextContainer.add(this.add.text(startX, startY, "-- EQUIPAMIENTO (Clic gestiona) --", { ...this.fontBody, color: '#aaa', fontStyle: 'italic'})); startY += 30; const slots = [ { key: 'mainHand', label: '🗡️ Arma', cat: 'weapon' }, { key: 'offHand', label: '🛡️ Off', cat: 'armor' }, { key: 'armor', label: '👕 Ropa', cat: 'armor' }, { key: 'accessory', label: '💍 Joya', cat: 'accessory' } ]; slots.forEach(slot => { const item = eq[slot.key]; const slotBg = this.add.rectangle(startX + 180, startY + 10, 360, 30, 0x222222).setOrigin(0.5).setInteractive({useHandCursor: true}); slotBg.setStrokeStyle(1, item ? RARITY[item.rarity].color : 0x555555); const name = item ? `${item.name} (+${item.enchant})` : '- VACÍO (Ir a Mochila) -'; const color = item ? '#' + item.color.toString(16).padStart(6, '0') : '#888'; const txt = this.add.text(startX, startY, `${slot.label}:`, this.fontBody); const valTxt = this.add.text(startX + 80, startY, name, { ...this.fontBody, color: color, fontStyle: 'bold' }); slotBg.on('pointerdown', () => { if (!item) { this.inventoryCategory = slot.cat; this.switchTab('inventory'); } else { this.showUnequipModal(item, slot.key); } }); this.equippedTextContainer.add([slotBg, txt, valTxt]); startY += 35; }); }
    showUnequipModal(item, slotKey) { const modal = this.add.container(this.scale.width/2, this.scale.height/2).setDepth(2000); const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color); const title = this.add.text(0, -100, item.name, { ...this.fontHeader, fontSize: '22px', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5); const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, ''); const info = this.add.text(0, -20, statsStr, this.fontBody).setOrigin(0.5); const btnUnequip = this.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true}); const txtUnequip = this.add.text(0, 80, "DESEQUIPAR", this.fontBtn).setOrigin(0.5); const btnClose = this.add.text(0, 130, "Cancelar", { ...this.fontBody, color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5); btnUnequip.on('pointerdown', () => { if (gameState.equipment[slotKey] && gameState.equipment[slotKey].id === item.id) { gameState.equipment[slotKey] = null; this.safeAddItemToInventory(item); SaveSystem.save(); updatePlayerStats(); this.refreshHero(); modal.destroy(); } else { this.showCentralAlert("Error: Item no equipado", "#ff0000"); modal.destroy(); } }); btnClose.on('pointerdown', () => modal.destroy()); modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]); this.heroContainer.add(modal); }
    createTowersView(w, h, cx, cy) { const types = ['archer', 'cannon', 'mage']; const names = ['ARQUERO', 'CAÑÓN', 'MAGO']; const startX = w * 0.2; const gap = w * 0.3; types.forEach((type, i) => { const x = startX + (i * gap); const y = h * 0.25; const title = this.add.text(x, y, names[i], this.fontHeader).setOrigin(0.5); this.towersContainer.add(title); const statsText = this.add.text(x, y + 100, "Stats...", { ...this.fontBody, color: '#aaa', align: 'center' }).setOrigin(0.5); statsText.name = `stats_${type}`; this.towersContainer.add(statsText); for (let s = 1; s <= 2; s++) { const slotY = y + 200 + (s * 80); const slotBg = this.add.rectangle(x, slotY, 240, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true }); const slotTxt = this.add.text(x, slotY, `Slot ${s}: Vacío`, { ...this.fontBody, fontSize: '12px', wordWrap: {width: 220}, align: 'center' }).setOrigin(0.5); slotTxt.name = `txt_${type}_slot${s}`; slotBg.on('pointerdown', () => { const item = gameState.towerEquipment[type][`slot${s}`]; if (item) { this.showTowerUnequipModal(item, type, `slot${s}`); } else { this.inventoryCategory = 'tower_part'; this.switchTab('inventory'); } }); this.towersContainer.add([slotBg, slotTxt]); } }); }
    refreshTowersView() { const types = ['archer', 'cannon', 'mage']; types.forEach(type => { const eq = gameState.towerEquipment[type]; let bonuses = { dmg: 0, range: 0, speed: 0, dbl: 0 }; [eq.slot1, eq.slot2].forEach(it => { if (it && it.stats) { if (it.stats.damage) bonuses.dmg += it.stats.damage; if (it.stats.range) bonuses.range += it.stats.range; if (it.stats.attackSpeed) bonuses.speed += it.stats.attackSpeed; if (it.stats.doubleAttack) bonuses.dbl += it.stats.doubleAttack; } }); const statObj = this.towersContainer.list.find(c => c.name === `stats_${type}`); if (statObj) { statObj.setText(`Daño Extra: +${bonuses.dmg}\nRango: +${bonuses.range}\nVelocidad: +${bonuses.speed}ms\nDoble Atq: ${bonuses.dbl}%`); } for (let s = 1; s <= 2; s++) { const item = eq[`slot${s}`]; const txtObj = this.towersContainer.list.find(c => c.name === `txt_${type}_slot${s}`); if (txtObj) { if (item) { const col = '#' + (item.color || 0xffffff).toString(16).padStart(6, '0'); txtObj.setText(`${item.name} (+${item.enchant})`); txtObj.setColor(col); } else { txtObj.setText("Slot Vacío (Clic para equipar)"); txtObj.setColor('#aaaaaa'); } } } }); }
    showTowerUnequipModal(item, towerType, slotKey) { const modal = this.add.container(this.scale.width/2, this.scale.height/2).setDepth(2000); const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color); const title = this.add.text(0, -100, item.name, { ...this.fontHeader, fontSize: '22px', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5); const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, ''); const info = this.add.text(0, -20, statsStr, this.fontBody).setOrigin(0.5); const btnUnequip = this.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true}); const txtUnequip = this.add.text(0, 80, "DESEQUIPAR", this.fontBtn).setOrigin(0.5); const btnClose = this.add.text(0, 130, "Cancelar", { ...this.fontBody, color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5); btnUnequip.on('pointerdown', () => { if (gameState.towerEquipment[towerType][slotKey] && gameState.towerEquipment[towerType][slotKey].id === item.id) { gameState.towerEquipment[towerType][slotKey] = null; this.safeAddItemToInventory(item); SaveSystem.save(); this.refreshTowersView(); modal.destroy(); this.showCentralAlert("Mejora desequipada", "#ffff00"); } else { this.showCentralAlert("Error: Ya no está equipada", "#ff0000"); modal.destroy(); } }); btnClose.on('pointerdown', () => modal.destroy()); modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]); this.towersContainer.add(modal); }
    createQuestModal(w, h, cx, cy) {
        this.questContainer = this.add.container(0, 0).setVisible(false).setDepth(2000);
        
        // Fondo oscuro que cubre todo
        const blocker = this.add.rectangle(cx, cy, w, h, 0x000000, 0.8).setInteractive();
        
        // Panel
        const bg = this.add.rectangle(cx, cy, 500, 600, 0x222222).setStrokeStyle(4, 0xffd700);
        const title = this.add.text(cx, cy - 250, "TABLÓN DE MISIONES", { ...this.fontTitle, fontSize: '28px' }).setOrigin(0.5);
        
        const closeBtn = this.add.text(cx + 220, cy - 280, "X", { fontSize: '32px', color: '#ff0000', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.toggleQuestModal());
        
        this.questListContainer = this.add.container(cx, cy - 150);
        
        this.questContainer.add([blocker, bg, title, closeBtn, this.questListContainer]);
        this.add.existing(this.questContainer); // Asegurar que se añade a la escena
    }

    toggleQuestModal() {
        const isVisible = !this.questContainer.visible;
        this.questContainer.setVisible(isVisible);
        if (isVisible) this.refreshQuestList();
    }

    refreshQuestList() {
        this.questListContainer.removeAll(true);
        let y = 0;
        
        if (gameState.quests.active.length === 0) {
            this.questListContainer.add(this.add.text(0, 100, "¡Misiones completadas!\nVuelve mañana.", { ...this.fontBody, align: 'center' }).setOrigin(0.5));
            return;
        }

        gameState.quests.active.forEach(quest => {
            const qBg = this.add.rectangle(0, y, 450, 120, 0x333333).setStrokeStyle(1, 0xaaaaaa); // Un poco más alto para el texto
            
            // Texto descriptivo
            const qTitle = this.add.text(-210, y - 40, quest.desc, { ...this.fontHeader, fontSize: '18px' }).setOrigin(0, 0.5);
            const qProgress = this.add.text(-210, y - 10, `Progreso: ${quest.progress}/${quest.count}`, { ...this.fontBody, color: '#00ffff' }).setOrigin(0, 0.5);
            
            // --- NUEVO: TEXTO DE RECOMPENSA ---
            let rewardText = "Recompensa: ";
            if (quest.reward.gold) rewardText += `$${quest.reward.gold} `;
            if (quest.reward.xp) rewardText += `${quest.reward.xp} XP `;
            if (quest.reward.material) {
                const matName = (RAW_MATERIALS[quest.reward.material] || {name: quest.reward.material}).name;
                rewardText += `3x ${matName} `;
            }
            if (quest.reward.recipe) {
                // Buscamos el nombre de la receta
                const r = RECIPES.find(rec => rec.id === quest.reward.recipe);
                const rName = r ? r.name : "Receta Secreta";
                rewardText += `\n📜 PLANO: ${rName}`;
            }

            const qReward = this.add.text(-210, y + 25, rewardText, { ...this.fontSmall, color: '#ffd700', fontSize: '12px' }).setOrigin(0, 0.5);
            
            let statusBtn;
            if (quest.completed) {
                statusBtn = this.add.rectangle(150, y, 120, 40, 0x006400).setInteractive({ useHandCursor: true });
                const btnTxt = this.add.text(150, y, "RECLAMAR", this.fontBtn).setOrigin(0.5);
                statusBtn.on('pointerdown', () => {
                    const res = RPGSystem.claimQuestReward(quest.id);
                    if (res.success) {
                        SaveSystem.save();
                        this.refreshQuestList();
                        this.goldText.setText(`ORO: ${gameState.gold}`);
                        if(res.reward.recipe) this.refreshForge(); // Actualizar forja si desbloqueamos receta
                        this.showCentralAlert("¡Recompensa Reclamada!", "#ffd700");
                    }
                });
                this.questListContainer.add([qBg, qTitle, qProgress, qReward, statusBtn, btnTxt]);
            } else {
                statusBtn = this.add.text(150, y, "En Curso", { ...this.fontBody, color: '#aaaaaa', fontStyle: 'italic' }).setOrigin(0.5);
                this.questListContainer.add([qBg, qTitle, qProgress, qReward, statusBtn]);
            }
            
            y += 140; // Espacio vertical
        });
    }
}