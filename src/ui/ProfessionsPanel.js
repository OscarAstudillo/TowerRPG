import { gameState } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class ProfessionsPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);

        // Fondo
        const bg = scene.add.rectangle(width/2, height/2, width * 0.9, height * 0.9, 0x000000, 0.95)
            .setStrokeStyle(4, 0x00aaff)
            .setInteractive(); // Bloquea clicks
        this.container.add(bg);

        // Título
        const title = scene.add.text(width/2, height * 0.1, "MAESTRÍA Y PROFESIONES", { 
            fontFamily: 'Cinzel', fontSize: '32px', fontStyle: 'bold', color: '#00aaff', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5);
        this.container.add(title);

        // Botón Cerrar
        const closeBtn = scene.add.text(width * 0.9, height * 0.1, "X", { fontSize: '30px', color: '#ff0000', fontStyle: 'bold' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.hide());
        this.container.add(closeBtn);

        this.listContainer = scene.add.container(0, 0);
        this.container.add(this.listContainer);
    }

    show() {
        this.container.setVisible(true);
        this.refresh();
    }

    hide() {
        this.container.setVisible(false);
    }

    refresh() {
        this.listContainer.removeAll(true);
        
        const profDefs = [
            { key: 'weaponsmith', name: 'FORJA DE ARMAS', icon: '⚔️', desc: 'Chance de encantar armas (+1 a +6).' },
            { key: 'armorsmith', name: 'FORJA DE ARMADURAS', icon: '🛡️', desc: 'Chance de encantar armaduras (+1 a +6).' },
            { key: 'jewelry', name: 'JOYERÍA', icon: '💍', desc: 'Chance de encantar joyas (+1 a +6).' },
            { key: 'engineering', name: 'INGENIERÍA', icon: '⚙️', desc: 'Chance de mejorar partes de torre.' },
            { key: 'refining', name: 'REFINAMIENTO', icon: '⚗️', desc: 'Chance de obtener doble material.' }
        ];

        let y = this.height * 0.25;
        const startX = this.width * 0.1;

        profDefs.forEach(def => {
            let pKey = def.key;
            // Parche por si refining se llama alchemy en otro lado
            if(def.key === 'refining' && !gameState.professions.refining && gameState.professions.alchemy) pKey = 'alchemy';

            const profData = gameState.professions[pKey] || { level: 1, xp: 0, maxXp: 100 };
            const chance = RPGSystem.getProfessionChance(pKey);
            const chancePct = (chance * 100).toFixed(1);

            const row = this.scene.add.container(0, y);
            
            const icon = this.scene.add.text(startX, 0, def.icon, { fontSize: '30px' }).setOrigin(0.5);
            
            const nameText = this.scene.add.text(startX + 40, -12, `${def.name} (Nvl ${profData.level})`, { 
                fontFamily: 'Cinzel', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' 
            });

            // Barra XP
            const barW = this.width * 0.4;
            const barBg = this.scene.add.rectangle(startX + 40 + (barW/2), 10, barW, 6, 0x333333);
            const progress = Math.min(1, profData.xp / profData.maxXp);
            const barFill = this.scene.add.rectangle(startX + 40, 10, barW * progress, 6, 0x00aaff).setOrigin(0, 0.5);
            
            const xpText = this.scene.add.text(startX + 50 + barW, 10, `${Math.floor(profData.xp)}/${profData.maxXp}`, { 
                fontSize: '10px', color: '#aaaaaa' 
            }).setOrigin(0, 0.5);

            const bonusText = this.scene.add.text(startX + 40, 30, `Bonus: ${chancePct}% ${def.desc}`, { 
                fontFamily: 'Roboto', fontSize: '12px', color: '#ffd700' 
            });

            row.add([icon, nameText, barBg, barFill, xpText, bonusText]);
            this.listContainer.add(row);

            y += 80;
        });
    }
}