// src/scenes/PreloadScene.js
import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // BARRA DE CARGA
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Cargando Assets...', {
            font: '20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // AQUÍ CARGARÍAS TUS IMÁGENES REALES EN EL FUTURO:
        // this.load.image('tower_archer', 'assets/towers/archer.png');
    }

    create() {
        // GENERAR TEXTURAS (Placeholder avanzado)
        // Esto crea "imágenes" en memoria para que no uses simples rectángulos
        
        // 1. Textura Genérica de Torre (Base + Torreta)
        const t = this.make.graphics({x:0, y:0, add:false});
        t.fillStyle(0xffffff); // Blanco para poder teñir (tint)
        t.fillRect(0, 0, 40, 40); // Base
        t.fillStyle(0xcccccc);
        t.fillCircle(20, 20, 14); // Torreta
        t.fillStyle(0x000000);
        t.fillRect(18, 0, 4, 20); // Cañón
        t.generateTexture('base_tower', 40, 40);

        // 2. Textura Genérica de Enemigo (Cuerpo + Ojos)
        const e = this.make.graphics({x:0, y:0, add:false});
        e.fillStyle(0xffffff); // Blanco base
        e.fillRect(0, 0, 32, 32); // Cuerpo
        e.fillStyle(0x000000); // Ojos
        e.fillRect(6, 8, 6, 6);
        e.fillRect(20, 8, 6, 6);
        e.fillRect(8, 22, 16, 4); // Boca
        e.generateTexture('base_enemy', 32, 32);

        // 3. Textura de Proyectil (Bola brillante)
        const p = this.make.graphics({x:0, y:0, add:false});
        p.fillStyle(0xffffff);
        p.fillCircle(8, 8, 8);
        p.generateTexture('base_projectile', 16, 16);

        // 4. Textura Pixel (para partículas)
        if (!this.textures.exists('pixel')) {
            const px = this.make.graphics({x:0, y:0, add:false});
            px.fillStyle(0xffffff);
            px.fillRect(0,0,4,4);
            px.generateTexture('pixel', 4, 4);
        }

        // Iniciar el juego
        this.scene.start('MainMenuScene');
    }
}