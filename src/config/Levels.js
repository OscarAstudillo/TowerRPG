// src/config/Levels.js

export const BIOMES = {
    forest: { 
        name: "Bosque Ancestral", 
        desc: "Madera y Pieles abundantes.", 
        // Estilo Visual
        theme: {
            bg: 0x0d3b14,       // Verde oscuro fondo
            path: 0x2e8b57,     // Camino musgo
            accent: 0x00ff00,   // Detalles neón verde
            grid: 0x114422
        },
        // Drops (Se mantiene tu lógica de Tiers)
        materials: {
            1: ['wood', 'hide', 'scraps'],
            2: ['cedar', 'leather', 'cotton'],
            3: ['ebony', 'scale', 'silk']
        }
    },
    mountain: { 
        name: "Montaña Rocosa", 
        desc: "Minerales y Piedra.", 
        theme: {
            bg: 0x2b2b2b,       // Gris oscuro
            path: 0x505050,     // Gris piedra
            accent: 0x00ffff,   // Cian (cristales)
            grid: 0x333333
        },
        materials: {
            1: ['copper', 'coal'], 
            2: ['iron', 'coal'],
            3: ['mithril', 'iron']
        }
    },
    volcano: { 
        name: "Volcán Activo", 
        desc: "Minerales raros y calor.", 
        theme: {
            bg: 0x220505,       // Rojo muy oscuro
            path: 0x5c0a0a,     // Rojo magma seco
            accent: 0xff4500,   // Naranja fuego
            grid: 0x441111
        },
        materials: {
            1: ['copper', 'coal'],
            2: ['iron', 'coal'],
            3: ['mithril', 'iron'] // Podrías agregar obsidiana luego
        }
    }
};

export const LEVEL_CONFIG = {
    // Configuración de dificultad (Se mantiene igual, funciona bien)
    1: { waves: 3, hpMult: 1.0, dropRate: 0.15, tier: 1, dropChances: { common: 90, uncommon: 10, rare: 0, epic: 0, legendary: 0 } },
    2: { waves: 4, hpMult: 1.2, dropRate: 0.18, tier: 1, dropChances: { common: 80, uncommon: 18, rare: 2, epic: 0, legendary: 0 } },
    3: { waves: 5, hpMult: 1.5, dropRate: 0.20, tier: 1, dropChances: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 } },
    4: { waves: 6, hpMult: 2.0, dropRate: 0.22, tier: 2, dropChances: { common: 60, uncommon: 30, rare: 10, epic: 0, legendary: 0 } },
    5: { waves: 7, hpMult: 2.5, dropRate: 0.25, tier: 2, dropChances: { common: 50, uncommon: 35, rare: 15, epic: 0, legendary: 0 } },
    6: { waves: 8, hpMult: 3.0, dropRate: 0.28, tier: 2, dropChances: { common: 40, uncommon: 40, rare: 20, epic: 0, legendary: 0 } },
    7: { waves: 9, hpMult: 4.0, dropRate: 0.30, tier: 2, dropChances: { common: 35, uncommon: 40, rare: 20, epic: 5, legendary: 0 } },
    8: { waves: 10, hpMult: 5.5, dropRate: 0.35, tier: 3, dropChances: { common: 25, uncommon: 30, rare: 30, epic: 15, legendary: 0 } },
    9: { waves: 12, hpMult: 7.0, dropRate: 0.40, tier: 3, dropChances: { common: 20, uncommon: 25, rare: 35, epic: 20, legendary: 0 } },
    10: { waves: 15, hpMult: 10.0, dropRate: 0.50, tier: 3, dropChances: { common: 10, uncommon: 20, rare: 30, epic: 30, legendary: 10 } }
};