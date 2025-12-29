import { gameState } from '../config/GameState.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
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
        
        const cats = ['wood', 'ore', 'cloth', 'leather'];
        const labels = ['MADERA', 'MINERAL', 'TELA', 'CUERO'];
        let rx = width/2 - 300;
        
        cats.forEach((cat, i) => {
            const btn = scene.add.text(rx + (i * 200), height * 0.28, labels[i], { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#888' }).setInteractive({useHandCursor:true}).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.filter = cat;
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
        this.profText.setText(`Nivel: ${p.level} (${p.xp}/${p.maxXp})`);
        
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
            let canCraft = true;
            let reqText = "";
            for(let mat in recipe.input) {
                const avail = gameState.materials[mat]?.common || 0;
                reqText += `${recipe.input[mat]} ${(RAW_MATERIALS[mat]||{name:mat}).name} `;
                if (avail < recipe.input[mat]) canCraft = false;
            }
            const product = REFINED_MATERIALS[recipe.output]?.name || recipe.output;
            
            const btn = this.scene.add.rectangle(this.width/2, y, 700, 50, canCraft ? 0x222222 : 0x111111).setStrokeStyle(1, canCraft ? 0x00ff00 : 0x550000);
            if (canCraft) { 
                btn.setInteractive({useHandCursor:true}); 
                btn.on('pointerdown', () => this.executeRefine(recipe.id)); 
            }
            
            const txt = this.scene.add.text(this.width/2, y, `${recipe.name}: ${reqText} -> ${product}`, { fontFamily: 'Roboto', fontSize: '14px', color: canCraft ? '#fff' : '#555' }).setOrigin(0.5);
            this.recipeList.add([btn, txt]);
            y += 60;
        });
    }

    executeRefine(id) {
        const res = RPGSystem.refineMaterial(id);
        if(res.success) {
            SaveSystem.save();
            this.refresh();
            this.scene.showCentralAlert("REFINADO OK", '#00ff00');
        }
    }
}