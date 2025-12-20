// src/systems/SaveSystem.js
import { gameState, updatePlayerStats } from '../config/GameState.js';

export default class SaveSystem {
    static save() {
        const data = {
            gold: gameState.gold,
            heroLevel: gameState.heroLevel,
            heroXP: gameState.heroXP,
            levelsUnlocked: gameState.levelsUnlocked,
            levelStars: gameState.levelStars,
            statPoints: gameState.statPoints,
            materials: gameState.materials,
            inventory: gameState.inventory,
            equipment: gameState.equipment,
            towerEquipment: gameState.towerEquipment, // Guardar equipo de torres
            baseAttributes: gameState.baseAttributes,
            selectedClass: gameState.selectedClass,   // <--- IMPORTANTE: Guardar Clase
            professions: gameState.professions
        };
        localStorage.setItem('towerRPG_save', JSON.stringify(data));
        console.log("Juego Guardado");
    }

    static load() {
        const json = localStorage.getItem('towerRPG_save');
        if (json) {
            try {
                const data = JSON.parse(json);
                
                // Cargar datos con fallbacks seguros
                gameState.gold = data.gold || 0;
                gameState.heroLevel = data.heroLevel || 1;
                gameState.heroXP = data.heroXP || 0;
                gameState.levelsUnlocked = data.levelsUnlocked || 1;
                gameState.levelStars = data.levelStars || {};
                gameState.statPoints = data.statPoints || 0;
                
                if(data.materials) gameState.materials = data.materials;
                if(data.inventory) gameState.inventory = data.inventory;
                if(data.equipment) gameState.equipment = data.equipment;
                if(data.towerEquipment) gameState.towerEquipment = data.towerEquipment;
                
                if(data.baseAttributes) gameState.baseAttributes = data.baseAttributes;
                if(data.professions) gameState.professions = data.professions;

                // <--- LOGICA CRÍTICA PARA CLASE --->
                // Solo cargar la clase del save si NO es nula. 
                // Si en memoria ya elegimos una (recién), preservarla si el save es antiguo.
                if (data.selectedClass) {
                    gameState.selectedClass = data.selectedClass;
                }

                updatePlayerStats();
                console.log("Datos Cargados");
            } catch (e) {
                console.error("Error al cargar save:", e);
            }
        }
    }

    static reset() {
        localStorage.removeItem('towerRPG_save');
        location.reload();
    }
}