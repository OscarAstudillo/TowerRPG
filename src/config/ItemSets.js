// src/config/ItemSets.js

export const ITEM_SETS = {
    
    // ============================================================
    // TIER 1: SETS BÁSICOS (Cobre / Piel / Tela)
    // ============================================================

    // Set de Infantería (Guerreros/Tanques)
    // Combina placas de cobre y escudos
    infantry_set: {
        name: "Infantería de Cobre",
        items: [
            'sword_copper', 'sword_broad_copper', // Armas
            'plate_copper', 'plate_heavy_copper', // Armaduras
            'shield_copper', 'shield_buckler'     // Escudos
        ],
        bonuses: [
            { count: 2, desc: "+50 Vida", stats: { hp: 50 } },
            { count: 3, desc: "+5 Defensa", stats: { defense: 5 } },
            { count: 4, desc: "+10% Bloqueo", stats: { blockChance: 10 } }
        ]
    },

    // Set de Explorador (Arqueros/Asesinos)
    // Combina cuero y arcos/dagas
    scout_set: {
        name: "Traje de Explorador",
        items: [
            'dagger_copper', 'dagger_shiv', 'bow_short', 'bow_hunting',
            'leather_vest', 'leather_tunic'
        ],
        bonuses: [
            { count: 2, desc: "+15 Vel. Movimiento", stats: { moveSpeed: 15 } },
            { count: 3, desc: "+10% Vel. Ataque", stats: { attackSpeed: 100 } } // Recuerda: attackSpeed resta delay
        ]
    },

    // Set de Aprendiz (Magos)
    // Combina tela y bastones
    apprentice_set: {
        name: "Túnica de Aprendiz",
        items: [
            'staff_novice', 'staff_nature',
            'cloth_robe', 'cloth_cowl',
            'amulet_wood'
        ],
        bonuses: [
            { count: 2, desc: "+5% Reducción CD", stats: { cdr: 5 } },
            { count: 3, desc: "+15 Daño Mágico", stats: { damage: 15 } }
        ]
    },


    // ============================================================
    // TIER 1.5: SETS DE JEFE (Bosque)
    // ============================================================

    // Set del Cazador de Orcos
    // Requiere las armas de Boss del Tier 1.5
    orc_slayer_set: {
        name: "Cazador de Orcos",
        items: ['sword_orc', 'bow_ranger', 'leather_tunic', 'plate_heavy_copper'],
        bonuses: [
            { count: 2, desc: "+20 Daño Crítico", stats: { critDamage: 20 } },
            { count: 3, desc: "Furia: +10% Ataque Doble", stats: { doubleAttack: 10 } }
        ]
    },


    // ============================================================
    // TIER 2: SETS AVANZADOS (Hierro / Cedro / Seda)
    // ============================================================

    // Set de Caballero (Tanques puros)
    knight_set: {
        name: "Juramento del Caballero",
        items: ['sword_knight', 'plate_iron', 'shield_iron', 'ring_iron'],
        bonuses: [
            { count: 2, desc: "+150 Vida", stats: { hp: 150 } },
            { count: 3, desc: "+15 Defensa", stats: { defense: 15 } },
            { count: 4, desc: "Fortaleza: +20% Bloqueo", stats: { blockChance: 20 } }
        ]
    },

    // Set de Guardabosques (Arqueros de élite)
    ranger_set: {
        name: "Guardabosques Real",
        items: ['bow_cedar', 'bow_long_cedar', 'leather_rigid_vest'],
        bonuses: [
            { count: 2, desc: "+50 Rango de Ataque", stats: { range: 50 } },
            { count: 3, desc: "Ojo de Halcón: +15% Crítico", stats: { critChance: 15 } }
        ]
    },

    // Set de Sabio (Magos de batalla)
    sage_set: {
        name: "Sabiduría Arcana",
        items: ['cloth_fine_robe', 'mod_mage_crystal' /* Cristal cuenta si se equipara en héroe */, 'amulet_wood'], 
        // Nota: Agregamos items genéricos de mago si faltan bastones tier 2 específicos en la lista de items
        // O asumimos compatibilidad con bastones anteriores para facilitar el set
        bonuses: [
            { count: 2, desc: "+10% Reducción CD", stats: { cdr: 10 } },
            { count: 3, desc: "+2 Regeneración de Maná (Simulado con Daño)", stats: { damage: 25 } }
        ]
    },


    // ============================================================
    // TIER 2.5: SETS DE JEFE (Montaña)
    // ============================================================

    // Set del Coloso (Fuerza bruta)
    colossus_set: {
        name: "Poder del Golem",
        items: ['hammer_golem', 'shield_tower', 'plate_iron'],
        bonuses: [
            { count: 2, desc: "+300 Vida", stats: { hp: 300 } },
            { count: 3, desc: "Imparable: +30 Defensa pero -20 Velocidad", stats: { defense: 30, moveSpeed: -20 } }
        ]
    },


    // ============================================================
    // TIER 3: SETS MAESTROS (Acero / Dragón / Realeza)
    // ============================================================

    // Set del Asesino Sombrío
    shadow_set: {
        name: "Sombra Letal",
        items: ['dagger_steel', 'leather_dragon', 'ring_mithril'],
        bonuses: [
            { count: 2, desc: "+30% Vel. Ataque", stats: { attackSpeed: 300 } },
            { count: 3, desc: "Ejecución: +100% Daño Crítico", stats: { critDamage: 100 } }
        ]
    },

    // Set de Batalla Real
    royal_guard_set: {
        name: "Guardia Real",
        items: ['sword_steel', 'plate_steel', 'cloth_royal' /* Paladines usan tela a veces */, 'ring_mithril'],
        bonuses: [
            { count: 2, desc: "+50 Daño", stats: { damage: 50 } },
            { count: 3, desc: "+10% Robo de Vida", stats: { lifesteal: 10 } },
            { count: 4, desc: "Bendición: +5 Regeneración Vida", stats: { regenHp: 5 } }
        ]
    },

    // Set del Archimago (Tier 3.5 Boss)
    archmage_set: {
        name: "Legado del Dragón",
        items: ['staff_archmage', 'sword_dragon', 'leather_dragon', 'cloth_royal'],
        bonuses: [
            { count: 2, desc: "+20% Todas las Estadísticas (Simulado)", stats: { hp: 200, damage: 40, defense: 10 } },
            { count: 3, desc: "Poder Infinito: +25% Reducción CD", stats: { cdr: 25 } }
        ]
    }
};