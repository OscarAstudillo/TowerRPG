import { gameState, getTowerBonuses } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class TowersPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        this.towerViewPage = 0; // 0 = Básicas, 1 = Especiales
        
        this.towersPageContainer = scene.add.container(0, 0);
        this.container.add(this.towersPageContainer);

        const toggleBtn = scene.add.text(width/2, height * 0.18, "VER MÁS TORRES >", { 
            fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#00ffff' 
        }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        
        toggleBtn.on('pointerdown', () => {
            this.towerViewPage = (this.towerViewPage === 0) ? 1 : 0;
            toggleBtn.setText(this.towerViewPage === 0 ? "VER MÁS TORRES >" : "< VOLVER");
            this.refresh();
        });
        
        this.container.add(toggleBtn);
    }

    show() { this.container.setVisible(true); this.refresh(); }
    hide() { this.container.setVisible(false); }

    refresh() { 
        this.towersPageContainer.removeAll(true);
        
        const allTypes = ['archer', 'cannon', 'mage', 'tesla', 'poison', 'quake'];
        const allNames = ['ARQUERO', 'CAÑÓN', 'MAGO', 'TESLA', 'VENENO', 'TERREMOTO'];
        
        const startIdx = this.towerViewPage * 3;
        const endIdx = startIdx + 3;
        
        const currentTypes = allTypes.slice(startIdx, endIdx);
        const currentNames = allNames.slice(startIdx, endIdx);
        
        const startX = this.width * 0.2; 
        const gap = this.width * 0.3; 

        currentTypes.forEach((type, i) => { 
            const x = startX + (i * gap); 
            const y = this.height * 0.25; 
            
            const title = this.scene.add.text(x, y, currentNames[i], { fontFamily: 'Cinzel', fontSize: '20px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5); 
            
            // Stats (Protección contra undefined)
            const eq = gameState.towerEquipment[type] || { slot1: null, slot2: null }; 
            
            let bonuses = { dmg: 0, range: 0, speed: 0, dbl: 0 }; 
            [eq.slot1, eq.slot2].forEach(it => { 
                if (it && it.stats) { 
                    if (it.stats.damage) bonuses.dmg += it.stats.damage; 
                    if (it.stats.range) bonuses.range += it.stats.range; 
                    if (it.stats.attackSpeed) bonuses.speed += it.stats.attackSpeed; 
                    if (it.stats.doubleAttack) bonuses.dbl += it.stats.doubleAttack; 
                } 
            }); 
            
            const statsText = this.scene.add.text(x, y + 100, 
                `Daño Extra: +${bonuses.dmg}\nRango: +${bonuses.range}\nVelocidad: +${bonuses.speed}ms\nDoble Atq: ${bonuses.dbl}%`, 
                { fontFamily: 'Roboto', fontSize: '14px', color: '#aaa', align: 'center' }
            ).setOrigin(0.5); 
            
            this.towersPageContainer.add([title, statsText]); 
            
            for (let s = 1; s <= 2; s++) { 
                const slotY = y + 200 + (s * 80); 
                const slotBg = this.scene.add.rectangle(x, slotY, 240, 60, 0x222222).setStrokeStyle(1, 0xffffff).setInteractive({ useHandCursor: true }); 
                
                const item = eq[`slot${s}`]; 
                const slotTxt = this.scene.add.text(x, slotY, item ? `${item.name} (+${item.enchant})` : `Slot ${s}: Vacío`, { 
                    fontFamily: 'Roboto', fontSize: '12px', wordWrap: {width: 220}, align: 'center', 
                    color: item ? ('#' + (item.color || 0xffffff).toString(16).padStart(6, '0')) : '#aaaaaa'
                }).setOrigin(0.5); 
                
                slotBg.on('pointerdown', () => { 
                    if (item) { this.showTowerUnequipModal(item, type, `slot${s}`); } 
                    else { 
                        this.scene.inventoryPanel.category = 'tower_part'; 
                        this.scene.switchTab('inventory'); 
                    } 
                }); 
                
                this.towersPageContainer.add([slotBg, slotTxt]); 
            } 
        }); 
    }
    
    showTowerUnequipModal(item, towerType, slotKey) { 
        const modal = this.scene.add.container(this.width/2, this.height/2).setDepth(2000); 
        const bg = this.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.95).setStrokeStyle(2, item.color); 
        const title = this.scene.add.text(0, -100, item.name, { fontFamily: 'Cinzel', fontSize: '22px', fontStyle:'bold', color: '#' + item.color.toString(16).padStart(6,'0') }).setOrigin(0.5); 
        const statsStr = JSON.stringify(item.stats, null, 2).replace(/{|}|"/g, ''); 
        const info = this.scene.add.text(0, -20, statsStr, { fontFamily: 'Roboto', fontSize: '14px', color: '#fff' }).setOrigin(0.5); 
        
        const btnUnequip = this.scene.add.rectangle(0, 80, 200, 40, 0x8b0000).setInteractive({useHandCursor:true}); 
        const txtUnequip = this.scene.add.text(0, 80, "DESEQUIPAR", { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5); 
        
        const btnClose = this.scene.add.text(0, 130, "Cancelar", { fontFamily: 'Roboto', fontSize: '14px', color: '#aaa' }).setInteractive({useHandCursor:true}).setOrigin(0.5); 
        
        btnUnequip.on('pointerdown', () => { 
            if (gameState.towerEquipment[towerType][slotKey] && gameState.towerEquipment[towerType][slotKey].id === item.id) { 
                gameState.towerEquipment[towerType][slotKey] = null; 
                this.scene.safeAddItemToInventory(item); 
                SaveSystem.save(); 
                this.refresh(); 
                modal.destroy(); 
                this.scene.showCentralAlert("Mejora desequipada", "#ffff00"); 
            } else { 
                this.scene.showCentralAlert("Error: Ya no está equipada", "#ff0000"); 
                modal.destroy(); 
            } 
        }); 
        
        btnClose.on('pointerdown', () => modal.destroy()); 
        modal.add([bg, title, info, btnUnequip, txtUnequip, btnClose]); 
        this.container.add(modal); 
    }
}