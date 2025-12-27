// src/config/RefiningRecipes.js

export const REFINING_RECIPES = [
    // --- MADERAS ---
    { id: 'ref_plank', name: 'Tablón', input: { wood: 2 }, output: 'plank_wood' },
    { id: 'ref_cedar', name: 'Tablón Cedro', input: { cedar: 2 }, output: 'plank_cedar' },
    { id: 'ref_ebony', name: 'Tablón Ébano', input: { ebony: 2 }, output: 'plank_ebony' },

    // --- METALES ---
    { id: 'ref_copper', name: 'Lingote Cobre', input: { copper: 2, coal: 1 }, output: 'ingot_copper' },
    { id: 'ref_iron', name: 'Lingote Hierro', input: { iron: 2, coal: 1 }, output: 'ingot_iron' },
    { id: 'ref_silver', name: 'Lingote Plata', input: { silver: 2, coal: 1 }, output: 'ingot_silver' }, // NUEVO
    { id: 'ref_steel', name: 'Lingote de Acero', input: { iron: 2, coal: 2 }, output: 'ingot_steel' },
    { id: 'ref_gold', name: 'Lingote Oro', input: { gold_ore: 2, coal: 1 }, output: 'ingot_gold' }, // NUEVO
    { id: 'ref_mithril', name: 'Lingote Mithril', input: { mithril: 2, coal: 2 }, output: 'ingot_mithril' },

    // --- GEMAS (NUEVO) ---
    { id: 'ref_ruby', name: 'Tallar Rubí', input: { ruby_uncut: 1 }, output: 'ruby_cut' },
    { id: 'ref_sapphire', name: 'Tallar Zafiro', input: { sapphire_uncut: 1 }, output: 'sapphire_cut' },
    { id: 'ref_diamond', name: 'Tallar Diamante', input: { diamond_uncut: 1 }, output: 'diamond_cut' },

    // --- CUEROS ---
    { id: 'ref_leather', name: 'Cuero Simple', input: { hide: 2 }, output: 'leather_simple' },
    { id: 'ref_leather2', name: 'Cuero Rígido', input: { leather: 2 }, output: 'leather_rigid' },
    { id: 'ref_dragon', name: 'Cuero Dragón', input: { scale: 2 }, output: 'leather_dragon' },

    // --- TELAS ---
    { id: 'ref_cloth', name: 'Tela Simple', input: { scraps: 3 }, output: 'cloth_simple' },
    { id: 'ref_fine', name: 'Tela Fina', input: { cotton: 3 }, output: 'cloth_fine' },
    { id: 'ref_royal', name: 'Tela Real', input: { silk: 3 }, output: 'cloth_royal' }
];