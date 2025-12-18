// src/systems/RPGSystem.js
import Phaser from 'phaser';
import { gameState, RARITY } from '../config/GameState.js';

export default class RPGSystem {
    
    // --- 1. SISTEMA DE CRAFTEO (RNG según Profesión) ---
    // --- 1. SISTEMA DE CRAFTEO (COSTO MATERIALES + ORO) ---
    static craftItem(type, professionKey, materialType, materialCost) {
        // 1. Verificar Materiales
        // Para simplificar, usamos materiales de rareza "common" para craftear,
        // pero el resultado puede salir raro según tu profesión.
        const userMats = gameState.materials[materialType].common;
        
        if (userMats < materialCost) return null; // No alcanza

        // 2. Consumir Materiales
        gameState.materials[materialType].common -= materialCost;

        // 3. Lógica de Profesión (RNG)
        const profLevel = gameState.professions[professionKey];
        
        let chance = { common: 80, uncommon: 20, rare: 0, epic: 0, legendary: 0 };
        if (profLevel > 20) { chance.common = 60; chance.uncommon = 30; chance.rare = 10; }
        if (profLevel > 50) { chance.common = 40; chance.uncommon = 40; chance.rare = 15; chance.epic = 5; }
        if (profLevel > 90) { chance.common = 10; chance.uncommon = 40; chance.rare = 30; chance.epic = 15; chance.legendary = 5; }

        const roll = Math.random() * 100;
        let selectedRarity = 'common';
        let cumulative = 0;

        if (roll < (cumulative += chance.common)) selectedRarity = 'common';
        else if (roll < (cumulative += chance.uncommon)) selectedRarity = 'uncommon';
        else if (roll < (cumulative += chance.rare)) selectedRarity = 'rare';
        else if (roll < (cumulative += chance.epic)) selectedRarity = 'epic';
        else selectedRarity = 'legendary';

        let enchantLevel = 0;
        if (Math.random() < (profLevel / 200)) enchantLevel = 1; 

        this.gainProfessionXP(professionKey, selectedRarity);

        return this.generateItemObject(type, selectedRarity, enchantLevel);
    }

    // --- 2. GENERADOR DE OBJETOS ---
    static generateItemObject(type, rarityKey, enchantLevel) {
        const rarity = RARITY[rarityKey];
        
        // Stats base (Ejemplo simplificado)
        let baseStats = {};
        if (type === 'weapon') baseStats = { damage: 10 };
        if (type === 'armor') baseStats = { maxHp: 50 };
        if (type === 'accessory') baseStats = { attackSpeed: -50 };

        // Aplicar Multiplicadores: (Base * Rareza) + (Bono * Encantamiento)
        const finalStats = {};
        for (let key in baseStats) {
            let val = baseStats[key];
            val = val * rarity.mult; // Multiplicador de color
            val = val * (1 + (enchantLevel * 0.1)); // +10% por cada nivel de encantamiento
            finalStats[key] = Math.floor(val);
        }

        return {
            uid: Date.now() + Math.random(), // ID único
            type: type,
            name: `${rarity.name} Item +${enchantLevel}`,
            rarity: rarityKey,
            enchant: enchantLevel,
            stats: finalStats,
            color: rarity.color
        };
    }

    // --- 3. SISTEMA DE FUSIÓN (+1, +2...) ---
    static fuseItems(item1, item2) {
        // Regla: Deben ser iguales y del mismo nivel de encantamiento
        if (item1.type !== item2.type || item1.rarity !== item2.rarity || item1.enchant !== item2.enchant) {
            return null; // No se pueden fusionar
        }

        const newEnchant = item1.enchant + 1;
        if (newEnchant > 20) return null; // Tope máximo

        // Creamos el nuevo item mejorado
        return this.generateItemObject(item1.type, item1.rarity, newEnchant);
    }

    // --- 4. COFRES Y MATERIALES ---
    static openChest(quality) {
        // quality: 1 (Básico), 2 (Raro), 3 (Legendario)
        // Consume Oro y devuelve materiales
        // Esto lo usaremos en la escena del Menú
        const rewards = [];
        const quantity = quality * 3; // Más calidad, más items

        for(let i=0; i<quantity; i++) {
            const roll = Math.random();
            let matRarity = 'common';
            
            if (quality === 1) { // Cofre Básico
                if (roll > 0.9) matRarity = 'uncommon';
            } else if (quality === 3) { // Cofre Caro
                if (roll > 0.5) matRarity = 'rare';
                if (roll > 0.8) matRarity = 'epic';
            }

            // Tipo aleatorio
            const types = ['wood', 'cloth', 'copper'];
            const matType = types[Math.floor(Math.random() * types.length)];
            
            rewards.push({ type: matType, rarity: matRarity });
            
            // Guardar en GameState
            gameState.materials[matType][matRarity]++;
        }
        return rewards;
    }

    static gainProfessionXP(profKey, rarityCreated) {
        // XP basada en rareza
        let xp = 1;
        if (rarityCreated === 'rare') xp = 5;
        if (rarityCreated === 'legendary') xp = 20;

        gameState.professions[profKey] += (xp * 0.1); // Sube lento
        // Cap a nivel 100
        if (gameState.professions[profKey] > 100) gameState.professions[profKey] = 100;
    }
}