// src/config/WaveConfig.js

export const WAVE_CONFIG = {
    // Configuración General de Oleadas
    BASE_ENEMIES: 8,
    ENEMIES_INC_PER_WAVE: 2, // Enemigos extra por oleada
    SPAWN_DELAY_START: 1200,
    SPAWN_DELAY_MIN: 400,

    // NOTA: El escalado de stats (HP, Daño, Armadura) ya NO se maneja aquí.
    // Se calcula en Enemy.js basado en el nivel del mapa.

    // Definición de Enemigos por Bioma y Tier de dificultad
    // Esto se usa para saber QUÉ enemigos spawnear, no sus stats.
    BIOMES: {
        forest: {
            minLevel: 1, maxLevel: 10,
            tier1: ['slime', 'goblin'],
            tier2: ['goblin', 'wolf', 'boar'],
            tier3: ['wolf', 'ent', 'eagle', 'shaman'],
            boss: 'boss_rasta' // Boss por defecto si no se especifica otro
        },
        mountain: {
            minLevel: 1, maxLevel: 10, // Ahora paralelo al bosque
            tier1: ['bandit', 'miner_dwarf'],
            tier2: ['rock_elemental', 'harpy', 'bandit'],
            tier3: ['golem_copper', 'harpy', 'rock_elemental'],
            boss: 'boss_andres'
        },
        volcano: {
            minLevel: 1, maxLevel: 10, // Ahora paralelo al bosque
            tier1: ['fire_imp', 'magma_cube'],
            tier2: ['fire_elemental', 'succubus', 'fire_imp'],
            tier3: ['fire_elemental', 'succubus', 'magma_cube'],
            boss: 'boss_ifrit'
        }
    }
};