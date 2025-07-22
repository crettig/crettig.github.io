import Phaser from 'phaser';
import { createSonicBlastEffect } from './particleEffects.js';

export class MeatHorn {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.config = {
      damage: 35, // High base damage for the center
      attackSpeed: 750, // ms, medium speed
      knockback: 120, // Strong knockback
      critChance: 0, // No crits
      hitSound: 'MeatHornAttack',
      level: 1,
      coneAngle: 180, // degrees for the full cone
      coneInnerAngle: 60, // degrees for high-damage center
      outerDamageMultiplier: 0.5,
      deafenedDuration: 3000, // ms
      // Gutter Roar (Tier I)
      panicChance: 0.25,
      panicDuration: 2000, // ms
      // Pressure Blowout (Tier II)
      armorShredPercentage: 0.35,
      armorShredDuration: 5000, // ms
      // Clown Crusher (Tier III)
      clownCrusherChargeTime: 1200, // ms
      clownCrusherConeAngle: 60, // degrees
      vulnerabilityBonus: 0.2, // 20%
      vulnerabilityDuration: 10000, // ms
    };
    // The visual sprite for the weapon, attached to the player
    this.sprite = scene.physics.add.sprite(player.sprite.x, player.sprite.y, 'MeatHornModel');
    this.sprite.setOrigin(0, 0.5); // Pivot from the handle
    this.sprite.setDisplaySize(48, 48);
    this.sprite.body.setEnable(false);
    this.sprite.setDepth(player.sprite.depth + 1);
    this.sprite.setVisible(false); // Only show during attack

    this.isAttacking = false;
    this.attackCooldown = 0;
    this.isCharging = false;
    this.chargeStartTime = 0;
    this.chargeSoundInstance = null;
    
    this.chargeIndicator = this.scene.add.graphics().setDepth(player.sprite.depth + 2);
    this.lanceEffect = this.scene.add.graphics().setDepth(player.sprite.depth);
    
