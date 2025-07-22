export class CharacterStats {
    constructor({
        strength = 1,    // Modifies physical damage
        haste = 1,       // Modifies attack speed and cooldowns
        movement = 1,    // Modifies player speed
        luck = 1,        // Influences random chances (e.g., crit, item drops)
        stealth = 1,     // Reduces enemy detection range
        description = '', // Short bio for the character
        assetKey = '',
        sounds = {
            spawn: null,
            hit: null,
            death: null,
        },
        particleEffectKey = null,
        menuIconFrame = 9
    }) {
        this.strength = strength;
        this.haste = haste;
        this.movement = movement;
        this.luck = luck;
        this.stealth = stealth;
        this.description = description;
        this.assetKey = assetKey;
        this.sounds = sounds;
        this.particleEffectKey = particleEffectKey;
        this.menuIconFrame = menuIconFrame;
    }
}
export const Characters = {
    'Ahab': new CharacterStats({
        strength: 1.2, haste: 0.9, movement: 1.0, luck: 1.1, stealth: 0.9,
        description: "A grizzled veteran. High strength but slower attacks.",
        assetKey: 'Ahab',
        sounds: { spawn: 'DefaultIntro', hit: 'AhabHit', death: 'AhabDeath' },
        particleEffectKey: 'earth'
    }),
    'Dave': new CharacterStats({
        strength: 0.8, haste: 1.2, movement: 1.1, luck: 1.0, stealth: 1.2,
        description: "Quick and nimble. Lower damage but attacks very quickly.",
        assetKey: 'Dave',
        sounds: { spawn: 'DefaultIntro', hit: 'DefaultHit', death: 'DefaultDeath' },
        particleEffectKey: 'air'
    }),
    'Sean': new CharacterStats({
        strength: 1.0, haste: 1.0, movement: 1.0, luck: 1.5, stealth: 1.0,
        description: "A perfectly balanced hero with a knack for finding treasure.",
        assetKey: 'Sean',
        sounds: { spawn: 'DefaultIntro', hit: 'DefaultHit', death: 'DefaultDeath' }
    }),
    'Rocco': new CharacterStats({
        strength: 1.5, haste: 0.8, movement: 0.9, luck: 0.8, stealth: 0.7,
        description: "A powerhouse of destruction. Hits hard, but is slow and clumsy.",
        assetKey: 'Rocco',
        sounds: { spawn: 'DefaultIntro', hit: 'DefaultHit', death: 'DefaultDeath' },
        particleEffectKey: 'fire'
    }),
    'Drew': new CharacterStats({
        strength: 1.1, haste: 1.1, movement: 1.1, luck: 1.1, stealth: 1.1,
        description: "A jack-of-all-trades, master of none. Slightly above average in all stats.",
        assetKey: 'Drew',
        sounds: { spawn: 'DefaultIntro', hit: 'DefaultHit', death: 'DefaultDeath' }
    }),
    'AgentTer': new CharacterStats({
        strength: 0.9, haste: 1.5, movement: 1.2, luck: 0.9, stealth: 1.5,
        description: "A speed demon who relies on rapid strikes and superior mobility.",
        assetKey: 'AgentTer',
        sounds: { spawn: 'DefaultIntro', hit: 'DefaultHit', death: 'DefaultDeath' },
        particleEffectKey: 'electricity'
    }),
    'TheSwan': new CharacterStats({
        strength: 1.4, haste: 1.0, movement: 0.8, luck: 1.2, stealth: 0.8,
        description: "An enigmatic force. Strong and lucky, but not the fastest.",
        assetKey: 'TheSwan',
        sounds: { spawn: 'TheSwanIntro', hit: 'TheSwanHit', death: 'TheSwanDeath' },
        particleEffectKey: 'void'
    }),
};