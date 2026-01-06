import { gameState, RARITY, updatePlayerStats, canEquipItem, CLASS_RESTRICTIONS } from '../config/GameState.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { ITEM_SETS } from '../config/ItemSets.js';
import SaveSystem from '../systems/SaveSystem.js';
import RPGSystem from '../systems/RPGSystem.js';
import SoundManager from '../systems/SoundManager.js';

export default class InventoryPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.category = 'all'; 
        this.page = 0;
        this.itemsPerPage = 9; 

         this.title = scene.add.text(width/2, height * 0.17, "MOCHILA", { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.container.add(this.title);
        
        // Elementos UI
        this.gridContainer = scene.add.container(width * 0.28, height * 0.3);
        this.detailContainer = scene.add.container(width * 0.81, height * 0.50).setVisible(false);
        this.infoText = scene.add.text(50, height * 0.25, '', { fontFamily: 'Roboto', fontSize: '14px', color: '#fff' });

        // Botones Categoría
        const catY = height * 0.21;
        this.createCategoryBtn(width/2 - 300, catY, "EQUIPO", 'all');
        this.createCategoryBtn(width/2, catY, "TORRES", 'tower_part');
        this.createCategoryBtn(width/2 + 300, catY, "MATERIALES", 'mats');

        // Botones de Paginación
        this.prevBtn = scene.add.text(width * 0.25, height * 0.5, "<", { fontFamily: 'Cinzel', fontSize: '40px', color: '#ffd700', fontStyle: 'bold' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5).setVisible(false);
        this.prevBtn.on('pointerdown', () => this.changePage(-1));

        this.nextBtn = scene.add.text(width * 0.65, height * 0.5, ">", { fontFamily: 'Cinzel', fontSize: '40px', color: '#ffd700', fontStyle: 'bold' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5).setVisible(false);
        this.nextBtn.on('pointerdown', () => this.changePage(1));

        this.pageText = scene.add.text(width * 0.45, height * 0.85, "Página 1", { fontFamily: 'Roboto', fontSize: '16px', color: '#aaa' }).setOrigin(0.5);

        this.container.add([this.gridContainer, this.detailContainer, this.infoText, this.prevBtn, this.nextBtn, this.pageText]);
        
        // Inicializar Modales de Fusión
        this.createFusionModals(width/2, height/2);
    }

    createCategoryBtn(x, y, label, cat) {
        const btn = this.scene.add.text(x, y, label, { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#888' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.category = cat;
            this.page = 0; 
            this.detailContainer.setVisible(false);
            this.refresh();
            // Reset visual simple
            this.container.list.forEach(c => { 
                if(c.type === 'Text' && c !== this.infoText && c !== this.pageText && c !== this.prevBtn && c !== this.nextBtn && c !== this.title) {
                    c.setColor('#888'); 
                }
            });
            btn.setColor('#fff');
        });
        this.container.add(btn);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    changePage(delta) {
        this.page += delta;
        this.refresh();
    }

    refresh() {
        this.gridContainer.removeAll(true);
        this.infoText.setText("");

        if (this.category === 'mats') this.renderMaterials();
        else this.renderEquipment();
        
        if(this.scene.updateGoldText) this.scene.updateGoldText();
    }

    // Utilitario para formatear números a 1 decimal máximo
    formatStat(val) {
        return Math.round(val * 10) / 10;
    }

    renderEquipment() {
        const inv = gameState.equipmentInventory || [];
        const allItems = inv.filter(i => {
            if (!i) return false;
            if (this.category === 'all') return i.type !== 'tower_part';
            if (this.category === 'tower_part') return i.type === 'tower_part';
            return false;
        });

        const totalPages = Math.ceil(allItems.length / this.itemsPerPage) || 1;
        if (this.page < 0) this.page = 0;
        if (this.page >= totalPages) this.page = totalPages - 1;

        this.updatePaginationUI(totalPages);

        const startIndex = this.page * this.itemsPerPage;
        const pageItems = allItems.slice(startIndex, startIndex + this.itemsPerPage);

        let col = 0, row = 0;
        pageItems.forEach(item => {
            const itemCont = this.scene.add.container(col * 180, row * 50);
            
            let strokeColor = 0xffffff;
            if (item.rarity && RARITY[item.rarity]) strokeColor = RARITY[item.rarity].color;
            
            const bg = this.scene.add.rectangle(85, 20, 170, 40, 0x333333)
                .setInteractive({useHandCursor:true})
                .setStrokeStyle(1, strokeColor);
            
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

            const displayName = item.enchant > 0 ? `${item.name} (+${item.enchant})` : item.name;
            const txt = this.scene.add.text(40, 12, displayName, { fontFamily: 'Roboto', fontSize: '12px', color: '#fff', wordWrap:{width:120} });
            
            bg.on('pointerdown', () => this.showItemDetail(item));
            
            itemCont.add([bg, txt]);
            this.gridContainer.add(itemCont);
            col++; if(col >= 3) { col=0; row++; }
        });
    }

    renderMaterials() {
        const allMatKeys = Object.keys(gameState.materials).sort();
        
        const activeMats = allMatKeys.filter(k => {
            const matCounts = gameState.materials[k];
            const total = Object.values(matCounts).reduce((a, b) => a + b, 0);
            return total > 0;
        });

        const totalPages = Math.ceil(activeMats.length / this.itemsPerPage) || 1;
        if (this.page < 0) this.page = 0;
        if (this.page >= totalPages) this.page = totalPages - 1;

        this.updatePaginationUI(totalPages);

        const startIndex = this.page * this.itemsPerPage;
        const pageMats = activeMats.slice(startIndex, startIndex + this.itemsPerPage);

        let col = 0, row = 0;
        pageMats.forEach(k => {
            const matCounts = gameState.materials[k];
            const matName = (RAW_MATERIALS[k] || REFINED_MATERIALS[k] || {name:k}).name;
            
            const card = this.scene.add.container(col * 185, row * 115);
            const bg = this.scene.add.rectangle(85, 50, 170, 100, 0x222222).setStrokeStyle(1, 0x555555);
            
            let iconKey = 'mat_wood';
            if (k.includes('ore') || k.includes('iron')) iconKey = 'mat_ore';
            else if (k.includes('cloth') || k.includes('cotton')) iconKey = 'mat_cloth';
            else if (k.includes('leather') || k.includes('hide')) iconKey = 'mat_leather';

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
        });
    }

    updatePaginationUI(totalPages) {
        this.pageText.setText(`Página ${this.page + 1}/${totalPages}`);
        this.prevBtn.setVisible(this.page > 0);
        this.nextBtn.setVisible(this.page < totalPages - 1);
    }

    // --- COMPARADOR DE EQUIPO ---
    getEquippedComparison(item) {
        if (item.type === 'tower_part') return null; 

        const slotMap = { 
            weapon: 'mainHand', staff: 'mainHand', bow: 'mainHand', dagger: 'mainHand', sword: 'mainHand',
            offhand: 'offHand', shield: 'offHand', 
            armor: 'armor', plate: 'armor', cloth: 'armor', leather: 'armor', 
            accessory: 'accessory', ring: 'accessory' 
        };
        const targetSlot = slotMap[item.type] || slotMap[item.subType];
        
        if (!targetSlot || !gameState.equipment[targetSlot]) return null;

        return gameState.equipment[targetSlot]; 
    }

    showItemDetail(item) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedItem = item;

        const panelWidth = 360; 
        
        let colorHex = '#ffffff';
        if (item.rarity && RARITY[item.rarity]) colorHex = '#' + RARITY[item.rarity].color.toString(16).padStart(6,'0');

        const titleName = item.enchant > 0 ? `${item.name} (+${item.enchant})` : item.name;

        // Título del Item
        const title = this.scene.add.text(0, -220, titleName, { 
            fontFamily: 'Cinzel', fontSize: '20px', color: colorHex, align: 'center', wordWrap: {width: 320} 
        }).setOrigin(0.5, 0);

        // --- CONSTRUCCIÓN DE STATS CON COMPARADOR ---
        let currentY = title.y + title.height + 25;
        
        const equippedItem = this.getEquippedComparison(item);
        
        if (item.stats) {
            Object.entries(item.stats).forEach(([key, val]) => {
                if (val !== 0) {
                    const formattedVal = this.formatStat(val);
                    let diffText = "";
                    let diffColor = "#aaaaaa";

                    if (equippedItem && equippedItem.stats) {
                        const currentVal = equippedItem.stats[key] || 0;
                        const diff = val - currentVal;
                        // Formatear diferencia
                        const formattedDiff = this.formatStat(Math.abs(diff));
                        
                        if (diff > 0.09) { 
                            diffText = `(+${formattedDiff})`; 
                            diffColor = "#00ff00"; 
                        } else if (diff < -0.09) { 
                            diffText = `(-${formattedDiff})`; 
                            diffColor = "#ff0000"; 
                        }
                    }

                    const lineContainer = this.scene.add.container(0, currentY);
                    const statLabel = this.scene.add.text(-150, 0, `${key.toUpperCase()}: ${formattedVal}`, { fontFamily: 'Roboto', fontSize: '14px', color: '#dddddd' });
                    const diffLabel = this.scene.add.text(statLabel.width - 130, 0, diffText, { fontFamily: 'Roboto', fontSize: '14px', color: diffColor, fontStyle: 'bold' });
                    
                    lineContainer.add([statLabel, diffLabel]);
                    this.detailContainer.add(lineContainer);
                    currentY += 20;
                }
            });
        } else {
            const noStats = this.scene.add.text(0, currentY, "Sin estadísticas", { fontFamily: 'Roboto', fontSize: '14px', color: '#aaa' }).setOrigin(0.5, 0);
            this.detailContainer.add(noStats);
            currentY += 25;
        }

        // --- INFO EXTRA (SETS, RAREZA) ---
        let rarityName = item.rarity ? RARITY[item.rarity].name : 'Desconocido';
        let extraInfo = `\nRareza: ${rarityName}`;
        
        if (ITEM_SETS && item.recipeId) {
            for (let setKey in ITEM_SETS) {
                const set = ITEM_SETS[setKey];
                if (set.items.includes(item.recipeId)) {
                    extraInfo += `\n✨ SET: ${set.name} ✨`;
                }
            }
        }

        const extraTxt = this.scene.add.text(0, currentY + 10, extraInfo, { 
            fontFamily: 'Roboto', fontSize: '13px', align: 'center', color: '#aaaaaa'
        }).setOrigin(0.5, 0);
        this.detailContainer.add(extraTxt);

        currentY = extraTxt.y + extraTxt.height + 40;

        // BOTONES
        const equipLabel = item.type === 'tower_part' ? "EQUIPAR (Torre)" : "EQUIPAR";
        const equipBtnContainer = this.createActionBtn(0, currentY, equipLabel, 0x006400, () => this.actionEquip(item));
        
        currentY += 55;
        const fuseBtnContainer = this.createActionBtn(0, currentY, "FUSIONAR...", 0x00008b, () => this.initiateFusion(item));
        
        currentY += 55;
        const sellBtnContainer = this.createActionBtn(0, currentY, "VENDER", 0x8b0000, () => this.actionSell(item));

        const totalContentHeight = (currentY + 60) - (-250); 
        const bg = this.scene.add.rectangle(0, -250 + (totalContentHeight / 2), panelWidth, totalContentHeight, 0x000000, 0.95)
            .setStrokeStyle(3, item.rarity ? RARITY[item.rarity].color : 0xffffff)
            .setInteractive();
        
        this.detailContainer.addAt(bg, 0);
        // !! IMPORTANTE: Agregar todos los elementos al contenedor
        this.detailContainer.add([title, equipBtnContainer, fuseBtnContainer, sellBtnContainer]);
    }

    createActionBtn(x, y, text, color, callback) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 240, 45, color).setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(0, 0, text, { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container; // IMPORTANTE: Devolver container
    }

    safeAddItemToInventory(item) {
        if (!item) return;
        if (!gameState.equipmentInventory) gameState.equipmentInventory = [];
        item.id = RPGSystem.getUniqueId(); 
        gameState.equipmentInventory.push(item);
    }

    actionEquip(item) {
        if (item.type !== 'tower_part' && !canEquipItem(gameState.selectedClass, item)) {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert("¡Clase incorrecta!", '#ff0000');
            return;
        }

        const inv = gameState.equipmentInventory;
        const idx = inv.findIndex(i => String(i.id) === String(item.id));
        if (idx === -1) return;
        
        inv.splice(idx, 1);
        
        if (item.type === 'tower_part') {
            const type = item.towerType || item.subType;
            if (!gameState.towerEquipment[type].slot1) {
                gameState.towerEquipment[type].slot1 = item;
            } else if (!gameState.towerEquipment[type].slot2) {
                gameState.towerEquipment[type].slot2 = item;
            } else {
                const old = gameState.towerEquipment[type].slot1;
                this.safeAddItemToInventory(old);
                gameState.towerEquipment[type].slot1 = item;
            }
            this.scene.switchTab('towers');
        } else {
            const slotMap = { 
                weapon: 'mainHand', staff: 'mainHand', bow: 'mainHand', dagger: 'mainHand', sword: 'mainHand',
                offhand: 'offHand', shield: 'offHand', 
                armor: 'armor', plate: 'armor', cloth: 'armor', leather: 'armor', 
                accessory: 'accessory', ring: 'accessory' 
            };
            let targetSlot = slotMap[item.type] || slotMap[item.subType];
            
            const classRules = CLASS_RESTRICTIONS[gameState.selectedClass];
            if (item.type === 'weapon' && classRules && classRules.canDualWield) {
                if (gameState.equipment.mainHand && !gameState.equipment.offHand) {
                    if (!gameState.equipment.mainHand.twoHanded && !item.twoHanded) {
                        targetSlot = 'offHand';
                    }
                }
            }

            if (targetSlot) {
                if (item.twoHanded && targetSlot === 'mainHand') {
                     if (gameState.equipment.offHand) {
                         this.safeAddItemToInventory(gameState.equipment.offHand);
                         gameState.equipment.offHand = null;
                     }
                }
                if (targetSlot === 'offHand' && gameState.equipment.mainHand && gameState.equipment.mainHand.twoHanded) {
                    this.safeAddItemToInventory(gameState.equipment.mainHand);
                    gameState.equipment.mainHand = null;
                }

                if (gameState.equipment[targetSlot]) {
                    this.safeAddItemToInventory(gameState.equipment[targetSlot]);
                }
                gameState.equipment[targetSlot] = item;
            }
            this.scene.switchTab('hero');
        }
        
        updatePlayerStats();
        SaveSystem.save();
        this.detailContainer.setVisible(false);
        this.refresh();
    }

    actionSell(item) {
        const inv = gameState.equipmentInventory;
        const idx = inv.findIndex(i => i.id === item.id);
        if(idx === -1) return;
        
        const price = 50; 
        gameState.gold += price;
        inv.splice(idx, 1);
        
        SaveSystem.save();
        this.detailContainer.setVisible(false);
        this.refresh();
        
        if(this.scene.updateGoldText) this.scene.updateGoldText();
        if(this.scene.showCentralAlert) this.scene.showCentralAlert(`Vendido por ${price} oro`, '#ffff00');
    }

    // --- LÓGICA DE FUSIÓN EN MOCHILA ---
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
        const inv = gameState.equipmentInventory || [];
        const candidates = inv.filter(i => 
            String(i.id) !== String(this.itemToFuse1.id) && 
            i.recipeId === this.itemToFuse1.recipeId &&
            i.rarity === this.itemToFuse1.rarity &&
            i.enchant === this.itemToFuse1.enchant
        );
        
        if (candidates.length === 0) {
            this.fusionList.add(this.scene.add.text(0, 0, "No hay items idénticos para fusionar", { fontFamily: 'Roboto', color:'#aaa' }).setOrigin(0.5));
            return;
        }

        let y = 0;
        candidates.slice(0, 7).forEach(item => {
            let rColor = item.rarity && RARITY[item.rarity] ? RARITY[item.rarity].color : 0xffffff;
            const btn = this.scene.add.rectangle(0, y, 450, 45, 0x333333).setInteractive({useHandCursor:true}).setStrokeStyle(1, rColor);
            const txt = this.scene.add.text(0, y, `${item.name} (+${item.enchant})`, { fontFamily: 'Roboto', fontSize:'16px' }).setOrigin(0.5);
            btn.on('pointerdown', () => this.showFusionConfirmation(item));
            this.fusionList.add([btn, txt]);
            y += 55;
        });
    }

    // --- NUEVO: VENTANA DE CONFIRMACIÓN VISUAL MEJORADA ---
    showFusionConfirmation(item2) {
        this.fusionListModal.setVisible(false);
        
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        
        const modalContainer = this.scene.add.container(0, 0).setDepth(3000);
        const overlay = this.scene.add.rectangle(cx, cy, 2000, 2000, 0x000000, 0.85).setInteractive();
        const panel = this.scene.add.rectangle(cx, cy, 700, 500, 0x111111).setStrokeStyle(4, 0xffd700);
        
        const title = this.scene.add.text(cx, cy - 200, "CONFIRMAR FUSIÓN", { fontFamily: 'Cinzel', fontSize: '30px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        
        // --- VISUALIZACIÓN DE FUSIÓN ---
        const item1Card = this.createFusionCard(cx - 180, cy - 20, this.itemToFuse1, "BASE (Se mantiene)");
        const item2Card = this.createFusionCard(cx + 180, cy - 20, item2, "SACRIFICIO (Se pierde)");
        
        const plusSign = this.scene.add.text(cx, cy - 20, "+", { fontSize: '60px', color: '#fff', fontStyle:'bold' }).setOrigin(0.5);

        // Botones
        const btnCancelContainer = this.createActionBtn(cx - 150, cy + 180, "CANCELAR", 0x550000, () => {
            modalContainer.destroy();
            this.fusionListModal.setVisible(true);
        });
        
        const btnConfirmContainer = this.createActionBtn(cx + 150, cy + 180, "¡FUSIONAR!", 0x006400, () => {
            this.scene.tweens.add({
                targets: [item1Card, item2Card, plusSign],
                scale: 0,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    this.scene.cameras.main.flash(400, 255, 255, 255);
                    this.executeFusion(item2);
                    modalContainer.destroy();
                }
            });
        });

        modalContainer.add([overlay, panel, title, item1Card, item2Card, plusSign, btnCancelContainer, btnConfirmContainer]);
    }

    createFusionCard(x, y, item, labelText) {
        const container = this.scene.add.container(x, y);
        let color = RARITY[item.rarity] ? RARITY[item.rarity].color : 0xffffff;
        
        const bg = this.scene.add.rectangle(0, 0, 240, 300, 0x222222).setStrokeStyle(3, color);
        const label = this.scene.add.text(0, -130, labelText, { fontSize: '14px', color: '#aaa', fontStyle:'italic' }).setOrigin(0.5);
        
        const name = this.scene.add.text(0, -90, item.name, { fontSize: '18px', color: '#fff', fontStyle: 'bold', wordWrap:{width:220}, align:'center' }).setOrigin(0.5);
        const enchant = this.scene.add.text(0, -50, `Nivel: +${item.enchant}`, { fontSize: '20px', color: '#00ff00' }).setOrigin(0.5);
        
        let statsStr = "";
        if (item.stats) {
            Object.entries(item.stats).forEach(([k, v]) => {
                if (v > 0) statsStr += `${k.toUpperCase()}: ${this.formatStat(v)}\n`;
            });
        }
        const stats = this.scene.add.text(0, 20, statsStr, { fontSize: '14px', color: '#ddd', align: 'center' }).setOrigin(0.5);

        container.add([bg, label, name, enchant, stats]);
        return container;
    }

    executeFusion(item2) {
        const res = RPGSystem.fuseSpecificItems(this.itemToFuse1, item2);
        if (res.success) {
            const inv = gameState.equipmentInventory;
            let idx = inv.findIndex(i => i.id === this.itemToFuse1.id);
            if (idx > -1) inv.splice(idx, 1);
            idx = inv.findIndex(i => i.id === item2.id);
            if (idx > -1) inv.splice(idx, 1);

            this.safeAddItemToInventory(res.item);
            
            this.fusionListModal.setVisible(false);
            this.detailContainer.setVisible(false);
            this.refresh();
            SaveSystem.save();
            
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`FUSIÓN EXITOSA: ${res.item.name}`, '#00ff00');
            if (SoundManager.playSound) SoundManager.playSound('upgrade');
        } else {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(res.error || "Fallo", '#ff0000');
        }
    }
}