// src/entities/player/PlayerStats.js

export const CLASS_STATS = {
    paladin: {
        name: "Paladín",
        hp: 200,
        defense: 15,
        damage: 10,
        attackSpeed: 1000, 
        moveSpeed: 160,
        range: 60, // Cuerpo a cuerpo
        color: 0xffff00 // Amarillo
    },
    guerrero: {
        name: "Guerrero",
        hp: 150,
        defense: 10,
        damage: 20,
        attackSpeed: 900,
        moveSpeed: 180,
        range: 60, // Cuerpo a cuerpo
        color: 0xff0000 // Rojo
    },
    arquero: {
        name: "Arquero",
        hp: 100,
        defense: 5,
        damage: 15,
        attackSpeed: 600, // Dispara rápido
        moveSpeed: 220,
        range: 300, // Ataque a distancia
        color: 0x00ff00 // Verde
    },
    mago: {
        name: "Mago",
        hp: 80,
        defense: 2,
        damage: 35,
        attackSpeed: 1200, // Lento pero fuerte
        moveSpeed: 200,
        range: 300, // Ataque a distancia
        color: 0x0000ff // Azul
    },
    asesino: {
        name: "Asesino",
        hp: 120,
        defense: 4,
        damage: 25,
        attackSpeed: 400, // Muy rápido
        moveSpeed: 260, // El más veloz
        range: 60, // Cuerpo a cuerpo
        color: 0x800080 // Morado
    }
};