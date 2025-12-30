import { gameState, updatePlayerStats, getCurrentHero, RARITY } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class HeroPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        
        // --- FONDO EXPANDIDO (900px ancho) ---
        const panelWidth = 900; 
        const panelHeight = 650; 
        const panelX = width / 2; // Centrado
        const panelY = height / 2 + 20;

        const statsBg = scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.9).setStrokeStyle(3, 0xffd700); 
        this.container.add(statsBg); 
        
        // Título Principal (Arriba del todo)
        this.heroLevelText = scene.add.text(width/2, height * 0.12, '', { fontFamily: 'Cinzel', fontSize: '32px', color: '#00ffff', fontStyle:'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.container.add(this.heroLevelText);

        // --- COLUMNA IZQUIERDA (STATS) ---
        const col1X = panelX - 220;
        const startY = panelY - 280;

        // Texto de Stats
        this.heroStatsText = scene.add.text(col1X - 200, startY, '', { fontFamily: 'Roboto', fontSize: '15px', lineHeight: 24, color: '#fff' }); 
        this.container.add(this.heroStatsText); 
        
        // Botones de Mejora (Ahora dentro del panel, abajo a la izquierda)
        this.pointsText = scene.add.text(col1X, panelY + 120, "PUNTOS: 0", { fontFamily: 'Cinzel', fontSize: '22px', color: '#ffd700', fontStyle:'bold' }).setOrigin(0.5); 
        this.container.add(this.pointsText); 

        // Contenedor para botones de stats
        this.statButtonsContainer = scene.add.container(0, 0);
        this.container.add(this.statButtonsContainer);
        
        const statsToUpgrade = [ 
            { label: "Daño (+1)", key: 'damage' }, 
            { label: "Vida (+10)", key: 'hp' }, 
            { label: "Vel. Atq", key: 'speed' }, 
            { label: "Defensa (+1)", key: 'defense' } 
        ]; 
        
        // Crear botones x1 y x10
        let btnY = panelY + 170;
        statsToUpgrade.forEach((s) => { 
            this.createUpgradeRow(col1X, btnY, s.label, s.key); 
            btnY += 55;
        });

        // --- COLUMNA DERECHA (EQUIPO) ---
        const col2X = panelX + 220;
        
        // Título Equipo
        const equipTitle = scene.add.text(col2X, startY, "-- EQUIPAMIENTO --", { fontFamily: 'Cinzel', fontSize: '18px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.container.add(equipTitle);

        this.equippedTextContainer = scene.add.container(col2X, startY + 40); 
        this.container.add(this.equippedTextContainer); 
        
        // Texto de Sets (Abajo a la derecha)
        this.heroSetsText = scene.add.text(col2X, panelY + 100, '', { fontFamily: 'Roboto', fontSize: '13px', color: '#ffff00', lineHeight: 20, align: 'center' }).setOrigin(0.5, 0);
        this.container.add(this.heroSetsText);
    }

    createUpgradeRow(x, y, label, statKey) {
        // Botón x1
        const btn1 = this.scene.add.rectangle(x - 60, y, 180, 40, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00);
        const txt1 = this.scene.add.text(x - 60, y, label, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        
        btn1.on('pointerdown', () => { 
            if (RPGSystem.spendStatPoint(statKey)) { 
                this.refresh(); 
                SaveSystem.save(); 
            } 
        });

        // Botón x10
        const btn10 = this.scene.add.rectangle(x + 100, y, 80, 40, 0x8b0000).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xff5555);
        const txt10 = this.scene.add.text(x + 100, y, "+10", { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);

        btn10.on('pointerdown', () => {
            const hero = getCurrentHero();
            if (hero.statPoints >= 10) {
                // Bucle seguro para gastar 10 puntos
                for(let i=0; i<10; i++) {
                    RPGSystem.spendStatPoint(statKey);
                }
                this.refresh();
                SaveSystem.save();
                if(this.scene.showCentralAlert) this.scene.showCentralAlert("¡Mejora x10 Aplicada!", "#00ff00");
            } else {
                if(this.scene.showCentralAlert) this.scene.showCentralAlert("Necesitas 10 Puntos", "#ff0000");
            }
        });

        this.statButtonsContainer.add([btn1, txt1, btn10, txt10]);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() { 
        updatePlayerStats(); 
        const s = gameState.playerStats; 
        const eq = gameState.equipment; 
        const hero = getCurrentHero(); 
        const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase(); 
        
        // Formateo Stats
        const attacksPerSecond = (1000 / s.attackSpeed).toFixed(2);
        const atkSpeedTxt = `${attacksPerSecond} Atk/s (${s.attackSpeed}ms)`; 
        const dmgReduction = (s.defense * 0.25).toFixed(1);
        const defTxt = `${s.defense} (${dmgReduction}% Reducción)`;

        const statsBlock = 
`CLASE: [ ${clsName} ]

-- PRINCIPALES --
⚔️ Daño: ${s.damage}
❤️ Vida: ${Math.floor(s.hp)} / ${s.maxHp}
⚡ Vel: ${atkSpeedTxt}
🛡️ Def: ${defTxt}

-- COMBATE --
📏 Alcance: ${s.range}m
🏃 Movimiento: ${s.moveSpeed}
🎯 Crítico: ${s.critChance}%
💥 Daño Crít: ${s.critDamage}%
🩸 Robo Vida: ${s.lifesteal}%
🛡️ Bloqueo: ${s.blockChance}%

-- OTROS --
💖 Regen: ${s.regenHp} Hp/s
⚔️⚔️ Doble: ${s.doubleAttack}%
🌵 Espinas: ${s.thorns}%
⏳ CD Reduc: ${s.cdr}%`;

        this.heroStatsText.setText(statsBlock); 

        // --- EQUIPAMIENTO (Columna Derecha) ---
        this.equippedTextContainer.removeAll(true); 
        
        let slotY = 0; 
        const slots = [ 
            { key: 'mainHand', label: '🗡️ Arma', cat: 'weapon' }, 
            { key: 'offHand', label: '🛡️ Off', cat: 'armor' }, 
            { key: 'armor', label: '👕 Ropa', cat: 'armor' }, 
            { key: 'accessory', label: '💍 Joya', cat: 'accessory' } 
        ]; 
        
        slots.forEach(slot => { 
            const item = eq[slot.key]; 
            const slotBg = this.scene.add.rectangle(0, slotY, 380, 50, 0x222222).setInteractive({useHandCursor: true}).setStrokeStyle(1, item ? RARITY[item.rarity].color : 0x555555); 
            
            const name = item ? `${item.name} (+${item.enchant})` : '- VACÍO -'; 
            const color = item ? '#' + item.color.toString(16).padStart(6, '0') : '#888'; 
            
            const txtLabel = this.scene.add.text(-170, slotY, slot.label, { fontFamily: 'Roboto', fontSize: '14px', color: '#aaa' }).setOrigin(0, 0.5);
            const valTxt = this.scene.add.text(-80, slotY, name, { fontFamily: 'Roboto', fontSize: '15px', color: color, fontStyle: 'bold', wordWrap: {width: 250} }).setOrigin(0, 0.5);
            
            slotBg.on('pointerdown', () => { 
                if (!item) { 
                    if(this.scene.inventoryPanel) this.scene.inventoryPanel.category = slot.cat; 
                    this.scene.switchTab('inventory'); 
                } 
                else { this.showUnequipModal(item, slot.key); } 
            }); 
            
            this.equippedTextContainer.add([slotBg, txtLabel, valTxt]); 
            slotY += 60; 
        }); 
        
        // --- SETS ---
        let setsText = "-- BONIFICACIONES DE SET --\n\n"; 
        if (gameState.activeSets && gameState.activeSets.length > 0) { 
            gameState.activeSets.forEach(set => { 
                setsText += `★ ${set.name}\n`; 
                set.bonuses.forEach(b => setsText += `   ${b}\n`); 
                setsText += "\n";
            }); 
        } else {
            setsText += "(Ninguno activado)";
        }
        this.heroSetsText.setText(setsText);

        // Header Info
        this.heroLevelText.setText(`NIVEL ${hero.level} (XP: ${hero.xp}/${hero.maxXp})`); 
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${hero.statPoints}`); 
    }

    // --- FUNCIÓN SEGURA DE GUARDADO ---
    safeAddItemToInventory(item) { 
        if (!item) return; 
        const exists = gameState.inventory.some(i => i.id === item.id); 
        if (!exists) gameState.inventory.push(item); 
        else { 
            item.id = RPGSystem.getUniqueId(); 
            gameState.inventory.push(item); 
        } 
    }

    showUnequipModal(item, slotKey) { 
        const modal = this.scene.add.container(this.scene.scale.width/2, this.scene.scale.height/2).setDepth(2000); 
        const bg = this.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color); 
        const title = this.scene.add.text(0, -100, item.name, { fontFamily: 'Cinzel', fontSize: '22px', fontStyle:'bold', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5); 
        
        const statsStr = item.stats ? JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, '') : "Sin stats";
        const info = this.scene.add.text(0, -20, statsStr, { fontFamily: 'Roboto', fontSize: '14px', color: '#fff', align: 'center', wordWrap:{width:350} }).setOrigin(0.5); 
        
        const btnUnequip = this.scene.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true}); 
        const txtUnequip = this.scene.add.text(0, 80, "DESEQUIPAR", { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5); 
        
        const btnClose = this.scene.add.text(0, 130, "Cancelar", { fontFamily: 'Roboto', fontSize: '14px', color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5); 
        
        btnUnequip.on('pointerdown', () => { 
            const equippedItem = gameState.equipment[slotKey];
            if (equippedItem) { 
                gameState.equipment[slotKey] = null; 
                this.safeAddItemToInventory(equippedItem); 
                
                SaveSystem.save(); 
                updatePlayerStats(); 
                this.refresh(); 
                modal.destroy(); 
                if(this.scene.showCentralAlert) this.scene.showCentralAlert("Equipo guardado", "#00ff00");
            } else { 
                if(this.scene.showCentralAlert) this.scene.showCentralAlert("Error", "#ff0000"); 
                modal.destroy(); 
            } 
        }); 
        
        btnClose.on('pointerdown', () => modal.destroy()); 
        modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]); 
        this.container.add(modal); 
    }
}