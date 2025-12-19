// src/config/Recipes.js

export const RECIPES = [
    // --- ARMAS (Weaponsmith) ---
    {
        id: 'sword_common', name: "Espada Corta", type: 'weapon', subType: 'sword',
        prof: 'weaponsmith', mat: 'copper', cost: 50, twoHanded: false,
        stats: { damage: 15 }
    },
    {
        id: 'bow_wood', name: "Arco de Caza", type: 'weapon', subType: 'bow',
        prof: 'weaponsmith', mat: 'wood', cost: 60, twoHanded: true, // Ocupa 2 manos
        stats: { damage: 20, range: 100 } // Da rango extra
    },
    {
        id: 'staff_apprentice', name: "Bastón Aprendiz", type: 'weapon', subType: 'staff',
        prof: 'weaponsmith', mat: 'wood', cost: 70, twoHanded: true,
        stats: { damage: 25, range: 50 }
    },
    {
        id: 'dagger_rogue', name: "Daga Veloz", type: 'weapon', subType: 'dagger',
        prof: 'weaponsmith', mat: 'copper', cost: 45, twoHanded: false,
        stats: { damage: 10, attackSpeed: -100 } // Ataca más rápido
    },

    // --- ARMADURAS Y ESCUDOS (Armorsmith) ---
    {
        id: 'shield_wooden', name: "Escudo Redondo", type: 'offhand', subType: 'shield',
        prof: 'armorsmith', mat: 'wood', cost: 40,
        stats: { defense: 5, maxHp: 20 }
    },
    {
        id: 'armor_plate', name: "Peto de Placas", type: 'armor', subType: 'plate',
        prof: 'armorsmith', mat: 'copper', cost: 100,
        stats: { maxHp: 100, defense: 10 }
    },
    {
        id: 'armor_leather', name: "Jubón de Cuero", type: 'armor', subType: 'leather',
        prof: 'armorsmith', mat: 'leather', cost: 80,
        stats: { maxHp: 60, moveSpeed: 10 }
    },
    {
        id: 'armor_cloth', name: "Túnica de Mago", type: 'armor', subType: 'cloth',
        prof: 'armorsmith', mat: 'cloth', cost: 60,
        stats: { maxHp: 40, attackSpeed: -50 } // Lanza hechizos más rápido
    },

    // --- JOYERÍA (Jewelry) ---
    {
        id: 'ring_copper', name: "Anillo Simple", type: 'accessory', subType: 'ring',
        prof: 'jewelry', mat: 'copper', cost: 150,
        stats: { damage: 5, maxHp: 10 }
    }
];