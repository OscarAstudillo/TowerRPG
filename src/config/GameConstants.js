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

    // --- LÍMITES DE ESTADÍSTICAS ---
    STATS_CAPS: {
        ARMOR_REDUCTION: {
            plate: 0.85,   
            leather: 0.65, 
            cloth: 0.50,   
            default: 0.50  
        },
        CRIT_CHANCE: 100,
        DOUBLE_ATTACK: 100,
        CDR: 75,           
        BLOCK_CHANCE: 75,  
        DODGE_CHANCE: 75,  
        LIFESTEAL: 100,    
        THORNS: 500        
    },

    // --- DIFICULTAD Y ESCALADO ---
    DIFFICULTY: {
        LEVEL_SCALING_FACTOR: 1.15,
        MODE_MULTIPLIER: {
            1: 1.0, 
            2: 1.5, 
            3: 2.5  
        }
    },

    // --- EQUIPAMIENTO ---
    EQUIPMENT: {
        TIER_MULTIPLIER_BASE: 2.0, 
        FUSION_PER_LEVEL_MULT: 1.05,
        RARITY_STEP_MULT: 1.10
    },

    // --- ARQUETIPOS DE STATS ---
    BASE_STATS_RULES: {
        sword:   { primary: 'damage', secondary: 'attackSpeed' }, 
        bow:     { primary: 'damage', secondary: 'range' },       
        staff:   { primary: 'damage', secondary: 'cdr' },         
        dagger:  { primary: 'damage', secondary: 'critChance' },  
        plate:   { primary: 'defense', secondary: 'hp' },         
        leather: { primary: 'hp',      secondary: 'moveSpeed' },  
        cloth:   { primary: 'hp',      secondary: 'cdr' },        
        shield:  { primary: 'defense', secondary: 'blockChance'}, 
        accessory: { primary: 'damage', secondary: 'lifesteal' }, 
        ring:      { primary: 'critChance', secondary: 'damage' }
    },

    // --- DROPS ---
    DROPS: {
        GLOBAL_CHANCE: 0.40,
        WEIGHTS: {
            POTION: 0.15,
            COIN_BAG: 0.10,
            MATERIAL: 0.75
        },
        MATERIAL_QTY: { MIN: 1, MAX: 3 }
    },

    // --- CRAFTEO ---
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

// --- HABILIDADES DEL JUGADOR (NUEVO) ---
export const PLAYER_SKILLS = {
    DASH: {
        DURATION: 200,      // Duración del impulso en ms
        SPEED_MULT: 3.0,    // Multiplicador de velocidad
        COOLDOWN: 2000      // 2 segundos
    },
    SKILL_Q: {
        NAME: 'Whirlwind',
        DAMAGE_MULT: 1.5,   // 150% del daño base
        RANGE: 150,         // Radio del área
        COOLDOWN: 5000,     // 5 segundos
        COLOR: 0x00ffff     // Color del efecto visual
    },
    SKILL_E: {
        NAME: 'Thrust',
        DAMAGE_MULT: 2.5,   // 250% del daño base
        RANGE: 250,         // Distancia frontal
        WIDTH: 60,          // Ancho del ataque
        COOLDOWN: 8000,     // 8 segundos
        COLOR: 0xff00ff
    }
};

// --- HABILIDADES DE JEFES (NUEVO) ---
export const BOSS_SKILLS = {
    AOE_SMASH: {
        WARN_TIME: 1500,    // Tiempo de advertencia
        RADIUS: 200,        // Radio de explosión
        DAMAGE: 30,         // Daño base
        COOLDOWN: 6000      // Frecuencia
    }
};