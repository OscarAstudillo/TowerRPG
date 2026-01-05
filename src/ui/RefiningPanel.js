import { gameState, RARITY } from '../config/GameState.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import RPGSystem from '../systems/RPGSystem.js'; // Importamos el sistema mejorado
import SaveSystem from '../systems/SaveSystem.js';
import SoundManager from '../systems/SoundManager.js'; // Importante para feedback

export default class RefiningPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        // Crear Contenedor Principal
        this.container = scene.add.container(0, 0).setVisible(false).setDepth(100); // Elevamos depth para que esté sobre el juego
        this.filter = 'wood';
        
        // --- FONDO INTERACTIVO (Evita clics traseros) ---
        // Usamos las coordenadas relativas al contenedor
        const bg = scene.add.rectangle(width/2, height/2, width * 0.9, height * 0.9, 0x000000, 0.95)
            .setStrokeStyle(4, 0xffd700)
            .setInteractive(); // Bloquea clicks
        this.container.add(bg);

        // Título
        this.title = scene.add.text(width/2, height * 0.1, "REFINERÍA", { 
            fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#ffd700', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5);
        this.container.add(this.title);
        
        // Texto de Nivel de Profesión
        this.profText = scene.add.text(width/2, height * 0.15, "", { 
            fontFamily: 'Roboto', fontSize: '18px', color: '#00ff00' 
        }).setOrigin(0.5);
        this.container.add(this.profText);
        
        // Botón Cerrar
        const closeBtn = scene.add.text(width * 0.9, height * 0.1, "X", { fontSize: '30px', color: '#ff0000', fontStyle: 'bold' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.hide());
        this.container.add(closeBtn);

        // Contenedor de lista (scrolleable idealmente, pero simplificado aquí)
        this.recipeList = scene.add.container(0, 0);
        this.container.add(this.recipeList);
        
        // --- MODAL DE DETALLE (Overlay) ---
        this.detailContainer = scene.add.container(width/2, height/2).setVisible(false).setDepth(2000);
        this.container.add(this.detailContainer);

        // Filtros (Categorías)
        const cats = ['wood', 'ore', 'cloth', 'leather'];
        const labels = ['MADERA', 'MINERAL', 'TELA', 'CUERO'];
        let startX = width * 0.2;
        const gap = (width * 0.6) / (cats.length - 1);
        
        this.filterButtons = [];

        cats.forEach((cat, i) => {
            const btnText = scene.add.text(startX + (i * gap), height * 0.22, labels[i], { 
                fontFamily: 'Cinzel', fontSize: '18px', fontStyle: 'bold', color: '#888' 
            }).setInteractive({useHandCursor:true}).setOrigin(0.5);
            
            btnText.on('pointerdown', () => {
                this.filter = cat;
                this.detailContainer.setVisible(false);
                this.refresh();
                this.updateFilterVisuals();
                SoundManager.playSound('ui_click');
            });
            this.container.add(btnText);
            this.filterButtons.push({ text: btnText, cat: cat });
        });
    }

    show() { 
        this.container.setVisible(true); 
        this.refresh(); 
        this.updateFilterVisuals();
    }
    
    hide() { 
        this.container.setVisible(false); 
        this.detailContainer.setVisible(false);
    }

    updateFilterVisuals() {
        this.filterButtons.forEach(btn => {
            if (btn.cat === this.filter) {
                btn.text.setColor('#ffffff');
                btn.text.setStroke('#ffd700', 2);
            } else {
                btn.text.setColor('#888888');
                btn.text.setStroke(null);
            }
        });
    }

    refresh() {
        // Actualizar Info Profesión
        // Usamos 'alchemy' o 'refining' consistentemente. RPGSystem usa 'alchemy' en el ejemplo anterior, 
        // pero tu código usa 'refining'. Ajustemos para leer lo que haya.
        const pKey = gameState.professions.refining ? 'refining' : 'alchemy';
        const p = gameState.professions[pKey] || { level: 1, xp: 0, maxXp: 100 };
        
        // Calcular chance visualmente
        const chance = RPGSystem.getProfessionChance(pKey);
        const chancePct = (chance * 100).toFixed(1);
        
        this.profText.setText(`Nivel: ${p.level} (${p.xp}/${p.maxXp}) - Chance Doble: ${chancePct}%`);
        
        this.recipeList.removeAll(true);
        let y = this.height * 0.3;
        
        const filtered = REFINING_RECIPES.filter(r => {
            if (this.filter === 'wood') return r.input.wood || r.input.cedar || r.input.ebony;
            if (this.filter === 'ore') return r.input.copper || r.input.iron || r.input.mithril;
            if (this.filter === 'cloth') return r.input.scraps || r.input.cotton || r.input.silk;
            if (this.filter === 'leather') return r.input.hide || r.input.leather || r.input.scale;
            return true;
        });

        filtered.forEach(recipe => {
            const productDef = REFINED_MATERIALS[recipe.output] || {name: recipe.output};
            const inputKey = Object.keys(recipe.input)[0];
            const inputDef = RAW_MATERIALS[inputKey] || REFINED_MATERIALS[inputKey] || {name: inputKey};
            
            const btn = this.scene.add.rectangle(this.width/2, y, this.width * 0.8, 50, 0x222222)
                .setStrokeStyle(1, 0x555555)
                .setInteractive({useHandCursor:true});
            
            btn.on('pointerdown', () => {
                SoundManager.playSound('ui_click');
                this.showRefineDetail(recipe);
            }); 
            
            btn.on('pointerover', () => btn.setFillStyle(0x444444));
            btn.on('pointerout', () => btn.setFillStyle(0x222222));
            
            const txt = this.scene.add.text(this.width/2, y, `${inputDef.name}  ➜  ${productDef.name}`, { 
                fontFamily: 'Roboto', fontSize: '18px', color: '#fff' 
            }).setOrigin(0.5);
            
            this.recipeList.add([btn, txt]);
            y += 60;
        });
    }

    showRefineDetail(recipe) {
        this.detailContainer.removeAll(true);
        this.detailContainer.setVisible(true);
        this.selectedRecipe = recipe;
        this.selectedRarity = 'common'; 

        // Fondo del Modal
        const bg = this.scene.add.rectangle(0, 0, 400, 450, 0x111111, 1)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive(); // Bloquea clicks
        
        const title = this.scene.add.text(0, -180, recipe.name.toUpperCase(), { 
            fontFamily: 'Cinzel', fontSize: '24px', color: '#ffd700', fontStyle:'bold' 
        }).setOrigin(0.5);

        // Selector de Rareza
        this.rarityContainer = this.scene.add.container(0, -120);
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        let btnX = -120;
        this.indicators = {};

        rarities.forEach(rKey => {
            const rData = RARITY[rKey];
            const btn = this.scene.add.rectangle(btnX, 0, 40, 40, rData.color)
                .setInteractive({useHandCursor:true})
                .setStrokeStyle(2, 0x000000);
            
            // Indicador de selección
            const ind = this.scene.add.rectangle(btnX, 0, 48, 48, 0xffffff, 0)
                .setStrokeStyle(3, 0xffffff)
                .setVisible(rKey === 'common');
            
            this.indicators[rKey] = ind;
            
            btn.on('pointerdown', () => {
                SoundManager.playSound('ui_click');
                for(let k in this.indicators) this.indicators[k].setVisible(false);
                ind.setVisible(true);
                this.selectedRarity = rKey;
                this.updateDetailView();
            });
            
            this.rarityContainer.add([btn, ind]);
            btnX += 60;
        });

        // Información de Requisitos
        this.infoText = this.scene.add.text(0, 20, "", { 
            fontFamily: 'Roboto', fontSize: '16px', align: 'center', lineSpacing: 10 
        }).setOrigin(0.5);

        // Botón Acción
        this.actionBtn = this.scene.add.rectangle(0, 160, 200, 50, 0x006400).setInteractive({useHandCursor:true});
        this.actionBtnText = this.scene.add.text(0, 160, "REFINAR", { fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        this.actionBtn.on('pointerdown', () => this.executeRefine());

        // Botón Cerrar Modal
        const close = this.scene.add.text(170, -200, "X", { fontSize:'24px', color:'#ff5555', fontStyle:'bold'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
        close.on('pointerdown', () => this.detailContainer.setVisible(false));

        this.detailContainer.add([bg, title, this.rarityContainer, this.infoText, this.actionBtn, this.actionBtnText, close]);
        
        this.updateDetailView();
    }

    updateDetailView() {
        const recipe = this.selectedRecipe;
        const rKey = this.selectedRarity;
        const rarity = RARITY[rKey];
        
        let hasMats = true;
        let reqText = `Calidad Seleccionada: ${rarity.name.toUpperCase()}\n\n`;
        
        // Calcular Requisitos
        for(let mat in recipe.input) {
            const rawDef = RAW_MATERIALS[mat] || REFINED_MATERIALS[mat] || {name: mat};
            const qtyReq = recipe.input[mat];
            
            // Si es carbón, siempre usa 'common'
            const isCoal = (mat === 'coal');
            const checkRarity = isCoal ? 'common' : rKey;
            const rarityLabel = isCoal ? '(Cualquiera)' : `(${rarity.name})`;

            const qtyOwned = gameState.materials[mat] ? (gameState.materials[mat][checkRarity] || 0) : 0;
            
            const color = (qtyOwned >= qtyReq) ? '#00ff00' : '#ff0000';
            // Phaser no soporta multiples colores en un solo text object fácilmente, así que usamos el color global del texto si falla algo
            if (qtyOwned < qtyReq) hasMats = false;

            reqText += `${rawDef.name} ${rarityLabel}: ${qtyOwned} / ${qtyReq}\n`;
        }
        
        const outputDef = REFINED_MATERIALS[recipe.output] || {name: recipe.output};
        reqText += `\nResultado: 1 ${outputDef.name}`;

        this.infoText.setText(reqText);
        this.infoText.setColor(hasMats ? '#ffffff' : '#ffaaaa');
        
        this.actionBtn.setFillStyle(hasMats ? 0x00aa00 : 0x333333);
        
        // Habilitar/Deshabilitar botón
        if(hasMats) {
            this.actionBtn.setInteractive();
            this.actionBtn.setAlpha(1);
        } else {
            this.actionBtn.disableInteractive();
            this.actionBtn.setAlpha(0.5);
        }
    }

    executeRefine() {
        // Usamos la nueva función del sistema RPG
        const result = RPGSystem.refineMaterial(this.selectedRecipe.id, this.selectedRarity);

        if (result.success) {
            SoundManager.playSound('build');
            SaveSystem.save();
            
            this.updateDetailView(); // Actualizar cantidades
            this.refresh(); // Actualizar panel principal
            
            // Feedback Visual en pantalla
            const colorHex = '#' + RARITY[result.rarity].color.toString(16).padStart(6, '0');
            let msg = `¡Refinado Exitoso!\n+1 ${this.selectedRecipe.output}`;
            
            if (result.isDouble) {
                msg = `¡DOBLE PRODUCCIÓN!\n+2 ${this.selectedRecipe.output}`;
                // Feedback Extra
                this.showFloatingText("x2", 0xffff00, -50); 
            }
            
            this.showFloatingText(msg, 0xffffff);
            
        } else {
            // Error (no debería pasar si el botón estaba activo, pero por seguridad)
            SoundManager.playSound('ui_click'); // Sonido error opcional
        }
    }

    showFloatingText(msg, color, yOffset = 0) {
        if (!this.scene) return;
        const txt = this.scene.add.text(this.width/2, (this.height/2) + yOffset, msg, {
            fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold', 
            color: typeof color === 'number' ? '#' + color.toString(16) : color, 
            stroke: '#000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5).setDepth(2100);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }
}