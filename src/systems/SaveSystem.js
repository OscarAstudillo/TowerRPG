// src/systems/SaveSystem.js
import { gameState, INITIAL_STATS } from '../config/GameState.js';

const SAVE_KEY = 'titan_defense_rpg_v1';

export default class SaveSystem {
    
    static save() {
        try {
            const data = JSON.stringify(gameState);
            localStorage.setItem(SAVE_KEY, data);
            console.log('💾 Partida Guardada');
        } catch (e) {
            console.error('Error al guardar:', e);
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                
                // Mágia de fusión: Mezclamos lo guardado con el estado actual
                // para no romper el juego si agregamos variables nuevas en el futuro.
                Object.keys(parsed).forEach(key => {
                    gameState[key] = parsed[key];
                });

                console.log('📂 Partida Cargada');
                return true;
            }
        } catch (e) {
            console.error('Error al cargar:', e);
        }
        return false;
    }

    static reset() {
        if (confirm("¿Estás seguro de borrar todo tu progreso?")) {
            localStorage.removeItem(SAVE_KEY);
            location.reload(); // Recargar página para limpiar memoria
        }
    }
}