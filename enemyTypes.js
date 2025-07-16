import Phaser from 'phaser';

export const EnemyTypes = Object.freeze({
  STALKER: {
    key: 'stalker',
    health: 30,
    speed: 80,
    armor: 10,
    color: 0xff6b6b,
    spriteKey: 'clown1',
    contactDamage: 15,
  },
  RUSHER: {
    key: 'rusher',
    health: 20,
    speed: 140,
    armor: 0,
    color: 0xff9f43,
    spriteKey: 'clown2',
    contactDamage: 8,
  },
  BOMBER: {
    key: 'bomber',
    health: 40,
    speed: 60,
    armor: 20,
    color: 0x54a0ff,
    spriteKey: 'clown1',
    contactDamage: 5, // Minimal damage, as its main attack is the explosion
  }
});