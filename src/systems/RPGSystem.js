import { gameState, RARITY, getCurrentHero, updatePlayerStats } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { RAW_MATERIALS, REFINED_MATERIALS } from '../config/Materials.js';
import { GAME_CONSTANTS } from '../config/GameConstants.js'; // Importamos constantes
import SaveSystem from './SaveSystem.js';

class RPGSystem {
    
    getUniqueId() {
        return "ITEM_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    }

    // --- RAREZA DINÁMICA (Tu lógica original) ---
    getDynamicRarity(level) {
        const lvl = Math.max(1, Math.min(level, 10));
        const p1 =  { common: 95, uncommon: 5, rare: 0, epic: 0, legendary: 0 };
        const p10 = { common: 35, uncommon: 20, rare: 15, epic: 12, legendary: 18 }; 
        
        const t = (lvl - 1) / 9; 
        const getChance = (key) => Math.floor(p1[key] + (p10[key] - p1[key]) * t);
        
        const chances = {
            common: getChance('common'),
            uncommon: getChance('uncommon'),
            rare: getChance('rare'),
            epic: getChance('epic'),
            legendary: getChance('legendary')
        };

        const roll = Math.random() * 100;
        let cumulative = 0;

        cumulative += chances.common;
        if (roll < cumulative) return 'common';
        cumulative += chances.uncommon;
        if (roll < cumulative) return 'uncommon';
        cumulative += chances.rare;
        if (roll < cumulative) return 'rare';
        cumulative += chances.epic;
        if (roll < cumulative) return 'epic';
        
        return 'legendary'; 
    }

    // --- CRAFTEO (FORJA) - LÓGICA CORREGIDA PARA CANTIDAD ---
    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };
        
        const rarity = RARITY[rarityKey];
        // Calcular costo
        const costMult = (GAME_CONSTANTS && GAME_CONSTANTS.CRAFTING) ? GAME_CONSTANTS.CRAFTING.GOLD_COST_MULTIPLIER : 1;
        const goldCost = Math.floor(recipe.cost * rarity.mult * costMult);
        
        // CORRECCIÓN: Usar qty de la receta o 3 por defecto
        const matReq = recipe.qty || 3;

        if (gameState.gold < goldCost) return { success: false, error: "Falta Oro" };

        // Verificar Materiales con la cantidad correcta
        if (!this.checkMaterials(recipe.mat, matReq, rarityKey)) {
            return { success: false, error: `Faltan materiales (${matReq})` };
        }
        
        // Consumir Recursos (Solo aquí)
        gameState.gold -= goldCost;
        this.consumeMaterials(recipe.mat, matReq, rarityKey);
        
        // Generar Item
        let profKey = recipe.prof || 'weaponsmith';
        if (!recipe.prof && recipe.type === 'tower_part') profKey = 'engineering';

        const profLevel = this.getProfessionLevel(profKey);
        const bonusEnchant = Math.floor(profLevel / 10);
        
        const item = this.generateItem(recipe, rarity, bonusEnchant);
        
        this.gainProfessionXP(profKey, rarityKey);
        this.updateQuestProgress('craft', recipe.type, 1);
        
