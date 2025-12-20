// src/config/Talents.js

export const TALENTS = {
    paladin: [
        { 
            id: 'pal_1', 
            name: 'Aura de Fe', 
            cost: 5, 
            desc: '+20% Vida Máxima y Regeneración pasiva.',
            stats: { maxHpMult: 0.2, regenHp: 5 }
        },
        { 
            id: 'pal_2', 
            name: 'Escudo Divino', 
            cost: 10, 
            req: 'pal_1', 
            desc: '15% de probabilidad de BLOQUEAR todo el daño recibido.',
            effect: 'block_chance',
            val: 15
        }
    ],
    guerrero: [
        { 
            id: 'war_1', 
            name: 'Furia de Sangre', 
            cost: 5, 
            desc: '+15% Daño y +5% Robo de Vida.',
            stats: { damageMult: 0.15, lifesteal: 5 }
        },
        { 
            id: 'war_2', 
            name: 'Ejecutor', 
            cost: 10, 
            req: 'war_1', 
            desc: '20% de probabilidad de infligir doble daño en cada ataque.',
            effect: 'double_strike',
            val: 20
        }
    ],
    arquero: [
        { 
            id: 'arc_1', 
            name: 'Ojo de Águila', 
            cost: 5, 
            desc: '+20% Rango de Ataque y +10% Crítico.',
            stats: { rangeMult: 0.2, critChance: 10 }
        },
        { 
            id: 'arc_2', 
            name: 'Disparo Perforante', 
            cost: 10, 
            req: 'arc_1', 
            desc: 'Los ataques ignoran el 50% de la defensa enemiga.',
            effect: 'pierce',
            val: 50
        }
    ],
    mago: [
        { 
            id: 'mag_1', 
            name: 'Mente Clara', 
            cost: 5, 
            desc: '+20% Daño de Habilidad y -10% Cooldown.',
            stats: { skillDamage: 20, cdr: 10 }
        },
        { 
            id: 'mag_2', 
            name: 'Toque Gélido', 
            cost: 10, 
            req: 'mag_1', 
            desc: 'Los ataques básicos ralentizan a los enemigos un 30%.',
            effect: 'frost_hit',
            val: 30
        }
    ],
    asesino: [
        { 
            id: 'asn_1', 
            name: 'Sombra Veloz', 
            cost: 5, 
            desc: '+20% Velocidad de Movimiento y +20% Vel. Ataque.',
            stats: { moveSpeedMult: 0.2, attackSpeed: 200 } // attackSpeed resta delay
        },
        { 
            id: 'asn_2', 
            name: 'Letalidad', 
            cost: 10, 
            req: 'asn_1', 
            desc: '+50% Daño Crítico.',
            stats: { critDamage: 50 }
        }
    ]
};