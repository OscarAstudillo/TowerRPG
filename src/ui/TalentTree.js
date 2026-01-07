import { gameState, updatePlayerStats, getCurrentHero } from '../config/GameState.js';
import { TALENTS } from '../config/Talents.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import PanelTutorial from './PanelTutorial.js'; // <--- IMPORTAR

export default class TalentTree {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false);
        
        // Inicializar el sistema de tutorial
        this.tutorial = new PanelTutorial(scene); // <--- INSTANCIAR

        this.talentPointsText = scene.add.text(width/2, height * 0.18, "PUNTOS: 0", { fontFamily: 'Cinzel', fontSize: '24px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);
        this.container.add(this.talentPointsText);
        
        // Máscara para scroll
        const maskShape = scene.make.graphics(); 
        maskShape.fillStyle(0xffffff); 
        maskShape.fillRect(width * 0.1, height * 0.25, width * 0.8, height * 0.6); 
        const mask = maskShape.createGeometryMask();
        
        this.talentTreeContainer = scene.add.container(0, height * 0.3); 
        this.talentTreeContainer.setMask(mask); 
        this.container.add(this.talentTreeContainer);
        
        // Botones de Scroll
        const upBtn = scene.add.text(width - 50, height * 0.3, "▲", { fontSize: '40px', color: '#00ff00' }).setInteractive();
        const downBtn = scene.add.text(width - 50, height * 0.8, "▼", { fontSize: '40px', color: '#00ff00' }).setInteractive();
        
        upBtn.on('pointerdown', () => { this.talentTreeContainer.y = Math.min(height * 0.3, this.talentTreeContainer.y + 100); }); 
        downBtn.on('pointerdown', () => { this.talentTreeContainer.y -= 100; }); 
        
        this.container.add([upBtn, downBtn]);
    }

    show() { 
        this.container.setVisible(true); 
        this.refresh(); 

        // --- ACTIVAR TUTORIAL ---
        this.tutorial.trigger(
            'talents', 
            'ÁRBOL DE TALENTOS', 
            'A medida que tu Héroe sube de nivel, desbloqueas filas de talentos poderosos.\n\nEn cada nivel (10, 20, 30...) debes elegir UNO de dos caminos. ¡Elige sabiamente para definir tu estilo de juego!'
        );
    }

    hide() { this.container.setVisible(false); }

    refresh() { 
        const hero = getCurrentHero(); 
        this.talentPointsText.setText(`PUNTOS DE TALENTO: ${hero.talentPoints}`); 
        this.talentTreeContainer.removeAll(true); 
        const cls = gameState.selectedClass; 
        const allTalents = TALENTS[cls] || []; 
        const w = this.width;
        let currentY = 0; 
        
        const tiers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; 
        tiers.forEach(tierLevel => { 
            const tierTalents = allTalents.filter(t => t.tier === tierLevel); 
            if (tierTalents.length === 0) return; 
            
            const isUnlocked = hero.level >= tierLevel; 
            const pickedTalent = tierTalents.find(t => hero.talents.includes(t.id)); 
            
            const rowLabel = this.scene.add.text(w * 0.15, currentY, `NIVEL ${tierLevel}`, { fontFamily: 'Cinzel', fontSize:'18px', fontStyle: 'bold', color: isUnlocked ? '#fff' : '#555' }).setOrigin(0, 0.5); 
            this.talentTreeContainer.add(rowLabel); 
            
            tierTalents.forEach((talent, idx) => { 
                const isSelected = (pickedTalent && pickedTalent.id === talent.id); 
                const isBlocked = (pickedTalent && pickedTalent.id !== talent.id); 
                const btnX = w/2 + (idx === 0 ? -150 : 150); 
                
                let color = 0x333333; 
                if (isSelected) color = 0x006400; 
                else if (isBlocked || !isUnlocked) color = 0x111111; 
                
                const btn = this.scene.add.rectangle(btnX, currentY, 280, 60, color).setStrokeStyle(1, isSelected ? 0x00ff00 : 0xaaaaaa); 
                const nameTxt = this.scene.add.text(btnX, currentY - 15, talent.name, { fontFamily: 'Roboto', fontSize:'14px', fontStyle:'bold', color: isBlocked ? '#555' : '#fff' }).setOrigin(0.5); 
                const descTxt = this.scene.add.text(btnX, currentY + 15, talent.desc, { fontFamily: 'Roboto', fontSize:'10px', color: '#ccc', wordWrap: { width: 260 } }).setOrigin(0.5); 
                
                if (isUnlocked && !pickedTalent && hero.talentPoints > 0) { 
                    btn.setInteractive({ useHandCursor: true }); 
                    btn.on('pointerdown', () => this.learnTalent(talent)); 
                    btn.setStrokeStyle(2, 0xffd700); 
                } 
                this.talentTreeContainer.add([btn, nameTxt, descTxt]); 
            }); 
            currentY += 90; 
        }); 
    }
    
    learnTalent(talent) { 
        if (RPGSystem.spendTalentPoint(talent.id, 1)) { 
            updatePlayerStats(); 
            SaveSystem.save(); 
            this.refresh(); 
            if(this.scene.showCentralAlert) this.scene.showCentralAlert(`¡TALENTO APRENDIDO!`, '#00ff00'); 
        } 
    }
}