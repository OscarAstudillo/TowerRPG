// src/config/Enemies.js

// DROP FORMATO: [materialKey, probabilidad (0-1), min, max]
// NOTA: Stats base normalizados para Nivel 1.
// El sistema escalará esto un 15% por nivel de mapa.

export const ENEMY_DB = {
    // ============================================================
    // BIOMA: BOSQUE (Forest) - Estándar Nivel 1
    // ============================================================
    slime: { 
        name: "Slime", hp: 60, damage: 5, speed: 0.8, armor: 0, 
        flying: false, drops: [['scraps', 0.2, 1, 2]] 
    },
    goblin: { 
        name: "Goblin", hp: 80, damage: 8, speed: 1.0, armor: 2, 
        flying: false, drops: [['scraps', 0.19, 1, 2], ['copper', 0.05, 1, 1]] 
    },
    wolf: { 
        name: "Lobo", hp: 100, damage: 12, speed: 1.4, armor: 5, 
        flying: false, drops: [['hide', 0.2, 1, 2]] 
    },
    boar: { 
        name: "Jabalí", hp: 150, damage: 10, speed: 0.7, armor: 10, 
        flying: false, drops: [['hide', 0.15, 1, 2], ['leather', 0.05, 1, 1]] 
    },
    eagle: { 
        name: "Águila", hp: 70, damage: 8, speed: 1.3, armor: 0, 
        flying: true, drops: [['hide', 0.2, 1, 2]] 
    }, 
    ent: { 
        name: "Ent Joven", hp: 300, damage: 15, speed: 0.5, armor: 20, 
        flying: false, drops: [['wood', 0.3, 1, 3], ['cedar', 0.1, 1, 2]] 
    },
    shaman: { 
        name: "Chamán", hp: 120, damage: 15, speed: 0.8, armor: 2, 
        flying: false, healer: true, drops: [['cloth_simple', 0.2, 1, 1], ['scraps', 0.1, 1, 3]] 
    },
    
    // Mini-Bosses Bosque (Aparición Nivel 4-7 aprox)
    alpha_wolf: { name: "Lobo Alfa", hp: 800, damage: 25, speed: 1.3, armor: 10, drops: [['leather', 1.0, 2, 4], ['ruby_uncut', 0.3, 1, 1]] },
    treant_guardian: { name: "Guardián Treant", hp: 1500, damage: 40, speed: 0.4, armor: 30, drops: [['cedar', 1.0, 5, 10], ['wood', 1.0, 10, 20]] },
    
    // Bosses Bosque
    boss_rasta: { name: "Rasta, el Oso", hp: 3000, damage: 60, speed: 0.6, armor: 20, drops: [['leather_rigid', 1.0, 1, 2], ['gold_ore', 0.5, 1, 3]] },
    boss_queen_spider: { name: "Reina Arácnida", hp: 6000, damage: 90, speed: 0.9, armor: 30, drops: [['silk', 1.0, 5, 10], ['sapphire_uncut', 0.6, 1, 2]] },


    // ============================================================
    // BIOMA: MONTAÑA (Mountain) - Rebalanceado a Nivel 1
    // ============================================================
    bandit: { 
        name: "Bandido", hp: 70, damage: 7, speed: 1.0, armor: 3, // Similar a Goblin/Lobo
        drops: [['scraps', 0.2, 1, 3], ['copper', 0.1, 1, 2]] 
    },
    rock_elemental: { 
        name: "Elem. Roca", hp: 180, damage: 12, speed: 0.5, armor: 15, // Similar a Jabalí/Ent
        drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 4]] 
    },
    harpy: { 
        name: "Arpía", hp: 80, damage: 10, speed: 1.4, armor: 2, 
        flying: true, drops: [['scraps', 0.2, 1, 2], ['silver', 0.1, 1, 1]] 
    },
    miner_dwarf: { 
        name: "Minero", hp: 100, damage: 10, speed: 0.8, armor: 8, 
        drops: [['iron', 0.2, 2, 4], ['gold_ore', 0.05, 1, 1]] 
    },
    golem_copper: { 
        name: "Golem Cobre", hp: 350, damage: 18, speed: 0.4, armor: 25, 
        drops: [['copper', 0.3, 3, 6]] 
    },
    
    // Mini-Bosses Montaña
    bandit_leader: { name: "Jefe Bandido", hp: 900, damage: 30, speed: 1.1, armor: 15, drops: [['silver', 1.0, 2, 5], ['cloth_fine', 0.5, 1, 2]] },
    golem_steel: { name: "Golem de Acero", hp: 1800, damage: 45, speed: 0.3, armor: 40, drops: [['iron', 1.0, 5, 10], ['coal', 1.0, 5, 10]] },

    // Bosses Montaña
    boss_andres: { name: "Andrés, el Troll", hp: 3500, damage: 70, speed: 0.7, armor: 30, drops: [['mithril', 0.5, 1, 3], ['ruby_uncut', 1.0, 1, 2]] },
    boss_titan: { name: "Titán de Piedra", hp: 7000, damage: 100, speed: 0.3, armor: 60, drops: [['diamond_uncut', 0.3, 1, 1], ['mithril', 1.0, 5, 10]] },


    // ============================================================
    // BIOMA: VOLCÁN (Volcano) - Rebalanceado a Nivel 1
    // ============================================================
    fire_imp: { 
        name: "Diablillo", hp: 60, damage: 8, speed: 1.5, armor: 0, // Cañón de cristal (rápido y pega, poca vida)
        drops: [['coal', 0.2, 1, 3]] 
    },
    magma_cube: { 
        name: "Cubo Magma", hp: 120, damage: 10, speed: 0.6, armor: 10, 
        drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 5]] 
    },
    succubus: { 
        name: "Súcubo", hp: 90, damage: 12, speed: 1.2, armor: 5, 
        flying: true, drops: [['silk', 0.2, 1, 2], ['ruby_uncut', 0.05, 1, 1]] 
    },
    fire_elemental: { 
        name: "Elem. Fuego", hp: 200, damage: 15, speed: 0.8, armor: 15, 
        drops: [['coal', 0.3, 3, 6], ['gold_ore', 0.1, 1, 2]] 
    },
    
    // Mini-Bosses Volcán
    demon_guard: { name: "Guardia Demonio", hp: 1000, damage: 35, speed: 0.9, armor: 20, drops: [['mithril', 0.5, 1, 3], ['leather_dragon', 0.2, 1, 1]] },
    
    // Bosses Volcán
    boss_ifrit: { name: "Ifrit", hp: 4000, damage: 80, speed: 0.8, armor: 40, drops: [['ruby_uncut', 1.0, 2, 4], ['mithril', 1.0, 5, 10]] },
    boss_dragon: { name: "Dragón Ancestral", hp: 8000, damage: 120, speed: 0.5, armor: 80, flying: true, drops: [['scale', 1.0, 10, 20], ['gold_ore', 1.0, 20, 50], ['diamond_uncut', 1.0, 1, 2]] }
};

export const BIOME_ENEMIES = {
    forest: {
        tiers: [
            ['slime', 'goblin'], 
            ['wolf', 'boar', 'goblin'], 
            ['eagle', 'ent', 'shaman', 'wolf']
        ],
        miniBosses: ['alpha_wolf', 'treant_guardian'],
        bosses: { 5: 'boss_rasta', 10: 'boss_queen_spider' }
    },
    mountain: {
        tiers: [
            ['bandit', 'miner_dwarf'],
            ['rock_elemental', 'harpy', 'bandit'],
            ['golem_copper', 'harpy', 'rock_elemental']
        ],
        miniBosses: ['bandit_leader', 'golem_steel'],
        bosses: { 5: 'boss_andres', 10: 'boss_titan' }
    },
    volcano: {
        tiers: [
            ['fire_imp', 'magma_cube'],
            ['fire_elemental', 'succubus', 'fire_imp'],
            ['fire_elemental', 'succubus', 'magma_cube']
        ],
        miniBosses: ['demon_guard'],
        bosses: { 5: 'boss_ifrit', 10: 'boss_dragon' }
    }
};