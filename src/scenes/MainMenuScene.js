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
        this.hasLoaded = false;
    }

    create() {
        // --- TRANSICIÓN VISUAL (Fix Pantalla Negra) ---
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // --- CARGA DE DATOS ---
        if (!this.hasLoaded) {
            SaveSystem.load(); // Carga el save
            this.hasLoaded = true;
        }

        // --- VALIDACIÓN DE HÉROE ---
        // Si después de cargar, no hay clase, ir a selección
        if (!gameState.selectedClass) {
            console.log("No class selected, redirecting...");
            this.scene.start('HeroSelectScene');
            return;
        }

        // Asegurar stats actualizados
        updatePlayerStats();

        // --- UI DRAWING ---
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        // Fondo
        this.add.rectangle(cx, cy, w, h, 0x1a1a1a);
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(w - 50, h * 0.05, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // TABS
        const tabY = h * 0.12; 
        const tabW = 200;
        this.createTabButton(cx - tabW * 1.5, tabY, 'HÉROE', 'hero');
        this.createTabButton(cx - tabW * 0.5, tabY, 'MOCHILA', 'inventory');
        this.createTabButton(cx + tabW * 0.5, tabY, 'FORJA', 'forge');
        this.createTabButton(cx + tabW * 1.5, tabY, 'TORRES', 'towers');

        // Contenedores
        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);
        this.towersContainer = this.add.container(0, 0);

        // Inicializar Vistas
        this.createHeroView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy);
        this.createForgeView(w, h, cx, cy);
        this.createTowersView(w, h, cx, cy);

        this.switchTab('hero');

        // Botones Globales
        const botY = h - 60;
        const playBtn = this.add.rectangle(cx, botY, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(cx, botY, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        // Reset y Cambio Héroe
        const resetBtn = this.add.text(50, h - 30, 'Borrar Datos', { fontSize: '14px', color: '#555' }).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo?")) { SaveSystem.reset(); } });

        const changeHeroBtn = this.add.text(200, h - 30, 'Cambiar Héroe', { fontSize: '14px', color: '#00ffff' }).setInteractive({ useHandCursor: true });
        changeHeroBtn.on('pointerdown', () => {
            // Forzar selección manual
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

        const leftX = w * 0.3;
        const contentY = h * 0.3;
        const statsBg = this.add.rectangle(leftX, cy + 20, w * 0.4, h * 0.6, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
        this.heroContainer.add(statsBg);
        this.heroStatsText = this.add.text(leftX - (w * 0.18), contentY, '', { fontSize: '16px', lineHeight: 26, color: '#ffffff' });
        this.heroContainer.add(this.heroStatsText);

        const rightX = w * 0.7;
        let upgradeY = h * 0.3;
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
        // PROTECCIÓN CONTRA CLASE NULA
        const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase();
        
        this.heroStatsText.setText(`
        CLASE ACTUAL: [ ${clsName} ]
        
        -- ATRIBUTOS --
        ❤️ Vida: ${Math.floor(s.hp)}/${s.maxHp}  ⚔️ Daño: ${s.damage}
        🛡️ Defensa: ${s.defense}  ⚡ Vel: ${s.attackSpeed}
        
        -- EQUIPAMIENTO --
        🗡️ Arma: ${eq.mainHand ? eq.mainHand.name : '-'}
        🛡️ Off: ${eq.offHand ? eq.offHand.name : '-'}
        👕 Armadura: ${eq.armor ? eq.armor.name : '-'}
        💍 Joya: ${eq.accessory ? eq.accessory.name : '-'}
        `);
        this.heroLevelText.setText(`NIVEL ${gameState.heroLevel} (XP: ${gameState.heroXP}/${gameState.heroMaxXP})`);
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${gameState.statPoints}`);
    }

    // --- VISTA TORRES ---
    createTowersView(w, h, cx, cy) {
        const types = ['archer', 'cannon', 'mage'];
        const names = ['ARQUERO', 'CAÑÓN', 'MAGO'];
        const startX = w * 0.2;
        const gap = w * 0.3;

        types.forEach((type, i) => {
            const x = startX + (i * gap);
            const y = h * 0.25;

            const title = this.add.text(x, y, names[i], { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
            this.towersContainer.add(title);

            const statsText = this.add.text(x, y + 100, "Stats...", { fontSize: '14px', align: 'center', color: '#aaa' }).setOrigin(0.5);
            statsText.name = `stats_${type}`; 
            this.towersContainer.add(statsText);

            for (let s = 1; s <= 2; s++) {
                const slotY = y + 200 + (s * 80);
                const slotBg = this.add.rectangle(x, slotY, 220, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true });
                const slotTxt = this.add.text(x, slotY, `Slot ${s}: Vacío`, { fontSize: '12px', wordWrap: {width: 200}, align: 'center' }).setOrigin(0.5);
                slotTxt.name = `txt_${type}_slot${s}`; 

                slotBg.on('pointerdown', () => {
                    const item = gameState.towerEquipment[type][`slot${s}`];
                    if (item) {
                        gameState.towerEquipment[type][`slot${s}`] = null;
                        gameState.inventory.push(item);
                        this.refreshTowersView();
                        SaveSystem.save();
                    }
                });

                this.towersContainer.add([slotBg, slotTxt]);
            }
        });
    }

    refreshTowersView() {
        const types = ['archer', 'cannon', 'mage'];
        types.forEach(type => {
            const eq = gameState.towerEquipment[type];
            let bonuses = { dmg: 0, range: 0, speed: 0, dbl: 0 };
            
            [eq.slot1, eq.slot2].forEach(it => {
                if (it && it.stats) {
                    if (it.stats.damage) bonuses.dmg += it.stats.damage;
                    if (it.stats.range) bonuses.range += it.stats.range;
                    if (it.stats.attackSpeed) bonuses.speed += it.stats.attackSpeed;
                    if (it.stats.doubleAttack) bonuses.dbl += it.stats.doubleAttack;
                }
            });

            const statObj = this.towersContainer.list.find(c => c.name === `stats_${type}`);
            if (statObj) {
                statObj.setText(`Daño Extra: +${bonuses.dmg}\nRango: +${bonuses.range}\nVelocidad: +${bonuses.speed}ms\nDoble Atq: ${bonuses.dbl}%`);
            }

            for (let s = 1; s <= 2; s++) {
                const item = eq[`slot${s}`];
                const txtObj = this.towersContainer.list.find(c => c.name === `txt_${type}_slot${s}`);
                if (txtObj) {
                    if (item) {
                        const col = '#' + (item.color || 0xffffff).toString(16).padStart(6, '0');
                        txtObj.setText(`${item.name} (+${item.enchant})`);
                        txtObj.setColor(col);
                    } else {
                        txtObj.setText("Slot Vacío");
                        txtObj.setColor('#ffffff');
                    }
                }
            }
        });
    }

    // --- MOCHILA ---
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

        this.fusionModal = this.add.container(cx, cy).setVisible(false).setDepth(2000);
        const fBg = this.add.rectangle(0, 0, 600, 500, 0x000000).setStrokeStyle(2, 0x00ffff).setInteractive();
        const fTitle = this.add.text(0, -200, "SELECCIONA ITEM PARA SACRIFICAR", { fontSize: '24px' }).setOrigin(0.5);
        this.fusionList = this.add.container(0, -150);
        const fCancel = this.add.text(0, 220, "CANCELAR", { fontSize: '20px', color: '#ff0000' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        fCancel.on('pointerdown', () => this.fusionModal.setVisible(false));
        this.fusionModal.add([fBg, fTitle, this.fusionList, fCancel]);
    }

    initiateFusion() {
        if (!this.selectedItem) return;
        this.itemToFuse1 = this.selectedItem;
        this.fusionModal.setVisible(true);
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
            const txt = this.add.text(0, y, `${item.name}`, { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
            btn.on('pointerdown', () => this.confirmFusion(item));
            this.fusionList.add([btn, txt]);
            y += 50;
        });
    }

    confirmFusion(item2) {
        const result = RPGSystem.fuseSpecificItems(this.itemToFuse1, item2);
        if (result.success) {
            this.removeItemFromInventory(this.itemToFuse1);
            this.removeItemFromInventory(item2);
            gameState.inventory.push(result.item);
            this.fusionModal.setVisible(false);
            this.selectedItem = null;
            this.itemDetailContainer.setVisible(false);
            this.refreshInventory();
            SaveSystem.save();
            alert(`¡Fusión Exitosa! Nuevo item: ${result.item.name}`);
        } else {
            alert(result.error);
        }
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
        let matContent = "";
        if (this.inventoryCategory === 'mats') {
            ['wood', 'cloth', 'copper', 'leather'].forEach(mat => {
                matContent += `\n${mat.toUpperCase()}:\n`;
                Object.keys(RARITY).forEach(rarity => {
                    const count = gameState.materials[mat][rarity];
                    if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`;
                });
            });
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
            `Nivel: +${item.enchant}\n` +
            `Rareza: ${RARITY[item.rarity].name}\n` +
            `Stats:\n${statsStr}`
        );
        if (item.type === 'tower_part') {
            this.equipBtn.list[1].setText("EQUIPAR EN...");
        } else {
            this.equipBtn.list[1].setText("EQUIPAR");
        }
    }

    createActionButton(x, y, text, callback, color = 0x006400) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 35, color).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    actionEquip() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;

        if (item.type === 'tower_part') {
            const type = item.towerType;
            if (!gameState.towerEquipment[type].slot1) {
                gameState.towerEquipment[type].slot1 = item;
            } else if (!gameState.towerEquipment[type].slot2) {
                gameState.towerEquipment[type].slot2 = item;
            } else {
                gameState.inventory.push(gameState.towerEquipment[type].slot1);
                gameState.towerEquipment[type].slot1 = item;
            }
            this.removeItemFromInventory(item);
            this.refreshInventory();
            this.switchTab('towers'); 
            SaveSystem.save();
            return;
        }

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
        this.createForgeCatBtn(cx, catY + 50, "INGENIERÍA (Torres)", 'tower_part'); // Botón extra

        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);

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

        if (this.forgeCategory === 'tower_part') {
            const types = ['archer', 'cannon', 'mage'];
            let y = 0;
            types.forEach(t => {
                ['common', 'uncommon', 'rare', 'epic'].forEach((rarity, i) => {
                    const btn = this.add.rectangle(400, 300 + y, 300, 40, 0x333333).setInteractive({useHandCursor:true});
                    const txt = this.add.text(400, 300 + y, `Mejora ${t.toUpperCase()} (${RARITY[rarity].name})`, {fontSize:'14px', color:'#fff'}).setOrigin(0.5);
                    btn.on('pointerdown', () => this.craftTowerPartAction(t, rarity));
                    this.recipesContainer.add([btn, txt]);
                    y += 50;
                });
            });
            return;
        }

        const filteredRecipes = RECIPES.filter(r => {
            if (this.forgeCategory === 'weapon') return r.type === 'weapon';
            if (this.forgeCategory === 'armor') return r.type === 'armor' || r.type === 'offhand';
            if (this.forgeCategory === 'accessory') return r.type === 'accessory';
            return false;
        });

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
            if (col > 1) { 
                col = 0; 
                startY += 240; 
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

    craftTowerPartAction(type, rarity) {
        const result = RPGSystem.craftTowerPart(type, rarity);
        if (result.success) {
            gameState.inventory.push(result.item);
            alert(`Creado: ${result.item.name}`);
            this.goldText.setText(`ORO: ${gameState.gold}`);
            SaveSystem.save();
        } else {
            alert(result.error);
        }
    }

    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }
}