// src/config/Recipes.js

export const RECIPES = [
    // ============================================================
    // TIER 0: INICIALES (Madera / Básico)
    // ============================================================
    
    // --- ARMAS (Coste bajo) ---
    { id: 'sword_wood', name: 'Espada de Entrenamiento', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'plank_wood', qty: 3, cost: 50, tier: 0, baseStats: { damage: 3, attackSpeed: 1200 } },
    { id: 'bow_training', name: 'Arco Simple', type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'plank_wood', qty: 3, cost: 50, tier: 0, twoHanded: true, baseStats: { damage: 20, range: 120, attackSpeed: 1100 } },
    { id: 'staff_wood', name: 'Vara de Madera', type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'plank_wood', qty: 3, cost: 50, tier: 0, twoHanded: true, baseStats: { damage: 4, attackSpeed: 1100 } },
    
    // --- ARMADURAS (Coste medio) ---
    { id: 'armor_wood', name: 'Escudo de Leña', type: 'offhand', subType: 'shield', prof: 'armorsmith', mat: 'plank_wood', qty: 4, cost: 40, tier: 0, baseStats: { defense: 2, blockChance: 5 } },


    // ============================================================
    // TIER 1: COBRE / TELA SIMPLE / CUERO SIMPLE
    // ============================================================

    // --- ARMAS ---
    { id: 'sword_copper', name: 'Espada de Cobre', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_copper', qty: 3, cost: 150, tier: 1, baseStats: { damage: 8, attackSpeed: 1100 } },
    { id: 'dagger_copper', name: 'Daga de Cobre', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', mat: 'ingot_copper', qty: 2, cost: 120, tier: 1, baseStats: { damage: 5, attackSpeed: 800 } },

    // --- ARMADURAS ---
    { id: 'armor_copper', name: 'Peto de Cobre', type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'ingot_copper', qty: 5, cost: 200, tier: 1, baseStats: { hp: 40, defense: 4 } },
    { id: 'robe_simple', name: 'Túnica de Lino', type: 'armor', subType: 'cloth', prof: 'armorsmith', mat: 'cloth_simple', qty: 5, cost: 150, tier: 1, baseStats: { hp: 20, cdr: 3 } },
    { id: 'vest_simple', name: 'Chaleco de Cuero', type: 'armor', subType: 'leather', prof: 'armorsmith', mat: 'leather_simple', qty: 5, cost: 180, tier: 1, baseStats: { hp: 30, moveSpeed: 10 } },

    // --- ACCESORIOS (Menos material) ---
    { id: 'ring_copper', name: 'Anillo de Cobre', type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'ingot_copper', qty: 2, cost: 200, tier: 1, baseStats: { damage: 1 } },

    // --- MEJORAS DE TORRE ---
    { id: 'mod_archer_1', name: 'Cuerda Reforzada', type: 'tower_part', subType: 'archer', prof: 'engineering', mat: 'cloth_simple', qty: 2, cost: 300, tier: 1, baseStats: { range: 15, damage: 3 } },
    { id: 'mod_cannon_1', name: 'Cañón de Cobre', type: 'tower_part', subType: 'cannon', prof: 'engineering', mat: 'ingot_copper', qty: 3, cost: 300, tier: 1, baseStats: { damage: 12, aoe: 5 } },
    { id: 'mod_tesla_1', name: 'Bobina de Cobre', type: 'tower_part', subType: 'tesla', prof: 'engineering', mat: 'ingot_copper', qty: 3, cost: 350, tier: 1, baseStats: { attackSpeed: 50, damage: 5 } },
    { id: 'mod_poison_1', name: 'Inyector de Cuero', type: 'tower_part', subType: 'poison', prof: 'engineering', mat: 'leather_simple', qty: 3, cost: 320, tier: 1, baseStats: { damage: 4, range: 20 } },
    { id: 'mod_quake_1', name: 'Peso de Hierro', type: 'tower_part', subType: 'quake', prof: 'engineering', mat: 'ingot_iron', qty: 4, cost: 400, tier: 1, baseStats: { damage: 15, aoe: 10 } },


    // ============================================================
    // TIER 1.5: ESPECIALES
    // ============================================================

    { 
        id: 'bow_long_reinforced', 
        name: 'Arco Largo Reforzado', 
        type: 'weapon', subType: 'bow', 
        prof: 'weaponsmith', mat: 'plank_wood', 
        qty: 6, // Pide más material por ser especial
        cost: 250, tier: 1, isLocked: true, twoHanded: true,
        baseStats: { damage: 10, range: 450, attackSpeed: 1000 } 
    },
    { 
        id: 'shield_heavy_copper', 
        name: 'Escudo Pesado de Cobre', 
        type: 'offhand', subType: 'shield', 
        prof: 'armorsmith', mat: 'ingot_copper', 
        qty: 6,
        cost: 250, tier: 1, isLocked: true, 
        baseStats: { defense: 5, hp: 30 } 
    },


    // ============================================================
    // TIER 2: HIERRO / CEDRO / CUERO RÍGIDO
    // ============================================================

    { id: 'sword_iron', name: 'Espada de Hierro', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_iron', qty: 3, cost: 400, tier: 2, baseStats: { damage: 15, attackSpeed: 950 } },
    { id: 'bow_cedar', name: 'Arco de Cedro', type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'plank_cedar', qty: 3, cost: 400, tier: 2, twoHanded: true, baseStats: { damage: 10, range: 180, attackSpeed: 750 } },

    { id: 'shield_iron', name: 'Escudo de Hierro', type: 'offhand', subType: 'shield', prof: 'armorsmith', mat: 'ingot_iron', qty: 4, cost: 350, tier: 2, baseStats: { defense: 8, blockChance: 15 } },
    { id: 'vest_rigid', name: 'Jubón de Cazador', type: 'armor', subType: 'leather', prof: 'armorsmith', mat: 'leather_rigid', qty: 5, cost: 450, tier: 2, baseStats: { hp: 70, moveSpeed: 15, defense: 3 } },

    { id: 'ring_iron', name: 'Anillo de Hierro', type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'ingot_iron', qty: 2, cost: 500, tier: 2, baseStats: { damage: 2, critChance: 2 } },

    { id: 'mod_mage_2', name: 'Cristal de Cedro', type: 'tower_part', subType: 'mage', prof: 'engineering', mat: 'plank_cedar', qty: 3, cost: 600, tier: 2, baseStats: { attackSpeed: 60, damage: 5 } },


    // ============================================================
    // TIER 3: ACERO / ÉBANO / MITHRIL / CUERO DRAGÓN
    // ============================================================

    { id: 'sword_steel', name: 'Espada de Acero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'ingot_steel', qty: 3, cost: 800, tier: 3, baseStats: { damage: 25, attackSpeed: 900, critChance: 5 } },
    { id: 'staff_ebony', name: 'Bastón de Ébano', type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'plank_ebony', qty: 3, cost: 800, tier: 3, twoHanded: true, baseStats: { damage: 30, attackSpeed: 1100 } },

    { id: 'armor_steel', name: 'Placas de Acero', type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'ingot_steel', qty: 5, cost: 1000, tier: 3, baseStats: { hp: 150, defense: 15 } },
    { id: 'armor_dragon', name: 'Armadura de Dragón', type: 'armor', subType: 'leather', prof: 'armorsmith', mat: 'leather_dragon', qty: 5, cost: 1200, tier: 3, baseStats: { hp: 180, moveSpeed: 20, critChance: 8 } },

    { id: 'ring_mithril', name: 'Anillo de Mithril', type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'ingot_mithril', qty: 2, cost: 1000, tier: 3, baseStats: { damage: 5, critDamage: 10 } }
];