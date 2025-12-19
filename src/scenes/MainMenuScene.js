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
        this.hasLoaded = false;
    }

    create() {
        if (!this.hasLoaded) {
            SaveSystem.load();
            updatePlayerStats();
            this.hasLoaded = true;
        }

        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        this.add.text(640, 30, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(1200, 30, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        this.createTabButton(200, 80, 'HÉROE', 'hero');
        this.createTabButton(640, 80, 'MOCHILA', 'inventory');
        this.createTabButton(1080, 80, 'FORJA', 'forge');

        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);

        this.createHeroView();
        this.createInventoryView();
        this.createForgeView();

        this.switchTab('hero');

        const playBtn = this.add.rectangle(640, 680, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(640, 680, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        const resetBtn = this.add.text(50, 680, '🗑️ Borrar Datos', { fontSize: '16px', color: '#ff4444' }).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerdown', () => SaveSystem.reset());
    }

    createTabButton(x, y, text, tabKey) {
        const btn = this.add.rectangle(x, y, 200, 40, 0x333333).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, text, { fontSize: '18px' }).setOrigin(0.5);
        btn.on('pointerdown', () => this.switchTab(tabKey));
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;
        this.heroContainer.setVisible(tabKey === 'hero');
        this.invContainer.setVisible(tabKey === 'inventory');
        this.forgeContainer.setVisible(tabKey === 'forge');
        
        if (tabKey === 'inventory') this.refreshInventory();
        if (tabKey === 'hero') this.refreshHero();
        if (tabKey === 'forge') this.refreshForge();
    }

    // --- HÉROE MEJORADO ---
    createHeroView() {
        // Stats Texto
        this.heroStatsText = this.add.text(440, 300, '', { fontSize: '16px', lineHeight: 24 }).setOrigin(0, 0);
        this.heroContainer.add(this.heroStatsText);

        // Nivel y XP
        this.heroLevelText = this.add.text(640, 180, '', { fontSize: '24px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);

        // Botones de Subir Stats
        this.createStatButton(850, 300, "Daño (+1)", 'damage');
        this.createStatButton(850, 350, "Vida (+10)", 'hp');
        this.createStatButton(850, 400, "Vel. Atq (+10ms)", 'speed');
        this.createStatButton(850, 450, "Defensa (+1)", 'defense');

        this.pointsText = this.add.text(850, 260, "Puntos: 0", { fontSize: '18px', color: '#ffd700' }).setOrigin(0.5);
        this.heroContainer.add(this.pointsText);

        // Clases
        const classes = ['paladin', 'guerrero', 'arquero', 'mago', 'asesino'];
        let startX = 340;
        classes.forEach(clsKey => {
            const btn = this.add.rectangle(startX, 130, 100, 30, 0x555555).setInteractive({ useHandCursor: true });
            const txt = this.add.text(startX, 130, clsKey.toUpperCase(), { fontSize: '12px' }).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.unequipAll();
                gameState.selectedClass = clsKey;
                updatePlayerStats();
                this.refreshHero(); 
                SaveSystem.save();
            });
            this.heroContainer.add([btn, txt]);
            startX += 150;
        });
    }

    createStatButton(x, y, label, statKey) {
        const btn = this.add.rectangle(x, y, 180, 30, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: '14px' }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            if (RPGSystem.spendStatPoint(statKey)) {
                this.refreshHero();
                SaveSystem.save();
            }
        });
        this.heroContainer.add([btn, txt]);
    }

    refreshHero() {
        updatePlayerStats();
        const s = gameState.playerStats;
        const eq = gameState.equipment;
        const clsName = gameState.selectedClass.toUpperCase();
        
        // Mostrar Stats Avanzados
        this.heroStatsText.setText(`
        CLASE: ${clsName}
        
        Vida: ${Math.floor(s.hp)}/${s.maxHp}
        Daño Base: ${s.damage}
        Defensa: ${s.defense} (Reducción Daño)
        Vel. Ataque: ${s.attackSpeed}ms
        Rango: ${s.range}
        
        -- AVANZADO --
        Crítico: ${s.critChance}% (x${s.critDamage}%)
        Robo Vida: ${s.lifesteal}%
        Daño Skill: +${s.skillDamage}%
        Sangrado: ${s.bleedChance}%
        Espinas: ${s.thorns}
        `);

        this.heroLevelText.setText(`NIVEL ${gameState.heroLevel} (XP: ${gameState.heroXP}/${gameState.heroMaxXP})`);
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${gameState.statPoints}`);
    }

    // --- FORJA MEJORADA (XP VISIBLE) ---
    createForgeView() {
        this.profText = this.add.text(640, 140, '', { fontSize: '16px', align: 'center', color: '#00ff00', lineHeight: 24 }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);
        this.forgeMsg = this.add.text(640, 650, 'Selecciona receta', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);

        this.createForgeCatBtn(400, 180, "HERRERÍA (Armas)", 'weapon');
        this.createForgeCatBtn(640, 180, "SASTRERÍA (Armaduras)", 'armor');
        this.createForgeCatBtn(880, 180, "JOYERÍA (Accesorios)", 'accessory');

        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);
    }

    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`);
        const p = gameState.professions;
        // Mostrar info detallada de profesiones
        this.profText.setText(
            `HERRERÍA: Lvl ${p.weaponsmith.level} [${p.weaponsmith.xp}/${p.weaponsmith.maxXp} XP]\n` +
            `SASTRERÍA: Lvl ${p.armorsmith.level} [${p.armorsmith.xp}/${p.armorsmith.maxXp} XP]\n` +
            `JOYERÍA: Lvl ${p.jewelry.level} [${p.jewelry.xp}/${p.jewelry.maxXp} XP]`
        );
        
        this.recipesContainer.removeAll(true);
        const filteredRecipes = RECIPES.filter(r => {
            if (this.forgeCategory === 'weapon') return r.type === 'weapon';
            if (this.forgeCategory === 'armor') return r.type === 'armor' || r.type === 'offhand';
            if (this.forgeCategory === 'accessory') return r.type === 'accessory';
            return false;
        });

        let startX = 300; let startY = 240; let col = 0;
        filteredRecipes.forEach(recipe => {
            ['common', 'uncommon', 'rare'].forEach((rarity, i) => {
                this.createRecipeBtn(startX + (col * 300), startY + (i * 60), recipe, rarity);
            });
            col++;
            if (col > 2) { col = 0; startY += 200; }
        });
    }

    // ... (El resto de funciones createTabButton, createInventoryView, unequipAll, etc. se mantienen igual que en el código anterior.
    // Solo copia las funciones modificadas arriba y asegúrate de mantener las funciones auxiliares de Inventario y Crafteo del paso anterior.)
    
    // --- FUNCIONES AUXILIARES NECESARIAS (NO OLVIDAR COPIARLAS DE TU CÓDIGO ANTERIOR O DE AQUÍ) ---
    unequipAll() { ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }); }
    createInvCategoryBtn(x, y, label, cat) { const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#888', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).setOrigin(0.5); btn.on('pointerdown', () => { this.inventoryCategory = cat; this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); }); this.invContainer.add(btn); }
    createInventoryView() { this.createInvCategoryBtn(400, 130, "TODO", 'all'); this.createInvCategoryBtn(550, 130, "ARMAS", 'weapon'); this.createInvCategoryBtn(700, 130, "ARMADURA", 'armor'); this.createInvCategoryBtn(850, 130, "JOYAS", 'accessory'); this.invMatsText = this.add.text(50, 160, '', { fontSize: '14px', lineHeight: 20 }); this.invContainer.add(this.invMatsText); this.invItemsContainer = this.add.container(350, 180); this.invContainer.add(this.invItemsContainer); this.itemDetailContainer = this.add.container(950, 180); this.itemDetailContainer.setVisible(false); this.invContainer.add(this.itemDetailContainer); const bg = this.add.rectangle(150, 200, 280, 350, 0x000000, 0.9).setStrokeStyle(2, 0xffffff); this.detailTitle = this.add.text(150, 40, "Nombre", { fontSize: '18px', fontStyle: 'bold', wordWrap: { width: 260 }, align: 'center' }).setOrigin(0.5); this.detailStats = this.add.text(150, 120, "Stats...", { fontSize: '14px', align: 'center', wordWrap: { width: 260 } }).setOrigin(0.5); this.equipBtn = this.createActionButton(150, 250, "EQUIPAR", () => this.actionEquip()); this.fuseBtn = this.createActionButton(150, 300, "FUSIONAR (Req. 2)", () => this.actionFuse()); this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn]); }
    refreshInventory() { let matContent = "--- MATERIALES ---\n"; ['wood', 'cloth', 'copper', 'leather'].forEach(mat => { matContent += `\n${mat.toUpperCase()}:\n`; Object.keys(RARITY).forEach(rarity => { const count = gameState.materials[mat][rarity]; if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`; }); }); this.invMatsText.setText(matContent); this.invItemsContainer.removeAll(true); const filteredItems = gameState.inventory.filter(i => { if (!i) return false; if (this.inventoryCategory === 'all') return true; if (i.type === this.inventoryCategory) return true; if (this.inventoryCategory === 'weapon' && (i.type === 'weapon' || i.type === 'offhand')) return true; if (this.inventoryCategory === 'armor' && i.type === 'armor') return true; return false; }); const limitText = this.add.text(0, -30, `CAPACIDAD: ${gameState.inventory.length} / ${gameState.maxInventorySlots}`, { fontSize: '14px', color: '#fff' }); this.invItemsContainer.add(limitText); if (filteredItems.length === 0) { this.invItemsContainer.add(this.add.text(0, 0, "(Vacío)", { color: '#888' })); } let col = 0; let row = 0; filteredItems.forEach(item => { let itemColor = item.color || 0xffffff; const itemContainer = this.add.container(col * 180, row * 50); const bg = this.add.rectangle(85, 20, 170, 40, 0x333333).setInteractive({ useHandCursor: true }); const colorHex = '#' + itemColor.toString(16).padStart(6, '0'); const nameTxt = this.add.text(10, 12, item.name || "Ítem", { fontSize: '12px', color: colorHex, wordWrap: {width: 150} }); bg.on('pointerdown', () => this.selectItem(item)); itemContainer.add([bg, nameTxt]); this.invItemsContainer.add(itemContainer); col++; if (col >= 3) { col = 0; row++; } }); this.goldText.setText(`ORO: ${gameState.gold}`); }
    selectItem(item) { this.selectedItem = item; this.itemDetailContainer.setVisible(true); const itemColor = item.color || 0xffffff; const colorHex = '#' + itemColor.toString(16).padStart(6, '0'); this.detailTitle.setText(item.name); this.detailTitle.setColor(colorHex); const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats"; this.detailStats.setText( `Tipo: ${item.type} (${item.subType || '-'}) \n` + `Rareza: ${RARITY[item.rarity].name}\n` + `Stats:\n${statsStr}` ); }
    createActionButton(x, y, text, callback) { const container = this.add.container(x, y); const bg = this.add.rectangle(0, 0, 200, 35, 0x006400).setInteractive({ useHandCursor: true }); const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5); bg.on('pointerdown', callback); container.add([bg, txt]); return container; }
    actionEquip() { if (!this.selectedItem) return; const item = this.selectedItem; const cls = gameState.selectedClass; let error = ""; if (cls === 'arquero' && item.subType !== 'bow' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida"; if (cls === 'guerrero' && item.subType !== 'sword' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida"; if (cls === 'paladin' && item.subType !== 'sword' && item.subType !== 'shield' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida"; if (cls === 'mago' && item.subType !== 'staff' && item.subType !== 'cloth' && item.subType !== 'ring') error = "Clase inválida"; if (cls === 'asesino' && item.subType !== 'dagger' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida"; if (error) { alert(error); return; } if (item.type === 'armor') this.swapping('armor', item); else if (item.type === 'accessory') this.swapping('accessory', item); else if (item.type === 'offhand') this.swapping('offHand', item); else if (item.type === 'weapon') { if (item.twoHanded) { this.forceUnequip('mainHand'); this.forceUnequip('offHand'); gameState.equipment.mainHand = item; this.removeItemFromInventory(item); } else { if (!gameState.equipment.mainHand) { gameState.equipment.mainHand = item; this.removeItemFromInventory(item); } else if (this.canDualWield(cls) && !gameState.equipment.offHand) { gameState.equipment.offHand = item; this.removeItemFromInventory(item); } else { this.swapping('mainHand', item); } } } updatePlayerStats(); this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); SaveSystem.save(); }
    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }
    actionFuse() { if (!this.selectedItem) return; const item1 = this.selectedItem; const idx2 = gameState.inventory.findIndex(i => i !== item1 && i.recipeId === item1.recipeId && i.rarity === item1.rarity && i.enchant === item1.enchant); if (idx2 === -1) { alert("Necesitas otro igual"); return; } const item2 = gameState.inventory[idx2]; const newItem = RPGSystem.fuseItems(item1, item2); if (newItem) { this.removeItemFromInventory(item1); this.removeItemFromInventory(item2); gameState.inventory.push(newItem); this.selectItem(newItem); this.refreshInventory(); SaveSystem.save(); } }
    createForgeCatBtn(x, y, label, cat) { const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setInteractive({useHandCursor:true}).setOrigin(0.5); btn.on('pointerdown', () => { this.forgeCategory = cat; this.refreshForge(); }); this.forgeContainer.add(btn); }
    createRecipeBtn(x, y, recipe, rarity) { const rarityData = RARITY[rarity]; const cost = recipe.cost * rarityData.mult; const hexColor = '#' + rarityData.color.toString(16).padStart(6, '0'); const btn = this.add.rectangle(x, y, 280, 50, 0x333333).setInteractive({ useHandCursor: true }); btn.setStrokeStyle(2, rarityData.color); const txt = this.add.text(x, y, `${recipe.name} (${rarityData.name})\nReq: 3 ${recipe.mat} + $${cost}`, { fontSize: '12px', align: 'center', color: hexColor }).setOrigin(0.5); btn.on('pointerdown', () => { if (gameState.gold < cost) { this.forgeMsg.setText("¡Falta Oro!"); return; } const result = RPGSystem.craftItem(recipe.id, rarity); if (result.success) { gameState.gold -= cost; gameState.inventory.push(result.item); this.forgeMsg.setText(`¡CRAFTEADO! ${result.item.name}`); this.forgeMsg.setColor('#00ff00'); this.refreshForge(); SaveSystem.save(); } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); } }); this.recipesContainer.add([btn, txt]); }
}