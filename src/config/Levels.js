// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "Bosque Sombrío",
        difficulty: 1.0,
        startCoins: 400,
        rewardGold: 100,
        theme: {
            background: 0x2d5a27, // Verde Bosque
            path: 0x8b4513,       // Marrón Tierra
            accent: 0x00ff00      // Verde Neón UI
        },
        path: [
            { x: 0, y: 300 },
            { x: 300, y: 300 },
            { x: 300, y: 600 },
            { x: 700, y: 600 },
            { x: 700, y: 200 },
            { x: 1100, y: 200 },
            { x: 1100, y: 500 },
            { x: 1280, y: 500 }
        ],
        towerSlots: [
            { x: 150, y: 200 }, { x: 450, y: 200 }, { x: 850, y: 100 },
            { x: 150, y: 450 }, { x: 500, y: 500 }, { x: 900, y: 350 },
            { x: 150, y: 700 }, { x: 500, y: 700 }, { x: 900, y: 600 },
            { x: 1200, y: 350 }, { x: 1200, y: 650 }
        ]
    },
    {
        id: 2,
        name: "Desierto Árido",
        difficulty: 1.5,
        startCoins: 500,
        rewardGold: 250,
        theme: {
            background: 0xe6c288, // Arena
            path: 0xc2a068,       // Arena Oscura
            accent: 0xffa500      // Naranja UI
        },
        path: [
            { x: 0, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 800 },
            { x: 500, y: 800 },
            { x: 500, y: 200 },
            { x: 800, y: 200 },
            { x: 800, y: 700 },
            { x: 1100, y: 700 },
            { x: 1100, y: 400 },
            { x: 1280, y: 400 }
        ],
        towerSlots: [
            { x: 100, y: 250 }, { x: 350, y: 250 }, { x: 650, y: 100 },
            { x: 100, y: 650 }, { x: 350, y: 650 }, { x: 650, y: 350 },
            { x: 350, y: 450 }, { x: 650, y: 650 }, { x: 950, y: 250 },
            { x: 950, y: 550 }, { x: 1200, y: 250 }
        ]
    },
    {
        id: 3,
        name: "Montaña de Fuego",
        difficulty: 2.2,
        startCoins: 600,
        rewardGold: 500,
        theme: {
            background: 0x330000, // Rojo Oscuro
            path: 0x111111,       // Negro Ceniza
            accent: 0xff0000      // Rojo Fuego UI
        },
        path: [
            { x: 0, y: 480 },
            { x: 300, y: 480 },
            { x: 300, y: 200 },
            { x: 600, y: 200 },
            { x: 600, y: 760 },
            { x: 900, y: 760 },
            { x: 900, y: 300 },
            { x: 1280, y: 300 }
        ],
        towerSlots: [
            { x: 150, y: 350 }, { x: 450, y: 300 }, { x: 750, y: 100 },
            { x: 150, y: 600 }, { x: 450, y: 600 }, { x: 750, y: 650 },
            { x: 300, y: 350 }, { x: 600, y: 480 }, { x: 900, y: 150 },
            { x: 1050, y: 450 }, { x: 1200, y: 150 }, { x: 1050, y: 650 }
        ]
    }
];