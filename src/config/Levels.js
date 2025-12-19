// src/config/Levels.js

export const LEVELS = [
    {
        id: 1,
        name: "El Bosque Verde",
        mapX: 200, mapY: 360,
        difficulty: 1.0,
        startCoins: 250,
        rewardGold: 100,
        theme: { background: 0x1a472a, path: 0x5d8aa8, accent: 0x00ff00 },
        path: [
            { x: 0, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 500 }, 
            { x: 900, y: 500 }, { x: 900, y: 200 }, { x: 1280, y: 200 }
        ],
        towerSlots: [
            { x: 150, y: 220 }, // Bajado para no tapar el inicio
            { x: 380, y: 150 }, // Movido a la derecha del tramo vertical
            { x: 220, y: 400 }, // Izquierda del tramo vertical
            { x: 600, y: 580 }, // Debajo del tramo largo
            { x: 980, y: 400 }, // Derecha del tramo vertical de subida
            { x: 820, y: 280 }  // Izquierda del tramo vertical
        ]
    },
    {
        id: 2,
        name: "Cañón Árido",
        mapX: 450, mapY: 250,
        difficulty: 1.3,
        startCoins: 350,
        rewardGold: 150,
        theme: { background: 0x8b4513, path: 0xf4a460, accent: 0xffd700 },
        path: [
            { x: 100, y: 720 }, { x: 100, y: 100 }, 
            { x: 1180, y: 100 }, { x: 1180, y: 720 }
        ],
        towerSlots: [
            { x: 180, y: 300 }, // Alejado del borde
            { x: 180, y: 600 }, 
            { x: 640, y: 180 }, // Debajo del camino superior
            { x: 1100, y: 300 }, // Lado interior derecho
            { x: 1100, y: 600 }
        ]
    },
    {
        id: 3,
        name: "Picos Helados",
        mapX: 700, mapY: 450,
        difficulty: 1.6,
        startCoins: 400,
        rewardGold: 200,
        theme: { background: 0x2f4f4f, path: 0xe0ffff, accent: 0x00ffff },
        path: [
            { x: 0, y: 600 }, { x: 400, y: 600 }, { x: 400, y: 100 },
            { x: 800, y: 100 }, { x: 800, y: 600 }, { x: 1280, y: 600 }
        ],
        towerSlots: [
            { x: 200, y: 520 }, // Arriba del camino inferior
            { x: 320, y: 350 }, // Izquierda tramo vertical 1
            { x: 480, y: 100 }, // Derecha tramo superior
            { x: 720, y: 350 }, // Izquierda tramo vertical 2
            { x: 1000, y: 520 } // Arriba del camino final
        ]
    },
    {
        id: 4,
        name: "Volcán Oscuro",
        mapX: 950, mapY: 200,
        difficulty: 2.0,
        startCoins: 500,
        rewardGold: 300,
        theme: { background: 0x220000, path: 0x800000, accent: 0xff4500 },
        path: [
            { x: 0, y: 100 }, { x: 1280, y: 620 } // Diagonal
        ],
        towerSlots: [
            // Corregidos para no estar en la linea exacta y = 0.4x + 100
            { x: 250, y: 300 }, // Debajo de la línea
            { x: 500, y: 200 }, // Arriba de la línea
            { x: 750, y: 500 }, // Debajo
            { x: 1000, y: 400 },// Arriba
            { x: 640, y: 650 }  // Fondo
        ]
    },
    {
        id: 5,
        name: "Reino de las Sombras",
        mapX: 1100, mapY: 500,
        difficulty: 2.5,
        startCoins: 600,
        rewardGold: 500,
        theme: { background: 0x0a0a0a, path: 0x4b0082, accent: 0x9400d3 },
        path: [
            { x: 640, y: 0 }, { x: 640, y: 300 }, 
            { x: 200, y: 300 }, { x: 200, y: 500 }, 
            { x: 1080, y: 500 }, { x: 1080, y: 300 }, { x: 640, y: 300 }, { x: 640, y: 720 }
        ],
        towerSlots: [
            { x: 560, y: 150 }, // Izquierda entrada
            { x: 720, y: 150 }, // Derecha entrada
            { x: 420, y: 400 }, // Centro del bucle izquierdo
            { x: 860, y: 400 }, // Centro del bucle derecho
            { x: 560, y: 550 }, // Abajo izquierda salida
            { x: 720, y: 550 }  // Abajo derecha salida
        ]
    }
];