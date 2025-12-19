// src/main.js
import Phaser from 'phaser';
import WorldMapScene from './scenes/WorldMapScene.js';
import GameScene from './scenes/GameScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 960, // --- CAMBIO: Aumentado para tener márgenes (120 top + 720 map + 120 bot)
    backgroundColor: '#1a1a1a', // Color de fondo para los márgenes
    parent: 'app',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MainMenuScene, WorldMapScene, GameScene]
};

const game = new Phaser.Game(config);