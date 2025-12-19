// src/entities/towers/BuildSite.js
import Phaser from 'phaser';

export default class BuildSite extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 60, 60, 0x00ff00, 0.1); // Un poco transparente
        scene.add.existing(this);
        this.setInteractive({ useHandCursor: true });
        
        this.isOccupied = false;
        this.setStrokeStyle(2, 0x00ff00, 0.5);
    }

    occupy() {
        this.isOccupied = true;
        this.input.enabled = false; // Desactivar clics
        this.setVisible(false); // Ocultar el cuadro verde
    }

    free() {
        this.isOccupied = false;
        this.input.enabled = true; // Reactivar clics
        this.setVisible(true); // Mostrar de nuevo
    }
}