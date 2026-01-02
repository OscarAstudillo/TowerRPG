// src/config/GameState.js
import { ITEM_SETS } from './ItemSets.js';
import { TALENTS } from './Talents.js';

// --- CONSTANTES GLOBALES FALTANTES (ESTO SOLUCIONA EL ERROR) ---
export const BASE_STATS = {
    hp: 20,    // Vida base del castillo
    gold: 400  // Oro inicial base (si no lo sobreescribe el nivel)
};

export const TOWER_COSTS = {
    archer: 100,
    cannon: 150,
    mage: 120,
    tesla: 180,
    poison: 130,
    quake: 200
};

export const ENEMY_STATS = {
    hpMult: 1,
    speedMult: 1,
    coinMult: 1
};
// -------------------------------------------------------------

const CLASS_BASE_STATS = {
    guerrero: { hp: 150, damage: 15, defense: 5, attackSpeed: 1000, range: 100 },
    arquero: { hp: 100, damage: 12, defense: 2, attackSpeed: 800, range: 350 },
    mago: { hp: 90, damage: 20, defense: 1, attackSpeed: 1200, range: 280 },
    asesino: { hp: 110, damage: 18, defense: 3, attackSpeed: 600, range: 80 },
    paladin: { hp: 180, damage: 12, defense: 8, attackSpeed: 1100, range: 100 }
};

// --- DEFINICIÓN DE RESTRICCIONES DE EQUIPO ---
export const CLASS_RESTRICTIONS = {
    guerrero: {
        allowedArmor: ['plate'],
        allowedWeapon: ['sword'],
        allowedOffhand: ['shield', 'sword'], // Puede usar espada en offhand (Dual)
        canDualWield: true
    },
    paladin: {
        allowedArmor: ['plate'],
        allowedWeapon: ['sword'],
        allowedOffhand: ['shield'],
        canDualWield: false
    },
    arquero: {
        allowedArmor: ['leather'],
        allowedWeapon: ['bow'],
        allowedOffhand: [], // Arco ocupa 2 manos
        canDualWield: false
    },
    asesino: {
        allowedArmor: ['leather'],
        allowedWeapon: ['dagger'],
        allowedOffhand: ['dagger'], // Puede usar daga en offhand
        canDualWield: true
    },
    mago: {
        allowedArmor: ['cloth'],
        allowedWeapon: ['staff'],
        allowedOffhand: [], // Bastón ocupa 2 manos
        canDualWield: false
    }
};

export const initialState = {
    gold: 500000,
    selectedClass: null,
    
    playerStats: {
        hp: 100, maxHp: 100, damage: 10, defense: 0,
        attackSpeed: 1000, moveSpeed: 160, range: 120,
        critChance: 5, critDamage: 150,
        lifesteal: 0, regenHp: 0,
        cdr: 0, doubleAttack: 0, thorns: 0,
        blockChance: 0
    },

    inventory: [],
    // Este es el equipamiento "ACTIVO" en pantalla
    equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
    
    towerEquipment: {
        archer: { slot1: null, slot2: null },
        cannon: { slot1: null, slot2: null },
        mage:   { slot1: null, slot2: null },
        tesla:  { slot1: null, slot2: null },
        poison: { slot1: null, slot2: null },
        quake:  { slot1: null, slot2: null }
    },

    materials: {
        wood: { common: 0, uncommon: 0, rare: 1000, epic: 0, legendary: 0, mythic: 0 },
        copper: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        hide: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        coal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        scraps: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        cotton: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        silk: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        leather: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        scale: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },

        ingot_copper: { common: 0, uncommon: 0, rare: 1001, epic: 0, legendary: 0, mythic: 0 },
        ingot_iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        ingot_steel: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        ingot_mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        plank_wood: { common: 0, uncommon: 0, rare: 1001, epic: 0, legendary: 0, mythic: 0 },
        plank_cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        plank_ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        cloth_simple: { common: 0, uncommon: 0, rare: 1000, epic: 0, legendary: 0, mythic: 0 },
        cloth_fine: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        cloth_royal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        leather_simple: { common: 0, uncommon: 0, rare: 1000, epic: 0, legendary: 0, mythic: 0 },
        leather_rigid: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
        leather_dragon: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 }
    },

    professions: {
        weaponsmith: { level: 1, xp: 0, maxXp: 100 },
        armorsmith: { level: 1, xp: 0, maxXp: 100 },
        jewelry: { level: 1, xp: 0, maxXp: 100 },
        engineering: { level: 1, xp: 0, maxXp: 100 },
        refining: { level: 1, xp: 0, maxXp: 100 }
    },

    quests: {
        active: [],
        lastRefresh: 0
    },

    heroes: {}, 
    talents: [],
    completedLevels: {}, 
    unlockedRecipes: [], 
    activeSets: [],
    
    biomeLevels: {
        forest: 1,
        mountain: 1,
        volcano: 1
    },
    
    maxLevel: 1, 
    baseHp: 20
};

