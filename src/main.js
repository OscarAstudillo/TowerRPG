import Phaser from 'phaser';
import './style.css'; // Asegúrate de que esta línea esté para cargar los estilos

import PreloadScene from './scenes/PreloadScene';
import SplashScreen from './scenes/SplashScreen';
import MainMenuScene from './scenes/MainMenuScene';
import HeroSelectScene from './scenes/HeroSelectScene';
import WorldMapScene from './scenes/WorldMapScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';
import ChestScene from './scenes/ChestScene';

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'app',
    backgroundColor: '#000000',
    
    // --- INICIO: CONFIGURACIÓN RESPONSIVA ---
    scale: {
        mode: Phaser.Scale.FIT, // Escala para ajustar manteniendo proporción
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centra vertical y horizontalmente
        min: {
            width: 320,
            height: 180
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    // --- FIN: CONFIGURACIÓN RESPONSIVA ---

    physics: {
        default: 'arcade',
        arcade: {
            debug: false, 
            gravity: { y: 0 }
        }
    },
    
    // Optimizaciones de renderizado para móviles
    render: {
        pixelArt: false,
        antialias: true
    },

    scene: [
        PreloadScene,
        SplashScreen,
        MainMenuScene,
        HeroSelectScene,
        WorldMapScene,
        GameScene,
        ResultScene,
        ChestScene
    ]
};

const game = new Phaser.Game(config);