// src/config/GameState.js

// Definimos stats base por clase aquí para no depender de archivos externos si no cargan
const CLASS_BASE_STATS = {
    guerrero: { hp: 150, damage: 15, defense: 5, attackSpeed: 1000 },
    arquero: { hp: 100, damage: 12, defense: 2, attackSpeed: 800 },
    mago: { hp: 90, damage: 20, defense: 1, attackSpeed: 1200 },
    asesino: { hp: 110, damage: 18, defense: 3, attackSpeed: 600 },
    paladin: { hp: 180, damage: 10, defense: 8, attackSpeed: 1100 }
};

export const initialState = {
    gold: 5000,
    selectedClass: null,
    
    // Stats calculados del jugador (se sobrescriben dinámicamente)
    playerStats: {
        hp: 100, maxHp: 100, damage: 10, defense: 0,
        attackSpeed: 1500, moveSpeed: 160,
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

    // Materiales
    materials: {
        wood: { common: 12, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        copper: { common: 12, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        hide: { common: 12, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        iron: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        coal: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        mithril: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cedar: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        ebony: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        scraps: { common: 12, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        cotton: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        silk: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        leather: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        scale: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
        
        // Refinados
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

    // Aquí se guardan los datos persistentes de CADA héroe
    heroes: {}, 

    talents: [],
    completedLevels: {}, 
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

// --- FUNCIONES CLAVE CORREGIDAS ---

// Inicializa (o recupera) un héroe en la estructura persistente
export function initHero(classId) {
    if (!classId) return null;

    // Si no existe, lo creamos
    if (!gameState.heroes[classId]) {
        gameState.heroes[classId] = {
            level: 1,
            xp: 0,
            maxXp: 100,
            statPoints: 0,
            talentPoints: 0,
            talents: [], // IDs de talentos aprendidos
            // Atributos base comprados con puntos (NO incluye equipo)
            baseAttributes: { 
                damage: 0, 
                maxHp: 0, 
                attackSpeed: 0, 
                defense: 0 
            }
        };
    }
    
    // Establecer como activo
    gameState.selectedClass = classId;
    
    // Recalcular stats totales
    updatePlayerStats();
    
    return gameState.heroes[classId];
}

// Devuelve el objeto del héroe actual (o null)
export function getCurrentHero() {
    if (!gameState.selectedClass) return null;
    
    // Autorecuperación si algo falló antes
    if (!gameState.heroes[gameState.selectedClass]) {
        return initHero(gameState.selectedClass);
    }
    
    return gameState.heroes[gameState.selectedClass];
}

// Recalcula los stats finales (Base Clase + Puntos + Equipo)
export function updatePlayerStats() {
    if (!gameState.selectedClass) return;

    const hero = getCurrentHero();
    const classBase = CLASS_BASE_STATS[gameState.selectedClass] || { hp: 100, damage: 10, defense: 0, attackSpeed: 1000 };
    
    // 1. Empezar con stats base de la clase
    const stats = { ...gameState.playerStats }; // Copia estructura
    stats.maxHp = classBase.hp;
    stats.damage = classBase.damage;
    stats.defense = classBase.defense;
    stats.attackSpeed = classBase.attackSpeed;

    // 2. Sumar puntos de atributo gastados (del héroe)
    if (hero && hero.baseAttributes) {
        stats.damage += (hero.baseAttributes.damage || 0);
        stats.maxHp += (hero.baseAttributes.maxHp || 0);
        stats.defense += (hero.baseAttributes.defense || 0);
        // La velocidad reduce el delay (ej: 1000ms - 50ms)
        stats.attackSpeed -= (hero.baseAttributes.attackSpeed || 0); 
    }

    // 3. Sumar Equipo
    const equipment = [
        gameState.equipment.mainHand,
        gameState.equipment.offHand,
        gameState.equipment.armor,
        gameState.equipment.accessory
    ];

    equipment.forEach(item => {
        if (item && item.stats) {
            for (let key in item.stats) {
                if (stats[key] !== undefined) {
                    if (key === 'attackSpeed' || key === 'cdr') {
                        stats[key] -= item.stats[key]; // Reducir es bueno
                    } else {
                        stats[key] += item.stats[key];
                    }
                }
            }
        }
    });

    // 4. Límites de seguridad
    if (stats.attackSpeed < 200) stats.attackSpeed = 200; // Cap velocidad (0.2s)
    if (stats.defense < 0) stats.defense = 0;

    // 5. Ajustar HP actual si cambió el máximo
    const oldMax = gameState.playerStats.maxHp;
    const oldHp = gameState.playerStats.hp;
    
    // Asignar al estado global
    Object.assign(gameState.playerStats, stats);
    
    // Mantener porcentaje de vida
    if (oldMax > 0 && oldHp > 0) {
        const percent = oldHp / oldMax;
        gameState.playerStats.hp = Math.floor(gameState.playerStats.maxHp * percent);
    } else {
        gameState.playerStats.hp = gameState.playerStats.maxHp;
    }
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