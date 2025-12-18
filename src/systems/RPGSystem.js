// src/systems/RPGSystem.js
import { gameState, RARITY } from '../config/GameState.js';

export default class RPGSystem {
    
    // --- CRAFTEO CON REGLAS DE COLOR Y XP ---
    static craftItem(type, professionKey, materialType, targetRarity) {
        
        // Costo fijo: 3 materiales de la rareza elegida
        const materialCost = 3; 
        
        // 1. Verificar Materiales (Color exacto)
        const userMats = gameState.materials[materialType][targetRarity];
        
        if (userMats < materialCost) return { success: false, error: 'material' };

        // 2. Consumir Materiales
        gameState.materials[materialType][targetRarity] -= materialCost;

        // 3. Calcular Encantamiento (+0 a +10) según Nivel de Profesión
        const profData = gameState.professions[professionKey];
        const enchantLevel = this.calculateEnchantment(profData.level);

        // 4. Subir XP de Profesión
        this.gainProfessionXP(professionKey, targetRarity);

        // 5. Generar Objeto
        const newItem = this.generateItemObject(type, targetRarity, enchantLevel);
        return { success: true, item: newItem };
    }

    static calculateEnchantment(level) {
        const roll = Math.random() * 100;
        
        // Niveles bajos (1-20)
        if (level <= 20) {
            if (roll > 95) return 2; // Suerte
            if (roll > 80) return 1;
            return 0;
        }
        
        // Niveles medios (21-60)
        if (level <= 60) {
            if (roll > 90) return 5;
            if (roll > 70) return 3;
            if (roll > 40) return 2;
            return 1;
        }

        // Niveles altos (61-100)
        if (roll > 95) return 10; // ¡Maestro!
        if (roll > 85) return 8;
        if (roll > 60) return 6;
        return 3;
    }

    static generateItemObject(type, rarityKey, enchantLevel) {
        const rarity = RARITY[rarityKey];
        
        let baseStats = {};
        if (type === 'weapon') baseStats = { damage: 10 };
        if (type === 'armor') baseStats = { maxHp: 50 };
        if (type === 'accessory') baseStats = { attackSpeed: -50 };

        const finalStats = {};
        for (let key in baseStats) {
            let val = baseStats[key];
            val = val * rarity.mult; 
            val = val * (1 + (enchantLevel * 0.15)); // 15% bonus por nivel de enchant
            finalStats[key] = Math.floor(val);
        }

        return {
            uid: Date.now() + Math.random(),
            type: type,
            name: `${rarity.name} Item +${enchantLevel}`,
            rarity: rarityKey,
            enchant: enchantLevel,
            stats: finalStats,
            color: rarity.color
        };
    }

    static fuseItems(item1, item2) {
        if (item1.type !== item2.type || item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) {
            return null;
        }
        const newEnchant = item1.enchant + 1;
        if (newEnchant > 20) return null;
        return this.generateItemObject(item1.type, item1.rarity, newEnchant);
    }

    static openChest(quality) {
        const rewards = [];
        const quantity = quality * 3;
        for(let i=0; i<quantity; i++) {
            const roll = Math.random();
            let matRarity = 'common';
            if (quality >= 1 && roll > 0.9) matRarity = 'uncommon';
            if (quality >= 2 && roll > 0.7) matRarity = 'rare';
            if (quality >= 3 && roll > 0.85) matRarity = 'epic';

            const types = ['wood', 'cloth', 'copper'];
            const matType = types[Math.floor(Math.random() * types.length)];
            rewards.push({ type: matType, rarity: matRarity });
            gameState.materials[matType][matRarity]++;
        }
        return rewards;
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