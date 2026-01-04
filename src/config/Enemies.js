// src/config/Enemies.js

// DROP FORMATO: [materialKey, probabilidad (0-1), min, max]

export const ENEMY_DB = {
    // ============================================================
    // MOBS NORMALES (Base Tier 1 - El código los escala automáticamente)
    // ============================================================
    // BOSQUE
    slime: { name: "Slime", hp: 60, damage: 5, speed: 0.8, armor: 0, drops: [['scraps', 0.2, 1, 2]] },
    goblin: { name: "Goblin", hp: 80, damage: 8, speed: 1.0, armor: 2, drops: [['scraps', 0.2, 1, 2], ['copper', 0.05, 1, 1]] },
    wolf: { name: "Lobo", hp: 100, damage: 12, speed: 1.4, armor: 5, drops: [['hide', 0.2, 1, 2]] },
    boar: { name: "Jabalí", hp: 150, damage: 10, speed: 0.7, armor: 10, drops: [['hide', 0.15, 1, 2], ['leather', 0.05, 1, 1]] },
    eagle: { name: "Águila", hp: 70, damage: 8, speed: 1.3, armor: 0, flying: true, drops: [['hide', 0.2, 1, 2]] }, 
    ent: { name: "Ent Joven", hp: 300, damage: 15, speed: 0.5, armor: 20, drops: [['wood', 0.3, 1, 3], ['cedar', 0.1, 1, 2]] },
    shaman: { name: "Chamán", hp: 120, damage: 15, speed: 0.8, armor: 2, healer: true, drops: [['cloth_simple', 0.2, 1, 1], ['scraps', 0.1, 1, 3]] },

    // MONTAÑA
    bandit: { name: "Bandido", hp: 70, damage: 7, speed: 1.0, armor: 3, drops: [['scraps', 0.2, 1, 3], ['copper', 0.1, 1, 2]] },
    rock_elemental: { name: "Elem. Roca", hp: 180, damage: 12, speed: 0.5, armor: 15, drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 4]] },
    harpy: { name: "Arpía", hp: 80, damage: 10, speed: 1.4, armor: 2, flying: true, drops: [['scraps', 0.2, 1, 2], ['silver', 0.1, 1, 1]] },
    miner_dwarf: { name: "Minero", hp: 100, damage: 10, speed: 0.8, armor: 8, drops: [['iron', 0.2, 2, 4], ['gold_ore', 0.05, 1, 1]] },
    golem_copper: { name: "Golem Cobre", hp: 350, damage: 18, speed: 0.4, armor: 25, drops: [['copper', 0.3, 3, 6]] },

    // VOLCÁN
    fire_imp: { name: "Diablillo", hp: 60, damage: 8, speed: 1.5, armor: 0, drops: [['coal', 0.2, 1, 3]] },
    magma_cube: { name: "Cubo Magma", hp: 120, damage: 10, speed: 0.6, armor: 10, drops: [['iron', 0.2, 1, 3], ['coal', 0.2, 2, 5]] },
    succubus: { name: "Súcubo", hp: 90, damage: 12, speed: 1.2, armor: 5, flying: true, drops: [['silk', 0.2, 1, 2], ['ruby_uncut', 0.05, 1, 1]] },
    fire_elemental: { name: "Elem. Fuego", hp: 200, damage: 15, speed: 0.8, armor: 15, drops: [['coal', 0.3, 3, 6], ['gold_ore', 0.1, 1, 2]] },


    // ============================================================
    // DIFICULTAD: FÁCIL (TIER 1 DROPS)
    // ============================================================
    // BOSQUE
    mini_alpha_wolf: { name: "Lobo Alfa", hp: 800, damage: 25, speed: 1.3, armor: 10, drops: [['hide', 1.0, 2, 4], ['copper', 0.5, 2, 4]] },
    mini_giant_boar: { name: "Gran Jabalí", hp: 1200, damage: 20, speed: 0.8, armor: 15, drops: [['hide', 1.0, 2, 3], ['wood', 0.5, 5, 10]] },
    mini_goblin_chief: { name: "Jefe Goblin", hp: 900, damage: 30, speed: 1.1, armor: 5, drops: [['cloth_simple', 1.0, 3, 5], ['copper', 0.8, 2, 4]] },
    mini_spider: { name: "Araña Gigante", hp: 700, damage: 35, speed: 1.2, armor: 5, drops: [['cloth_simple', 1.0, 4, 6], ['wood', 0.5, 3, 5]] },
    boss_rasta: { name: "Rasta, el Oso", hp: 4000, damage: 60, speed: 0.6, armor: 30, drops: [['leather', 1.0, 1, 2], ['gold_ore', 0.5, 1, 3], ['copper', 1.0, 10, 20]] },
    boss_queen_spider: { name: "Reina Arácnida", hp: 6000, damage: 80, speed: 0.9, armor: 20, drops: [['cloth_simple', 1.0, 10, 15], ['wood', 1.0, 10, 20], ['sapphire_uncut', 0.5, 1, 1]] },

    // MONTAÑA
    mini_bandit_leader: { name: "Jefe Bandido", hp: 900, damage: 30, speed: 1.1, armor: 15, drops: [['copper', 1.0, 3, 6], ['leather', 0.5, 2, 4]] },
    mini_stone_guard: { name: "Guardia de Piedra", hp: 1200, damage: 25, speed: 0.5, armor: 30, drops: [['copper', 1.0, 4, 8], ['wood', 0.3, 2, 4]] },
    mini_harpy_matriarch: { name: "Matriarca Arpía", hp: 800, damage: 35, speed: 1.4, armor: 5, flying: true, drops: [['cloth_simple', 1.0, 3, 6], ['copper', 0.5, 2, 3]] },
    mini_dwarf_foreman: { name: "Capataz Enano", hp: 1000, damage: 30, speed: 0.7, armor: 20, drops: [['copper', 1.0, 5, 10], ['wood', 0.5, 2, 4]] },
    boss_bandit_king: { name: "Rey de los Bandidos", hp: 4500, damage: 70, speed: 1.0, armor: 25, drops: [['copper', 1.0, 10, 15], ['leather', 1.0, 5, 10], ['silver', 1.0, 5, 10]] },
    boss_golem_sentry: { name: "Centinela Golem", hp: 6500, damage: 90, speed: 0.3, armor: 50, drops: [['copper', 1.0, 15, 20], ['wood', 0.5, 5, 10]] },

    // VOLCÁN
    mini_fire_lord: { name: "Señor de Ceniza", hp: 850, damage: 35, speed: 0.9, armor: 10, drops: [['coal', 1.0, 5, 10], ['wood', 0.5, 5, 10]] },
    mini_magma_slime: { name: "Slime de Magma", hp: 700, damage: 25, speed: 0.7, armor: 5, drops: [['coal', 1.0, 4, 8], ['copper', 0.5, 2, 4]] },
    mini_imp_overlord: { name: "Jefe Diablillo", hp: 600, damage: 40, speed: 1.4, armor: 0, drops: [['cloth_simple', 1.0, 3, 6], ['coal', 0.5, 5, 8]] },
    mini_hellhound: { name: "Perro del Infierno", hp: 900, damage: 45, speed: 1.3, armor: 10, drops: [['leather', 1.0, 2, 4], ['coal', 0.5, 3, 6]] },
    boss_pyro: { name: "Piromante Loco", hp: 4000, damage: 80, speed: 0.8, armor: 15, drops: [['cloth_simple', 1.0, 10, 15], ['coal', 1.0, 15, 20]] },
    boss_cerberus: { name: "Cerbero", hp: 5000, damage: 70, speed: 1.1, armor: 25, drops: [['leather', 1.0, 5, 10], ['copper', 1.0, 10, 15]] },


    // ============================================================
    // DIFICULTAD: NORMAL (TIER 2 DROPS)
    // ============================================================
    // BOSQUE
    mini_treant: { name: "Guardián Treant", hp: 2000, damage: 50, speed: 0.4, armor: 40, drops: [['cedar', 1.0, 3, 6], ['iron', 0.5, 2, 4]] },
    mini_dire_wolf: { name: "Lobo Huargo", hp: 1800, damage: 60, speed: 1.4, armor: 20, drops: [['leather_rigid', 1.0, 2, 4], ['iron', 0.3, 2, 4]] },
    mini_druid: { name: "Druida Oscuro", hp: 1500, damage: 70, speed: 0.8, armor: 10, healer: true, drops: [['cloth_fine', 1.0, 3, 5], ['cedar', 0.5, 2, 4]] },
    mini_bear_king: { name: "Rey Oso", hp: 3000, damage: 55, speed: 0.6, armor: 50, drops: [['leather_rigid', 1.0, 3, 5], ['iron', 0.5, 3, 5]] },
    boss_king_spider: { name: "Rey Arácnido", hp: 8000, damage: 100, speed: 0.9, armor: 50, drops: [['cloth_fine', 1.0, 3, 6], ['leather_rigid', 0.5, 1, 2]] },
    boss_forest_drake: { name: "Draco del Bosque", hp: 12000, damage: 150, speed: 1.0, armor: 70, flying: true, drops: [['leather_rigid', 1.0, 5, 10], ['cloth_fine', 1.0, 1, 2]] },

    // MONTAÑA
    mini_golem_steel: { name: "Golem de Acero", hp: 2500, damage: 60, speed: 0.3, armor: 60, drops: [['iron', 1.0, 4, 8], ['coal', 1.0, 5, 10]] },
    mini_rock_lord: { name: "Señor de la Roca", hp: 3000, damage: 70, speed: 0.4, armor: 70, drops: [['iron', 1.0, 5, 10], ['cedar', 0.3, 2, 4]] },
    mini_griffin: { name: "Grifo", hp: 2000, damage: 80, speed: 1.3, armor: 30, flying: true, drops: [['leather_rigid', 1.0, 3, 5], ['iron', 0.5, 2, 4]] },
    mini_cyclops: { name: "Cíclope", hp: 3500, damage: 100, speed: 0.5, armor: 40, drops: [['leather_rigid', 1.0, 4, 6], ['iron', 0.5, 3, 6]] },
    boss_andres: { name: "Andrés, el Troll", hp: 12000, damage: 150, speed: 0.7, armor: 60, drops: [['iron', 1.0, 10, 20], ['leather_rigid', 1.0, 5, 10], ['mithril', 0.3, 1, 3]] },
    boss_titan_construct: { name: "Constructo Titán", hp: 15000, damage: 180, speed: 0.3, armor: 100, drops: [['iron', 1.0, 20, 30], ['coal', 1.0, 10, 20]] },

    // VOLCÁN
    mini_demon_guard: { name: "Guardia Demonio", hp: 2200, damage: 55, speed: 0.9, armor: 30, drops: [['leather_rigid', 1.0, 2, 4], ['gold_ore', 0.3, 1, 2]] },
    mini_lava_golem: { name: "Golem de Lava", hp: 3000, damage: 65, speed: 0.4, armor: 60, drops: [['iron', 1.0, 5, 10], ['coal', 1.0, 10, 20]] },
    mini_nightmare: { name: "Pesadilla", hp: 2500, damage: 80, speed: 1.3, armor: 20, flying: true, drops: [['cloth_fine', 1.0, 3, 5], ['iron', 0.3, 2, 4]] },
    mini_succubus_mistress: { name: "Ama Súcubo", hp: 2000, damage: 90, speed: 1.1, armor: 20, drops: [['cloth_fine', 1.0, 4, 6], ['gold_ore', 0.5, 1, 2]] },
    boss_ifrit: { name: "Ifrit", hp: 12000, damage: 180, speed: 0.8, armor: 50, drops: [['iron', 1.0, 10, 20], ['coal', 1.0, 20, 40], ['gold_ore', 0.5, 2, 4]] },
    boss_balrog: { name: "Balrog", hp: 15000, damage: 200, speed: 0.6, armor: 80, drops: [['leather_rigid', 1.0, 10, 15], ['iron', 1.0, 10, 20]] },


    // ============================================================
    // DIFICULTAD: DIFÍCIL (TIER 3 DROPS)
    // ============================================================
    // BOSQUE
    mini_elder_ent: { name: "Ent Ancestral", hp: 5000, damage: 120, speed: 0.3, armor: 100, drops: [['plank_ebony', 1.0, 2, 4], ['cedar', 1.0, 10, 20]] },
    mini_chimera: { name: "Quimera", hp: 4500, damage: 150, speed: 1.1, armor: 60, drops: [['leather_dragon', 1.0, 1, 2], ['ingot_steel', 0.5, 2, 4]] },
    mini_elf_lord: { name: "Señor Elfo", hp: 4000, damage: 200, speed: 1.5, armor: 40, drops: [['cloth_royal', 1.0, 2, 4], ['plank_ebony', 0.5, 2, 4]] },
    mini_basilisk: { name: "Basilisco", hp: 6000, damage: 130, speed: 0.7, armor: 120, drops: [['leather_dragon', 1.0, 2, 3], ['ingot_steel', 0.5, 3, 5]] },
    boss_forest_draco: { name: "Dragón del Bosque", hp: 20000, damage: 200, speed: 1.0, armor: 100, flying: true, drops: [['scale', 1.0, 5, 10], ['gold_ore', 1.0, 2, 4]] },
    boss_ancient_treant: { name: "Avatar de Gaia", hp: 40000, damage: 300, speed: 0.3, armor: 150, drops: [['plank_ebony', 1.0, 5, 10], ['scale', 1.0, 2, 4]] },

    // MONTAÑA
    mini_obsidian_golem: { name: "Golem Obsidiana", hp: 6000, damage: 120, speed: 0.3, armor: 150, drops: [['ingot_steel', 1.0, 2, 4], ['mithril', 0.5, 1, 2]] },
    mini_storm_giant: { name: "Gigante de Tormenta", hp: 7000, damage: 200, speed: 0.6, armor: 80, drops: [['ingot_steel', 1.0, 3, 5], ['leather_dragon', 0.5, 1, 2]] },
    mini_wyvern: { name: "Guiverno", hp: 5000, damage: 180, speed: 1.2, armor: 50, flying: true, drops: [['leather_dragon', 1.0, 2, 4], ['ingot_steel', 0.3, 2, 4]] },
    mini_dark_paladin: { name: "Paladín Oscuro", hp: 5500, damage: 150, speed: 0.8, armor: 120, drops: [['ingot_steel', 1.0, 4, 6], ['cloth_royal', 0.5, 2, 4]] },
    boss_mountain_king: { name: "Rey de la Montaña", hp: 45000, damage: 450, speed: 0.6, armor: 200, drops: [['mithril', 1.0, 10, 20], ['ingot_steel', 1.0, 10, 20], ['diamond_uncut', 1.0, 2, 4]] },
    boss_titan: { name: "Titán del Caos", hp: 80000, damage: 600, speed: 0.3, armor: 300, drops: [['diamond_uncut', 1.0, 3, 5], ['mithril', 1.0, 20, 40], ['leather_dragon', 1.0, 10, 20]] },

    // VOLCÁN
    mini_succubus_queen: { name: "Reina Súcubo", hp: 4500, damage: 150, speed: 1.2, armor: 50, flying: true, drops: [['cloth_royal', 1.0, 2, 4], ['ruby_uncut', 0.5, 1, 2]] },
    mini_pit_lord: { name: "Señor del Foso", hp: 6000, damage: 250, speed: 0.7, armor: 100, drops: [['ingot_steel', 1.0, 3, 6], ['leather_dragon', 0.5, 1, 2]] },
    mini_phoenix: { name: "Fénix Oscuro", hp: 5000, damage: 200, speed: 1.4, armor: 40, flying: true, drops: [['cloth_royal', 1.0, 3, 5], ['gold_ore', 1.0, 2, 4]] },
    mini_red_dragon_spawn: { name: "Cría de Dragón", hp: 5500, damage: 180, speed: 1.0, armor: 80, drops: [['scale', 1.0, 1, 2], ['leather_dragon', 1.0, 1, 2]] },
    boss_dragon: { name: "Dragón Ancestral", hp: 40000, damage: 500, speed: 0.5, armor: 200, flying: true, drops: [['scale', 1.0, 10, 20], ['gold_ore', 1.0, 20, 50], ['diamond_uncut', 1.0, 2, 4]] },
    boss_surtur: { name: "Surtur el Destructor", hp: 60000, damage: 700, speed: 0.4, armor: 250, drops: [['ingot_steel', 1.0, 20, 30], ['mithril', 1.0, 10, 20], ['diamond_uncut', 1.0, 3, 5]] }
};

