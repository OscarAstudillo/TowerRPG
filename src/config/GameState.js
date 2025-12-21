// src/config/GameState.js
import { CLASS_STATS } from '../entities/player/PlayerStats.js';
import { TALENTS } from './Talents.js';

export const INITIAL_STATS = {
    hp: 100, maxHp: 100, damage: 10, defense: 0, 
    attackSpeed: 1000, moveSpeed: 160, range: 100,
    critChance: 0, critDamage: 150, lifesteal: 0, 
    skillDamage: 0, cdr: 0, bleedChance: 0, doubleAttack: 0,
    thorns: 0, regenHp: 0, coldAura: 0, pickupRange: 0
};

export const RARITY = {
    common:     { id: 'common',     name: 'Común',      color: 0xffffff, mult: 1.0, statCount: 1 },
    uncommon:   { id: 'uncommon',   name: 'Poco Común', color: 0x00ff00, mult: 1.5, statCount: 2 },
    rare:       { id: 'rare',       name: 'Raro',       color: 0x0000ff, mult: 2.5, statCount: 3 },
    epic:       { id: 'epic',       name: 'Épico',      color: 0x800080, mult: 4.0, statCount: 4 },
    legendary:  { id: 'legendary',  name: 'Legendario', color: 0xffaa00, mult: 6.0, statCount: 5 }
};

export const gameState = {
    selectedClass: null, 
    levelsUnlocked: 1,
    levelStars: {}, 
    gold: 5000,
    heroes: {}, // IMPORTANTE: Almacena { paladin: { level: 1... }, ... }

    materials: {
        wood:   { common: 50, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth:  { common: 50, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 50, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather:{ common: 50, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
    },
    inventory: [],
    maxInventorySlots: 40, 
    equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
    towerEquipment: {
        archer: { slot1: null, slot2: null },
        cannon: { slot1: null, slot2: null },
        mage:   { slot1: null, slot2: null }
    },
    baseAttributes: { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 }, // Legacy fallback
    playerStats: { ...INITIAL_STATS },
    baseHp: 20,
    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith:  { level: 1, xp: 0, maxXp: 100 },
        jewelry:     { level: 1, xp: 0, maxXp: 100 },
        engineering: { level: 1, xp: 0, maxXp: 100 }
    }
};

// Inicializar héroe si no existe
export function initHero(classId) {
    if (!gameState.heroes[classId]) {
        gameState.heroes[classId] = {
            level: 1,
            xp: 0,
            maxXp: 100,
            statPoints: 0,
            talentPoints: 0,
            talents: [],
            baseAttributes: { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 }
        };
    }
}

// Obtener datos del héroe actual
export function getCurrentHero() {
    if (!gameState.selectedClass) return null;
    if (!gameState.heroes[gameState.selectedClass]) {
        initHero(gameState.selectedClass);
    }
    return gameState.heroes[gameState.selectedClass];
}

export function updatePlayerStats() {
    if (!gameState.selectedClass) return;
    
    const heroData = getCurrentHero();
    const classBase = CLASS_STATS[gameState.selectedClass] || { ...INITIAL_STATS };
    const newStats = { ...INITIAL_STATS, ...classBase };
    newStats.maxHp = classBase.hp || 100; 

    // 2. Atributos Comprados (Manuales)
    const attr = heroData.baseAttributes;
    newStats.damage += (attr.damage || 0);
    newStats.maxHp += (attr.maxHp || 0);
    newStats.defense += (attr.defense || 0);
    
    // IMPORTANTE: Puntos manuales en "Velocidad" REDUCEN el delay (10ms por punto)
    newStats.attackSpeed -= (attr.attackSpeed || 0); 

    // 3. Equipamiento
    const eq = gameState.equipment || { mainHand: null, offHand: null, armor: null, accessory: null };
    ['mainHand', 'offHand', 'armor', 'accessory'].forEach(slot => {
        const item = eq[slot];
        if (item && item.stats) {
            for (let key in item.stats) {
                if (newStats[key] !== undefined) {
                    if (key === 'attackSpeed') {
                        // Items que dan Attack Speed REDUCEN el delay
                        newStats.attackSpeed -= (item.stats[key] || 0);
                    } else {
                        newStats[key] += (item.stats[key] || 0);
                    }
                }
            }
        }
    });

    // 4. Talentos
    if (heroData.talents) {
        const clsTalents = TALENTS[gameState.selectedClass] || [];
        clsTalents.forEach(t => {
            if (heroData.talents.includes(t.id) && t.stats) {
                for (let key in t.stats) {
                    if (key.endsWith('Mult')) {
                        const baseKey = key.replace('Mult', '');
                        if (newStats[baseKey] !== undefined) {
                            newStats[baseKey] = Math.floor(newStats[baseKey] * (1 + t.stats[key]));
                        }
                    } else if (key === 'attackSpeed') {
                        // TALENTO: +100 Vel. Ataque = -100ms Delay
                        newStats.attackSpeed -= t.stats[key];
                    } else {
                        if (newStats[key] !== undefined) newStats[key] += t.stats[key];
                        else newStats[key] = t.stats[key];
                    }
                }
            }
        });
    }

    // Validaciones
    if (isNaN(newStats.damage)) newStats.damage = 1;
    if (isNaN(newStats.defense)) newStats.defense = 0;
    if (isNaN(newStats.maxHp)) newStats.maxHp = 100;
    
    // Límite de velocidad (cap en 100ms para no crashear)
    if (newStats.attackSpeed < 100) newStats.attackSpeed = 100;

    const oldMax = gameState.playerStats.maxHp;
    const oldHp = gameState.playerStats.hp;
    let percent = oldHp / oldMax;
    if (isNaN(percent)) percent = 1;
    
    newStats.hp = Math.floor(newStats.maxHp * percent);
    if (newStats.hp <= 0 && oldHp > 0) newStats.hp = 1;

    gameState.playerStats = newStats;
}

export function getTowerBonuses(towerType) {
    const bonuses = { range: 0, damage: 0, attackSpeed: 0, doubleAttack: 0 };
    const slots = gameState.towerEquipment[towerType];
    
    [slots.slot1, slots.slot2].forEach(item => {
        if (item && item.stats) {
            if (item.stats.range) bonuses.range += item.stats.range;
            if (item.stats.damage) bonuses.damage += item.stats.damage;
            if (item.stats.attackSpeed) bonuses.attackSpeed += item.stats.attackSpeed; 
            if (item.stats.doubleAttack) bonuses.doubleAttack += item.stats.doubleAttack;
        }
    });
    return bonuses;
}