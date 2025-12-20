// src/systems/RPGSystem.js
import { gameState, RARITY, getCurrentHero } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

class RPGSystem {
    
    // --- SISTEMA DE EXPERIENCIA (POR HÉROE) ---
    gainHeroXP(amount) {
        if (!gameState.selectedClass) return;
        
        const hero = getCurrentHero();
        hero.xp += Math.floor(amount);
        
        while (hero.xp >= hero.maxXp) {
            hero.xp -= hero.maxXp;
            
            // Subir de nivel solo si es < 100
            if (hero.level < 100) {
                hero.level++;
                
                // Curva de dificultad XP
                hero.maxXp = Math.floor(hero.maxXp * 1.5);
                
                // 3 Puntos de Atributo por nivel
                hero.statPoints += 3; 

                // 1 Punto de Talento cada 10 niveles
                if (hero.level % 10 === 0) {
                    hero.talentPoints++;
                }

                // Curar al subir de nivel
                if (gameState.playerStats) gameState.playerStats.hp = gameState.playerStats.maxHp;
            } else {
                hero.xp = hero.maxXp; // Cap lvl 100
            }
        }
    }

    // --- GASTAR PUNTOS ---
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

    // --- (RESTO DE MÉTODOS DE CRAFTEO Y FUSIÓN - SIN CAMBIOS) ---
    // Solo copia los métodos getProfessionLevelForType, applyEnchantStats, 
    // craftItem, craftTowerPart, generateTowerItem, fuseSpecificItems, 
    // generateItem, getStatPool, gainProfessionXP, checkMaterials, consumeMaterials
    // tal cual estaban en la versión anterior. 
    // Por brevedad, asumo que los mantienes. Aquí dejo las dependencias:

