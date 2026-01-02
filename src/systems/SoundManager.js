// src/systems/SoundManager.js

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.2; // Volumen general bajo para no aturdir
        this.enabled = true;
        this.currentMusic = null; // Para rastrear música en el futuro
    }

    // Intenta iniciar el audio (los navegadores bloquean audio hasta el primer click)
    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- NUEVOS MÉTODOS PARA CORREGIR EL ERROR ---
    playMusic(key) {
        if (!this.enabled) return;
        this.init();
        // Aquí iría la lógica para reproducir música de fondo.
        // Por ahora lo dejamos vacío para que el juego no se rompa.
        // console.log(`[SoundManager] Reproduciendo música: ${key}`);
    }

    stopMusic() {
        // Aquí iría la lógica para detener la música.
        // console.log("[SoundManager] Música detenida");
    }
    // ---------------------------------------------

    // Generador de tonos simple (Oscilador)
    playSound(type) {
        if (!this.enabled) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        if (type === 'shoot_arrow') {
            // Sonido agudo y rápido "Pew"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);

        } else if (type === 'shoot_cannon') {
            // Sonido grave "Boom" corto
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
            gain.gain.setValueAtTime(this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);

        } else if (type === 'shoot_magic') {
            // Sonido vibrante "Zzzzt"
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);

        } else if (type === 'hit') {
            // Ruido blanco simulado (golpe seco)
            osc.type = 'sawtooth'; // Usamos sierra grave como impacto
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
            gain.gain.setValueAtTime(this.masterVolume, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);

        } else if (type === 'build') {
            // Sonido de moneda/construcción "Ding"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);

        } else if (type === 'upgrade') {
            // Power up "Wuuup"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(this.masterVolume, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'ui_click') {
            // Click suave
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }
}

const instance = new SoundManager();
export default instance;