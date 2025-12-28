// src/main.js
import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js'; // IMPORTAR
import MainMenuScene from './scenes/MainMenuScene.js';
import HeroSelectScene from './scenes/HeroSelectScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import ChestScene from './scenes/ChestScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'app',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // PreloadScene va PRIMERO
    scene: [PreloadScene, MainMenuScene, HeroSelectScene, GameScene, ResultScene, WorldMapScene, ChestScene]
};

const game = new Phaser.Game(config);