    getProfessionLevelForType(type) {
        let profKey = 'weaponsmith'; 
        if (type === 'armor' || type === 'offhand') profKey = 'armorsmith';
        if (type === 'accessory') profKey = 'jewelry';
        if (type === 'tower_part') profKey = 'engineering';
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }
    applyEnchantStats(statsObj, levels) { for (let i = 0; i < levels; i++) { for (let key in statsObj) { const current = statsObj[key]; const boost = Math.ceil(current * 0.20) + 1; statsObj[key] = current + boost; } } return statsObj; }
    
    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };
        const rarity = RARITY[rarityKey];
        if (!this.checkMaterials(recipe.mat, 3, rarityKey)) return { success: false, error: `Faltan materiales` };
        this.consumeMaterials(recipe.mat, 3, rarityKey);
        const profLevel = this.getProfessionLevelForType(recipe.type);
        const bonusEnchant = Math.floor(profLevel / 10);
        const item = this.generateItem(recipe, rarity, bonusEnchant);
        this.gainProfessionXP(recipe.type, rarityKey);
        return { success: true, item: item };
    }

    craftTowerPart(towerType, rarityKey) {
        const costAmount = 10; const goldCost = 500;
        if (gameState.gold < goldCost) return { success: false, error: "Falta Oro ($500)" };
        if (!this.checkMaterials('wood', costAmount, rarityKey) || !this.checkMaterials('copper', costAmount, rarityKey) || !this.checkMaterials('leather', costAmount, rarityKey)) return { success: false, error: `Necesitas 10 Madera, 10 Cobre y 10 Cuero` };
        gameState.gold -= goldCost;
        this.consumeMaterials('wood', costAmount, rarityKey); this.consumeMaterials('copper', costAmount, rarityKey); this.consumeMaterials('leather', costAmount, rarityKey);
        const profLevel = this.getProfessionLevelForType('tower_part');
        const bonusEnchant = Math.floor(profLevel / 10);
        const item = this.generateTowerItem(towerType, RARITY[rarityKey], bonusEnchant);
        this.gainProfessionXP('tower_part', rarityKey);
        return { success: true, item: item };
    }

    generateTowerItem(towerType, rarity, initialEnchant = 0) {
        const stats = {};
        const possibleStats = [ { key: 'damage', min: 2, max: 5 }, { key: 'range', min: 10, max: 20 }, { key: 'attackSpeed', min: 50, max: 100 }, { key: 'doubleAttack', min: 5, max: 10 } ];
        const numStats = 1 + rarity.statCount; 
        for (let i = 0; i < numStats; i++) {
            const statDef = possibleStats[Math.floor(Math.random() * possibleStats.length)];
            const val = Math.floor(Math.random() * (statDef.max - statDef.min + 1)) + statDef.min;
            const finalVal = Math.floor(val * rarity.mult);
            if (stats[statDef.key]) stats[statDef.key] += finalVal; else stats[statDef.key] = finalVal;
        }
        if (initialEnchant > 0) this.applyEnchantStats(stats, initialEnchant);
        return { id: Date.now() + Math.random(), name: `Mejora ${towerType.toUpperCase()}`, type: 'tower_part', towerType: towerType, rarity: rarity.id, enchant: initialEnchant, stats: stats, color: rarity.color };
    }

    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        if (item1.type !== item2.type) return { success: false, error: "Deben ser del mismo tipo" };
        const baseStats = (Math.random() > 0.5) ? JSON.parse(JSON.stringify(item1.stats)) : JSON.parse(JSON.stringify(item2.stats));
        this.applyEnchantStats(baseStats, 1);
        const newItem = { ...item1, id: Date.now(), name: `${item1.name.split('+')[0].trim()} +${item1.enchant + 1}`, enchant: item1.enchant + 1, stats: baseStats };
        return { success: true, item: newItem };
    }

    generateItem(recipe, rarity, initialEnchant = 0) {
        const stats = { ...recipe.baseStats };
        for(let k in stats) stats[k] = Math.floor(stats[k] * rarity.mult);
        const pool = this.getStatPool(recipe);
        for (let i = 0; i < rarity.statCount; i++) {
            const stat = pool[Math.floor(Math.random() * pool.length)];
            const val = Math.floor((Math.random() * (stat.max - stat.min) + stat.min) * rarity.mult);
            if(stats[stat.key]) stats[stat.key] += val; else stats[stat.key] = val;
        }
        if (initialEnchant > 0) this.applyEnchantStats(stats, initialEnchant);
        return { id: Date.now() + Math.random(), recipeId: recipe.id, name: `${recipe.name}`, type: recipe.type, subType: recipe.subType, twoHanded: recipe.twoHanded || false, rarity: rarity.id, enchant: initialEnchant, stats: stats, color: rarity.color };
    }

    getStatPool(recipe) {
        if (recipe.type === 'weapon') return [ { key: 'damage', min: 2, max: 5, label: 'Daño' }, { key: 'critChance', min: 1, max: 3, label: '% Crítico' }, { key: 'critDamage', min: 5, max: 15, label: 'Daño Crítico' }, { key: 'lifesteal', min: 1, max: 2, label: 'Robo Vida' } ];
        if (recipe.type === 'armor') return [ { key: 'hp', min: 10, max: 30, label: 'Vida' }, { key: 'defense', min: 1, max: 3, label: 'Defensa' }, { key: 'thorns', min: 1, max: 3, label: 'Espinas' }, { key: 'regenHp', min: 1, max: 2, label: 'Regen HP' } ];
        return [ { key: 'attackSpeed', min: 10, max: 50, label: 'Vel. Ataque (ms)' }, { key: 'moveSpeed', min: 5, max: 15, label: 'Vel. Movimiento' }, { key: 'cdr', min: 1, max: 5, label: 'CDR %' }, { key: 'damage', min: 1, max: 3, label: 'Daño' } ];
    }

    gainProfessionXP(type, rarityKey) {
        let xp = 10 * RARITY[rarityKey].mult;
        let prof = 'weaponsmith';
        if (type === 'armor' || type === 'offhand') prof = 'armorsmith';
        if (type === 'accessory') prof = 'jewelry';
        if (type === 'tower_part') prof = 'engineering';
        if (!gameState.professions[prof]) gameState.professions[prof] = { level: 1, xp: 0, maxXp: 100 };
        gameState.professions[prof].xp += Math.floor(xp);
        if (gameState.professions[prof].xp >= gameState.professions[prof].maxXp) { gameState.professions[prof].level++; gameState.professions[prof].xp = 0; gameState.professions[prof].maxXp = Math.floor(gameState.professions[prof].maxXp * 1.5); }
    }
    checkMaterials(mat, amount, rarity) { return gameState.materials[mat] && gameState.materials[mat][rarity] >= amount; }
    consumeMaterials(mat, amount, rarity) { if (gameState.materials[mat]) gameState.materials[mat][rarity] -= amount; }
}

export default new RPGSystem();