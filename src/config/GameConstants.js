// src/config/GameConstants.js

export const GAME_CONSTANTS = {
    // --- JUGADOR Y PROGRESIÓN ---
    PLAYER: {
        MAX_LEVEL: 100,
        BASE_XP_TO_LEVEL: 100,
        XP_SCALING_FACTOR: 1.5, // Cuánto aumenta la XP necesaria por nivel
        STAT_POINTS_PER_LEVEL: 3,
        TALENT_POINTS_PER_LEVEL: 1
    },

    // --- RECOMPENSAS Y ECONOMÍA ---
    REWARDS: {
        // Oro = Base + (Nivel * Multiplicador)
        COIN_BASE: 15,
        COIN_PER_LEVEL: 5, 
        
        // XP = Base + (Nivel * Multiplicador)
        XP_BASE: 10,
        XP_PER_LEVEL: 8,
        
        BOSS_MULTIPLIER: 5,   // Jefes dan x5 recompensas
        ELITE_MULTIPLIER: 2   // Élites dan x2
    },

    // --- DROPS Y PROBABILIDADES ---
    DROPS: {
        GLOBAL_CHANCE: 0.40, // 40% probabilidad que caiga algo al matar
        
        // Pesos relativos para determinar qué cae (debe sumar 1.0 aprox o usarse como pesos)
        WEIGHTS: {
            POTION: 0.15,
            COIN_BAG: 0.10,
            MATERIAL: 0.75
        },
        
        MATERIAL_QTY: { MIN: 1, MAX: 3 }
    },

    // --- CRAFTEO Y FORJA ---
    CRAFTING: {
        // Costo base se define en la receta, esto es un multiplicador global si necesitas ajustes
        GOLD_COST_MULTIPLIER: 1.0, 
        
        // Cantidad de materiales requeridos por defecto
        MATERIAL_REQ_AMOUNT: 3,
        
        // Probabilidad de éxito (1.0 = 100%)
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
        SELL_RETURN_RATE: 0.5 // Se recupera el 50% del valor al vender
    }
};