export const RECIPES = [
    // ======================================================================================
    // TIER 1: COBRE / MADERA / TELA SIMPLE / CUERO SIMPLE (Niveles 1-10)
    // Multiplicador del Sistema: x1.0
    // ======================================================================================

    // --- ARMAS (1 Mano) ---
    // Arquetipo Espada: damage, attackSpeed
    { id: 'sword_copper', name: 'Espada Corta de Cobre', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 100, tier: 1, 
      ingredients: { ingot_copper: 3, plank_wood: 1 }, 
      baseStats: { damage: 10, attackSpeed: 1400 } }, // DPS Base: ~7.1
      
    { id: 'sword_broad_copper', name: 'Espada Ancha', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 120, tier: 1, 
      ingredients: { ingot_copper: 4, leather_simple: 1 }, 
      baseStats: { damage: 12, attackSpeed: 1500 } }, // Pega más fuerte, pero más lento

    // Arquetipo Daga: damage, critChance
    { id: 'dagger_copper', name: 'Daga de Cobre', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 80, tier: 1, 
      ingredients: { ingot_copper: 2, leather_simple: 1 }, 
      baseStats: { damage: 6, critChance: 5 } },
      
    { id: 'dagger_shiv', name: 'Punzón', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 90, tier: 1, 
      ingredients: { ingot_copper: 2, cloth_simple: 2 }, 
      baseStats: { damage: 5, critChance: 6 } },

    // --- ARMAS (2 Manos) ---
    // Arquetipo Arco: damage, range
    { id: 'bow_short', name: 'Arco Corto', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 100, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 3, leather_simple: 1 }, 
      baseStats: { damage: 8, range: 180 } }, // Rango medio
      
    { id: 'bow_hunting', name: 'Arco de Caza', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 150, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 4, cloth_simple: 2 }, 
      baseStats: { damage: 10, range: 220 } }, // Rango alto

    // Arquetipo Bastón: damage, cdr
    { id: 'staff_novice', name: 'Vara de Novicio', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 100, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 3, ingot_copper: 1 }, 
      baseStats: { damage: 12, cdr: 2 } }, // 2% CDR
      
    { id: 'staff_nature', name: 'Bastón Natural', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 140, tier: 1, twoHanded: true, 
      ingredients: { plank_wood: 5, cloth_simple: 1 }, 
      baseStats: { damage: 11, cdr: 4 } }, // Más CDR

    // --- ARMADURAS ---
    // Arquetipo Placas: defense, hp
    { id: 'plate_copper', name: 'Peto de Cobre', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 200, tier: 1, 
      ingredients: { ingot_copper: 5, leather_simple: 2 }, 
      baseStats: { defense: 5, hp: 20 } },
      
    { id: 'plate_heavy_copper', name: 'Coraza Pesada', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 250, tier: 1, 
      ingredients: { ingot_copper: 7, cloth_simple: 2 }, 
      baseStats: { defense: 7, hp: 30 } },

    // Arquetipo Cuero: hp, moveSpeed
    { id: 'leather_vest', name: 'Chaleco de Cuero', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 180, tier: 1, 
      ingredients: { leather_simple: 5, cloth_simple: 2 }, 
      baseStats: { hp: 25, moveSpeed: 10 } },
      
    { id: 'leather_tunic', name: 'Túnica de Explorador', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 200, tier: 1, 
      ingredients: { leather_simple: 6, ingot_copper: 1 }, 
      baseStats: { hp: 30, moveSpeed: 15 } },

    // Arquetipo Tela: hp, cdr
    { id: 'cloth_robe', name: 'Túnica de Lino', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 150, tier: 1, 
      ingredients: { cloth_simple: 5, leather_simple: 1 }, 
      baseStats: { hp: 15, cdr: 3 } },
      
    { id: 'cloth_cowl', name: 'Hábito de Monje', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 170, tier: 1, 
      ingredients: { cloth_simple: 6, plank_wood: 1 }, 
      baseStats: { hp: 18, cdr: 5 } },

    // --- ESCUDOS ---
    // Arquetipo Escudo: defense, blockChance
    { id: 'shield_buckler', name: 'Rodela de Madera', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 100, tier: 1, 
      ingredients: { plank_wood: 4, ingot_copper: 1 }, 
      baseStats: { defense: 2, blockChance: 5 } },
      
    { id: 'shield_copper', name: 'Escudo de Cobre', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 150, tier: 1, 
      ingredients: { ingot_copper: 4, plank_wood: 2 }, 
      baseStats: { defense: 4, blockChance: 8 } },

    // --- ACCESORIOS ---
    // Arquetipo Anillo: critChance, damage
    { id: 'ring_copper', name: 'Anillo de Cobre', type: 'accessory', subType: 'ring', prof: 'jewelry', cost: 200, tier: 1, 
      ingredients: { ingot_copper: 2 }, 
      baseStats: { critChance: 2, damage: 2 } },
      
    // Arquetipo Accesorio (Amuleto): damage, lifesteal
    { id: 'amulet_wood', name: 'Amuleto Tallado', type: 'accessory', subType: 'accessory', prof: 'jewelry', cost: 200, tier: 1, 
      ingredients: { plank_wood: 2, cloth_simple: 1 }, 
      baseStats: { damage: 3, lifesteal: 1 } },

    // --- TORRES TIER 1 ---
    // Arquetipos de torres definidos por su tipo en GameConstants (usualmente damage, range, attackSpeed)
    // Para simplificar, definimos stats base y el sistema los escala.
    { id: 'mod_archer_string', name: 'Cuerda Trenzada', type: 'tower_part', subType: 'archer', prof: 'engineering', cost: 400, tier: 1, 
      ingredients: { cloth_simple: 10, leather_simple: 5 }, 
      baseStats: { range: 20, damage: 2 } },
      
    { id: 'mod_cannon_barrel', name: 'Cañón Reforzado', type: 'tower_part', subType: 'cannon', prof: 'engineering', cost: 450, tier: 1, 
      ingredients: { ingot_copper: 12, plank_wood: 5 }, 
      baseStats: { damage: 15, aoe: 5 } }, // AOE es stat especial
      
    { id: 'mod_tesla_coil', name: 'Bobina Primitiva', type: 'tower_part', subType: 'tesla', prof: 'engineering', cost: 500, tier: 1, 
      ingredients: { ingot_copper: 15, cloth_simple: 3 }, 
      baseStats: { attackSpeed: 60, damage: 3 } },


    // ======================================================================================
    // TIER 1.5: DROP DE BOSS (Bosque)
    // Usamos Tier 1.5 para que el sistema escale los stats automáticamente un 40-50% extra
    // ======================================================================================
    { id: 'sword_orc', name: 'Mata-Orcos', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 500, tier: 1.5, isLocked: true, 
      ingredients: { ingot_copper: 10, leather_simple: 5, plank_wood: 5 }, 
      baseStats: { damage: 12, attackSpeed: 1300 } }, // Base alta + multiplicador 1.5
      
    { id: 'bow_ranger', name: 'Arco Guardabosques', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 500, tier: 1.5, isLocked: true, twoHanded: true, 
      ingredients: { plank_wood: 12, leather_simple: 8, cloth_simple: 5 }, 
      baseStats: { damage: 10, range: 200 } },


    // ======================================================================================
    // TIER 2: HIERRO / CEDRO / TELA FINA / CUERO RÍGIDO (Niveles 11-20)
    // Multiplicador del Sistema: x2.0 (Doble de fuerte que Tier 1)
    // ======================================================================================

    // --- ARMAS ---
    { id: 'sword_iron', name: 'Espada de Hierro', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 400, tier: 2, 
      ingredients: { ingot_iron: 4, plank_cedar: 1 }, 
      baseStats: { damage: 10, attackSpeed: 1400 } }, // Base igual a T1, resultado final x2
      
    { id: 'sword_knight', name: 'Espada de Caballero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 450, tier: 2, 
      ingredients: { ingot_iron: 5, leather_rigid: 2 }, 
      baseStats: { damage: 12, attackSpeed: 1500 } },

    { id: 'bow_cedar', name: 'Arco de Cedro', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 400, tier: 2, twoHanded: true, 
      ingredients: { plank_cedar: 4, leather_rigid: 2 }, 
      baseStats: { damage: 8, range: 180 } },
      
    { id: 'bow_long_cedar', name: 'Arco Largo', type: 'weapon', subType: 'bow', prof: 'weaponsmith', cost: 480, tier: 2, twoHanded: true, 
      ingredients: { plank_cedar: 6, cloth_fine: 3 }, 
      baseStats: { damage: 10, range: 220 } },

    // --- ARMADURAS ---
    { id: 'plate_iron', name: 'Placas de Hierro', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 500, tier: 2, 
      ingredients: { ingot_iron: 6, leather_rigid: 3 }, 
      baseStats: { defense: 5, hp: 20 } },
      
    { id: 'leather_rigid_vest', name: 'Jubón de Cazador', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 450, tier: 2, 
      ingredients: { leather_rigid: 6, cloth_fine: 2 }, 
      baseStats: { hp: 25, moveSpeed: 10 } },
      
    { id: 'cloth_fine_robe', name: 'Túnica Fina', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 400, tier: 2, 
      ingredients: { cloth_fine: 6, ingot_iron: 1 }, 
      baseStats: { hp: 15, cdr: 3 } },

    // --- TORRES TIER 2 ---
    { id: 'mod_mage_crystal', name: 'Cristal de Cedro', type: 'tower_part', subType: 'mage', prof: 'engineering', cost: 800, tier: 2, 
      ingredients: { plank_cedar: 10, ingot_iron: 2, cloth_fine: 5 }, 
      baseStats: { attackSpeed: 70, damage: 4 } }, // Base ajustada, x2 será fuerte
      
    { id: 'mod_quake_weight', name: 'Peso de Hierro', type: 'tower_part', subType: 'quake', prof: 'engineering', cost: 850, tier: 2, 
      ingredients: { ingot_iron: 15, leather_rigid: 5 }, 
      baseStats: { damage: 10, aoe: 8 } },


    // ======================================================================================
    // TIER 2.5: DROP DE BOSS (Montaña)
    // Multiplicador: ~x2.8
    // ======================================================================================
    { id: 'hammer_golem', name: 'Puño de Golem', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 1000, tier: 2.5, isLocked: true, 
      ingredients: { ingot_iron: 20, plank_cedar: 5 }, 
      baseStats: { damage: 14, attackSpeed: 1600 } }, // Muy lento pero daño masivo (14 * 2.8 = ~40)
      
    { id: 'shield_tower', name: 'Escudo Torre', type: 'offhand', subType: 'shield', prof: 'armorsmith', cost: 900, tier: 2.5, isLocked: true, 
      ingredients: { ingot_iron: 15, plank_cedar: 10 }, 
      baseStats: { defense: 8, blockChance: 12 } },


    // ======================================================================================
    // TIER 3: ACERO / ÉBANO / TELA REAL / PIEL DRAGÓN (Niveles 21-30)
    // Multiplicador del Sistema: x4.0 (Cuadruple de fuerte que Tier 1)
    // ======================================================================================

    // --- ARMAS ---
    { id: 'sword_steel', name: 'Espada de Acero', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 800, tier: 3, 
      ingredients: { ingot_steel: 5, leather_dragon: 2 }, 
      baseStats: { damage: 10, attackSpeed: 1400 } }, // Resultado x4: 40 daño
      
    { id: 'dagger_steel', name: 'Daga de Asesino', type: 'weapon', subType: 'dagger', prof: 'weaponsmith', cost: 750, tier: 3, 
      ingredients: { ingot_steel: 4, plank_ebony: 1 }, 
      baseStats: { damage: 6, critChance: 5 } },

    { id: 'staff_ebony', name: 'Bastón de Ébano', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 900, tier: 3, twoHanded: true, 
      ingredients: { plank_ebony: 6, cloth_royal: 2, ingot_steel: 1 }, 
      baseStats: { damage: 12, cdr: 2 } },

    // --- ARMADURAS ---
    { id: 'plate_steel', name: 'Placas Templadas', type: 'armor', subType: 'plate', prof: 'armorsmith', cost: 1200, tier: 3, 
      ingredients: { ingot_steel: 8, leather_dragon: 4 }, 
      baseStats: { defense: 5, hp: 20 } }, // Resultado x4: 20 def, 80 hp
      
    { id: 'leather_dragon', name: 'Armadura Dragón', type: 'armor', subType: 'leather', prof: 'armorsmith', cost: 1100, tier: 3, 
      ingredients: { leather_dragon: 8, ingot_steel: 2 }, 
      baseStats: { hp: 25, moveSpeed: 10 } },
      
    { id: 'cloth_royal', name: 'Túnica Real', type: 'armor', subType: 'cloth', prof: 'armorsmith', cost: 1000, tier: 3, 
      ingredients: { cloth_royal: 8, plank_ebony: 2 }, 
      baseStats: { hp: 15, cdr: 3 } },

    // --- ACCESORIOS ---
    { id: 'ring_mithril', name: 'Anillo de Poder', type: 'accessory', subType: 'ring', prof: 'jewelry', cost: 1500, tier: 3, 
      ingredients: { ingot_steel: 3, plank_ebony: 1 }, 
      baseStats: { critChance: 2, damage: 2 } },

    // --- TORRES TIER 3 ---
    { id: 'mod_poison_injector', name: 'Inyector Letal', type: 'tower_part', subType: 'poison', prof: 'engineering', cost: 1500, tier: 3, 
      ingredients: { leather_dragon: 10, ingot_steel: 5, plank_ebony: 5 }, 
      baseStats: { damage: 5, range: 10 } },


    // ======================================================================================
    // TIER 3.5: DROP DE BOSS (Volcán) - LEGENDARIOS
    // Multiplicador: ~x5.6
    // ======================================================================================
    { id: 'sword_dragon', name: 'Diente de Dragón', type: 'weapon', subType: 'sword', prof: 'weaponsmith', cost: 2500, tier: 3.5, isLocked: true, 
      ingredients: { leather_dragon: 20, ingot_steel: 15, plank_ebony: 10 }, 
      baseStats: { damage: 15, attackSpeed: 1300 } }, // Brutal
      
    { id: 'staff_archmage', name: 'Bastón Archimago', type: 'weapon', subType: 'staff', prof: 'weaponsmith', cost: 2500, tier: 3.5, isLocked: true, twoHanded: true, 
      ingredients: { plank_ebony: 20, cloth_royal: 15, ingot_steel: 5 }, 
      baseStats: { damage: 18, cdr: 5 } }
];