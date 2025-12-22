export const RECIPES = [
    // --- ARMAS ---
    { id: 'sword_common', name: "Espada Corta", type: 'weapon', subType: 'sword', prof: 'weaponsmith', mat: 'copper', cost: 50, twoHanded: false, 
      baseStats: { damage: 10 } }, 
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

    // --- ACCESORIOS ---
    { id: 'ring_copper', name: "Anillo Simple", type: 'accessory', subType: 'ring', prof: 'jewelry', mat: 'copper', cost: 150, 
      baseStats: {} },

    // --- MEJORAS DE TORRE (NUEVO - Formato Compatible) ---
    // Usamos 'engineering' como profesión (o weaponsmith si prefieres reutilizar)
    { id: 'mod_archer', name: 'Módulo de Arquero', type: 'tower_part', subType: 'archer', prof: 'engineering', mat: 'wood', cost: 300, 
      baseStats: { range: 20, damage: 5 } },
    
    { id: 'mod_cannon', name: 'Módulo de Cañón', type: 'tower_part', subType: 'cannon', prof: 'engineering', mat: 'copper', cost: 300, 
      baseStats: { damage: 15, aoe: 10 } },
    
    { id: 'mod_mage', name: 'Módulo Mágico', type: 'tower_part', subType: 'mage', prof: 'engineering', mat: 'cloth', cost: 300, 
      baseStats: { attackSpeed: -50, damage: 3 } } // AttackSpeed negativo es mejor (menos delay)
];