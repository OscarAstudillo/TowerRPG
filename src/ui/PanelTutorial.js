// src/ui/PanelTutorial.js
import { gameState } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class PanelTutorial {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Muestra un tutorial superpuesto si no se ha visto antes.
     * @param {string} key - Identificador único del tutorial (ej: 'inventory', 'forge')
     * @param {string} title - Título de la ventana
     * @param {string} description - Texto explicativo
     */
    trigger(key, title, description) {
        // 1. Verificar si ya se vio este tutorial
        if (gameState.tutorials && gameState.tutorials[key]) return;

        // 2. Crear contenedor visual (encima de todo, profundidad alta)
        const container = this.scene.add.container(0, 0).setDepth(9999);
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // 3. Fondo oscuro semi-transparente (bloquea clics detrás)
        const bg = this.scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85)
            .setInteractive(); // Esto evita que el jugador haga clic en el panel de atrás

        // 4. Panel de Texto
        const boxWidth = 500;
        const boxHeight = 300;
        const box = this.scene.add.rectangle(w/2, h/2, boxWidth, boxHeight, 0x1a1a1a)
            .setStrokeStyle(4, 0xffd700);

        const titleText = this.scene.add.text(w/2, h/2 - 100, title, { 
            fontFamily: 'Cinzel', fontSize: '28px', color: '#ffd700', fontStyle: 'bold' 
        }).setOrigin(0.5);

        const descText = this.scene.add.text(w/2, h/2 - 10, description, { 
            fontFamily: 'Roboto', fontSize: '18px', color: '#ffffff', align: 'center', wordWrap: { width: boxWidth - 60 }
        }).setOrigin(0.5);

        // 5. Botón "Entendido"
        const btn = this.scene.add.container(w/2, h/2 + 90);
        const btnBg = this.scene.add.rectangle(0, 0, 180, 50, 0x006400)
            .setInteractive({ useHandCursor: true });
        const btnTxt = this.scene.add.text(0, 0, "ENTENDIDO", { 
            fontFamily: 'Roboto', fontSize: '20px', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        btn.add([btnBg, btnTxt]);

        // 6. Lógica de cierre
        const closeTutorial = () => {
            // Marcar como visto
            if (!gameState.tutorials) gameState.tutorials = {};
            gameState.tutorials[key] = true;
            SaveSystem.save(); // Guardar progreso inmediatamente

            // Animación de salida
            this.scene.tweens.add({
                targets: container,
                alpha: 0,
                duration: 250,
                onComplete: () => container.destroy()
            });
        };

        btnBg.on('pointerdown', closeTutorial);

        container.add([bg, box, titleText, descText, btn]);
        
        // Animación de entrada
        container.setAlpha(0);
        this.scene.tweens.add({ targets: container, alpha: 1, duration: 300 });
    }
}