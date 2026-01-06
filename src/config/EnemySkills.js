// src/config/EnemySkills.js

export const ENEMY_SKILLS = {
    // --- ATAQUES A DISTANCIA ---
    SHOOT_ARROW: {
        type: 'projectile',
        damageMult: 1.0, // Multiplicador del daño base del enemigo
        speed: 400,
        range: 300,      // Distancia mínima para disparar
        cooldown: 3000,
        color: 0xffffff, // Blanco (flecha normal)
        texture: 'base_projectile' 
    },
    THROW_ROCK: {
        type: 'projectile',
        damageMult: 1.5,
        speed: 250,
        range: 250,
        cooldown: 4000,
        color: 0x888888, // Gris
        texture: 'base_projectile'
    },
    FIREBALL: {
        type: 'projectile',
        damageMult: 2.0,
        speed: 350,
        range: 350,
        cooldown: 5000,
        color: 0xff4500, // Naranja fuego
        effect: { type: 'burn', val: 5, duration: 3000 }
    },

    // --- ATAQUES MELEE / CARGAS ---
    HEAVY_STRIKE: {
        type: 'melee_buff', // El próximo golpe duele más
        damageMult: 2.0,
        range: 50,          // Rango melee
        cooldown: 6000,
        color: 0xff0000,    // Brillo rojo aviso
        warnTime: 1000      // Tiempo de "carga" antes del golpe
    },
    DASH_ATTACK: {
        type: 'dash',
        damageMult: 1.2,
        range: 200,         // Distancia para iniciar el dash
        speed: 400,         // Velocidad del dash
        cooldown: 5000,
        color: 0x00ffff     // Estela cian
    },

    // --- SOPORTE ---
    HEAL_ALLY: {
        type: 'heal_area',
        healAmount: 50,
        range: 150,
        cooldown: 8000,
        color: 0x00ff00
    }
};