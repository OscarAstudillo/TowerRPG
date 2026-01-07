import { gameState, RARITY } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import SoundManager from '../systems/SoundManager.js';
import PanelTutorial from './PanelTutorial.js'; // <--- IMPORTAR

export default class ForgePanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.category = 'weapon';
        this.subFilter = 'all';

        // Inicializar el sistema de tutorial
        this.tutorial = new PanelTutorial(scene); // <--- INSTANCIAR

        this.title = scene.add.text(width/2, height * 0.17, "FORJA DE EQUIPAMIENTO", { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.container.add(this.title);
        
        this.profText = scene.add.text(width/2, height * 0.20, '', { fontFamily: 'Roboto', fontSize: '16px', color: '#00ff00', align: 'center' }).setOrigin(0.5);
        this.container.add(this.profText);

        this.recipesContainer = scene.add.container(0, 0);
        this.detailContainer = scene.add.container(width * 0.72, height * 0.62).setVisible(false).setDepth(2000);
        this.forgeSubFilterContainer = scene.add.container(0, 0);
        
        const catY = height * 0.24;
        this.createCatBtn(width * 0.2, catY, "ARMAS", 'weapon');
        this.createCatBtn(width * 0.4, catY, "ARMADURAS", 'armor');
        this.createCatBtn(width * 0.6, catY, "JOYAS", 'accessory');
        this.createCatBtn(width * 0.8, catY, "TORRES", 'tower_part'); 

        this.container.add([this.recipesContainer, this.detailContainer, this.forgeSubFilterContainer]);
    }

    createCatBtn(x, y, label, cat) {
        const btn = this.scene.add.text(x, y, label, { fontFamily: 'Cinzel', fontSize: '18px', fontStyle: 'bold', color: '#888' })
            .setInteractive({ useHandCursor: true }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            this.category = cat;
            this.subFilter = 'all';
            this.detailContainer.setVisible(false);
            this.refresh();
            // Reset color de botones
            this.container.list.forEach(c => { 
                if(c.type === 'Text' && c !== this.title && c !== this.profText) {
                    c.setColor('#888'); 
                }
            });
            btn.setColor('#ffd700');
        });
        this.container.add(btn);
    }

    show() { 
        this.container.setVisible(true); 
        this.refresh(); 

        // --- ACTIVAR TUTORIAL ---
        this.tutorial.trigger(
            'forge', 
            'FORJA DE EQUIPAMIENTO', 
            'Aquí puedes fabricar armas, armaduras y partes de torre.\n\n1. Selecciona una RECETA de la izquierda.\n2. Elige la RAREZA deseada (si tienes los materiales).\n3. Haz clic en FORJAR para crear el ítem.'
        );
    }

    hide() { this.container.setVisible(false); }

    refresh() {
        const p = gameState.professions;
        
        let activeProf = 'smithing';
        let profName = "Herrería";
        
        if (this.category === 'accessory') { activeProf = 'jewelcrafting'; profName = "Joyería"; }
        if (this.category === 'tower_part') { activeProf = 'engineering'; profName = "Ingeniería"; }
        if (this.category === 'weapon') { activeProf = 'weaponsmith'; profName = "Armero"; }
        if (this.category === 'armor') { activeProf = 'armorsmith'; profName = "Armadura"; }
        
        const chance = RPGSystem.getProfessionChance(activeProf);
        const chancePct = (chance * 100).toFixed(1);
        const level = p[activeProf]?.level || 1;

        this.profText.setText(`${profName}: Nivel ${level} | Chance Encantamiento (+1 a +6): ${chancePct}%`);

        this.forgeSubFilterContainer.removeAll(true);
        this.recipesContainer.removeAll(true);

        this.renderCraftingUI();
    }

    renderCraftingUI() {
        let subs = [];
        // Sub-filtros para cada categoría
        if (this.category === 'weapon') subs = [['TODAS','all'], ['ESPADAS','sword'], ['ARCOS','bow'], ['BASTONES','staff'], ['DAGAS','dagger']];
        else if (this.category === 'armor') subs = [['TODAS','all'], ['TELA','cloth'], ['CUERO','leather'], ['PLACAS','plate'], ['ESCUDOS','shield']];
        else if (this.category === 'tower_part') subs = [['TODAS','all'], ['ARQUERO','archer'], ['CAÑON','cannon'], ['MAGO','mage']];
        
        let subX = this.width * 0.15;
        const gap = 110;
        
        subs.forEach(s => {
            const btn = this.scene.add.text(subX, this.height * 0.28, s[0], { fontFamily: 'Roboto', fontSize: '14px', color: this.subFilter === s[1] ? '#fff' : '#666' })
                .setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => { this.subFilter = s[1]; this.refresh(); });
            this.forgeSubFilterContainer.add(btn);
            subX += gap;
        });

        let startX = this.width * 0.15; 
        let currentY = this.height * 0.35; 

        const filtered = RECIPES.filter(r => {
            if (r.isLocked && (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id))) return false;
            
            if (this.category === 'tower_part') {
                return r.type === 'tower_part' && (this.subFilter === 'all' || r.subType === this.subFilter);
            }
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

    selectRecipe(recipe) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedRecipe = recipe;
        this.selectedRarity = 'common'; 

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

        // Contenedores
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
        
        let statsStr = `RAREZA: ${rarity.name} (x${rarity.mult.toFixed(2)})\n`;
        
        const tier = recipe.tier || 1;
        const tierMult = Math.pow(GAME_CONSTANTS.EQUIPMENT.TIER_MULTIPLIER_BASE, tier - 1);
        const rarityIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(this.selectedRarity);
        const rarityMult = Math.pow(GAME_CONSTANTS.EQUIPMENT.RARITY_STEP_MULT, rarityIndex);
        const totalMult = tierMult * rarityMult;

        const subType = recipe.subType || recipe.type;
        const archetype = (GAME_CONSTANTS.BASE_STATS_RULES && GAME_CONSTANTS.BASE_STATS_RULES[subType]) ? GAME_CONSTANTS.BASE_STATS_RULES[subType] : null;
        
        if (archetype) {
            const val1 = Math.ceil(recipe.baseStats[archetype.primary] * totalMult);
            const val2 = archetype.secondary === 'attackSpeed' ? 
                         Math.round(recipe.baseStats.attackSpeed / totalMult) : 
                         Math.ceil(recipe.baseStats[archetype.secondary] * totalMult); 
            
            statsStr += `• ${archetype.primary.toUpperCase()}: ${val1}\n`;
            statsStr += `• ${archetype.secondary.toUpperCase()}: ${val2}\n`;
        } else {
            for (let k in recipe.baseStats) {
                let val = Math.ceil(recipe.baseStats[k] * totalMult);
                if (k === 'attackSpeed') val = Math.round(recipe.baseStats[k] / totalMult);
                statsStr += `• ${k.toUpperCase()}: ${val}\n`;
            }
        }
        this.statsText.setText(statsStr);

        let attrText = `\n[ATRIBUTOS ALEATORIOS: ${rarity.statCount}]\nPosibles:\n`;
        const pool = RPGSystem.getStatPool(recipe);
        const poolNames = pool.map(s => s.key.toUpperCase()).join(", ");
        attrText += poolNames || "Ninguno";
        
        this.possibleStatsText.setText(attrText);

        let matsStr = `\n[MATERIALES]\n`;
        let canCraft = true;
        const ingredients = recipe.ingredients || {};

        for (let matKey in ingredients) {
            const reqQty = ingredients[matKey];
            const matDef = RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey] || {name: matKey};
            
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

    safeAddItemToInventory(item) {
        if (!item) return;
        if (!gameState.equipmentInventory) gameState.equipmentInventory = [];
        if (!item.id || item.id.startsWith("ITEM_")) item.id = RPGSystem.getUniqueId();
        gameState.equipmentInventory.push(item);
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
            
            let msg = `¡FORJADO: ${result.item.name}!`;
            let color = '#00ff00';
            
            const rarity = RARITY[result.item.rarity];
            const baseColor = rarity.color;

            const flash = this.scene.add.rectangle(0, 0, 450, 700, 0xffffff, 1).setAlpha(0.8);
            this.detailContainer.add(flash);
            this.scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

            this.spawnForgeParticles(0, 0, baseColor, result.enchantBonus > 0);

            if (result.enchantBonus > 0) {
                msg = `¡CRÍTICO! ${result.item.name} +${result.enchantBonus}`;
                color = '#ff00ff'; 
                SoundManager.playSound('upgrade'); 
                this.scene.cameras.main.shake(150, 0.005);
            } else {
                SoundManager.playSound('build');
            }

            if(this.scene.showCentralAlert) this.scene.showCentralAlert(msg, color);
            this.refresh(); 

        } else {
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(result.error, '#ff0000');
        }
    }

    spawnForgeParticles(x, y, color, isCrit) {
        const particleCount = isCrit ? 30 : 15;
        const speed = isCrit ? 300 : 150;
        
        for(let i=0; i<particleCount; i++) {
            const p = this.scene.add.rectangle(x, y, isCrit ? 10 : 6, isCrit ? 10 : 6, color).setDepth(2100);
            const angle = Phaser.Math.Between(0, 360) * (Math.PI/180);
            const v = Phaser.Math.Between(50, speed);
            
            this.detailContainer.add(p); 

            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * v,
                y: y + Math.sin(angle) * v,
                alpha: 0,
                scale: 0,
                duration: 600,
                ease: 'Quad.out',
                onComplete: () => p.destroy()
            });
        }
    }

    createActionBtn(x, y, text, callback) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, 240, 45, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(0, 0, text, { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }
}