export const gameState = JSON.parse(JSON.stringify(initialState));

export const RARITY = {
    common:    { id: 'common',    name: 'Común',      color: 0xffffff, mult: 1.0, statCount: 0 },
    uncommon:  { id: 'uncommon',  name: 'Poco Común', color: 0x00ff00, mult: 1.2, statCount: 1 },
    rare:      { id: 'rare',      name: 'Raro',       color: 0x0000ff, mult: 1.5, statCount: 2 },
    epic:      { id: 'epic',      name: 'Épico',      color: 0x800080, mult: 2.0, statCount: 3 },
    mythic:    { id: 'mythic',    name: 'Mítico',     color: 0xff0000, mult: 2.5, statCount: 4 },
    legendary: { id: 'legendary', name: 'Legendario', color: 0xffaa00, mult: 3.0, statCount: 5 }
};

// --- GESTIÓN DE HÉROES Y EQUIPAMIENTO ---

// Guarda el equipo actual en la memoria del héroe
export function saveHeroEquipment(classId) {
    if (!classId || !gameState.heroes[classId]) return;
    // Clonamos el estado actual del equipo para guardarlo en el héroe
    gameState.heroes[classId].savedEquipment = JSON.parse(JSON.stringify(gameState.equipment));
}

// Carga el equipo desde la memoria del héroe al estado activo
export function loadHeroEquipment(classId) {
    if (!classId || !gameState.heroes[classId]) return;
    
    const saved = gameState.heroes[classId].savedEquipment;
    if (saved) {
        gameState.equipment = JSON.parse(JSON.stringify(saved));
    } else {
        // Si no tiene equipo guardado (nuevo), limpiar slots
        gameState.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
    }
}

export function initHero(classId) {
    if (!classId) return null;
    
    // Si no existe el héroe, crearlo
    if (!gameState.heroes[classId]) {
        gameState.heroes[classId] = { 
            level: 1, 
            xp: 0, 
            maxXp: 100, 
            statPoints: 0, 
            talentPoints: 0, 
            talents: [], 
            baseAttributes: { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 },
            savedEquipment: { mainHand: null, offHand: null, armor: null, accessory: null } // Equipo vacío inicial
        };
    }
    
    gameState.selectedClass = classId;
    
    // IMPORTANTE: Cargar el equipo específico de este héroe
    loadHeroEquipment(classId);
    
    updatePlayerStats();
    return gameState.heroes[classId];
}

export function getCurrentHero() {
    if (!gameState.selectedClass) return null;
    if (!gameState.heroes[gameState.selectedClass]) {
        return initHero(gameState.selectedClass);
    }
    return gameState.heroes[gameState.selectedClass];
}

// --- VALIDACIÓN DE RESTRICCIONES ---
export function canEquipItem(classId, item) {
    if (!classId || !item) return false;
    
    // Joyería siempre permitida
    if (item.type === 'accessory') return true;
    
    // Torres siempre permitidas en su panel
    if (item.type === 'tower_part') return true;

    const rules = CLASS_RESTRICTIONS[classId];
    if (!rules) return true; // Si no hay reglas, permitir (fallback)

    // Validar Armadura
    if (item.type === 'armor') {
        return rules.allowedArmor.includes(item.subType);
    }

    // Validar Arma
    if (item.type === 'weapon') {
        return rules.allowedWeapon.includes(item.subType);
    }

    // Validar Offhand (Escudo o Arma secundaria)
    if (item.type === 'offhand') {
        return rules.allowedOffhand.includes(item.subType);
    }

    return false;
}

export function getTalentBonuses() {
    const bonuses = { damage: 0, damageMult: 0, maxHp: 0, maxHpMult: 0, defense: 0, attackSpeed: 0, critChance: 0, critDamage: 0, lifesteal: 0, regenHp: 0, thorns: 0, rangeMult: 0, moveSpeedMult: 0, cdr: 0, block_chance: 0, double_strike: 0, pierce: 0, skillDamage: 0, towerDamage: 0, towerRange: 0, towerCost: 0 };
    const hero = getCurrentHero();
    if (!hero || !hero.talents || hero.talents.length === 0) return bonuses;
    const cls = gameState.selectedClass;
    const availableTalents = TALENTS[cls] || [];
    hero.talents.forEach(talentId => {
        const talentDef = availableTalents.find(t => t.id === talentId);
        if (talentDef && talentDef.stats) { for (let key in talentDef.stats) { if (bonuses[key] !== undefined) { bonuses[key] += talentDef.stats[key]; } } }
        if (talentDef && talentDef.effect && bonuses[talentDef.effect] !== undefined) { bonuses[talentDef.effect] += (talentDef.val || 0); }
    });
    return bonuses;
}

