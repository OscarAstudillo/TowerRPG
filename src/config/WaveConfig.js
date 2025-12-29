// src/config/WaveConfig.js

export const WAVE_CONFIG = {
    // Configuración General
    BASE_ENEMIES: 8,
    ENEMIES_INC_PER_WAVE: 2, // Enemigos extra por cada oleada superada
    SPAWN_DELAY_START: 1000,
    SPAWN_DELAY_MIN: 300,

    // Escalamiento de Stats por Nivel Global del mapa
    SCALING: {
        HP_MULT: 1.15,    // +15% Vida por nivel
        SPEED_MULT: 1.01, // +1% Velocidad por nivel
        ARMOR_MULT: 1.05  // +5% Armadura por nivel
    },

    // Definición de Enemigos por Bioma y Tier de dificultad
    // tier1: Niveles 1-4, tier2: 5-8, tier3: 9-10
    BIOMES: {
        forest: {
            minLevel: 1, maxLevel: 10,
            tier1: ['slime', 'goblin'],
            tier2: ['goblin', 'wolf'],
            tier3: ['wolf', 'ent'],
            boss: 'orc_warrior'
        },
        mountain: {
            minLevel: 11, maxLevel: 20,
            tier1: ['skeleton', 'bat'],
            tier2: ['skeleton_warrior', 'bat'],
            tier3: ['golem', 'skeleton_mage'],
            boss: 'stone_golem'
        },
        volcano: {
            minLevel: 21, maxLevel: 30,
            tier1: ['fire_imp', 'magma_cube'],
            tier2: ['fire_elemental', 'demon'],
            tier3: ['demon_lord', 'fire_dragon'],
            boss: 'infernal_lord'
        }
    }
};