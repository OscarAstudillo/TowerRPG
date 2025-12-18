// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "El Bosque",
        mapX: 200, mapY: 360, // Posición en el mapa mundi
        difficulty: 1.0,
        startCoins: 250,
        rewardGold: 100,
        // IMPORTANTE: El camino debe tener coordenadas válidas
        path: [
            { x: 0, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 500 }, 
            { x: 900, y: 500 }, { x: 900, y: 200 }, { x: 1280, y: 200 }
        ],
        towerSlots: [
            { x: 150, y: 110 }, { x: 150, y: 190 }, { x: 340, y: 300 }, 
            { x: 600, y: 460 }, { x: 860, y: 350 }, { x: 1100, y: 240 }
        ]
    },
    {
        id: 2,
        name: "Cañón Árido",
        mapX: 500, mapY: 200,
        difficulty: 1.3,
        startCoins: 400,
        rewardGold: 250,
        path: [
            { x: 100, y: 720 }, { x: 100, y: 100 }, 
            { x: 1180, y: 100 }, { x: 1180, y: 720 }
        ],
        towerSlots: [
            { x: 140, y: 200 }, { x: 140, y: 500 }, { x: 640, y: 140 }, 
            { x: 1140, y: 200 }, { x: 1140, y: 500 }
        ]
    }
];