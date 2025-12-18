// src/entities/items/Loot.js
import Phaser from 'phaser';
import { RARITY } from '../../config/GameState.js';

export default class Loot extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, typeKey, rarityKey = 'common') {
        const rarityData = RARITY[rarityKey];
        const color = rarityData.color;
        const size = rarityKey === 'common' ? 15 : 20;

        super(scene, x, y, size, size, color);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.typeKey = typeKey;
        this.rarityKey = rarityKey;
        this.rarityName = rarityData.name; // Guardamos el nombre para el resumen
        
        // Borde visual
        this.setStrokeStyle(2, 0x000000);

        // --- MEJORA: HITBOX MÁS GRANDE ---
        // Aunque el dibujo sea de 15px, la colisión será de 50px
        // Esto hace que sea muy fácil recogerlos
        this.body.setSize(50, 50);
        this.body.setOffset(-15, -15); // Centrar la hitbox más grande

        // Animación de caída (rebote suave)
        scene.tweens.add({
            targets: this,
            y: y + 30, // Caen un poco hacia abajo
            duration: 800,
            ease: 'Bounce.easeOut'
        });

        // Duración: 20 segundos antes de desaparecer
        scene.time.delayedCall(20000, () => {
            if (this.active) {
                // Parpadeo antes de desaparecer
                scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => this.destroy()
                });
            }
        });
    }
}