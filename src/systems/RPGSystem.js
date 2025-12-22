// src/systems/RPGSystem.js
import { gameState, RARITY, getCurrentHero } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';

class RPGSystem {
    
    // --- ID SIEMPRE COMO STRING ---
    getUniqueId() {
        return "ID_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    }

    gainHeroXP(amount) {
        if (!gameState.selectedClass) return;
        const hero = getCurrentHero();
        hero.xp += Math.floor(amount);
        while (hero.xp >= hero.maxXp) {
            hero.xp -= hero.maxXp;
            if (hero.level < 100) {
                hero.level++;
                hero.maxXp = Math.floor(hero.maxXp * 1.5);
                hero.statPoints += 3; 
                if (hero.level % 10 === 0) hero.talentPoints++;
                if (gameState.playerStats) gameState.playerStats.hp = gameState.playerStats.maxHp;
            } else { hero.xp = hero.maxXp; }
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

    getProfessionLevelForType(type) {
        let profKey = 'weaponsmith'; 
        if (type === 'armor' || type === 'offhand') profKey = 'armorsmith';
        if (type === 'accessory') profKey = 'jewelry';
        if (type === 'tower_part') profKey = 'engineering';
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }

    getProfessionLevel(profKey) {
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }

    applyEnchantStats(statsObj, levels) { 
        for (let i = 0; i < levels; i++) { 
            for (let key in statsObj) { 
                const current = statsObj[key]; 
                if (key === 'attackSpeed' || key === 'cdr') {
                     const boost = Math.floor(current * 0.10);
                     statsObj[key] = current - boost; 
                } else {
                     const boost = Math.ceil(current * 0.20) + 1; 
                     statsObj[key] = current + boost; 
                }
            } 
        } 
        return statsObj; 
    }
    
    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };
        
        const rarity = RARITY[rarityKey];
        if (!this.checkMaterials(recipe.mat, 3, rarityKey)) return { success: false, error: `Faltan materiales` };
        
        this.consumeMaterials(recipe.mat, 3, rarityKey);
        
        const profKey = recipe.prof || 'weaponsmith';
        const profLevel = this.getProfessionLevel(profKey);
        const bonusEnchant = Math.floor(profLevel / 10);
        
        const item = this.generateItem(recipe, rarity, bonusEnchant);
        
        this.gainProfessionXP(profKey, rarityKey);
        return { success: true, item: item };
    }

    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        if (item1.type !== item2.type) return { success: false, error: "Deben ser del mismo tipo" };
        if (item1.type === 'tower_part' && item1.towerType !== item2.towerType) return { success: false, error: "Deben ser para la misma torre" };
        
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

    generateItem(recipe, rarity, initialEnchant = 0) {
        const stats = { ...recipe.baseStats };
        for(let k in stats) stats[k] = Math.floor(stats[k] * rarity.mult);
        
        const pool = this.getStatPool(recipe);
        for (let i = 0; i < rarity.statCount; i++) {
            const stat = pool[Math.floor(Math.random() * pool.length)];
            const val = Math.floor((Math.random() * (stat.max - stat.min) + stat.min) * rarity.mult);
            
            if(stat.key === 'attackSpeed') {
                 if(stats[stat.key]) stats[stat.key] -= val; else stats[stat.key] = -val;
            } else {
                 if(stats[stat.key]) stats[stat.key] += val; else stats[stat.key] = val;
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
        if (recipe.type === 'weapon') return [ { key: 'damage', min: 2, max: 5, label: 'Daño' }, { key: 'critChance', min: 1, max: 3, label: '% Crítico' }, { key: 'critDamage', min: 5, max: 15, label: 'Daño Crítico' }, { key: 'lifesteal', min: 1, max: 2, label: 'Robo Vida' } ];
        if (recipe.type === 'armor') return [ { key: 'hp', min: 10, max: 30, label: 'Vida' }, { key: 'defense', min: 1, max: 3, label: 'Defensa' }, { key: 'thorns', min: 1, max: 3, label: 'Espinas' }, { key: 'regenHp', min: 1, max: 2, label: 'Regen HP' } ];
        if (recipe.type === 'tower_part') return [ { key: 'damage', min: 2, max: 5, label: 'Daño' }, { key: 'range', min: 10, max: 20, label: 'Rango' }, { key: 'attackSpeed', min: 20, max: 50, label: 'Velocidad' }, { key: 'doubleAttack', min: 2, max: 5, label: 'Doble Ataque' } ];
        return [ { key: 'attackSpeed', min: 10, max: 50, label: 'Vel. Ataque' }, { key: 'moveSpeed', min: 5, max: 15, label: 'Vel. Movimiento' }, { key: 'damage', min: 1, max: 3, label: 'Daño' } ];
    }

    gainProfessionXP(profKey, rarityKey) {
        let xp = 10 * RARITY[rarityKey].mult;
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        gameState.professions[profKey].xp += Math.floor(xp);
        if (gameState.professions[profKey].xp >= gameState.professions[profKey].maxXp) { gameState.professions[profKey].level++; gameState.professions[profKey].xp = 0; gameState.professions[profKey].maxXp = Math.floor(gameState.professions[profKey].maxXp * 1.5); }
    }
    checkMaterials(mat, amount, rarity) { return gameState.materials[mat] && gameState.materials[mat][rarity] >= amount; }
    consumeMaterials(mat, amount, rarity) { if (gameState.materials[mat]) gameState.materials[mat][rarity] -= amount; }
}

export default new RPGSystem();