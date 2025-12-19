// src/config/Recipes.js

export const RECIPES = [
    // --- ARMAS ---
    { id: 'sword_common', name: "Espada Corta", type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'copper', cost: 50, twoHanded: false, 
      baseStats: { damage: 10 } }, // Stat base garantizado
    { id: 'bow_wood', name: "Arco de Caza", type: 'weapon', subType: 'bow', prof: 'weaponsmith', mat: 'wood', cost: 60, twoHanded: true, 
      baseStats: { damage: 12, range: 50 } },
    { id: 'staff_apprentice', name: "Bastón Aprendiz", type: 'weapon', subType: 'staff', prof: 'weaponsmith', mat: 'wood', cost: 70, twoHanded: true, 
      baseStats: { damage: 15, range: 30 } },
    { id: 'dagger_rogue', name: "Daga Veloz", type: 'weapon', subType: 'dagger', prof: 'weaponsmith', mat: 'copper', cost: 45, twoHanded: false, 
      baseStats: { damage: 8, attackSpeed: -50 } },

    // --- ARMADURAS ---
    { id: 'shield_wooden', name: "Escudo Redondo", type: 'offhand', subType: 'shield', prof: 'armorsmith', mat: 'wood', cost: 40, 
      baseStats: { defense: 5 } },
    { id: 'armor_plate', name: "Peto de Placas", type: 'armor', subType: 'plate', prof: 'armorsmith', mat: 'copper', cost: 100, 
      baseStats: { defense: 10, maxHp: 50 } },
    { id: 'armor_leather', name: "Jubón de Cuero", type: 'armor', subType: 'leather', prof: 'armorsmith', mat: 'leather', cost: 80, 
      baseStats: { defense: 5, moveSpeed: 10 } },
    { id: 'armor_cloth', name: "Túnica de Mago", type: 'armor', subType: 'cloth', prof: 'armorsmith', mat: 'cloth', cost: 60, 
      baseStats: { maxHp: 20, attackSpeed: -20 } },

    // --- ACCESORIOS (Sin stats base, todo random) ---
    { id: 'ring_copper', name: "Anillo Simple", type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'copper', cost: 150, 
      baseStats: {} } // Todo RNG
];