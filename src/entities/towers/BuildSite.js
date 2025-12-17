// src/entities/towers/BuildSite.js
import Phaser from 'phaser';

export default class BuildSite extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        // Cuadrado blanco (0xffffff), semitransparente (alpha 0.3), tamaño 40x40
        super(scene, x, y, 40, 40, 0xffffff, 0.3);
        
        scene.add.existing(this);
        
        // Lo hacemos interactivo para detectar clics
        this.setInteractive({ useHandCursor: true });
        
        // Borde blanco brillante
        this.setStrokeStyle(2, 0xffffff);

        this.isOccupied = false; // ¿Ya tiene torre?

        // Efecto al pasar el mouse por encima (Hover)
        this.on('pointerover', () => {
            if (!this.isOccupied) this.setFillStyle(0x00ff00, 0.5); // Se pone verde
        });

        this.on('pointerout', () => {
            if (!this.isOccupied) this.setFillStyle(0xffffff, 0.3); // Vuelve a blanco
        });
    }

    occupy() {
        this.isOccupied = true;
        this.setVisible(false); // Ocultar el cuadrado blanco cuando hay torre
        this.disableInteractive(); // Ya no se puede clicar
    }
}