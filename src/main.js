// src/main.js
import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false, 
            gravity: { y: 0 }
        }
    },
    // Cargamos ambas escenas en orden. La primera (MainMenuScene) es la que arranca.
    scene: [MainMenuScene, WorldMapScene, GameScene]
};

const game = new Phaser.Game(config);