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
        this.itemToFuse1 = null; // Para la fusión selectiva
        this.hasLoaded = false;
    }

    create() {
        // Validar si hay héroe seleccionado
        if (!gameState.selectedClass) {
            this.scene.start('HeroSelectScene');
            return;
        }

        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        if (!this.hasLoaded) {
            SaveSystem.load();
            if (!gameState.equipment) gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
            if (!gameState.towerEquipment) gameState.towerEquipment = { archer: { slot1: null, slot2: null }, cannon: { slot1: null, slot2: null }, mage: { slot1: null, slot2: null } };
            updatePlayerStats();
            this.hasLoaded = true;
        }

        // Fondo
        this.add.rectangle(cx, cy, w, h, 0x1a1a1a);
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(w - 50, h * 0.05, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // TABS (Ahora son 4)
        const tabY = h * 0.12; 
        const tabW = 200;
        this.createTabButton(cx - tabW * 1.5, tabY, 'HÉROE', 'hero');
        this.createTabButton(cx - tabW * 0.5, tabY, 'MOCHILA', 'inventory');
        this.createTabButton(cx + tabW * 0.5, tabY, 'FORJA', 'forge');
        this.createTabButton(cx + tabW * 1.5, tabY, 'TORRES', 'towers'); // NUEVO TAB

        // Contenedores
        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);
        this.towersContainer = this.add.container(0, 0); // Nuevo

        // Inicializar Vistas
        this.createHeroView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy);
        this.createForgeView(w, h, cx, cy);
        this.createTowersView(w, h, cx, cy); // Nueva Vista

        this.switchTab('hero');

        // Botones Globales
        const botY = h - 60;
        const playBtn = this.add.rectangle(cx, botY, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(cx, botY, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        // Reset y Cambio Héroe
        const resetBtn = this.add.text(50, h - 30, 'Borrar Datos', { fontSize: '14px', color: '#555' }).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo?")) { SaveSystem.reset(); this.scene.start('HeroSelectScene'); } });

        const changeHeroBtn = this.add.text(200, h - 30, 'Cambiar Héroe', { fontSize: '14px', color: '#00ffff' }).setInteractive({ useHandCursor: true });
        changeHeroBtn.on('pointerdown', () => this.scene.start('HeroSelectScene'));
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

    // --- VISTA HÉROE (Limpia) ---
    createHeroView(w, h, cx, cy) {
        this.heroLevelText = this.add.text(cx, h * 0.2, '', { fontSize: '24px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);

        const leftX = w * 0.3;
        const contentY = h * 0.3;
        const statsBg = this.add.rectangle(leftX, cy + 20, w * 0.4, h * 0.6, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
        this.heroContainer.add(statsBg);
        this.heroStatsText = this.add.text(leftX - (w * 0.18), contentY, '', { fontSize: '16px', lineHeight: 26, color: '#ffffff' });
        this.heroContainer.add(this.heroStatsText);

        // Stats Upgrade (Derecha)
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
        const clsName = gameState.selectedClass.toUpperCase();
        
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

    // --- NUEVO: VISTA TORRES ---
    createTowersView(w, h, cx, cy) {
        // 3 Columnas para las 3 torres
        const types = ['archer', 'cannon', 'mage'];
        const names = ['ARQUERO', 'CAÑÓN', 'MAGO'];
        const startX = w * 0.2;
        const gap = w * 0.3;

        types.forEach((type, i) => {
            const x = startX + (i * gap);
            const y = h * 0.25;

            // Titulo Torre
            const title = this.add.text(x, y, names[i], { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
            this.towersContainer.add(title);

            // Stats info
            const statsText = this.add.text(x, y + 100, "Stats...", { fontSize: '14px', align: 'center', color: '#aaa' }).setOrigin(0.5);
            statsText.name = `stats_${type}`; // Tag para actualizar
            this.towersContainer.add(statsText);

            // Slots de equipamiento (2)
            for (let s = 1; s <= 2; s++) {
                const slotY = y + 200 + (s * 80);
                const slotBg = this.add.rectangle(x, slotY, 220, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true });
                const slotTxt = this.add.text(x, slotY, `Slot ${s}: Vacío`, { fontSize: '12px', wordWrap: {width: 200}, align: 'center' }).setOrigin(0.5);
                slotTxt.name = `txt_${type}_slot${s}`; // Tag

                // Click para desequipar (simple)
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
            // Actualizar Texto Stats
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

            // Actualizar Slots
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

    // --- MOCHILA & FUSIÓN MEJORADA ---
    createInventoryView(w, h, cx, cy) {
        const catY = h * 0.18;
        this.createInvCategoryBtn(cx - 300, catY, "HERO", 'all'); // Simplificado
        this.createInvCategoryBtn(cx, catY, "TORRES", 'tower_part'); // Categoria nueva
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
        // Botón Fusión inicia el modo selección
        this.fuseBtn = this.createActionButton(0, 230, "FUSIONAR...", () => this.initiateFusion(), 0x00008b);
        this.sellBtn = this.createActionButton(0, 280, "VENDER", () => this.actionSell(), 0x8b0000);

        this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn, this.sellBtn]);

        // --- UI SELECCIÓN DE FUSIÓN (Modal) ---
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
        // ... (Lógica similar a la anterior, ajustada para filtrar)
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
        // Si es pieza de torre, cambiar botón Equipar
        if (item.type === 'tower_part') {
            this.equipBtn.list[1].setText("EQUIPAR EN...");
        } else {
            this.equipBtn.list[1].setText("EQUIPAR");
        }
    }

    actionEquip() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;

        // Lógica para Equipar Piezas de Torre
        if (item.type === 'tower_part') {
            // Equipar automáticamente en slot vacío o reemplazar slot 1
            const type = item.towerType;
            if (!gameState.towerEquipment[type].slot1) {
                gameState.towerEquipment[type].slot1 = item;
            } else if (!gameState.towerEquipment[type].slot2) {
                gameState.towerEquipment[type].slot2 = item;
            } else {
                // Swap slot 1
                gameState.inventory.push(gameState.towerEquipment[type].slot1);
                gameState.towerEquipment[type].slot1 = item;
            }
            this.removeItemFromInventory(item);
            this.refreshInventory();
            this.switchTab('towers'); // Ir a tab torres para ver
            SaveSystem.save();
            return;
        }

        // ... (Logica Equipar Héroe existente) ...
        const cls = gameState.selectedClass;
        // ... (Copia las validaciones de clase que ya tenías) ...
        
        // Copia tu lógica de equipamiento de héroe aquí...
        // Para brevedad, asumo que mantienes la lógica anterior del archivo previo
        // Simplemente añadiendo:
        if (item.type === 'armor') this.swapping('armor', item);
        else if (item.type === 'accessory') this.swapping('accessory', item);
        else if (item.type === 'offhand') this.swapping('offHand', item);
        else if (item.type === 'weapon') {
             // ... lógica armas ...
             this.swapping('mainHand', item); // Simplificado para este snippet
        }
        
        updatePlayerStats();
        this.selectedItem = null;
        this.itemDetailContainer.setVisible(false);
        this.refreshInventory();
        SaveSystem.save();
    }

    // --- FORJA TORRES ---
    createForgeView(w, h, cx, cy) {
        // ... Agregamos botón Ingenieria
        this.createForgeCatBtn(w * 0.5, h * 0.25, "INGENIERÍA (Torres)", 'tower_part'); 
        // ... Resto de tu lógica de forja, asegurate de incluir 'tower_part' en el filtro refreshForge
        
        // Al final de createForgeView original:
        this.recipesContainer = this.add.container(0, 0);
        this.forgeContainer.add(this.recipesContainer);
        // ... Panel detalle igual al original ...
        // Importante: Si la categoría es tower_part, mostramos botones de crafteo especial
    }
    
    // Sobrescribimos refreshForge para incluir las mejoras de torre como "Recetas"
    refreshForge() {
        this.recipesContainer.removeAll(true);
        // Si es Ingeniería, mostramos 3 botones fijos para crear mejoras de Arquero, Cañón, Mago
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
        // ... Lógica normal de recetas ...
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

    // ... Helpers (swapping, removeItem, etc) ...
    swapping(slot, newItem) { if (gameState.equipment[slot]) gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = newItem; this.removeItemFromInventory(newItem); }
    removeItemFromInventory(item) { const idx = gameState.inventory.indexOf(item); if (idx > -1) gameState.inventory.splice(idx, 1); }
    actionSell() { 
        if(this.selectedItem) {
            gameState.gold += 100; // Simplificado
            this.removeItemFromInventory(this.selectedItem);
            this.selectedItem = null;
            this.itemDetailContainer.setVisible(false);
            this.refreshInventory();
        }
    }
}