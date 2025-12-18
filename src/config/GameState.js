// src/config/GameState.js
import { CLASS_STATS } from '../entities/player/PlayerStats.js'; // Asegúrate de importar esto

export const INITIAL_STATS = {
    hp: 100, maxHp: 100, damage: 10, defense: 0, attackSpeed: 1000, moveSpeed: 160
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
    gold: 30000,

    materials: {
        wood:   { common: 100, uncommon: 100, rare: 100, epic: 0, legendary: 0 },
        cloth:  { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
    },

    inventory: [], 
    equipment: { weapon: null, armor: null, accessory: null },
    playerStats: { ...INITIAL_STATS },
    
    // --- NUEVA ESTRUCTURA DE PROFESIONES CON XP ---
    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith:  { level: 1, xp: 0, maxXp: 100 },
        jewelry:     { level: 1, xp: 0, maxXp: 100 }
    }
};

export function updatePlayerStats() {
    // 1. Cargar base de la clase seleccionada
    const classBase = CLASS_STATS[gameState.selectedClass];
    const base = classBase ? { ...classBase, maxHp: classBase.hp } : { ...INITIAL_STATS };

    // 2. Crear stats (incluyendo COLOR y RANGO para arreglar el héroe amarillo)
    const newStats = { 
        hp: gameState.playerStats.hp, 
        maxHp: base.hp,
        damage: base.damage,
        defense: base.defense,
        attackSpeed: base.attackSpeed,
        moveSpeed: base.moveSpeed,
        range: base.range || 200, // Vital para Melee vs Ranged
        color: base.color || 0xffff00
    };

    if (newStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;

    // 3. Sumar equipo
    Object.values(gameState.equipment).forEach(item => {
        if (item) {
            for (let key in item.stats) {
                if (newStats[key] !== undefined) {
                    newStats[key] += item.stats[key];
                }
            }
        }
    });
    gameState.playerStats = newStats;
}