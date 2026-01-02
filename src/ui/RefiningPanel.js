import { gameState, RARITY } from '../config/GameState.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class RefiningPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.filter = 'wood';
        
        this.title = scene.add.text(width/2, height * 0.17, "REFINACIÓN", { fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.container.add(this.title);
        
        this.profText = scene.add.text(width/2, height * 0.2, "", { fontFamily: 'Roboto', fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
        this.container.add(this.profText);
        
        this.recipeList = scene.add.container(0, 0);
        this.container.add(this.recipeList);
        
        // Modal de Detalle
        this.detailContainer = scene.add.container(width/2, height * 0.55).setVisible(false).setDepth(2000);
        this.container.add(this.detailContainer);

        const cats = ['wood', 'ore', 'cloth', 'leather'];
        const labels = ['MADERA', 'MINERAL', 'TELA', 'CUERO'];
        let rx = width/2 - 300;
        
        cats.forEach((cat, i) => {
            const btn = scene.add.text(rx + (i * 200), height * 0.28, labels[i], { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#888' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.filter = cat;
                this.detailContainer.setVisible(false); // Ocultar detalle al cambiar filtro
                this.refresh();
                this.container.list.forEach(c => { if(c.setColor && labels.includes(c.text)) c.setColor('#888'); });
                btn.setColor('#fff');
            });
            this.container.add(btn);
        });
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() {
        const p = gameState.professions.refining || { level: 1, xp: 0, maxXp: 100 };
        this.profText.setText(`Nivel de Refinación: ${p.level} (${p.xp}/${p.maxXp})`);
        
        this.recipeList.removeAll(true);
        let y = this.height * 0.35;
        
        const filtered = REFINING_RECIPES.filter(r => {
            if (this.filter === 'wood') return r.input.wood || r.input.cedar || r.input.ebony;
            if (this.filter === 'ore') return r.input.copper || r.input.iron || r.input.mithril;
            if (this.filter === 'cloth') return r.input.scraps || r.input.cotton || r.input.silk;
            if (this.filter === 'leather') return r.input.hide || r.input.leather || r.input.scale;
            return true;
        });

        filtered.forEach(recipe => {
            const product = REFINED_MATERIALS[recipe.output]?.name || recipe.output;
            
            const btn = this.scene.add.rectangle(this.width/2, y, 700, 50, 0x222222).setStrokeStyle(1, 0x00ff00);
            btn.setInteractive({useHandCursor:true}); 
            btn.on('pointerdown', () => this.showRefineDetail(recipe)); 
            
            // Mostrar nombre genérico de la receta
            const txt = this.scene.add.text(this.width/2, y, `${recipe.name} -> ${product}`, { fontFamily: 'Roboto', fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            
            this.recipeList.add([btn, txt]);
            y += 60;
        });
    }

    showRefineDetail(recipe) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedRecipe = recipe;
        this.selectedRarity = 'common'; // Default

        const bg = this.scene.add.rectangle(0, 0, 450, 500, 0x111111, 0.98).setStrokeStyle(3, 0xffffff);
        const title = this.scene.add.text(0, -200, recipe.name.toUpperCase(), { fontFamily: 'Cinzel', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        // Selector de Rareza
        this.rarityContainer = this.scene.add.container(0, -150);
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

        // Información
        this.infoText = this.scene.add.text(0, 0, "", { fontFamily: 'Roboto', fontSize: '16px', align: 'center' }).setOrigin(0.5);

        // Botón Acción
        this.actionBtn = this.scene.add.rectangle(0, 150, 250, 50, 0x006400).setInteractive({useHandCursor:true});
        this.actionBtnText = this.scene.add.text(0, 150, "REFINAR", { fontFamily: 'Roboto', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        this.actionBtn.on('pointerdown', () => this.executeRefine());

        // Cerrar
        const close = this.scene.add.text(180, -220, "X", { fontSize:'28px', color:'#ff0000', fontStyle:'bold'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
        close.on('pointerdown', () => this.detailContainer.setVisible(false));

        this.detailContainer.add([bg, title, this.rarityContainer, this.infoText, this.actionBtn, this.actionBtnText, close]);
        
        this.updateDetailView();
    }

    updateDetailView() {
        const recipe = this.selectedRecipe;
        const rKey = this.selectedRarity;
        const rarity = RARITY[rKey];
        
        let hasMats = true;
        let reqText = `Calidad: ${rarity.name.toUpperCase()}\n\n-- REQUISITOS --\n`;
        
        for(let mat in recipe.input) {
            const rawDef = RAW_MATERIALS[mat] || {name: mat};
            const qtyReq = recipe.input[mat];
            const qtyOwned = gameState.materials[mat] ? (gameState.materials[mat][rKey] || 0) : 0;
            
            reqText += `${rawDef.name} (${rarity.name}): ${qtyOwned} / ${qtyReq}\n`;
            if (qtyOwned < qtyReq) hasMats = false;
        }
        
        const outputDef = REFINED_MATERIALS[recipe.output] || {name: recipe.output};
        reqText += `\nResultado: 1 ${outputDef.name} (${rarity.name})`;

        this.infoText.setText(reqText);
        this.infoText.setColor(hasMats ? '#ffffff' : '#ff5555');
        
        this.actionBtn.setFillStyle(hasMats ? 0x006400 : 0x333333);
        if(hasMats) this.actionBtn.setInteractive(); else this.actionBtn.disableInteractive();
    }

    executeRefine() {
        // Lógica manual porque RPGSystem.refineMaterial quizás solo usaba common
        const recipe = this.selectedRecipe;
        const rKey = this.selectedRarity;
        
        // Verificar
        for(let mat in recipe.input) {
            const qtyOwned = gameState.materials[mat][rKey] || 0;
            if (qtyOwned < recipe.input[mat]) return; // Doble check
        }

        // Consumir
        for(let mat in recipe.input) {
            gameState.materials[mat][rKey] -= recipe.input[mat];
        }

        // Producir
        if (!gameState.materials[recipe.output]) {
            // Inicializar si no existe
            gameState.materials[recipe.output] = { common:0, uncommon:0, rare:0, epic:0, legendary:0, mythic:0 };
        }
        gameState.materials[recipe.output][rKey]++;
        
        // XP
        const xp = GAME_CONSTANTS.PROFESSIONS.XP_PER_REFINE || 10;
        gameState.professions.refining.xp += xp;
        if(gameState.professions.refining.xp >= gameState.professions.refining.maxXp) {
            gameState.professions.refining.level++;
            gameState.professions.refining.xp = 0;
            gameState.professions.refining.maxXp = Math.floor(gameState.professions.refining.maxXp * 1.2);
        }

        SaveSystem.save();
        this.updateDetailView(); // Actualizar vista
        this.refresh(); // Actualizar lista de fondo
        
        if(this.scene.showCentralAlert) this.scene.showCentralAlert("¡Refinado Exitoso!", '#' + RARITY[rKey].color.toString(16).padStart(6,'0'));
    }
}