export const WeaponTypes = Object.freeze({
  WATER_BALLOON: {
    id: 'waterBalloon',
    name: 'Water Balloon',
    iconUrl: 'https://play.rosebud.ai/assets/water balloon.png?ZC8X',
    damage: 20,
    cooldown: 900,
    range: 220, // Splash radius
    type: 'projectile',
    explosive: true,
    hasGravity: true,
    projectileSpeed: 380,
    pierce: 1,
    scale: 0.1,
    texture: 'waterBalloon',
    upgrades: [
        { damage: 5, cooldown: -50 }, // Level 2
        { range: 30, projectileSpeed: 20 }, // Level 3
        { damage: 10, cooldown: -50 }, // Level 4
        { range: 50, projectileSpeed: 40 } // Level 5 (Max)
    ]
  },
  BOTTLE_OF_REGRET: {
    id: 'bottleOfRegret',
    name: 'Bottle of Regret',
    iconUrl: 'https://play.rosebud.ai/assets/WeaponBottleOfRegret.png?IK7i',
    damage: 20, // Medium base damage
    cooldown: 300, // Fast swing
    range: 90, // Wide arc
    type: 'melee',
    attackArc: Math.PI * 0.6, // 108 degree sweep
    attackDuration: 120, // Fast swing
    pierce: 1, // Hits one target at a time by default
    scale: 0.75,
    texture: 'bottleOfRegret',
    // New properties for future implementation
    knockback: 50,
    critChance: 0.05,
    specialEffect: 'glassFracture',
    upgrades: [
        // Level 1 -> 2: Tier 1 Unlock
        { damage: 5, knockback: 10, special: 'glassFracture', tier: 1, name: "Tier 1: Glass Fracture", description: "Every 3rd hit applies an armor reduction debuff." }, 
        // Level 2 -> 3
        { cooldown: -25, attackArc: 0.1 }, 
        // Level 3 -> 4: Tier 2 Unlock
        { damage: 5, critChance: 0.05, special: 'shattercloud', tier: 2, name: "Tier 2: Shattercloud", description: "On kill, 20% chance to create a hallucinogenic gas cloud." },
        // Level 4 -> 5
        { cooldown: -25, pierce: 1 },
        // Level 5 -> 6: Tier 3 Unlock
        { damage: 10, knockback: 15, special: 'viciousCycle', tier: 3, name: "Tier 3: Vicious Cycle", description: "Kills inside a gas cloud have a 50% chance to spawn a new one." },
        // Level 6 -> 7: Tier 4 Unlock
        { critChance: 0.1, special: 'liquidCourage', tier: 4, name: "Tier 4: Liquid Courage", description: "Killing enemies restores 10 HP. Overheals into temporary 'Buzz HP'." }
    ]
  }
});