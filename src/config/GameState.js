// src/config/GameState.js
import { ITEM_SETS } from './ItemSets.js'; 
import { TALENTS } from './Talents.js';

// Definimos stats base por clase
const CLASS_BASE_STATS = {
    guerrero: { hp: 150, damage: 15, defense: 5, attackSpeed: 1000, range: 100 },
    arquero: { hp: 100, damage: 12, defense: 2, attackSpeed: 800, range: 350 },
    mago: { hp: 90, damage: 20, defense: 1, attackSpeed: 1200, range: 280 },
    asesino: { hp: 110, damage: 18, defense: 3, attackSpeed: 600, range: 80 },
    paladin: { hp: 180, damage: 10, defense: 8, attackSpeed: 1100, range: 100 }
};

export const initialState = {
    gold: 5000,
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
    equipment: { mainHand: null, offHand: null, armor: null, accessory: null },
    
    towerEquipment: {
        archer: { slot1: null, slot2: null },
        cannon: { slot1: null, slot2: null },
        mage:   { slot1: null, slot2: null }
    },

    materials: {
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

        ingot_copper: { common: 0, uncommon: 0, rare: 100, epic: 0, legendary: 0 },
        ingot_iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_steel: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ingot_mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        plank_wood: { common: 0, uncommon: 0, rare: 1200, epic: 0, legendary: 0 },
        plank_cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        plank_ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_simple: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_fine: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cloth_royal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather_simple: { common: 0, uncommon: 0, rare: 100, epic: 0, legendary: 0 },
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

    quests: {
        active: [],
        lastRefresh: 0
    },

    heroes: {}, 
    talents: [],
    completedLevels: {}, 
    unlockedRecipes: [], // NUEVO: Para guardar recetas especiales ganadas
    activeSets: [],
    maxLevel: 1,
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

export function initHero(classId) { if (!classId) return null; if (!gameState.heroes[classId]) { gameState.heroes[classId] = { level: 100, xp: 0, maxXp: 100, statPoints: 200, talentPoints: 10, talents: [], baseAttributes: { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 } }; } gameState.selectedClass = classId; updatePlayerStats(); return gameState.heroes[classId]; }
export function getCurrentHero() { if (!gameState.selectedClass) return null; if (!gameState.heroes[gameState.selectedClass]) { return initHero(gameState.selectedClass); } return gameState.heroes[gameState.selectedClass]; }

// Función que lee los talentos activos y suma sus estadísticas
export function getTalentBonuses() {
    const bonuses = {
        // Stats Héroe
        damage: 0, damageMult: 0,
        maxHp: 0, maxHpMult: 0,
        defense: 0,
        attackSpeed: 0, // Flat reduction (ms)
        critChance: 0, critDamage: 0,
        lifesteal: 0, regenHp: 0, thorns: 0,
        rangeMult: 0, moveSpeedMult: 0,
        cdr: 0,
        block_chance: 0, double_strike: 0, pierce: 0, skillDamage: 0,
        
        // Stats Torres (si los añades en el futuro)
        towerDamage: 0, towerRange: 0, towerCost: 0
    };

    const hero = getCurrentHero();
    if (!hero || !hero.talents || hero.talents.length === 0) return bonuses;

    const cls = gameState.selectedClass;
    const availableTalents = TALENTS[cls] || [];

    // Recorremos los IDs de talentos aprendidos por el jugador
    hero.talents.forEach(talentId => {
        // Buscamos la definición del talento en TALENTS.js
        const talentDef = availableTalents.find(t => t.id === talentId);
        
        if (talentDef && talentDef.stats) {
            // Sumamos cada estadística que otorgue el talento
            for (let key in talentDef.stats) {
                if (bonuses[key] !== undefined) {
                    bonuses[key] += talentDef.stats[key];
                }
            }
        }
        
        // Manejo de efectos especiales (ej: 'block_chance')
        if (talentDef && talentDef.effect && bonuses[talentDef.effect] !== undefined) {
             bonuses[talentDef.effect] += (talentDef.val || 0);
        }
    });

    return bonuses;
}

export function updatePlayerStats() {
    if (!gameState.selectedClass) return;

    const hero = getCurrentHero();
    const classBase = CLASS_BASE_STATS[gameState.selectedClass] || { hp: 100, damage: 10, defense: 0, attackSpeed: 1000, range: 100 };
    
    // 1. Stats Base de Clase + Nivel
    const levelBonus = (hero ? hero.level - 1 : 0);
    
    let stats = {
        maxHp: classBase.hp + (levelBonus * 10),
        damage: classBase.damage + (levelBonus * 2),
        defense: classBase.defense + (levelBonus * 1),
        attackSpeed: classBase.attackSpeed,
        range: classBase.range || 100,
        
        // Secundarios
        critChance: 5, 
        critDamage: 150,
        lifesteal: 0, 
        regenHp: 0,
        doubleAttack: 0, 
        thorns: 0,
        cdr: 0,
        blockChance: 0
    };

    // 2. Aplicar Puntos de Stat (Invertidos manualmente por el jugador)
    if (hero && hero.baseAttributes) {
        stats.damage += (hero.baseAttributes.damage || 0);
        stats.maxHp += (hero.baseAttributes.maxHp || 0);
        stats.defense += (hero.baseAttributes.defense || 0);
        // La velocidad invertida reduce el delay
        stats.attackSpeed -= (hero.baseAttributes.attackSpeed || 0);
    }

    // 3. Aplicar TALENTOS (Árbol de habilidades)
    const talentBonuses = getTalentBonuses();
    
    // Sumas planas
    stats.maxHp += talentBonuses.maxHp;
    stats.damage += talentBonuses.damage;
    stats.defense += talentBonuses.defense;
    stats.regenHp += talentBonuses.regenHp;
    stats.lifesteal += talentBonuses.lifesteal;
    stats.critChance += talentBonuses.critChance;
    stats.critDamage += talentBonuses.critDamage;
    stats.attackSpeed -= talentBonuses.attackSpeed; // Reducción de delay plana
    stats.thorns += talentBonuses.thorns;
    stats.cdr += talentBonuses.cdr;
    
    // Efectos especiales de talentos mapeados a stats
    stats.doubleAttack += talentBonuses.double_strike;
    stats.blockChance += talentBonuses.block_chance;

    // Multiplicadores de Talentos
    if (talentBonuses.maxHpMult > 0) stats.maxHp = Math.floor(stats.maxHp * (1 + talentBonuses.maxHpMult));
    if (talentBonuses.damageMult > 0) stats.damage = Math.floor(stats.damage * (1 + talentBonuses.damageMult));
    if (talentBonuses.rangeMult > 0) stats.range = Math.floor(stats.range * (1 + talentBonuses.rangeMult));

    // 4. Aplicar EQUIPAMIENTO
    const equipment = [
        gameState.equipment.mainHand,
        gameState.equipment.offHand,
        gameState.equipment.armor,
        gameState.equipment.accessory
    ];

    const setCount = {};
    equipment.forEach(item => {
        if (item) {
            // Sumar stats del item
            if (item.stats) {
                for (let key in item.stats) {
                    if (stats[key] !== undefined) {
                        if (key === 'attackSpeed' || key === 'cdr') stats[key] -= item.stats[key];
                        else stats[key] += item.stats[key];
                    }
                }
            }
            // Contar Sets
            if (ITEM_SETS && item.recipeId) { 
                for (let setKey in ITEM_SETS) {
                    const set = ITEM_SETS[setKey];
                    if (set.items.includes(item.recipeId)) {
                        setCount[setKey] = (setCount[setKey] || 0) + 1;
                    }
                }
            }
        }
    });

    // 5. Aplicar Bonos de Set
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
            if (activeBonusesText.length > 0) {
                gameState.activeSets.push({ name: setDef.name, bonuses: activeBonusesText });
            }
        }
    }

    // --- CORRECCIÓN DE SEGURIDAD (SANITY CHECKS) ---
    // Asegurar que la velocidad de ataque nunca sea 0 o negativa (10 ataques por segundo máx)
    if (stats.attackSpeed < 100) stats.attackSpeed = 100; 
    
    // Limitar rango para que no rompa el mapa (máximo visual razonable)
    if (stats.range > 1500) stats.range = 1500;

    // Actualizar vida si aumentó el máximo
    if (gameState.playerStats.hp > stats.maxHp) gameState.playerStats.hp = stats.maxHp;
    
    // Si la vida actual estaba llena, mantenerla llena al subir maxHp (opcional, buena UX)
    if (gameState.playerStats.hp === gameState.playerStats.maxHp) {
        gameState.playerStats.hp = stats.maxHp;
    }

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