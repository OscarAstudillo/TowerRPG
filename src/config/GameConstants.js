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

// --- HABILIDADES DEL JUGADOR ---
export const PLAYER_SKILLS = {
    DASH: { DURATION: 200, SPEED_MULT: 3.0, COOLDOWN: 2000 },
    guerrero: {
        Q: { NAME: 'Torbellino', TYPE: 'area_self', DAMAGE_MULT: 1.2, RANGE: 120, COOLDOWN: 4000, COLOR: 0xff0000 },
        E: { NAME: 'Golpe Sísmico', TYPE: 'cone', DAMAGE_MULT: 2.0, RANGE: 200, WIDTH: 80, COOLDOWN: 8000, COLOR: 0x8b0000, EFFECT: 'stun' }
    },
    mago: {
        Q: { NAME: 'Nova de Hielo', TYPE: 'area_self', DAMAGE_MULT: 1.5, RANGE: 150, COOLDOWN: 6000, COLOR: 0x00ffff, EFFECT: 'freeze' },
        E: { NAME: 'Rayo Arcano', TYPE: 'line', DAMAGE_MULT: 2.5, RANGE: 300, WIDTH: 50, COOLDOWN: 5000, COLOR: 0xff00ff }
    },
    arquero: {
        Q: { NAME: 'Lluvia de Flechas', TYPE: 'area_cursor', DAMAGE_MULT: 1.0, RANGE: 150, COOLDOWN: 5000, COLOR: 0x00ff00 },
        E: { NAME: 'Disparo Potente', TYPE: 'projectile', DAMAGE_MULT: 3.0, SPEED: 600, COOLDOWN: 7000, COLOR: 0xffff00 }
    },
    asesino: {
        Q: { NAME: 'Danza de Dagas', TYPE: 'projectiles_ring', DAMAGE_MULT: 1.0, COUNT: 8, COOLDOWN: 4000, COLOR: 0x800080 },
        E: { NAME: 'Paso Sombrío', TYPE: 'dash_attack', DAMAGE_MULT: 2.5, RANGE: 250, COOLDOWN: 6000, COLOR: 0x4b0082 }
    }
};

// --- HABILIDADES DE JEFES (ACTUALIZADO) ---
export const BOSS_SKILLS = {
    // Habilidad Genérica (Fallback)
    AOE_SMASH: {
        TYPE: 'aoe_target',
        WARN_TIME: 1500,
        RADIUS: 150,    
        DAMAGE: 30,     
        COOLDOWN: 6000  
    },
    // Boss Bosque (Raíces)
    boss_forest: {
        TYPE: 'aoe_target', // Ataca donde está el jugador
        NAME: "Raíces",
        WARN_TIME: 1200,
        RADIUS: 100,
        DAMAGE: 25,
        COOLDOWN: 5000,
        COLOR: 0x00ff00
    },
    // Boss Montaña (Escudo + Terremoto)
    boss_mountain: {
        TYPE: 'shield_explode', // Se escuda y luego explota
        NAME: "Avalancha",
        WARN_TIME: 2000,
        RADIUS: 250,
        DAMAGE: 50,
        COOLDOWN: 8000,
        COLOR: 0x8b4513
    },
    // Boss Volcán (Lluvia de Fuego)
    boss_volcano: {
        TYPE: 'projectile_barrage', // Dispara mientras camina
        NAME: "Lluvia Magma",
        COUNT: 5,
        DAMAGE: 20,
        COOLDOWN: 4000,
        COLOR: 0xff4500
    },
    // Boss Void (Final)
    boss_void: {
        TYPE: 'singularity', // Atrae y explota
        NAME: "Singularidad",
        WARN_TIME: 2500,
        RADIUS: 300,
        DAMAGE: 100, // Insta-kill o casi
        COOLDOWN: 12000,
        COLOR: 0x800080
    }
};