export const BIOME_ENEMIES = {
    forest: {
        tiers: [
            ['slime', 'goblin'], 
            ['wolf', 'boar', 'goblin'], 
            ['eagle', 'ent', 'shaman', 'wolf']
        ],
        easy: {
            miniBosses: ['mini_alpha_wolf', 'mini_giant_boar', 'mini_goblin_chief', 'mini_spider'],
            bosses: { 5: 'boss_rasta', 10: 'boss_queen_spider' }
        },
        normal: {
            miniBosses: ['mini_treant', 'mini_dire_wolf', 'mini_druid', 'mini_bear_king'],
            bosses: { 5: 'boss_king_spider', 10: 'boss_forest_drake' }
        },
        hard: {
            miniBosses: ['mini_elder_ent', 'mini_chimera', 'mini_elf_lord', 'mini_basilisk'],
            bosses: { 5: 'boss_forest_draco', 10: 'boss_ancient_treant' }
        }
    },
    mountain: {
        tiers: [
            ['bandit', 'miner_dwarf'],
            ['rock_elemental', 'harpy', 'bandit'],
            ['golem_copper', 'harpy', 'rock_elemental']
        ],
        easy: {
            miniBosses: ['mini_bandit_leader', 'mini_stone_guard', 'mini_harpy_matriarch', 'mini_dwarf_foreman'],
            bosses: { 5: 'boss_bandit_king', 10: 'boss_golem_sentry' }
        },
        normal: {
            miniBosses: ['mini_golem_steel', 'mini_rock_lord', 'mini_griffin', 'mini_cyclops'],
            bosses: { 5: 'boss_andres', 10: 'boss_titan_construct' }
        },
        hard: {
            miniBosses: ['mini_obsidian_golem', 'mini_storm_giant', 'mini_wyvern', 'mini_dark_paladin'],
            bosses: { 5: 'boss_mountain_king', 10: 'boss_titan' }
        }
    },
    volcano: {
        tiers: [
            ['fire_imp', 'magma_cube'],
            ['fire_elemental', 'succubus', 'fire_imp'],
            ['fire_elemental', 'succubus', 'magma_cube']
        ],
        easy: {
            miniBosses: ['mini_fire_lord', 'mini_magma_slime', 'mini_imp_overlord', 'mini_hellhound'],
            bosses: { 5: 'boss_pyro', 10: 'boss_cerberus' }
        },
        normal: {
            miniBosses: ['mini_demon_guard', 'mini_lava_golem', 'mini_nightmare', 'mini_succubus_mistress'],
            bosses: { 5: 'boss_ifrit', 10: 'boss_balrog' }
        },
        hard: {
            miniBosses: ['mini_succubus_queen', 'mini_pit_lord', 'mini_phoenix', 'mini_red_dragon_spawn'],
            bosses: { 5: 'boss_dragon', 10: 'boss_surtur' }
        }
    }
};