// src/systems/SaveSystem.js
import { gameState, updatePlayerStats, initHero } from '../config/GameState.js';

export default class SaveSystem {
    static save() {
        try {
            const data = {
                gold: gameState.gold,
                // Guardamos todo el objeto gameState relevante
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
            console.log("Juego Guardado OK");
        } catch (e) {
            console.error("Error al guardar:", e);
        }
    }

    static load() {
        const json = localStorage.getItem('towerRPG_save');
        if (json) {
            try {
                const data = JSON.parse(json);
                
                // Carga básica segura
                gameState.gold = data.gold || 500;
                if (data.materials) gameState.materials = data.materials;
                if (data.inventory) gameState.inventory = data.inventory;
                if (data.equipment) gameState.equipment = data.equipment;
                if (data.towerEquipment) gameState.towerEquipment = data.towerEquipment;
                if (data.professions) gameState.professions = data.professions;
                if (data.completedLevels) gameState.completedLevels = data.completedLevels;
                if (data.maxLevel) gameState.maxLevel = data.maxLevel;
                if (data.talents) gameState.talents = data.talents;

                // --- MIGRACIÓN DE HÉROES ROBUSTA ---
                if (data.heroes && Object.keys(data.heroes).length > 0) {
                    gameState.heroes = data.heroes;
                } else {
                    gameState.heroes = {}; 
                }

                // Restaurar clase seleccionada y migrar datos legacy si es necesario
                if (data.selectedClass) {
                    gameState.selectedClass = data.selectedClass;
                    
                    // Si el héroe no existe en la estructura nueva, lo creamos
                    if (!gameState.heroes[data.selectedClass]) {
                        console.log("Creando héroe nuevo/migrado:", data.selectedClass);
                        // Crear estructura vacía primero
                        gameState.heroes[data.selectedClass] = {
                            level: 1, xp: 0, maxXp: 100, statPoints: 0, talentPoints: 0, 
                            talents: [], baseAttributes: { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 }
                        };

                        // Intentar recuperar nivel legacy si existe
                        if (data.heroLevel) {
                            gameState.heroes[data.selectedClass].level = data.heroLevel;
                        }
                    }
                }

                // Recalcular todo
                updatePlayerStats();
                console.log("Datos Cargados Correctamente");
            } catch (e) {
                console.error("Error crítico al cargar save:", e);
                // Si falla la carga, intentamos limpiar para no romper el juego
                // localStorage.removeItem('towerRPG_save'); 
            }
        }
    }

    static reset() {
        localStorage.removeItem('towerRPG_save');
        location.reload();
    }
}