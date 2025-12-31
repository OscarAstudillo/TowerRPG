// src/scenes/PreloadScene.js
import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // --- BARRA DE CARGA ---
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Cargando Recursos...', {
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

        // --- CARGA DE ASSETS (AQUÍ ES DONDE AGREGAS TUS IMÁGENES) ---
        // La carpeta 'public' es la raíz del servidor, así que la ruta es 'assets/images/...'
        
        // PASTO (Tile 0)
        this.load.image('tile_0', 'assets/images/tile_0.jpg'); 
        
        // EJEMPLO: Si agregas más imágenes en el futuro, cárgalas aquí así:
        // this.load.image('tile_1', 'assets/images/camino.jpg'); 
        // this.load.image('tile_3', 'assets/images/arbol.png');
    }

    create() {
        // --- GENERACIÓN DE SPRITES PROCEDURALES (Fallback por si no hay imágenes) ---
        
        // 1. FONDOS
        this.createBackgroundTexture('bg_splash', 0x000033, 0x000000); 
        this.createBackgroundTexture('bg_menu', 0x1a1a2e, 0x16213e);   

        // 2. HÉROES
        this.createHeroTexture('hero_guerrero', 0xff0000, 'sword');
        this.createHeroTexture('hero_mago', 0x00ffff, 'staff');
        this.createHeroTexture('hero_arquero', 0x00ff00, 'bow');
        this.createHeroTexture('hero_asesino', 0x800080, 'dagger');

        // 3. ITEMS
        this.createItemTexture('icon_sword', 0xcccccc, 'sword');
        this.createItemTexture('icon_bow', 0x8b4513, 'bow');
        this.createItemTexture('icon_staff', 0x8e44ad, 'staff');
        this.createItemTexture('icon_dagger', 0x555555, 'dagger');
        this.createItemTexture('icon_armor', 0x3498db, 'shield'); 
        this.createItemTexture('icon_shield', 0xf1c40f, 'shield');
        this.createItemTexture('icon_accessory', 0xe74c3c, 'ring');
        this.createItemTexture('icon_tower_part', 0x95a5a6, 'cog');

        // 4. MATERIALES
        this.createMaterialTexture('mat_wood', 0x8b4513);
        this.createMaterialTexture('mat_ore', 0x7f8c8d);
        this.createMaterialTexture('mat_cloth', 0xecf0f1);
        this.createMaterialTexture('mat_leather', 0xd35400);

        // 5. ENEMIGOS
        this.createEnemyTexture('enemy_slime', 0x00ff00);
        this.createEnemyTexture('enemy_goblin', 0x006400);
        this.createEnemyTexture('enemy_skeleton', 0xdddddd);
        this.createEnemyTexture('enemy_boss', 0x800000, true);

        // 6. UTILS
        this.createBaseTowerTexture();
        
        const p = this.make.graphics({x:0, y:0, add:false});
        p.fillStyle(0xffffff); 
        p.fillCircle(8, 8, 8);
        p.generateTexture('base_projectile', 16, 16);

        if (!this.textures.exists('pixel')) {
            const px = this.make.graphics({x:0, y:0, add:false});
            px.fillStyle(0xffffff); 
            px.fillRect(0, 0, 4, 4);
            px.generateTexture('pixel', 4, 4);
        }

        // Iniciar el juego
        this.scene.start('SplashScreen');
    }

    // --- HELPERS PARA DIBUJAR ---
    createBackgroundTexture(key, color1, color2) {
        const w = 1280, h = 720;
        const g = this.make.graphics({x:0, y:0, add:false});
        g.fillGradientStyle(color1, color1, color2, color2, 1);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
    }

    createHeroTexture(key, color, weapon) {
        const g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color); g.fillRect(10, 10, 44, 44);
        g.lineStyle(2, 0xffffff); g.strokeRect(10, 10, 44, 44);
        g.fillStyle(0xffccaa); g.fillRect(20, 15, 24, 20);
        g.fillStyle(0x000000); g.fillRect(24, 20, 4, 4); g.fillRect(36, 20, 4, 4); 
        g.generateTexture(key, 64, 64);
    }

    createItemTexture(key, color, type) {
        const g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(0x222222); g.fillCircle(20, 20, 18); 
        g.fillStyle(color); g.fillCircle(20, 20, 10);
        g.generateTexture(key, 40, 40);
    }

    createMaterialTexture(key, color) {
        const g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color); g.fillCircle(16, 16, 12);
        g.generateTexture(key, 32, 32);
    }

    createEnemyTexture(key, color, isBoss=false) {
        const s = isBoss ? 64 : 32;
        const g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color); g.fillRect(0, 0, s, s);
        g.generateTexture(key, s, s);
    }

    createBaseTowerTexture() {
        const t = this.make.graphics({x:0, y:0, add:false});
        t.fillStyle(0xffffff); t.fillRect(0, 0, 40, 40); 
        t.generateTexture('base_tower', 40, 40);
    }
}