// src/config/Recipes.js

export const RECIPES = [
    // ======================================================================================
    // TIER 1: COBRE / MADERA / TELA SIMPLE / CUERO SIMPLE (Niveles 1-10)
    // Multiplicador del Sistema: x1.0 (BASE)
    // ======================================================================================

    // --- ARMAS (1 Mano) ---
    { id: 'sword_copper', name: 'Espada Corta de Cobre', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 100, tier: 1, 
      ingredients: { ingot_copper: 3, plank_wood: 1 }, 
      baseStats: { damage: 10, attackSpeed: 1400 } },
      
    { id: 'sword_broad_copper', name: 'Espada Ancha', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 120, tier: 1, 
      ingredients: { ingot_copper: 4, leather_simple: 1 }, 
      baseStats: { damage: 12, attackSpeed: 1500 } },

    { id: 'dagger_copper', name: 'Daga de Cobre', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 80, tier: 1, 
      ingredients: { ingot_copper: 2, leather_simple: 1 }, 
      baseStats: { damage: 6, critChance: 5 } },
      
    { id: 'dagger_shiv', name: 'Punzón', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 90, tier: 1, 
      ingredients: { ingot_copper: 2, cloth_simple: 2 }, 
      baseStats: { damage: 5, critChance: 6 } },

    // --- ARMAS (2 Manos) ---
    { id: 'bow_short', name: 'Arco Corto', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 100, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 3, leather_simple: 1 }, 
      baseStats: { damage: 8, range: 180 } }, 
      
    { id: 'bow_hunting', name: 'Arco de Caza', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 150, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 4, cloth_simple: 2 }, 
      baseStats: { damage: 10, range: 220 } }, 

    { id: 'staff_novice', name: 'Vara de Novicio', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 100, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 3, ingot_copper: 1 }, 
      baseStats: { damage: 12, cdr: 2 } }, 
      
    { id: 'staff_nature', name: 'Bastón Natural', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 140, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 5, cloth_simple: 1 }, 
      baseStats: { damage: 11, cdr: 4 } }, 

    // --- ARMADURAS ---
    { id: 'plate_copper', name: 'Peto de Cobre', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 200, tier: 1, 
      ingredients: { ingot_copper: 5, leather_simple: 2 }, 
      baseStats: { defense: 5, hp: 20 } },
      
    { id: 'plate_heavy_copper', name: 'Coraza Pesada', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 250, tier: 1, 
      ingredients: { ingot_copper: 7, cloth_simple: 2 }, 
      baseStats: { defense: 7, hp: 30 } },

    { id: 'leather_vest', name: 'Chaleco de Cuero', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 180, tier: 1, 
      ingredients: { leather_simple: 5, cloth_simple: 2 }, 
      baseStats: { hp: 25, moveSpeed: 10 } },
      
    { id: 'leather_tunic', name: 'Túnica de Explorador', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 200, tier: 1, 
      ingredients: { leather_simple: 6, ingot_copper: 1 }, 
      baseStats: { hp: 30, moveSpeed: 15 } },

    { id: 'cloth_robe', name: 'Túnica de Lino', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 150, tier: 1, 
      ingredients: { cloth_simple: 5, leather_simple: 1 }, 
      baseStats: { hp: 15, cdr: 3 } },
      
    { id: 'cloth_cowl', name: 'Hábito de Monje', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 170, tier: 1, 
      ingredients: { cloth_simple: 6, plank_wood: 1 }, 
      baseStats: { hp: 18, cdr: 5 } },

    // --- ESCUDOS ---
    { id: 'shield_buckler', name: 'Rodela de Madera', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 100, tier: 1, 
      ingredients: { plank_wood: 4, ingot_copper: 1 }, 
      baseStats: { defense: 2, blockChance: 5 } },
      
    { id: 'shield_copper', name: 'Escudo de Cobre', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 150, tier: 1, 
      ingredients: { ingot_copper: 4, plank_wood: 2 }, 
      baseStats: { defense: 4, blockChance: 8 } },

    // --- ACCESORIOS ---
    { id: 'ring_copper', name: 'Anillo de Cobre', type: 'accessory', subType: 'ring', prof: 'jewelry', cost: 200, tier: 1, 
      ingredients: { ingot_copper: 2 }, 
      baseStats: { critChance: 2, damage: 2 } },
      
    { id: 'amulet_wood', name: 'Amuleto Tallado', type: 'accessory', subType: 'accessory', prof: 'jewelry', cost: 200, tier: 1, 
      ingredients: { plank_wood: 2, cloth_simple: 1 }, 
      baseStats: { damage: 3, lifesteal: 1 } },

    // --- TORRES TIER 1 ---
    { id: 'mod_archer_string', name: 'Cuerda Trenzada', type: 'tower_part', subType: 'archer', prof: 'engineering', cost: 400, tier: 1, 
      ingredients: { cloth_simple: 10, leather_simple: 5 }, 
      baseStats: { range: 20, damage: 5 } },
      
    { id: 'mod_cannon_barrel', name: 'Cañón Reforzado', type: 'tower_part', subType: 'cannon', prof: 'engineering', cost: 450, tier: 1, 
      ingredients: { ingot_copper: 12, plank_wood: 5 }, 
      baseStats: { damage: 15, aoe: 5 } },
      
    { id: 'mod_tesla_coil', name: 'Bobina Primitiva', type: 'tower_part', subType: 'tesla', prof: 'engineering', cost: 500, tier: 1, 
      ingredients: { ingot_copper: 15, cloth_simple: 3 }, 
      baseStats: { attackSpeed: 60, damage: 3 } },


    // ======================================================================================
    // TIER 1.5: DROP DE BOSS (Bosque)
    // Multiplicador del Sistema: x1.4 (aprox)
    // ======================================================================================
    { id: 'sword_orc', name: 'Mata-Orcos', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 500, tier: 1.5, isLocked: true, 
      ingredients: { ingot_copper: 10, leather_simple: 5, plank_wood: 5 }, 
      baseStats: { damage: 15, attackSpeed: 1300 } }, 
      
    { id: 'bow_ranger', name: 'Arco Guardabosques', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 500, tier: 1.5, isLocked: true, twoHanded: true, 
      ingredients: { plank_wood: 12, leather_simple: 8, cloth_simple: 5 }, 
      baseStats: { damage: 13, range: 200 } },


    // ======================================================================================
    // TIER 2: HIERRO / CEDRO / TELA FINA / CUERO RÍGIDO (Niveles 11-20)
    // Multiplicador del Sistema: x2.0
    // Lógica: Ponemos valores base similares a T1. El sistema multiplicará por 2.
    // ======================================================================================

    // --- ARMAS ---
    { id: 'sword_iron', name: 'Espada de Hierro', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 400, tier: 2, 
      ingredients: { ingot_iron: 4, plank_cedar: 1 }, 
      // Base 10 -> x2.0 = 20 Daño. Velocidad: 1400 / 2 = 700ms (Muy rápido)
      // Ajuste Vel: Ponemos base 2800 para que al dividir por 2 quede en 1400 (normal) o un poco más rápido.
      baseStats: { damage: 11, attackSpeed: 2400 } }, 
      
    { id: 'sword_knight', name: 'Espada de Caballero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 450, tier: 2, 
      ingredients: { ingot_iron: 5, leather_rigid: 2 }, 
      baseStats: { damage: 13, attackSpeed: 2600 } },

    { id: 'bow_cedar', name: 'Arco de Cedro', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 400, tier: 2, twoHanded: true, 
      ingredients: { plank_cedar: 4, leather_rigid: 2 }, 
      baseStats: { damage: 9, range: 180 } }, // Daño 9*2=18
      
    { id: 'bow_long_cedar', name: 'Arco Largo', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 480, tier: 2, twoHanded: true, 
      ingredients: { plank_cedar: 6, cloth_fine: 3 }, 
      baseStats: { damage: 11, range: 220 } },

    // --- ARMADURAS ---
    { id: 'plate_iron', name: 'Placas de Hierro', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 500, tier: 2, 
      ingredients: { ingot_iron: 6, leather_rigid: 3 }, 
      baseStats: { defense: 6, hp: 22 } }, // Def 12, HP 44
      
    { id: 'leather_rigid_vest', name: 'Jubón de Cazador', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 450, tier: 2, 
      ingredients: { leather_rigid: 6, cloth_fine: 2 }, 
      baseStats: { hp: 28, moveSpeed: 10 } },
      
    { id: 'cloth_fine_robe', name: 'Túnica Fina', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 400, tier: 2, 
      ingredients: { cloth_fine: 6, ingot_iron: 1 }, 
      baseStats: { hp: 17, cdr: 3 } }, // HP 34, CDR 6%

    // --- TORRES TIER 2 ---
    { id: 'mod_mage_crystal', name: 'Cristal de Cedro', type: 'tower_part', subType: 'mage', prof: 'engineering', cost: 800, tier: 2, 
      ingredients: { plank_cedar: 10, ingot_iron: 2, cloth_fine: 5 }, 
      baseStats: { attackSpeed: 120, damage: 4 } }, // Speed 60ms, Dmg 8
      
    { id: 'mod_quake_weight', name: 'Peso de Hierro', type: 'tower_part', subType: 'quake', prof: 'engineering', cost: 850, tier: 2, 
      ingredients: { ingot_iron: 15, leather_rigid: 5 }, 
      baseStats: { damage: 12, aoe: 5 } },


    // ======================================================================================
    // TIER 2.5: DROP DE BOSS (Montaña)
    // Multiplicador del Sistema: ~x2.8
    // ======================================================================================
    { id: 'hammer_golem', name: 'Puño de Golem', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 1000, tier: 2.5, isLocked: true, 
      ingredients: { ingot_iron: 20, plank_cedar: 5 }, 
      // Daño 16 * 2.8 = 45. Speed 3500 / 2.8 = 1250ms
      baseStats: { damage: 16, attackSpeed: 3500 } }, 
      
    { id: 'shield_tower', name: 'Escudo Torre', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 900, tier: 2.5, isLocked: true, 
      ingredients: { ingot_iron: 15, plank_cedar: 10 }, 
      baseStats: { defense: 8, blockChance: 10 } }, // Def ~22, Block ~28%


    // ======================================================================================
    // TIER 3: ACERO / ÉBANO / TELA REAL / PIEL DRAGÓN (Niveles 21-30)
    // Multiplicador del Sistema: x4.0 (Cuadruple de fuerte que Tier 1)
    // ======================================================================================

    // --- ARMAS ---
    { id: 'sword_steel', name: 'Espada de Acero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 800, tier: 3, 
      ingredients: { ingot_steel: 5, leather_dragon: 2 }, 
      // Daño 12 * 4 = 48. Speed 4000 / 4 = 1000ms
      baseStats: { damage: 12, attackSpeed: 4000 } }, 
      
    { id: 'dagger_steel', name: 'Daga de Asesino', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 750, tier: 3, 
      ingredients: { ingot_steel: 4, plank_ebony: 1 }, 
      baseStats: { damage: 8, critChance: 5 } }, // Dmg 32, Crit 20%

    { id: 'staff_ebony', name: 'Bastón de Ébano', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 900, tier: 3, twoHanded: true, 
      ingredients: { plank_ebony: 6, cloth_royal: 2, ingot_steel: 1 }, 
      baseStats: { damage: 14, cdr: 2 } }, // Dmg 56, CDR 8%

    // --- ARMADURAS ---
    { id: 'plate_steel', name: 'Placas Templadas', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 1200, tier: 3, 
      ingredients: { ingot_steel: 8, leather_dragon: 4 }, 
      baseStats: { defense: 7, hp: 25 } }, // Def 28, HP 100
      
    { id: 'leather_dragon', name: 'Armadura Dragón', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 1100, tier: 3, 
      ingredients: { leather_dragon: 8, ingot_steel: 2 }, 
      baseStats: { hp: 30, moveSpeed: 10 } }, // HP 120, Speed 40 (OJO: Speed debe escalarse con cuidado)
      
    { id: 'cloth_royal', name: 'Túnica Real', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 1000, tier: 3, 
      ingredients: { cloth_royal: 8, plank_ebony: 2 }, 
      baseStats: { hp: 20, cdr: 3 } },

    // --- ACCESORIOS ---
    { id: 'ring_mithril', name: 'Anillo de Poder', type: 'accessory', subType: 'ring', prof: 'jewelry', cost: 1500, tier: 3, 
      ingredients: { ingot_steel: 3, plank_ebony: 1 }, 
      baseStats: { critChance: 2, damage: 3 } }, // Crit 8%, Dmg 12

    // --- TORRES TIER 3 ---
    { id: 'mod_poison_injector', name: 'Inyector Letal', type: 'tower_part', subType: 'poison', prof: 'engineering', cost: 1500, tier: 3, 
      ingredients: { leather_dragon: 10, ingot_steel: 5, plank_ebony: 5 }, 
      baseStats: { damage: 6, range: 10 } },


    // ======================================================================================
    // TIER 3.5: DROP DE BOSS (Volcán) - LEGENDARIOS
    // Multiplicador del Sistema: ~x5.6
    // ======================================================================================
    { id: 'sword_dragon', name: 'Diente de Dragón', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 2500, tier: 3.5, isLocked: true, 
      ingredients: { leather_dragon: 20, ingot_steel: 15, plank_ebony: 10 }, 
      // Daño 18 * 5.6 = ~100. Speed 6000 / 5.6 = ~1000ms
      baseStats: { damage: 18, attackSpeed: 6000 } }, 
      
    { id: 'staff_archmage', name: 'Bastón Archimago', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 2500, tier: 3.5, isLocked: true, twoHanded: true, 
      ingredients: { plank_ebony: 20, cloth_royal: 15, ingot_steel: 5 }, 
      baseStats: { damage: 20, cdr: 3 } } // Dmg 112, CDR 16%
];