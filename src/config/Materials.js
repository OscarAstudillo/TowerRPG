// src/config/Materials.js

export const RAW_MATERIALS = {
    // --- TIER 1 (Bosque / Básico) ---
    wood: { name: "Madera", tier: 1, type: "wood", desc: "Tronco común." },
    hide: { name: "Piel", tier: 1, type: "leather", desc: "Piel de animal." },
    copper: { name: "Cobre", tier: 1, type: "ore", desc: "Mineral rojizo básico." },
    scraps: { name: "Retales", tier: 1, type: "cloth", desc: "Telas viejas." },
    coal: { name: "Carbón", tier: 1, type: "ore", desc: "Combustible fósil." },

    // --- TIER 2 (Montaña / Intermedio) ---
    cedar: { name: "Cedro", tier: 2, type: "wood", desc: "Madera aromática." },
    leather: { name: "Cuero", tier: 2, type: "leather", desc: "Piel curtida." },
    iron: { name: "Hierro", tier: 2, type: "ore", desc: "Metal estándar." },
    silver: { name: "Plata", tier: 2, type: "ore", desc: "Metal brillante y puro." }, // NUEVO
    cotton: { name: "Algodón", tier: 2, type: "cloth", desc: "Suave y ligero." },
    ruby_uncut: { name: "Rubí Bruto", tier: 2, type: "gem", desc: "Gema roja sin pulir." }, // NUEVO

    // --- TIER 3 (Volcán / Avanzado) ---
    ebony: { name: "Ébano", tier: 3, type: "wood", desc: "Madera negra dura." },
    scale: { name: "Escama", tier: 3, type: "leather", desc: "Escama de dragón." },
    mithril: { name: "Mithril", tier: 3, type: "ore", desc: "Metal legendario." },
    gold_ore: { name: "Mena de Oro", tier: 3, type: "ore", desc: "Mineral precioso." }, // NUEVO
    silk: { name: "Seda", tier: 3, type: "cloth", desc: "Tela fina y resistente." },
    sapphire_uncut: { name: "Zafiro Bruto", tier: 3, type: "gem", desc: "Gema azul sin pulir." }, // NUEVO
    diamond_uncut: { name: "Diamante Bruto", tier: 3, type: "gem", desc: "La gema más dura." } // NUEVO
};

export const REFINED_MATERIALS = {
    // --- MADERAS ---
    plank_wood: { name: "Tablón Madera", tier: 1, type: "wood" },
    plank_cedar: { name: "Tablón Cedro", tier: 2, type: "wood" },
    plank_ebony: { name: "Tablón Ébano", tier: 3, type: "wood" },
    
    // --- METALES ---
    ingot_copper: { name: "Lingote Cobre", tier: 1, type: "ore" },
    ingot_iron: { name: "Lingote Hierro", tier: 2, type: "ore" },
    ingot_silver: { name: "Lingote Plata", tier: 2, type: "ore" }, // NUEVO
    ingot_steel: { name: "Acero", tier: 2, type: "ore" },
    ingot_mithril: { name: "Lingote Mithril", tier: 3, type: "ore" },
    ingot_gold: { name: "Lingote Oro", tier: 3, type: "ore" }, // NUEVO
    
    // --- GEMAS ---
    ruby_cut: { name: "Rubí Tallado", tier: 2, type: "gem" }, // NUEVO
    sapphire_cut: { name: "Zafiro Tallado", tier: 3, type: "gem" }, // NUEVO
    diamond_cut: { name: "Diamante Tallado", tier: 3, type: "gem" }, // NUEVO

    // --- PIELES ---
    leather_simple: { name: "Cuero Simple", tier: 1, type: "leather" },
    leather_rigid: { name: "Cuero Rígido", tier: 2, type: "leather" },
    leather_dragon: { name: "Cuero Dragón", tier: 3, type: "leather" },
    
    // --- TELAS ---
    cloth_simple: { name: "Tela Simple", tier: 1, type: "cloth" },
    cloth_fine: { name: "Tela Fina", tier: 2, type: "cloth" },
    cloth_royal: { name: "Tela Real", tier: 3, type: "cloth" }
};