// src/config/Recipes.js
export const RECIPES = [
    // --- ARMAS ---
    { id: 'sword_iron', name: 'Espada de Hierro', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'copper', cost: 100, baseStats: { damage: 5, attackSpeed: 1000 }, twoHanded: false },
    { id: 'bow_wood', name: 'Arco de Caza', type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'wood', cost: 100, baseStats: { damage: 3, range: 150, attackSpeed: 800 }, twoHanded: true },
    { id: 'staff_magic', name: 'Bastón Arcano', type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'wood', cost: 100, baseStats: { damage: 8, attackSpeed: 1200 }, twoHanded: true },
    { id: 'dagger_thief', name: 'Daga de Asesino', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', mat: 'copper', cost: 100, baseStats: { damage: 4, attackSpeed: 500 }, twoHanded: false },
    { id: 'shield_iron', name: 'Escudo Pesado', type: 'offhand', subType: 'shield', prof: 'armorsmith', mat: 'copper', cost: 100, baseStats: { defense: 3, blockChance: 10 } },

    // --- ARMADURAS ---
    { id: 'plate_armor', name: 'Armadura de Placas', type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'copper', cost: 150, baseStats: { hp: 50, defense: 5 } },
    { id: 'leather_armor', name: 'Armadura de Cuero', type: 'armor', subType: 'leather', prof: 'armorsmith', mat: 'leather', cost: 150, baseStats: { hp: 30, moveSpeed: 10 } },
    { id: 'cloth_robe', name: 'Túnica de Tela', type: 'armor', subType: 'cloth', prof: 'armorsmith', mat: 'cloth', cost: 150, baseStats: { hp: 20, cdr: 5 } },

    // --- ACCESORIOS ---
    { id: 'ring_gold', name: 'Anillo de Poder', type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'copper', cost: 200, baseStats: { critChance: 2 } },

    // --- MEJORAS DE TORRE (ESTANDARIZADAS) ---
    // Nota: Usamos 'subType' para definir qué torre usa esto ('archer', 'cannon', 'mage')
    { id: 'mod_archer', name: 'Módulo de Arquero', type: 'tower_part', subType: 'archer', prof: 'engineering', mat: 'wood', cost: 300, baseStats: { range: 20, damage: 2 } },
    { id: 'mod_cannon', name: 'Módulo de Cañón', type: 'tower_part', subType: 'cannon', prof: 'engineering', mat: 'copper', cost: 300, baseStats: { damage: 10, aoe: 10 } },
    { id: 'mod_mage', name: 'Módulo Mágico', type: 'tower_part', subType: 'mage', prof: 'engineering', mat: 'cloth', cost: 300, baseStats: { attackSpeed: 50, damage: 1 } }
];