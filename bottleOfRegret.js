import { Weapon } from './weapon.js';
import { getSoftParticleTextureKey } from './particleEffects.js';
export class BottleOfRegret extends Weapon {
  constructor(scene, player) {
    const config = {
      damage: 15,
      attackSpeed: 400, // ms
      knockback: 120,
      critChance: 0.05,
      hitSound: 'bottleHit',
      critSound: 'BottleOfRegretCrit',
      swingArc: 180, // degrees
      swingDuration: 150, // ms
      xoffset:14,
      yoffset:28,
      level: 1,
      // Upgrade path config
      shatterCloudChance: 0.2,
      shatterCloudDuration: 5000,
    };
    
    super(scene, player, 'bottleOfRegret', config);
    this.attackCooldown = 0;
    this.swingCount = 0;
    this.sprite.setDisplaySize(40, 40);
    this.sprite.body.setCircle(20);
  }
  attack(pointer) {
    // The base `super.attack` will handle the swing animation and hit detection
    super.attack(pointer);

    console.log('Attacking!');
    
    // Tier III Unlock: Ex's Vengeance
    if (this.config.level >= 10) {
        this.swingCount++;
        if (this.swingCount % 3 === 0) {
            this.summonEx();
        }
    }
// NOTICE: The following lines have been modified to solve the bug.
  }
  
  canAttack() {
      console.log('canAttack check:', {
        isAttacking: this.isAttacking,
        now: this.scene.time.now,
        attackCooldown: this.attackCooldown,
        can: !this.isAttacking && this.scene.time.now >= this.attackCooldown
      });
      return !this.isAttacking && this.scene.time.now >= this.attackCooldown;
  }
  
  updateConfig() {
      // for runtime changes to config
  }
  
  onEnemyKill(x, y) {
      // Tier I Unlock: Shattercloud
      if (this.config.level >= 3 && Math.random() < this.config.shatterCloudChance) {
          this.createShatterCloud(x, y);
      }
      // Tier II Unlock: Liquid Courage
      if (this.config.level >= 6) {
          const healthPercent = this.player.health / this.player.maxHealth;
          let buzzGain = 0;
          if (healthPercent >= 1.0) { // Blackout
              buzzGain = 25;
          } else if (healthPercent >= 0.9) { // Drunk
              buzzGain = 20;
          } else if (healthPercent >= 0.6) { // Buzzed
              buzzGain = 15;
          } else if (healthPercent >= 0.3) { // Tipsy
              buzzGain = 10;
          }
          if (buzzGain > 0) {
              this.player.heal(buzzGain);
          } else { // Sober
              this.player.applyShameDebuff();
          }
      }
  }
  createShatterCloud(x, y) {
      const gasCloud = this.scene.gasClouds.create(x, y, 'BottleOfRegretGasCloud');
      gasCloud.play('gas-cloud-effect');
      gasCloud.setCircle(32); // Set the physics body size
      gasCloud.setDisplaySize(96, 96);
      gasCloud.setAlpha(0.7);
      gasCloud.setBlendMode('ADD');
      gasCloud.setTint(0xDA70D6); // Orchid color to match debuff
      this.scene.tweens.add({
          targets: gasCloud,
          alpha: 0,
          duration: this.config.shatterCloudDuration,
          ease: 'Sine.easeIn',
          onComplete: () => {
              gasCloud.destroy();
          }
      });
  }
  summonEx() {
    const ex = new GhostlyEx(this.scene, this.player.sprite.x, this.player.sprite.y - 30, this.scene.enemies, this.player);
    this.scene.ghostlyExes.add(ex.sprite);
  }
}