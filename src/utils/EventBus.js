import Phaser from 'phaser';

// Instancia global para emitir y escuchar eventos en todo el juego
export const EventBus = new Phaser.Events.EventEmitter();