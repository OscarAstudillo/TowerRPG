// src/config/Recipes.js

export const RECIPES = [
    {
        id: 'wood_sword',
        name: 'Espada de Madera',
        type: 'weapon', // <--- NUEVO: Tipo de hueco
        profession: 'weaponsmith',
        cost: { wood: 3, cloth: 0, copper: 0 },
        bonus: { stat: 'damage', value: 5 },
        description: "Daño +5"
    },
    {
        id: 'iron_sword', // Ejemplo de mejora
        name: 'Espada de Hierro',
        type: 'weapon',
        profession: 'weaponsmith',
        cost: { wood: 2, cloth: 0, copper: 5 },
        bonus: { stat: 'damage', value: 15 },
        description: "Daño +15"
    },
    {
        id: 'cloth_armor',
        name: 'Túnica de Aprendiz',
        type: 'armor', // <--- NUEVO
        profession: 'armorsmith',
        cost: { wood: 0, cloth: 3, copper: 0 },
        bonus: { stat: 'maxHp', value: 50 },
        description: "Vida Max +50"
    },
    {
        id: 'copper_ring',
        name: 'Anillo de Cobre',
        type: 'accessory', // <--- NUEVO
        profession: 'jewelry',
        cost: { wood: 0, cloth: 0, copper: 2 },
        bonus: { stat: 'attackSpeed', value: -100 },
        description: "Vel. Ataque +Rápida"
    }
];