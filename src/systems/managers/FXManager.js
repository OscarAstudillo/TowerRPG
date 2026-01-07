import Phaser from 'phaser';

export default class FXManager {
    constructor(scene) {
        this.scene = scene;
        this.floatingTexts = scene.add.group();
        this.createParticles();
    }

    createParticles() {
        this.bloodEmitter = this.scene.add.particles(0, 0, 'pixel', {
            speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 }, scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 }, lifespan: 500, gravityY: 300, tint: 0xcc0000, emitting: false
        }).setDepth(900);

        this.critEmitter = this.scene.add.particles(0, 0, 'pixel', {
            speed: { min: 100, max: 400 }, angle: { min: 0, max: 360 }, scale: { start: 2.5, end: 0 },
            lifespan: 300, blendMode: 'ADD', tint: [0xffaa00, 0xffff00], emitting: false
        }).setDepth(901);

        this.dustEmitter = this.scene.add.particles(0, 0, 'pixel', {
            speed: { min: 10, max: 50 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 },
            alpha: { start: 0.5, end: 0 }, lifespan: 400, tint: 0xaaaaaa, emitting: false
        }).setDepth(899);
    }

    createHitEffect(x, y, color = 0xff0000) {
        this.bloodEmitter.setPosition(x, y);
        this.bloodEmitter.setParticleTint(color);
        this.bloodEmitter.explode(8);
    }

    createExplosion(x, y, color = 0xffa500) {
        this.critEmitter.setPosition(x, y);
        this.critEmitter.setParticleTint(color);
        this.critEmitter.explode(20);
        this.scene.cameras.main.shake(100, 0.005);
    }

    showFloatingText(x, y, message, type = 'normal', duration = 1000) {
        let color = '#ffffff'; let fontSize = '20px'; let stroke = '#000'; let strokeThick = 3; let scaleStart = 1;
        
        switch(type) {
            case 'crit': color = '#ffcc00'; fontSize = '36px'; strokeThick=6; scaleStart = 0.5; duration = 1500; break;
            case 'heal': color = '#00ff00'; fontSize = '22px'; break;
            case 'gold': color = '#ffd700'; fontSize = '24px'; break;
        }

        const text = this.scene.add.text(x, y, message, {
            fontFamily: 'Cinzel', fontSize: fontSize, fontStyle: 'bold',
            color: color, stroke: stroke, strokeThickness: strokeThick
        }).setOrigin(0.5).setDepth(2000).setScale(scaleStart);
        
        this.floatingTexts.add(text);

        const angle = Phaser.Math.Between(-20, 20) * (Math.PI / 180);
        const speed = type === 'crit' ? 250 : 120;
        let vx = Math.sin(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
        let vy = -speed;

        this.scene.tweens.addCounter({
            from: 0, to: 100, duration: duration,
            onUpdate: (tween) => {
                const dt = 0.016; vy += 800 * dt; 
                text.x += vx * dt; text.y += vy * dt;
                const progress = tween.getValue() / 100;
                if (progress > 0.7) text.setAlpha(1 - ((progress - 0.7) * 3.3));
                if (type === 'crit' && progress < 0.2) text.setScale(Phaser.Math.Interpolation.Bezier([0.5, 2.0, 1.0], progress * 5));
            },
            onComplete: () => text.destroy()
        });
    }

    spawnCoinEffect(startX, startY, gameUI) {
        const coin = this.scene.add.text(startX, startY, "🪙", { fontSize: '24px' }).setOrigin(0.5).setDepth(2000);
        this.floatingTexts.add(coin);
        const targetX = this.scene.scale.width / 2;
        const targetY = this.scene.scale.height - 80;
        
        this.scene.tweens.add({
            targets: coin, x: targetX, y: targetY, duration: 800, ease: 'Sine.easeInOut',
            onComplete: () => {
                coin.destroy();
                if (gameUI && gameUI.pulseGoldIcon) gameUI.pulseGoldIcon();
            }
        });
    }

    clean() {
        this.floatingTexts.clear(true, true);
    }
}