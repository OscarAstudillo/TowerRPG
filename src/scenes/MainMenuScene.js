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
        // --- VARIABLES DE RESPONSIVIDAD ---
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        if (!this.hasLoaded) {
            SaveSystem.load();
            if (!gameState.equipment) gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
            if (!gameState.baseAttributes) gameState.baseAttributes = { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 };
            updatePlayerStats();
            this.hasLoaded = true;
        }

        // Fondo y Título
        this.add.rectangle(cx, cy, w, h, 0x1a1a1a);
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(w - 50, h * 0.05, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // Tabs (Distribuidos horizontalmente)
        const tabY = h * 0.12; // 12% desde arriba
        this.createTabButton(w * 0.2, tabY, 'HÉROE', 'hero');
        this.createTabButton(cx, tabY, 'MOCHILA', 'inventory');
        this.createTabButton(w * 0.8, tabY, 'FORJA', 'forge');

        // Contenedores
        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);

        // Inicializar Vistas (Pasamos dimensiones para que se ajusten)
        this.createHeroView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy);
        this.createForgeView(w, h, cx, cy);

        this.switchTab('hero');

        // Botones Globales (Abajo)
        const botY = h - 60;
        const playBtn = this.add.rectangle(cx, botY, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(cx, botY, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        // Botón Reset (Esquina inferior izquierda)
        const resetBtn = this.add.text(50, h - 30, 'Borrar Datos', { fontSize: '12px', color: '#555' }).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo el progreso?")) SaveSystem.reset(); });
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

    // --- VISTA HÉROE (RESPONSIVA) ---
    createHeroView(w, h, cx, cy) {
        // Título Nivel
        this.heroLevelText = this.add.text(cx, h * 0.2, '', { fontSize: '24px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);

        // Panel Izquierdo (Stats)
        // Posición: 25% del ancho
        const leftX = w * 0.25;
        const contentY = h * 0.3; // Empezar contenido un poco más abajo

        const statsBg = this.add.rectangle(leftX, cy + 20, w * 0.4, h * 0.6, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
        this.heroContainer.add(statsBg);
        
        // Texto alineado dentro del panel izquierdo
        this.heroStatsText = this.add.text(leftX - (w * 0.18), contentY, '', { fontSize: '16px', lineHeight: 26, color: '#ffffff' });
        this.heroContainer.add(this.heroStatsText);

        // Panel Derecho (Clases y Mejoras)
        // Posición: 75% del ancho
        const rightX = w * 0.75;
        
        this.heroContainer.add(this.add.text(rightX, contentY - 40, 'SELECCIONAR CLASE', { fontSize: '18px', color: '#aaa', fontStyle: 'bold' }).setOrigin(0.5));
        
        const classes = ['paladin', 'guerrero', 'arquero', 'mago', 'asesino'];
        let startY = contentY;
        
        classes.forEach(clsKey => {
            const btn = this.add.rectangle(rightX, startY, 180, 35, 0x333333).setInteractive({ useHandCursor: true });
            const txt = this.add.text(rightX, startY, clsKey.toUpperCase(), { fontSize: '14px' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                this.unequipAll();
                gameState.selectedClass = clsKey;
                updatePlayerStats();
                this.refreshHero(); 
                SaveSystem.save();
            });
            this.heroContainer.add([btn, txt]);
            startY += 50;
        });

        // Mejoras Stats (Debajo de clases)
        let upgradeY = startY + 40;
        this.pointsText = this.add.text(rightX, upgradeY, "Puntos: 0", { fontSize: '20px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.heroContainer.add(this.pointsText);
        
        upgradeY += 40;
        this.createStatButton(rightX, upgradeY, "Daño (+1)", 'damage');
        this.createStatButton(rightX, upgradeY + 40, "Vida (+10)", 'hp');
        this.createStatButton(rightX, upgradeY + 80, "Vel. Atq (+10ms)", 'speed');
        this.createStatButton(rightX, upgradeY + 120, "Defensa (+1)", 'defense');
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
        
        this.heroStatsText.setText(`
        CLASE ACTUAL: [ ${clsName} ]
        
        -- ATRIBUTOS PRINCIPALES --
        ❤️ Vida Máxima:   ${Math.floor(s.hp)} / ${s.maxHp}
        ⚔️ Daño Base:     ${s.damage}
        🛡️ Defensa:       ${s.defense} (Reducción)
        ⚡ Vel. Ataque:   ${s.attackSpeed} ms
        🏹 Rango:         ${s.range} px
        
        -- ATRIBUTOS AVANZADOS --
        💥 Prob. Crítico: ${s.critChance}% (x${s.critDamage}%)
        🩸 Sangrado:      ${s.bleedChance}%
        🧛 Robo de Vida:  ${s.lifesteal}%
        🌵 Espinas:       ${s.thorns} daño
        ✨ Daño Skill:    +${s.skillDamage}%

        -- EQUIPAMIENTO ACTUAL --
        🗡️ Mano Der:  ${eq.mainHand ? eq.mainHand.name : '---'}
        🛡️ Mano Izq:  ${eq.offHand ? eq.offHand.name : '---'}
        👕 Armadura:  ${eq.armor ? eq.armor.name : '---'}
        💍 Accesorio: ${eq.accessory ? eq.accessory.name : '---'}
        `);

        this.heroLevelText.setText(`NIVEL DE HÉROE: ${gameState.heroLevel}  (XP: ${gameState.heroXP} / ${gameState.heroMaxXP})`);
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${gameState.statPoints}`);
    }

    unequipAll() {
        if (!gameState.equipment) gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
        ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => {
            const item = gameState.equipment[slot];
            if (item) {
                gameState.inventory.push(item);
                gameState.equipment[slot] = null;
            }
        });
    }

    // --- MOCHILA (RESPONSIVA) ---
    createInventoryView(w, h, cx, cy) {
        const catY = h * 0.18;
        
        // Botones de categoría centrados
        const catSpacing = 150;
        this.createInvCategoryBtn(cx - (catSpacing * 1.5), catY, "TODO", 'all');
        this.createInvCategoryBtn(cx - (catSpacing * 0.5), catY, "ARMAS", 'weapon');
        this.createInvCategoryBtn(cx + (catSpacing * 0.5), catY, "ARMADURA", 'armor');
        this.createInvCategoryBtn(cx + (catSpacing * 1.5), catY, "JOYAS", 'accessory');

        this.invMatsText = this.add.text(50, catY + 40, '', { fontSize: '14px', lineHeight: 20 });
        this.invContainer.add(this.invMatsText);

        // Contenedor Items (Lado Izquierdo/Centro)
        const gridX = w * 0.28;
        const gridY = h * 0.3;
        this.invItemsContainer = this.add.container(gridX, gridY);
        this.invContainer.add(this.invItemsContainer);
        
        // Panel Detalle (Lado Derecho)
        const detailX = w * 0.78;
        this.itemDetailContainer = this.add.container(detailX, gridY);
        this.itemDetailContainer.setVisible(false);
        this.invContainer.add(this.itemDetailContainer);

        const bg = this.add.rectangle(0, 150, 280, 400, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.detailTitle = this.add.text(0, -30, "Nombre", { fontSize: '18px', fontStyle: 'bold', wordWrap: { width: 260 }, align: 'center' }).setOrigin(0.5);
        this.detailStats = this.add.text(0, 50, "Stats...", { fontSize: '14px', align: 'center', wordWrap: { width: 260 } }).setOrigin(0.5);
        
        this.equipBtn = this.createActionButton(0, 180, "EQUIPAR", () => this.actionEquip(), 0x006400);
        this.fuseBtn = this.createActionButton(0, 230, "FUSIONAR (Req. 2)", () => this.actionFuse(), 0x00008b);
        this.sellBtn = this.createActionButton(0, 280, "VENDER ($0)", () => this.actionSell(), 0x8b0000);

        this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn, this.sellBtn]);
    }

    createInvCategoryBtn(x, y, label, cat) {
        const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#888', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.inventoryCategory = cat;
            this.selectedItem = null;
            this.itemDetailContainer.setVisible(false);
            this.refreshInventory();
        });
        this.invContainer.add(btn);
    }

    refreshInventory() {
        let matContent = "--- MATERIALES ---\n";
        ['wood', 'cloth', 'copper', 'leather'].forEach(mat => {
            matContent += `\n${mat.toUpperCase()}:\n`;
            Object.keys(RARITY).forEach(rarity => {
                const count = gameState.materials[mat][rarity];
                if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`;
            });
        });
        this.invMatsText.setText(matContent);

        this.invItemsContainer.removeAll(true);
        const filteredItems = gameState.inventory.filter(i => {
            if (!i) return false;
            if (this.inventoryCategory === 'all') return true;
            if (i.type === this.inventoryCategory) return true;
            if (this.inventoryCategory === 'weapon' && (i.type === 'weapon' || i.type === 'offhand')) return true;
            if (this.inventoryCategory === 'armor' && i.type === 'armor') return true;
            return false;
        });

        const limitText = this.add.text(0, -30, `CAPACIDAD: ${gameState.inventory.length} / ${gameState.maxInventorySlots}`, { fontSize: '14px', color: '#fff' });
        this.invItemsContainer.add(limitText);

        if (filteredItems.length === 0) {
            this.invItemsContainer.add(this.add.text(0, 0, "(Vacío)", { color: '#888' }));
        }

        let col = 0; let row = 0;
        filteredItems.forEach(item => {
            let itemColor = item.color || 0xffffff;
            const itemContainer = this.add.container(col * 180, row * 50);
            const bg = this.add.rectangle(85, 20, 170, 40, 0x333333).setInteractive({ useHandCursor: true });
            const colorHex = '#' + itemColor.toString(16).padStart(6, '0');
            const nameTxt = this.add.text(10, 12, item.name || "Ítem", { fontSize: '12px', color: colorHex, wordWrap: {width: 150} });
            bg.on('pointerdown', () => this.selectItem(item));
            itemContainer.add([bg, nameTxt]);
            this.invItemsContainer.add(itemContainer);
            col++;
            if (col >= 3) { col = 0; row++; }
        });
        this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    selectItem(item) {
        this.selectedItem = item;
        this.itemDetailContainer.setVisible(true);
        const itemColor = item.color || 0xffffff;
        const colorHex = '#' + itemColor.toString(16).padStart(6, '0');
        this.detailTitle.setText(item.name);
        this.detailTitle.setColor(colorHex);
        const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats";
        this.detailStats.setText(
            `Tipo: ${item.type} (${item.subType || '-'}) \n` +
            `Rareza: ${RARITY[item.rarity].name}\n` +
            `2 Manos: ${item.twoHanded ? 'SÍ' : 'NO'}\n` +
            `Stats:\n${statsStr}`
        );

        let sellPrice = 50; 
        const rData = RARITY[item.rarity];
        if (rData) sellPrice = Math.floor(50 * rData.mult + (item.enchant * 10));
        
        const sellText = this.sellBtn.list[1]; 
        sellText.setText(`VENDER ($${sellPrice})`);
    }

    createActionButton(x, y, text, callback, color = 0x006400) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 35, color).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    // Acciones Inventario (Igual que antes)
    actionEquip() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;
        const cls = gameState.selectedClass;
        let error = "";
        if (cls === 'arquero' && item.subType !== 'bow' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'guerrero' && item.subType !== 'sword' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'paladin' && item.subType !== 'sword' && item.subType !== 'shield' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'mago' && item.subType !== 'staff' && item.subType !== 'cloth' && item.subType !== 'ring') error = "Clase inválida";
        if (cls === 'asesino' && item.subType !== 'dagger' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida";
        if (error) { alert(error); return; }
        if (item.type === 'armor') this.swapping('armor', item);
        else if (item.type === 'accessory') this.swapping('accessory', item);
        else if (item.type === 'offhand') this.swapping('offHand', item);
        else if (item.type === 'weapon') {
            if (item.twoHanded) {
                this.forceUnequip('mainHand');
                this.forceUnequip('offHand');
                gameState.equipment.mainHand = item;
                this.removeItemFromInventory(item);
            } else {
                if (!gameState.equipment.mainHand) {
                    gameState.equipment.mainHand = item;
                    this.removeItemFromInventory(item);
                } else if (this.canDualWield(cls) && !gameState.equipment.offHand) {
                    gameState.equipment.offHand = item;
                    this.removeItemFromInventory(item);
                } else {
                    this.swapping('mainHand', item);
                }
            }
        }
        updatePlayerStats();
        this.selectedItem = null;
        this.itemDetailContainer.setVisible(false);
        this.refreshInventory();
        SaveSystem.save();
    }
    actionSell() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;
        let sellPrice = 50; 
        const rData = RARITY[item.rarity];
        if (rData) sellPrice = Math.floor(50 * rData.mult + (item.enchant * 10));
        gameState.gold += sellPrice;
        this.removeItemFromInventory(item);
        this.selectedItem = null;
        this.itemDetailContainer.setVisible(false);
        this.refreshInventory();
        SaveSystem.save();
    }
    actionFuse() {
        if (!this.selectedItem) return;
        const item1 = this.selectedItem;
        const idx2 = gameState.inventory.findIndex(i => i !== item1 && i.recipeId === item1.recipeId && i.rarity === item1.rarity && i.enchant === item1.enchant);
        if (idx2 === -1) { alert("Necesitas otro objeto idéntico"); return; }
        const item2 = gameState.inventory[idx2];
        const newItem = RPGSystem.fuseItems(item1, item2);
        if (newItem) {
            this.removeItemFromInventory(item1);
            this.removeItemFromInventory(item2);
            gameState.inventory.push(newItem);
            this.selectItem(newItem);
            this.refreshInventory();
            SaveSystem.save();
        }
    }
    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }

    // --- FORJA (RESPONSIVA) ---
    createForgeView(w, h, cx, cy) {
        this.profText = this.add.text(cx, h * 0.18, '', { fontSize: '16px', align: 'center', color: '#00ff00', lineHeight: 24 }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);
        this.forgeMsg = this.add.text(cx, h - 100, '', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);

        const catY = h * 0.25;
        this.createForgeCatBtn(w * 0.25, catY, "HERRERÍA (Armas)", 'weapon');
        this.createForgeCatBtn(cx, catY, "SASTRERÍA (Armaduras)", 'armor');
        this.createForgeCatBtn(w * 0.75, catY, "JOYERÍA (Accesorios)", 'accessory');

        // Lista de recetas
        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);

        // Panel Detalle
        const detailX = w * 0.78;
        const detailY = h * 0.45;
        this.recipeDetailContainer = this.add.container(detailX, detailY);
        this.forgeContainer.add(this.recipeDetailContainer);
        
        const detailBg = this.add.rectangle(0, 100, 280, 350, 0x000000, 0.9).setStrokeStyle(2, 0xffd700);
        this.recipeTitle = this.add.text(0, -60, "Selecciona Receta", { fontSize: '20px', fontStyle: 'bold', color: '#ffd700', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        this.recipeInfo = this.add.text(0, 50, "", { fontSize: '14px', color: '#fff', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        this.craftBtn = this.createActionButton(0, 200, "FORJAR", () => this.actionCraft());
        this.craftBtn.setVisible(false);
        this.recipeDetailContainer.add([detailBg, this.recipeTitle, this.recipeInfo, this.craftBtn]);
        
        this.selectedRecipe = null;
        this.selectedRarity = null;
    }

    createForgeCatBtn(x, y, label, cat) {
        const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.forgeCategory = cat;
            this.refreshForge();
        });
        this.forgeContainer.add(btn);
    }

    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`);
        const p = gameState.professions;
        this.profText.setText(`HERRERÍA: Lvl ${p.weaponsmith.level} [${p.weaponsmith.xp}/${p.weaponsmith.maxXp} XP]\nSASTRERÍA: Lvl ${p.armorsmith.level} [${p.armorsmith.xp}/${p.armorsmith.maxXp} XP]\nJOYERÍA: Lvl ${p.jewelry.level} [${p.jewelry.xp}/${p.jewelry.maxXp} XP]`);
        
        this.recipesContainer.removeAll(true);
        const filteredRecipes = RECIPES.filter(r => {
            if (this.forgeCategory === 'weapon') return r.type === 'weapon';
            if (this.forgeCategory === 'armor') return r.type === 'armor' || r.type === 'offhand';
            if (this.forgeCategory === 'accessory') return r.type === 'accessory';
            return false;
        });

        // Grid dinámico
        const w = this.scale.width;
        const h = this.scale.height;
        let startX = w * 0.15; 
        let startY = h * 0.35;
        let col = 0;

        filteredRecipes.forEach(recipe => {
            ['common', 'uncommon', 'rare', 'epic'].forEach((rarity, i) => { 
                this.createRecipeBtn(startX + (col * 220), startY + (i * 55), recipe, rarity);
            });
            col++;
            if (col > 1) { // 2 columnas
                col = 0; 
                startY += 240; // Espacio vertical entre grupos
            } 
        });
    }

    createRecipeBtn(x, y, recipe, rarity) {
        const rarityData = RARITY[rarity];
        const hexColor = '#' + rarityData.color.toString(16).padStart(6, '0');
        const btn = this.add.rectangle(x, y, 200, 45, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(1, rarityData.color);
        const txt = this.add.text(x, y, `${recipe.name} (${rarityData.name})`, { fontSize: '12px', color: hexColor }).setOrigin(0.5);
        btn.on('pointerdown', () => { this.selectRecipe(recipe, rarity); });
        this.recipesContainer.add([btn, txt]);
    }

    selectRecipe(recipe, rarityKey) {
        this.selectedRecipe = recipe;
        this.selectedRarity = rarityKey;
        const rarity = RARITY[rarityKey];
        const cost = Math.floor(recipe.cost * rarity.mult);
        const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');
        this.recipeTitle.setText(recipe.name);
        this.recipeTitle.setColor(hexColor);
        let info = `Rareza: ${rarity.name}\nCosto: $${cost}\nMaterial: 3 ${recipe.mat}\n\n`;
        info += "-- BASE --\n";
        for (let key in recipe.baseStats) { info += `${key}: ${recipe.baseStats[key]}\n`; }
        info += `\n-- ALEATORIOS (${rarity.statCount}) --\nPosibles:\n`;
        const pool = RPGSystem.getStatPool(recipe);
        pool.forEach(stat => { info += `• ${stat.label}\n`; });
        this.recipeInfo.setText(info);
        this.craftBtn.setVisible(true);
        this.forgeMsg.setText("");
    }

    actionCraft() {
        if (!this.selectedRecipe || !this.selectedRarity) return;
        const recipe = this.selectedRecipe;
        const rarityKey = this.selectedRarity;
        const rarity = RARITY[rarityKey];
        const cost = Math.floor(recipe.cost * rarity.mult);
        if (gameState.gold < cost) {
            this.forgeMsg.setText("¡Falta Oro!");
            this.forgeMsg.setColor('#ff0000');
            return;
        }
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        if (result.success) {
            gameState.gold -= cost;
            gameState.inventory.push(result.item);
            this.forgeMsg.setText(`¡ÉXITO! Creado: ${result.item.name}`);
            this.forgeMsg.setColor('#00ff00');
            this.refreshForge();
            SaveSystem.save();
            this.tweens.add({ targets: this.craftBtn, scale: 1.1, yoyo: true, duration: 100 });
        } else {
            this.forgeMsg.setText(`ERROR: ${result.error}`);
            this.forgeMsg.setColor('#ff0000');
        }
    }
}