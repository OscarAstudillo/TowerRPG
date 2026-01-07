import Enemy from '../../entities/enemies/Enemy.js';
import { EventBus } from '../../utils/EventBus.js';
import { BIOME_ENEMIES } from '../../config/Enemies.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.isTimerRunning = false;
        this.timeToNextWave = 0;
        this.waveActive = false;
        this.spawnTimer = null;
        this.paths = []; // Se asignará desde MapManager
    }

    startTimer(seconds) {
        this.isTimerRunning = true;
        this.timeToNextWave = seconds * 1000;
        EventBus.emit('wave-timer-toggle', true);
    }

    update(delta) {
        if (this.isTimerRunning) {
            this.timeToNextWave -= delta;
            if (this.timeToNextWave <= 0) {
                this.startWave();
            } else {
                EventBus.emit('wave-timer-tick', Math.ceil(this.timeToNextWave/1000));
            }
        }
        this.checkStatus();
    }

    startWave() {
        this.isTimerRunning = false;
        EventBus.emit('wave-timer-toggle', false);
        this.waveActive = true;
        this.currentWave++;
        
        const isBossWave = !this.scene.isEndless && (this.currentWave === this.scene.totalWaves);
        EventBus.emit('wave-changed', { 
            current: this.currentWave, 
            total: this.scene.isEndless ? '∞' : this.scene.totalWaves, 
            isBoss: isBossWave 
        });

        // Configuración de Spawn
        let count = 8 + (this.currentWave * 2);
        let spawnDelay = Math.max(200, 1000 - (this.currentWave * 50));
        
        if (isBossWave) {
            this.scene.fx.showFloatingText(this.scene.scale.width/2, this.scene.scale.height/2, "¡JEFE FINAL!", "#ff0000");
            count = 1; // Solo el jefe
        }

        let spawned = 0;
        this.spawnTimer = this.scene.time.addEvent({
            delay: spawnDelay,
            repeat: count - 1,
            callback: () => {
                if (isBossWave && spawned === count - 1) {
                    this.spawnBoss();
                } else {
                    this.spawnEnemy(spawned);
                }
                spawned++;
            }
        });
    }

    spawnEnemy(spawnIndex) {
        if (!this.paths.length) return;
        const pathIdx = this.paths.length > 1 ? spawnIndex % this.paths.length : 0;
        const path = this.paths[pathIdx];
        const points = path.getSpacedPoints(150);
        
        // Lógica simple de selección de enemigo
        let mobKey = 'slime'; 
        // ... (Tu lógica de selección de mob aquí) ...

        let enemy = this.scene.enemies.getFirstDead();
        if (!enemy) {
            enemy = new Enemy(this.scene, points, this.scene.levelDifficultyFactor, mobKey);
            this.scene.enemies.add(enemy);
        } else {
            enemy.initEnemy(this.scene.levelDifficultyFactor, mobKey, points);
        }
    }

    spawnBoss() {
        // ... (Tu lógica de Boss)
        const path = this.paths[0];
        const points = path.getSpacedPoints(150);
        const bossKey = 'slime'; // Placeholder
        const boss = new Enemy(this.scene, points, this.scene.levelDifficultyFactor * 1.5, bossKey);
        this.scene.enemies.add(boss);
        boss.setScale(1.5);
    }

    checkStatus() {
        if (this.waveActive && this.scene.enemies.countActive() === 0 && (!this.spawnTimer || this.spawnTimer.getProgress() === 1)) {
            this.waveActive = false;
            if (this.currentWave >= this.scene.totalWaves && !this.scene.isEndless) {
                this.scene.victory();
            } else {
                this.startTimer(20);
            }
        }
    }

    clean() {
        if (this.spawnTimer) this.spawnTimer.remove();
        this.isTimerRunning = false;
        this.waveActive = false;
    }
}