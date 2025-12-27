// src/config/TowerStats.js

export const TOWER_TYPES = {
    archer: {
        name: "Torre de Arqueros",
        description: "Dispara flechas rápidas. Buen daño a un solo objetivo.",
        baseCost: 100,
        color: 0x00ff00,
        type: 'physical',
        levels: [
            { level: 1, damage: 10, range: 150, fireRate: 800, upgradeCost: 80 },
            { level: 2, damage: 15, range: 170, fireRate: 750, upgradeCost: 120 },
            { level: 3, damage: 22, range: 190, fireRate: 700, upgradeCost: 200 }
        ],
        evolutions: {
            pathA: { key: 'sniper', name: "Francotirador", cost: 350, color: 0x006400, stats: { damage: 80, range: 400, fireRate: 1500, effect: { type: 'crit', chance: 0.3 } } },
            pathB: { key: 'gatling', name: "Ametralladora", cost: 350, color: 0x32cd32, stats: { damage: 8, range: 160, fireRate: 200, effect: null } }
        }
    },
    cannon: {
        name: "Torre de Cañón",
        description: "Daño en área explosivo. Lento pero letal para grupos.",
        baseCost: 150,
        color: 0xff0000,
        type: 'physical',
        levels: [
            { level: 1, damage: 25, range: 120, fireRate: 1500, aoe: 60, upgradeCost: 100 },
            { level: 2, damage: 35, range: 130, fireRate: 1400, aoe: 70, upgradeCost: 150 },
            { level: 3, damage: 50, range: 140, fireRate: 1300, aoe: 80, upgradeCost: 250 }
        ],
        evolutions: {
            pathA: { key: 'missile', name: "Lanzamisiles", cost: 450, color: 0x8b0000, stats: { damage: 100, range: 250, fireRate: 1800, aoe: 40 } }, // Menos AoE, más rango/daño
            pathB: { key: 'bigbertha', name: "Gran Bertha", cost: 500, color: 0xff4500, stats: { damage: 80, range: 140, fireRate: 1500, aoe: 120 } } // Masivo AoE
        }
    },
    mage: {
        name: "Torre Arcana",
        description: "Lanza rayos mágicos que atraviesan armadura ligera.",
        baseCost: 120,
        color: 0x0000ff,
        type: 'magic',
        levels: [
            { level: 1, damage: 15, range: 140, fireRate: 1000, upgradeCost: 90 },
            { level: 2, damage: 25, range: 160, fireRate: 950, upgradeCost: 140 },
            { level: 3, damage: 40, range: 180, fireRate: 900, upgradeCost: 220 }
        ],
        evolutions: {
            pathA: { key: 'fire', name: "Piromante", cost: 400, color: 0xff8c00, stats: { damage: 30, range: 180, fireRate: 900, effect: { type: 'burn', val: 5, duration: 3000 } } },
            pathB: { key: 'ice', name: "Criomante", cost: 400, color: 0x00ffff, stats: { damage: 20, range: 180, fireRate: 900, effect: { type: 'slow', val: 0.4, duration: 2000 } } }
        }
    },
    // --- NUEVAS TORRES ---
    tesla: {
        name: "Torre Tesla",
        description: "Lanza rayos que saltan entre enemigos cercanos.",
        baseCost: 180,
        color: 0xffff00,
        type: 'magic',
        levels: [
            { level: 1, damage: 12, range: 130, fireRate: 900, upgradeCost: 110 },
            { level: 2, damage: 18, range: 140, fireRate: 850, upgradeCost: 160 },
            { level: 3, damage: 26, range: 150, fireRate: 800, upgradeCost: 240 }
        ],
        evolutions: {
            pathA: { key: 'superconductor', name: "Superconductor", cost: 500, color: 0xffd700, stats: { damage: 35, range: 160, fireRate: 750, effect: { type: 'chain', val: 3, duration: 0 } } }, // 3 Saltos
            pathB: { key: 'static', name: "Campo Estático", cost: 450, color: 0xb8860b, stats: { damage: 15, range: 140, fireRate: 200, effect: { type: 'stun', val: 0.1, duration: 500 } } } // Micro-stuns rápidos
        }
    },
    poison: {
        name: "Alquimista",
        description: "Lanza frascos de ácido que dañan en el tiempo.",
        baseCost: 130,
        color: 0x006400, // Verde oscuro
        type: 'chemical',
        levels: [
            { level: 1, damage: 5, range: 140, fireRate: 1100, upgradeCost: 90, effect: { type: 'poison', val: 3, duration: 3000 } }, // 3dmg/tick
            { level: 2, damage: 8, range: 150, fireRate: 1050, upgradeCost: 130, effect: { type: 'poison', val: 5, duration: 4000 } },
            { level: 3, damage: 12, range: 160, fireRate: 1000, upgradeCost: 210, effect: { type: 'poison', val: 8, duration: 5000 } }
        ],
        evolutions: {
            pathA: { key: 'venom', name: "Veneno Letal", cost: 400, color: 0x7cfc00, stats: { damage: 20, range: 170, fireRate: 1000, effect: { type: 'poison', val: 20, duration: 6000 } } }, // Alto DoT
            pathB: { key: 'acid', name: "Ácido", cost: 420, color: 0x556b2f, stats: { damage: 15, range: 160, fireRate: 1000, effect: { type: 'armor_break', val: 5, duration: 5000 } } } // Reduce armadura
        }
    },
    quake: {
        name: "Torre Sísmica",
        description: "Golpea el suelo dañando a todos los enemigos cercanos.",
        baseCost: 200,
        color: 0x8b4513, // Marrón tierra
        type: 'physical',
        levels: [
            { level: 1, damage: 40, range: 80, fireRate: 2000, aoe: 80, upgradeCost: 150 }, // Rango = AoE (sin proyectil)
            { level: 2, damage: 60, range: 85, fireRate: 1900, aoe: 85, upgradeCost: 200 },
            { level: 3, damage: 90, range: 90, fireRate: 1800, aoe: 90, upgradeCost: 300 }
        ],
        evolutions: {
            pathA: { key: 'eruption', name: "Erupción", cost: 550, color: 0xff4500, stats: { damage: 150, range: 100, fireRate: 1800, aoe: 100, effect: { type: 'burn', val: 10, duration: 2000 } } },
            pathB: { key: 'fissure', name: "Fisura", cost: 500, color: 0xcd853f, stats: { damage: 80, range: 110, fireRate: 1500, aoe: 110, effect: { type: 'slow', val: 0.5, duration: 1500 } } }
        }
    }
};