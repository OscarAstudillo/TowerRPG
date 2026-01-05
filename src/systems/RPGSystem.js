import { gameState, RARITY, getCurrentHero, updatePlayerStats } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js';
import SaveSystem from './SaveSystem.js';
import { EventBus } from '../utils/EventBus.js'; // Asegúrate de tener este import si usas EventBus

class RPGSystem {
    
    getUniqueId() {
        return "ITEM_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    }

    getDynamicRarity(level) {
        const lvl = Math.max(1, Math.min(level, 10));
        const p1 =  { common: 95, uncommon: 5, rare: 0, epic: 0, legendary: 0 };
        const p10 = { common: 35, uncommon: 20, rare: 15, epic: 12, legendary: 18 }; 
        const t = (lvl - 1) / 9; 
        const getChance = (key) => Math.floor(p1[key] + (p10[key] - p1[key]) * t);
        const chances = { common: getChance('common'), uncommon: getChance('uncommon'), rare: getChance('rare'), epic: getChance('epic'), legendary: getChance('legendary') };
        const roll = Math.random() * 100;
        let cumulative = 0;
        cumulative += chances.common; if (roll < cumulative) return 'common';
        cumulative += chances.uncommon; if (roll < cumulative) return 'uncommon';
        cumulative += chances.rare; if (roll < cumulative) return 'rare';
        cumulative += chances.epic; if (roll < cumulative) return 'epic';
        return 'legendary'; 
    }

    getChestLoot(biomeKey, levelId) {
        const loot = [];
        const biome = BIOMES[biomeKey] || BIOMES['forest'];
        const itemCount = Phaser.Math.Between(3, 5); 
        const levelData = LEVEL_CONFIG[levelId] || { tier: 1 };
        const tier = levelData.tier || 1;
        const possibleMats = biome.materials[tier] || biome.materials[1];

        for (let i = 0; i < itemCount; i++) {
            const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
            let rarity = this.getDynamicRarity(levelId);
            if (matKey === 'coal') rarity = 'common'; // Carbón siempre común

            const amount = Phaser.Math.Between(1, 3);
            if (!gameState.materials[matKey]) gameState.materials[matKey] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
            gameState.materials[matKey][rarity] += amount;

            const existing = loot.find(l => l.key === matKey && l.rarity === rarity);
            if (existing) existing.amount += amount;
            else loot.push({ key: matKey, rarity: rarity, amount: amount });
        }

        if (Math.random() < 0.3) {
            const goldBonus = 50 * levelId;
            gameState.gold += goldBonus;
            loot.push({ key: 'Oro Extra', rarity: 'common', amount: goldBonus, bonus: true });
        }
        SaveSystem.save();
        return loot;
    }

    // --- NUEVO MÉTODO: Probabilidad de Éxito de Profesión (0 a 0.5) ---
    getProfessionChance(profKey) {
        if (!gameState.professions[profKey]) return 0;
        const level = gameState.professions[profKey].level || 1;
        // Nivel 1 = 0.5%, Nivel 100 = 50%
        return Math.min(0.5, (level / 100) * 0.5);
    }

    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };
        
        const rarity = RARITY[rarityKey];
        const costMult = (GAME_CONSTANTS && GAME_CONSTANTS.CRAFTING) ? GAME_CONSTANTS.CRAFTING.GOLD_COST_MULTIPLIER : 1;
        const goldCost = Math.floor(recipe.cost * rarity.mult * costMult);
        
        if (gameState.gold < goldCost) return { success: false, error: "Falta Oro" };

        const ingredients = recipe.ingredients || {}; 
        for (let matKey in ingredients) {
            const reqQty = ingredients[matKey];
            const checkRarity = (matKey === 'coal') ? 'common' : rarityKey;
            const playerMats = gameState.materials[matKey];
            const owned = playerMats ? (playerMats[checkRarity] || 0) : 0;
            
            if (owned < reqQty) {
                const matName = (RAW_MATERIALS[matKey] || REFINED_MATERIALS[matKey] || {name: matKey}).name;
                return { success: false, error: `Falta: ${matName} (${reqQty - owned})` };
            }
        }

