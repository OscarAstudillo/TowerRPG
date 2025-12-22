// src/config/Recipes.js

// TIERS:
// Tier 0: Inicial (Madera cruda / Básico)
// Tier 1: Cobre / Madera Refinada
// Tier 2: Hierro / Cedro
// Tier 3: Acero / Ébano

export const RECIPES = [
    // --- TIER 0 (Iniciales - Madera/Básico) ---
    { id: 'sword_wood', name: 'Espada de Entrenamiento', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'plank_wood', cost: 50, tier: 0, baseStats: { damage: 3, attackSpeed: 1000 } },
    { id: 'bow_training', name: 'Arco Simple', type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'plank_wood', cost: 50, tier: 0, twoHanded: true, baseStats: { damage: 2, range: 120, attackSpeed: 900 } },
    { id: 'staff_wood', name: 'Vara de Madera', type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'plank_wood', cost: 50, tier: 0, twoHanded: true, baseStats: { damage: 4, attackSpeed: 1100 } },
    
    // --- TIER 1 (Cobre / Tela Simple / Cuero Simple) ---
    { id: 'sword_copper', name: 'Espada de Cobre', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_copper', cost: 150, tier: 1, baseStats: { damage: 8, attackSpeed: 1000 } },
    { id: 'dagger_copper', name: 'Daga de Cobre', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', mat: 'ingot_copper', cost: 120, tier: 1, baseStats: { damage: 5, attackSpeed: 600 } },
    { id: 'armor_copper', name: 'Peto de Cobre', type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'ingot_copper', cost: 200, tier: 1, baseStats: { hp: 40, defense: 4 } },
    { id: 'robe_simple', name: 'Túnica de Lino', type: 'armor', subType: 'cloth', prof: 'armorsmith', mat: 'cloth_simple', cost: 150, tier: 1, baseStats: { hp: 20, cdr: 3 } },
    
    // --- TIER 2 (Hierro / Cedro / Cuero Rígido) ---
    { id: 'sword_iron', name: 'Espada de Hierro', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_iron', cost: 400, tier: 2, baseStats: { damage: 15, attackSpeed: 950 } },
    { id: 'bow_cedar', name: 'Arco de Cedro', type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'plank_cedar', cost: 400, tier: 2, twoHanded: true, baseStats: { damage: 10, range: 180, attackSpeed: 750 } },
    { id: 'shield_iron', name: 'Escudo de Hierro', type: 'offhand', subType: 'shield', prof: 'armorsmith', mat: 'ingot_iron', cost: 350, tier: 2, baseStats: { defense: 8, blockChance: 15 } },

    // --- TIER 3 (Acero / Ébano / Seda) ---
    { id: 'sword_steel', name: 'Espada de Acero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_steel', cost: 800, tier: 3, baseStats: { damage: 25, attackSpeed: 900, critChance: 5 } },
    { id: 'staff_ebony', name: 'Bastón de Ébano', type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'plank_ebony', cost: 800, tier: 3, twoHanded: true, baseStats: { damage: 30, attackSpeed: 1100 } },
    { id: 'armor_steel', name: 'Placas de Acero', type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'ingot_steel', cost: 1000, tier: 3, baseStats: { hp: 150, defense: 15 } },

    // --- MEJORAS DE TORRE (Tier 1 a 3) ---
    { id: 'mod_archer_1', name: 'Cuerda Reforzada', type: 'tower_part', subType: 'archer', prof: 'engineering', mat: 'cloth_simple', cost: 300, tier: 1, baseStats: { range: 15, damage: 3 } },
    { id: 'mod_cannon_1', name: 'Cañón de Cobre', type: 'tower_part', subType: 'cannon', prof: 'engineering', mat: 'ingot_copper', cost: 300, tier: 1, baseStats: { damage: 12, aoe: 5 } },
    { id: 'mod_mage_2', name: 'Cristal de Cedro', type: 'tower_part', subType: 'mage', prof: 'engineering', mat: 'plank_cedar', cost: 600, tier: 2, baseStats: { attackSpeed: 60, damage: 5 } }
];