        return { success: true, item: item };
    }

    // --- REFINACIÓN ---
    refineMaterial(recipeId) {
        // Nota: RefiningPanel ahora maneja la lógica de colores, este es el fallback
        const recipe = REFINING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta inválida" };

        const profLevel = this.getProfessionLevel('refining');
        
        for (let mat in recipe.input) {
            const required = recipe.input[mat];
            const available = gameState.materials[mat]?.common || 0;
            if (available < required) return { success: false, error: `Falta material: ${mat}` };
        }

        for (let mat in recipe.input) {
            gameState.materials[mat].common -= recipe.input[mat];
        }

        let outputRarity = 'common';
        const chance = Math.min(0.15, profLevel * 0.0015);
        if (Math.random() < chance) {
            outputRarity = 'uncommon'; 
        }

        if (!gameState.materials[recipe.output]) gameState.materials[recipe.output] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
        gameState.materials[recipe.output][outputRarity]++;

        this.gainProfessionXP('refining', 'common');

        return { success: true, item: recipe.output, rarity: outputRarity };
    }

    // --- MÉTODOS DE MATERIALES (Restaurados) ---
    checkMaterials(mat, amount, rarity) { 
        return gameState.materials[mat] && (gameState.materials[mat][rarity] || 0) >= amount; 
    }
    
    consumeMaterials(mat, amount, rarity) { 
        if (gameState.materials[mat]) gameState.materials[mat][rarity] -= amount; 
    }

    // --- DROP Y COFRES ---
    getChestLoot(biomeKey, levelId) {
        const biome = BIOMES[biomeKey];
        if (!biome) return [];

        const lootList = [];
        const baseQty = 2 + levelId; 
        const tier = LEVEL_CONFIG[levelId]?.tier || 1;
        
        let possibleMats = biome.materials[tier] || biome.materials[1];
        if (tier > 1) {
            possibleMats = possibleMats.concat(biome.materials[tier - 1]);
        }

        for (let i = 0; i < baseQty; i++) {
            const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
            const rarity = this.getDynamicRarity(levelId);
            
            if (!gameState.materials[matKey]) gameState.materials[matKey] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
            gameState.materials[matKey][rarity]++;
            
            lootList.push({ key: matKey, rarity: rarity, amount: 1 });
        }
        
        if (levelId >= 5) {
            const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
            const bonusRarity = this.getDynamicRarity(levelId + 2); 
            gameState.materials[matKey][bonusRarity]++;
            lootList.push({ key: matKey, rarity: bonusRarity, amount: 1, bonus: true });
        }

        return lootList;
    }

    getDropForLevel(biomeKey, levelId) {
        const biome = BIOMES[biomeKey];
        const config = LEVEL_CONFIG[levelId];
        
        if (Math.random() > config.dropRate) return null;

        const tier = config.tier || 1;
        const possibleMaterials = biome.materials[tier] || biome.materials[1];
        const matKey = possibleMaterials[Math.floor(Math.random() * possibleMaterials.length)];
        
        const rarity = this.getDynamicRarity(levelId);

        return { key: matKey, rarity: rarity, amount: 1 };
    }

    // --- GENERACIÓN DE ITEMS ---
    generateItem(recipe, rarity, initialEnchant = 0) {
        const stats = { ...recipe.baseStats };
        
        for(let k in stats) {
            if (k !== 'attackSpeed' && k !== 'cdr') {
                stats[k] = Math.floor(stats[k] * rarity.mult);
            }
        }
        
        const pool = this.getStatPool(recipe);
        for (let i = 0; i < rarity.statCount; i++) {
            const stat = pool[Math.floor(Math.random() * pool.length)];
            const rawVal = (Math.random() * (stat.max - stat.min) + stat.min);
            const val = Math.ceil(rawVal * rarity.mult);
            
            if(stat.key === 'attackSpeed') {
                 if(stats[stat.key]) stats[stat.key] -= val; 
                 else stats[stat.key] = -val;
            } else {
                 if(stats[stat.key]) stats[stat.key] += val; 
                 else stats[stat.key] = val;
            }
        }

        if (initialEnchant > 0) this.applyEnchantStats(stats, initialEnchant);
        
        return { 
            id: this.getUniqueId(),
            recipeId: recipe.id, 
            name: `${recipe.name}`, 
            type: recipe.type, 
            subType: recipe.subType, 
            towerType: (recipe.type === 'tower_part' ? recipe.subType : null),
            twoHanded: recipe.twoHanded || false, 
            rarity: rarity.id, 
            enchant: initialEnchant, 
            stats: stats, 
            color: rarity.color 
        };
    }

    getStatPool(recipe) {
        if (recipe.type === 'weapon') return [ { key: 'damage', min: 2, max: 5 }, { key: 'critChance', min: 1, max: 3 }, { key: 'critDamage', min: 5, max: 15 }, { key: 'lifesteal', min: 1, max: 2 } ];
        if (recipe.type === 'armor') return [ { key: 'hp', min: 10, max: 30 }, { key: 'defense', min: 1, max: 3 }, { key: 'thorns', min: 1, max: 3 }, { key: 'regenHp', min: 1, max: 2 } ];
        if (recipe.type === 'tower_part') return [ { key: 'damage', min: 2, max: 5 }, { key: 'range', min: 10, max: 20 }, { key: 'attackSpeed', min: 20, max: 50 }, { key: 'doubleAttack', min: 2, max: 5 } ];
        return [ { key: 'attackSpeed', min: 10, max: 50 }, { key: 'moveSpeed', min: 5, max: 15 }, { key: 'damage', min: 1, max: 3 } ];
    }

    applyEnchantStats(statsObj, levels) { 
        for (let i = 0; i < levels; i++) { 
            for (let key in statsObj) { 
                const current = statsObj[key]; 
                if (key === 'attackSpeed' || key === 'cdr') {
                      let reduction = Math.floor(current * 0.03); 
                      if (reduction < 5) reduction = 5; 
                      statsObj[key] = Math.max(200, current - reduction); 
                } else {
                      const boost = Math.ceil(current * 0.10) + 1; 
                      statsObj[key] = current + boost; 
                }
            } 
        } 
        return statsObj; 
    }

    // --- FUSIÓN ---
    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        if (item1.type !== item2.type) return { success: false, error: "Deben ser del mismo tipo" };
        if (item1.subType !== item2.subType) return { success: false, error: "Deben ser del mismo subtipo" };
        
        const baseStats = (Math.random() > 0.5) ? JSON.parse(JSON.stringify(item1.stats)) : JSON.parse(JSON.stringify(item2.stats));
        this.applyEnchantStats(baseStats, 1);
        
        const newItem = { 
            ...item1, 
            id: this.getUniqueId(),
            name: `${item1.name.split('+')[0].trim()} +${item1.enchant + 1}`, 
            enchant: item1.enchant + 1, 
            stats: baseStats 
        };
        
        return { success: true, item: newItem };
    }

    // --- PROFESIONES Y XP ---
    getProfessionLevel(profKey) {
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }

    gainProfessionXP(profKey, rarityKey) {
        let xp = 10 * (RARITY[rarityKey] ? RARITY[rarityKey].mult : 1);
        const prof = gameState.professions[profKey];
        if (prof) {
            prof.xp += Math.floor(xp);
            if (prof.xp >= prof.maxXp) { 
                prof.level++; 
                prof.xp = 0; 
                prof.maxXp = Math.floor(prof.maxXp * 1.5); 
            }
        }
    }

    gainHeroXP(amount) {
        if (!gameState.selectedClass) return;
        
        const hero = getCurrentHero();
        const MAX_LEVEL = 100;

        if (hero.level >= MAX_LEVEL) {
            hero.xp = hero.maxXp;
            return;
        }

        hero.xp += Math.floor(amount);
        
        while (hero.xp >= hero.maxXp && hero.level < MAX_LEVEL) {
            hero.xp -= hero.maxXp;
            hero.level++;
            hero.maxXp = Math.floor(hero.maxXp * 1.5);
            hero.statPoints += 3; 
            if (hero.level % 10 === 0) hero.talentPoints++;
            if (gameState.playerStats) gameState.playerStats.hp = gameState.playerStats.maxHp;
        }

        if (hero.level >= MAX_LEVEL) {
            hero.xp = hero.maxXp;
        }
    }

    spendStatPoint(stat) {
        const hero = getCurrentHero();
        if (hero.statPoints > 0) {
            hero.statPoints--;
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
        if (hero.talentPoints >= cost) {
            hero.talentPoints -= cost;
            hero.talents.push(talentId);
            return true;
        }
        return false;
    }

    // --- MISIONES (Restaurado AddRandomQuest) ---
    generateDailyQuests() {
        if (gameState.quests.active.length > 0) return;

        const templates = [
            { type: 'kill', target: 'any', count: 20, desc: "Mata 20 Enemigos", reward: { gold: 100, xp: 50 } },
            { type: 'craft', target: 'weapon', count: 1, desc: "Forja 1 Arma", reward: { gold: 150, material: 'wood' } },
            { type: 'collect', target: 'copper', count: 5, desc: "Consigue 5 Cobre", reward: { gold: 80, xp: 30 } },
            { type: 'boss', target: 'any', count: 1, desc: "Vence a un Jefe", reward: { gold: 300, material: 'iron' } }
        ];

        const rollSpecial = Math.random();
        if (rollSpecial < 0.05) { 
            const lockedRecipes = RECIPES.filter(r => r.isLocked && (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id)));
            
            if (lockedRecipes.length > 0) {
                const specialRecipe = lockedRecipes[Math.floor(Math.random() * lockedRecipes.length)];
                
                gameState.quests.active.push({
                    id: this.getUniqueId(),
                    type: 'kill',
                    target: 'any',
                    count: 50,
                    desc: `[RARA] Consigue planos de: ${specialRecipe.name}`,
                    progress: 0,
                    completed: false,
                    claimed: false,
                    reward: { recipe: specialRecipe.id, gold: 50 }
                });
                
                for(let i=0; i<2; i++) {
                    this.addRandomQuest(templates);
                }
                return;
            }
        }

        for(let i=0; i<3; i++) {
            this.addRandomQuest(templates);
        }
    }

    addRandomQuest(templates) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        gameState.quests.active.push({
            id: this.getUniqueId(),
            ...template,
            progress: 0,
            completed: false,
            claimed: false
        });
    }

    updateQuestProgress(type, target, amount = 1) {
        if (!gameState.quests || !gameState.quests.active) return;
        gameState.quests.active.forEach(quest => {
            if (!quest.completed && quest.type === type) {
                if (quest.target === 'any' || quest.target === target) {
                    quest.progress += amount;
                    if (quest.progress >= quest.count) {
                        quest.progress = quest.count;
                        quest.completed = true;
                    }
                }
            }
        });
    }

    claimQuestReward(questId) {
        const quest = gameState.quests.active.find(q => q.id === questId);
        if (quest && quest.completed && !quest.claimed) {
            quest.claimed = true;
            
            if (quest.reward.gold) gameState.gold += quest.reward.gold;
            if (quest.reward.xp) this.gainHeroXP(quest.reward.xp);
            if (quest.reward.material) {
                if (!gameState.materials[quest.reward.material]) gameState.materials[quest.reward.material] = { common: 0 };
                gameState.materials[quest.reward.material].common += 3;
            }
            if (quest.reward.recipe) {
                if (!gameState.unlockedRecipes) gameState.unlockedRecipes = [];
                if (!gameState.unlockedRecipes.includes(quest.reward.recipe)) {
                    gameState.unlockedRecipes.push(quest.reward.recipe);
                }
            }
            
            gameState.quests.active = gameState.quests.active.filter(q => q.id !== questId);
            return { success: true, reward: quest.reward };
        }
        return { success: false };
    }
}

export default new RPGSystem();