        gameState.gold -= goldCost;
        for (let matKey in ingredients) {
            const reqQty = ingredients[matKey];
            const consumeRarity = (matKey === 'coal') ? 'common' : rarityKey;
            gameState.materials[matKey][consumeRarity] -= reqQty;
        }

        let profKey = recipe.prof || 'smithing'; // Default a herrería si no tiene
        if (!recipe.prof && recipe.type === 'tower_part') profKey = 'engineering';

        // --- LÓGICA DE ENCANTAMIENTO AUTOMÁTICO (+0 a +6) ---
        // Se aplica a Weaponsmith, Armorsmith y Jewelcrafting (o sus equivalentes)
        let bonusEnchant = 0;
        const chance = this.getProfessionChance(profKey);
        
        // Si tienes suerte (probabilidad basada en nivel), sale encantado
        if (Math.random() < chance) {
            // El nivel de encantamiento es aleatorio entre 1 y 6
            // Cuanto más alto el nivel de profesión, más probable es que sea alto
            // Pero para simplificar y cumplir tu regla: "hasta un +6"
            // Hacemos un roll ponderado simple:
            const enchantRoll = Math.random();
            if (enchantRoll > 0.95) bonusEnchant = 6;
            else if (enchantRoll > 0.85) bonusEnchant = 5;
            else if (enchantRoll > 0.70) bonusEnchant = 4;
            else if (enchantRoll > 0.50) bonusEnchant = 3;
            else if (enchantRoll > 0.25) bonusEnchant = 2;
            else bonusEnchant = 1;
        }
        
        const item = this.generateItem(recipe, rarityKey, bonusEnchant);
        
        this.gainProfessionXP(profKey, rarityKey);
        this.updateQuestProgress('craft', recipe.type, 1);
        
