// src/config/TowerStats.js

export const TOWER_TYPES = {
    archer: {
        name: "Torre de Arqueros",
        description: "Dispara flechas rápidas. Buen daño a un solo objetivo.",
        baseCost: 100,
        color: 0x00ff00,
        type: 'physical',
        levels: [
            { level: 1, damage: 10, range: 450, fireRate: 800, upgradeCost: 80 },
            { level: 2, damage: 15, range: 510, fireRate: 750, upgradeCost: 120 },
            { level: 3, damage: 22, range: 570, fireRate: 700, upgradeCost: 200 },
            { level: 4, damage: 32, range: 630, fireRate: 650, upgradeCost: 320 }, // NUEVO
            { level: 5, damage: 45, range: 690, fireRate: 600, upgradeCost: 500 }  // NUEVO
        ],
        evolutions: {
            pathA: { key: 'sniper', name: "Francotirador", cost: 750, color: 0x006400, stats: { damage: 150, range: 1200, fireRate: 1500, effect: { type: 'crit', chance: 0.3 } } }, // Costo ajustado
            pathB: { key: 'gatling', name: "Ametralladora", cost: 750, color: 0x32cd32, stats: { damage: 15, range: 550, fireRate: 150, effect: null } }
        }
    },
    cannon: {
        name: "Torre de Cañón",
        description: "Daño en área explosivo. Lento pero letal para grupos.",
        baseCost: 150,
        color: 0xff0000,
        type: 'physical',
        levels: [
            { level: 1, damage: 25, range: 360, fireRate: 1500, aoe: 60, upgradeCost: 100 },
            { level: 2, damage: 35, range: 390, fireRate: 1400, aoe: 70, upgradeCost: 150 },
            { level: 3, damage: 50, range: 420, fireRate: 1300, aoe: 80, upgradeCost: 250 },
            { level: 4, damage: 75, range: 450, fireRate: 1200, aoe: 90, upgradeCost: 400 }, // NUEVO
            { level: 5, damage: 110, range: 480, fireRate: 1100, aoe: 100, upgradeCost: 650 } // NUEVO
        ],
        evolutions: {
            pathA: { key: 'missile', name: "Lanzamisiles", cost: 850, color: 0x8b0000, stats: { damage: 200, range: 800, fireRate: 1800, aoe: 50 } }, 
            pathB: { key: 'bigbertha', name: "Gran Bertha", cost: 900, color: 0xff4500, stats: { damage: 180, range: 500, fireRate: 1500, aoe: 180 } } 
        }
    },
    mage: {
        name: "Torre Arcana",
        description: "Lanza rayos mágicos que atraviesan armadura ligera.",
        baseCost: 120,
        color: 0x0000ff,
        type: 'magic',
        levels: [
            { level: 1, damage: 15, range: 420, fireRate: 1000, upgradeCost: 90 },
            { level: 2, damage: 25, range: 480, fireRate: 950, upgradeCost: 140 },
            { level: 3, damage: 40, range: 540, fireRate: 900, upgradeCost: 220 },
            { level: 4, damage: 65, range: 600, fireRate: 850, upgradeCost: 350 }, // NUEVO
            { level: 5, damage: 95, range: 660, fireRate: 800, upgradeCost: 550 }  // NUEVO
        ],
        evolutions: {
            pathA: { key: 'fire', name: "Piromante", cost: 800, color: 0xff8c00, stats: { damage: 70, range: 660, fireRate: 850, effect: { type: 'burn', val: 15, duration: 4000 } } },
            pathB: { key: 'ice', name: "Criomante", cost: 800, color: 0x00ffff, stats: { damage: 50, range: 660, fireRate: 850, effect: { type: 'slow', val: 0.5, duration: 3000 } } }
        }
    },
    tesla: {
        name: "Torre Tesla",
        description: "Lanza rayos que saltan entre enemigos cercanos.",
        baseCost: 180,
        color: 0xffff00,
        type: 'magic',
        levels: [
            { level: 1, damage: 12, range: 390, fireRate: 900, upgradeCost: 110, effect: { type: 'chain', val: 1 } },
            { level: 2, damage: 18, range: 420, fireRate: 850, upgradeCost: 160, effect: { type: 'chain', val: 2 } },
            { level: 3, damage: 26, range: 450, fireRate: 800, upgradeCost: 240, effect: { type: 'chain', val: 3 } },
            { level: 4, damage: 38, range: 480, fireRate: 750, upgradeCost: 380, effect: { type: 'chain', val: 4 } }, // NUEVO
            { level: 5, damage: 55, range: 510, fireRate: 700, upgradeCost: 600, effect: { type: 'chain', val: 5 } }  // NUEVO
        ],
        evolutions: {
            pathA: { key: 'superconductor', name: "Superconductor", cost: 950, color: 0xffd700, stats: { damage: 80, range: 550, fireRate: 700, effect: { type: 'chain', val: 7, duration: 0 } } }, 
            pathB: { key: 'static', name: "Campo Estático", cost: 900, color: 0xb8860b, stats: { damage: 30, range: 450, fireRate: 200, effect: { type: 'stun', val: 0.1, duration: 500 } } } 
        }
    },
    poison: {
        name: "Alquimista",
        description: "Lanza frascos de ácido que dañan en el tiempo.",
        baseCost: 130,
        color: 0x006400, 
        type: 'chemical',
        levels: [
            { level: 1, damage: 5, range: 420, fireRate: 1500, aoe: 60, upgradeCost: 90, effect: { type: 'poison', val: 3, duration: 3000 } },
            { level: 2, damage: 8, range: 450, fireRate: 1400, aoe: 70, upgradeCost: 130, effect: { type: 'poison', val: 5, duration: 4000 } },
            { level: 3, damage: 12, range: 480, fireRate: 1300, aoe: 80, upgradeCost: 210, effect: { type: 'poison', val: 8, duration: 5000 } },
            { level: 4, damage: 18, range: 510, fireRate: 1200, aoe: 90, upgradeCost: 340, effect: { type: 'poison', val: 12, duration: 6000 } }, // NUEVO
            { level: 5, damage: 25, range: 540, fireRate: 1100, aoe: 100, upgradeCost: 520, effect: { type: 'poison', val: 18, duration: 7000 } } // NUEVO
        ],
        evolutions: {
            pathA: { key: 'venom', name: "Veneno Letal", cost: 850, color: 0x7cfc00, stats: { damage: 45, range: 600, fireRate: 1100, aoe: 110, effect: { type: 'poison', val: 35, duration: 8000 } } },
            pathB: { key: 'acid', name: "Ácido", cost: 820, color: 0x556b2f, stats: { damage: 35, range: 550, fireRate: 1100, aoe: 100, effect: { type: 'armor_break', val: 10, duration: 6000 } } } 
        }
    },
    quake: {
        name: "Torre Sísmica",
        description: "Golpea el suelo dañando a todos los enemigos cercanos.",
        baseCost: 200,
        color: 0x8b4513, 
        type: 'physical',
        levels: [
            { level: 1, damage: 40, range: 240, fireRate: 2000, aoe: 240, upgradeCost: 150, effect: { type: 'chance_stun', chance: 0.20, duration: 1000 } }, 
            { level: 2, damage: 60, range: 255, fireRate: 1900, aoe: 255, upgradeCost: 200, effect: { type: 'chance_stun', chance: 0.25, duration: 1200 } },
            { level: 3, damage: 90, range: 270, fireRate: 1800, aoe: 270, upgradeCost: 300, effect: { type: 'chance_stun', chance: 0.30, duration: 1500 } },
            { level: 4, damage: 130, range: 285, fireRate: 1700, aoe: 285, upgradeCost: 450, effect: { type: 'chance_stun', chance: 0.35, duration: 1700 } }, // NUEVO
            { level: 5, damage: 180, range: 300, fireRate: 1600, aoe: 300, upgradeCost: 700, effect: { type: 'chance_stun', chance: 0.40, duration: 2000 } }  // NUEVO
        ],
        evolutions: {
            pathA: { key: 'eruption', name: "Erupción", cost: 1000, color: 0xff4500, stats: { damage: 300, range: 350, fireRate: 1600, aoe: 350, effect: { type: 'burn', val: 20, duration: 3000 } } }, 
            pathB: { key: 'fissure', name: "Fisura", cost: 950, color: 0xcd853f, stats: { damage: 200, range: 380, fireRate: 1500, aoe: 380, effect: { type: 'chance_stun', chance: 0.60, duration: 2500 } } } 
        }
    }
};