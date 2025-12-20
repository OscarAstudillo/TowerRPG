// src/entities/items/Loot.js
import Phaser from 'phaser';

export default class Loot extends Phaser.GameObjects.Container {
    constructor(scene, x, y, typeKey, rarityKey) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.typeKey = typeKey;     // 'wood', 'potion', 'coins', etc.
        this.rarityKey = rarityKey; // 'common', 'rare', etc.
        this.isConsumable = false;

        // Configuración visual según el tipo
        let color = 0xffffff;
        let shapeType = 'rect'; // 'rect' o 'circle'
        let scale = 1;

        // --- MATERIALES (Inventario) ---
        if (typeKey === 'wood') { color = 0x8b4513; }
        else if (typeKey === 'copper') { color = 0xb87333; }
        else if (typeKey === 'cloth') { color = 0xeeeeee; }
        else if (typeKey === 'leather') { color = 0x8b0000; }
        
        // --- CONSUMIBLES (Efecto Inmediato) ---
        else if (typeKey === 'potion_hp') { 
            color = 0xff0000; shapeType = 'circle'; this.isConsumable = true; 
        }
        else if (typeKey === 'coin_bag') { 
            color = 0xffd700; shapeType = 'circle'; this.isConsumable = true; 
        }
        else if (typeKey === 'xp_tome') { 
            color = 0x0000ff; shapeType = 'rect'; this.isConsumable = true; scale = 1.2;
        }

        // Crear la forma geométrica
        let shape;
        if (shapeType === 'circle') {
            shape = scene.add.circle(0, 0, 8, color); // Radio 8
        } else {
            shape = scene.add.rectangle(0, 0, 16, 16, color);
        }
        
        shape.setStrokeStyle(1, 0x000000);
        
        // Brillo según rareza (solo para materiales o tomos raros)
        let strokeColor = 0xffffff;
        if (rarityKey === 'uncommon') strokeColor = 0x00ff00;
        else if (rarityKey === 'rare') strokeColor = 0x0000ff;
        else if (rarityKey === 'epic') strokeColor = 0x800080;
        else if (rarityKey === 'legendary') strokeColor = 0xffaa00;

        // Si es raro o es consumible valioso, brilla
        if (rarityKey !== 'common' || this.isConsumable) {
            shape.setStrokeStyle(2, this.isConsumable ? 0xffffff : strokeColor);
            
            scene.tweens.add({
                targets: shape,
                scale: 1.2 * scale,
                yoyo: true,
                duration: 600,
                repeat: -1
            });
        }

        this.add(shape);
        this.setSize(20, 20); // Tamaño del cuerpo físico

        // Movimiento de "salto" al aparecer
        this.body.setVelocity(
            Phaser.Math.Between(-50, 50),
            Phaser.Math.Between(-150, -100)
        );
        this.body.setDrag(100, 100);
        
        // Despawn automático tras 15 segundos para no saturar
        scene.time.delayedCall(15000, () => {
            if (this.active) {
                scene.tweens.add({
                    targets: this, alpha: 0, duration: 500,
                    onComplete: () => this.destroy()
                });
            }
        });
    }
}