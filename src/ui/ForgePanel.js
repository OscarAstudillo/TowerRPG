// src/ui/ForgePanel.js
import { gameState, RARITY } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class ForgePanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.category = 'weapon';
        this.subFilter = 'all';
        
        this.profText = scene.add.text(width/2, height * 0.17, '', { fontFamily: 'Roboto', fontSize: '25px', color: '#00ff00', align: 'center' }).setOrigin(0.5);
        this.container.add(this.profText);

        this.recipesContainer = scene.add.container(0, 0);
        this.detailContainer = scene.add.container(width * 0.72, height * 0.55).setVisible(false).setDepth(2000);
        this.forgeSubFilterContainer = scene.add.container(0, 0);
        
        const catY = height * 0.22;
        this.createCatBtn(width * 0.2, catY, "ARMAS", 'weapon');
        this.createCatBtn(width * 0.4, catY, "ARMADURAS", 'armor');
        this.createCatBtn(width * 0.6, catY, "JOYAS", 'accessory');
        this.createCatBtn(width * 0.8, catY, "TORRES", 'tower_part');

        this.container.add([this.recipesContainer, this.detailContainer, this.forgeSubFilterContainer]);
    }

    createCatBtn(x, y, label, cat) {
        const btn = this.scene.add.text(x, y, label, { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#888' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.category = cat;
            this.subFilter = 'all';
            this.detailContainer.setVisible(false);
            this.refresh();
            this.container.list.forEach(c => { if(c.setColor && c !== this.recipesContainer && c !== this.forgeSubFilterContainer && c !== this.profText) c.setColor('#888'); });
            btn.setColor('#ffd700');
        });
        this.container.add(btn);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() {
        const p = gameState.professions;
        this.profText.setText(`Niveles: Armas ${p.weaponsmith.level} | Armaduras ${p.armorsmith.level} | Joyas ${p.jewelry.level}`);

        this.forgeSubFilterContainer.removeAll(true);
        let subs = [];
        if (this.category === 'weapon') subs = [['TODAS','all'], ['ESPADAS','sword'], ['ARCOS','bow'], ['BASTONES','staff'], ['DAGAS','dagger']];
        else if (this.category === 'armor') subs = [['TODAS','all'], ['TELA','cloth'], ['CUERO','leather'], ['PLACAS','plate'], ['ESCUDOS','shield']];
        
        let subX = this.width * 0.2;
        subs.forEach(s => {
            const btn = this.scene.add.text(subX, this.height * 0.28, s[0], { fontFamily: 'Roboto', fontSize: '16px', color: this.subFilter === s[1] ? '#fff' : '#666' })
                .setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.subFilter = s[1]; this.refresh(); });
            this.forgeSubFilterContainer.add(btn);
            subX += 150;
        });

        this.recipesContainer.removeAll(true);
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
            const title = this.scene.add.text(startX, currentY, `--- TIER ${tier} ---`, { fontFamily: 'Cinzel', fontSize: '22px', color: '#ffaa00', fontStyle: 'bold' }).setOrigin(0, 0.5);
            this.recipesContainer.add(title);
            currentY += 40;

            let col = 0;
            grouped[tier].forEach(recipe => {
                const strokeColor = recipe.isLocked ? 0x00ffff : 0x555555;
                const btn = this.scene.add.rectangle(startX + (col * 210), currentY, 200, 40, 0x222222).setInteractive({useHandCursor:true}).setStrokeStyle(1, strokeColor);
                const txt = this.scene.add.text(startX + (col * 210), currentY, recipe.name, { fontFamily: 'Roboto', fontSize: '14px', color: recipe.isLocked ? '#00ffff' : '#fff' }).setOrigin(0.5);
                
                btn.on('pointerdown', () => this.selectRecipe(recipe));
                this.recipesContainer.add([btn, txt]);
                col++; if(col >= 3) { col=0; currentY+=50; }
            });
            if(col>0) currentY+=50;
            currentY+=20;
        });
    }

    selectRecipe(recipe) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedRecipe = recipe;
        this.selectedRarity = 'common';

        const bg = this.scene.add.rectangle(0, 0, 450, 650, 0x111111, 0.98).setStrokeStyle(3, 0xffffff);
        this.modalTitle = this.scene.add.text(0, -280, recipe.name.toUpperCase(), { fontFamily: 'Cinzel', fontSize: '24px' }).setOrigin(0.5);

        this.rarityContainer = this.scene.add.container(0, -230);
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

        this.statsText = this.scene.add.text(0, -120, "", { fontFamily: 'Roboto', fontSize: '16px', align: 'center', wordWrap: {width: 400} }).setOrigin(0.5, 0);
        this.matsText = this.scene.add.text(0, 100, "", { fontFamily: 'Roboto', fontSize: '16px', align: 'center' }).setOrigin(0.5, 0);

        this.craftBtn = this.createActionBtn(0, 240, "FORJAR", () => this.handleCraft());
        this.craftBtnText = this.craftBtn.list[1];
        this.craftBtnBg = this.craftBtn.list[0];

        const close = this.scene.add.text(200, -300, "X", { fontSize:'28px', color:'#ff0000', fontStyle:'bold'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
        close.on('pointerdown', () => this.detailContainer.setVisible(false));

        this.detailContainer.add([bg, this.modalTitle, this.rarityContainer, this.statsText, this.matsText, this.craftBtn, close]);
        this.updateDetailView();
    }

    updateDetailView() {
        const recipe = this.selectedRecipe;
        const rarity = RARITY[this.selectedRarity];
        const hexColor = '#' + rarity.color.toString(16).padStart(6, '0');

        this.modalTitle.setColor(hexColor);
        
        let statsStr = `Rareza: ${rarity.name} (x${rarity.mult})\n\n-- STATS BASE --\n`;
        for (let k in recipe.baseStats) {
            statsStr += `${k.toUpperCase()}: ${Math.floor(recipe.baseStats[k] * rarity.mult)}\n`;
        }
        this.statsText.setText(statsStr);

        // --- MANEJO CORRECTO DE CANTIDAD (RECIPE.QTY) ---
        const matKey = recipe.mat;
        const matDef = RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey] || {name: matKey};
        const owned = gameState.materials[matKey] ? (gameState.materials[matKey][this.selectedRarity] || 0) : 0;
        
        // Aquí leemos la cantidad de la receta (por defecto 3 si no existe)
        const req = recipe.qty || 3; 
        
        const cost = Math.floor(recipe.cost * rarity.mult);

        let matsStr = `-- REQUISITOS --\nMaterial: ${matDef.name.toUpperCase()} (${rarity.name})\n`;
        matsStr += `Tienes: ${owned} / Pide: ${req}`;
        this.matsText.setText(matsStr);
        this.matsText.setColor(owned >= req ? '#ffffff' : '#ff5555');

        const canCraft = owned >= req && gameState.gold >= cost;
        this.craftBtnText.setText(`FORJAR ($${cost})`).setColor(gameState.gold >= cost ? '#ffd700' : '#ff0000');
        this.craftBtnBg.setFillStyle(canCraft ? 0x006400 : 0x333333);
        if(canCraft) this.craftBtnBg.setInteractive(); else this.craftBtnBg.disableInteractive();
    }

    // --- FUNCIÓN HELPER PARA INVENTARIO SEGURO ---
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
        const rarity = RARITY[rarityKey];
        const cost = Math.floor(recipe.cost * rarity.mult);
        
        // Validación solo de oro aquí, RPGSystem valida materiales
        if(gameState.gold < cost) { 
            if(this.scene.showCentralAlert) this.scene.showCentralAlert("¡Falta Oro!", '#ff0000'); 
            return; 
        }
        
        // Llamada a RPGSystem (él descontará materiales y oro)
        const result = RPGSystem.craftItem(recipe.id, rarityKey);
        
        if (result.success) {
            this.safeAddItemToInventory(result.item);
            
            if(this.scene.updateGoldText) this.scene.updateGoldText();
            SaveSystem.save();
            this.updateDetailView(); // Refrescar vista (materiales bajan)
            
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`¡FORJADO: ${result.item.name}!`, '#00ff00');
        } else {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(result.error, '#ff0000');
        }
    }

    createActionBtn(x, y, text, callback) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 200, 35, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(0, 0, text, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }
}