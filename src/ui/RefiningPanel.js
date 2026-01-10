import { gameState, RARITY } from '../config/GameState.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import RPGSystem from '../systems/RPGSystem.js'; 
import SaveSystem from '../systems/SaveSystem.js';
import SoundManager from '../systems/SoundManager.js'; 
import PanelTutorial from './PanelTutorial.js'; // <--- IMPORTAR

export default class RefiningPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        // Crear Contenedor Principal
        this.container = scene.add.container(0, 0).setVisible(false).setDepth(100); 
        this.filter = 'wood';
        
        // Inicializar el sistema de tutorial
        this.tutorial = new PanelTutorial(scene); // <--- INSTANCIAR

        // --- FONDO INTERACTIVO ---
        const bg = scene.add.rectangle(width/2, height/2, width * 0.9, height * 0.9, 0x000000, 0.95)
            .setStrokeStyle(4, 0xffd700)
            .setInteractive(); 
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

        // Contenedor de lista
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

        // --- ACTIVAR TUTORIAL ---
        this.tutorial.trigger(
            'refining', 
            'REFINERÍA DE MATERIALES', 
            'Transforma tus materiales en RECURSOS AVANZADOS.\nEjemplo: Convierte Troncos en Tablones para crear armas de mayor nivel.\n¡Sube tu nivel de Refinamiento para producir el doble de materiales!'
        );
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
        const pKey = 'refining';
        const p = gameState.professions[pKey] || { level: 1, xp: 0, maxXp: 100 };
        
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

        const bg = this.scene.add.rectangle(0, 0, 400, 500, 0x111111, 1)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive(); 
        
        const title = this.scene.add.text(0, -200, recipe.name.toUpperCase(), { 
            fontFamily: 'Cinzel', fontSize: '24px', color: '#ffd700', fontStyle:'bold' 
        }).setOrigin(0.5);

        this.rarityContainer = this.scene.add.container(0, -140);
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        let btnX = -120;
        this.indicators = {};

        rarities.forEach(rKey => {
            const rData = RARITY[rKey];
            const btn = this.scene.add.rectangle(btnX, 0, 40, 40, rData.color)
                .setInteractive({useHandCursor:true})
                .setStrokeStyle(2, 0x000000);
            
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

        this.infoText = this.scene.add.text(0, 0, "", { 
            fontFamily: 'Roboto', fontSize: '16px', align: 'center', lineSpacing: 10 
        }).setOrigin(0.5);

        this.btnsContainer = this.scene.add.container(0, 150);
        
        this.btnX1 = this.createActionButton(-100, 0, "Refinar x1", 0x006400, () => this.executeRefine(1));
        this.btnX10 = this.createActionButton(0, 0, "x10", 0x00008b, () => this.executeRefine(10), 80);
        this.btnX100 = this.createActionButton(100, 0, "x100", 0x8b0000, () => this.executeRefine(100), 80);

        this.btnsContainer.add([this.btnX1.container, this.btnX10.container, this.btnX100.container]);

        const close = this.scene.add.text(170, -220, "X", { fontSize:'24px', color:'#ff5555', fontStyle:'bold'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
        close.on('pointerdown', () => this.detailContainer.setVisible(false));

        this.detailContainer.add([bg, title, this.rarityContainer, this.infoText, this.btnsContainer, close]);
        
        this.updateDetailView();
    }

    createActionButton(x, y, label, color, callback, width=100) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, width, 40, color).setInteractive({useHandCursor:true});
        const text = this.scene.add.text(0, 0, label, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        
        bg.on('pointerdown', callback);
        
        container.add([bg, text]);
        return { container, bg, text };
    }

    updateDetailView() {
        const recipe = this.selectedRecipe;
        const rKey = this.selectedRarity;
        const rarity = RARITY[rKey];
        
        let maxCraftable = 999999; 
        let reqText = `Calidad Seleccionada: ${rarity.name.toUpperCase()}\n\n`;
        
        for(let mat in recipe.input) {
            const rawDef = RAW_MATERIALS[mat] || REFINED_MATERIALS[mat] || {name: mat};
            const qtyReq = recipe.input[mat];
            
            const isCoal = (mat === 'coal');
            const checkRarity = isCoal ? 'common' : rKey;
            const rarityLabel = isCoal ? '(Cualquiera)' : `(${rarity.name})`;

            const qtyOwned = gameState.materials[mat] ? (gameState.materials[mat][checkRarity] || 0) : 0;
            
            const possible = Math.floor(qtyOwned / qtyReq);
            if (possible < maxCraftable) maxCraftable = possible;

            reqText += `${rawDef.name} ${rarityLabel}: ${qtyOwned} / ${qtyReq}\n`;
        }
        
        const outputDef = REFINED_MATERIALS[recipe.output] || {name: recipe.output};
        reqText += `\nResultado: 1 ${outputDef.name}`;

        this.infoText.setText(reqText);
        this.infoText.setColor(maxCraftable > 0 ? '#ffffff' : '#ffaaaa');
        
        this.updateButtonState(this.btnX1, maxCraftable >= 1);
        this.updateButtonState(this.btnX10, maxCraftable >= 10);
        this.updateButtonState(this.btnX100, maxCraftable >= 100);
    }

    updateButtonState(btnObj, isEnabled) {
        if (isEnabled) {
            btnObj.bg.setInteractive();
            btnObj.bg.setAlpha(1);
            btnObj.container.setAlpha(1);
        } else {
            btnObj.bg.disableInteractive();
            btnObj.bg.setAlpha(0.5);
            btnObj.container.setAlpha(0.5);
        }
    }

    executeRefine(count) {
        const result = RPGSystem.refineMaterial(this.selectedRecipe.id, this.selectedRarity, count);

        if (result.success) {
            // --- SONIDO DINÁMICO ---
            if (count > 1) {
                let soundCount = Math.min(count, 5); 
                for(let i=0; i<soundCount; i++) {
                    this.scene.time.delayedCall(i * 100, () => SoundManager.playSound('build'));
                }
            } else {
                SoundManager.playSound('build');
            }

            SaveSystem.save(); 
            this.updateDetailView(); 
            this.refresh(); 
            
            const refinedDef = REFINED_MATERIALS[this.selectedRecipe.output] || { name: this.selectedRecipe.output };
            const materialName = refinedDef.name;
            const rData = RARITY[result.rarity];

            let msg = `¡Refinado Exitoso!\n+${result.totalProduced} ${materialName}`;
            this.showFloatingText(msg, 0xffffff);

            // --- LLUVIA DE RECURSOS (JUICE) ---
            const center = { x: this.width/2, y: this.height/2 };
            const particles = Math.min(result.totalProduced, 20); 
            for(let i=0; i<particles; i++) {
                this.spawnResourceParticle(center.x, center.y, rData.color);
            }

            if (result.doubleDrops > 0) {
                this.scene.cameras.main.shake(100, 0.002);
                this.showFloatingText(`¡${result.doubleDrops} DOBLES!`, 0xffff00, -50); 
                for(let i=0; i<10; i++) {
                    this.spawnResourceParticle(center.x, center.y, 0xffff00, true);
                }
            }
            
        } else {
            SoundManager.playSound('ui_click'); 
        }
    }

    spawnResourceParticle(x, y, color, isDouble = false) {
        const size = isDouble ? 12 : 8;
        const p = this.scene.add.rectangle(x, y, size, size, color).setDepth(2100);
        p.setStrokeStyle(1, 0xffffff);

        const angle = Phaser.Math.Between(0, 360) * (Math.PI/180);
        const speed = Phaser.Math.Between(100, 300);
        const targetX = x + Math.cos(angle) * speed;
        const targetY = y + Math.sin(angle) * speed;

        this.scene.tweens.add({
            targets: p,
            x: targetX,
            y: targetY,
            angle: 360,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                const invX = this.width - 50; 
                const invY = 50;
                
                this.scene.tweens.add({
                    targets: p,
                    x: invX,
                    y: invY,
                    scale: 0.2,
                    alpha: 0,
                    duration: 400,
                    ease: 'Quad.in',
                    onComplete: () => p.destroy()
                });
            }
        });
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