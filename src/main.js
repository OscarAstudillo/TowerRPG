// src/main.js
import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene';
import WorldMapScene from './scenes/WorldMapScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 960, // <--- CAMBIO IMPORTANTE: De 720 a 960
    parent: 'app',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    // Ajustar escala para que quepa en pantallas pequeñas si es necesario
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainMenuScene, WorldMapScene, GameScene, ResultScene]
};

new Phaser.Game(config);