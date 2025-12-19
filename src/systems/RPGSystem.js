// src/systems/RPGSystem.js
import { gameState, RARITY, updatePlayerStats } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

export default class RPGSystem {
    
    // --- POOLS DE ESTADÍSTICAS ---
    static STAT_POOLS = {
        weapon: [
            { key: 'damage', label: 'Daño', min: 2, max: 8 },
            { key: 'attackSpeed', label: 'Vel. Ataque', min: -50, max: -20 }, // Negativo es mejor
            { key: 'critChance', label: '% Crítico', min: 2, max: 5 },
            { key: 'critDamage', label: '% Daño Crít', min: 10, max: 25 },
            { key: 'lifesteal', label: '% Robo Vida', min: 1, max: 3 },
            { key: 'skillDamage', label: '% Daño Hab.', min: 5, max: 10 },
            { key: 'bleedChance', label: '% Sangrado', min: 5, max: 15 }
        ],
        weapon_ranged: [ // Solo para arcos/bastones
            { key: 'range', label: 'Rango', min: 20, max: 50 }
        ],
        armor: [
            { key: 'maxHp', label: 'Vida', min: 20, max: 50 },
            { key: 'defense', label: 'Defensa', min: 2, max: 5 },
            { key: 'thorns', label: 'Espinas', min: 1, max: 3 },
            { key: 'regenHp', label: 'Regen HP', min: 1, max: 3 },
            { key: 'coldAura', label: '% Aura Frío', min: 5, max: 10 }, // % Slow
            { key: 'lifesteal', label: '% Robo Vida', min: 1, max: 2 }
        ],
        accessory: [
            { key: 'damage', label: 'Daño', min: 1, max: 5 },
            { key: 'attackSpeed', label: 'Vel. Ataque', min: -30, max: -10 },
            { key: 'lifesteal', label: '% Robo Vida', min: 1, max: 2 },
            { key: 'doubleAttack', label: '% Doble Atq', min: 2, max: 5 },
            { key: 'maxHp', label: 'Vida', min: 10, max: 30 },
            { key: 'critChance', label: '% Crítico', min: 1, max: 3 }
        ]
    };

