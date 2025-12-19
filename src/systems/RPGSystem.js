// src/systems/RPGSystem.js
import { gameState, RARITY, updatePlayerStats } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

export default class RPGSystem {
    
    // --- POOLS DE ESTADÍSTICAS ---
    static STAT_POOLS = {
        weapon: [
            { key: 'damage', label: 'Daño', min: 2, max: 8 },
            { key: 'attackSpeed', label: 'Vel. Ataque', min: -50, max: -20 },
            { key: 'critChance', label: '% Crítico', min: 2, max: 5 },
            { key: 'critDamage', label: '% Daño Crít', min: 10, max: 25 },
            { key: 'lifesteal', label: '% Robo Vida', min: 1, max: 3 },
            { key: 'skillDamage', label: '% Daño Hab.', min: 5, max: 10 },
            { key: 'bleedChance', label: '% Sangrado', min: 5, max: 15 }
        ],
        weapon_ranged: [
            { key: 'range', label: 'Rango', min: 20, max: 50 }
        ],
        armor: [
            { key: 'maxHp', label: 'Vida', min: 20, max: 50 },
            { key: 'defense', label: 'Defensa', min: 2, max: 5 },
            { key: 'thorns', label: 'Espinas', min: 1, max: 3 },
            { key: 'regenHp', label: 'Regen HP', min: 1, max: 3 },
            { key: 'coldAura', label: '% Aura Frío', min: 5, max: 10 },
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
        
        // Calcular Nivel de Encantamiento
        const enchantLevel = this.calculateEnchantment(prof.level);
        
        // 1. Stats Fijos (Base)
        const finalStats = {};
        for (let key in recipe.baseStats) { 
            let val = recipe.baseStats[key];
            val = val * rarity.mult; 
            val = val * (1 + (enchantLevel * 0.1)); 
            finalStats[key] = Math.floor(val);
        }

        // 2. Stats Aleatorios (RNG)
        const numRandomStats = rarity.statCount; 
        const pool = this.getStatPool(recipe);
        
        const chosenStats = [];
        const poolCopy = [...pool];
        
        for(let i=0; i<numRandomStats; i++) {
            if (poolCopy.length === 0) break;
            const idx = Math.floor(Math.random() * poolCopy.length);
            chosenStats.push(poolCopy[idx]);
            poolCopy.splice(idx, 1); 
        }

        // --- APLICAR RNG AJUSTADO POR RAREZA ---
        chosenStats.forEach(statDef => {
            let minVal = statDef.min;
            let maxVal = statDef.max;

            // BONUS: Los items raros tienen mejores mínimos asegurados
            if (rarityKey === 'uncommon') { minVal *= 1.1; }
            if (rarityKey === 'rare') { minVal *= 1.2; }
            if (rarityKey === 'epic') { minVal *= 1.3; maxVal *= 1.1; }
            if (rarityKey === 'legendary') { minVal *= 1.5; maxVal *= 1.2; }

            const val = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
            
            // Multiplicador general por rareza
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

    static fuseItems(item1, item2) {
        if (item1.recipeId !== item2.recipeId || item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) {
            return null;
        }
        const recipe = RECIPES.find(r => r.id === item1.recipeId);
        if(!recipe) return null;

        const newEnchant = item1.enchant + 1;
        if (newEnchant > 20) return null;
        
        // Al fusionar, regeneramos el objeto con nivel +1 (Reroll de stats)
        // O podríamos mantener stats y subirlos, pero generar de nuevo es más fácil por ahora
        // Nota: Esto hace "reroll" de los stats aleatorios.
        const newItem = this.generateItemObject(recipe, item1.rarity);
        newItem.enchant = newEnchant; // Forzamos el nivel calculado
        newItem.name = `${recipe.name} ${RARITY[item1.rarity].name} +${newEnchant}`;
        
        return newItem;
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
        gameState.heroMaxXP = Math.floor(gameState.heroMaxXP * 1.15); 
        
        let points = 1;
        if (gameState.heroLevel % 10 === 0) points += 2; 
        gameState.statPoints += points;

        updatePlayerStats();
        console.log("¡LEVEL UP! Nivel:", gameState.heroLevel);
    }

    static spendStatPoint(stat) {
        if (gameState.statPoints <= 0) return false;

        if (stat === 'damage') gameState.baseAttributes.damage += 1;
        else if (stat === 'hp') gameState.baseAttributes.maxHp += 10;
        else if (stat === 'defense') gameState.baseAttributes.defense += 1;
        else if (stat === 'speed') gameState.baseAttributes.attackSpeed += 10; 

        gameState.statPoints--;
        updatePlayerStats();
        return true;
    }
}