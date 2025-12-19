// src/config/GameState.js
import { CLASS_STATS } from '../entities/player/PlayerStats.js';

export const INITIAL_STATS = {
    hp: 100, maxHp: 100, damage: 10, defense: 0, attackSpeed: 1000, moveSpeed: 160, range: 100
};

export const RARITY = {
    common:     { id: 'common',     name: 'Común',      color: 0xffffff, mult: 1.0 },
    uncommon:   { id: 'uncommon',   name: 'Poco Común', color: 0x00ff00, mult: 1.5 },
    rare:       { id: 'rare',       name: 'Raro',       color: 0x0000ff, mult: 2.0 },
    epic:       { id: 'epic',       name: 'Épico',      color: 0x800080, mult: 3.5 },
    legendary:  { id: 'legendary',  name: 'Legendario', color: 0xffaa00, mult: 5.0 }
};

export const gameState = {
    selectedClass: 'paladin',
    levelsUnlocked: 1,
    gold: 5000, // Oro inicial para pruebas

    materials: {
        wood:   { common: 10, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth:  { common: 10, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 10, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather:{ common: 10, uncommon: 0, rare: 0, epic: 0, legendary: 0 } // NUEVO: Cuero
    },

    inventory: [],
    maxInventorySlots: 30, // NUEVO: Límite de mochila
    
    // NUEVA ESTRUCTURA DE EQUIPO
    equipment: { 
        mainHand: null, // Arma Principal / Arco / Bastón
        offHand: null,  // Escudo / Segunda Arma / (Ocupado si es arma 2 manos)
        armor: null,    // Pecho
        accessory: null // Anillo/Amuleto
    },

    playerStats: { ...INITIAL_STATS },
    
    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith:  { level: 1, xp: 0, maxXp: 100 },
        jewelry:     { level: 1, xp: 0, maxXp: 100 }
    }
};

export function updatePlayerStats() {
    const classBase = CLASS_STATS[gameState.selectedClass];
    const base = classBase ? { ...classBase, maxHp: classBase.hp } : { ...INITIAL_STATS };

    const newStats = { 
        hp: gameState.playerStats.hp, 
        maxHp: base.hp,
        damage: base.damage,
        defense: base.defense,
        attackSpeed: base.attackSpeed,
        moveSpeed: base.moveSpeed,
        range: base.range || 200, 
        color: base.color || 0xffff00
    };

    if (newStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;

    // Sumar stats de todos los slots nuevos
    ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => {
        const item = gameState.equipment[slot];
        if (item && item.stats) {
            for (let key in item.stats) {
                if (newStats[key] !== undefined) {
                    newStats[key] += item.stats[key];
                }
            }
        }
    });
    gameState.playerStats = newStats;
}