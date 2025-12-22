// src/config/Materials.js

// Definimos los materiales crudos y sus equivalentes refinados
export const RAW_MATERIALS = {
    // MINERALES (Montaña, Volcán)
    copper: { name: "Mineral de Cobre", tier: 1, type: 'ore' },
    iron: { name: "Mineral de Hierro", tier: 2, type: 'ore' },
    coal: { name: "Carbón", tier: 2, type: 'ore' }, // Para acero
    mithril: { name: "Mineral de Mithril", tier: 3, type: 'ore' },

    // MADERAS (Bosque, Selva)
    wood: { name: "Tronco Común", tier: 1, type: 'wood' },
    cedar: { name: "Tronco de Cedro", tier: 2, type: 'wood' },
    ebony: { name: "Tronco de Ébano", tier: 3, type: 'wood' },

    // PIELES/TELAS (Bosque, Llanura)
    scraps: { name: "Retazos de Tela", tier: 1, type: 'cloth' },
    cotton: { name: "Algodón", tier: 2, type: 'cloth' },
    silk: { name: "Seda", tier: 3, type: 'cloth' },
    
    hide: { name: "Piel Raída", tier: 1, type: 'leather' },
    leather: { name: "Cuero Curtido", tier: 2, type: 'leather' },
    scale: { name: "Escamas Duras", tier: 3, type: 'leather' }
};

export const REFINED_MATERIALS = {
    // LINGOTES
    ingot_copper: { name: "Lingote de Cobre", tier: 1, type: 'ingot' },
    ingot_iron: { name: "Lingote de Hierro", tier: 2, type: 'ingot' },
    ingot_steel: { name: "Lingote de Acero", tier: 2.5, type: 'ingot' }, // Especial (Hierro + Carbón)
    ingot_mithril: { name: "Lingote de Mithril", tier: 3, type: 'ingot' },

    // TABLAS
    plank_wood: { name: "Tabla de Madera", tier: 1, type: 'plank' },
    plank_cedar: { name: "Tabla de Cedro", tier: 2, type: 'plank' },
    plank_ebony: { name: "Tabla de Ébano", tier: 3, type: 'plank' },

    // TELAS/CUEROS REFINADOS
    cloth_simple: { name: "Tela Simple", tier: 1, type: 'fabric' },
    cloth_fine: { name: "Tela Fina", tier: 2, type: 'fabric' },
    cloth_royal: { name: "Tela Real", tier: 3, type: 'fabric' },

    leather_simple: { name: "Cuero Simple", tier: 1, type: 'leather_ref' },
    leather_rigid: { name: "Cuero Rígido", tier: 2, type: 'leather_ref' },
    leather_dragon: { name: "Cuero de Dragón", tier: 3, type: 'leather_ref' }
};