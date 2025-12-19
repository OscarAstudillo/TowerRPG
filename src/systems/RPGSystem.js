// src/systems/RPGSystem.js
import { gameState, RARITY } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

export default class RPGSystem {
    
    // recipeId viene desde el botón de la UI
    static craftItem(recipeId, rarityKey) {
        
        // 1. Buscar la receta
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: 'Receta no existe' };

        // 2. Verificar Espacio en Inventario
        if (gameState.inventory.length >= gameState.maxInventorySlots) {
            return { success: false, error: 'Inventario lleno' };
        }

        // 3. Verificar Materiales
        const matType = recipe.mat;
        const materialCost = 3; 
        const userMats = gameState.materials[matType][rarityKey];
        
        if (userMats < materialCost) return { success: false, error: 'Faltan materiales' };

        // 4. Consumir y Calcular
        gameState.materials[matType][rarityKey] -= materialCost;
        const profData = gameState.professions[recipe.prof];
        const enchantLevel = this.calculateEnchantment(profData.level);

        // 5. XP
        this.gainProfessionXP(recipe.prof, rarityKey);

        // 6. Generar Item
        const newItem = this.generateItemObject(recipe, rarityKey, enchantLevel);
        return { success: true, item: newItem };
    }

    static calculateEnchantment(level) {
        const roll = Math.random() * 100;
        if (level <= 20) return (roll > 95) ? 2 : (roll > 80) ? 1 : 0;
        if (level <= 60) return (roll > 90) ? 5 : (roll > 70) ? 3 : 1;
        return (roll > 95) ? 10 : (roll > 85) ? 8 : 4;
    }

    static generateItemObject(recipe, rarityKey, enchantLevel) {
        const rarity = RARITY[rarityKey];
        
        // Calcular Stats Finales
        const finalStats = {};
        for (let key in recipe.stats) {
            let val = recipe.stats[key];
            val = val * rarity.mult; 
            val = val * (1 + (enchantLevel * 0.15)); 
            finalStats[key] = Math.floor(val);
        }

        // Nombre correcto: "Espada Corta Rara +3"
        const name = `${recipe.name} ${rarity.name} +${enchantLevel}`;

        return {
            uid: Date.now() + Math.random(),
            recipeId: recipe.id,
            name: name,
            type: recipe.type,       // weapon, armor, offhand, accessory
            subType: recipe.subType, // sword, bow, plate, etc.
            twoHanded: recipe.twoHanded || false,
            rarity: rarityKey,
            enchant: enchantLevel,
            stats: finalStats,
            color: rarity.color
        };
    }

    static fuseItems(item1, item2) {
        if (item1.recipeId !== item2.recipeId || item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) {
            return null;
        }
        const recipe = RECIPES.find(r => r.id === item1.recipeId);
        if(!recipe) return null;

        const newEnchant = item1.enchant + 1;
        if (newEnchant > 20) return null;
        return this.generateItemObject(recipe, item1.rarity, newEnchant);
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
}