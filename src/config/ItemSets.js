// src/config/ItemSets.js

export const ITEM_SETS = {
    recruit_set: {
        name: "Equipo de Recluta",
        // IDs de las recetas que forman el set
        items: ['sword_wood', 'bow_training', 'staff_wood', 'armor_wood'], 
        bonuses: [
            { count: 2, desc: "+10 Vida", stats: { hp: 10 } },
            { count: 3, desc: "+5% XP Ganada", stats: { xpMultiplier: 0.05 } } // Lógica custom necesaria para XP
        ]
    },
    copper_guard: {
        name: "Guardia de Cobre",
        items: ['sword_copper', 'dagger_copper', 'armor_copper', 'ring_copper', 'mod_cannon_1'], 
        bonuses: [
            { count: 2, desc: "+2 Defensa", stats: { defense: 2 } },
            { count: 3, desc: "+20 Vida", stats: { hp: 20 } },
            { count: 4, desc: "Espinas +2 (Daño al ser golpeado)", stats: { thorns: 2 } }
        ]
    },
    scout_leather: {
        name: "Explorador Veloz",
        items: ['vest_simple', 'bow_training', 'dagger_copper', 'ring_copper'], // Mix posible
        bonuses: [
            { count: 2, desc: "+10 Vel. Movimiento", stats: { moveSpeed: 10 } },
            { count: 3, desc: "+5% Crítico", stats: { critChance: 5 } }
        ]
    },
    iron_legion: {
        name: "Legión de Hierro",
        items: ['sword_iron', 'shield_iron', 'ring_iron', 'armor_copper'], // Armor copper sirve de puente? Mejor solo hierro
        // Ajustamos a items reales de hierro cuando existan recetas de armadura de hierro
        items: ['sword_iron', 'shield_iron', 'ring_iron'], 
        bonuses: [
            { count: 2, desc: "+5 Daño", stats: { damage: 5 } },
            { count: 3, desc: "+15% Daño Crítico", stats: { critDamage: 15 } }
        ]
    },
    // Añadiremos más sets a medida que creemos más recetas (Hierro Armadura, etc.)
};