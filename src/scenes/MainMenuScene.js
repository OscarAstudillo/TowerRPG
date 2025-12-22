// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, RARITY, getCurrentHero } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import { RECIPES } from '../config/Recipes.js';
import { TALENTS } from '../config/Talents.js';

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
        this.craftSelection = { type: null, recipe: null, rarity: null, towerType: null };
        this.hasLoaded = false;

        // Estilos Globales
        this.fontTitle = { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000000', strokeThickness: 4 };
        this.fontHeader = { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
        this.fontBody = { fontFamily: 'Roboto', fontSize: '14px', color: '#eeeeee', stroke: '#000000', strokeThickness: 2 };
        this.fontBtn = { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        if (!this.hasLoaded) {
            SaveSystem.load();
            if (!gameState.talents) gameState.talents = [];
            this.sanitizeData(); // LIMPIEZA DE ITEMS FANTASMAS AL INICIO
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

        // Fondo y Título
        this.add.rectangle(cx, cy, w, h, 0x1a1a1a);
        this.add.text(cx, h * 0.05, 'TITAN DEFENSE RPG', this.fontTitle).setOrigin(0.5);
        this.goldText = this.add.text(w - 30, h * 0.05, `ORO: ${gameState.gold}`, { ...this.fontHeader, color: '#ffd700' }).setOrigin(1, 0.5);

        // TABS
        const tabY = h * 0.12; 
        const tabW = 160; 
        const startX = cx - (tabW * 2);
        
        this.createTabButton(startX, tabY, 'HÉROE', 'hero', tabW);
        this.createTabButton(startX + tabW, tabY, 'TALENTOS', 'talents', tabW);
        this.createTabButton(startX + tabW*2, tabY, 'MOCHILA', 'inventory', tabW);
        this.createTabButton(startX + tabW*3, tabY, 'FORJA', 'forge', tabW);
        this.createTabButton(startX + tabW*4, tabY, 'TORRES', 'towers', tabW);

        // Contenedores
        this.heroContainer = this.add.container(0, 0);
        this.talentsContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);
        this.towersContainer = this.add.container(0, 0);

        // Inicializar Vistas (EL ORDEN ES IRRELEVANTE SI LAS FUNCIONES EXISTEN)
        this.createHeroView(w, h, cx, cy);
        this.createTalentsView(w, h, cx, cy);
        this.createInventoryView(w, h, cx, cy); // ¡ESTA ES LA QUE FALTABA!
        this.createForgeView(w, h, cx, cy);
        this.createTowersView(w, h, cx, cy);

        this.switchTab('hero');

        // Botones Inferiores
        const botY = h - 50;
        const playBtn = this.add.rectangle(cx, botY, 220, 50, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00);
        this.add.text(cx, botY, 'IR AL MAPA', { ...this.fontTitle, fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));

        const changeHeroBtn = this.add.text(50, botY, 'CAMBIAR HÉROE', { ...this.fontBtn, color: '#00ffff' }).setInteractive({ useHandCursor: true }).setOrigin(0, 0.5);
        changeHeroBtn.on('pointerdown', () => { gameState.selectedClass = null; this.scene.start('HeroSelectScene'); });

        const resetBtn = this.add.text(w - 50, botY, 'BORRAR DATOS', { ...this.fontBtn, color: '#ff5555' }).setInteractive({ useHandCursor: true }).setOrigin(1, 0.5);
        resetBtn.on('pointerdown', () => { if(confirm("¿Borrar todo el progreso?")) { SaveSystem.reset(); } });
    }

    // --- UTILS ---
    sanitizeData() {
        console.log("Limpiando inventario de fantasmas...");
        const equippedIds = new Set();
        // Recopilar IDs equipados en Héroe
        Object.values(gameState.equipment).forEach(i => { if (i && i.id) equippedIds.add(i.id); });
        // Recopilar IDs equipados en Torres
        Object.values(gameState.towerEquipment).forEach(t => {
            if (t.slot1 && t.slot1.id) equippedIds.add(t.slot1.id);
            if (t.slot2 && t.slot2.id) equippedIds.add(t.slot2.id);
        });
        
        // Mantener solo items que NO están equipados
        gameState.inventory = gameState.inventory.filter(item => !equippedIds.has(item.id));
        SaveSystem.save();
    }

    createTabButton(x, y, text, tabKey, width) {
        const btn = this.add.rectangle(x, y, width - 8, 45, 0x222222).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x555555);
        const txt = this.add.text(x, y, text, this.fontBtn).setOrigin(0.5);
        btn.on('pointerdown', () => { 
            this.switchTab(tabKey); 
            this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 50 }); 
        });
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;
        [this.heroContainer, this.talentsContainer, this.invContainer, this.forgeContainer, this.towersContainer].forEach(c => c.setVisible(false));
        if (tabKey === 'hero') { this.heroContainer.setVisible(true); this.refreshHero(); }
        if (tabKey === 'talents') { this.talentsContainer.setVisible(true); this.refreshTalents(); }
        if (tabKey === 'inventory') { this.invContainer.setVisible(true); this.refreshInventory(); }
        if (tabKey === 'forge') { this.forgeContainer.setVisible(true); this.refreshForge(); }
        if (tabKey === 'towers') { this.towersContainer.setVisible(true); this.refreshTowersView(); }
    }

    createActionButton(x, y, text, callback, color = 0x006400) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 35, color).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, this.fontBtn).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    showCentralAlert(text, colorHex = '#ffffff') {
        const cx = this.scale.width / 2; const cy = this.scale.height / 2;
        const container = this.add.container(cx, cy).setDepth(3000);
        const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.9).setStrokeStyle(4, colorHex.replace('#', '0x'));
        const msg = this.add.text(0, 0, text, { ...this.fontTitle, fontSize: '28px', color: colorHex }).setOrigin(0.5);
        container.add([bg, msg]);
        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, ease: 'Back.out', duration: 300, onComplete: () => {
            this.time.delayedCall(2000, () => {
                this.tweens.add({ targets: container, scale: 0, alpha: 0, duration: 300, onComplete: () => container.destroy() });
            });
        }});
    }

    removeItemFromInventory(item) {
        if (!item || !item.id) return false;
        const initialLength = gameState.inventory.length;
        // FILTRO ROBUSTO: Elimina cualquier instancia con ese ID
        gameState.inventory = gameState.inventory.filter(i => i.id !== item.id);
        return gameState.inventory.length < initialLength;
    }

    // --- ACCIONES (EQUIPAR / VENDER) ---
    actionEquip() { 
        if (!this.selectedItem) return; 
        
        // Verificar existencia REAL (evita fantasmas en la UI)
        const realItem = gameState.inventory.find(i => i.id === this.selectedItem.id);
        if (!realItem) {
            this.showCentralAlert("¡ERROR: Item no existe!", "#ff0000");
            this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory();
            return;
        }
        const item = realItem;

        // >> LÓGICA TORRES
        if (item.type === 'tower_part') { 
            const type = item.towerType; 
            
            // 1. INTENTAR BORRAR PRIMERO (Si falla, abortamos para no duplicar)
            if (!this.removeItemFromInventory(item)) {
                this.showCentralAlert("Error crítico de inventario", "#ff0000");
                return;
            }

            // 2. ASIGNAR AL SLOT
            if (!gameState.towerEquipment[type].slot1) { 
                gameState.towerEquipment[type].slot1 = item; 
            } else if (!gameState.towerEquipment[type].slot2) { 
                gameState.towerEquipment[type].slot2 = item; 
            } else { 
                // Swap con slot 1
                gameState.inventory.push(gameState.towerEquipment[type].slot1); 
                gameState.towerEquipment[type].slot1 = item; 
            } 
            
            this.selectedItem = null; 
            this.itemDetailContainer.setVisible(false);
            this.refreshInventory(); 
            this.switchTab('towers'); 
            SaveSystem.save(); 
            return; 
        } 
        
        // >> LÓGICA HÉROE
        const cls = gameState.selectedClass; 
        let error = ""; 
        if (cls === 'arquero' && item.subType !== 'bow' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida"; 
        if (cls === 'guerrero' && item.subType !== 'sword' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida"; 
        if (cls === 'paladin' && item.subType !== 'sword' && item.subType !== 'shield' && item.subType !== 'plate' && item.subType !== 'ring') error = "Clase inválida"; 
        if (cls === 'mago' && item.subType !== 'staff' && item.subType !== 'cloth' && item.subType !== 'ring') error = "Clase inválida"; 
        if (cls === 'asesino' && item.subType !== 'dagger' && item.subType !== 'leather' && item.subType !== 'ring') error = "Clase inválida"; 
        if (error) { this.showCentralAlert(error, "#ff0000"); return; } 
        
        // Borrar primero
        if (!this.removeItemFromInventory(item)) { this.showCentralAlert("Error al mover item", "#ff0000"); return; }
        
        if (item.type === 'armor') this.swapping('armor', item); 
        else if (item.type === 'accessory') this.swapping('accessory', item); 
        else if (item.type === 'offhand') this.swapping('offHand', item); 
        else if (item.type === 'weapon') { 
            if (item.twoHanded) { 
                this.forceUnequip('mainHand'); this.forceUnequip('offHand'); 
                gameState.equipment.mainHand = item; 
            } else { 
                if (!gameState.equipment.mainHand) { 
                    gameState.equipment.mainHand = item; 
                } else if (this.canDualWield(cls) && !gameState.equipment.offHand) { 
                    gameState.equipment.offHand = item; 
                } else { 
                    this.swapping('mainHand', item); 
                } 
            } 
        } 
        updatePlayerStats(); this.selectedItem = null; this.itemDetailContainer.setVisible(false); 
        this.refreshInventory(); SaveSystem.save(); 
    }

    actionSell() { 
        if (!this.selectedItem) return; 
        const realItem = gameState.inventory.find(i => i.id === this.selectedItem.id);
        if (!realItem) { this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); return; }
        
        let sellPrice = 50; const rData = RARITY[realItem.rarity]; 
        if (rData) sellPrice = Math.floor(50 * rData.mult + (realItem.enchant * 10)); 
        
        if (this.removeItemFromInventory(realItem)) {
            gameState.gold += sellPrice; 
            this.selectedItem = null; this.itemDetailContainer.setVisible(false); 
            this.refreshInventory(); SaveSystem.save(); 
            this.showCentralAlert(`Vendido por $${sellPrice}`, '#ffd700');
        }
    }

    // --- FUSIÓN ATÓMICA ---
    initiateFusion() { if (!this.selectedItem) return; this.itemToFuse1 = this.selectedItem; this.fusionListModal.setVisible(true); this.populateFusionList(); }
    populateFusionList() { this.fusionList.removeAll(true); const candidates = gameState.inventory.filter(i => i !== this.itemToFuse1 && i.type === this.itemToFuse1.type && i.rarity === this.itemToFuse1.rarity && i.enchant === this.itemToFuse1.enchant); if (candidates.length === 0) { this.fusionList.add(this.add.text(0, 0, "No hay items compatibles\n(Mismo Tipo, Rareza y Nivel)", { ...this.fontBody, align: 'center' }).setOrigin(0.5)); return; } let y = 0; candidates.forEach(item => { const btn = this.add.rectangle(0, y, 400, 40, 0x333333).setInteractive({useHandCursor:true}); const statsStr = JSON.stringify(item.stats).replace(/{|}|"/g, '').substring(0, 30) + "..."; const txt = this.add.text(0, y, `${item.name} | ${statsStr}`, { ...this.fontBody, fontSize:'14px', color: '#fff' }).setOrigin(0.5); btn.on('pointerdown', () => this.selectSecondItemForFusion(item)); this.fusionList.add([btn, txt]); y += 50; }); }
    selectSecondItemForFusion(item2) { this.itemToFuse2 = item2; this.fusionListModal.setVisible(false); this.fusionConfirmModal.setVisible(true); const stats1 = JSON.stringify(this.itemToFuse1.stats, null, 2).replace(/{|}|"/g, ''); this.fusionItem1Info.setText(`${this.itemToFuse1.name}\n\nSTATS ACTUALES:\n${stats1}`); const stats2 = JSON.stringify(this.itemToFuse2.stats, null, 2).replace(/{|}|"/g, ''); this.fusionItem2Info.setText(`${this.itemToFuse2.name}\n\nSTATS ACTUALES:\n${stats2}`); }
    
    executeFusion() { 
        const id1 = this.itemToFuse1.id;
        const id2 = this.itemToFuse2.id;
        
        // 1. Validar existencia
        const exists1 = gameState.inventory.some(i => i.id === id1);
        const exists2 = gameState.inventory.some(i => i.id === id2);

        if(!exists1 || !exists2) { 
            this.showCentralAlert("Error: Uno de los items ya no existe", "#ff0000"); 
            this.fusionConfirmModal.setVisible(false); return; 
        }

        const result = RPGSystem.fuseSpecificItems(this.itemToFuse1, this.itemToFuse2); 
        if (result.success) { 
            // 2. BORRADO ATÓMICO: Filtrar ambos IDs
            gameState.inventory = gameState.inventory.filter(i => i.id !== id1 && i.id !== id2);
            
            gameState.inventory.push(result.item); 
            this.fusionConfirmModal.setVisible(false); 
            this.selectedItem = null; 
            this.itemDetailContainer.setVisible(false); 
            this.refreshInventory(); 
            SaveSystem.save(); 
            
            const color = '#' + RARITY[result.item.rarity].color.toString(16).padStart(6,'0'); 
            this.showCentralAlert(`¡FUSIÓN EXITOSA!\n${result.item.name}`, color); 
        } else { 
            alert(result.error); 
        } 
    }

    canDualWield(cls) { return cls === 'guerrero' || cls === 'asesino'; }
    swapping(slot, newItem) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); } gameState.equipment[slot] = newItem; }
    forceUnequip(slot) { if (gameState.equipment[slot]) { gameState.inventory.push(gameState.equipment[slot]); gameState.equipment[slot] = null; } }

    // --- VISTA HÉROE ---
    createHeroView(w, h, cx, cy) {
        this.heroLevelText = this.add.text(cx, h * 0.17, '', { ...this.fontHeader, fontSize: '28px', color: '#00ffff' }).setOrigin(0.5);
        this.heroContainer.add(this.heroLevelText);
        const leftX = w * 0.3; const contentY = h * 0.3;
        const panelWidth = 450; const panelHeight = 550;
        const statsBg = this.add.rectangle(leftX, cy + 20, panelWidth, panelHeight, 0x000000, 0.8).setStrokeStyle(2, 0x555555);
        this.heroContainer.add(statsBg);
        const textStartX = leftX - (panelWidth / 2) + 20; const textStartY = (cy + 20) - (panelHeight / 2) + 20;
        this.heroStatsText = this.add.text(textStartX, textStartY, '', { ...this.fontBody, fontSize: '15px', lineHeight: 22 });
        this.heroContainer.add(this.heroStatsText);
        this.equippedTextContainer = this.add.container(0, 0);
        this.heroContainer.add(this.equippedTextContainer);
        const rightX = w * 0.75; let upgradeY = h * 0.3;
        this.pointsText = this.add.text(rightX, upgradeY, "Puntos: 0", { ...this.fontHeader, color: '#ffd700' }).setOrigin(0.5);
        this.heroContainer.add(this.pointsText);
        upgradeY += 60;
        const statsToUpgrade = [ { label: "Daño (+1)", key: 'damage' }, { label: "Vida (+10)", key: 'hp' }, { label: "Vel. Atq (+10ms)", key: 'speed' }, { label: "Defensa (+1)", key: 'defense' } ];
        statsToUpgrade.forEach((s, i) => { this.createStatButton(rightX, upgradeY + (i * 60), s.label, s.key); });
    }
    createStatButton(x, y, label, statKey) {
        const btn = this.add.rectangle(x, y, 220, 45, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00);
        const txt = this.add.text(x, y, label, this.fontBtn).setOrigin(0.5);
        btn.on('pointerdown', () => { if (RPGSystem.spendStatPoint(statKey)) { this.refreshHero(); SaveSystem.save(); } });
        this.heroContainer.add([btn, txt]);
    }
    refreshHero() {
        updatePlayerStats(); const s = gameState.playerStats; const eq = gameState.equipment; const hero = getCurrentHero(); const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase();
        const details = `Crítico: ${s.critChance}% (x${s.critDamage}%) \nRobo Vida: ${s.lifesteal}%  |  Regen HP: ${s.regenHp}/5s \nDoble Ataque: ${s.doubleAttack}%  |  Espinas: ${s.thorns} \nCooldown: -${s.cdr}%`;
        this.heroStatsText.setText(`CLASE: [ ${clsName} ]\n\n-- ATRIBUTOS BASE --\n❤️ Vida: ${Math.floor(s.hp)}/${s.maxHp}\n⚔️ Daño: ${s.damage}\n🛡️ Defensa: ${s.defense}\n⚡ Delay Atq: ${s.attackSpeed}ms\n\n-- EXTRAS --\n${details}`);
        this.heroLevelText.setText(`NIVEL ${hero.level} (XP: ${hero.xp}/${hero.maxXp})`);
        this.pointsText.setText(`PUNTOS DE STAT: ${hero.statPoints}`);
        this.equippedTextContainer.removeAll(true);
        const startX = this.heroStatsText.x; let startY = this.heroStatsText.y + 260; 
        this.equippedTextContainer.add(this.add.text(startX, startY, "-- EQUIPAMIENTO (Clic gestiona) --", { ...this.fontBody, color: '#aaa', fontStyle: 'italic'}));
        startY += 30;
        const slots = [ { key: 'mainHand', label: '🗡️ Arma', cat: 'weapon' }, { key: 'offHand', label: '🛡️ Off', cat: 'armor' }, { key: 'armor', label: '👕 Ropa', cat: 'armor' }, { key: 'accessory', label: '💍 Joya', cat: 'accessory' } ];
        slots.forEach(slot => {
            const item = eq[slot.key];
            const slotBg = this.add.rectangle(startX + 180, startY + 10, 360, 30, 0x222222).setOrigin(0.5).setInteractive({useHandCursor: true});
            slotBg.setStrokeStyle(1, item ? RARITY[item.rarity].color : 0x555555);
            const name = item ? `${item.name} (+${item.enchant})` : '- VACÍO (Ir a Mochila) -';
            const color = item ? '#' + item.color.toString(16).padStart(6, '0') : '#888';
            const txt = this.add.text(startX, startY, `${slot.label}:`, this.fontBody);
            const valTxt = this.add.text(startX + 80, startY, name, { ...this.fontBody, color: color, fontStyle: 'bold' });
            slotBg.on('pointerdown', () => { if (!item) { this.inventoryCategory = slot.cat; this.switchTab('inventory'); } else { this.showUnequipModal(item, slot.key); } });
            this.equippedTextContainer.add([slotBg, txt, valTxt]); startY += 35;
        });
    }
    showUnequipModal(item, slotKey) {
        const modal = this.add.container(this.scale.width/2, this.scale.height/2).setDepth(2000);
        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color);
        const title = this.add.text(0, -100, item.name, { ...this.fontHeader, fontSize: '22px', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5);
        const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '');
        const info = this.add.text(0, -20, statsStr, this.fontBody).setOrigin(0.5);
        const btnUnequip = this.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true});
        const txtUnequip = this.add.text(0, 80, "DESEQUIPAR", this.fontBtn).setOrigin(0.5);
        const btnClose = this.add.text(0, 130, "Cancelar", { ...this.fontBody, color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        btnUnequip.on('pointerdown', () => { 
            if (gameState.equipment[slotKey] && gameState.equipment[slotKey].id === item.id) {
                gameState.equipment[slotKey] = null; gameState.inventory.push(item); 
                SaveSystem.save(); updatePlayerStats(); this.refreshHero(); modal.destroy(); 
            } else { this.showCentralAlert("Error: Item no equipado", "#ff0000"); modal.destroy(); }
        });
        btnClose.on('pointerdown', () => modal.destroy());
        modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]);
        this.heroContainer.add(modal);
    }

    // --- VISTA TALENTOS ---
    createTalentsView(w, h, cx, cy) {
        this.talentPointsText = this.add.text(cx, h * 0.18, "PUNTOS DE TALENTO: 0", { ...this.fontTitle, fontSize: '24px' }).setOrigin(0.5);
        this.talentsContainer.add(this.talentPointsText);
        const note = this.add.text(cx, h * 0.22, "(Elige 1 por Nivel 10 - Exclusivos)", { ...this.fontBody, color: '#aaa' }).setOrigin(0.5);
        this.talentsContainer.add(note);
        this.talentTreeContainer = this.add.container(0, 0);
        this.talentsContainer.add(this.talentTreeContainer);
    }
    refreshTalents() {
        const hero = getCurrentHero(); this.talentPointsText.setText(`PUNTOS DE TALENTO: ${hero.talentPoints}`); this.talentTreeContainer.removeAll(true);
        const cls = gameState.selectedClass; const allTalents = TALENTS[cls] || []; const w = this.scale.width; let startY = this.scale.height * 0.3; const tiers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        tiers.forEach(tierLevel => {
            const tierTalents = allTalents.filter(t => t.tier === tierLevel); if (tierTalents.length === 0) return;
            const isUnlocked = hero.level >= tierLevel; const pickedTalent = tierTalents.find(t => hero.talents.includes(t.id));
            const rowBg = this.add.rectangle(w/2, startY, 800, 70, 0x222222).setStrokeStyle(1, isUnlocked ? 0x555555 : 0x220000);
            const rowLabel = this.add.text(w/2 - 380, startY, `NIVEL ${tierLevel}`, { ...this.fontHeader, fontSize:'16px', color: isUnlocked ? '#fff' : '#555' }).setOrigin(0, 0.5);
            this.talentTreeContainer.add([rowBg, rowLabel]);
            tierTalents.forEach((talent, idx) => {
                const isSelected = (pickedTalent && pickedTalent.id === talent.id); const isBlocked = (pickedTalent && pickedTalent.id !== talent.id);
                const btnX = w/2 + (idx === 0 ? -150 : 150); let color = 0x333333; if (isSelected) color = 0x006400; else if (isBlocked || !isUnlocked) color = 0x111111;
                const btn = this.add.rectangle(btnX, startY, 280, 50, color).setStrokeStyle(1, isSelected ? 0x00ff00 : 0xaaaaaa);
                const nameTxt = this.add.text(btnX, startY - 10, talent.name, { ...this.fontBtn, fontSize:'14px', color: isBlocked || !isUnlocked ? '#555' : '#fff' }).setOrigin(0.5);
                const descTxt = this.add.text(btnX, startY + 10, talent.desc, { ...this.fontBody, fontSize:'10px', color: '#aaa' }).setOrigin(0.5);
                if (isUnlocked && !pickedTalent && hero.talentPoints > 0) { btn.setInteractive({ useHandCursor: true }); btn.on('pointerdown', () => this.learnTalent(talent)); btn.setStrokeStyle(2, 0xffd700); }
                this.talentTreeContainer.add([btn, nameTxt, descTxt]);
            }); startY += 80;
        });
    }
    learnTalent(talent) { if (RPGSystem.spendTalentPoint(talent.id, 1)) { updatePlayerStats(); SaveSystem.save(); this.refreshTalents(); this.showCentralAlert(`¡TALENTO APRENDIDO: ${talent.name}!`, '#00ff00'); } }

    // --- INVENTARIO (Aquí estaba el problema) ---
    createInventoryView(w, h, cx, cy) {
        const catY = h * 0.18;
        this.createInvCategoryBtn(cx - 300, catY, "HERO", 'all'); 
        this.createInvCategoryBtn(cx, catY, "TORRES", 'tower_part'); 
        this.createInvCategoryBtn(cx + 300, catY, "MATERIALES", 'mats');
        this.invMatsText = this.add.text(50, catY + 40, '', { ...this.fontBody, lineHeight: 20 }); 
        this.invContainer.add(this.invMatsText);
        
        const gridX = w * 0.28; const gridY = h * 0.3;
        this.invItemsContainer = this.add.container(gridX, gridY); 
        this.invContainer.add(this.invItemsContainer);
        
        const detailX = w * 0.78;
        this.itemDetailContainer = this.add.container(detailX, gridY); 
        this.itemDetailContainer.setVisible(false); 
        this.invContainer.add(this.itemDetailContainer);
        
        const bg = this.add.rectangle(0, 150, 300, 600, 0x000000, 0.9).setStrokeStyle(2, 0xffffff);
        this.detailTitle = this.add.text(0, -100, "", { ...this.fontHeader, fontSize:'18px', align: 'center', wordWrap: {width: 280} }).setOrigin(0.5);
        this.detailStats = this.add.text(0, 50, "", { ...this.fontBody, fontSize: '13px', align: 'left', wordWrap: {width: 280} }).setOrigin(0.5);
        
        this.equipBtn = this.createActionButton(0, 250, "EQUIPAR", () => this.actionEquip(), 0x006400);
        this.fuseBtn = this.createActionButton(0, 300, "FUSIONAR...", () => this.initiateFusion(), 0x00008b);
        this.sellBtn = this.createActionButton(0, 350, "VENDER", () => this.actionSell(), 0x8b0000);
        
        this.itemDetailContainer.add([bg, this.detailTitle, this.detailStats, this.equipBtn, this.fuseBtn, this.sellBtn]);
        this.createFusionModals(cx, cy);
    }

    createFusionModals(cx, cy) {
        this.fusionListModal = this.add.container(cx, cy).setVisible(false).setDepth(2000);
        const fBg = this.add.rectangle(0, 0, 600, 500, 0x000000).setStrokeStyle(2, 0x00ffff).setInteractive();
        const fTitle = this.add.text(0, -200, "SELECCIONA ITEM", this.fontHeader).setOrigin(0.5);
        this.fusionList = this.add.container(0, -150);
        const fCancel = this.add.text(0, 220, "CANCELAR", { ...this.fontBtn, color: '#ff0000' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        fCancel.on('pointerdown', () => this.fusionListModal.setVisible(false));
        this.fusionListModal.add([fBg, fTitle, this.fusionList, fCancel]);

        this.fusionConfirmModal = this.add.container(cx, cy).setVisible(false).setDepth(2100);
        const fcBg = this.add.rectangle(0, 0, 800, 600, 0x111111).setStrokeStyle(3, 0xffd700).setInteractive();
        const fcTitle = this.add.text(0, -260, "CONFIRMAR FUSIÓN", { ...this.fontTitle, fontSize:'28px' }).setOrigin(0.5);
        const fcInfo = this.add.text(0, -220, "El item resultante heredará los stats de UNO de estos dos items (50% Chance).\nAmbos se consumen.", { ...this.fontBody, align: 'center' }).setOrigin(0.5);
        
        const leftPanel = this.add.container(-200, 0); const lBg = this.add.rectangle(0, 0, 350, 400, 0x000000).setStrokeStyle(1, 0x00ffff); const lLabel = this.add.text(0, -180, "CANDIDATO A", { ...this.fontHeader, color: '#00ffff' }).setOrigin(0.5); this.fusionItem1Info = this.add.text(0, 0, "", { ...this.fontBody, align: 'center' }).setOrigin(0.5); leftPanel.add([lBg, lLabel, this.fusionItem1Info]);
        const rightPanel = this.add.container(200, 0); const rBg = this.add.rectangle(0, 0, 350, 400, 0x000000).setStrokeStyle(1, 0xff00ff); const rLabel = this.add.text(0, -180, "CANDIDATO B", { ...this.fontHeader, color: '#ff00ff' }).setOrigin(0.5); this.fusionItem2Info = this.add.text(0, 0, "", { ...this.fontBody, align: 'center' }).setOrigin(0.5); rightPanel.add([rBg, rLabel, this.fusionItem2Info]);
        const confirmBtn = this.add.rectangle(0, 250, 300, 60, 0x006400).setInteractive({useHandCursor:true}); const confirmTxt = this.add.text(0, 250, "¡PROBAR SUERTE!", this.fontBtn).setOrigin(0.5); confirmBtn.on('pointerdown', () => this.executeFusion());
        const cancelConfirm = this.add.text(0, 320, "Volver", { ...this.fontBtn, color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5); cancelConfirm.on('pointerdown', () => { this.fusionConfirmModal.setVisible(false); this.fusionListModal.setVisible(true); });
        this.fusionConfirmModal.add([fcBg, fcTitle, fcInfo, leftPanel, rightPanel, confirmBtn, confirmTxt, cancelConfirm]);
    }

    createInvCategoryBtn(x, y, label, cat) { const color = this.inventoryCategory === cat ? '#ffffff' : '#888888'; const btn = this.add.text(x, y, label, { ...this.fontHeader, color: color }).setInteractive({ useHandCursor: true }).setOrigin(0.5); btn.on('pointerdown', () => { this.inventoryCategory = cat; this.selectedItem = null; this.itemDetailContainer.setVisible(false); this.refreshInventory(); this.createInventoryView(this.scale.width, this.scale.height, this.scale.width/2, this.scale.height/2); }); this.invContainer.add(btn); }
    
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
            if (this.inventoryCategory === 'weapon') return i.type === 'weapon'; 
            if (this.inventoryCategory === 'armor') return i.type === 'armor' || i.type === 'offhand'; 
            if (this.inventoryCategory === 'accessory') return i.type === 'accessory'; 
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

    selectItem(item) { this.selectedItem = item; this.itemDetailContainer.setVisible(true); const itemColor = item.color || 0xffffff; const colorHex = '#' + itemColor.toString(16).padStart(6, '0'); this.detailTitle.setText(item.name); this.detailTitle.setColor(colorHex); const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats"; let infoText = `Nivel: +${item.enchant}\nRareza: ${RARITY[item.rarity].name}\nStats:\n${statsStr}`; if (item.type !== 'tower_part') { let equipped = null; if (item.type === 'weapon') equipped = gameState.equipment.mainHand; else if (item.type === 'offhand' || (item.type === 'armor' && item.subType === 'shield')) equipped = gameState.equipment.offHand; else if (item.type === 'armor') equipped = gameState.equipment.armor; else if (item.type === 'accessory') equipped = gameState.equipment.accessory; if (equipped) { infoText += `\n\n-- VS EQUIPADO --\n${equipped.name} (+${equipped.enchant})\n`; for (let key in item.stats) { const newVal = item.stats[key]; const oldVal = equipped.stats[key] || 0; const diff = newVal - oldVal; let isBetter = diff > 0; if (key === 'attackSpeed' || key === 'cdr') isBetter = diff < 0; infoText += `${key}: ${newVal} vs ${oldVal} ${isBetter ? '▲' : (diff===0 ? '=' : '▼')}\n`; } } else { infoText += `\n\n(Nada Equipado)`; } } this.detailStats.setText(infoText); if (item.type === 'tower_part') { this.equipBtn.list[1].setText("EQUIPAR EN..."); } else { this.equipBtn.list[1].setText("EQUIPAR"); } }

    // --- VISTA TORRES ---
    createTowersView(w, h, cx, cy) {
        const types = ['archer', 'cannon', 'mage']; const names = ['ARQUERO', 'CAÑÓN', 'MAGO']; const startX = w * 0.2; const gap = w * 0.3;
        types.forEach((type, i) => {
            const x = startX + (i * gap); const y = h * 0.25;
            const title = this.add.text(x, y, names[i], this.fontHeader).setOrigin(0.5); this.towersContainer.add(title);
            const statsText = this.add.text(x, y + 100, "Stats...", { ...this.fontBody, color: '#aaa', align: 'center' }).setOrigin(0.5); statsText.name = `stats_${type}`; this.towersContainer.add(statsText);
            for (let s = 1; s <= 2; s++) {
                const slotY = y + 200 + (s * 80);
                const slotBg = this.add.rectangle(x, slotY, 240, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true });
                const slotTxt = this.add.text(x, slotY, `Slot ${s}: Vacío`, { ...this.fontBody, fontSize: '12px', wordWrap: {width: 220}, align: 'center' }).setOrigin(0.5);
                slotTxt.name = `txt_${type}_slot${s}`; 
                
                slotBg.on('pointerdown', () => { 
                    const item = gameState.towerEquipment[type][`slot${s}`]; 
                    if (item) { 
                        this.showTowerUnequipModal(item, type, `slot${s}`);
                    } else { 
                        this.inventoryCategory = 'tower_part'; this.switchTab('inventory'); 
                    }
                });
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
                if (txtObj) { if (item) { const col = '#' + (item.color || 0xffffff).toString(16).padStart(6, '0'); txtObj.setText(`${item.name} (+${item.enchant})`); txtObj.setColor(col); } else { txtObj.setText("Slot Vacío (Clic para equipar)"); txtObj.setColor('#aaaaaa'); } }
            }
        });
    }
    showTowerUnequipModal(item, towerType, slotKey) {
        const modal = this.add.container(this.scale.width/2, this.scale.height/2).setDepth(2000);
        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color);
        const title = this.add.text(0, -100, item.name, { ...this.fontHeader, fontSize: '22px', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5);
        const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '');
        const info = this.add.text(0, -20, statsStr, this.fontBody).setOrigin(0.5);
        const btnUnequip = this.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true});
        const txtUnequip = this.add.text(0, 80, "DESEQUIPAR", this.fontBtn).setOrigin(0.5);
        const btnClose = this.add.text(0, 130, "Cancelar", { ...this.fontBody, color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        btnUnequip.on('pointerdown', () => { 
            if (gameState.towerEquipment[towerType][slotKey] && gameState.towerEquipment[towerType][slotKey].id === item.id) {
                gameState.towerEquipment[towerType][slotKey] = null; gameState.inventory.push(item); 
                SaveSystem.save(); this.refreshTowersView(); modal.destroy(); this.showCentralAlert("Mejora desequipada", "#ffff00");
            } else { this.showCentralAlert("Error: Ya no está equipada", "#ff0000"); modal.destroy(); }
        });
        btnClose.on('pointerdown', () => modal.destroy());
        modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]);
        this.towersContainer.add(modal);
    }

    // --- FORJA ---
    createForgeView(w, h, cx, cy) {
        this.profText = this.add.text(cx, h * 0.18, '', { ...this.fontBody, color: '#00ff00', align: 'center' }).setOrigin(0.5); this.forgeContainer.add(this.profText); this.forgeMsg = this.add.text(cx, h - 100, '', { ...this.fontHeader }).setOrigin(0.5); this.forgeContainer.add(this.forgeMsg);
        const catY = h * 0.25; this.createForgeCatBtn(w * 0.25, catY, "HERRERÍA (Armas)", 'weapon'); this.createForgeCatBtn(cx, catY, "SASTRERÍA (Armaduras)", 'armor'); this.createForgeCatBtn(w * 0.75, catY, "JOYERÍA (Accesorios)", 'accessory'); this.createForgeCatBtn(cx, catY + 50, "INGENIERÍA (Torres)", 'tower_part');
        this.recipesContainer = this.add.container(0, 0); this.forgeContainer.add(this.recipesContainer);
        const detailX = w * 0.78; const detailY = h * 0.45; this.recipeDetailContainer = this.add.container(detailX, detailY); this.forgeContainer.add(this.recipeDetailContainer);
        const detailBg = this.add.rectangle(0, 100, 300, 500, 0x000000, 0.9).setStrokeStyle(2, 0xffd700);
        this.recipeTitle = this.add.text(0, -120, "Selecciona Receta", { ...this.fontHeader, align: 'center', wordWrap: {width: 280} }).setOrigin(0.5);
        this.recipeInfo = this.add.text(0, 20, "", { ...this.fontBody, align: 'center', wordWrap: {width: 280} }).setOrigin(0.5);
        this.craftBtn = this.createActionButton(0, 250, "FORJAR", () => this.handleCraftButton());
        this.craftBtn.setVisible(false); this.recipeDetailContainer.add([detailBg, this.recipeTitle, this.recipeInfo, this.craftBtn]);
    }
    createForgeCatBtn(x, y, label, cat) { const btn = this.add.text(x, y, label, { ...this.fontHeader, color: '#ffd700' }).setInteractive({useHandCursor:true}).setOrigin(0.5); btn.on('pointerdown', () => { this.forgeCategory = cat; this.expandedRecipeId = null; this.expandedTowerType = null; this.craftSelection = { type: null, recipe: null, rarity: null, towerType: null }; this.recipeDetailContainer.setVisible(false); this.refreshForge(); }); this.forgeContainer.add(btn); }
    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`); const p = gameState.professions; this.profText.setText(`HERRERÍA: Lvl ${p.weaponsmith.level} [${p.weaponsmith.xp}/${p.weaponsmith.maxXp} XP]\nSASTRERÍA: Lvl ${p.armorsmith.level} [${p.armorsmith.xp}/${p.armorsmith.maxXp} XP]\nJOYERÍA: Lvl ${p.jewelry.level} [${p.jewelry.xp}/${p.jewelry.maxXp} XP]`);
        this.recipesContainer.removeAll(true); const w = this.scale.width; const h = this.scale.height; let startX = w * 0.15; let startY = h * 0.35; let col = 0;
        if (this.forgeCategory === 'tower_part') {
            const types = ['archer', 'cannon', 'mage']; types.forEach((t, index) => {
                const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, 0x00ffff);
                const txt = this.add.text(startX + (col * 250), startY, `Mejoras ${t.toUpperCase()}`, { ...this.fontBody, color:'#00ffff'}).setOrigin(0.5);
                btn.on('pointerdown', () => { this.expandedTowerType = (this.expandedTowerType === t) ? null : t; this.refreshForge(); });
                this.recipesContainer.add([btn, txt]); startY += 55;
                if (this.expandedTowerType === t) {
                    ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(rarity => {
                        const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, { ...this.fontBody, fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
                        rBtn.on('pointerdown', () => this.selectTowerPart(t, rarity)); this.recipesContainer.add([rBtn, rTxt]); startY += 40;
                    }); startY += 10;
                }
            }); return;
        }
        const categoryRecipes = RECIPES.filter(r => { if (this.forgeCategory === 'weapon') return r.type === 'weapon'; if (this.forgeCategory === 'armor') return r.type === 'armor' || r.type === 'offhand'; if (this.forgeCategory === 'accessory') return r.type === 'accessory'; return false; });
        categoryRecipes.forEach(recipe => {
            const btn = this.add.rectangle(startX + (col * 250), startY, 220, 45, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, 0xffffff);
            const txt = this.add.text(startX + (col * 250), startY, recipe.name, { ...this.fontBody, color:'#fff'}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.expandedRecipeId = (this.expandedRecipeId === recipe.id) ? null : recipe.id; this.refreshForge(); });
            this.recipesContainer.add([btn, txt]); startY += 55;
            if (this.expandedRecipeId === recipe.id) {
                ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(rarity => {
                    const rData = RARITY[rarity]; const rBtn = this.add.rectangle(startX + (col * 250) + 20, startY, 180, 35, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rData.color); const rTxt = this.add.text(startX + (col * 250) + 20, startY, rData.name, { ...this.fontBody, fontSize:'12px', color: '#' + rData.color.toString(16)}).setOrigin(0.5);
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
    handleCraftButton() { const sel = this.craftSelection; if (!sel.type) return; if (sel.type === 'item') { this.executeCraftItem(sel.recipe, sel.rarity); } else if (sel.type === 'tower') { this.executeCraftTower(sel.towerType, sel.rarity); } }
    executeCraftItem(recipe, rarityKey) {
        const rarity = RARITY[rarityKey]; const cost = Math.floor(recipe.cost * rarity.mult);
        if (gameState.gold < cost) { this.forgeMsg.setText("¡Falta Oro!"); this.forgeMsg.setColor('#ff0000'); return; }
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        if (result.success) { gameState.gold -= cost; gameState.inventory.push(result.item); this.goldText.setText(`ORO: ${gameState.gold}`); SaveSystem.save(); const color = '#' + RARITY[rarityKey].color.toString(16).padStart(6,'0'); this.showCentralAlert(`¡FORJA EXITOSA!\n${result.item.name}`, color); } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); }
    }
    executeCraftTower(type, rarityKey) {
        const result = RPGSystem.craftTowerPart(type, rarityKey);
        if (result.success) { gameState.inventory.push(result.item); this.goldText.setText(`ORO: ${gameState.gold}`); SaveSystem.save(); const color = '#' + RARITY[rarityKey].color.toString(16).padStart(6,'0'); this.showCentralAlert(`¡INGENIERÍA EXITOSA!\n${result.item.name}`, color); } else { this.forgeMsg.setText(`ERROR: ${result.error}`); this.forgeMsg.setColor('#ff0000'); }
    }
}