import { Characters } from './characterData.js';

const createCharacterAnimations = (anims, charKey) => {
    const directions = { 
        'up': {start: 0, end: 3}, 
        'right': {start: 4, end: 7}, 
        'down': {start: 8, end: 11}, 
        'left': {start: 12, end: 15}
    };

    for (const dir in directions) {
        anims.create({
            key: `${charKey}-walk-${dir}`,
            frames: anims.generateFrameNumbers(charKey, { start: directions[dir].start, end: directions[dir].end }),
            frameRate: 8,
            repeat: -1
        });
    }
};

export const createGameAnimations = (anims) => {
    const characterKeys = Object.keys(Characters);
    characterKeys.forEach(charKey => {
        createCharacterAnimations(anims, charKey);
    });

    // Create animations for non-player characters
    createCharacterAnimations(anims, 'ClownKnife');
    createCharacterAnimations(anims, 'BottleOfRegretGhostlyEx');
    createCharacterAnimations(anims, 'JackpotJavelinClownDecoy');
    anims.create({
        key: 'gas-cloud-effect',
        frames: anims.generateFrameNumbers('BottleOfRegretGasCloud', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: -1
    });
};