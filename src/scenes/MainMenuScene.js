// src/scenes/MainMenuScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats, RARITY } from '../config/GameState.js';
import { CLASS_STATS } from '../entities/player/PlayerStats.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.currentTab = 'hero'; 
        this.selectedItem = null; // Variable para saber qué item estamos mirando
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a);
        
        this.add.text(640, 40, 'TITAN DEFENSE RPG', { fontSize: '32px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.goldText = this.add.text(1200, 40, `ORO: ${gameState.gold}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(1, 0.5);

        // BOTONES DE PESTAÑA
        this.createTabButton(200, 100, 'HÉROE & CLASE', 'hero');
        this.createTabButton(640, 100, 'MOCHILA & FUSIÓN', 'inventory');
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

    // ==========================================
    //              PESTAÑA HÉROE
    // ==========================================
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
        const s = gameState.playerStats;
        const eq = gameState.equipment;
        const clsName = gameState.selectedClass.toUpperCase();
        
        this.heroStatsText.setText(`
        CLASE ACTUAL: [ ${clsName} ]
        
        Vida: ${Math.floor(s.hp)} / ${s.maxHp} | Daño: ${s.damage} | Defensa: ${s.defense}
        Velocidad: ${s.moveSpeed} | Vel. Ataque: ${s.attackSpeed}ms
        
        -- EQUIPAMIENTO --
        ⚔️ ${eq.weapon ? eq.weapon.name : 'Nada'}
        🛡️ ${eq.armor ? eq.armor.name : 'Nada'}
        💍 ${eq.accessory ? eq.accessory.name : 'Nada'}
        `);
    }

    // ==========================================
    //      PESTAÑA MOCHILA (INTERACTIVA)
    // ==========================================
    createInventoryView() {
        // Columna Izquierda: Materiales
        this.invMatsText = this.add.text(50, 160, '', { fontSize: '14px', lineHeight: 20 });
        this.invContainer.add(this.invMatsText);

        // Columna Central: Contenedor para la LISTA DE ITEMS
        this.invItemsContainer = this.add.container(400, 160);
        this.invContainer.add(this.invItemsContainer);
        
        const labelInv = this.add.text(400, 130, "EQUIPAMIENTO (Clic para ver)", { fontSize: '16px', color: '#aaa' });
        this.invContainer.add(labelInv);

        // Columna Derecha: DETALLES Y ACCIONES
        this.itemDetailContainer = this.add.container(800, 160);
        this.itemDetailContainer.setVisible(false); // Oculto al inicio
        this.invContainer.add(this.itemDetailContainer);

        // Fondo del detalle
        const bg = this.add.rectangle(150, 200, 300, 400, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
        this.itemDetailContainer.add(bg);

        // Textos del detalle
        this.detailTitle = this.add.text(150, 40, "Nombre Item", { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
        this.detailStats = this.add.text(150, 100, "Stats...", { fontSize: '16px', align: 'center', wordWrap: { width: 280 } }).setOrigin(0.5);
        this.itemDetailContainer.add([this.detailTitle, this.detailStats]);

        // Botones de Acción (Equipar / Fusionar)
        this.equipBtn = this.createActionButton(150, 250, "EQUIPAR", () => this.actionEquip());
        this.fuseBtn = this.createActionButton(150, 320, "FUSIONAR (Req. 2 iguales)", () => this.actionFuse());
        
        this.itemDetailContainer.add(this.equipBtn);
        this.itemDetailContainer.add(this.fuseBtn);
    }

    createActionButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 220, 40, 0x006400).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, { fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5);
        
        bg.on('pointerdown', callback);
        container.add([bg, txt]);
        return container;
    }

    refreshInventory() {
        // 1. Mostrar Materiales (Texto plano a la izquierda)
        let matContent = "--- MATERIALES ---\n";
        ['wood', 'cloth', 'copper'].forEach(mat => {
            matContent += `\n${mat.toUpperCase()}:\n`;
            Object.keys(RARITY).forEach(rarity => {
                const count = gameState.materials[mat][rarity];
                if (count > 0) matContent += `• ${RARITY[rarity].name}: ${count}\n`;
            });
        });
        this.invMatsText.setText(matContent);

        // 2. Mostrar Items (BOTONES)
        // Limpiamos la lista anterior para repintar
        this.invItemsContainer.removeAll(true);
        let yPos = 0;

        if (gameState.inventory.length === 0) {
            this.invItemsContainer.add(this.add.text(0, 0, "(Mochila vacía)", { color: '#888' }));
        }

        gameState.inventory.forEach(item => {
            // Creamos un contenedor por cada item
            const itemContainer = this.add.container(0, yPos);
            
            // Fondo interactivo (Botón)
            const bg = this.add.rectangle(150, 0, 300, 35, 0x333333).setInteractive({ useHandCursor: true });
            
            // Color del texto según rareza
            const colorHex = '#' + item.color.toString(16).padStart(6, '0');
            const nameTxt = this.add.text(10, 0, item.name, { fontSize: '14px', color: colorHex }).setOrigin(0, 0.5);
            
            // AL HACER CLIC -> Mostrar Detalles
            bg.on('pointerdown', () => this.selectItem(item));

            itemContainer.add([bg, nameTxt]);
            this.invItemsContainer.add(itemContainer);
            yPos += 40; // Siguiente item más abajo
        });

        this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    selectItem(item) {
        this.selectedItem = item;
        this.itemDetailContainer.setVisible(true);
        
        const colorHex = '#' + item.color.toString(16).padStart(6, '0');
        this.detailTitle.setText(item.name);
        this.detailTitle.setColor(colorHex);

        this.detailStats.setText(
            `Tipo: ${item.type.toUpperCase()}\n` +
            `Rareza: ${RARITY[item.rarity].name}\n` +
            `Encantamiento: +${item.enchant}\n\n` +
            `STATS:\n${JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '')}`
        );
    }

    actionEquip() {
        if (!this.selectedItem) return;
        
        const item = this.selectedItem;
        const type = item.type;

        // 1. Si ya hay algo equipado, lo mandamos al inventario
        const currentEquip = gameState.equipment[type];
        if (currentEquip) {
            gameState.inventory.push(currentEquip);
        }

        // 2. Equipar el nuevo
        gameState.equipment[type] = item;

        // 3. Quitar del inventario
        const index = gameState.inventory.indexOf(item);
        if (index > -1) gameState.inventory.splice(index, 1);

        // 4. Actualizar todo
        updatePlayerStats();
        this.selectedItem = null;
        this.itemDetailContainer.setVisible(false);
        this.refreshInventory(); // Repintar lista
    }

    actionFuse() {
        if (!this.selectedItem) return;
        const item1 = this.selectedItem;

        // Buscar pareja idéntica en el inventario
        const matchIndex = gameState.inventory.findIndex(i => 
            i !== item1 && // No puede ser él mismo
            i.type === item1.type &&
            i.rarity === item1.rarity &&
            i.enchant === item1.enchant
        );

        if (matchIndex === -1) {
            this.detailStats.setText(this.detailStats.text + "\n\n[ERROR: Necesitas otro igual en la mochila]");
            return;
        }

        const item2 = gameState.inventory[matchIndex];

        // Intentar Fusión
        const newItem = RPGSystem.fuseItems(item1, item2);

        if (newItem) {
            // Borrar los viejos
            const idx1 = gameState.inventory.indexOf(item1);
            if (idx1 > -1) gameState.inventory.splice(idx1, 1);
            
            const idx2 = gameState.inventory.indexOf(item2);
            if (idx2 > -1) gameState.inventory.splice(idx2, 1);

            // Añadir el nuevo (+1)
            gameState.inventory.push(newItem);

            // Seleccionar el nuevo automáticamente
            this.selectItem(newItem);
            this.refreshInventory();
            this.detailStats.setText(this.detailStats.text + "\n\n¡FUSIÓN EXITOSA!\nObjeto mejorado.");
        }
    }

    // ==========================================
    //              PESTAÑA FORJA
    // ==========================================
    createForgeView() {
        this.forgeMsg = this.add.text(640, 550, 'Selecciona una receta', { fontSize: '20px', color: '#ffffff', align: 'center' }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeMsg);

        this.createCraftButton(400, 300, 'FORJAR ARMA\n(Madera)', 'weapon', 'weaponsmith', 'wood', 5, 100);
        this.createCraftButton(640, 300, 'COSER ARMADURA\n(Tela)', 'armor', 'armorsmith', 'cloth', 5, 100);
        this.createCraftButton(880, 300, 'FUNDIR JOYA\n(Cobre)', 'accessory', 'jewelry', 'copper', 5, 100);
    }
    
    refreshForge() {
        this.goldText.setText(`ORO: ${gameState.gold}`);
    }

    createCraftButton(x, y, label, type, profession, matType, matCost, goldCost) {
        const btn = this.add.rectangle(x, y, 220, 80, 0x550000).setInteractive({ useHandCursor: true });
        
        const info = `${label}\nReq: ${matCost} ${matType} + ${goldCost} Oro`;
        const txt = this.add.text(x, y, info, { fontSize: '14px', align: 'center', color: '#ffdddd' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            if (gameState.gold < goldCost) {
                this.forgeMsg.setText("¡No tienes suficiente Oro!");
                this.forgeMsg.setColor('#ff0000');
                return;
            }

            // Usa el sistema corregido que cobra materiales
            const newItem = RPGSystem.craftItem(type, profession, matType, matCost);
            
            if (newItem) {
                gameState.gold -= goldCost;
                gameState.inventory.push(newItem);
                
                this.forgeMsg.setText(`¡OBJETO CREADO!\n${newItem.name}\n(Ve a MOCHILA para equiparlo)`);
                const hexColor = '#' + newItem.color.toString(16).padStart(6, '0');
                this.forgeMsg.setColor(hexColor);
                
                this.refreshForge();
            } else {
                this.forgeMsg.setText(`¡Falta Material!\nNecesitas ${matCost} de ${matType} (Común)`);
                this.forgeMsg.setColor('#ff0000');
            }
        });

        this.forgeContainer.add([btn, txt]);
    }
}