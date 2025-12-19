// src/config/GameState.js
import { CLASS_STATS } from '../entities/player/PlayerStats.js';

export const INITIAL_STATS = {
    hp: 100, maxHp: 100, damage: 10, defense: 0, 
    attackSpeed: 1000, moveSpeed: 160, range: 100,
    critChance: 0, critDamage: 150, lifesteal: 0, 
    skillDamage: 0, cdr: 0, bleedChance: 0, doubleAttack: 0,
    thorns: 0, regenHp: 0, coldAura: 0, pickupRange: 0
};

export const RARITY = {
    common:     { id: 'common',     name: 'Común',      color: 0xffffff, mult: 1.0, statCount: 1 },
    uncommon:   { id: 'uncommon',   name: 'Poco Común', color: 0x00ff00, mult: 1.2, statCount: 2 },
    rare:       { id: 'rare',       name: 'Raro',       color: 0x0000ff, mult: 1.5, statCount: 3 },
    epic:       { id: 'epic',       name: 'Épico',      color: 0x800080, mult: 2.0, statCount: 4 },
    legendary:  { id: 'legendary',  name: 'Legendario', color: 0xffaa00, mult: 3.0, statCount: 5 }
};

export const gameState = {
    selectedClass: 'paladin',
    levelsUnlocked: 1,
    levelStars: {}, // NUEVO: Registro de estrellas por nivel { 1: 3, 2: 1 }
    gold: 5000,

    heroLevel: 1,
    heroXP: 0,
    heroMaxXP: 100,
    statPoints: 0, 

    materials: {
        wood:   { common: 20, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth:  { common: 20, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 20, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather:{ common: 20, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
    },

    inventory: [],
    maxInventorySlots: 30,
    
    equipment: { 
        mainHand: null, offHand: null, armor: null, accessory: null 
    },

    baseAttributes: {
        damage: 0, maxHp: 0, attackSpeed: 0, defense: 0
    },

    playerStats: { ...INITIAL_STATS },
    baseHp: 20, // Vida del castillo global
    
    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith:  { level: 1, xp: 0, maxXp: 100 },
        jewelry:     { level: 1, xp: 0, maxXp: 100 }
    }
};

export function updatePlayerStats() {
    const classBase = CLASS_STATS[gameState.selectedClass] || { ...INITIAL_STATS };
    const newStats = { ...INITIAL_STATS, ...classBase };
    newStats.maxHp = classBase.hp || 100; 

    const attr = gameState.baseAttributes || { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 };
    newStats.damage += (attr.damage || 0);
    newStats.maxHp += (attr.maxHp || 0);
    newStats.defense += (attr.defense || 0);
    newStats.attackSpeed -= (attr.attackSpeed || 0);

    const eq = gameState.equipment || { mainHand: null, offHand: null, armor: null, accessory: null };
    ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => {
        const item = eq[slot];
        if (item && item.stats) {
            for (let key in item.stats) {
                if (newStats[key] !== undefined) {
                    newStats[key] += (item.stats[key] || 0);
                }
            }
        }
    });

    if (isNaN(newStats.damage)) newStats.damage = 1;
    if (isNaN(newStats.defense)) newStats.defense = 0;
    if (isNaN(newStats.maxHp)) newStats.maxHp = 100;
    if (newStats.attackSpeed < 100) newStats.attackSpeed = 100;

    if (gameState.playerStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;
    else if (isNaN(gameState.playerStats.hp)) newStats.hp = newStats.maxHp;
    else newStats.hp = gameState.playerStats.hp;

    gameState.playerStats = newStats;
    if (!gameState.baseAttributes) gameState.baseAttributes = { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 };
}