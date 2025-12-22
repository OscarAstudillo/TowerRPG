// src/config/Levels.js

export const BIOMES = {
    forest: { name: "Bosque Ancestral", desc: "Abundante madera y pieles.", materials: ['wood', 'hide', 'scraps'], bg: 0x228b22 },
    mountain: { name: "Montaña Rocosa", desc: "Rica en minerales.", materials: ['copper', 'iron', 'coal'], bg: 0x808080 },
    volcano: { name: "Volcán Activo", desc: "Minerales raros y peligros.", materials: ['iron', 'coal', 'mithril'], bg: 0x8b0000 }
};

export const LEVEL_CONFIG = {
    // Configuración genérica de dificultad por nivel (1-10)
    1: { waves: 3, hpMult: 1.0, dropRate: 0.10, tier: 1, dropChances: { common: 90, uncommon: 10, rare: 0, epic: 0, legendary: 0 } },
    2: { waves: 4, hpMult: 1.2, dropRate: 0.12, tier: 1, dropChances: { common: 80, uncommon: 18, rare: 2, epic: 0, legendary: 0 } },
    3: { waves: 5, hpMult: 1.5, dropRate: 0.15, tier: 1, dropChances: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 } },
    4: { waves: 6, hpMult: 2.0, dropRate: 0.18, tier: 2, dropChances: { common: 60, uncommon: 30, rare: 10, epic: 0, legendary: 0 } }, // Tier 2 empieza (Cedro/Hierro)
    5: { waves: 7, hpMult: 2.5, dropRate: 0.20, tier: 2, dropChances: { common: 50, uncommon: 35, rare: 15, epic: 0, legendary: 0 } },
    6: { waves: 8, hpMult: 3.0, dropRate: 0.22, tier: 2, dropChances: { common: 40, uncommon: 40, rare: 20, epic: 0, legendary: 0 } },
    7: { waves: 9, hpMult: 3.5, dropRate: 0.25, tier: 2, dropChances: { common: 35, uncommon: 40, rare: 25, epic: 5, legendary: 0 } },
    8: { waves: 10, hpMult: 5.0, dropRate: 0.30, tier: 3, dropChances: { common: 25, uncommon: 30, rare: 30, epic: 15, legendary: 0 } }, // Tier 3 empieza
    9: { waves: 12, hpMult: 7.0, dropRate: 0.35, tier: 3, dropChances: { common: 20, uncommon: 25, rare: 35, epic: 20, legendary: 0 } },
    10: { waves: 15, hpMult: 10.0, dropRate: 0.40, tier: 3, dropChances: { common: 10, uncommon: 20, rare: 30, epic: 30, legendary: 10 } }
};