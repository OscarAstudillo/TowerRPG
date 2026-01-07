// src/systems/GameTutorialManager.js
import { gameState } from '../config/GameState.js';
import SaveSystem from './SaveSystem.js';

export default class GameTutorialManager {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.stepIndex = 0;
        
        // Pasos del Tutorial
        this.steps = [
            {
                title: "BIENVENIDO GUARDIÁN",
                text: "Defiende el núcleo de las hordas enemigas.\nSi tu vida llega a 0, pierdes la partida.\n\nEl juego está PAUSADO mientras lees esto."
            },
            {
                title: "MOVIMIENTO Y ATAQUE",
                text: "Tu Héroe ataca automáticamente a los enemigos cercanos.\n\nUsa [WASD] o las [FLECHAS] para moverte.\n¡También puedes hacer CLIC en el mapa para ir a un punto!"
            },
            {
                title: "HABILIDADES",
                text: "Usa tus poderes con [Q] y [E].\n\nEl DASH [SHIFT] te permite esquivar ataques y moverte rápido.\nTu habilidad definitiva se activa con [ESPACIO]."
            },
            {
                title: "CONSTRUCCIÓN DE TORRES",
                text: "1. Selecciona una torre con las teclas [1-6].\n2. Haz clic en los CÍRCULOS DEL SUELO para construir.\n\n¡Necesitas ORO para construir y mejorar tus defensas!"
            },
            {
                title: "¡A LA BATALLA!",
                text: "Sobrevive a todas las oleadas para ganar.\n\n¡Buena suerte!"
            }
        ];

        this.overlay = null;
        this.box = null;
    }

    start() {
        // Verificar si ya se completó el tutorial del juego
        if (gameState.tutorials && gameState.tutorials['game_intro']) return;

        this.isActive = true;
        this.stepIndex = 0;
        
        // PAUSAR EL JUEGO (Igual que el menú de pausa)
        this.scene.physics.pause();
        this.scene.tweens.pauseAll();
        this.scene.time.paused = true;
        
        if(this.scene.enemies) this.scene.enemies.runChildUpdate = false;
        if(this.scene.projectiles) this.scene.projectiles.runChildUpdate = false;

        // Desactivar input del juego temporalmente
        this.scene.input.keyboard.enabled = false;

        this.createUI();
        this.showStep(0);
    }

    createUI() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // Contenedor principal (profundidad máxima)
        this.container = this.scene.add.container(0, 0).setDepth(30000).setScrollFactor(0);

        // Fondo oscuro bloqueante
        const bg = this.scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setInteractive();
        
        // Caja de texto
        const boxWidth = 600;
        const boxHeight = 350;
        const box = this.scene.add.rectangle(w/2, h/2, boxWidth, boxHeight, 0x111111)
            .setStrokeStyle(4, 0x00ff00);

        // Título
        this.titleText = this.scene.add.text(w/2, h/2 - 120, "", { 
            fontFamily: 'Cinzel', fontSize: '32px', color: '#00ff00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // Descripción
        this.descText = this.scene.add.text(w/2, h/2 - 20, "", { 
            fontFamily: 'Roboto', fontSize: '20px', color: '#ffffff', 
            align: 'center', wordWrap: { width: boxWidth - 60 }, lineSpacing: 10
        }).setOrigin(0.5);

        // Botón Siguiente
        this.btn = this.scene.add.container(w/2, h/2 + 110);
        const btnBg = this.scene.add.rectangle(0, 0, 200, 50, 0x006400)
            .setInteractive({ useHandCursor: true });
        
        this.btnText = this.scene.add.text(0, 0, "SIGUIENTE", { 
            fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // Evento del botón (manual porque el input keyboard está desactivado)
        btnBg.on('pointerdown', () => this.nextStep());

        this.btn.add([btnBg, this.btnText]);
        this.container.add([bg, box, this.titleText, this.descText, this.btn]);
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.finish();
            return;
        }

        const step = this.steps[index];
        this.titleText.setText(step.title);
        this.descText.setText(step.text);

        if (index === this.steps.length - 1) {
            this.btnText.setText("JUGAR");
        } else {
            this.btnText.setText("SIGUIENTE >");
        }
    }

    nextStep() {
        this.stepIndex++;
        this.showStep(this.stepIndex);
    }

    finish() {
        this.isActive = false;
        if (this.container) this.container.destroy();

        // Marcar como completado
        if (!gameState.tutorials) gameState.tutorials = {};
        gameState.tutorials['game_intro'] = true;
        SaveSystem.save();

        // REANUDAR EL JUEGO
        this.scene.input.keyboard.enabled = true; // Reactivar teclado
        this.scene.physics.resume();
        this.scene.tweens.resumeAll();
        this.scene.time.paused = false;
        
        if(this.scene.enemies) this.scene.enemies.runChildUpdate = true;
        if(this.scene.projectiles) this.scene.projectiles.runChildUpdate = true;
    }
}