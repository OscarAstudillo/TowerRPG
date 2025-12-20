// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, RARITY } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import { RECIPES } from '../config/Recipes.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.currentTab = 'hero'; 
        this.inventoryCategory = 'all'; 
        this.forgeCategory = 'weapon';  
        this.selectedItem = null;
        
        this.itemToFuse1 = null; 
        this.itemToFuse2 = null; 

        this.expandedRecipeId = null; 
        this.expandedTowerType = null; 
        
        this.craftSelection = {
            type: null, 
            recipe: null,
            rarity: null,
            towerType: null
        };

        this.hasLoaded = false;
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        if (!this.hasLoaded) {
            SaveSystem.load();
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
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(w - 50, h * 0.05, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        const tabY = h * 0.12; 
        const tabW = 200;
        this.createTabButton(cx - tabW * 1.5, tabY, 'HÉROE', 'hero');
        this.createTabButton(cx - tabW * 0.5, tabY, 'MOCHILA', 'inventory');
        this.createTabButton(cx + tabW * 0.5, tabY, 'FORJA', 'forge');
        this.createTabButton(cx + tabW * 1.5, tabY, 'TORRES', 'towers');

        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);
        this.towersContainer = this.add.container(0, 0);

        this.createHeroView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy);
        this.createForgeView(w, h, cx, cy);
        this.createTowersView(w, h, cx, cy);

        this.switchTab('hero');

        const botY = h - 60;
        const playBtn = this.add.rectangle(cx, botY, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(cx, botY, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        const resetBtn = this.add.text(50, h - 30, 'Borrar Datos', { fontSize: '14px', color: '#555' }).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo?")) { SaveSystem.reset(); } });

        const changeHeroBtn = this.add.text(200, h - 30, 'Cambiar Héroe', { fontSize: '14px', color: '#00ffff' }).setInteractive({ useHandCursor: true });
        changeHeroBtn.on('pointerdown', () => {
            gameState.selectedClass = null; 
            this.scene.start('HeroSelectScene');
        });
    }

    createTabButton(x, y, text, tabKey) {
        const btn = this.add.rectangle(x, y, 180, 40, 0x333333).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, text, { fontSize: '18px' }).setOrigin(0.5);
        btn.on('pointerdown', () => this.switchTab(tabKey));
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;
        this.heroContainer.setVisible(tabKey === 'hero');
        this.invContainer.setVisible(tabKey === 'inventory');
        this.forgeContainer.setVisible(tabKey === 'forge');
        this.towersContainer.setVisible(tabKey === 'towers');
        
        if (tabKey === 'inventory') this.refreshInventory();
        if (tabKey === 'hero') this.refreshHero();
        if (tabKey === 'forge') this.refreshForge();
        if (tabKey === 'towers') this.refreshTowersView();
    }

    // --- VISTA HÉROE ---
    createHeroView(w, h, cx, cy) {
        this.heroLevelText = this.add.text(cx, h * 0.2, '', { fontSize: '24px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);
        const leftX = w * 0.3; const contentY = h * 0.3;
        const statsBg = this.add.rectangle(leftX, cy + 20, w * 0.4, h * 0.6, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
        this.heroContainer.add(statsBg);
        this.heroStatsText = this.add.text(leftX - (w * 0.18), contentY, '', { fontSize: '16px', lineHeight: 26, color: '#ffffff' });
        this.heroContainer.add(this.heroStatsText);
        const rightX = w * 0.7; let upgradeY = h * 0.3;
        this.pointsText = this.add.text(rightX, upgradeY, "Puntos: 0", { fontSize: '20px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.heroContainer.add(this.pointsText);
        upgradeY += 50;
        this.createStatButton(rightX, upgradeY, "Daño (+1)", 'damage');
        this.createStatButton(rightX, upgradeY + 50, "Vida (+10)", 'hp');
        this.createStatButton(rightX, upgradeY + 100, "Vel. Atq (+10ms)", 'speed');
        this.createStatButton(rightX, upgradeY + 150, "Defensa (+1)", 'defense');
    }
    createStatButton(x, y, label, statKey) {
        const btn = this.add.rectangle(x, y, 200, 40, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: '16px' }).setOrigin(0.5);
        btn.on('pointerdown', () => { if (RPGSystem.spendStatPoint(statKey)) { this.refreshHero(); SaveSystem.save(); } });
        this.heroContainer.add([btn, txt]);
    }
    refreshHero() {
        updatePlayerStats(); const s = gameState.playerStats; const eq = gameState.equipment; const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase();
        this.heroStatsText.setText(`CLASE ACTUAL: [ ${clsName} ]\n\n-- ATRIBUTOS --\n❤️ Vida: ${Math.floor(s.hp)}/${s.maxHp}  ⚔️ Daño: ${s.damage}\n🛡️ Defensa: ${s.defense}  ⚡ Vel: ${s.attackSpeed}\n\n-- EQUIPAMIENTO --\n🗡️ Arma: ${eq.mainHand ? eq.mainHand.name : '-'}\n🛡️ Off: ${eq.offHand ? eq.offHand.name : '-'}\n👕 Armadura: ${eq.armor ? eq.armor.name : '-'}\n💍 Joya: ${eq.accessory ? eq.accessory.name : '-'}`);
        this.heroLevelText.setText(`NIVEL ${gameState.heroLevel} (XP: ${gameState.heroXP}/${gameState.heroMaxXP})`);
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${gameState.statPoints}`);
    }

    // --- VISTA TORRES ---
    createTowersView(w, h, cx, cy) {
        const types = ['archer', 'cannon', 'mage']; const names = ['ARQUERO', 'CAÑÓN', 'MAGO']; const startX = w * 0.2; const gap = w * 0.3;
        types.forEach((type, i) => {
            const x = startX + (i * gap); const y = h * 0.25;
            const title = this.add.text(x, y, names[i], { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5); this.towersContainer.add(title);
            const statsText = this.add.text(x, y + 100, "Stats...", { fontSize: '14px', align: 'center', color: '#aaa' }).setOrigin(0.5); statsText.name = `stats_${type}`; this.towersContainer.add(statsText);
            for (let s = 1; s <= 2; s++) {
                const slotY = y + 200 + (s * 80);
                const slotBg = this.add.rectangle(x, slotY, 220, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true });
                const slotTxt = this.add.text(x, slotY, `Slot ${s}: Vacío`, { fontSize: '12px', wordWrap: {width: 200}, align: 'center' }).setOrigin(0.5);
                slotTxt.name = `txt_${type}_slot${s}`; 
                slotBg.on('pointerdown', () => { const item = gameState.towerEquipment[type][`slot${s}`]; if (item) { gameState.towerEquipment[type][`slot${s}`] = null; gameState.inventory.push(item); this.refreshTowersView(); SaveSystem.save(); } });
                this.towersContainer.add([slotBg, slotTxt]);
            }
        });
    }
    refreshTowersView() {
        const types = ['archer', 'cannon', 'mage'];
        types.forEach(type => {
            const eq = gameState.towerEquipment[type]; let bonuses = { dmg: 0, range: 0, speed: 0, dbl: 0 };
            [eq.slot1, eq.slot2].forEach(it => { if (it && it.stats) { if (it.stats.damage) bonuses.dmg += it.stats.damage; if (it.stats.range) bonuses.range += it.stats.range; if (it.stats.attackSpeed) bonuses.speed += it.stats.attackSpeed; if (it.stats.doubleAttack) bonuses.dbl += it.stats.doubleAttack; } });
            const statObj = this.towersContainer.list.find(c => c.name === `stats_${type}`);
            if (statObj) { statObj.setText(`Daño Extra: +${bonuses.dmg}\nRango: +${bonuses.range}\nVelocidad: +${bonuses.speed}ms\nDoble Atq: ${bonuses.dbl}%`); }
            for (let s = 1; s <= 2; s++) {
                const item = eq[`slot${s}`]; const txtObj = this.towersContainer.list.find(c => c.name === `txt_${type}_slot${s}`);
                if (txtObj) { if (item) { const col = '#' + (item.color || 0xffffff).toString(16).padStart(6, '0'); txtObj.setText(`${item.name} (+${item.enchant})`); txtObj.setColor(col); } else { txtObj.setText("Slot Vacío"); txtObj.setColor('#ffffff'); } }
            }
        });
    }

    // --- MOCHILA Y FUSIÓN MEJORADA (UI VISUAL ACTUALIZADA) ---
    createInventoryView(w, h, cx, cy) {
        const catY = h * 0.18;
        this.createInvCategoryBtn(cx - 300, catY, "HERO", 'all'); 
        this.createInvCategoryBtn(cx, catY, "TORRES", 'tower_part'); 
        this.createInvCategoryBtn(cx + 300, catY, "MATERIALES", 'mats');

        this.invMatsText = this.add.text(50, catY + 40, '', { fontSize: '14px', lineHeight: 20 });
        this.invContainer.add(this.invMatsText);

        const gridX = w * 0.28;
        const gridY = h * 0.3;
        this.invItemsContainer = this.add.container(gridX, gridY);
        this.invContainer.add(this.invItemsContainer);
        
        const detailX = w * 0.78;
        this.itemDetailContainer = this.add.container(detailX, gridY);
        this.itemDetailContainer.setVisible(false);
        this.invContainer.add(this.itemDetailContainer);

        const bg = this.add.rectangle(0, 150, 280, 400, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.detailTitle = this.add.text(0, -30, "", { fontSize: '18px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.detailStats = this.add.text(0, 50, "", { fontSize: '14px', align: 'center' }).setOrigin(0.5);
        
        this.equipBtn = this.createActionButton(0, 180, "EQUIPAR", () => this.actionEquip(), 0x006400);
        this.fuseBtn = this.createActionButton(0, 230, "FUSIONAR...", () => this.initiateFusion(), 0x00008b);
        this.sellBtn = this.createActionButton(0, 280, "VENDER", () => this.actionSell(), 0x8b0000);

        this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn, this.sellBtn]);

        // --- UI SELECCIÓN DE FUSIÓN (Lista de candidatos) ---
        this.fusionListModal = this.add.container(cx, cy).setVisible(false).setDepth(2000);
        const fBg = this.add.rectangle(0, 0, 600, 500, 0x000000).setStrokeStyle(2, 0x00ffff).setInteractive();
        const fTitle = this.add.text(0, -200, "SELECCIONA ITEM PARA COMBINAR", { fontSize: '24px' }).setOrigin(0.5);
        this.fusionList = this.add.container(0, -150);
        const fCancel = this.add.text(0, 220, "CANCELAR", { fontSize: '20px', color: '#ff0000' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        fCancel.on('pointerdown', () => this.fusionListModal.setVisible(false));
        this.fusionListModal.add([fBg, fTitle, this.fusionList, fCancel]);

        // --- UI CONFIRMACIÓN DE FUSIÓN (Comparación 50/50) ---
        this.fusionConfirmModal = this.add.container(cx, cy).setVisible(false).setDepth(2100);
        const fcBg = this.add.rectangle(0, 0, 800, 600, 0x111111).setStrokeStyle(3, 0xffd700).setInteractive();
        const fcTitle = this.add.text(0, -260, "CONFIRMAR FUSIÓN", { fontSize: '32px', color: '#ffd700' }).setOrigin(0.5);
        
        // TEXTO EXPLICATIVO CORREGIDO
        const fcInfo = this.add.text(0, -220, "El item resultante heredará los stats de UNO de estos dos items (50% Probabilidad).\nAmbos items originales serán consumidos.", { fontSize: '16px', color: '#cccccc', align: 'center' }).setOrigin(0.5);

        // Panel Izquierdo (Candidato A)
        const leftPanel = this.add.container(-200, 0);
        const lBg = this.add.rectangle(0, 0, 350, 400, 0x000000).setStrokeStyle(1, 0x00ffff); // Cyan
        const lLabel = this.add.text(0, -180, "CANDIDATO A (50% Chance)", { fontSize: '16px', color: '#00ffff' }).setOrigin(0.5);
        this.fusionItem1Info = this.add.text(0, 0, "", { fontSize: '14px', align: 'center' }).setOrigin(0.5);
        leftPanel.add([lBg, lLabel, this.fusionItem1Info]);

        // Panel Derecho (Candidato B)
        const rightPanel = this.add.container(200, 0);
        const rBg = this.add.rectangle(0, 0, 350, 400, 0x000000).setStrokeStyle(1, 0xff00ff); // Magenta
        const rLabel = this.add.text(0, -180, "CANDIDATO B (50% Chance)", { fontSize: '16px', color: '#ff00ff' }).setOrigin(0.5);
        this.fusionItem2Info = this.add.text(0, 0, "", { fontSize: '14px', align: 'center' }).setOrigin(0.5);
        rightPanel.add([rBg, rLabel, this.fusionItem2Info]);

        // Botones Confirmación
        const confirmBtn = this.add.rectangle(0, 250, 300, 60, 0x006400).setInteractive({useHandCursor:true});
        const confirmTxt = this.add.text(0, 250, "¡PROBAR SUERTE!", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
        confirmBtn.on('pointerdown', () => this.executeFusion());

        const cancelConfirm = this.add.text(0, 320, "Volver", { fontSize: '18px', color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        cancelConfirm.on('pointerdown', () => {
            this.fusionConfirmModal.setVisible(false);
            this.fusionListModal.setVisible(true); // Volver a la lista
        });

        this.fusionConfirmModal.add([fcBg, fcTitle, fcInfo, leftPanel, rightPanel, confirmBtn, confirmTxt, cancelConfirm]);
    }

    initiateFusion() {
        if (!this.selectedItem) return;
        this.itemToFuse1 = this.selectedItem;
        this.fusionListModal.setVisible(true);
        this.populateFusionList();
    }

    populateFusionList() {
        this.fusionList.removeAll(true);
        const candidates = gameState.inventory.filter(i => 
            i !== this.itemToFuse1 && 
            i.type === this.itemToFuse1.type && 
            i.rarity === this.itemToFuse1.rarity &&
            i.enchant === this.itemToFuse1.enchant
        );

        if (candidates.length === 0) {
            this.fusionList.add(this.add.text(0, 0, "No hay items compatibles\n(Mismo Tipo, Rareza y Nivel)", { align: 'center' }).setOrigin(0.5));
            return;
        }

        let y = 0;
        candidates.forEach(item => {
            const btn = this.add.rectangle(0, y, 400, 40, 0x333333).setInteractive({useHandCursor:true});
            const statsStr = JSON.stringify(item.stats).replace(/{|}|"/g, '').substring(0, 30) + "...";
            const txt = this.add.text(0, y, `${item.name} | ${statsStr}`, { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => this.selectSecondItemForFusion(item));
            
            this.fusionList.add([btn, txt]);
            y += 50;
        });
    }

    selectSecondItemForFusion(item2) {
        this.itemToFuse2 = item2;
        this.fusionListModal.setVisible(false);
        this.fusionConfirmModal.setVisible(true);

        // Mostrar Stats Item 1 (Candidato A)
        const stats1 = JSON.stringify(this.itemToFuse1.stats, null, 2).replace(/{|}|"/g, '');
        this.fusionItem1Info.setText(`${this.itemToFuse1.name}\n\nSTATS ACTUALES:\n${stats1}`);

        // Mostrar Stats Item 2 (Candidato B)
        const stats2 = JSON.stringify(this.itemToFuse2.stats, null, 2).replace(/{|}|"/g, '');
        this.fusionItem2Info.setText(`${this.itemToFuse2.name}\n\nSTATS ACTUALES:\n${stats2}`);
    }

    executeFusion() {
        const result = RPGSystem.fuseSpecificItems(this.itemToFuse1, this.itemToFuse2);
        
        if (result.success) {
            this.removeItemFromInventory(this.itemToFuse1);
            this.removeItemFromInventory(this.itemToFuse2);
            gameState.inventory.push(result.item);
            
            // Cerrar todo
            this.fusionConfirmModal.setVisible(false);
            this.selectedItem = null;
            this.itemDetailContainer.setVisible(false);
            
            this.refreshInventory();
            SaveSystem.save();
            alert(`¡Fusión Exitosa! El destino eligió y mejoró el item: ${result.item.name}`);
        } else {
            alert(result.error);
        }
    }

    // --- RESTO DE FUNCIONES (Sin cambios) ---
    createInvCategoryBtn(x, y, label, cat) { const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#888', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).setOrigin(0.5); btn.on('pointerdown', () => { this.inventoryCategory = cat; this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); }); this.invContainer.add(btn); }
    refreshInventory() {
        let matContent = "";
        if (this.inventoryCategory === 'mats') { ['wood', 'cloth', 'copper', 'leather'].forEach(mat => { matContent += `\n${mat.toUpperCase()}:\n`; Object.keys(RARITY).forEach(rarity => { const count = gameState.materials[mat][rarity]; if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`; }); }); }
        this.invMatsText.setText(matContent);
        this.invItemsContainer.removeAll(true);
        const filteredItems = gameState.inventory.filter(i => { if (!i) return false; if (this.inventoryCategory === 'mats') return false; if (this.inventoryCategory === 'all') return i.type !== 'tower_part'; if (this.inventoryCategory === 'tower_part') return i.type === 'tower_part'; return true; });
        let col = 0; let row = 0;
        filteredItems.forEach(item => { let itemColor = item.color || 0xffffff; const itemContainer = this.add.container(col * 180, row * 50); const bg = this.add.rectangle(85, 20, 170, 40, 0x333333).setInteractive({ useHandCursor: true }); const colorHex = '#' + itemColor.toString(16).padStart(6, '0'); const nameTxt = this.add.text(10, 12, item.name || "Ítem", { fontSize: '12px', color: colorHex, wordWrap: {width: 150} }); bg.on('pointerdown', () => this.selectItem(item)); itemContainer.add([bg, nameTxt]); this.invItemsContainer.add(itemContainer); col++; if (col >= 3) { col = 0; row++; } });
        this.goldText.setText(`ORO: ${gameState.gold}`);
    }
    selectItem(item) {
        this.selectedItem = item; this.itemDetailContainer.setVisible(true);
        const itemColor = item.color || 0xffffff; const colorHex = '#' + itemColor.toString(16).padStart(6, '0');
        this.detailTitle.setText(item.name); this.detailTitle.setColor(colorHex);
        const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats";
        this.detailStats.setText(`Nivel: +${item.enchant}\nRareza: ${RARITY[item.rarity].name}\nStats:\n${statsStr}`);
        if (item.type === 'tower_part') { this.equipBtn.list[1].setText("EQUIPAR EN..."); } else { this.equipBtn.list[1].setText("EQUIPAR"); }
    }
    createActionButton(x, y, text, callback, color = 0x006400) { const container = this.add.container(x, y); const bg = this.add.rectangle(0, 0, 200, 35, color).setInteractive({ useHandCursor: true }); const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); bg.on('pointerdown', callback); container.add([bg, txt]); return container; }
    actionEquip() {
        if (!this.selectedItem) return; const item = this.selectedItem;
        if (item.type === 'tower_part') { const type = item.towerType; if (!gameState.towerEquipment[type].slot1) { gameState.towerEquipment[type].slot1 = item; } else if (!gameState.towerEquipment[type].slot2) { gameState.towerEquipment[type].slot2 = item; } else { gameState.inventory.push(gameState.towerEquipment[type].slot1); gameState.towerEquipment[type].slot1 = item; } this.removeItemFromInventory(item); this.refreshInventory(); this.switchTab('towers'); SaveSystem.save(); return; }
        const cls = gameState.selectedClass; let error = "";
        if (cls === 'arquero' && item.subType !== 'bow' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'guerrero' && item.subType !== 'sword' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'paladin' && item.subType !== 'sword' && item.subType !== 'shield' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'mago' && item.subType !== 'staff' && item.subType !== 'cloth' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'asesino' && item.subType !== 'dagger' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida";
        if (error) { alert(error); return; }
        if (item.type === 'armor') this.swapping('armor', item); else if (item.type === 'accessory') this.swapping('accessory', item); else if (item.type === 'offhand') this.swapping('offHand', item); else if (item.type === 'weapon') { if (item.twoHanded) { this.forceUnequip('mainHand'); this.forceUnequip('offHand'); gameState.equipment.mainHand = item; this.removeItemFromInventory(item); } else { if (!gameState.equipment.mainHand) { gameState.equipment.mainHand = item; this.removeItemFromInventory(item); } else if (this.canDualWield(cls) && !gameState.equipment.offHand) { gameState.equipment.offHand = item; this.removeItemFromInventory(item); } else { this.swapping('mainHand', item); } } }
        updatePlayerStats(); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save();
    }
    actionSell() { if (!this.selectedItem) return; const item = this.selectedItem; let sellPrice = 50; const rData = RARITY[item.rarity]; if (rData) sellPrice = Math.floor(50 * rData.mult + (item.enchant * 10)); gameState.gold += sellPrice; this.removeItemFromInventory(item); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save(); }
    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }

    // --- FORJA ---
    createForgeView(w, h, cx, cy) {
        this.profText = this.add.text(cx, h * 0.18, '', { fontSize: '16px', align: 'center', color: '#00ff00', lineHeight: 24 }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);
        this.forgeMsg = this.add.text(cx, h - 100, '', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);
        const catY = h * 0.25;
        this.createForgeCatBtn(w * 0.25, catY, "HERRERÍA (Armas)", 'weapon');
        this.createForgeCatBtn(cx, catY, "SASTRERÍA (Armaduras)", 'armor');
        this.createForgeCatBtn(w * 0.75, catY, "JOYERÍA (Accesorios)", 'accessory');
        this.createForgeCatBtn(cx, catY + 50, "INGENIERÍA (Torres)", 'tower_part'); 
        this.recipesContainer = this.add.container(0, 0); this.forgeContainer.add(this.recipesContainer);
        const detailX = w * 0.78; const detailY = h * 0.45;
        this.recipeDetailContainer = this.add.container(detailX, detailY); this.forgeContainer.add(this.recipeDetailContainer);
        const detailBg = this.add.rectangle(0, 100, 280, 350, 0x000000, 0.9).setStrokeStyle(2, 0xffd700);
        this.recipeTitle = this.add.text(0, -60, "Selecciona Receta", { fontSize: '20px', fontStyle: 'bold', color: '#ffd700', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        this.recipeInfo = this.add.text(0, 50, "", { fontSize: '14px', color: '#fff', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        this.craftBtn = this.createActionButton(0, 200, "FORJAR", () => this.handleCraftButton());
        this.craftBtn.setVisible(false);
        this.recipeDetailContainer.add([detailBg, this.recipeTitle, this.recipeInfo, this.craftBtn]);
    }
    createForgeCatBtn(x, y, label, cat) { const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setInteractive({useHandCursor:true}).setOrigin(0.5); btn.on('pointerdown', () => { this.forgeCategory = cat; this.expandedRecipeId = null; this.expandedTowerType = null; this.craftSelection = { type: null, recipe: null, rarity: null, towerType: null }; this.recipeDetailContainer.setVisible(false); this.refreshForge(); }); this.forgeContainer.add(btn); }
    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`); const p = gameState.professions; this.profText.setText(`HERRERÍA: Lvl ${p.weaponsmith.level} [${p.weaponsmith.xp}/${p.weaponsmith.maxXp} XP]\nSASTRERÍA: Lvl ${p.armorsmith.level} [${p.armorsmith.xp}/${p.armorsmith.maxXp} XP]\nJOYERÍA: Lvl ${p.jewelry.level} [${p.jewelry.xp}/${p.jewelry.maxXp} XP]`);
        this.recipesContainer.removeAll(true);
        const w = this.scale.width; const h = this.scale.height; let startX = w * 0.15; let startY = h * 0.35; let col = 0;
        if (this.forgeCategory === 'tower_part') {
            const types = ['archer', 'cannon', 'mage'];
            types.forEach((t, index) => {
                const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, 0x00ffff);
                const txt = this.add.text(startX + (col * 250), startY, `Mejoras ${t.toUpperCase()}`, {fontSize:'14px', color:'#00ffff'}).setOrigin(0.5);
                btn.on('pointerdown', () => { this.expandedTowerType = (this.expandedTowerType === t) ? null : t; this.refreshForge(); });
                this.recipesContainer.add([btn, txt]); startY += 55;
                if (this.expandedTowerType === t) {
                    ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(rarity => {
                        const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, {fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
                        rBtn.on('pointerdown', () => this.selectTowerPart(t, rarity)); this.recipesContainer.add([rBtn, rTxt]); startY += 40;
                    }); startY += 10;
                }
            }); return;
        }
        const categoryRecipes = RECIPES.filter(r => { if (this.forgeCategory === 'weapon') return r.type === 'weapon'; if (this.forgeCategory === 'armor') return r.type === 'armor' || r.type === 'offhand'; if (this.forgeCategory === 'accessory') return r.type === 'accessory'; return false; });
        categoryRecipes.forEach(recipe => {
            const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, 0xffffff);
            const txt = this.add.text(startX + (col * 250), startY, recipe.name, {fontSize:'14px', color:'#fff'}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.expandedRecipeId = (this.expandedRecipeId === recipe.id) ? null : recipe.id; this.refreshForge(); });
            this.recipesContainer.add([btn, txt]); startY += 55;
            if (this.expandedRecipeId === recipe.id) {
                ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(rarity => {
                    const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, {fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
                    rBtn.on('pointerdown', () => this.selectNormalRecipe(recipe, rarity)); this.recipesContainer.add([rBtn, rTxt]); startY += 40;
                }); startY += 10;
            }
            if (startY > h * 0.8) { col++; startY = h * 0.35; }
        });
    }
    selectNormalRecipe(recipe, rarityKey) {
        this.recipeDetailContainer.setVisible(true); this.craftSelection = { type: 'item', recipe: recipe, rarity: rarityKey };
        const rarity = RARITY[rarityKey]; const cost = Math.floor(recipe.cost * rarity.mult); const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');
        this.recipeTitle.setText(recipe.name); this.recipeTitle.setColor(hexColor);
        let info = `Rareza: ${rarity.name}\nCosto: $${cost}\nMaterial: 3 ${recipe.mat}\n\n`; info += "-- BASE --\n"; for (let key in recipe.baseStats) { info += `${key}: ${recipe.baseStats[key]}\n`; } info += `\n-- ALEATORIOS (${rarity.statCount}) --\nPosibles:\n`; const pool = RPGSystem.getStatPool(recipe); pool.forEach(stat => { info += `• ${stat.label}\n`; });
        this.recipeInfo.setText(info); this.craftBtn.setVisible(true); this.forgeMsg.setText("");
    }
    selectTowerPart(towerType, rarityKey) {
        this.recipeDetailContainer.setVisible(true); this.craftSelection = { type: 'tower', towerType: towerType, rarity: rarityKey };
        const rarity = RARITY[rarityKey]; const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');
        this.recipeTitle.setText(`Mejora ${towerType.toUpperCase()}`); this.recipeTitle.setColor(hexColor);
        let info = `Rareza: ${rarity.name}\nCosto: $500\nMat: 10 Madera, 10 Cuero, 10 Cobre\n\n`; info += `Stats Garantizados: 1\nStats Extra: ${rarity.statCount}\n\nPosibles:\n• Daño\n• Rango\n• Velocidad Ataque\n• Doble Ataque`;
        this.recipeInfo.setText(info); this.craftBtn.setVisible(true); this.forgeMsg.setText("");
    }
    handleCraftButton() {
        const sel = this.craftSelection; if (!sel.type) return;
        if (sel.type === 'item') { this.executeCraftItem(sel.recipe, sel.rarity); } else if (sel.type === 'tower') { this.executeCraftTower(sel.towerType, sel.rarity); }
    }
    executeCraftItem(recipe, rarityKey) {
        const rarity = RARITY[rarityKey]; const cost = Math.floor(recipe.cost * rarity.mult);
        if (gameState.gold < cost) { this.forgeMsg.setText("¡Falta Oro!"); this.forgeMsg.setColor('#ff0000'); return; }
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        if (result.success) { gameState.gold -= cost; gameState.inventory.push(result.item); this.forgeMsg.setText(`¡ÉXITO! Creado: ${result.item.name}`); this.forgeMsg.setColor('#00ff00'); this.goldText.setText(`ORO: ${gameState.gold}`); SaveSystem.save(); this.tweens.add({ targets: this.craftBtn, scale: 1.1, yoyo: true, duration: 100 }); } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); }
    }
    executeCraftTower(type, rarityKey) {
        const result = RPGSystem.craftTowerPart(type, rarityKey);
        if (result.success) { gameState.inventory.push(result.item); this.forgeMsg.setText(`¡ÉXITO! Creado: ${result.item.name}`); this.forgeMsg.setColor('#00ff00'); this.goldText.setText(`ORO: ${gameState.gold}`); SaveSystem.save(); this.tweens.add({ targets: this.craftBtn, scale: 1.1, yoyo: true, duration: 100 }); } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); }
    }
}