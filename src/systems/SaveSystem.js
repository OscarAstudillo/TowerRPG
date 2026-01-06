import { gameState, initHero, updatePlayerStats } from '../config/GameState.js';

const SAVE_KEY = 'TOWER_RPG_V1'; 
const SECRET_SALT = 'TitanDefense_Secret_Key_2025'; 

class SaveSystem {
    
    constructor() {
        this.isElectron = this.checkIfElectron();
    }

    checkIfElectron() {
        // Detección simple de entorno de escritorio
        if (typeof window !== 'undefined' && window.process && window.process.type) {
            return true;
        }
        return false;
    }

    save() {
        try {
            // 1. Recopilar datos
            const dataToSave = {
                gold: gameState.gold,
                baseHp: gameState.baseHp,
                maxLevel: gameState.maxLevel,
                selectedClass: gameState.selectedClass,
                completedLevels: gameState.completedLevels || {}, // Asegurar que exista
                
                inventory: gameState.inventory,
                equipment: gameState.equipment,
                equipmentInventory: gameState.equipmentInventory || [], // Asegurar
                towerEquipment: gameState.towerEquipment,
                
                materials: gameState.materials,
                professions: gameState.professions,
                unlockedRecipes: gameState.unlockedRecipes,
                
                heroes: gameState.heroes,
                quests: gameState.quests,
                activeSets: gameState.activeSets,

                lastSave: Date.now()
            };

            // 2. Convertir a String
            const jsonString = JSON.stringify(dataToSave);

            // 3. ENCRIPTAR Y FIRMAR
            const encryptedData = this.encrypt(jsonString);
            const signature = this.generateSignature(encryptedData);
            const finalPayload = `${encryptedData}|${signature}`; // Formato: DATA|HASH

            // 4. Guardar según entorno
            if (this.isElectron) {
                this.saveToDisk(finalPayload);
            } else {
                localStorage.setItem(SAVE_KEY, finalPayload);
            }
            
            console.log("Game Saved Securely");
            return true;
        } catch (err) {
            console.error("Save Failed:", err);
            return false;
        }
    }

    load() {
        try {
            let finalPayload = null;

            // 1. Buscar datos
            if (this.isElectron) {
                finalPayload = this.loadFromDisk();
            } else {
                finalPayload = localStorage.getItem(SAVE_KEY);
            }

            if (!finalPayload) {
                console.log("No save file found. Starting new game.");
                return false;
            }

            // 2. VERIFICAR INTEGRIDAD
            const parts = finalPayload.split('|');
            if (parts.length !== 2) {
                console.warn("Save file format invalid!");
                return false;
            }

            const encryptedData = parts[0];
            const signature = parts[1];
            const expectedSignature = this.generateSignature(encryptedData);

            if (signature !== expectedSignature) {
                alert("¡Archivo de guardado corrupto o modificado! Se iniciará una nueva partida.");
                console.error("SECURITY ALERT: Save file signature mismatch.");
                return false;
            }

            // 3. DESENCRIPTAR
            const jsonString = this.decrypt(encryptedData);
            if (!jsonString) return false;

            // 4. Parsear
            const loadedData = JSON.parse(jsonString);

            // 5. INYECTAR DATOS (Merge seguro)
            // Usamos un merge profundo manual para evitar borrar objetos nested si faltan en el save
            Object.assign(gameState, loadedData);

            // 6. Restaurar estado lógico
            if (gameState.selectedClass) {
                initHero(gameState.selectedClass);
            }
            updatePlayerStats();

            console.log("Game Loaded Successfully");
            return true;

        } catch (err) {
            console.error("Load Failed:", err);
            return false;
        }
    }

    reset() {
        if (this.isElectron) {
            // Lógica de borrar archivo físico (requiere módulo fs)
            console.log("Reset not fully implemented for Desktop yet.");
        } else {
            localStorage.removeItem(SAVE_KEY);
        }
        console.log("Save file deleted.");
        window.location.reload(); 
    }

    // --- SEGURIDAD ---

    // Genera un hash simple (Checksum) del string encriptado
    generateSignature(data) {
        let hash = 0;
        if (data.length === 0) return hash.toString();
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Añadimos sal extra al hash
        return (hash + SECRET_SALT.length).toString(16);
    }

    encrypt(text) {
        try {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
                result += String.fromCharCode(charCode);
            }
            return btoa(result);
        } catch (e) {
            console.error("Encryption error", e);
            return text; 
        }
    }

    decrypt(encoded) {
        try {
            const text = atob(encoded);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            console.error("Decryption error", e);
            return null;
        }
    }

    // --- MÉTODOS DESKTOP (Placeholders para futura integración con Electron) ---
    saveToDisk(data) {
        // Aquí usarías: const fs = require('fs'); fs.writeFileSync('savegame.dat', data);
        console.log("Simulando guardado en disco...", data.length, "bytes");
        // Por ahora, fallback a localstorage para pruebas
        localStorage.setItem(SAVE_KEY + "_DESKTOP", data);
    }

    loadFromDisk() {
        // Aquí usarías: return fs.readFileSync('savegame.dat', 'utf-8');
        console.log("Simulando carga desde disco...");
        return localStorage.getItem(SAVE_KEY + "_DESKTOP");
    }
}

const saveSystemInstance = new SaveSystem();
export default saveSystemInstance;