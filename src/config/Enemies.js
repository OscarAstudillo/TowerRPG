// src/config/Enemies.js

// DROP FORMATO: [materialKey, probabilidad (0-1), min, max]
// NOTA: Probabilidad ajustada a 0.2 (20%) para mobs normales según requerimiento.

export const ENEMY_DB = {
    // === BOSQUE (Forest) ===
    slime: { name: "Slime", hp: 60, speed: 0.8, armor: 0, flying: false, drops: [['scraps', 0.2, 1, 2]] },
    goblin: { name: "Goblin", hp: 80, speed: 1.0, armor: 1, flying: false, drops: [['scraps', 0.2, 1, 2], ['copper', 0.1, 1, 1]] }, // 20% scraps, 10% extra cobre
    wolf: { name: "Lobo", hp: 120, speed: 1.4, armor: 2, flying: false, drops: [['hide', 0.2, 1, 2]] },
    boar: { name: "Jabalí", hp: 200, speed: 0.7, armor: 5, flying: false, drops: [['hide', 0.2, 2, 3], ['leather', 0.05, 1, 1]] },
    eagle: { name: "Águila Gigante", hp: 100, speed: 1.3, armor: 0, flying: true, drops: [['hide', 0.2, 1, 2]] }, 
    ent: { name: "Ent Joven", hp: 350, speed: 0.5, armor: 10, flying: false, drops: [['wood', 0.2, 2, 4], ['cedar', 0.1, 1, 2]] },
    shaman: { name: "Chamán Goblin", hp: 150, speed: 0.8, armor: 2, flying: false, healer: true, drops: [['cloth_simple', 0.2, 1, 1], ['scraps', 0.2, 2, 3]] },
    
    // Mini-Bosses Bosque (Drops asegurados o altos)
    alpha_wolf: { name: "Lobo Alfa", hp: 1200, speed: 1.6, armor: 5, drops: [['leather', 1.0, 2, 4], ['ruby_uncut', 0.3, 1, 1]] },
    treant_guardian: { name: "Guardián Treant", hp: 3000, speed: 0.4, armor: 25, drops: [['cedar', 1.0, 5, 10], ['wood', 1.0, 10, 20]] },
    
    // Bosses Nombrados Bosque (Nivel 5 y 10)
    boss_rasta: { name: "Rasta, el Oso Malicioso", hp: 6000, speed: 0.6, armor: 20, drops: [['leather_rigid', 1.0, 1, 2], ['gold_ore', 0.5, 1, 3]] },
    boss_queen_spider: { name: "Reina Arácnida", hp: 15000, speed: 0.9, armor: 30, drops: [['silk', 1.0, 5, 10], ['sapphire_uncut', 0.6, 1, 2]] },

    // === MONTAÑA (Mountain) ===
    bandit: { name: "Bandido", hp: 150, speed: 1.0, armor: 3, drops: [['scraps', 0.2, 1, 3], ['copper', 0.1, 1, 2]] },
    rock_elemental: { name: "Elem. Roca", hp: 450, speed: 0.5, armor: 25, drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 4]] },
    harpy: { name: "Arpía", hp: 220, speed: 1.4, armor: 2, flying: true, drops: [['scraps', 0.2, 1, 2], ['silver', 0.1, 1, 1]] },
    miner_dwarf: { name: "Minero Corrupto", hp: 280, speed: 0.8, armor: 12, drops: [['iron', 0.2, 2, 4], ['gold_ore', 0.05, 1, 1]] },
    golem_copper: { name: "Golem de Cobre", hp: 700, speed: 0.4, armor: 35, drops: [['copper', 0.3, 3, 6]] }, // Golems sueltan más
    
    // Mini-Bosses Montaña
    bandit_leader: { name: "Jefe Bandido", hp: 3500, speed: 1.1, armor: 15, drops: [['silver', 1.0, 2, 5], ['cloth_fine', 0.5, 1, 2]] },
    golem_steel: { name: "Golem de Acero", hp: 7000, speed: 0.3, armor: 60, drops: [['iron', 1.0, 5, 10], ['coal', 1.0, 5, 10]] },

    // Bosses Nombrados Montaña
    boss_andres: { name: "Andrés, el Troll", hp: 20000, speed: 0.7, armor: 40, drops: [['mithril', 0.5, 1, 3], ['ruby_uncut', 1.0, 1, 2]] },
    boss_titan: { name: "Titán de Piedra", hp: 40000, speed: 0.3, armor: 100, drops: [['diamond_uncut', 0.3, 1, 1], ['mithril', 1.0, 5, 10]] },

    // === VOLCÁN (Volcano) ===
    fire_imp: { name: "Diablillo", hp: 350, speed: 1.6, armor: 5, drops: [['coal', 0.2, 1, 3]] },
    magma_cube: { name: "Cubo Magma", hp: 900, speed: 0.5, armor: 25, drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 5]] },
    succubus: { name: "Súcubo", hp: 550, speed: 1.2, armor: 10, flying: true, drops: [['silk', 0.2, 1, 2], ['ruby_uncut', 0.05, 1, 1]] },
    fire_elemental: { name: "Elem. Fuego", hp: 1200, speed: 0.8, armor: 20, drops: [['coal', 0.3, 3, 6], ['gold_ore', 0.1, 1, 2]] },
    
    // Mini-Bosses Volcán
    demon_guard: { name: "Guardia Demonio", hp: 10000, speed: 0.9, armor: 50, drops: [['mithril', 0.5, 1, 3], ['leather_dragon', 0.2, 1, 1]] },
    
    // Bosses Nombrados Volcán
    boss_ifrit: { name: "Ifrit, Señor del Fuego", hp: 50000, speed: 0.8, armor: 60, drops: [['ruby_uncut', 1.0, 2, 4], ['mithril', 1.0, 5, 10]] },
    boss_dragon: { name: "Dragón Ancestral", hp: 120000, speed: 0.5, armor: 120, flying: true, drops: [['scale', 1.0, 10, 20], ['gold_ore', 1.0, 20, 50], ['diamond_uncut', 1.0, 1, 2]] }
};

// Configuración de oleadas por Bioma y Tier de dificultad
export const BIOME_ENEMIES = {
    forest: {
        tiers: [
            ['slime', 'goblin'], // Early game
            ['wolf', 'boar', 'goblin'], // Mid
            ['eagle', 'ent', 'shaman', 'wolf'] // Late
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