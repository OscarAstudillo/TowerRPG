// src/config/GameState.js

export const initialState = {
    gold: 500,
    selectedClass: null,
    
    // Stats base del jugador
    playerStats: {
        hp: 100, maxHp: 100, damage: 10, defense: 0,
        attackSpeed: 1000, moveSpeed: 160,
        critChance: 5, critDamage: 150,
        lifesteal: 0, regenHp: 0,
        cdr: 0, doubleAttack: 0, thorns: 0
    },

    // Inventarios
    inventory: [],
    equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
    
    // Equipamiento de Torres
    towerEquipment: {
        archer: { slot1: null, slot2: null },
        cannon: { slot1: null, slot2: null },
        mage:   { slot1: null, slot2: null }
    },

    // Materiales (Estructura para refinación)
    materials: {
        // Crudos
        wood: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        hide: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        coal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        scraps: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cotton: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        silk: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        scale: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        
        // Refinados (Inicializados para evitar errores de undefined)
        ingot_copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_steel: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        plank_wood: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        plank_cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        plank_ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_simple: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_fine: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_royal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather_simple: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather_rigid: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather_dragon: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
    },

    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith: { level: 1, xp: 0, maxXp: 100 },
        jewelry: { level: 1, xp: 0, maxXp: 100 },
        engineering: { level: 1, xp: 0, maxXp: 100 },
        refining: { level: 1, xp: 0, maxXp: 100 }
    },

    talents: [],
    
    // Registro de progreso (Bioma_Nivel -> Estrellas)
    completedLevels: {}, 
    maxLevel: 1, // Control global del nivel máximo alcanzado (1-10)
    
    baseHp: 20
};

// Estado mutable del juego
export const gameState = JSON.parse(JSON.stringify(initialState));

// Definición de Rarezas
export const RARITY = {
    common: { id: 'common', name: 'Común', color: 0xffffff, mult: 1.0, statCount: 0 },
    uncommon: { id: 'uncommon', name: 'Poco Común', color: 0x00ff00, mult: 1.2, statCount: 1 },
    rare: { id: 'rare', name: 'Raro', color: 0x0000ff, mult: 1.5, statCount: 2 },
    epic: { id: 'epic', name: 'Épico', color: 0x800080, mult: 2.0, statCount: 3 },
    legendary: { id: 'legendary', name: 'Legendario', color: 0xffaa00, mult: 3.0, statCount: 4 }
};

// --- FUNCIONES EXPORTADAS NECESARIAS ---

// Esta es la función que faltaba y causaba el error en SaveSystem.js
export function initHero(className) {
    if (className) gameState.selectedClass = className;
    
    // Restablecer stats base al iniciar/cargar héroe
    // Aquí puedes definir stats específicos por clase si quieres
    gameState.playerStats.hp = gameState.playerStats.maxHp;
    
    updatePlayerStats();
    return getCurrentHero();
}

export function getCurrentHero() {
    // Retorna un objeto con la info del héroe actual
    // Si no hay clase seleccionada, retorna valores seguros
    return {
        class: gameState.selectedClass || 'none',
        level: 1, // Por ahora el nivel del héroe es estático o depende de lógica externa
        xp: 0,
        maxXp: 100,
        statPoints: 0,
        talentPoints: 0,
        baseAttributes: gameState.playerStats,
        talents: gameState.talents
    };
}

export function updatePlayerStats() {
    // Recalcular stats basados en equipo
    // 1. Reset a base (valores hardcodeados o del state inicial)
    const base = {
        hp: 100, maxHp: 100, damage: 10, defense: 0,
        attackSpeed: 1000, moveSpeed: 160,
        critChance: 5, critDamage: 150,
        lifesteal: 0, regenHp: 0,
        cdr: 0, doubleAttack: 0, thorns: 0
    };

    // Ajustes por clase (opcional)
    if (gameState.selectedClass === 'guerrero') { base.hp = 150; base.defense = 5; }
    if (gameState.selectedClass === 'arquero') { base.attackSpeed = 800; base.damage = 12; }
    // ... otros ajustes

    // 2. Sumar equipo
    const equipment = [
        gameState.equipment.mainHand,
        gameState.equipment.offHand,
        gameState.equipment.armor,
        gameState.equipment.accessory
    ];

    equipment.forEach(item => {
        if (item && item.stats) {
            for (let key in item.stats) {
                if (base[key] !== undefined) {
                    if (key === 'attackSpeed' || key === 'cdr') {
                        // Restar delay es bueno
                        base[key] -= item.stats[key];
                    } else {
                        base[key] += item.stats[key];
                    }
                }
            }
        }
    });

    // Límites seguros
    if (base.attackSpeed < 200) base.attackSpeed = 200; // Cap de velocidad
    
    // Guardar en gameState
    Object.assign(gameState.playerStats, base);
    
    // Asegurar HP actual no supere máximo
    if (gameState.playerStats.hp > gameState.playerStats.maxHp) {
        gameState.playerStats.hp = gameState.playerStats.maxHp;
    }
}

export function getTowerBonuses(type) {
    // Calcular bonos para torres basados en equipo de torre
    const bonuses = { damage: 0, range: 0, attackSpeed: 0, doubleAttack: 0 };
    const eq = gameState.towerEquipment[type];
    
    if (eq) {
        [eq.slot1, eq.slot2].forEach(item => {
            if (item && item.stats) {
                if (item.stats.damage) bonuses.damage += item.stats.damage;
                if (item.stats.range) bonuses.range += item.stats.range;
                if (item.stats.attackSpeed) bonuses.attackSpeed += item.stats.attackSpeed;
                if (item.stats.doubleAttack) bonuses.doubleAttack += item.stats.doubleAttack;
            }
        });
    }
    return bonuses;
}