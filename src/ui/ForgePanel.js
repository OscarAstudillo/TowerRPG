import { gameState, RARITY } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import SoundManager from '../systems/SoundManager.js';

export default class ForgePanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.category = 'weapon';
        this.subFilter = 'all';

        this.title = scene.add.text(width/2, height * 0.17, "FORJA DE EQUIPAMIENTO", { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.container.add(this.title);
        
        this.profText = scene.add.text(width/2, height * 0.20, '', { fontFamily: 'Roboto', fontSize: '16px', color: '#00ff00', align: 'center' }).setOrigin(0.5);
        this.container.add(this.profText);

        this.recipesContainer = scene.add.container(0, 0);
        this.detailContainer = scene.add.container(width * 0.72, height * 0.62).setVisible(false).setDepth(2000);
        this.forgeSubFilterContainer = scene.add.container(0, 0);
        
        // --- PESTAÑAS PRINCIPALES ---
        this.currentMode = 'craft'; 
        const modeY = height * 0.12; 
        
        const btnCraft = scene.add.text(width * 0.35, modeY, "FABRICAR", { fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold', color: '#ffd700', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const btnFuse = scene.add.text(width * 0.65, modeY, "FUSIONAR", { fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold', color: '#888', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnCraft.on('pointerdown', () => {
            this.currentMode = 'craft';
            btnCraft.setColor('#ffd700');
            btnFuse.setColor('#888');
            this.refresh();
        });

        btnFuse.on('pointerdown', () => {
            this.currentMode = 'fuse';
            btnFuse.setColor('#ffd700');
            btnCraft.setColor('#888');
            this.refresh();
        });
        this.container.add([btnCraft, btnFuse]);

        const catY = height * 0.24;
        this.createCatBtn(width * 0.2, catY, "ARMAS", 'weapon');
        this.createCatBtn(width * 0.4, catY, "ARMADURAS", 'armor');
        this.createCatBtn(width * 0.6, catY, "JOYAS", 'accessory');
        this.createCatBtn(width * 0.8, catY, "TORRES", 'tower_part');

        this.container.add([this.recipesContainer, this.detailContainer, this.forgeSubFilterContainer]);

        this.selectedItemA = null;
        this.selectedItemB = null;
    }

    createCatBtn(x, y, label, cat) {
        const btn = this.scene.add.text(x, y, label, { fontFamily: 'Cinzel', fontSize: '18px', fontStyle: 'bold', color: '#888' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.category = cat;
            this.subFilter = 'all';
            this.detailContainer.setVisible(false);
            this.selectedItemA = null;
            this.selectedItemB = null;
            this.refresh();
            this.container.list.forEach(c => { if(c.setColor && c !== this.recipesContainer && c !== this.forgeSubFilterContainer && c !== this.profText && c.text !== "FABRICAR" && c.text !== "FUSIONAR" && c !== this.title) c.setColor('#888'); });
            btn.setColor('#ffd700');
        });
        this.container.add(btn);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() {
        const p = gameState.professions;
        this.profText.setText(`Armas: ${p.weaponsmith.level} | Armaduras: ${p.armorsmith.level} | Joyas: ${p.jewelry.level}`);

        this.forgeSubFilterContainer.removeAll(true);
        this.recipesContainer.removeAll(true);

        if (this.currentMode === 'craft') {
            this.renderCraftingUI();
        } else {
            this.renderFusionUI();
        }
    }

    renderCraftingUI() {
        let subs = [];
        if (this.category === 'weapon') subs = [['TODAS','all'], ['ESPADAS','sword'], ['ARCOS','bow'], ['BASTONES','staff'], ['DAGAS','dagger']];
        else if (this.category === 'armor') subs = [['TODAS','all'], ['TELA','cloth'], ['CUERO','leather'], ['PLACAS','plate'], ['ESCUDOS','shield']];
        
        let subX = this.width * 0.2;
        subs.forEach(s => {
            const btn = this.scene.add.text(subX, this.height * 0.28, s[0], { fontFamily: 'Roboto', fontSize: '14px', color: this.subFilter === s[1] ? '#fff' : '#666' })
                .setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.subFilter = s[1]; this.refresh(); });
            this.forgeSubFilterContainer.add(btn);
            subX += 130;
        });

        let startX = this.width * 0.15; 
        let currentY = this.height * 0.35; 

        const filtered = RECIPES.filter(r => {
            if (r.isLocked && (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id))) return false;
            if (this.category === 'tower_part') return r.type === 'tower_part';
            if (this.category === 'accessory') return r.type === 'accessory';
            if (this.category === 'weapon') return r.type === 'weapon' && (this.subFilter === 'all' || r.subType === this.subFilter);
            if (this.category === 'armor') return (r.type === 'armor' || r.type === 'offhand') && (this.subFilter === 'all' || r.subType === this.subFilter);
            return false;
        });

        const grouped = {};
        filtered.forEach(r => { if (!grouped[r.tier]) grouped[r.tier] = []; grouped[r.tier].push(r); });

        Object.keys(grouped).sort((a,b)=>a-b).forEach(tier => {
            const title = this.scene.add.text(startX, currentY, `--- TIER ${tier} ---`, { fontFamily: 'Cinzel', fontSize: '20px', color: '#ffaa00', fontStyle: 'bold' }).setOrigin(0, 0.5);
            this.recipesContainer.add(title);
            currentY += 40;

            let col = 0;
            grouped[tier].forEach(recipe => {
                const strokeColor = recipe.isLocked ? 0x00ffff : 0x555555;
                const btn = this.scene.add.rectangle(startX + (col * 210), currentY, 200, 40, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, strokeColor);
                const txt = this.scene.add.text(startX + (col * 210), currentY, recipe.name, { fontFamily: 'Roboto', fontSize: '14px', color: recipe.isLocked ? '#00ffff' : '#fff', wordWrap:{width:180} }).setOrigin(0.5);
                
                btn.on('pointerdown', () => this.selectRecipe(recipe));
                this.recipesContainer.add([btn, txt]);
                col++; if(col >= 3) { col=0; currentY+=50; }
            });
            if(col>0) currentY+=50;
            currentY+=20;
        });
    }

    renderFusionUI() {
        const cx = this.width / 2;
        
        this.recipesContainer.add(this.scene.add.text(cx, this.height * 0.32, "Selecciona 2 objetos IDÉNTICOS para mejorar el nivel", { fontFamily: 'Roboto', fontSize: '16px', color: '#aaa' }).setOrigin(0.5));

        const slotA = this.createFusionSlot(cx - 120, this.height * 0.45, this.selectedItemA, "PRINCIPAL", (item) => { this.selectedItemA = null; this.refresh(); });
        const iconPlus = this.scene.add.text(cx, this.height * 0.45, "+", { fontSize: '40px', color: '#ffd700' }).setOrigin(0.5);
        const slotB = this.createFusionSlot(cx + 120, this.height * 0.45, this.selectedItemB, "SACRIFICIO", (item) => { this.selectedItemB = null; this.refresh(); });
        
        this.recipesContainer.add([slotA, iconPlus, slotB]);
        
        if (this.selectedItemA && this.selectedItemB) {
            const fuseBtn = this.scene.add.rectangle(cx, this.height * 0.58, 200, 50, 0x800080).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0xffffff);
            const fuseTxt = this.scene.add.text(cx, this.height * 0.58, "ANALIZAR FUSIÓN", { fontSize: '20px', fontStyle: 'bold', fontFamily: 'Cinzel' }).setOrigin(0.5);
            
            fuseBtn.on('pointerdown', () => this.showFusionConfirmation());
            fuseBtn.on('pointerover', () => fuseBtn.setFillStyle(0xa020a0));
            fuseBtn.on('pointerout', () => fuseBtn.setFillStyle(0x800080));

            this.recipesContainer.add([fuseBtn, fuseTxt]);
        }

        let startX = this.width * 0.2; 
        let currentY = this.height * 0.68;
        let col = 0;

        gameState.inventory.forEach(item => {
            if (!item.stats) return; 
            if (this.category === 'weapon' && item.type !== 'weapon') return;
            if (this.category === 'armor' && (item.type !== 'armor' && item.type !== 'offhand')) return;
            if (this.category === 'accessory' && item.type !== 'accessory') return;
            if (item === this.selectedItemA || item === this.selectedItemB) return;

            const slot = this.scene.add.rectangle(startX + (col * 80), currentY, 70, 70, 0x111111).setStrokeStyle(2, 0x444444).setInteractive({useHandCursor:true});
            
            let rarityColor = RARITY[item.rarity] ? RARITY[item.rarity].color : 0xffffff;
            slot.setStrokeStyle(2, rarityColor);

            const icon = this.scene.add.text(startX + (col * 80), currentY, item.name.substring(0, 2).toUpperCase(), { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            
            slot.on('pointerdown', () => {
                if (!this.selectedItemA) this.selectedItemA = item;
                else if (!this.selectedItemB) this.selectedItemB = item;
                this.refresh();
            });

            this.recipesContainer.add([slot, icon]);

            col++;
            if (col > 7) { col = 0; currentY += 80; }
        });
    }

    createFusionSlot(x, y, item, labelText, onClear) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 100, 100, 0x000000).setStrokeStyle(2, 0x444444).setInteractive();
        const label = this.scene.add.text(0, -65, labelText, { fontSize: '12px', color: '#888' }).setOrigin(0.5);

        if (item) {
            let rColor = RARITY[item.rarity].color;
            bg.setStrokeStyle(3, rColor);
            
            const name = this.scene.add.text(0, 0, item.name, { fontSize: '12px', align: 'center', wordWrap:{width:90}, fontFamily: 'Cinzel', color: '#fff' }).setOrigin(0.5);
            const level = this.scene.add.text(0, 30, `+${item.enchant||0}`, { fontSize: '16px', color: '#00ff00', fontStyle:'bold' }).setOrigin(0.5);
            const clearBtn = this.scene.add.text(40, -40, "X", { color: '#ff0000', fontSize: '20px', fontStyle: 'bold' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
            clearBtn.on('pointerdown', onClear);
            container.add([bg, label, name, level, clearBtn]);
        } else {
            const hint = this.scene.add.text(0, 0, "Vacío", { color: '#444', fontFamily: 'Roboto' }).setOrigin(0.5);
            container.add([bg, label, hint]);
        }
        return container;
    }

    selectRecipe(recipe) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedRecipe = recipe;
        this.selectedRarity = 'common'; // Reset a común al abrir

        const bg = this.scene.add.rectangle(0, 0, 450, 700, 0x111111, 0.98).setStrokeStyle(3, 0xffffff).setInteractive();
        this.modalTitle = this.scene.add.text(0, -310, recipe.name.toUpperCase(), { fontFamily: 'Cinzel', fontSize: '26px', align:'center', wordWrap:{width:400} }).setOrigin(0.5);

        // Selector de Rareza
        this.rarityContainer = this.scene.add.container(0, -260);
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        let btnX = -125;
        this.indicators = {};

        rarities.forEach(rKey => {
            const rData = RARITY[rKey];
            const btn = this.scene.add.rectangle(btnX, 0, 40, 40, rData.color).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0x000000);
            const ind = this.scene.add.rectangle(btnX, 0, 46, 46, rData.color, 0).setStrokeStyle(3, 0xffffff).setVisible(rKey === 'common');
            this.indicators[rKey] = ind;
            btn.on('pointerdown', () => {
                for(let k in this.indicators) this.indicators[k].setVisible(false);
                ind.setVisible(true);
                this.selectedRarity = rKey;
                this.updateDetailView();
            });
            this.rarityContainer.add([btn, ind]);
            btnX += 50;
        });

        // Contenedores de texto
        this.statsText = this.scene.add.text(0, -200, "", { fontFamily: 'Roboto', fontSize: '15px', align: 'left', wordWrap: {width: 400}, lineHeight: 22 }).setOrigin(0.5, 0);
        this.possibleStatsText = this.scene.add.text(0, -60, "", { fontFamily: 'Roboto', fontSize: '13px', align: 'center', wordWrap: {width: 400}, color: '#aaa' }).setOrigin(0.5, 0);
        this.matsText = this.scene.add.text(0, 80, "", { fontFamily: 'Roboto', fontSize: '15px', align: 'center', lineHeight:24 }).setOrigin(0.5, 0);

        this.craftBtn = this.createActionBtn(0, 280, "FORJAR", () => this.handleCraft());
        this.craftBtnText = this.craftBtn.list[1];
        this.craftBtnBg = this.craftBtn.list[0];

        const close = this.scene.add.text(200, -330, "X", { fontSize:'28px', color:'#ff0000', fontStyle:'bold'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
        close.on('pointerdown', () => this.detailContainer.setVisible(false));

        this.detailContainer.add([bg, this.modalTitle, this.rarityContainer, this.statsText, this.possibleStatsText, this.matsText, this.craftBtn, close]);
        this.updateDetailView();
    }

    updateDetailView() {
        const recipe = this.selectedRecipe;
        const rarity = RARITY[this.selectedRarity];
        const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');

        this.modalTitle.setColor(hexColor);
        
        // 1. Mostrar Stats Base (Escalados)
        let statsStr = `RAREZA: ${rarity.name} (x${rarity.mult.toFixed(2)})\n\n[STATS BASE]\n`;
        
        // Simular escalado para previsualización (Tier * Rareza)
        const tier = recipe.tier || 1;
        const tierMult = Math.pow(GAME_CONSTANTS.EQUIPMENT.TIER_MULTIPLIER_BASE, tier - 1);
        const rarityIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(this.selectedRarity);
        const rarityMult = Math.pow(GAME_CONSTANTS.EQUIPMENT.RARITY_STEP_MULT, rarityIndex);
        const totalMult = tierMult * rarityMult;

        // Determinar arquetipo para mostrar correctamente (esto es visual, RPGSystem lo hace real)
        const subType = recipe.subType || recipe.type;
        const archetype = GAME_CONSTANTS.BASE_STATS_RULES ? GAME_CONSTANTS.BASE_STATS_RULES[subType] : null; 
        
        if (archetype) {
            const val1 = Math.ceil(recipe.baseStats[archetype.primary] * totalMult);
            const val2 = archetype.secondary === 'attackSpeed' ? 
                         Math.round(recipe.baseStats.attackSpeed / totalMult) : // Speed baja
                         Math.ceil(recipe.baseStats[archetype.secondary] * totalMult); // Otros suben
            
            statsStr += `• ${archetype.primary.toUpperCase()}: ${val1}\n`;
            statsStr += `• ${archetype.secondary.toUpperCase()}: ${val2}\n`;
        } else {
            // Fallback
            for (let k in recipe.baseStats) {
                statsStr += `• ${k.toUpperCase()}: ${Math.ceil(recipe.baseStats[k] * totalMult)}\n`;
            }
        }
        this.statsText.setText(statsStr);

        // 2. Mostrar Posibles Atributos
        let attrText = `\n[ATRIBUTOS ALEATORIOS: ${rarity.statCount}]\nPosibles:\n`;
        const pool = RPGSystem.getStatPool(recipe);
        const poolNames = pool.map(s => s.key.toUpperCase()).join(", ");
        attrText += poolNames || "Ninguno";
        
        this.possibleStatsText.setText(attrText);

        // 3. Materiales Requeridos
        let matsStr = `\n[MATERIALES]\n`;
        let canCraft = true;
        const ingredients = recipe.ingredients || {};

        for (let matKey in ingredients) {
            const reqQty = ingredients[matKey];
            const matDef = RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey] || {name: matKey};
            
            // Lógica de consumo de rareza (Carbón es siempre común)
            const checkRarity = (matKey === 'coal') ? 'common' : this.selectedRarity;
            const owned = gameState.materials[matKey] ? (gameState.materials[matKey][checkRarity] || 0) : 0;
            
            matsStr += `${matDef.name}: ${owned} / ${reqQty}\n`; 
            if (owned < reqQty) canCraft = false;
        }
        
        const cost = Math.floor(recipe.cost * rarity.mult);
        if (gameState.gold < cost) canCraft = false;

        this.matsText.setText(matsStr);
        this.matsText.setColor(canCraft ? '#ffffff' : '#ff5555');

        this.craftBtnText.setText(`FORJAR ($${cost})`).setColor(gameState.gold >= cost ? '#ffd700' : '#ff0000');
        this.craftBtnBg.setFillStyle(canCraft ? 0x006400 : 0x333333);
        
        if(canCraft) this.craftBtnBg.setInteractive(); else this.craftBtnBg.disableInteractive();
    }

    // --- MÉTODOS DE FUSIÓN VISUAL (Ya mejorados anteriormente, los mantengo) ---
    showFusionConfirmation() {
        if (!this.selectedItemA || !this.selectedItemB) return;

        if (this.selectedItemA.recipeId !== this.selectedItemB.recipeId) {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert("Deben ser el mismo objeto", '#ff0000');
            return;
        }

        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        
        const modalContainer = this.scene.add.container(0, 0).setDepth(3000);
        const overlay = this.scene.add.rectangle(cx, cy, 2000, 2000, 0x000000, 0.9).setInteractive();
        const panel = this.scene.add.rectangle(cx, cy, 700, 500, 0x1a1a1a).setStrokeStyle(4, 0xffd700);
        
        const title = this.scene.add.text(cx, cy - 200, "CONFIRMAR FUSIÓN", { fontFamily: 'Cinzel', fontSize: '32px', color: '#ffd700', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        
        const cardA = this.createDetailCard(this.selectedItemA, "BASE (Se conserva)");
        cardA.setPosition(cx - 180, cy - 20);
        const plusSign = this.scene.add.text(cx, cy - 20, "+", { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
        const cardB = this.createDetailCard(this.selectedItemB, "MATERIAL (Se destruye)");
        cardB.setPosition(cx + 180, cy - 20);

        const nextLvl = (this.selectedItemA.enchant || 0) + 1;
        const resultText = this.scene.add.text(cx, cy + 100, `Resultado: ${this.selectedItemA.name} +${nextLvl}`, { fontFamily: 'Roboto', fontSize: '20px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);

        const btnCancel = this.scene.add.rectangle(cx - 120, cy + 180, 180, 50, 0x330000).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0xff5555);
        const txtCancel = this.scene.add.text(cx - 120, cy + 180, "CANCELAR", { fontSize: '18px', fontStyle: 'bold', fontFamily: 'Cinzel' }).setOrigin(0.5);
        
        const btnConfirm = this.scene.add.rectangle(cx + 120, cy + 180, 180, 50, 0x004400).setInteractive({useHandCursor:true}).setStrokeStyle(2, 0x00ff00);
        const txtConfirm = this.scene.add.text(cx + 120, cy + 180, "FORJAR AHORA", { fontSize: '18px', fontStyle: 'bold', fontFamily: 'Cinzel' }).setOrigin(0.5);

        btnCancel.on('pointerdown', () => modalContainer.destroy());
        overlay.on('pointerdown', () => modalContainer.destroy());
        btnConfirm.on('pointerdown', () => { this.executeFusion(); modalContainer.destroy(); });

        modalContainer.add([overlay, panel, title, cardA, cardB, plusSign, resultText, btnCancel, txtCancel, btnConfirm, txtConfirm]);
    }

    createDetailCard(item, headerText) {
        const container = this.scene.add.container(0, 0);
        const rColor = RARITY[item.rarity].color;
        const bg = this.scene.add.rectangle(0, 0, 220, 250, 0x222222).setStrokeStyle(3, rColor).setInteractive();
        const header = this.scene.add.text(0, -100, headerText, { fontSize: '12px', color: '#aaa', fontStyle: 'italic' }).setOrigin(0.5);
        const name = this.scene.add.text(0, -60, item.name, { fontFamily: 'Cinzel', fontSize: '18px', color: '#' + rColor.toString(16).padStart(6,'0'), align: 'center', wordWrap: {width: 200} }).setOrigin(0.5);
        const enchantText = this.scene.add.text(0, -20, `Nivel: +${item.enchant||0}`, { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        let statsStr = "";
        if (item.stats) {
            for (let k in item.stats) {
                if (item.stats[k] !== 0) statsStr += `${k.toUpperCase()}: ${item.stats[k]}\n`;
            }
        }
        const stats = this.scene.add.text(0, 30, statsStr, { fontSize: '14px', color: '#ccc', align: 'center', lineHeight: 20 }).setOrigin(0.5, 0);

        container.add([bg, header, name, enchantText, stats]);
        return container;
    }

    safeAddItemToInventory(item) {
        if (!item) return;
        const exists = gameState.inventory.some(i => i.id === item.id);
        if (!exists) gameState.inventory.push(item);
        else {
            item.id = RPGSystem.getUniqueId(); 
            gameState.inventory.push(item);
        }
    }

    handleCraft() {
        const recipe = this.selectedRecipe;
        const rarityKey = this.selectedRarity;
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        
        if (result.success) {
            this.safeAddItemToInventory(result.item);
            if(this.scene.updateGoldText) this.scene.updateGoldText();
            SaveSystem.save();
            this.updateDetailView();
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`¡FORJADO: ${result.item.name}!`, '#00ff00');
        } else {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(result.error, '#ff0000');
        }
    }

    executeFusion() {
        if (!this.selectedItemA || !this.selectedItemB) return;
        const result = RPGSystem.fuseItems(this.selectedItemA, this.selectedItemB);
        if (result.success) {
            SaveSystem.save();
            this.selectedItemA = null;
            this.selectedItemB = null;
            this.refresh();
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`¡ÉXITO! Objeto mejorado a +${result.newItem.upgradeLevel || result.newItem.enchant}`, '#ffd700');
            if (SoundManager.playSound) SoundManager.playSound('upgrade');
        } else {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(result.error || "Fallo", '#ff0000');
        }
    }

    createActionBtn(x, y, text, callback) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 240, 45, 0x006400).setInteractive({ useHandCursor: true }).setInteractive();
        const txt = this.scene.add.text(0, 0, text, { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }
}