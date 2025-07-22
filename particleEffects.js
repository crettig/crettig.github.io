

import Phaser from 'phaser';

// A central place to create and cache our custom particle texture
function getSoftParticleTexture(scene) {
    const textureKey = 'soft-particle';
    if (!scene.textures.exists(textureKey)) {
        const graphics = scene.make.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture(textureKey, 20, 20);
        graphics.destroy();
    }
    return textureKey;
}


export function createHitSparks(scene, x, y) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 80, max: 250 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        lifespan: { min: 200, max: 400 },
        quantity: { min: 5, max: 10 },
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xFFD700, 0xFFA500, 0xFF4500]) } // Gold, Orange, Red-Orange
    });
    particles.explode(); // Explode all particles at once
    scene.time.delayedCall(500, () => particles.destroy());
}
export function createFireEffect(scene, x, y, duration = 2000) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 50, max: 120 },
        angle: { min: 250, max: 290 }, // Upwards direction
        scale: { start: 0.4, end: 0, ease: 'sine.in' },
        lifespan: { min: 400, max: 800 },
        quantity: 1,
        frequency: 50,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xFFD700, 0xFFA500, 0xFF4500]) }
    });
    // Auto-destroy after some time to prevent infinite emitters
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(1000, () => particles.destroy());
        });
    }
    return particles;
}
export function createIceEffect(scene, x, y, duration = 2000) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 20, max: 60 },
        angle: { min: 0, max: 360 }, // Swirling motion
        scale: { start: 0.35, end: 0, ease: 'sine.in' },
        lifespan: { min: 500, max: 1000 },
        quantity: 1,
        frequency: 80,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xADD8E6, 0xB0E0E6, 0xAFEEEE, 0xE0FFFF]) }
    });
    // Auto-destroy after some time to prevent infinite emitters
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(1200, () => particles.destroy()); // Allow particles to fade out
        });
    }
    return particles;
}
export function createElectricityEffect(scene, x, y, duration = 1000) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 200, max: 500 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.25, end: 0 },
        lifespan: { min: 50, max: 200 },
        quantity: 2,
        frequency: 20,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xFFFF99, 0x99FFFF, 0xFFFFFF]) }
    });
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(400, () => particles.destroy());
        });
    }
    return particles;
}
export function createEarthEffect(scene, x, y, duration = 500) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 40, max: 100 },
        angle: { min: 220, max: 320 }, // Upwards arc
        scale: { start: 0.4, end: 0.1 },
        lifespan: { min: 400, max: 800 },
        gravityY: 350, // Make them feel heavy
        quantity: 1,
        frequency: 40,
        blendMode: 'NORMAL',
        tint: { onEmit: () => Phaser.Math.RND.pick([0x8B4513, 0xA0522D, 0x696969]) } // Browns and grays
    });
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(1000, () => particles.destroy());
        });
    }
    return particles;
}
export function createAirEffect(scene, x, y, duration = 3000) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 }, // Swirling wind
        scale: { start: 0.5, end: 0.1, ease: 'sine.out' },
        alpha: { start: 0.5, end: 0, ease: 'sine.in' },
        lifespan: { min: 1000, max: 2000 },
        quantity: 1,
        frequency: 100,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xFFFFFF, 0xE8E8E8, 0xF5F5F5]) }
    });
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(2000, () => particles.destroy()); // Long fade out time
        });
    }
    return particles;
}
export function createVoidEffect(scene, x, y, duration = 1500) {
    const particleTexture = getSoftParticleTexture(scene);
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 20, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.4, end: 0, ease: 'power3' },
        alpha: { start: 0.8, end: 0, ease: 'power3' },
        lifespan: { min: 600, max: 1200 },
        quantity: 1,
        frequency: 70,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0x301934, 0x483D8B, 0x9400D3]) } // Dark purple, slate blue, dark violet
    });
    if (duration > 0) {
        scene.time.delayedCall(duration, () => {
            particles.stop();
            scene.time.delayedCall(1500, () => particles.destroy());
        });
    }
    return particles;
}

export function createSonicBlastEffect(scene, x, y, rotation, coneAngle, innerConeAngle) {
    const particleTexture = getSoftParticleTexture(scene);
    const angleDeg = Phaser.Math.RadToDeg(rotation);

    // Emitter for the outer cone
    const outerParticles = scene.add.particles(0, 0, particleTexture, {
        x: x,
        y: y,
        angle: { min: angleDeg - coneAngle / 2, max: angleDeg + coneAngle / 2 },
        speed: { min: 200, max: 400 },
        lifespan: { min: 200, max: 500 },
        scale: { start: 0.3, end: 0 },
        quantity: 2,
        frequency: 20,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xADD8E6, 0xB0E0E6, 0xAFEEEE]) } // Light blue/cyan colors
    });

    // Emitter for the inner, high-damage cone
    const innerParticles = scene.add.particles(0, 0, particleTexture, {
        x: x,
        y: y,
        angle: { min: angleDeg - innerConeAngle / 2, max: angleDeg + innerConeAngle / 2 },
        speed: { min: 300, max: 500 }, // Faster particles for inner cone
        lifespan: { min: 300, max: 600 },
        scale: { start: 0.4, end: 0 },
        quantity: 2,
        frequency: 20,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0xFFFFFF, 0x99FFFF]) } // Brighter white/cyan
    });

    // Stop emitters after a short burst
    scene.time.delayedCall(150, () => {
        outerParticles.stop();
        innerParticles.stop();
    });

    // Destroy particle managers after particles have faded
    scene.time.delayedCall(1000, () => {
        outerParticles.destroy();
        innerParticles.destroy();
    });
}
export const getSoftParticleTextureKey = (scene) => {
    const textureKey = 'soft-particle';
    if (!scene.textures.exists(textureKey)) {
        const graphics = scene.make.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture(textureKey, 20, 20);
        graphics.destroy();
    }
    return textureKey;
};

export function createClownKnifeDeathEffect(scene, x, y) {
    const particleTexture = getSoftParticleTexture(scene);
    const colors = [0x000000, 0xC83920, 0x7A3625, 0x0D040C];
    const particles = scene.add.particles(x, y, particleTexture, {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: { min: 300, max: 600 },
        quantity: { min: 15, max: 20 },
        blendMode: 'NORMAL',
        tint: { onEmit: () => Phaser.Math.RND.pick(colors) }
    });
    particles.explode();
    scene.time.delayedCall(1000, () => particles.destroy());
}
export function createXPGainEffect(scene, x, y, xpValue) {
    const particleTexture = getSoftParticleTexture(scene);
    const quantity = Math.min(Math.ceil(xpValue / 5), 20); // More XP = more particles, capped
    const emitter = scene.add.particles(0, 0, particleTexture, {
        speed: { min: 400, max: 600 },
        lifespan: 1000,
        scale: { start: 0.25, end: 0 },
        quantity: quantity,
        blendMode: 'ADD',
        tint: { onEmit: () => Phaser.Math.RND.pick([0x6633FF, 0x8A2BE2, 0x9932CC]) }, // Purple shades for XP
        emitting: false // We want to control the emission
    });
    const destX = scene.cameras.main.width / 2;
    const destY = 20;
    // We manually create a burst of particles directed towards the XP bar
    emitter.emitParticleAt(
        x, 
        y, 
        quantity,
        {
            moveToX: destX,
            moveToY: destY
        }
    );
    
    scene.time.delayedCall(1200, () => emitter.destroy());
}