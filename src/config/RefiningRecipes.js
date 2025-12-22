// src/config/RefiningRecipes.js
export const REFINING_RECIPES = [
    // --- MINERALES ---
    { id: 'ref_copper', name: "Fundir Cobre", input: { copper: 2 }, output: 'ingot_copper', profLevel: 1 },
    { id: 'ref_iron', name: "Fundir Hierro", input: { iron: 2 }, output: 'ingot_iron', profLevel: 10 },
    { id: 'ref_steel', name: "Aleación de Acero", input: { iron: 3, coal: 2 }, output: 'ingot_steel', profLevel: 20 },
    { id: 'ref_mithril', name: "Fundir Mithril", input: { mithril: 2 }, output: 'ingot_mithril', profLevel: 40 },

    // --- MADERAS ---
    { id: 'ref_wood', name: "Cortar Tablas", input: { wood: 2 }, output: 'plank_wood', profLevel: 1 },
    { id: 'ref_cedar', name: "Cortar Cedro", input: { cedar: 2 }, output: 'plank_cedar', profLevel: 10 },
    { id: 'ref_ebony', name: "Cortar Ébano", input: { ebony: 2 }, output: 'plank_ebony', profLevel: 30 },

    // --- TELAS ---
    { id: 'ref_scraps', name: "Coser Tela", input: { scraps: 2 }, output: 'cloth_simple', profLevel: 1 },
    { id: 'ref_cotton', name: "Tejer Algodón", input: { cotton: 2 }, output: 'cloth_fine', profLevel: 10 },
    { id: 'ref_silk', name: "Tejer Seda", input: { silk: 2 }, output: 'cloth_royal', profLevel: 30 },

    // --- CUEROS ---
    { id: 'ref_hide', name: "Tratar Piel", input: { hide: 2 }, output: 'leather_simple', profLevel: 1 },
    { id: 'ref_leather', name: "Tratar Cuero", input: { leather: 2 }, output: 'leather_rigid', profLevel: 10 },
    { id: 'ref_scale', name: "Tratar Escamas", input: { scale: 2 }, output: 'leather_dragon', profLevel: 30 }
];