export function updatePlayerStats() {
    if (!gameState.selectedClass) return;

    const hero = getCurrentHero();
    const classBase = CLASS_BASE_STATS[gameState.selectedClass] || { hp: 100, damage: 10, defense: 0, attackSpeed: 1000, range: 100 };
    const levelBonus = (hero ? hero.level - 1 : 0);
    
    let stats = {
        maxHp: classBase.hp + (levelBonus * 10),
        damage: classBase.damage + (levelBonus * 2),
        defense: classBase.defense + (levelBonus * 1),
        attackSpeed: classBase.attackSpeed,
        range: classBase.range || 100,
        critChance: 5, critDamage: 150, lifesteal: 0, regenHp: 0, doubleAttack: 0, thorns: 0, cdr: 0, blockChance: 0, moveSpeed: 160
    };

    if (hero && hero.baseAttributes) {
        stats.damage += (hero.baseAttributes.damage || 0);
        stats.maxHp += (hero.baseAttributes.maxHp || 0);
        stats.defense += (hero.baseAttributes.defense || 0);
        stats.attackSpeed -= (hero.baseAttributes.attackSpeed || 0);
    }

    const talentBonuses = getTalentBonuses();
    
    stats.maxHp += talentBonuses.maxHp; stats.damage += talentBonuses.damage; stats.defense += talentBonuses.defense; stats.regenHp += talentBonuses.regenHp; stats.lifesteal += talentBonuses.lifesteal; stats.critChance += talentBonuses.critChance; stats.critDamage += talentBonuses.critDamage; stats.attackSpeed -= talentBonuses.attackSpeed; stats.thorns += talentBonuses.thorns; stats.cdr += talentBonuses.cdr; stats.doubleAttack += talentBonuses.double_strike; stats.blockChance += talentBonuses.block_chance;
    if (talentBonuses.maxHpMult > 0) stats.maxHp = Math.floor(stats.maxHp * (1 + talentBonuses.maxHpMult));
    if (talentBonuses.damageMult > 0) stats.damage = Math.floor(stats.damage * (1 + talentBonuses.damageMult));
    if (talentBonuses.rangeMult > 0) stats.range = Math.floor(stats.range * (1 + talentBonuses.rangeMult));

    // Equipamiento
    const equipment = [ gameState.equipment.mainHand, gameState.equipment.offHand, gameState.equipment.armor, gameState.equipment.accessory ];
    const setCount = {};
    equipment.forEach(item => {
        if (item) {
            if (item.stats) {
                for (let key in item.stats) {
                    if (stats[key] !== undefined) {
                        if (key === 'attackSpeed' || key === 'cdr') stats[key] -= item.stats[key];
                        else stats[key] += item.stats[key];
                    }
                }
            }
            if (ITEM_SETS && item.recipeId) { 
                for (let setKey in ITEM_SETS) {
                    const set = ITEM_SETS[setKey];
                    if (set.items.includes(item.recipeId)) { setCount[setKey] = (setCount[setKey] || 0) + 1; }
                }
            }
        }
    });

    gameState.activeSets = [];
    if (ITEM_SETS) {
        for (let setKey in setCount) {
            const count = setCount[setKey];
            const setDef = ITEM_SETS[setKey];
            let activeBonusesText = [];
            setDef.bonuses.forEach(bonus => {
                if (count >= bonus.count) {
                    activeBonusesText.push(`(${bonus.count}) ${bonus.desc}`);
                    for (let statKey in bonus.stats) {
                        if (stats[statKey] !== undefined) {
                            if (statKey === 'attackSpeed' || statKey === 'cdr') stats[statKey] -= bonus.stats[statKey];
                            else stats[statKey] += bonus.stats[statKey];
                        }
                    }
                }
            });
            if (activeBonusesText.length > 0) { gameState.activeSets.push({ name: setDef.name, bonuses: activeBonusesText }); }
        }
    }

    if (stats.attackSpeed < 200) stats.attackSpeed = 200; 
    if (stats.range > 1200) stats.range = 1200;
    if (gameState.playerStats.hp > stats.maxHp) gameState.playerStats.hp = stats.maxHp;
    if (gameState.playerStats.hp === gameState.playerStats.maxHp) gameState.playerStats.hp = stats.maxHp;

    Object.assign(gameState.playerStats, stats);
}

export function getTowerBonuses(type) {
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