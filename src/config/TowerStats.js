// src/config/TowerStats.js

export const TOWER_TYPES = {
    archer: {
        name: "Torre de Arqueros",
        description: "Equilibrada y eficaz.",
        baseCost: 100,
        color: 0x00ff00,
        type: 'archer',
        levels: [
            { damage: 15, range: 180, fireRate: 800, upgradeCost: 150 }, // Lv1
            { damage: 25, range: 190, fireRate: 700, upgradeCost: 250 }, // Lv2
            { damage: 40, range: 200, fireRate: 600, upgradeCost: 400 }  // Lv3 (Max base)
        ],
        evolutions: {
            pathA: {
                key: 'sniper', name: 'Francotirador', 
                desc: 'Rango y daño masivo. Lento.',
                stats: { damage: 150, range: 350, fireRate: 1500, critChance: 0.5 },
                color: 0x006400, // Verde oscuro
                cost: 600
            },
            pathB: {
                key: 'ranger', name: 'Montaraz', 
                desc: 'Dispara ráfagas rápidas.',
                stats: { damage: 30, range: 180, fireRate: 250 }, // Muy rápido
                color: 0x90ee90, // Verde claro
                cost: 600
            }
        }
    },
    cannon: {
        name: "Torre de Cañón",
        description: "Daño en área explosivo.",
        baseCost: 200,
        color: 0xff0000,
        type: 'cannon',
        levels: [
            { damage: 30, range: 150, fireRate: 2000, upgradeCost: 250, aoe: 100 },
            { damage: 50, range: 160, fireRate: 1900, upgradeCost: 350, aoe: 110 },
            { damage: 80, range: 170, fireRate: 1800, upgradeCost: 550, aoe: 120 }
        ],
        evolutions: {
            pathA: {
                key: 'devastator', name: 'Devastador', 
                desc: 'Explosiones nucleares.',
                stats: { damage: 200, range: 180, fireRate: 2500, aoe: 180 },
                color: 0x8b0000, // Rojo oscuro
                cost: 800
            },
            pathB: {
                key: 'gatling', name: 'Ametralladora', 
                desc: 'Sin área, pero muy rápido.',
                stats: { damage: 20, range: 200, fireRate: 150, aoe: 0 }, // Sin parábola
                color: 0xffa500, // Naranja
                cost: 800
            }
        }
    },
    mage: {
        name: "Torre Arcana",
        description: "Ralentiza enemigos.",
        baseCost: 150,
        color: 0x0000ff,
        type: 'mage',
        levels: [
            { damage: 10, range: 160, fireRate: 1200, upgradeCost: 200, effect: {type:'slow', val:0.3, duration:1500} },
            { damage: 20, range: 170, fireRate: 1100, upgradeCost: 300, effect: {type:'slow', val:0.4, duration:1500} },
            { damage: 35, range: 180, fireRate: 1000, upgradeCost: 500, effect: {type:'slow', val:0.5, duration:2000} }
        ],
        evolutions: {
            pathA: {
                key: 'ice', name: 'Cronomante', 
                desc: 'Congela casi por completo.',
                stats: { damage: 50, range: 200, fireRate: 1500, effect: {type:'freeze', val:0.9, duration:3000} },
                color: 0x00ffff, // Cyan
                cost: 700
            },
            pathB: {
                key: 'fire', name: 'Piromante', 
                desc: 'Quema enemigos (DoT).',
                stats: { damage: 80, range: 180, fireRate: 1000, effect: {type:'burn', val:20, duration:4000} },
                color: 0xff4500, // Naranja rojizo
                cost: 700
            }
        }
    }
};