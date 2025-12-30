import { gameState, updatePlayerStats, getCurrentHero, RARITY } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class HeroPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        
        // Títulos y Textos
        this.heroLevelText = scene.add.text(width/2, height * 0.17, '', { fontFamily: 'Cinzel', fontSize: '28px', color: '#00ffff', fontStyle:'bold' }).setOrigin(0.5);
        this.container.add(this.heroLevelText);
        
        const panelWidth = 500; 
        const panelHeight = 700; 
        const statsBg = scene.add.rectangle(width * 0.35, height/2 + 20, panelWidth, panelHeight, 0x000000, 0.9).setStrokeStyle(2, 0x555555); 
        this.container.add(statsBg); 
        
        const textStartX = (width * 0.35) - (panelWidth / 2) + 30; 
        const textStartY = (height/2 + 20) - (panelHeight / 2) + 30; 
        
        this.heroStatsText = scene.add.text(textStartX, textStartY, '', { fontFamily: 'Roboto', fontSize: '15px', lineHeight: 24, color: '#fff' }); 
        this.container.add(this.heroStatsText); 
        
        this.equippedTextContainer = scene.add.container(0, 0); 
        this.container.add(this.equippedTextContainer); 
        
        this.heroSetsText = scene.add.text(textStartX, textStartY + 480, '', { fontFamily: 'Roboto', fontSize: '13px', color: '#ffff00', lineHeight: 20 });
        this.container.add(this.heroSetsText);

        // Puntos de Stat y Botones
        const rightX = width * 0.8; 
        let upgradeY = height * 0.3; 
        this.pointsText = scene.add.text(rightX, upgradeY, "Puntos: 0", { fontFamily: 'Cinzel', fontSize: '20px', color: '#ffd700', fontStyle:'bold' }).setOrigin(0.5); 
        this.container.add(this.pointsText); 
        
        upgradeY += 60; 
        const statsToUpgrade = [ { label: "Daño (+1)", key: 'damage' }, { label: "Vida (+10)", key: 'hp' }, { label: "Vel. Atq (+10ms)", key: 'speed' }, { label: "Defensa (+1)", key: 'defense' } ]; 
        statsToUpgrade.forEach((s, i) => { this.createStatButton(rightX, upgradeY + (i * 60), s.label, s.key); }); 
    }

    createStatButton(x, y, label, statKey) { 
        const btn = this.scene.add.rectangle(x, y, 220, 45, 0x006400).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x00ff00); 
        const txt = this.scene.add.text(x, y, label, { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5); 
        btn.on('pointerdown', () => { 
            if (RPGSystem.spendStatPoint(statKey)) { 
                this.refresh(); 
                SaveSystem.save(); 
            } 
        }); 
        this.container.add([btn, txt]); 
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() { 
        updatePlayerStats(); 
        const s = gameState.playerStats; 
        const eq = gameState.equipment; 
        const hero = getCurrentHero(); 
        const clsName = (gameState.selectedClass || "DESCONOCIDO").toUpperCase(); 
        
        // --- FORMATEO DE DATOS "PLAYER FRIENDLY" ---
        
        // Velocidad de Ataque: Convertir Delay (ms) a Ataques/Segundo
        // 1000ms = 1.00 Atk/s, 500ms = 2.00 Atk/s
        const attacksPerSecond = (1000 / s.attackSpeed).toFixed(2);
        const atkSpeedTxt = `${attacksPerSecond} Atk/s (${s.attackSpeed}ms)`; 
        
        // Defensa: Mostrar % estimado de reducción (ej: 1 def = 0.25% aprox)
        const dmgReduction = (s.defense * 0.25).toFixed(1); // Fórmula visual simple
        const defTxt = `${s.defense} (${dmgReduction}% Reducción)`;

        const statsBlock = 
`CLASE: [ ${clsName} ]

-- ATRIBUTOS PRINCIPALES --
⚔️ Daño: ${s.damage}             |  ❤️ Vida: ${Math.floor(s.hp)} / ${s.maxHp}
⚡ Velocidad: ${atkSpeedTxt}
🛡️ Defensa: ${defTxt}

-- COMBATE --
📏 Alcance: ${s.range}m         |  🏃 Movimiento: ${s.moveSpeed}
🎯 Crítico: ${s.critChance}%           |  💥 Daño Crítico: ${s.critDamage}%
🩸 Robo Vida: ${s.lifesteal}%          |  🛡️ Bloqueo: ${s.blockChance}%

-- OTROS --
💖 Regeneración: ${s.regenHp} Hp/s
⚔️⚔️ Golpe Doble: ${s.doubleAttack}%
🌵 Espinas: ${s.thorns}% Daño devuelto
⏳ Reducción CD: ${s.cdr}%`;

        this.heroStatsText.setText(statsBlock); 

        // Equipamiento Visual
        this.equippedTextContainer.removeAll(true); 
        const startX = this.heroStatsText.x; 
        const equipY = this.heroStatsText.y + 280; 

        this.equippedTextContainer.add(this.scene.add.text(startX, equipY, "-- EQUIPAMIENTO ACTUAL --", { fontFamily: 'Roboto', fontSize: '14px', color: '#ffffffff', fontStyle: 'italic'})); 
        
        let slotY = equipY + 30; 
        const slots = [ { key: 'mainHand', label: '🗡️ Arma', cat: 'weapon' }, { key: 'offHand', label: '🛡️ Off', cat: 'armor' }, { key: 'armor', label: '👕 Ropa', cat: 'armor' }, { key: 'accessory', label: '💍 Joya', cat: 'accessory' } ]; 
        
        slots.forEach(slot => { 
            const item = eq[slot.key]; 
            const slotBg = this.scene.add.rectangle(startX + 180, slotY + 10, 360, 35, 0x222222).setOrigin(0.5).setInteractive({useHandCursor: true}); 
            slotBg.setStrokeStyle(1, item ? RARITY[item.rarity].color : 0x555555); 
            
            const name = item ? `${item.name} (+${item.enchant})` : '- VACÍO -'; 
            const color = item ? '#' + item.color.toString(16).padStart(6, '0') : '#888'; 
            
            const txt = this.scene.add.text(startX, slotY, `${slot.label}:`, { fontFamily: 'Roboto', fontSize: '14px', color: '#fff' }); 
            const valTxt = this.scene.add.text(startX + 80, slotY, name, { fontFamily: 'Roboto', fontSize: '14px', color: color, fontStyle: 'bold' }); 
            
            slotBg.on('pointerdown', () => { 
                if (!item) { 
                    if(this.scene.inventoryPanel) this.scene.inventoryPanel.category = slot.cat; 
                    this.scene.switchTab('inventory'); 
                } 
                else { this.showUnequipModal(item, slot.key); } 
            }); 
            
            this.equippedTextContainer.add([slotBg, txt, valTxt]); 
            slotY += 40; 
        }); 
        
        let setsText = "-- BONIFICACIONES DE SET --\n"; 
        if (gameState.activeSets && gameState.activeSets.length > 0) { 
            gameState.activeSets.forEach(set => { 
                setsText += `★ ${set.name}\n`; 
                set.bonuses.forEach(b => setsText += `   ${b}\n`); 
            }); 
        } else {
            setsText += "(Ninguno activado)";
        }
        this.heroSetsText.setText(setsText);

        this.heroLevelText.setText(`NIVEL ${hero.level} (XP: ${hero.xp}/${hero.maxXp})`); 
        this.pointsText.setText(`PUNTOS DISPONIBLES: ${hero.statPoints}`); 
    }

    // --- FUNCIÓN SEGURA DE GUARDADO EN INVENTARIO (Local) ---
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