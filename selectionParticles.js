import Phaser from 'phaser';
import { Characters } from './characterData.js';
import { 
    getSoftParticleTextureKey,
    createFireEffect,
    createIceEffect,
    createElectricityEffect,
    createVoidEffect,
    createEarthEffect,
    createAirEffect
} from './particleEffects.js';
function createDefaultEmitter(scene) {
    const particleTexture = getSoftParticleTextureKey(scene);
    const particles = scene.add.particles(0, 0, particleTexture);
    particles.setConfig({
        emitZone: {
            type: 'edge',
            source: new Phaser.Geom.Circle(0, 0, 45),
            quantity: 60,
        },
        lifespan: { min: 600, max: 1000 },
        scale: { start: 0.12, end: 0, ease: 'sine.in' },
        alpha: { start: 0.8, end: 0, ease: 'sine.in' },
        speed: 5,
        frequency: 150,
        blendMode: 'ADD',
        tint: 0xFFD700,
    });
    particles.setDepth(5);
    particles.stop();
    return particles;
}
const effectMap = {
    'fire': (scene, x, y) => createFireEffect(scene, x, y, -1),
    'ice': (scene, x, y) => createIceEffect(scene, x, y, -1),
    'electricity': (scene, x, y) => createElectricityEffect(scene, x, y, -1),
    'void': (scene, x, y) => createVoidEffect(scene, x, y, -1),
    'earth': (scene, x, y) => createEarthEffect(scene, x, y, -1),
    'air': (scene, x, y) => createAirEffect(scene, x, y, -1),
};
export function createCharacterSelectionParticles(scene, characterKey) {
    const characterData = Characters[characterKey];
    const effectKey = characterData?.particleEffectKey;
    if (effectKey && effectMap[effectKey]) {
        const emitter = effectMap[effectKey](scene, 0, 0);
        // Modify for selection screen appearance
        emitter.setEmitZone({
            type: 'edge',
            source: new Phaser.Geom.Circle(0, 0, 45),
            quantity: 40,
        });
        emitter.setFrequency(100);
        emitter.setDepth(5);
        emitter.stop();
        return emitter;
    }
    // Default emitter if no specific effect is found
    return createDefaultEmitter(scene);
}