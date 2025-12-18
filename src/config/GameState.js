// src/config/GameState.js

export const INITIAL_STATS = {
    hp: 100, maxHp: 100, damage: 10, defense: 0, attackSpeed: 1000, moveSpeed: 160
};

// Definición de Rarezas y sus colores
export const RARITY = {
    common:     { id: 'common',     name: 'Común',      color: 0xffffff, mult: 1.0 },
    uncommon:   { id: 'uncommon',   name: 'Poco Común', color: 0x00ff00, mult: 1.2 },
    rare:       { id: 'rare',       name: 'Raro',       color: 0x0000ff, mult: 1.5 },
    epic:       { id: 'epic',       name: 'Épico',      color: 0x800080, mult: 2.0 },
    legendary:  { id: 'legendary',  name: 'Legendario', color: 0xffaa00, mult: 3.0 }
};

export const gameState = {
    selectedClass: 'paladin',
    levelsUnlocked: 1,
    
    gold: 50000, // Oro Global (se gana al ganar niveles)

    // Materiales ahora divididos por rareza
    materials: {
        wood:   { common: 8000, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth:  { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
    },

    // Inventario de Equipamiento (Lista de objetos únicos)
    // Ejemplo: [{ uid: 1, type: 'sword', rarity: 'rare', enchant: 3, stats: {...} }]
    inventory: [], 

    // Equipo puesto actualmente
    equipment: { weapon: null, armor: null, accessory: null },

    playerStats: { ...INITIAL_STATS },
    
    // Profesiones (Nivel 1 a 100)
    professions: {
        weaponsmith: 1,
        armorsmith: 1,
        jewelry: 1
    }
};

export function updatePlayerStats() {
    const newStats = { ...INITIAL_STATS };
    Object.values(gameState.equipment).forEach(item => {
        if (item) {
            // Sumamos los stats del item
            for (let key in item.stats) {
                if (newStats[key] !== undefined) {
                    newStats[key] += item.stats[key];
                }
            }
        }
    });
    gameState.playerStats = newStats;
}