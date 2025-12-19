// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "El Bosque Verde",
        mapX: 200, mapY: 360,
        difficulty: 1.0,
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
        name: "Cañón Árido",
        mapX: 450, mapY: 250,
        difficulty: 1.3,
        startCoins: 350,
        rewardGold: 150,
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
        name: "Picos Helados",
        mapX: 700, mapY: 450,
        difficulty: 1.6,
        startCoins: 400,
        rewardGold: 200,
        path: [
            { x: 0, y: 600 }, { x: 400, y: 600 }, { x: 400, y: 100 },
            { x: 800, y: 100 }, { x: 800, y: 600 }, { x: 1280, y: 600 }
        ],
        towerSlots: [
            { x: 200, y: 550 }, { x: 450, y: 350 }, { x: 350, y: 150 },
            { x: 850, y: 350 }, { x: 1000, y: 550 }
        ]
    },
    {
        id: 4,
        name: "Volcán Oscuro",
        mapX: 950, mapY: 200,
        difficulty: 2.0,
        startCoins: 500,
        rewardGold: 300,
        path: [
            { x: 0, y: 100 }, { x: 1280, y: 620 } // Diagonal brutal
        ],
        towerSlots: [
            { x: 300, y: 200 }, { x: 640, y: 360 }, { x: 900, y: 500 },
            { x: 200, y: 400 }, { x: 1000, y: 300 }
        ]
    },
    {
        id: 5,
        name: "Reino de las Sombras",
        mapX: 1100, mapY: 500,
        difficulty: 2.5,
        startCoins: 600,
        rewardGold: 500,
        path: [
            { x: 640, y: 0 }, { x: 640, y: 300 }, 
            { x: 200, y: 300 }, { x: 200, y: 500 }, 
            { x: 1080, y: 500 }, { x: 1080, y: 300 }, { x: 640, y: 300 }, { x: 640, y: 720 }
        ], // Bucle diabólico
        towerSlots: [
            { x: 640, y: 150 }, { x: 420, y: 300 }, { x: 860, y: 300 },
            { x: 420, y: 500 }, { x: 860, y: 500 }, { x: 640, y: 400 }
        ]
    }
];