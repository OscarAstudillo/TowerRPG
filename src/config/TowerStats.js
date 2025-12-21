// src/config/TowerStats.js

export const TOWER_TYPES = {
    archer: {
        name: "Torre de Arqueros",
        description: "Dispara flechas rápidas a un solo objetivo.",
        baseCost: 100,
        range: 150,
        damage: 15,
        attackSpeed: 800, // ms
        color: 0x00ff00, // Verde
        type: 'archer',
        // Niveles de mejora
        levels: [
            { damage: 15, range: 150, fireRate: 800, upgradeCost: 150 },
            { damage: 25, range: 160, fireRate: 700, upgradeCost: 250 },
            { damage: 40, range: 170, fireRate: 600, upgradeCost: 400 },
            { damage: 60, range: 180, fireRate: 500, upgradeCost: 600 },
            { damage: 100, range: 200, fireRate: 400, upgradeCost: 0 }
        ]
    },
    cannon: {
        name: "Torre de Cañón",
        description: "Daño en área (Explosión). Lento pero letal para grupos.",
        baseCost: 200,
        range: 120,
        damage: 30,
        attackSpeed: 2000,
        color: 0xff0000, // Rojo
        type: 'cannon',
        aoeRadius: 80, // Radio de explosión en pixeles
        levels: [
            { damage: 30, range: 120, fireRate: 2000, upgradeCost: 250, aoe: 80 },
            { damage: 50, range: 130, fireRate: 1900, upgradeCost: 350, aoe: 90 },
            { damage: 80, range: 140, fireRate: 1800, upgradeCost: 550, aoe: 100 },
            { damage: 120, range: 150, fireRate: 1700, upgradeCost: 800, aoe: 110 },
            { damage: 200, range: 160, fireRate: 1500, upgradeCost: 0, aoe: 130 }
        ]
    },
    mage: {
        name: "Torre de Mago",
        description: "Ralentiza a los enemigos con hielo.",
        baseCost: 150,
        range: 180,
        damage: 10,
        attackSpeed: 1200,
        color: 0x0000ff, // Azul
        type: 'mage',
        slowFactor: 0.5, // Reduce velocidad al 50%
        levels: [
            { damage: 10, range: 180, fireRate: 1200, upgradeCost: 200, slow: 0.5 },
            { damage: 15, range: 190, fireRate: 1100, upgradeCost: 300, slow: 0.45 },
            { damage: 25, range: 200, fireRate: 1000, upgradeCost: 500, slow: 0.4 },
            { damage: 40, range: 210, fireRate: 900, upgradeCost: 700, slow: 0.35 },
            { damage: 70, range: 230, fireRate: 800, upgradeCost: 0, slow: 0.3 }
        ]
    }
};