        return { success: true, item: item, enchantBonus: bonusEnchant };
    }

    // --- GENERACIÓN DE ÍTEMS CON EL NUEVO SISTEMA DE STATS ---
    generateItem(recipe, rarityKey, initialEnchant = 0) {
        const rarity = RARITY[rarityKey];
        const tier = recipe.tier || 1;
        
        // 1. Identificar Arquetipo para Stats Base
        const subType = recipe.subType || recipe.type;
        const archetype = GAME_CONSTANTS.BASE_STATS_RULES ? GAME_CONSTANTS.BASE_STATS_RULES[subType] : null; 
        
        let finalStats = {};

        // 2. Calcular Multiplicadores Globales
        const tierMult = Math.pow(2, tier - 1);
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        const rarityIndex = rarityOrder.indexOf(rarityKey);
        const rarityMult = Math.pow(1.10, rarityIndex);
        const fusionMult = Math.pow(1.05, initialEnchant);

        const totalMult = tierMult * rarityMult * fusionMult;

        // 3. Aplicar Stats Base Obligatorios
        if (archetype) {
            this.applyStat(finalStats, archetype.primary, recipe.baseStats[archetype.primary], totalMult);
            this.applyStat(finalStats, archetype.secondary, recipe.baseStats[archetype.secondary], totalMult);
        } else {
            for (let key in recipe.baseStats) {
                this.applyStat(finalStats, key, recipe.baseStats[key], totalMult);
            }
        }

        // 4. Generar Atributos Extra (Random)
        const extraCount = rarity.statCount || 0;
        const pool = this.getStatPool(recipe);
        
        for (let i = 0; i < extraCount; i++) {
            const statDef = pool[Math.floor(Math.random() * pool.length)];
            const randomMult = tierMult * fusionMult * Math.pow(1.05, rarityIndex);
            const baseVal = (Math.random() * (statDef.max - statDef.min) + statDef.min);
            this.applyStat(finalStats, statDef.key, baseVal, randomMult);
        }

        return { 
            id: this.getUniqueId(),
            recipeId: recipe.id, 
            name: recipe.name, 
            type: recipe.type, 
            subType: recipe.subType, 
            towerType: (recipe.type === 'tower_part' ? recipe.subType : null),
            twoHanded: recipe.twoHanded || false, 
            rarity: rarityKey, 
            enchant: initialEnchant, 
            stats: finalStats, 
            color: rarity.color 
        };
    }

    applyStat(statsObj, key, baseValue, multiplier) {
        if (baseValue === undefined || baseValue === null) return;
        
        let val = baseValue * multiplier;
        
        if (['damage', 'defense', 'hp', 'range'].includes(key)) {
            val = Math.ceil(val);
        } else if (['critChance', 'critDamage', 'lifesteal', 'blockChance', 'thorns', 'regenHp', 'doubleAttack'].includes(key)) {
            val = parseFloat(val.toFixed(1));
        } else if (key === 'attackSpeed') {
            val = Math.round(baseValue / multiplier); 
            if (val < 100) val = 100;
            statsObj[key] = val;
            return;
        } else if (key === 'cdr') {
             val = parseFloat(val.toFixed(1));
        }

        if (statsObj[key]) statsObj[key] += val;
        else statsObj[key] = val;
    }

    getStatPool(recipe) {
        if (recipe.type === 'weapon') return [ 
            { key: 'damage', min: 1, max: 3 }, 
            { key: 'critChance', min: 1, max: 2 }, 
            { key: 'critDamage', min: 5, max: 10 }, 
            { key: 'lifesteal', min: 0.5, max: 1.5 },
            { key: 'attackSpeed', min: 20, max: 50 } 
        ];
        if (recipe.type === 'armor' || recipe.type === 'offhand') return [ 
            { key: 'hp', min: 10, max: 20 }, 
            { key: 'defense', min: 1, max: 2 }, 
            { key: 'thorns', min: 1, max: 3 }, 
            { key: 'regenHp', min: 0.5, max: 1.5 },
            { key: 'moveSpeed', min: 2, max: 5 }
        ];
        if (recipe.type === 'accessory') return [
            { key: 'critChance', min: 1, max: 2 },
            { key: 'damage', min: 1, max: 3 },
            { key: 'lifesteal', min: 0.5, max: 1 },
            { key: 'cdr', min: 1, max: 3 }
        ];
        if (recipe.type === 'tower_part') return [ 
            { key: 'damage', min: 2, max: 5 }, 
            { key: 'range', min: 10, max: 20 }, 
            { key: 'attackSpeed', min: 20, max: 50 }, 
            { key: 'doubleAttack', min: 2, max: 5 } 
        ];
        return [ { key: 'hp', min: 5, max: 10 } ];
    }

    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        if (item1.recipeId !== item2.recipeId) return { success: false, error: "Deben ser el mismo objeto" };
        
        const newItem = JSON.parse(JSON.stringify(item1));
        newItem.id = this.getUniqueId();
        newItem.enchant += 1; 

        const mult = 1.05;

        for (let key in newItem.stats) {
            if (key === 'attackSpeed') {
                newItem.stats[key] = Math.max(100, Math.round(newItem.stats[key] / mult));
            } else if (['critChance', 'critDamage', 'lifesteal', 'blockChance', 'thorns'].includes(key)) {
                newItem.stats[key] = parseFloat((newItem.stats[key] * mult).toFixed(1));
            } else {
                newItem.stats[key] = Math.ceil(newItem.stats[key] * mult);
            }
        }
        
        return { success: true, item: newItem };
    }

    // --- REFINAMIENTO CON DOBLE ITEM ESCALABLE ---
    refineMaterial(recipeId, rarityKey = 'common') {
        const recipe = REFINING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta inválida" };

        for (let mat in recipe.input) {
            const required = recipe.input[mat];
            const checkRarity = (mat === 'coal') ? 'common' : rarityKey;
            const available = gameState.materials[mat] ? (gameState.materials[mat][checkRarity] || 0) : 0;
            if (available < required) return { success: false, error: `Falta material` };
        }

        for (let mat in recipe.input) {
            const consumeRarity = (mat === 'coal') ? 'common' : rarityKey;
            gameState.materials[mat][consumeRarity] -= recipe.input[mat];
        }

        let outputRarity = rarityKey;
        const profKey = 'alchemy'; // Asegúrate de usar esta key consistente
        
        // Probabilidad de mejora de rareza (si aplica)
        // ... (Tu lógica de rareza existente) ...

        // --- LÓGICA DE DOBLE ITEM ---
        let amount = 1;
        let isDouble = false;
        const chance = this.getProfessionChance(profKey); // 0 a 0.5
        
        if (Math.random() < chance) {
            amount = 2;
            isDouble = true;
        }

        if (!gameState.materials[recipe.output]) {
            gameState.materials[recipe.output] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
        }
        gameState.materials[recipe.output][outputRarity] += amount;
        
        // XP de profesión
        this.gainProfessionXP(profKey, rarityKey);

        return { success: true, item: recipe.output, rarity: outputRarity, isDouble: isDouble };
    }

    getProfessionLevel(profKey) {
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }

    gainProfessionXP(profKey, rarityKey) {
        // Puede recibir rarityKey (string) o amount (number)
        let xp = 10;
        if (typeof rarityKey === 'string' && RARITY[rarityKey]) {
            xp = 10 * RARITY[rarityKey].mult;
        } else if (typeof rarityKey === 'number') {
            xp = rarityKey;
        }

        const prof = gameState.professions[profKey];
        if (prof) {
            prof.xp += Math.floor(xp);
            if (prof.xp >= prof.maxXp) { 
                prof.level++; 
                prof.xp -= prof.maxXp; 
                prof.maxXp = Math.floor(prof.maxXp * 1.5); 
                // Cap nivel 100
                if(prof.level > 100) prof.level = 100;
                
                EventBus.emit('profession-levelup', { key: profKey, level: prof.level });
            }
        }
    }

    gainHeroXP(amount) {
        if (!gameState.selectedClass) return;
        const hero = getCurrentHero();
        if (hero.level >= 100) { hero.xp = hero.maxXp; return; }
        hero.xp += Math.floor(amount);
        while (hero.xp >= hero.maxXp && hero.level < 100) {
            hero.xp -= hero.maxXp; hero.level++; hero.maxXp = Math.floor(hero.maxXp * 1.5);
            hero.statPoints += 3; 
            if (hero.level % 10 === 0) hero.talentPoints++;
            if (gameState.playerStats) gameState.playerStats.hp = gameState.playerStats.maxHp;
        }
    }

    spendStatPoint(stat) {
        const hero = getCurrentHero();
        if (hero.statPoints > 0) {
            hero.statPoints--;
            if (!hero.baseAttributes[stat]) hero.baseAttributes[stat] = 0;
            if (stat === 'damage') hero.baseAttributes.damage += 1;
            else if (stat === 'hp') hero.baseAttributes.maxHp += 10;
            else if (stat === 'speed') hero.baseAttributes.attackSpeed += 10; 
            else if (stat === 'defense') hero.baseAttributes.defense += 1;
            return true;
        }
        return false;
    }

    spendTalentPoint(talentId, cost) {
        const hero = getCurrentHero();
        if (hero.talentPoints >= cost && !hero.talents.includes(talentId)) {
            hero.talentPoints -= cost; hero.talents.push(talentId); return true;
        }
        return false;
    }

    getDropForLevel(biomeKey, levelId) {
        const biome = BIOMES[biomeKey];
        const config = LEVEL_CONFIG[levelId] || { dropRate: 0.5 };
        if (Math.random() > config.dropRate) return null;
        const tier = config.tier || 1;
        const possibleMats = biome.materials[tier] || biome.materials[1];
        const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
        
        let rarity = this.getDynamicRarity(levelId);
        if (matKey === 'coal') rarity = 'common';

        return { key: matKey, rarity: rarity, amount: 1 };
    }

    generateDailyQuests() {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const lastRefresh = gameState.quests.lastRefresh || 0;

        if (now - lastRefresh > ONE_DAY) {
            gameState.quests.active = [];
        }

        if (gameState.quests.active.length > 0) return;

        const templates = [
            { type: 'kill', target: 'any', count: 20, desc: "Mata 20 Enemigos", reward: { gold: 100, xp: 50 } },
            { type: 'craft', target: 'weapon', count: 1, desc: "Forja 1 Arma", reward: { gold: 150, material: 'wood' } },
            { type: 'collect', target: 'copper', count: 5, desc: "Consigue 5 Cobre", reward: { gold: 80, xp: 30 } },
            { type: 'boss', target: 'any', count: 1, desc: "Vence a un Jefe", reward: { gold: 300, material: 'iron' } }
        ];
        
        const rollSpecial = Math.random();
        if (rollSpecial < 0.20) { 
            const lockedRecipes = RECIPES.filter(r => r.isLocked && (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id)));
            if (lockedRecipes.length > 0) {
                const specialRecipe = lockedRecipes[Math.floor(Math.random() * lockedRecipes.length)];
                gameState.quests.active.push({
                    id: this.getUniqueId(),
                    type: 'kill', target: 'any', count: 50,
                    desc: `[RARA] Consigue planos de: ${specialRecipe.name}`,
                    progress: 0, completed: false, claimed: false,
                    reward: { recipe: specialRecipe.id, gold: 50 }
                });
                for(let i=0; i<2; i++) this.addRandomQuest(templates);
                
                gameState.quests.lastRefresh = now;
                SaveSystem.save();
                return;
            }
        }
        for(let i=0; i<3; i++) this.addRandomQuest(templates);
        
        gameState.quests.lastRefresh = now;
        SaveSystem.save();
    }

    addRandomQuest(templates) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        gameState.quests.active.push({ id: this.getUniqueId(), ...template, progress: 0, completed: false, claimed: false });
    }

    updateQuestProgress(type, target, amount = 1) {
        if (!gameState.quests || !gameState.quests.active) return;
        gameState.quests.active.forEach(quest => {
            if (!quest.completed && quest.type === type) {
                if (quest.target === 'any' || quest.target === target) {
                    quest.progress += amount;
                    if (quest.progress >= quest.count) { quest.progress = quest.count; quest.completed = true; }
                }
            }
        });
        if (Math.random() < 0.1) SaveSystem.save();
    }

    claimQuestReward(questId) {
        const quest = gameState.quests.active.find(q => q.id === questId);
        if (quest && quest.completed && !quest.claimed) {
            quest.claimed = true;
            if (quest.reward.gold) gameState.gold += quest.reward.gold;
            if (quest.reward.xp) this.gainHeroXP(quest.reward.xp);
            if (quest.reward.material) {
                if (!gameState.materials[quest.reward.material]) gameState.materials[quest.reward.material] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
                gameState.materials[quest.reward.material].common += 3;
            }
            if (quest.reward.recipe) {
                if (!gameState.unlockedRecipes) gameState.unlockedRecipes = [];
                if (!gameState.unlockedRecipes.includes(quest.reward.recipe)) gameState.unlockedRecipes.push(quest.reward.recipe);
            }
            gameState.quests.active = gameState.quests.active.filter(q => q.id !== questId);
            SaveSystem.save();
            return { success: true, reward: quest.reward };
        }
        return { success: false };
    }
}

export default new RPGSystem();