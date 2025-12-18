// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, RARITY } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.currentTab = 'hero'; 
        this.selectedItem = null;
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        
        this.add.text(640, 40, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(1200, 40, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // BOTONES DE PESTAÑA
        this.createTabButton(200, 100, 'HÉROE', 'hero');
        this.createTabButton(640, 100, 'MOCHILA', 'inventory');
        this.createTabButton(1080, 100, 'FORJA', 'forge');

        // CONTENEDORES
        this.heroContainer = this.add.container(0, 0);
        this.invContainer = this.add.container(0, 0);
        this.forgeContainer = this.add.container(0, 0);

        this.createHeroView();
        this.createInventoryView();
        this.createForgeView();

        this.switchTab('hero');

        // BOTÓN JUGAR
        const playBtn = this.add.rectangle(640, 680, 200, 50, 0x006400).setInteractive({ useHandCursor: true });
        this.add.text(640, 680, 'IR AL MAPA', { fontSize: '24px' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => this.scene.start('WorldMapScene'));
    }

    createTabButton(x, y, text, tabKey) {
        const btn = this.add.rectangle(x, y, 200, 40, 0x333333).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, text, { fontSize: '18px' }).setOrigin(0.5);
        btn.on('pointerdown', () => this.switchTab(tabKey));
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;
        this.heroContainer.setVisible(tabKey === 'hero');
        this.invContainer.setVisible(tabKey === 'inventory');
        this.forgeContainer.setVisible(tabKey === 'forge');
        
        if (tabKey === 'inventory') this.refreshInventory();
        if (tabKey === 'hero') this.refreshHero();
        if (tabKey === 'forge') this.refreshForge();
    }

    // --- PESTAÑA HÉROE ---
    createHeroView() {
        this.heroStatsText = this.add.text(640, 320, '', { fontSize: '18px', align: 'center', lineHeight: 30 }).setOrigin(0.5);
        this.heroContainer.add(this.heroStatsText);

        const classes = ['paladin', 'guerrero', 'arquero', 'mago', 'asesino'];
        let startX = 340;
        
        classes.forEach(clsKey => {
            const btn = this.add.rectangle(startX, 160, 100, 30, 0x555555).setInteractive({ useHandCursor: true });
            const txt = this.add.text(startX, 160, clsKey.toUpperCase(), { fontSize: '12px' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                gameState.selectedClass = clsKey;
                this.refreshHero(); 
            });

            this.heroContainer.add([btn, txt]);
            startX += 150;
        });
        
        const selText = this.add.text(640, 130, 'SELECCIONA TU CLASE:', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5);
        this.heroContainer.add(selText);
    }

    refreshHero() {
        // Forzamos actualización para asegurar que se lea la clase
        updatePlayerStats(); 
        const s = gameState.playerStats;
        const eq = gameState.equipment;
        const clsName = gameState.selectedClass.toUpperCase();
        
        this.heroStatsText.setText(`
        CLASE ACTUAL: [ ${clsName} ]
        
        Vida: ${Math.floor(s.hp)} / ${s.maxHp} | Daño: ${s.damage} | Defensa: ${s.defense}
        Velocidad: ${s.moveSpeed} | Rango: ${s.range}
        
        -- EQUIPAMIENTO --
        ⚔️ ${eq.weapon ? eq.weapon.name : 'Nada'}
        🛡️ ${eq.armor ? eq.armor.name : 'Nada'}
        💍 ${eq.accessory ? eq.accessory.name : 'Nada'}
        `);
    }

    // --- PESTAÑA MOCHILA ---
    createInventoryView() {
        this.invMatsText = this.add.text(50, 160, '', { fontSize: '14px', lineHeight: 20 });
        this.invContainer.add(this.invMatsText);

        this.invItemsContainer = this.add.container(400, 160);
        this.invContainer.add(this.invItemsContainer);
        
        const labelInv = this.add.text(400, 130, "EQUIPAMIENTO (Clic para ver)", { fontSize: '16px', color: '#aaa' });
        this.invContainer.add(labelInv);

        this.itemDetailContainer = this.add.container(800, 160);
        this.itemDetailContainer.setVisible(false);
        this.invContainer.add(this.itemDetailContainer);

        const bg = this.add.rectangle(150, 200, 300, 400, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
        this.itemDetailContainer.add(bg);

        this.detailTitle = this.add.text(150, 40, "Nombre Item", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        this.detailStats = this.add.text(150, 100, "Stats...", { fontSize: '16px', align: 'center', wordWrap: { width: 280 } }).setOrigin(0.5);
        this.itemDetailContainer.add([this.detailTitle, this.detailStats]);

        this.equipBtn = this.createActionButton(150, 250, "EQUIPAR", () => this.actionEquip());
        this.fuseBtn = this.createActionButton(150, 320, "FUSIONAR (Req. 2)", () => this.actionFuse());
        
        this.itemDetailContainer.add(this.equipBtn);
        this.itemDetailContainer.add(this.fuseBtn);
    }

    refreshInventory() {
        let matContent = "--- MATERIALES ---\n";
        ['wood', 'cloth', 'copper'].forEach(mat => {
            matContent += `\n${mat.toUpperCase()}:\n`;
            Object.keys(RARITY).forEach(rarity => {
                const count = gameState.materials[mat][rarity];
                if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`;
            });
        });
        this.invMatsText.setText(matContent);

        this.invItemsContainer.removeAll(true);
        let yPos = 0;

        if (gameState.inventory.length === 0) {
            this.invItemsContainer.add(this.add.text(0, 0, "(Mochila vacía)", { color: '#888' }));
        }

        gameState.inventory.forEach(item => {
            const itemContainer = this.add.container(0, yPos);
            const bg = this.add.rectangle(150, 0, 300, 35, 0x333333).setInteractive({ useHandCursor: true });
            const colorHex = '#' + item.color.toString(16).padStart(6, '0');
            const nameTxt = this.add.text(10, 0, item.name, { fontSize: '14px', color: colorHex }).setOrigin(0, 0.5);
            bg.on('pointerdown', () => this.selectItem(item));
            itemContainer.add([bg, nameTxt]);
            this.invItemsContainer.add(itemContainer);
            yPos += 40;
        });
        this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    createActionButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 220, 40, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    selectItem(item) {
        this.selectedItem = item;
        this.itemDetailContainer.setVisible(true);
        const colorHex = '#' + item.color.toString(16).padStart(6, '0');
        this.detailTitle.setText(item.name);
        this.detailTitle.setColor(colorHex);
        this.detailStats.setText(
            `Tipo: ${item.type}\n` +
            `Rareza: ${RARITY[item.rarity].name}\n` +
            `Encantamiento: +${item.enchant}\n\n` +
            `STATS:\n${JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '')}`
        );
    }

    actionEquip() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;
        const current = gameState.equipment[item.type];
        if (current) gameState.inventory.push(current);
        gameState.equipment[item.type] = item;
        const idx = gameState.inventory.indexOf(item);
        if (idx > -1) gameState.inventory.splice(idx, 1);
        updatePlayerStats();
        this.selectedItem = null;
        this.itemDetailContainer.setVisible(false);
        this.refreshInventory();
    }

    actionFuse() {
        if (!this.selectedItem) return;
        const item1 = this.selectedItem;
        const idx2 = gameState.inventory.findIndex(i => 
            i !== item1 && 
            i.type === item1.type && 
            i.rarity === item1.rarity && 
            i.enchant === item1.enchant
        );

        if (idx2 === -1) {
            this.detailStats.setText(this.detailStats.text + "\n\n[ERROR: Necesitas otro igual]");
            return;
        }

        const item2 = gameState.inventory[idx2];
        const newItem = RPGSystem.fuseItems(item1, item2);

        if (newItem) {
            const idx1 = gameState.inventory.indexOf(item1);
            if (idx1 > -1) gameState.inventory.splice(idx1, 1);
            const idx2Re = gameState.inventory.indexOf(item2);
            if (idx2Re > -1) gameState.inventory.splice(idx2Re, 1);

            gameState.inventory.push(newItem);
            this.selectItem(newItem);
            this.refreshInventory();
            this.detailStats.setText(this.detailStats.text + "\n\n¡FUSIÓN EXITOSA!");
        }
    }

    // --- PESTAÑA FORJA (CORREGIDA Y ORGANIZADA) ---
    createForgeView() {
        // 1. Panel de Profesiones (Top)
        this.profText = this.add.text(640, 140, '', { fontSize: '14px', align: 'center', color: '#aaaaaa' }).setOrigin(0.5);
        this.forgeContainer.add(this.profText);

        // 2. Mensaje de Estado
        this.forgeMsg = this.add.text(640, 600, 'Selecciona receta', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);

        // 3. Títulos de columnas
        const t1 = this.add.text(300, 180, "ARMAS (Herrería)", { fontSize: '16px', color: '#ffa500' }).setOrigin(0.5);
        const t2 = this.add.text(640, 180, "ARMADURAS (Sastrería)", { fontSize: '16px', color: '#00ffff' }).setOrigin(0.5);
        const t3 = this.add.text(980, 180, "ACCESORIOS (Joyería)", { fontSize: '16px', color: '#ff00ff' }).setOrigin(0.5);
        this.forgeContainer.add([t1, t2, t3]);

        // 4. Botones por Categoría y Rareza
        // Armas
        this.createRecipeBtn(300, 230, 'Espada Común', 'weapon', 'weaponsmith', 'wood', 'common', 50);
        this.createRecipeBtn(300, 300, 'Espada Verde', 'weapon', 'weaponsmith', 'wood', 'uncommon', 150);
        this.createRecipeBtn(300, 370, 'Espada Azul', 'weapon', 'weaponsmith', 'wood', 'rare', 300);

        // Armaduras
        this.createRecipeBtn(640, 230, 'Túnica Común', 'armor', 'armorsmith', 'cloth', 'common', 50);
        this.createRecipeBtn(640, 300, 'Túnica Verde', 'armor', 'armorsmith', 'cloth', 'uncommon', 150);
        this.createRecipeBtn(640, 370, 'Túnica Azul', 'armor', 'armorsmith', 'cloth', 'rare', 300);

        // Joyas
        this.createRecipeBtn(980, 230, 'Anillo Común', 'accessory', 'jewelry', 'copper', 'common', 50);
        this.createRecipeBtn(980, 300, 'Anillo Verde', 'accessory', 'jewelry', 'copper', 'uncommon', 150);
        this.createRecipeBtn(980, 370, 'Anillo Azul', 'accessory', 'jewelry', 'copper', 'rare', 300);
    }

    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`);
        const p = gameState.professions;
        this.profText.setText(
            `HERRERÍA: Lvl ${p.weaponsmith.level} (${p.weaponsmith.xp}/${p.weaponsmith.maxXp} XP)\n` +
            `SASTRERÍA: Lvl ${p.armorsmith.level} (${p.armorsmith.xp}/${p.armorsmith.maxXp} XP)\n` +
            `JOYERÍA: Lvl ${p.jewelry.level} (${p.jewelry.xp}/${p.jewelry.maxXp} XP)`
        );
    }

    createRecipeBtn(x, y, label, type, profKey, matType, rarity, goldCost) {
        const rarityData = RARITY[rarity];
        const hexColor = '#' + rarityData.color.toString(16).padStart(6, '0');
        
        const btn = this.add.rectangle(x, y, 250, 50, 0x333333).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, rarityData.color); // Borde según rareza

        const txt = this.add.text(x, y, `${label}\nReq: 3 ${matType} (${rarityData.name}) + $${goldCost}`, { 
            fontSize: '12px', align: 'center', color: hexColor 
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            if (gameState.gold < goldCost) {
                this.forgeMsg.setText("¡Falta Oro!");
                this.forgeMsg.setColor('#ff0000');
                return;
            }

            // Llamada al sistema corregido
            const result = RPGSystem.craftItem(type, profKey, matType, rarity);
            
            if (result.success) {
                gameState.gold -= goldCost;
                gameState.inventory.push(result.item);
                
                this.forgeMsg.setText(`¡FORJADO EXITO!\n${result.item.name}\n(+XP Profesional)`);
                this.forgeMsg.setColor('#00ff00');
                this.refreshForge();
            } else {
                this.forgeMsg.setText(`¡Faltan Materiales!\nRequieres 3 ${matType} de calidad ${rarityData.name}`);
                this.forgeMsg.setColor('#ff0000');
            }
        });

        // IMPORTANTE: Aquí se añade al contenedor, evitando el error anterior
        this.forgeContainer.add([btn, txt]);
    }
}