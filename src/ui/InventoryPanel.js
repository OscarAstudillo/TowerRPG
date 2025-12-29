// src/ui/InventoryPanel.js
import { gameState, RARITY, updatePlayerStats } from '../config/GameState.js'; // AGREGADO updatePlayerStats
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { ITEM_SETS } from '../config/ItemSets.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class InventoryPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.category = 'all'; 
        
        // Elementos UI
        this.gridContainer = scene.add.container(width * 0.28, height * 0.3);
        this.detailContainer = scene.add.container(width * 0.78, height * 0.35).setVisible(false); // Bajado un poco el centro
        this.infoText = scene.add.text(50, height * 0.25, '', { fontFamily: 'Roboto', fontSize: '14px', color: '#fff' });

        // Botones Categoría
        const catY = height * 0.18;
        this.createCategoryBtn(width/2 - 300, catY, "EQUIPO", 'all');
        this.createCategoryBtn(width/2, catY, "TORRES", 'tower_part');
        this.createCategoryBtn(width/2 + 300, catY, "MATERIALES", 'mats');

        this.container.add([this.gridContainer, this.detailContainer, this.infoText]);
        
        // Inicializar Modales de Fusión
        this.createFusionModals(width/2, height/2);
    }

    createCategoryBtn(x, y, label, cat) {
        const btn = this.scene.add.text(x, y, label, { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#888' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.category = cat;
            this.detailContainer.setVisible(false);
            this.refresh();
            this.container.list.forEach(c => { if(c.setColor && c.text && c !== this.infoText) c.setColor('#888'); });
            btn.setColor('#fff');
        });
        this.container.add(btn);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() {
        this.gridContainer.removeAll(true);
        this.infoText.setText("");

        if (this.category === 'mats') this.renderMaterials();
        else this.renderEquipment();
        
        if(this.scene.updateGoldText) this.scene.updateGoldText();
    }

    renderEquipment() {
        const filtered = gameState.inventory.filter(i => {
            if (!i) return false;
            if (this.category === 'all') return i.type !== 'tower_part';
            if (this.category === 'tower_part') return i.type === 'tower_part';
            return false;
        });

        let col = 0, row = 0;
        filtered.forEach(item => {
            const itemCont = this.scene.add.container(col * 180, row * 50);
            const bg = this.scene.add.rectangle(85, 20, 170, 40, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, item.color);
            
            let iconKey = 'icon_sword';
            if(item.type === 'bow') iconKey = 'icon_bow';
            else if(item.type === 'staff') iconKey = 'icon_staff';
            else if(item.type === 'dagger') iconKey = 'icon_dagger';
            else if(item.type === 'armor' || item.type === 'offhand') iconKey = 'icon_shield';
            else if(item.type === 'accessory') iconKey = 'icon_accessory';
            else if(item.type === 'tower_part') iconKey = 'icon_tower_part';

            if (this.scene.textures.exists(iconKey)) {
                const icon = this.scene.add.sprite(20, 20, iconKey).setScale(0.7);
                itemCont.add(icon);
            }

            const txt = this.scene.add.text(40, 12, item.name, { fontFamily: 'Roboto', fontSize: '12px', color: '#fff', wordWrap:{width:120} });
            bg.on('pointerdown', () => this.showItemDetail(item));
            
            itemCont.add([bg, txt]);
            this.gridContainer.add(itemCont);
            col++; if(col >= 3) { col=0; row++; }
        });
    }

    renderMaterials() {
        let col = 0, row = 0;
        const allMatKeys = Object.keys(gameState.materials).sort();
        for(const k of allMatKeys) {
            const matCounts = gameState.materials[k];
            const total = Object.values(matCounts).reduce((a, b) => a + b, 0);
            if (total === 0) continue;

            const matName = (RAW_MATERIALS[k] || REFINED_MATERIALS[k] || {name:k}).name;
            const card = this.scene.add.container(col * 185, row * 115);
            const bg = this.scene.add.rectangle(85, 50, 170, 100, 0x222222).setStrokeStyle(1, 0x555555);
            
            let iconKey = 'mat_wood';
            if (k.includes('ore') || k.includes('iron')) iconKey = 'mat_ore';
            else if (k.includes('cloth') || k.includes('cotton')) iconKey = 'mat_cloth';
            else if (k.includes('leather')) iconKey = 'mat_leather';

            if (this.scene.textures.exists(iconKey)) {
                const icon = this.scene.add.sprite(30, 30, iconKey).setScale(0.8);
                card.add(icon);
            }

            const title = this.scene.add.text(50, 8, matName.toUpperCase(), { fontFamily: 'Cinzel', fontSize: '13px', color: '#ffd700', fontStyle: 'bold' });
            card.add([bg, title]);

            let yPos = 30;
            ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].forEach(r => {
                if(matCounts[r] && matCounts[r] > 0) {
                    const rData = RARITY[r];
                    const txt = this.scene.add.text(60, yPos, `${matCounts[r]} ${rData.name}`, { fontFamily: 'Roboto', fontSize: '11px', color: '#fff' });
                    card.add(txt);
                    yPos += 14;
                }
            });
            this.gridContainer.add(card);
            col++; if (col >= 3) { col = 0; row++; }
        }
    }

    showItemDetail(item) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedItem = item;

        // 1. TÍTULO
        const title = this.scene.add.text(0, -220, item.name, { 
            fontFamily: 'Cinzel', fontSize: '18px', color: '#' + item.color.toString(16).padStart(6,'0'), align: 'center', wordWrap: {width: 280} 
        }).setOrigin(0.5, 0);

        // 2. TEXTO DE STATS (Contenido dinámico)
        const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats";
        let infoText = `Nivel: +${item.enchant}\nRareza: ${RARITY[item.rarity].name}\n\n-- STATS --\n${statsStr}`;
        
        if (ITEM_SETS) {
            for (let setKey in ITEM_SETS) {
                const set = ITEM_SETS[setKey];
                if (set.items.includes(item.recipeId)) {
                    infoText += `\n\n✨ SET: ${set.name} ✨\n`;
                    set.bonuses.forEach(b => infoText += ` (${b.count}) ${b.desc}\n`);
                }
            }
        }

        const statsTxt = this.scene.add.text(0, title.y + title.height + 20, infoText, { 
            fontFamily: 'Roboto', fontSize: '13px', align: 'left', wordWrap: {width: 300}, color: '#dddddd' 
        }).setOrigin(0.5, 0);

        // 3. POSICIONAMIENTO DINÁMICO DE BOTONES
        // Calculamos dónde termina el texto para poner los botones abajo
        let currentY = statsTxt.y + statsTxt.height + 30;

        const equipLabel = item.type === 'tower_part' ? "EQUIPAR (Torre)" : "EQUIPAR";
        const equipBtn = this.createActionBtn(0, currentY, equipLabel, 0x006400, () => this.actionEquip(item));
        
        currentY += 50;
        const fuseBtn = this.createActionBtn(0, currentY, "FUSIONAR...", 0x00008b, () => this.initiateFusion(item));
        
        currentY += 50;
        const sellBtn = this.createActionBtn(0, currentY, "VENDER", 0x8b0000, () => this.actionSell(item));

        // 4. FONDO AJUSTABLE
        // El fondo crece según hasta donde lleguen los botones
        const totalHeight = (currentY + 50) - (-250); // Desde arriba hasta el último botón
        const bg = this.scene.add.rectangle(0, -250 + (totalHeight/2), 340, totalHeight + 40, 0x000000, 0.95).setStrokeStyle(2, item.color);
        
        // Aseguramos que el fondo se dibuje primero
        this.detailContainer.add([bg, title, statsTxt, equipBtn, fuseBtn, sellBtn]);
    }

    createActionBtn(x, y, text, color, callback) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 220, 40, color).setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(0, 0, text, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    // --- NUEVA FUNCIÓN INTERNA PARA EVITAR ERRORES ---
    safeAddItemToInventory(item) {
        if (!item) return;
        const exists = gameState.inventory.some(i => i.id === item.id);
        if (!exists) gameState.inventory.push(item);
        else {
            item.id = RPGSystem.getUniqueId(); // Generar nuevo ID si hay conflicto
            gameState.inventory.push(item);
        }
    }
    // -------------------------------------------------

    actionEquip(item) {
        const idx = gameState.inventory.findIndex(i => String(i.id) === String(item.id));
        if (idx === -1) return;
        
        // Quitar del inventario
        gameState.inventory.splice(idx, 1);
        
        if (item.type === 'tower_part') {
            const type = item.towerType || item.subType;
            // Lógica de slots de torre
            if (!gameState.towerEquipment[type].slot1) {
                gameState.towerEquipment[type].slot1 = item;
            } else if (!gameState.towerEquipment[type].slot2) {
                gameState.towerEquipment[type].slot2 = item;
            } else {
                // Swap Slot 1 por defecto
                const old = gameState.towerEquipment[type].slot1;
                this.safeAddItemToInventory(old);
                gameState.towerEquipment[type].slot1 = item;
            }
            this.scene.switchTab('towers');
        } else {
            // Lógica de héroe
            const slotMap = { weapon: 'mainHand', staff: 'mainHand', bow: 'mainHand', dagger: 'mainHand', sword: 'mainHand', offhand: 'offHand', shield: 'offHand', armor: 'armor', plate: 'armor', cloth: 'armor', leather: 'armor', accessory: 'accessory', ring: 'accessory' };
            const slot = slotMap[item.type] || slotMap[item.subType];
            
            if (slot) {
                // Arma 2 Manos
                if (item.twoHanded && slot === 'mainHand') {
                     if (gameState.equipment.offHand) {
                         this.safeAddItemToInventory(gameState.equipment.offHand);
                         gameState.equipment.offHand = null;
                     }
                }

                if (gameState.equipment[slot]) {
                    this.safeAddItemToInventory(gameState.equipment[slot]);
                }
                gameState.equipment[slot] = item;
            }
            this.scene.switchTab('hero');
        }
        
        updatePlayerStats();
        SaveSystem.save();
        this.detailContainer.setVisible(false);
        this.refresh();
    }

    actionSell(item) {
        const idx = gameState.inventory.findIndex(i => i.id === item.id);
        if(idx === -1) return;
        
        const price = 50; // O usar config
        gameState.gold += price;
        gameState.inventory.splice(idx, 1);
        
        SaveSystem.save();
        this.detailContainer.setVisible(false);
        this.refresh();
        
        if(this.scene.updateGoldText) this.scene.updateGoldText();
        if(this.scene.showCentralAlert) this.scene.showCentralAlert(`Vendido por ${price} oro`, '#ffff00');
    }

    // --- FUSIÓN UI ---
    createFusionModals(cx, cy) {
        this.fusionListModal = this.scene.add.container(cx, cy).setVisible(false).setDepth(2000);
        const fBg = this.scene.add.rectangle(0, 0, 600, 500, 0x000000).setStrokeStyle(2, 0x00ffff).setInteractive();
        const fTitle = this.scene.add.text(0, -220, "SELECCIONA 2° ITEM (SACRIFICIO)", { fontFamily: 'Cinzel', fontSize: '24px' }).setOrigin(0.5);
        this.fusionList = this.scene.add.container(0, -180); 
        
        const fCancel = this.scene.add.text(0, 220, "CANCELAR", { fontFamily: 'Roboto', fontSize: '20px', color: '#ff0000' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
        fCancel.on('pointerdown', () => this.fusionListModal.setVisible(false));
        
        this.fusionListModal.add([fBg, fTitle, this.fusionList, fCancel]);
    }

    initiateFusion(item) {
        this.itemToFuse1 = item;
        this.fusionListModal.setVisible(true);
        this.populateFusionList(); 
    }

    populateFusionList() {
        this.fusionList.removeAll(true);
        const candidates = gameState.inventory.filter(i => String(i.id) !== String(this.itemToFuse1.id) && i.type === this.itemToFuse1.type && i.rarity === this.itemToFuse1.rarity);
        
        if (candidates.length === 0) {
            this.fusionList.add(this.scene.add.text(0, 0, "No hay items compatibles", { fontFamily: 'Roboto' }).setOrigin(0.5));
            return;
        }

        let y = 0;
        candidates.slice(0, 7).forEach(item => {
            const btn = this.scene.add.rectangle(0, y, 400, 40, 0x333333).setInteractive({useHandCursor:true});
            const txt = this.scene.add.text(0, y, `${item.name}`, { fontFamily: 'Roboto' }).setOrigin(0.5);
            btn.on('pointerdown', () => this.executeFusion(item));
            this.fusionList.add([btn, txt]);
            y += 50;
        });
    }

    executeFusion(item2) {
        const res = RPGSystem.fuseSpecificItems(this.itemToFuse1, item2);
        if (res.success) {
            // Eliminar items viejos
            gameState.inventory = gameState.inventory.filter(i => i.id !== this.itemToFuse1.id && i.id !== item2.id);
            this.safeAddItemToInventory(res.item);
            
            this.fusionListModal.setVisible(false);
            this.detailContainer.setVisible(false);
            this.refresh();
            SaveSystem.save();
            
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`FUSIÓN EXITOSA: ${res.item.name}`, '#00ff00');
        }
    }
}