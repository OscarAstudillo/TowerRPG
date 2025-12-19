// src/config/GameState.js
import { CLASS_STATS } from '../entities/player/PlayerStats.js';

export const INITIAL_STATS = {
    // Básicos
    hp: 100, maxHp: 100, damage: 10, defense: 0, 
    attackSpeed: 1000, moveSpeed: 160, range: 100,
    
    // Ofensivos Avanzados
    critChance: 0,      // % Probabilidad crítico
    critDamage: 150,    // % Daño crítico (Base 150%)
    lifesteal: 0,       // % Robo de vida
    skillDamage: 0,     // % Daño extra habilidad
    cdr: 0,             // % Reducción enfriamiento
    bleedChance: 0,     // % Probabilidad sangrado
    doubleAttack: 0,    // % Probabilidad doble golpe

    // Defensivos/Utilidad Avanzados
    thorns: 0,          // Daño devuelto al atacante
    regenHp: 0,         // Vida regenerada cada 5s
    coldAura: 0,        // % Ralentización a enemigos cercanos
    pickupRange: 0      // Rango extra recolección (Opcional)
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
    gold: 5000,

    // Sistema de Nivel de Héroe
    heroLevel: 1,
    heroXP: 0,
    heroMaxXP: 100,
    statPoints: 0, // Puntos disponibles para gastar

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

    // Stats Base (se modifican al subir de nivel con puntos)
    baseAttributes: {
        damage: 0,
        maxHp: 0,
        attackSpeed: 0, // Reducción de delay (ms)
        defense: 0
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
    // Reiniciar a base de clase
    const newStats = { ...INITIAL_STATS, ...classBase };
    newStats.maxHp = classBase.hp; // Fix inicial

    // 1. Sumar Atributos por Puntos de Nivel
    newStats.damage += gameState.baseAttributes.damage;
    newStats.maxHp += gameState.baseAttributes.maxHp;
    newStats.defense += gameState.baseAttributes.defense;
    newStats.attackSpeed -= gameState.baseAttributes.attackSpeed; // Menos es más rápido

    // 2. Sumar Equipo
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

    // Validaciones
    if (newStats.attackSpeed < 100) newStats.attackSpeed = 100; // Cap de velocidad
    if (gameState.playerStats.hp > newStats.maxHp) newStats.hp = newStats.maxHp;
    else newStats.hp = gameState.playerStats.hp; // Mantener daño actual

    gameState.playerStats = newStats;
}