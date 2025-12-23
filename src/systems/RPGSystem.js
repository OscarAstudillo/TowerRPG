// src/systems/RPGSystem.js
import { gameState, RARITY, getCurrentHero } from '../config/GameState.js';
import { RECIPES } from '../config/Recipes.js';
import { REFINING_RECIPES } from '../config/RefiningRecipes.js';
import { BIOMES, LEVEL_CONFIG } from '../config/Levels.js';
import { RAW_MATERIALS } from '../config/Materials.js'; // Importar si necesitas referencias

class RPGSystem {
    
    getUniqueId() {
        // ID string seguro para evitar problemas numéricos
        return "ITEM_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
    }

    // --- NUEVO: SISTEMA DE REFINACIÓN ---
    refineMaterial(recipeId) {
        const recipe = REFINING_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta inválida" };

        // Verificar Profesión
        const profLevel = this.getProfessionLevel('refining');
        
        // Verificar Materiales
        for (let mat in recipe.input) {
            const required = recipe.input[mat];
            const available = gameState.materials[mat]?.common || 0; // Usamos 'common' como base para raw
            if (available < required) return { success: false, error: `Falta material: ${mat}` };
        }

        // Consumir Materiales
        for (let mat in recipe.input) {
            gameState.materials[mat].common -= recipe.input[mat];
        }

        // Calcular Probabilidad de Rareza Superior (Max 15% al nivel 100)
        let outputRarity = 'common';
        const chance = Math.min(0.15, profLevel * 0.0015); // 0.15% por nivel hasta 15%
        
        if (Math.random() < chance) {
            outputRarity = 'uncommon'; // Sube a verde
            // Podrías añadir lógica para subir más si quieres
        }

        // Añadir Producto
        if (!gameState.materials[recipe.output]) gameState.materials[recipe.output] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
        gameState.materials[recipe.output][outputRarity]++;

        // Subir XP de Refinación
        this.gainProfessionXP('refining', 'common');

        return { success: true, item: recipe.output, rarity: outputRarity };
    }

    // --- DROP INTELIGENTE POR BIOMA Y NIVEL ---
    // --- NUEVO SISTEMA DE DROP POR TIER ---
    getDropForLevel(biomeKey, levelId) {
        const biome = BIOMES[biomeKey];
        const config = LEVEL_CONFIG[levelId];
        
        // 1. Roll de Drop General
        if (Math.random() > config.dropRate) return null;

        // 2. Elegir Material según TIER del nivel
        const tier = config.tier || 1;
        const possibleMaterials = biome.materials[tier] || biome.materials[1]; // Fallback a tier 1
        
        // Si la lista de materiales tiene cosas como 'wood', 'copper', etc.
        const matKey = possibleMaterials[Math.floor(Math.random() * possibleMaterials.length)];
        
        // 3. Decidir Rareza (Blanco, Verde, Azul...)
        const rand = Math.random() * 100;
        let rarity = 'common';
        let cumulative = 0;
        
        // Iterar las chances (common: 90, uncommon: 10...)
        for (let r in config.dropChances) {
            cumulative += config.dropChances[r];
            if (rand <= cumulative) {
                rarity = r;
                break;
            }
        }

        return { key: matKey, rarity: rarity, amount: 1 };
    }

