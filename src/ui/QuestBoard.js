import { gameState, RARITY } from '../config/GameState.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { RECIPES } from '../config/Recipes.js';
import RPGSystem from '../systems/RPGSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import PanelTutorial from './PanelTutorial.js'; // <--- IMPORTAR

export default class QuestBoard {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.container = scene.add.container(0, 0).setVisible(false).setDepth(2000);
        
        // Inicializar el sistema de tutorial
        this.tutorial = new PanelTutorial(scene); // <--- INSTANCIAR

        const blocker = scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8).setInteractive();
        const bg = scene.add.rectangle(width/2, height/2, 800, 700, 0x222222).setStrokeStyle(4, 0xffd700);
        const title = scene.add.text(width/2, height/2 - 300, "TABLÓN DE MISIONES", { fontFamily: 'Cinzel', fontSize: '28px', fontStyle:'bold', color:'#ffd700' }).setOrigin(0.5);
        
        const closeBtn = scene.add.text(width/2 + 350, height/2 - 320, "X", { fontSize: '32px', color: '#ff0000', fontStyle: 'bold' }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.toggle());
        
        this.questListContainer = scene.add.container(width/2, height/2 - 200);
        this.container.add([blocker, bg, title, closeBtn, this.questListContainer]);
    }

    // --- MÉTODOS DE VISIBILIDAD (CORRECCIÓN) ---
    show() {
        // Aseguramos que se generen misiones si es un nuevo día
        RPGSystem.generateDailyQuests();
        this.refresh();
        this.container.setVisible(true);

        // --- ACTIVAR TUTORIAL ---
        this.tutorial.trigger(
            'quests', 
            'TABLÓN DE MISIONES', 
            '¡Completa objetivos diarios para ganar recompensas extra!\n\nCada día tendrás nuevas misiones. Si las completas, vuelve aquí y presiona "RECLAMAR" para obtener Oro, XP y Materiales raros.'
        );
    }

    hide() {
        this.container.setVisible(false);
    }

    toggle() {
        if (this.container.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    // -------------------------------------------

    refresh() {
        this.questListContainer.removeAll(true);
        let y = 0;
        
        if (gameState.quests.active.length === 0) {
            this.questListContainer.add(this.scene.add.text(0, 100, "¡Misiones completadas!\nVuelve mañana.", { fontFamily: 'Roboto', fontSize: '14px', align: 'center', color: '#fff' }).setOrigin(0.5));
            return;
        }

        gameState.quests.active.forEach(quest => {
            const qBg = this.scene.add.rectangle(0, y, 700, 120, 0x333333).setStrokeStyle(1, 0xaaaaaa); 
            const qTitle = this.scene.add.text(-330, y - 40, quest.desc, { fontFamily: 'Cinzel', fontSize: '18px', fontStyle:'bold', color:'#fff', wordWrap: { width: 650 } }).setOrigin(0, 0.5);
            const qProgress = this.scene.add.text(-330, y - 10, `Progreso: ${quest.progress}/${quest.count}`, { fontFamily: 'Roboto', fontSize: '14px', color: '#00ffff' }).setOrigin(0, 0.5);
            
            let rewardText = "Recompensa: ";
            if (quest.reward.gold) rewardText += `$${quest.reward.gold} `;
            if (quest.reward.xp) rewardText += `${quest.reward.xp} XP `;
            if (quest.reward.material) {
                const matName = (RAW_MATERIALS[quest.reward.material] || REFINED_MATERIALS[quest.reward.material] || {name: quest.reward.material}).name;
                rewardText += `3x ${matName} `;
            }
            if (quest.reward.recipe) {
                const r = RECIPES.find(rec => rec.id === quest.reward.recipe);
                const rName = r ? r.name : "Receta Secreta";
                rewardText += `\n📜 PLANO: ${rName}`;
            }

            const qReward = this.scene.add.text(-330, y + 25, rewardText, { fontFamily: 'Roboto', fontSize: '12px', color: '#ffd700' }).setOrigin(0, 0.5);
            
            let statusBtn;
            if (quest.completed) {
                statusBtn = this.scene.add.rectangle(250, y, 120, 40, 0x006400).setInteractive({ useHandCursor: true });
                const btnTxt = this.scene.add.text(250, y, "RECLAMAR", { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
                statusBtn.on('pointerdown', () => {
                    const res = RPGSystem.claimQuestReward(quest.id);
                    if (res.success) {
                        SaveSystem.save(); 
                        this.refresh();
                        if(this.scene.updateGoldText) this.scene.updateGoldText();
                        // Refrescar forja si se obtuvo receta
                        if(res.reward.recipe && this.scene.forgePanel) this.scene.forgePanel.refresh();
                        if(this.scene.showCentralAlert) this.scene.showCentralAlert("¡Recompensa Reclamada!", "#ffd700");
                    }
                });
                this.questListContainer.add([qBg, qTitle, qProgress, qReward, statusBtn, btnTxt]);
            } else {
                statusBtn = this.scene.add.text(250, y, "En Curso", { fontFamily: 'Roboto', fontSize: '14px', color: '#aaaaaa', fontStyle: 'italic' }).setOrigin(0.5);
                this.questListContainer.add([qBg, qTitle, qProgress, qReward, statusBtn]);
            }
            
            y += 140; 
        });
    }
}