    static craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: 'Receta inválida' };

        if (gameState.inventory.length >= gameState.maxInventorySlots) return { success: false, error: 'Inventario lleno' };

        const matType = recipe.mat;
        const materialCost = 3; 
        if (gameState.materials[matType][rarityKey] < materialCost) return { success: false, error: 'Materiales insuficientes' };

        gameState.materials[matType][rarityKey] -= materialCost;
        
        // XP Profesión
        this.gainProfessionXP(recipe.prof, rarityKey);

        const newItem = this.generateItemObject(recipe, rarityKey);
        return { success: true, item: newItem };
    }

    static generateItemObject(recipe, rarityKey) {
        const rarity = RARITY[rarityKey];
        const prof = gameState.professions[recipe.prof];
        
        // Calcular Nivel de Encantamiento (Stats Base Bonus)
        const enchantLevel = this.calculateEnchantment(prof.level);
        
        // 1. Stats Fijos (De la receta, multiplicados por rareza)
        const finalStats = {};
        for (let key in recipe.baseStats) { // Ahora usamos baseStats en Recipes.js
            let val = recipe.baseStats[key];
            val = val * rarity.mult; 
            val = val * (1 + (enchantLevel * 0.1)); 
            finalStats[key] = Math.floor(val);
        }

        // 2. Stats Aleatorios (Según Rareza)
        const numRandomStats = rarity.statCount; 
        const pool = this.getStatPool(recipe);
        
        // Elegir N stats únicos
        const chosenStats = [];
        const poolCopy = [...pool];
        
        for(let i=0; i<numRandomStats; i++) {
            if (poolCopy.length === 0) break;
            const idx = Math.floor(Math.random() * poolCopy.length);
            chosenStats.push(poolCopy[idx]);
            poolCopy.splice(idx, 1); // Evitar repetidos
        }

        // Aplicar valores aleatorios
        chosenStats.forEach(statDef => {
            const val = Math.floor(Math.random() * (statDef.max - statDef.min + 1)) + statDef.min;
            // Multiplicador por rareza también aplica a stats random
            const finalVal = Math.floor(val * rarity.mult);
            
            if (finalStats[statDef.key]) finalStats[statDef.key] += finalVal;
            else finalStats[statDef.key] = finalVal;
        });

        return {
            uid: Date.now() + Math.random(),
            recipeId: recipe.id,
            name: `${recipe.name} ${rarity.name} +${enchantLevel}`,
            type: recipe.type,
            subType: recipe.subType,
            twoHanded: recipe.twoHanded || false,
            rarity: rarityKey,
            enchant: enchantLevel,
            stats: finalStats,
            color: rarity.color
        };
    }

    static getStatPool(recipe) {
        let pool = [];
        if (recipe.type === 'weapon') {
            pool = [...this.STAT_POOLS.weapon];
            // Si es rango, añadir stats de rango
            if (recipe.subType === 'bow' || recipe.subType === 'staff') {
                pool = pool.concat(this.STAT_POOLS.weapon_ranged);
            }
        } else if (recipe.type === 'armor' || recipe.type === 'offhand') {
            pool = [...this.STAT_POOLS.armor];
        } else if (recipe.type === 'accessory') {
            pool = [...this.STAT_POOLS.accessory];
        }
        return pool;
    }

    static calculateEnchantment(level) {
        const roll = Math.random() * 100;
        if (level <= 20) return (roll > 95) ? 2 : (roll > 80) ? 1 : 0;
        if (level <= 60) return (roll > 90) ? 5 : (roll > 70) ? 3 : 1;
        return (roll > 95) ? 10 : (roll > 85) ? 8 : 4;
    }

    static gainProfessionXP(profKey, rarityCreated) {
        const prof = gameState.professions[profKey];
        if (prof.level >= 100) return;

        let xpGain = 10;
        if (rarityCreated === 'uncommon') xpGain = 25;
        if (rarityCreated === 'rare') xpGain = 60;
        if (rarityCreated === 'epic') xpGain = 150;
        if (rarityCreated === 'legendary') xpGain = 500;

        prof.xp += xpGain;
        if (prof.xp >= prof.maxXp) {
            prof.level++;
            prof.xp -= prof.maxXp;
            prof.maxXp = Math.floor(prof.maxXp * 1.2);
        }
    }

    // --- SISTEMA DE NIVEL DE HÉROE ---
    static gainHeroXP(amount) {
        if (gameState.heroLevel >= 100) return;

        gameState.heroXP += amount;
        if (gameState.heroXP >= gameState.heroMaxXP) {
            this.levelUpHero();
        }
    }

    static levelUpHero() {
        gameState.heroLevel++;
        gameState.heroXP -= gameState.heroMaxXP;
        gameState.heroMaxXP = Math.floor(gameState.heroMaxXP * 1.15); // Curva de XP
        
        // Puntos de Stats
        let points = 1;
        if (gameState.heroLevel % 10 === 0) points += 2; // Bonus cada 10 niveles
        gameState.statPoints += points;

        updatePlayerStats();
        // Aquí podríamos disparar un efecto visual si estuviéramos en la escena
        console.log("¡LEVEL UP! Nivel:", gameState.heroLevel);
    }

    static spendStatPoint(stat) {
        if (gameState.statPoints <= 0) return false;

        if (stat === 'damage') gameState.baseAttributes.damage += 1;
        else if (stat === 'hp') gameState.baseAttributes.maxHp += 10;
        else if (stat === 'defense') gameState.baseAttributes.defense += 1;
        else if (stat === 'speed') gameState.baseAttributes.attackSpeed += 10; // 10ms menos

        gameState.statPoints--;
        updatePlayerStats();
        return true;
    }
}