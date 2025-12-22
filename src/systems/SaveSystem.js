// src/systems/SaveSystem.js
import { gameState, updatePlayerStats, initHero } from '../config/GameState.js';

export default class SaveSystem {
    static save() {
        try {
            const data = {
                gold: gameState.gold,
                materials: gameState.materials,
                inventory: gameState.inventory,
                equipment: gameState.equipment,
                towerEquipment: gameState.towerEquipment,
                selectedClass: gameState.selectedClass,
                professions: gameState.professions,
                heroes: gameState.heroes,
                completedLevels: gameState.completedLevels,
                maxLevel: gameState.maxLevel,
                talents: gameState.talents
            };
            localStorage.setItem('towerRPG_save', JSON.stringify(data));
            console.log("Juego Guardado");
        } catch (e) {
            console.error("Error al guardar:", e);
        }
    }

    static load() {
        const json = localStorage.getItem('towerRPG_save');
        if (json) {
            try {
                const data = JSON.parse(json);
                
                gameState.gold = data.gold || 500;
                if (data.materials) gameState.materials = data.materials;
                if (data.inventory) gameState.inventory = data.inventory;
                if (data.equipment) gameState.equipment = data.equipment;
                if (data.towerEquipment) gameState.towerEquipment = data.towerEquipment;
                if (data.professions) gameState.professions = data.professions;
                if (data.completedLevels) gameState.completedLevels = data.completedLevels;
                if (data.maxLevel) gameState.maxLevel = data.maxLevel;
                if (data.talents) gameState.talents = data.talents;

                if (data.heroes && Object.keys(data.heroes).length > 0) {
                    gameState.heroes = data.heroes;
                } else {
                    gameState.heroes = {}; 
                }

                if (data.selectedClass) {
                    gameState.selectedClass = data.selectedClass;
                    
                    // Verificación de seguridad: Crear héroe si no existe en el save
                    if (!gameState.heroes[data.selectedClass]) {
                        initHero(data.selectedClass);
                        // Solo intentar restaurar nivel legacy si el héroe fue recién creado
                        if (data.heroLevel && gameState.heroes[data.selectedClass]) {
                            gameState.heroes[data.selectedClass].level = data.heroLevel;
                        }
                    }
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