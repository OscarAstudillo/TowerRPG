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
            // Parche de seguridad para datos antiguos
            if (!gameState.equipment) gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
            updatePlayerStats();
            this.hasLoaded = true;
        }

        // Fondo y Título
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        this.add.text(640, 30, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(1200, 30, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // Tabs
        this.createTabButton(200, 80, 'HÉROE', 'hero');
        this.createTabButton(640, 80, 'MOCHILA', 'inventory');
        this.createTabButton(1080, 80, 'FORJA', 'forge');

        // Contenedores
        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);

        this.createHeroView();
        this.createInventoryView();
        this.createForgeView();

        this.switchTab('hero');

        // Botones Globales
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

    // --- VISTA HÉROE REDISEÑADA (2 COLUMNAS) ---
    createHeroView() {
        // Título Nivel (Arriba Centro)
        this.heroLevelText = this.add.text(640, 140, '', { fontSize: '24px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);

        // --- COLUMNA IZQUIERDA: STATS E INFO ---
        // Fondo panel stats
        const statsBg = this.add.rectangle(320, 400, 400, 450, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
        this.heroContainer.add(statsBg);
        
        this.heroStatsText = this.add.text(140, 200, '', { fontSize: '16px', lineHeight: 26, color: '#ffffff' });
        this.heroContainer.add(this.heroStatsText);

        // --- COLUMNA DERECHA: ACCIONES ---
        // 1. Selector de Clase (Lista Vertical a la derecha)
        this.heroContainer.add(this.add.text(960, 180, 'SELECCIONAR CLASE', { fontSize: '18px', color: '#aaa', fontStyle: 'bold' }).setOrigin(0.5));
        
        const classes = ['paladin', 'guerrero', 'arquero', 'mago', 'asesino'];
        let startY = 220;
        
        classes.forEach(clsKey => {
            const btn = this.add.rectangle(960, startY, 180, 35, 0x333333).setInteractive({ useHandCursor: true });
            const txt = this.add.text(960, startY, clsKey.toUpperCase(), { fontSize: '14px' }).setOrigin(0.5);
            
            // Hover effect
            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));

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

        // 2. Mejoras de Stats (Debajo de las clases)
        let upgradeY = startY + 40;
        this.pointsText = this.add.text(960, upgradeY, "Puntos: 0", { fontSize: '20px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.heroContainer.add(this.pointsText);
        
        upgradeY += 40;
        this.createStatButton(960, upgradeY, "Daño (+1)", 'damage');
        this.createStatButton(960, upgradeY + 40, "Vida (+10)", 'hp');
        this.createStatButton(960, upgradeY + 80, "Vel. Atq (+10ms)", 'speed');
        this.createStatButton(960, upgradeY + 120, "Defensa (+1)", 'defense');
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
        
        // Formato limpio y legible
        this.heroStatsText.setText(`
        CLASE ACTUAL: [ ${clsName} ]
        
        -- ATRIBUTOS PRINCIPALES --
        ❤️ Vida Máxima:   ${Math.floor(s.hp)} / ${s.maxHp}
        ⚔️ Daño Base:     ${s.damage}
        🛡️ Defensa:       ${s.defense} (Reducción Plana)
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
        // Protección contra datos corruptos o antiguos
        if (!gameState.equipment) gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
        
        ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => {
            const item = gameState.equipment[slot];
            if (item) {
                gameState.inventory.push(item);
                gameState.equipment[slot] = null;
            }
        });
    }

    // --- MOCHILA (SIN CAMBIOS) ---
    createInventoryView() {
        this.createInvCategoryBtn(400, 130, "TODO", 'all');
        this.createInvCategoryBtn(550, 130, "ARMAS", 'weapon');
        this.createInvCategoryBtn(700, 130, "ARMADURA", 'armor');
        this.createInvCategoryBtn(850, 130, "JOYAS", 'accessory');

        this.invMatsText = this.add.text(50, 160, '', { fontSize: '14px', lineHeight: 20 });
        this.invContainer.add(this.invMatsText);

        this.invItemsContainer = this.add.container(350, 180);
        this.invContainer.add(this.invItemsContainer);
        
        this.itemDetailContainer = this.add.container(950, 180);
        this.itemDetailContainer.setVisible(false);
        this.invContainer.add(this.itemDetailContainer);

        const bg = this.add.rectangle(150, 200, 280, 350, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.detailTitle = this.add.text(150, 40, "Nombre", { fontSize: '18px', fontStyle: 'bold', wordWrap: { width: 260 }, align: 'center' }).setOrigin(0.5);
        this.detailStats = this.add.text(150, 120, "Stats...", { fontSize: '14px', align: 'center', wordWrap: { width: 260 } }).setOrigin(0.5);
        this.equipBtn = this.createActionButton(150, 250, "EQUIPAR", () => this.actionEquip());
        this.fuseBtn = this.createActionButton(150, 300, "FUSIONAR (Req. 2)", () => this.actionFuse());
        this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn]);
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
            `Stats:\n${statsStr}`
        );
    }

    createActionButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 35, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    actionEquip() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;
        const cls = gameState.selectedClass;
        let error = "";

        if (cls === 'arquero' && item.subType !== 'bow' && item.subType !== 'leather' && item.subType !== 'ring') error = "Arquero: Solo Arcos, Cuero y Anillos";
        if (cls === 'guerrero' && item.subType !== 'sword' && item.subType !== 'plate' && item.subType !== 'ring') error = "Guerrero: Solo Espadas, Placas y Anillos";
        if (cls === 'paladin' && item.subType !== 'sword' && item.subType !== 'shield' && item.subType !== 'plate' && item.subType !== 'ring') error = "Paladín: Espada, Escudo, Placas";
        if (cls === 'mago' && item.subType !== 'staff' && item.subType !== 'cloth' && item.subType !== 'ring') error = "Mago: Bastón y Tela";
        if (cls === 'asesino' && item.subType !== 'dagger' && item.subType !== 'leather' && item.subType !== 'ring') error = "Asesino: Dagas y Cuero";

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

    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }
    actionFuse() { if (!this.selectedItem) return; const item1 = this.selectedItem; const idx2 = gameState.inventory.findIndex(i => i !== item1 && i.recipeId === item1.recipeId && i.rarity === item1.rarity && i.enchant === item1.enchant); if (idx2 === -1) { alert("Necesitas otro igual"); return; } const item2 = gameState.inventory[idx2]; const newItem = RPGSystem.fuseItems(item1, item2); if (newItem) { this.removeItemFromInventory(item1); this.removeItemFromInventory(item2); gameState.inventory.push(newItem); this.selectItem(newItem); this.refreshInventory(); SaveSystem.save(); } }

    // --- FORJA ---
    createForgeView() {
        this.profText = this.add.text(640, 140, '', { fontSize: '16px', align: 'center', color: '#00ff00', lineHeight: 24 }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);
        
        // Mensaje de estado (movido abajo)
        this.forgeMsg = this.add.text(640, 680, '', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);

        // Categorías
        this.createForgeCatBtn(400, 180, "HERRERÍA (Armas)", 'weapon');
        this.createForgeCatBtn(640, 180, "SASTRERÍA (Armaduras)", 'armor');
        this.createForgeCatBtn(880, 180, "JOYERÍA (Accesorios)", 'accessory');

        // Contenedor de lista de recetas (Izquierda)
        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);

        // --- NUEVO: PANEL DE DETALLE DE RECETA (Derecha) ---
        this.recipeDetailContainer = this.add.container(900, 250);
        this.forgeContainer.add(this.recipeDetailContainer);
        
        const detailBg = this.add.rectangle(150, 200, 280, 350, 0x000000, 0.9).setStrokeStyle(2, 0xffd700);
        this.recipeTitle = this.add.text(150, 40, "Selecciona Receta", { fontSize: '20px', fontStyle: 'bold', color: '#ffd700', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        this.recipeInfo = this.add.text(150, 150, "", { fontSize: '14px', color: '#fff', align: 'center', wordWrap: {width: 260} }).setOrigin(0.5);
        
        // Botón Craftear (inicialmente oculto)
        this.craftBtn = this.createActionButton(150, 300, "FORJAR", () => this.actionCraft());
        this.craftBtn.setVisible(false);

        this.recipeDetailContainer.add([detailBg, this.recipeTitle, this.recipeInfo, this.craftBtn]);
        
        // Variable para guardar la selección actual
        this.selectedRecipe = null;
        this.selectedRarity = null;
    }

    createForgeCatBtn(x, y, label, cat) {
        const btn = this.add.text(x, y, label, { fontSize: '16px', color: '#ffd700', fontStyle: 'bold' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        btn.on('pointerdown', () => { this.forgeCategory = cat; this.refreshForge(); });
        this.forgeContainer.add(btn);
    }

    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`);
        const p = gameState.professions;
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

        let startX = 250; // Más a la izquierda para dejar espacio al panel
        let startY = 240;
        let col = 0;

        filteredRecipes.forEach(recipe => {
            ['common', 'uncommon', 'rare', 'epic'].forEach((rarity, i) => { // Agregamos épico si quieres
                // Solo mostrar rarezas desbloqueadas por nivel de profesión? (Opcional, por ahora todas)
                this.createRecipeBtn(startX + (col * 220), startY + (i * 55), recipe, rarity);
            });
            col++;
            if (col > 1) { col = 0; startY += 240; } // Grid más compacto 2 columnas
        });
    }

    createRecipeBtn(x, y, recipe, rarity) {
        const rarityData = RARITY[rarity];
        const hexColor = '#' + rarityData.color.toString(16).padStart(6, '0');
        
        const btn = this.add.rectangle(x, y, 200, 45, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(1, rarityData.color);
        
        const txt = this.add.text(x, y, `${recipe.name} (${rarityData.name})`, { 
            fontSize: '12px', color: hexColor 
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            this.selectRecipe(recipe, rarity);
        });

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

        // Mostrar Stats Base + Posibles Stats Aleatorios
        let info = `Rareza: ${rarity.name}\nCosto: $${cost}\nMaterial: 3 ${recipe.mat}\n\n`;
        
        info += "-- BASE --\n";
        for (let key in recipe.baseStats) {
            info += `${key}: ${recipe.baseStats[key]}\n`;
        }

        info += `\n-- ALEATORIOS (${rarity.statCount}) --\nPosibles atributos:\n`;
        const pool = RPGSystem.getStatPool(recipe);
        pool.forEach(stat => {
            info += `• ${stat.label}\n`;
        });

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
            // Feedback visual en el botón
            this.tweens.add({ targets: this.craftBtn, scale: 1.1, yoyo: true, duration: 100 });
        } else {
            this.forgeMsg.setText(`ERROR: ${result.error}`);
            this.forgeMsg.setColor('#ff0000');
        }

    }
}