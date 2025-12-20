// src/systems/RPGSystem.js
import { gameState, RARITY } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

class RPGSystem {
    
    // --- CRAFTEO GENERAL ---
    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };

        const rarity = RARITY[rarityKey];
        if (!this.checkMaterials(recipe.mat, 3, rarityKey)) {
            return { success: false, error: `Faltan materiales (${rarity.name})` };
        }

        this.consumeMaterials(recipe.mat, 3, rarityKey);
        
        // Generar Item
        const item = this.generateItem(recipe, rarity);
        this.gainProfessionXP(recipe.type, rarityKey);
        
        return { success: true, item: item };
    }

    // --- NUEVO: CRAFTEO DE PIEZAS DE TORRE ---
    craftTowerPart(towerType, rarityKey) {
        // Costo Elevado: 10 de cada material blanco + Oro
        const costAmount = 10; 
        const goldCost = 500;

        if (gameState.gold < goldCost) return { success: false, error: "Falta Oro ($500)" };
        
        // Verificar materiales (usamos rareza 'common' para la base, o la que pida el usuario)
        // Por simplificación, pediremos 10 del material base de la rareza seleccionada
        if (!this.checkMaterials('wood', costAmount, rarityKey) || 
            !this.checkMaterials('copper', costAmount, rarityKey) ||
            !this.checkMaterials('leather', costAmount, rarityKey)) {
            return { success: false, error: `Necesitas 10 Madera, 10 Cobre y 10 Cuero (${RARITY[rarityKey].name})` };
        }

        gameState.gold -= goldCost;
        this.consumeMaterials('wood', costAmount, rarityKey);
        this.consumeMaterials('copper', costAmount, rarityKey);
        this.consumeMaterials('leather', costAmount, rarityKey);

        const item = this.generateTowerItem(towerType, RARITY[rarityKey]);
        gameState.professions.engineering.xp += 50; // XP Ingenieria
        return { success: true, item: item };
    }

    generateTowerItem(towerType, rarity) {
        const stats = {};
        // 1 Atributo base garantizado + (Nivel rareza) extras
        const possibleStats = [
            { key: 'damage', min: 2, max: 5 },
            { key: 'range', min: 10, max: 20 },
            { key: 'attackSpeed', min: 50, max: 100 }, // Reducción en ms
            { key: 'doubleAttack', min: 5, max: 10 } // Porcentaje
        ];

        const numStats = 1 + rarity.statCount; 
        
        for (let i = 0; i < numStats; i++) {
            const statDef = possibleStats[Math.floor(Math.random() * possibleStats.length)];
            const val = Math.floor(Math.random() * (statDef.max - statDef.min + 1)) + statDef.min;
            
            // Aplicar multiplicador de rareza al valor
            const finalVal = Math.floor(val * rarity.mult);
            
            if (stats[statDef.key]) stats[statDef.key] += finalVal;
            else stats[statDef.key] = finalVal;
        }

        return {
            id: Date.now() + Math.random(),
            name: `Mejora de ${towerType.toUpperCase()}`,
            type: 'tower_part',
            towerType: towerType,
            rarity: rarity.id,
            enchant: 0,
            stats: stats,
            color: rarity.color
        };
    }

    // --- NUEVO: FUSIÓN SELECTIVA (50/50) ---
    // Recibe el objeto Item1 (Base) y Item2 (Sacrificio)
    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) {
            return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        }
        if (item1.type !== item2.type) {
             return { success: false, error: "Deben ser del mismo tipo" };
        }

        // 50% de probabilidad de heredar stats de item1 o item2
        const baseStats = (Math.random() > 0.5) ? { ...item1.stats } : { ...item2.stats };
        
        // Aumentar stats para el siguiente nivel (+1)
        // LOGICA BALANCEADA: Sumar un porcentaje fijo (20%) + un valor plano mínimo (1)
        for (let key in baseStats) {
            const current = baseStats[key];
            const boost = Math.ceil(current * 0.20) + 1; // Mínimo +1 siempre, +20% escalado
            baseStats[key] = current + boost;
        }

        const newItem = {
            ...item1,
            id: Date.now(),
            name: `${item1.name} +${item1.enchant + 1}`,
            enchant: item1.enchant + 1,
            stats: baseStats
        };

        return { success: true, item: newItem };
    }

    // --- GENERADORES Y UTILS ---
    generateItem(recipe, rarity) {
        const stats = { ...recipe.baseStats };
        // Aplicar mult rareza a base
        for(let k in stats) stats[k] = Math.floor(stats[k] * rarity.mult);

        // Stats aleatorios
        const pool = this.getStatPool(recipe);
        for (let i = 0; i < rarity.statCount; i++) {
            const stat = pool[Math.floor(Math.random() * pool.length)];
            const val = Math.floor((Math.random() * (stat.max - stat.min) + stat.min) * rarity.mult);
            if(stats[stat.key]) stats[stat.key] += val;
            else stats[stat.key] = val;
        }

        return {
            id: Date.now() + Math.random(),
            recipeId: recipe.id,
            name: `${recipe.name}`,
            type: recipe.type,
            subType: recipe.subType, // sword, plate, etc.
            twoHanded: recipe.twoHanded || false,
            rarity: rarity.id,
            enchant: 0,
            stats: stats,
            color: rarity.color
        };
    }

    getStatPool(recipe) {
        if (recipe.type === 'weapon') return [
            { key: 'damage', min: 2, max: 5, label: 'Daño' },
            { key: 'critChance', min: 1, max: 3, label: '% Crítico' },
            { key: 'critDamage', min: 5, max: 15, label: 'Daño Crítico' },
            { key: 'lifesteal', min: 1, max: 2, label: 'Robo Vida' }
        ];
        if (recipe.type === 'armor') return [
            { key: 'hp', min: 10, max: 30, label: 'Vida' },
            { key: 'defense', min: 1, max: 3, label: 'Defensa' },
            { key: 'thorns', min: 1, max: 3, label: 'Espinas' },
            { key: 'regenHp', min: 1, max: 2, label: 'Regen HP' }
        ];
        return [ // Accessories
            { key: 'attackSpeed', min: 10, max: 50, label: 'Vel. Ataque (ms)' },
            { key: 'moveSpeed', min: 5, max: 15, label: 'Vel. Movimiento' },
            { key: 'cdr', min: 1, max: 5, label: 'CDR %' },
            { key: 'damage', min: 1, max: 3, label: 'Daño' }
        ];
    }

    gainProfessionXP(type, rarityKey) {
        let xp = 10 * RARITY[rarityKey].mult;
        let prof = 'weaponsmith';
        if (type === 'armor') prof = 'armorsmith';
        if (type === 'accessory') prof = 'jewelry';
        
        gameState.professions[prof].xp += Math.floor(xp);
        if (gameState.professions[prof].xp >= gameState.professions[prof].maxXp) {
            gameState.professions[prof].level++;
            gameState.professions[prof].xp = 0;
            gameState.professions[prof].maxXp = Math.floor(gameState.professions[prof].maxXp * 1.5);
        }
    }

    checkMaterials(mat, amount, rarity) {
        return gameState.materials[mat][rarity] >= amount;
    }
    consumeMaterials(mat, amount, rarity) {
        gameState.materials[mat][rarity] -= amount;
    }
    spendStatPoint(stat) {
        if (gameState.statPoints > 0) {
            gameState.statPoints--;
            if (!gameState.baseAttributes) gameState.baseAttributes = { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 };
            
            if (stat === 'damage') gameState.baseAttributes.damage += 1;
            else if (stat === 'hp') gameState.baseAttributes.maxHp += 10;
            else if (stat === 'speed') gameState.baseAttributes.attackSpeed += 10;
            else if (stat === 'defense') gameState.baseAttributes.defense += 1;
            return true;
        }
        return false;
    }
}

export default new RPGSystem();