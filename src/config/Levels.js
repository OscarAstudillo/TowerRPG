// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "Praderas del Inicio",
        mapX: 200, mapY: 600, 
        startCoins: 400,
        difficulty: 1.0,
        rewardGold: 100,
        // Camino centrado (Y entre 180 y 700)
        path: [
            { x: 0, y: 400 },
            { x: 400, y: 400 },
            { x: 400, y: 200 }, // Lejos del borde superior
            { x: 800, y: 200 },
            { x: 800, y: 650 }, // Lejos del borde inferior
            { x: 1280, y: 650 }
        ],
        towerSlots: [
            { x: 200, y: 500 }, { x: 300, y: 300 }, 
            { x: 500, y: 150 }, { x: 700, y: 300 },
            { x: 900, y: 550 }, { x: 1100, y: 550 }
        ]
    },
    {
        id: 2,
        name: "Cruce Peligroso",
        mapX: 600, mapY: 400,
        startCoins: 550,
        difficulty: 1.5,
        rewardGold: 250,
        path: [
            { x: 0, y: 250 },
            { x: 300, y: 250 },
            { x: 300, y: 700 }, // Bajada pronunciada
            { x: 900, y: 700 },
            { x: 900, y: 300 }, // Subida
            { x: 1280, y: 300 }
        ],
        towerSlots: [
            { x: 150, y: 350 }, { x: 450, y: 600 },
            { x: 700, y: 800 }, { x: 800, y: 600 },
            { x: 1000, y: 400 }, { x: 1100, y: 200 }
        ]
    },
    {
        id: 3,
        name: "Asedio al Castillo",
        mapX: 1000, mapY: 200,
        startCoins: 800,
        difficulty: 2.2,
        rewardGold: 500,
        path: [
            { x: 0, y: 480 },
            { x: 300, y: 480 },
            { x: 400, y: 250 },
            { x: 600, y: 600 },
            { x: 800, y: 250 },
            { x: 1000, y: 480 },
            { x: 1280, y: 480 }
        ],
        towerSlots: [
            { x: 200, y: 380 }, { x: 200, y: 580 },
            { x: 500, y: 400 }, { x: 700, y: 400 },
            { x: 900, y: 350 }, { x: 900, y: 580 },
            { x: 1150, y: 380 }
        ]
    }
];