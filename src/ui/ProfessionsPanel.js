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
        
        // Datos de las profesiones a mostrar
        const profDefs = [
            { key: 'weaponsmith', name: 'FORJA DE ARMAS', icon: '⚔️', desc: 'Probabilidad de forjar armas con encantamiento (+1 a +6).' },
            { key: 'armorsmith', name: 'FORJA DE ARMADURAS', icon: '🛡️', desc: 'Probabilidad de forjar armaduras con encantamiento (+1 a +6).' },
            { key: 'jewelry', name: 'JOYERÍA', icon: '💍', desc: 'Probabilidad de crear joyas con encantamiento (+1 a +6).' },
            { key: 'refining', name: 'REFINAMIENTO', icon: '⚗️', desc: 'Probabilidad de obtener el doble de materiales al refinar.' }
        ];

        let y = this.height * 0.25;
        const startX = this.width * 0.1;

        profDefs.forEach(def => {
            // Obtener datos del estado (si no existe, lvl 1)
            const profData = gameState.professions[def.key] || { level: 1, xp: 0, maxXp: 100 };
            
            // Calcular bonificación actual
            const chance = RPGSystem.getProfessionChance(def.key);
            const chancePct = (chance * 100).toFixed(1);

            // Contenedor de la fila
            const row = this.scene.add.container(0, y);
            
            // Icono
            const icon = this.scene.add.text(startX, 0, def.icon, { fontSize: '40px' }).setOrigin(0.5);
            
            // Nombre y Nivel
            const nameText = this.scene.add.text(startX + 50, -15, `${def.name} - Nivel ${profData.level}`, { 
                fontFamily: 'Cinzel', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' 
            });

            // Barra de XP Fondo
            const barW = this.width * 0.5;
            const barBg = this.scene.add.rectangle(startX + 50 + (barW/2), 15, barW, 10, 0x333333);
            
            // Barra de XP Progreso
            const progress = Math.min(1, profData.xp / profData.maxXp);
            const barFill = this.scene.add.rectangle(startX + 50, 15, barW * progress, 10, 0x00aaff).setOrigin(0, 0.5);
            
            // Texto XP
            const xpText = this.scene.add.text(startX + 50 + barW + 10, 15, `${profData.xp} / ${profData.maxXp} XP`, { 
                fontSize: '12px', color: '#aaaaaa' 
            }).setOrigin(0, 0.5);

            // Texto de Bonificación
            const bonusText = this.scene.add.text(startX + 50, 40, `Bonificación Actual: ${chancePct}% ${def.desc}`, { 
                fontFamily: 'Roboto', fontSize: '14px', color: '#ffd700' 
            });

            row.add([icon, nameText, barBg, barFill, xpText, bonusText]);
            this.listContainer.add(row);

            y += 100; // Espacio para la siguiente fila
        });
    }
}