    // --- BALANCEO DE STATS EN GENERACIÓN ---
    applyEnchantStats(statsObj, levels) { 
        for (let i = 0; i < levels; i++) { 
            for (let key in statsObj) { 
                const current = statsObj[key]; 
                
                // BALANCEO DE VELOCIDAD DE ATAQUE (DELAY)
                // Antes: current - 100 (Muy roto)
                // Ahora: Reducir un 3% por nivel de encantamiento
                if (key === 'attackSpeed' || key === 'cdr') {
                     // Ejemplo: 1000ms -> 970ms -> 940ms...
                     // Hard cap: nunca bajar de 200ms
                     let reduction = Math.floor(current * 0.03); 
                     if (reduction < 5) reduction = 5; // Mínimo 5ms de mejora
                     
                     statsObj[key] = Math.max(200, current - reduction); 
                } 
                // DAÑO Y DEFENSA
                else {
                     // Aumento lineal moderado: +10% o +1 plano, lo que sea mayor
                     const boost = Math.ceil(current * 0.10) + 1; 
                     statsObj[key] = current + boost; 
                }
            } 
        } 
        return statsObj; 
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

    getProfessionLevel(profKey) {
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        return gameState.professions[profKey].level;
    }

    applyEnchantStats(statsObj, levels) { 
        for (let i = 0; i < levels; i++) { 
            for (let key in statsObj) { 
                const current = statsObj[key]; 
                // Lógica inteligente: Si es cooldown o velocidad de ataque (ms), reducir es mejor
                if (key === 'attackSpeed' || key === 'cdr') {
                     // Reducir un 10% el delay es una mejora
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
    
    // --- CRAFTEO UNIVERSAL (Héroes y Torres) ---
    craftItem(recipeId, rarityKey) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: "Receta no encontrada" };
        
        const rarity = RARITY[rarityKey];
        if (!this.checkMaterials(recipe.mat, 3, rarityKey)) return { success: false, error: `Faltan materiales` };
        
        this.consumeMaterials(recipe.mat, 3, rarityKey);
        
        // Determinar profesión automáticamente desde la receta o el tipo
        let profKey = recipe.prof || 'weaponsmith';
        if (!recipe.prof) {
             if (recipe.type === 'tower_part') profKey = 'engineering';
        }

        const profLevel = this.getProfessionLevel(profKey);
        const bonusEnchant = Math.floor(profLevel / 10);
        
        const item = this.generateItem(recipe, rarity, bonusEnchant);
        
        this.gainProfessionXP(profKey, rarityKey);
        this.updateQuestProgress('craft', recipe.type, 1); // ej: craft weapon
        return { success: true, item: item };
    }

    fuseSpecificItems(item1, item2) {
        if (item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) return { success: false, error: "Deben ser misma rareza y nivel (+)" };
        if (item1.type !== item2.type) return { success: false, error: "Deben ser del mismo tipo" };
        if (item1.subType !== item2.subType) return { success: false, error: "Deben ser del mismo subtipo" };
        
        const baseStats = (Math.random() > 0.5) ? JSON.parse(JSON.stringify(item1.stats)) : JSON.parse(JSON.stringify(item2.stats));
        this.applyEnchantStats(baseStats, 1);
        
        const newItem = { 
            ...item1, 
            id: this.getUniqueId(), // ID Nuevo
            name: `${item1.name.split('+')[0].trim()} +${item1.enchant + 1}`, 
            enchant: item1.enchant + 1, 
            stats: baseStats 
        };
        
        return { success: true, item: newItem };
    }

    // --- GENERACIÓN UNIVERSAL ---
    // --- BALANCEO DE GENERACIÓN DE ITEMS (RNG) ---
    generateItem(recipe, rarity, initialEnchant = 0) {
        // 1. Copiar stats base
        const stats = { ...recipe.baseStats };
        
        // 2. Aplicar Multiplicador de Rareza a Stats Base
        // (Solo daño/defensa, no velocidad para no romperla de inicio)
        for(let k in stats) {
            if (k !== 'attackSpeed' && k !== 'cdr') {
                stats[k] = Math.floor(stats[k] * rarity.mult);
            }
        }
        
        // 3. Generar Stats Aleatorios (Affixes)
        const pool = this.getStatPool(recipe);
        for (let i = 0; i < rarity.statCount; i++) {
            const stat = pool[Math.floor(Math.random() * pool.length)];
            
            // Calculo valor aleatorio controlado
            // Ejemplo: Daño (1-3) * Multiplicador Rareza
            const rawVal = (Math.random() * (stat.max - stat.min) + stat.min);
            const val = Math.ceil(rawVal * rarity.mult); // Math.ceil para asegurar al menos 1
            
            if(stat.key === 'attackSpeed') {
                 // Si sale "Velocidad", restamos delay, PERO POCO.
                 // Ej: Rango 10-30ms. No 900ms.
                 if(stats[stat.key]) stats[stat.key] -= val; 
                 else stats[stat.key] = -val; // Valor negativo indica reducción de delay si es stat nuevo
            } else {
                 if(stats[stat.key]) stats[stat.key] += val; 
                 else stats[stat.key] = val;
            }
        }

        // 4. Aplicar Encantamiento (+1) si corresponde
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
        
        // Pool para torres
        if (recipe.type === 'tower_part') return [ { key: 'damage', min: 2, max: 5, label: 'Daño' }, { key: 'range', min: 10, max: 20, label: 'Rango' }, { key: 'attackSpeed', min: 20, max: 50, label: 'Velocidad' }, { key: 'doubleAttack', min: 2, max: 5, label: 'Doble Ataque' } ];
        
        return [ { key: 'attackSpeed', min: 10, max: 50, label: 'Vel. Ataque' }, { key: 'moveSpeed', min: 5, max: 15, label: 'Vel. Movimiento' }, { key: 'damage', min: 1, max: 3, label: 'Daño' } ];
    }

    // IMPORTANTE: Actualizar gainProfessionXP para soportar 'refining'
    gainProfessionXP(profKey, rarityKey) {
        let xp = 10 * (RARITY[rarityKey] ? RARITY[rarityKey].mult : 1);
        if (!gameState.professions[profKey]) gameState.professions[profKey] = { level: 1, xp: 0, maxXp: 100 };
        gameState.professions[profKey].xp += Math.floor(xp);
        if (gameState.professions[profKey].xp >= gameState.professions[profKey].maxXp) { 
            gameState.professions[profKey].level++; 
            gameState.professions[profKey].xp = 0; 
            gameState.professions[profKey].maxXp = Math.floor(gameState.professions[profKey].maxXp * 1.5); 
        }
    }

    // Actualizamos checkMaterials para buscar en materiales refinados también
    checkMaterials(mat, amount, rarity) { 
        // Verifica si existe el material en el inventario global de materiales
        return gameState.materials[mat] && gameState.materials[mat][rarity] >= amount; 
    }
    consumeMaterials(mat, amount, rarity) { if (gameState.materials[mat]) gameState.materials[mat][rarity] -= amount; }

    // --- NUEVO: SISTEMA DE DROP DE COFRE ESCALABLE ---
    getChestLoot(biomeKey, levelId) {
        const biome = BIOMES[biomeKey];
        if (!biome) return [];

        const lootList = [];
        
        // 1. Calcular CANTIDAD BASE según nivel (Nivel 1 = 3 items, Nivel 10 = ~12 items)
        const baseQty = 2 + levelId; 
        
        // 2. Determinar materiales disponibles por Tier del nivel
        const tier = LEVEL_CONFIG[levelId]?.tier || 1;
        
        // Obtenemos materiales del bioma para este Tier (y un poco del tier anterior para relleno)
        let possibleMats = biome.materials[tier] || biome.materials[1];
        if (tier > 1) {
            possibleMats = possibleMats.concat(biome.materials[tier - 1]);
        }

        // 3. Generar Drops
        for (let i = 0; i < baseQty; i++) {
            const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
            
            // Lógica de Rareza Escalable
            // Nivel 1: 95% Comun, 5% Verde
            // Nivel 10: 40% Comun, 30% Verde, 20% Azul...
            const rand = Math.random() * 100;
            let rarity = 'common';
            
            // Probabilidad base mejorada por nivel
            const chanceUncommon = 5 + (levelId * 4); // Lvl 1: 9%, Lvl 10: 45%
            const chanceRare = (levelId > 3) ? (levelId - 3) * 3 : 0; // Lvl 4: 3%, Lvl 10: 21%
            
            if (rand < chanceRare) rarity = 'rare';
            else if (rand < chanceUncommon + chanceRare) rarity = 'uncommon';
            
            // Añadir al inventario de materiales
            if (!gameState.materials[matKey]) gameState.materials[matKey] = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
            gameState.materials[matKey][rarity]++;
            
            lootList.push({ key: matKey, rarity: rarity, amount: 1 });
        }
        
        // Drop garantizado de rareza verde o superior en niveles altos (5+)
        if (levelId >= 5) {
            const matKey = possibleMats[Math.floor(Math.random() * possibleMats.length)];
            const bonusRarity = levelId >= 8 ? 'rare' : 'uncommon';
            gameState.materials[matKey][bonusRarity]++;
            lootList.push({ key: matKey, rarity: bonusRarity, amount: 1, bonus: true });
        }

        return lootList;
    }

    // --- NUEVO: SISTEMA DE MISIONES ---
    
    generateDailyQuests() {
        if (gameState.quests.active.length > 0) return;

        // Templates normales
        const templates = [
            { type: 'kill', target: 'any', count: 20, desc: "Mata 20 Enemigos", reward: { gold: 100, xp: 50 } },
            { type: 'craft', target: 'weapon', count: 1, desc: "Forja 1 Arma", reward: { gold: 150, material: 'wood' } },
            { type: 'collect', target: 'copper', count: 5, desc: "Consigue 5 Cobre", reward: { gold: 80, xp: 30 } },
            { type: 'boss', target: 'any', count: 1, desc: "Vence a un Jefe", reward: { gold: 300, material: 'iron' } }
        ];

        // 5% de probabilidad de misión con Receta Especial
        const rollSpecial = Math.random();
        if (rollSpecial < 0.05) { // 5% chance
            // Buscar una receta bloqueada que no tengamos
            const lockedRecipes = RECIPES.filter(r => r.isLocked && (!gameState.unlockedRecipes || !gameState.unlockedRecipes.includes(r.id)));
            
            if (lockedRecipes.length > 0) {
                const specialRecipe = lockedRecipes[Math.floor(Math.random() * lockedRecipes.length)];
                
                // Agregar Misión Especial al inicio
                gameState.quests.active.push({
                    id: this.getUniqueId(),
                    type: 'kill', // Misión difícil
                    target: 'any',
                    count: 50, // Matar muchos enemigos
                    desc: `[RARA] Consigue planos de: ${specialRecipe.name}`,
                    progress: 0,
                    completed: false,
                    claimed: false,
                    reward: { recipe: specialRecipe.id, gold: 50 } // Recompensa principal es la receta
                });
                
                // Rellenar con 2 normales
                for(let i=0; i<2; i++) {
                    this.addRandomQuest(templates);
                }
                return;
            }
        }

        // Si no sale especial, 3 normales
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
            
            // Recompensas
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