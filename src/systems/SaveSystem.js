// src/systems/SaveSystem.js
import { gameState, initHero, updatePlayerStats } from '../config/GameState.js';

const SAVE_KEY = 'TOWER_RPG_V1'; // Nombre único para tu juego
const SECRET_SALT = 'TitanDefense_Secret_Key_2025'; // ¡Cambia esto por tu propia frase secreta!

class SaveSystem {
    
    save() {
        try {
            // 1. Recopilar datos esenciales
            // No guardamos todo el objeto gameState, solo lo que cambia.
            const dataToSave = {
                gold: gameState.gold,
                baseHp: gameState.baseHp,
                maxLevel: gameState.maxLevel,
                selectedClass: gameState.selectedClass,
                
                // Arrays y Objetos complejos
                inventory: gameState.inventory,
                equipment: gameState.equipment,
                towerEquipment: gameState.towerEquipment,
                
                // Progreso
                materials: gameState.materials,
                professions: gameState.professions,
                unlockedRecipes: gameState.unlockedRecipes,
                
                // Héroes (Niveles y stats)
                heroes: gameState.heroes,
                
                // Estado de misiones
                quests: gameState.quests,
                
                // Sets activos
                activeSets: gameState.activeSets,

                // Timestamp para evitar trampas de "viaje en el tiempo" (opcional)
                lastSave: Date.now()
            };

            // 2. Convertir a String
            const jsonString = JSON.stringify(dataToSave);

            // 3. ENCRIPTAR (Ofuscación)
            const encryptedData = this.encrypt(jsonString);

            // 4. Guardar en LocalStorage
            localStorage.setItem(SAVE_KEY, encryptedData);
            
            console.log("Game Saved (Encrypted)");
            return true;
        } catch (err) {
            console.error("Save Failed:", err);
            return false;
        }
    }

    load() {
        try {
            // 1. Buscar datos
            const encryptedData = localStorage.getItem(SAVE_KEY);
            if (!encryptedData) {
                console.log("No save file found. Starting new game.");
                return false;
            }

            // 2. DESENCRIPTAR
            const jsonString = this.decrypt(encryptedData);
            if (!jsonString) {
                console.warn("Save file corrupted or tampered!");
                return false;
            }

            // 3. Parsear
            const loadedData = JSON.parse(jsonString);

            // 4. INYECTAR DATOS EN EL JUEGO (Merge seguro)
            // Esto actualiza las variables de tu juego con lo que se cargó
            Object.assign(gameState, loadedData);

            // 5. Re-inicializar lógicas dependientes
            if (gameState.selectedClass) {
                // Asegurar que el héroe tenga la estructura correcta si se agregaron parches nuevos
                initHero(gameState.selectedClass);
            }
            
            // Recalcular stats finales (daño, vida) basados en el equipo cargado
            updatePlayerStats();

            console.log("Game Loaded Successfully");
            return true;

        } catch (err) {
            console.error("Load Failed:", err);
            return false;
        }
    }

    reset() {
        localStorage.removeItem(SAVE_KEY);
        console.log("Save file deleted.");
        window.location.reload(); // Recargar para limpiar memoria RAM
    }

    // --- MÉTODOS DE ENCRIPTACIÓN ---
    
    encrypt(text) {
        try {
            // Algoritmo XOR simple con Salt
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
                result += String.fromCharCode(charCode);
            }
            // Convertir a Base64 para que sea un string seguro
            return btoa(result);
        } catch (e) {
            console.error("Encryption error", e);
            return text; // Fallback inseguro para no perder datos en dev
        }
    }

    decrypt(encoded) {
        try {
            // Decodificar Base64
            const text = atob(encoded);
            // Revertir XOR
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            console.error("Decryption error (Bad File)", e);
            return null;
        }
    }
}

// Exportar una instancia única (Singleton)
const saveSystemInstance = new SaveSystem();
export default saveSystemInstance;