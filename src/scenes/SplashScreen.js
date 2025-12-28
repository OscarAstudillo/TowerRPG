// src/scenes/SplashScreen.js
import Phaser from 'phaser';
import SaveSystem from '../systems/SaveSystem.js';

export default class SplashScreen extends Phaser.Scene {
    constructor() {
        super('SplashScreen');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Fondo generado en Preload
        this.add.image(w/2, h/2, 'bg_splash').setDisplaySize(w, h);

        // Título
        this.add.text(w/2, h * 0.3, 'TITAN DEFENSE', {
            fontFamily: 'Cinzel', fontSize: '80px', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000000', strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        this.add.text(w/2, h * 0.45, 'RPG TOWER DEFENSE', {
            fontFamily: 'Roboto', fontSize: '30px', color: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Texto Pestañeante
        const pressText = this.add.text(w/2, h * 0.7, 'PULSA CUALQUIER TECLA PARA ENTRAR', {
            fontFamily: 'Roboto', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: pressText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Input para continuar
        this.input.keyboard.once('keydown', () => {
            this.startGame();
        });
        
        this.input.on('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        // Intentar cargar partida
        const hasSave = SaveSystem.load(); 
        
        // Efecto de sonido (si ya implementaste el SoundManager)
        // SoundManager.playSound('ui_click'); 

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (hasSave) {
                // Si hay datos, directo al menú
                this.scene.start('MainMenuScene');
            } else {
                // Si es nuevo, selección de héroe
                this.scene.start('HeroSelectScene');
            }
        });
    }
}