// src/config/GameConstants.js

export const GAME_CONSTANTS = {
    // --- JUGADOR Y PROGRESIÓN ---
    PLAYER: {
        MAX_LEVEL: 100,
        BASE_XP_TO_LEVEL: 100,
        XP_SCALING_FACTOR: 1.5,
        STAT_POINTS_PER_LEVEL: 3,
        TALENT_POINTS_PER_LEVEL: 1
    },

    // --- RECOMPENSAS Y ECONOMÍA ---
    REWARDS: {
        COIN_BASE: 15,
        COIN_PER_LEVEL: 5, 
        XP_BASE: 10,
        XP_PER_LEVEL: 8,
        BOSS_MULTIPLIER: 5,
        ELITE_MULTIPLIER: 2
    },

    // --- EQUIPAMIENTO Y ESTADÍSTICAS (NUEVO) ---
    EQUIPMENT: {
        // Regla: Tier N+1 es 100% más fuerte (Doble)
        // Fórmula: StatBase * (2 ^ (Tier - 1))
        TIER_MULTIPLIER_BASE: 2.0, 

        // Regla: Cada fusión da +5% stats
        // Fórmula: Stat * (1.05 ^ Nivel)
        FUSION_PER_LEVEL_MULT: 1.05,

        // Regla: Rareza sube 10% respecto a la anterior (definido en GameState pero escalado aquí si se requiere)
        RARITY_STEP_MULT: 1.10
    },

    // Definición de Stats Base por Arquetipo (Estilo RPG)
    // Esto asegura que un "Peto de Placas" siempre de Defensa y Vida, mientras que uno de cuero da Vida y Velocidad.
    BASE_STATS_RULES: {
        // ARMAS
        sword:   { primary: 'damage', secondary: 'attackSpeed' }, // Daño + Vel
        bow:     { primary: 'damage', secondary: 'range' },       // Daño + Rango
        staff:   { primary: 'damage', secondary: 'cdr' },         // Daño + Reducción CD
        dagger:  { primary: 'damage', secondary: 'critChance' },  // Daño + Crítico

        // ARMADURAS
        plate:   { primary: 'defense', secondary: 'hp' },         // Mucha Defensa + Vida
        leather: { primary: 'hp',      secondary: 'moveSpeed' },  // Vida + Velocidad
        cloth:   { primary: 'hp',      secondary: 'cdr' },        // Vida + Reducción CD
        shield:  { primary: 'defense', secondary: 'blockChance'}, // Defensa + Bloqueo

        // ACCESORIOS
        accessory: { primary: 'damage', secondary: 'lifesteal' }, // Daño + Robo de vida (Genérico)
        ring:      { primary: 'critChance', secondary: 'damage' }
    },

    // --- DROPS Y PROBABILIDADES ---
    DROPS: {
        GLOBAL_CHANCE: 0.40,
        WEIGHTS: {
            POTION: 0.15,
            COIN_BAG: 0.10,
            MATERIAL: 0.75
        },
        MATERIAL_QTY: { MIN: 1, MAX: 3 }
    },

    // --- CRAFTEO Y FORJA ---
    CRAFTING: {
        GOLD_COST_MULTIPLIER: 1.0, 
        MATERIAL_REQ_AMOUNT: 3,
        SUCCESS_RATE: 1.0
    },

    // --- PROFESIONES ---
    PROFESSIONS: {
        XP_PER_CRAFT: 20,
        XP_PER_REFINE: 10,
        LEVEL_CAP: 50
    },

    // --- INVENTARIO ---
    INVENTORY: {
        SELL_RETURN_RATE: 0.5 
    }
};