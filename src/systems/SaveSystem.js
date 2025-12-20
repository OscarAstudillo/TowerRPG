// src/systems/SaveSystem.js
import { gameState, updatePlayerStats, initHero } from '../config/GameState.js';

export default class SaveSystem {
    static save() {
        const data = {
            gold: gameState.gold,
            levelsUnlocked: gameState.levelsUnlocked,
            levelStars: gameState.levelStars,
            materials: gameState.materials,
            inventory: gameState.inventory,
            equipment: gameState.equipment,
            towerEquipment: gameState.towerEquipment,
            selectedClass: gameState.selectedClass,
            professions: gameState.professions,
            
            // NUEVO: Guardamos el objeto heroes completo
            heroes: gameState.heroes
        };
        localStorage.setItem('towerRPG_save', JSON.stringify(data));
        console.log("Juego Guardado");
    }

    static load() {
        const json = localStorage.getItem('towerRPG_save');
        if (json) {
            try {
                const data = JSON.parse(json);
                
                gameState.gold = data.gold || 0;
                gameState.levelsUnlocked = data.levelsUnlocked || 1;
                gameState.levelStars = data.levelStars || {};
                
                if(data.materials) gameState.materials = data.materials;
                if(data.inventory) gameState.inventory = data.inventory;
                if(data.equipment) gameState.equipment = data.equipment;
                if(data.towerEquipment) gameState.towerEquipment = data.towerEquipment;
                if(data.professions) gameState.professions = data.professions;

                // --- MIGRACIÓN CRÍTICA: DATOS DE HÉROES ---
                if (data.heroes) {
                    gameState.heroes = data.heroes;
                } else {
                    gameState.heroes = {};
                    // Si es un save viejo, intentamos rescatar lo que había
                    if (data.selectedClass) {
                        initHero(data.selectedClass);
                        // Transferir datos legacy al héroe específico
                        gameState.heroes[data.selectedClass].level = data.heroLevel || 1;
                        gameState.heroes[data.selectedClass].xp = data.heroXP || 0;
                        gameState.heroes[data.selectedClass].statPoints = data.statPoints || 0;
                        gameState.heroes[data.selectedClass].baseAttributes = data.baseAttributes || { damage: 0, maxHp: 0, attackSpeed: 0, defense: 0 };
                    }
                }

                if (data.selectedClass) {
                    gameState.selectedClass = data.selectedClass;
                    // Asegurar que el héroe actual existe en la estructura
                    initHero(gameState.selectedClass);
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