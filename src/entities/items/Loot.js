// src/entities/items/Loot.js
import Phaser from 'phaser';
import { RARITY } from '../../config/GameState.js'; // Importamos los colores globales

export default class Loot extends Phaser.GameObjects.Rectangle {
    // Ahora aceptamos 'rarityKey'
    constructor(scene, x, y, typeKey, rarityKey = 'common') {
        
        const rarityData = RARITY[rarityKey];
        // El color ahora depende de la rareza, no del material
        const color = rarityData.color;

        // Tamaño un poco más grande si es raro
        const size = rarityKey === 'common' ? 15 : 20;

        super(scene, x, y, size, size, color);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.typeKey = typeKey;
        this.rarityKey = rarityKey;
        
        // Borde negro para distinguir mejor los colores claros
        this.setStrokeStyle(2, 0x000000);

        scene.tweens.add({
            targets: this,
            y: y - 20,
            duration: 300,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        scene.time.delayedCall(15000, () => {
            if (this.active) this.destroy();
        });
    }
}