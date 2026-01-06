import { gameState } from '../config/GameState.js';
import RPGSystem from '../systems/RPGSystem.js';

export default class ProfessionsPanel {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);

        // Fondo Estilo RPG
        const bg = scene.add.rectangle(width/2, height/2, width * 0.9, height * 0.9, 0x0a0a0a, 0.95)
            .setStrokeStyle(3, 0x00aaff)
            .setInteractive(); 
        this.container.add(bg);

        // Título Estilizado
        const title = scene.add.text(width/2, height * 0.1, "MAESTRÍA Y PROFESIONES", { 
            fontFamily: 'Cinzel', fontSize: '36px', fontStyle: 'bold', color: '#00aaff', stroke: '#000', strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#0055aa', blur: 5, fill: true }
        }).setOrigin(0.5);
        this.container.add(title);

        // Botón Cerrar
        const closeBtn = scene.add.text(width * 0.9, height * 0.1, "X", { fontSize: '32px', color: '#ff3333', fontStyle: 'bold' })
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
            { key: 'weaponsmith', name: 'ARMERO', icon: '⚔️', desc: 'Maestría en Forja de Armas' },
            { key: 'armorsmith', name: 'ARMADURAS', icon: '🛡️', desc: 'Maestría en Forja de Defensa' },
            { key: 'jewelry', name: 'JOYERÍA', icon: '💍', desc: 'Arte de crear Accesorios Mágicos' },
            { key: 'engineering', name: 'INGENIERÍA', icon: '⚙️', desc: 'Mejora de Torres y Mecanismos' },
            { key: 'refining', name: 'REFINAMIENTO', icon: '⚗️', desc: 'Eficiencia en Procesamiento de Materiales' }
        ];

        let startY = this.height * 0.22;
        const cardWidth = this.width * 0.8;
        const cardHeight = 85;
        const centerX = this.width / 2;

        profDefs.forEach((def, i) => {
            let pKey = def.key;
            // Compatibilidad
            if(def.key === 'refining' && !gameState.professions.refining && gameState.professions.alchemy) pKey = 'alchemy';

            const profData = gameState.professions[pKey] || { level: 1, xp: 0, maxXp: 100 };
            const chance = RPGSystem.getProfessionChance(pKey);
            const chancePct = (chance * 100).toFixed(1);

            const card = this.scene.add.container(centerX, startY);
            
            // Fondo Tarjeta
            const cardBg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x1a1a1a).setStrokeStyle(1, 0x444444);
            
            // Icono Grande
            const iconBg = this.scene.add.circle(-cardWidth/2 + 50, 0, 35, 0x333333);
            const icon = this.scene.add.text(-cardWidth/2 + 50, 0, def.icon, { fontSize: '40px' }).setOrigin(0.5);
            
            // Textos
            const nameText = this.scene.add.text(-cardWidth/2 + 100, -25, def.name.toUpperCase(), { 
                fontFamily: 'Cinzel', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' 
            });
            
            const descText = this.scene.add.text(-cardWidth/2 + 100, 0, def.desc, { 
                fontFamily: 'Roboto', fontSize: '14px', color: '#aaaaaa' 
            });

            // Nivel y Bonus
            const lvlText = this.scene.add.text(cardWidth/2 - 20, -25, `Nvl. ${profData.level}`, { 
                fontFamily: 'Cinzel', fontSize: '24px', color: '#00aaff', fontStyle:'bold' 
            }).setOrigin(1, 0);

            const bonusText = this.scene.add.text(cardWidth/2 - 20, 5, `Bonus: +${chancePct}%`, { 
                fontFamily: 'Roboto', fontSize: '14px', color: '#ffd700', fontStyle:'bold' 
            }).setOrigin(1, 0);

            // Barra de XP (Estilo Slim)
            const barW = cardWidth - 20;
            const barBg = this.scene.add.rectangle(0, 35, barW, 6, 0x000000);
            const progress = Math.min(1, profData.xp / profData.maxXp);
            const barFill = this.scene.add.rectangle(-barW/2, 35, barW * progress, 6, 0x00aaff).setOrigin(0, 0.5);
            
            // Overlay brillo en barra
            const barGlow = this.scene.add.rectangle(-barW/2, 35, barW * progress, 2, 0xffffff, 0.3).setOrigin(0, 0.5);

            card.add([cardBg, iconBg, icon, nameText, descText, lvlText, bonusText, barBg, barFill, barGlow]);
            this.listContainer.add(card);

            startY += cardHeight + 20;
        });
    }
}