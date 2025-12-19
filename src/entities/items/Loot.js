// src/entities/items/Loot.js
import Phaser from 'phaser';

export default class Loot extends Phaser.GameObjects.Container {
    constructor(scene, x, y, typeKey, rarityKey) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.typeKey = typeKey;
        this.rarityKey = rarityKey;

        // Colores según material
        let color = 0xffffff;
        if (typeKey === 'wood') color = 0x8b4513; // Marrón
        else if (typeKey === 'copper') color = 0xb87333; // Cobre
        else if (typeKey === 'cloth') color = 0xeeeeee; // Blanco tela
        else if (typeKey === 'leather') color = 0x8b0000; // Cuero rojo oscuro

        // Gráfico del Item (Cuadrado)
        const shape = scene.add.rectangle(0, 0, 15, 15, color);
        shape.setStrokeStyle(1, 0x000000);
        
        // Brillo según rareza (Borde)
        let strokeColor = 0xffffff;
        if (rarityKey === 'uncommon') strokeColor = 0x00ff00;
        if (rarityKey === 'rare') strokeColor = 0x0000ff;
        if (rarityKey === 'epic') strokeColor = 0x800080;
        if (rarityKey === 'legendary') strokeColor = 0xffaa00;

        if (rarityKey !== 'common') {
            shape.setStrokeStyle(2, strokeColor);
            // Efecto de brillo
            scene.tweens.add({
                targets: shape,
                scale: 1.2,
                yoyo: true,
                duration: 500,
                repeat: -1
            });
        }

        this.add(shape);
        this.setSize(15, 15);

        // Movimiento de "salto" al aparecer
        this.body.setVelocity(
            Phaser.Math.Between(-50, 50),
            Phaser.Math.Between(-100, -50)
        );
        this.body.setDrag(100, 100);
    }
}