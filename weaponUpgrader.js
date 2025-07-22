import Phaser from 'phaser';
import { getSoftParticleTextureKey } from './particleEffects.js';
export class WeaponUpgrader {
    constructor(scene, x, y) {
        this.scene = scene;

        this.sprite = this.scene.physics.add.sprite(x, y, 'weaponUpgrader');
        this.sprite.setPipeline('Light2D');
        this.sprite.setDisplaySize(80, 80);
        this.sprite.setImmovable(true);
        this.sprite.body.setSize(70, 70);

        // Link the instance to the sprite
        this.sprite.owner = this;
    }

    explode() {
        // Create explosion particles
        const particleKey = getSoftParticleTextureKey(this.scene);
        const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, particleKey, {
            speed: { min: 100, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            lifespan: 600,
            quantity: 40,
            blendMode: 'ADD',
            tint: 0xFFD700
        });
        // Shake the camera for effect
        this.scene.cameras.main.shake(250, 0.015);
        // Destroy the particles and the upgrader sprite after a delay
        this.scene.time.delayedCall(600, () => particles.destroy());
        this.sprite.destroy();
    }
}