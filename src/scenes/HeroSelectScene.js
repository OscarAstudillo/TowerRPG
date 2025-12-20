// src/scenes/HeroSelectScene.js
import Phaser from 'phaser';
import { gameState, updatePlayerStats } from '../config/GameState.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class HeroSelectScene extends Phaser.Scene {
    constructor() {
        super('HeroSelectScene');
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        // Fondo
        this.add.rectangle(cx, cy, w, h, 0x111111);
        this.add.text(cx, h * 0.1, "ELIGE TU HÉROE", { fontSize: '40px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5);

        // Si ya hay una clase guardada y no venimos de "Cambiar Héroe", saltar (opcional, pero el usuario pidió que siempre aparezca o se pueda volver)
        // Aquí asumimos que siempre se muestra si gameState.selectedClass es null, o si venimos forzados.
        
        const classes = [
            { id: 'paladin', name: 'Paladín', color: 0xffff00, desc: 'Tanque y Curador. Alta supervivencia.' },
            { id: 'guerrero', name: 'Guerrero', color: 0xff0000, desc: 'Daño en área y cuerpo a cuerpo.' },
            { id: 'arquero', name: 'Arquero', color: 0x00ff00, desc: 'Daño rápido a distancia.' },
            { id: 'mago', name: 'Mago', color: 0x00ffff, desc: 'Control de masas y daño mágico.' },
            { id: 'asesino', name: 'Asesino', color: 0x550055, desc: 'Daño crítico explosivo.' }
        ];

        let startX = w * 0.15;
        const gap = w * 0.18;

        classes.forEach((cls, i) => {
            const x = startX + (i * gap);
            const y = cy;

            // Tarjeta
            const card = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, 180, 300, 0x222222).setStrokeStyle(2, cls.color).setInteractive({ useHandCursor: true });
            
            // Icono simple
            const icon = this.add.circle(0, -50, 40, cls.color);
            
            // Texto
            const name = this.add.text(0, 20, cls.name.toUpperCase(), { fontSize: '20px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
            const desc = this.add.text(0, 80, cls.desc, { fontSize: '12px', color: '#aaa', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);

            card.add([bg, icon, name, desc]);

            // Efecto Hover
            bg.on('pointerover', () => this.tweens.add({ targets: card, scale: 1.1, duration: 100 }));
            bg.on('pointerout', () => this.tweens.add({ targets: card, scale: 1.0, duration: 100 }));

            // Selección
            bg.on('pointerdown', () => {
                this.selectHero(cls.id);
            });
        });
    }

    selectHero(classId) {
        gameState.selectedClass = classId;
        updatePlayerStats();
        SaveSystem.save();
        
        // Transición bonita
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('MainMenuScene');
        });
    }
}