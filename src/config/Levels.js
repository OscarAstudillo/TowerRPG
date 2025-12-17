// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "El Bosque Iniciático",
        difficulty: 1.0, // Vida x1.0
        startCoins: 250,
        rewardGold: 100,
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
        name: "Cañón de Cobre",
        difficulty: 1.3, // Vida x1.3 (Antes 1.5, muy duro)
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
    },
    {
        id: 3,
        name: "Fortaleza Oscura",
        difficulty: 1.6, // Vida x1.6 (Antes 2.0)
        startCoins: 600,
        rewardGold: 500,
        path: [
            { x: 0, y: 50 }, { x: 1200, y: 50 }, { x: 1200, y: 650 },
            { x: 100, y: 650 }, { x: 100, y: 150 }, { x: 640, y: 360 }
        ],
        towerSlots: [
            { x: 600, y: 90 }, { x: 1160, y: 350 }, { x: 600, y: 610 }, 
            { x: 140, y: 350 }, { x: 500, y: 360 }
        ]
    }
];