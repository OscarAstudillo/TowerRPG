// src/config/GameState.js

export const initialState = {
    gold: 500,
    selectedClass: null,
    
    // Stats base del jugador (se sobrescriben al elegir clase)
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
        
        // Refinados (agregados dinámicamente o definidos aquí)
        ingot_copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        // ... el sistema lo maneja dinámico si no están aquí, pero es buena práctica inicializar
    },

    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith: { level: 1, xp: 0, maxXp: 100 },
        jewelry: { level: 1, xp: 0, maxXp: 100 },
        engineering: { level: 1, xp: 0, maxXp: 100 },
        refining: { level: 1, xp: 0, maxXp: 100 }
    },

    talents: [],
    
    // NUEVO: Registro de progreso
    // Formato clave: "biome_level" -> numero de estrellas (1-3)
    // Ejemplo: "forest_1": 3, "forest_2": 1
    completedLevels: {}, 
    
    baseHp: 20
};

export const gameState = JSON.parse(JSON.stringify(initialState));

export const RARITY = {
    common: { id: 'common', name: 'Común', color: 0xffffff, mult: 1.0, statCount: 0 },
    uncommon: { id: 'uncommon', name: 'Poco Común', color: 0x00ff00, mult: 1.2, statCount: 1 },
    rare: { id: 'rare', name: 'Raro', color: 0x0000ff, mult: 1.5, statCount: 2 },
    epic: { id: 'epic', name: 'Épico', color: 0x800080, mult: 2.0, statCount: 3 },
    legendary: { id: 'legendary', name: 'Legendario', color: 0xffaa00, mult: 3.0, statCount: 4 }
};

export function getCurrentHero() {
    // Retornamos un objeto dummy para evitar crash si no hay héroe, pero idealmente selectedClass gestiona esto
    return {
        level: 1,
        xp: 0,
        maxXp: 100,
        statPoints: 0,
        talentPoints: 0,
        baseAttributes: gameState.playerStats,
        talents: gameState.talents
    };
}

export function updatePlayerStats() {
    // Lógica básica de recalculo (puedes expandirla con la lógica real de stats que ya tienes)
    // Este es un placeholder para mantener compatibilidad si no tienes el archivo completo a mano
}
export function getTowerBonuses(type) {
    return { damage: 0, range: 0, attackSpeed: 0, doubleAttack: 0 };
}