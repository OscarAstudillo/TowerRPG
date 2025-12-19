// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "Praderas del Inicio",
        mapX: 200, mapY: 550, // Abajo Izquierda
        startCoins: 400,
        difficulty: 1.0,
        rewardGold: 100,
        path: [
            { x: 0, y: 360 },
            { x: 400, y: 360 },
            { x: 400, y: 150 },
            { x: 800, y: 150 },
            { x: 800, y: 600 },
            { x: 1280, y: 600 }
        ],
        towerSlots: [
            { x: 200, y: 450 }, { x: 300, y: 250 }, 
            { x: 500, y: 100 }, { x: 700, y: 250 },
            { x: 900, y: 500 }, { x: 1100, y: 500 }
        ]
    },
    {
        id: 2,
        name: "Cruce Peligroso",
        mapX: 450, mapY: 350, // Centro
        startCoins: 550,
        difficulty: 1.5,
        rewardGold: 250,
        path: [
            { x: 0, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 600 },
            { x: 900, y: 600 },
            { x: 900, y: 200 },
            { x: 1280, y: 200 }
        ],
        towerSlots: [
            { x: 150, y: 200 }, { x: 450, y: 500 },
            { x: 700, y: 700 }, { x: 800, y: 500 },
            { x: 1000, y: 300 }, { x: 1100, y: 100 }
        ]
    },
    {
        id: 3,
        name: "Asedio al Castillo",
        mapX: 800, mapY: 200, // Arriba Derecha
        startCoins: 800,
        difficulty: 2.2,
        rewardGold: 500,
        path: [
            { x: 0, y: 360 },
            { x: 300, y: 360 },
            { x: 400, y: 200 },
            { x: 600, y: 500 },
            { x: 800, y: 200 },
            { x: 1000, y: 360 },
            { x: 1280, y: 360 }
        ],
        towerSlots: [
            { x: 200, y: 250 }, { x: 200, y: 450 },
            { x: 500, y: 350 }, { x: 700, y: 350 },
            { x: 900, y: 250 }, { x: 900, y: 450 },
            { x: 1150, y: 360 }
        ]
    }
];