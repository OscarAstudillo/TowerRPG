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
            { level: 3, damage: 22, range: 570, fireRate: 700, upgradeCost: 200 }
        ],
        evolutions: {
            pathA: { key: 'sniper', name: "Francotirador", cost: 350, color: 0x006400, stats: { damage: 80, range: 1200, fireRate: 1500, effect: { type: 'crit', chance: 0.3 } } },
            pathB: { key: 'gatling', name: "Ametralladora", cost: 350, color: 0x32cd32, stats: { damage: 8, range: 480, fireRate: 200, effect: null } }
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
            { level: 3, damage: 50, range: 420, fireRate: 1300, aoe: 80, upgradeCost: 250 }
        ],
        evolutions: {
            pathA: { key: 'missile', name: "Lanzamisiles", cost: 450, color: 0x8b0000, stats: { damage: 100, range: 750, fireRate: 1800, aoe: 40 } }, 
            pathB: { key: 'bigbertha', name: "Gran Bertha", cost: 500, color: 0xff4500, stats: { damage: 80, range: 420, fireRate: 1500, aoe: 150 } } 
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
            { level: 3, damage: 40, range: 540, fireRate: 900, upgradeCost: 220 }
        ],
        evolutions: {
            pathA: { key: 'fire', name: "Piromante", cost: 400, color: 0xff8c00, stats: { damage: 30, range: 540, fireRate: 900, effect: { type: 'burn', val: 5, duration: 3000 } } },
            pathB: { key: 'ice', name: "Criomante", cost: 400, color: 0x00ffff, stats: { damage: 20, range: 540, fireRate: 900, effect: { type: 'slow', val: 0.4, duration: 2000 } } }
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
            { level: 3, damage: 26, range: 450, fireRate: 800, upgradeCost: 240, effect: { type: 'chain', val: 3 } }
        ],
        evolutions: {
            pathA: { key: 'superconductor', name: "Superconductor", cost: 500, color: 0xffd700, stats: { damage: 35, range: 480, fireRate: 750, effect: { type: 'chain', val: 5, duration: 0 } } }, 
            pathB: { key: 'static', name: "Campo Estático", cost: 450, color: 0xb8860b, stats: { damage: 15, range: 420, fireRate: 200, effect: { type: 'stun', val: 0.1, duration: 500 } } } 
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
            { level: 3, damage: 12, range: 480, fireRate: 1300, aoe: 80, upgradeCost: 210, effect: { type: 'poison', val: 8, duration: 5000 } }
        ],
        evolutions: {
            pathA: { key: 'venom', name: "Veneno Letal", cost: 400, color: 0x7cfc00, stats: { damage: 20, range: 510, fireRate: 1200, aoe: 90, effect: { type: 'poison', val: 20, duration: 6000 } } },
            pathB: { key: 'acid', name: "Ácido", cost: 420, color: 0x556b2f, stats: { damage: 15, range: 480, fireRate: 1200, aoe: 80, effect: { type: 'armor_break', val: 5, duration: 5000 } } } 
        }
    },
    quake: {
        name: "Torre Sísmica",
        description: "Golpea el suelo dañando a todos los enemigos cercanos.",
        baseCost: 200,
        color: 0x8b4513, 
        type: 'physical',
        levels: [
            // AQUI AGREGAMOS LA PROBABILIDAD DE STUN (chance: 0.20 = 20%)
            { level: 1, damage: 40, range: 240, fireRate: 2000, aoe: 240, upgradeCost: 150, effect: { type: 'chance_stun', chance: 0.20, duration: 1000 } }, 
            { level: 2, damage: 60, range: 255, fireRate: 1900, aoe: 255, upgradeCost: 200, effect: { type: 'chance_stun', chance: 0.25, duration: 1200 } },
            { level: 3, damage: 90, range: 270, fireRate: 1800, aoe: 270, upgradeCost: 300, effect: { type: 'chance_stun', chance: 0.30, duration: 1500 } }
        ],
        evolutions: {
            pathA: { key: 'eruption', name: "Erupción", cost: 550, color: 0xff4500, stats: { damage: 150, range: 300, fireRate: 1800, aoe: 300, effect: { type: 'burn', val: 10, duration: 2000 } } }, // Erupción cambia a Fuego
            pathB: { key: 'fissure', name: "Fisura", cost: 500, color: 0xcd853f, stats: { damage: 80, range: 330, fireRate: 1500, aoe: 330, effect: { type: 'chance_stun', chance: 0.50, duration: 2000 } } } // Fisura mejora el Stun al 50%
        }
    }
};