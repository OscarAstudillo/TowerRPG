// src/config/TowerStats.js

export const TOWER_TYPES = {
    archer: {
        name: "Torre Arquero",
        baseCost: 100,
        color: 0x00ff00,
        projectileColor: 0x00ff00,
        levels: [
            { damage: 25, range: 230, fireRate: 650, upgradeCost: 150 },
            { damage: 40, range: 250, fireRate: 550, upgradeCost: 250 },
            { damage: 55, range: 270, fireRate: 450, upgradeCost: 400 },
            { damage: 70, range: 290, fireRate: 350, upgradeCost: 600 },
            { damage: 100, range: 400, fireRate: 250, upgradeCost: 0 }
        ]
    },
    cannon: {
        name: "Cañón Pesado",
        baseCost: 250,
        color: 0x696969,
        projectileColor: 0xff4500,
        // --- CAMBIO: RANGO AUMENTADO UN 20% ---
        levels: [
            { damage: 15, range: 400, fireRate: 2000, aoe: 120, upgradeCost: 300 }, // Antes 150
            { damage: 25, range: 500, fireRate: 1900, aoe: 160, upgradeCost: 450 }, // Antes 160
            { damage: 35, range: 600, fireRate: 1800, aoe: 200, upgradeCost: 650 }, // Antes 180
            { damage: 45, range: 700, fireRate: 1700, aoe: 240, upgradeCost: 900 }, // Antes 200
            { damage: 85, range: 900, fireRate: 1500, aoe: 300, upgradeCost: 0 }    // Antes 250
        ]
    },
    mage: {
        name: "Torre Mágica",
        baseCost: 180,
        color: 0x0000ff,
        projectileColor: 0x00ffff,
        levels: [
            { damage: 40, range: 200, fireRate: 1100, chain: false, upgradeCost: 200 },
            { damage: 55, range: 220, fireRate: 1050, chain: false, upgradeCost: 350 },
            { damage: 70, range: 250, fireRate: 1000, chain: true, upgradeCost: 550 },
            { damage: 85, range: 280, fireRate: 950, chain: true, upgradeCost: 800 },
            { damage: 130, range: 390, fireRate: 900, chain: true, upgradeCost: 0 }
        ]
    }
};