    // The player class now handles calling endAttack.
    // this.scene.input.on('pointerup', this.endAttack, this);
  }

  // Placeholder for future upgrades
  upgrade() {
    this.config.level++;
    this.config.damage *= 1.12;
    this.config.knockback *= 1.08;
    // Tier-specific upgrades
    if (this.config.level === 3) { // Gutter Roar
      this.config.attackSpeed *= 0.95; // Minor speed boost
    }
    if (this.config.level === 6) { // Pressure Blowout
      this.config.knockback *= 1.3;
      this.scene.audioManager.playSound('MeatHornOvercharge', { volume: 0.8 });
    }
    if (this.config.level === 10) { // Clown Crusher
        this.config.damage *= 1.25; // Base damage buff
    }
  }
  
  updateConfig() {
      // for runtime changes to config
  }

  // Point the horn towards the cursor
  update(time, delta) {
    if (!this.player.sprite.active) return;
    
    const isTouch = this.scene.sys.game.device.input.touch;
    let angle = 0;
    if (isTouch && this.player.mobileAttackVector.length() > 0) {
        // On mobile, aim based on the directional attack buttons
        angle = this.player.mobileAttackVector.angle();
    } else {
        // On desktop, aim with the mouse
        const worldPointer = this.scene.cameras.main.getWorldPoint(this.scene.input.activePointer.x, this.scene.input.activePointer.y);
        angle = Phaser.Math.Angle.Between(this.player.sprite.x, this.player.sprite.y, worldPointer.x, worldPointer.y);
    }
    
    this.sprite.setPosition(this.player.sprite.x, this.player.sprite.y);
    this.sprite.rotation = angle;
    
    // Flip the weapon sprite based on cursor position
    if (Math.abs(Phaser.Math.RadToDeg(angle)) > 90) {
        this.sprite.setFlipY(true);
    } else {
        this.sprite.setFlipY(false);
        this.sprite.setFlipY(false);
    }
    
    if (this.isCharging) {
        this.updateChargeIndicator();
    }
  }
  updateChargeIndicator() {
      const chargePercent = Math.min((this.scene.time.now - this.chargeStartTime) / this.config.clownCrusherChargeTime, 1);
      this.chargeIndicator.clear();
      
      // Draw background circle
      this.chargeIndicator.fillStyle(0x000000, 0.5);
      this.chargeIndicator.fillCircle(this.player.sprite.x, this.player.sprite.y, 20);
      
      // Draw foreground arc
      this.chargeIndicator.lineStyle(4, 0xff0000, 1);
      this.chargeIndicator.beginPath();
      this.chargeIndicator.arc(this.player.sprite.x, this.player.sprite.y, 20, -90 * Phaser.Math.DEG_TO_RAD, (-90 + 360 * chargePercent) * Phaser.Math.DEG_TO_RAD, false);
      this.chargeIndicator.strokePath();
      
      if (chargePercent >= 1) {
          this.chargeIndicator.lineStyle(6, 0xffffff, 1);
          this.chargeIndicator.strokeCircle(this.player.sprite.x, this.player.sprite.y, 20);
      }
  }
  attack(pointer) { // This is now the "start attack"
    if (this.isAttacking || this.scene.time.now < this.attackCooldown) return;
    if (this.config.level >= 10) {
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        if (this.scene.audioManager) {
          this.chargeSoundInstance = this.scene.audioManager.playSound('MeatHornCharge', { loop: true, volume: 0.7 });
        }
    } else {
        this.fireRegularBlast();
    }
  }
  endAttack(pointer) {
      if (this.isCharging) {
          const chargeDuration = this.scene.time.now - this.chargeStartTime;
          if (chargeDuration >= this.config.clownCrusherChargeTime) {
              this.fireSonicLance();
          } else {
              this.fireRegularBlast();
          }
          this.isCharging = false;
          this.chargeIndicator.clear();
          if (this.chargeSoundInstance) {
              this.chargeSoundInstance.stop();
              this.chargeSoundInstance = null;
          }
      }
  }
  fireSonicLance() {
      this.isAttacking = true;
      this.attackCooldown = this.scene.time.now + this.config.attackSpeed * 1.25; // Cooldown adjusted for balance
      this.sprite.setVisible(true);
      
      this.scene.audioManager.playSound('MeatHornClownCrusher', { volume: 1.0 });
      
      const attackAngleRad = this.sprite.rotation;
      const attackRange = 400; // Longer range for the lance
      // Sonic Lance visual effect
      this.lanceEffect.clear();
      this.lanceEffect.setAngle(Phaser.Math.RadToDeg(attackAngleRad));
      this.lanceEffect.setPosition(this.player.sprite.x, this.player.sprite.y);
      this.scene.tweens.add({
          targets: { width: 40, length: 0, alpha: 1 },
          width: 5,
          length: attackRange,
          alpha: 0,
          duration: 200,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
              const { width, length, alpha } = tween.targets[0];
              this.lanceEffect.clear();
              this.lanceEffect.fillStyle(0xFFFFFF, alpha);
              this.lanceEffect.fillTriangle(0, 0, length, -width / 2, length, width / 2);
          },
          onComplete: () => {
              this.lanceEffect.clear();
          }
      });
      this.scene.enemies.children.each(enemy => {
          if (!enemy.active || !enemy.enemyInstance) return;
          const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, enemy.x, enemy.y);
          if (distance > attackRange) return;
          const angleToEnemy = Phaser.Math.Angle.Between(this.player.sprite.x, this.player.sprite.y, enemy.x, enemy.y);
          const angleDiff = Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(attackAngleRad), Phaser.Math.RadToDeg(angleToEnemy));
          if (Math.abs(angleDiff) <= this.config.clownCrusherConeAngle / 2) {
              enemy.enemyInstance.takeDamage(this.config.damage * 2.5, this.config.knockback * 1.5, this); // Higher damage & knockback
              enemy.enemyInstance.applyStatus('vulnerable', this.config.vulnerabilityDuration, this.config.vulnerabilityBonus);
          }
      });
      this.scene.time.delayedCall(200, () => this.sprite.setVisible(false));
      this.scene.time.delayedCall(this.config.attackSpeed * 1.25, () => {
          this.isAttacking = false;
      });
  }
  fireRegularBlast() {
    this.isAttacking = true;
    this.attackCooldown = this.scene.time.now + this.config.attackSpeed;
    
    this.sprite.setVisible(true);
    this.scene.audioManager.playSound(this.config.hitSound, { volume: 0.8 });
    const attackAngleRad = this.sprite.rotation;
    // Use the new particle effect
    createSonicBlastEffect(
      this.scene,
      this.player.sprite.x,
      this.player.sprite.y,
      attackAngleRad,
      this.config.coneAngle,
      this.config.coneInnerAngle
    );
    // Hide the weapon sprite after a short duration
    this.scene.time.delayedCall(200, () => this.sprite.setVisible(false));
    const hitEnemies = new Set();
    const attackRange = 250;
    this.scene.enemies.children.each(enemy => {
      if (!enemy.active || !enemy.enemyInstance || hitEnemies.has(enemy)) return;
      const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, enemy.x, enemy.y);
      if (distance > attackRange) return;
      const angleToEnemy = Phaser.Math.Angle.Between(this.player.sprite.x, this.player.sprite.y, enemy.x, enemy.y);
      let angleDiff = Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(attackAngleRad), Phaser.Math.RadToDeg(angleToEnemy));
      
      if (Math.abs(angleDiff) <= this.config.coneAngle / 2) {
        let damage = this.config.damage;
        if (Math.abs(angleDiff) > this.config.coneInnerAngle / 2) {
          damage *= this.config.outerDamageMultiplier;
        }
        enemy.enemyInstance.takeDamage(damage, this.config.knockback, this);
        enemy.enemyInstance.applyStatus('deafened', this.config.deafenedDuration);
        if (this.config.level >= 3) {
          const currentPanicChance = this.config.panicChance; 
          if (Math.random() < currentPanicChance) {
            enemy.enemyInstance.applyStatus('panic', this.config.panicDuration);
            this.scene.audioManager.playSound('MeatHornPanicSFX', { volume: 0.6, detune: Math.random() * 400 - 200 });
          }
        }
        if (this.config.level >= 6) {
            enemy.enemyInstance.applyStatus('armorShred', this.config.armorShredDuration, this.config.armorShredPercentage);
        }
        hitEnemies.add(enemy);
      }
    });
    this.scene.time.delayedCall(this.config.attackSpeed, () => {
      this.isAttacking = false;
    });
  }
  canAttack() {
    return !this.isAttacking && this.scene.time.now >= this.attackCooldown;
  }
}