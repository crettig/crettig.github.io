import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
import { GhostlyEx } from './ghostlyEx.js';
import { createClownKnifeDeathEffect, createXPGainEffect } from './particleEffects.js';
export class Enemy {
  constructor(scene, x, y, player) {
    this.scene = scene;
    this.player = player;
    this.target = player.sprite;
    this.health = 50;
    this.maxHealth = 50;
    this.speed = 60;
    this.xpValue = 25;
    this.detectionRange = 150;
    this.isDead = false;
    this.isSlipping = false;
    this.lastAttackTime = 0;
    this.lastHitBy = null;
    this.isInGasCloud = false;
    this.statusEffects = {
      isBurning: false,
      burnDamage: 0,
      burnEndTime: 0,
      lastBurnTick: 0,
      burnEffect: null,
      isShredded: false,
      shredEndTime: 0,
      isVulnerable: false,
      vulnerableEndTime: 0,
      vulnerableBonus: 0,
      isDeafened: false,
      deafenedEndTime: 0,
      isPanicked: false,
      panickedEndTime: 0
    };
    
    this.sprite = scene.physics.add.sprite(x, y, 'ClownKnife');
    this.sprite.setPipeline('Light2D');
    this.sprite.setDisplaySize(48, 48);
    this.sprite.body.setSize(32, 40);
    this.sprite.enemyInstance = this;
    
    this.idleDirection = Math.random() * 360;
    this.changeDirectionTime = 0;
    
    this.healthBarBg = this.scene.add.graphics();
    this.healthBar = this.scene.add.graphics();
    this.statusIconYOffset = -45;
    this.statusIcons = {};
    
    this.updateHealthBar();
    this.healthBarBg.setVisible(false);
    this.healthBar.setVisible(false);
  }

  update(time, delta) {
    if (this.isDead || this.isStunned) return;
    this.updateStatusEffects(time);
    
    if (this.statusEffects.isPanicked) {
        this.fleeFromPlayer();
        return;
    }
    // Reset gas cloud effect if no longer overlapping
    if (this.isInGasCloud && !this.scene.physics.overlap(this.sprite, this.scene.gasClouds)) {
        this.clearGasDebuff();
    }
        
    if (this.isSlipping) {
        // If slipping, don't allow new movement commands, just let current velocity play out
    } else {
       this.updateHealthBarPosition();
       const distanceToPlayer = Phaser.Math.Distance.Between(
           this.sprite.x, this.sprite.y,
           this.target.x, this.target.y
       );
       
       const effectiveDetectionRange = this.detectionRange / (this.player.stats.stealth || 1);
       if (distanceToPlayer < effectiveDetectionRange) {
           this.chasePlayer();
       } else {
           this.idleMovement(time);
       }
    }
  }
  chasePlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.target.x, this.target.y
    );
    const currentSpeed = this.isInGasCloud ? this.speed * 0.5 : this.speed;
    this.sprite.setVelocity(
      Math.cos(angle) * currentSpeed,
      Math.sin(angle) * currentSpeed
    );
    
    if (Math.abs(this.sprite.body.velocity.x) > Math.abs(this.sprite.body.velocity.y)) {
        if (this.sprite.body.velocity.x > 0) {
            this.sprite.anims.play('ClownKnife-walk-right', true);
        } else {
            this.sprite.anims.play('ClownKnife-walk-left', true);
        }
    } else {
        if (this.sprite.body.velocity.y > 0) {
            this.sprite.anims.play('ClownKnife-walk-down', true);
        } else {
            this.sprite.anims.play('ClownKnife-walk-up', true);
        }
    }
    
    this.sprite.setTint(0xFF6B6B);
  }
  idleMovement(time) {
    if (time > this.changeDirectionTime) {
      this.idleDirection = Math.random() * 360;
      this.changeDirectionTime = time + 2000 + Math.random() * 3000;
    }
    
    const moveSpeed = this.speed * 0.3;
    this.sprite.setVelocity(
      Math.cos(this.idleDirection) * moveSpeed,
      Math.sin(this.idleDirection) * moveSpeed
    );
    
    this.sprite.anims.stop();
    this.sprite.setTint(0x90EE90);
  }
  takeDamage(amount, knockback, weaponInstance) {
    this.lastHitBy = weaponInstance;
    
    let damageMultiplier = 1;
    if (this.statusEffects.isShredded) damageMultiplier += 0.25; 
    if (this.statusEffects.isVulnerable) damageMultiplier += this.statusEffects.vulnerableBonus;
    if (this.statusEffects.isDeafened) damageMultiplier *= 1.1; // Take 10% more damage if deafened
    const finalDamage = amount * damageMultiplier;
    
    this.health -= finalDamage;
    this.showDamageNumber(finalDamage, this.healthBarBg.visible);
    if (!this.healthBarBg.visible) {
      this.healthBarBg.setVisible(true);
      this.healthBar.setVisible(true);
    }
    this.updateHealthBar();
    if (knockback) {
        const angle = Phaser.Math.Angle.Between(this.scene.player.sprite.x, this.scene.player.sprite.y, this.sprite.x, this.sprite.y);
        this.scene.physics.velocityFromAngle(angle * 180 / Math.PI, knockback, this.sprite.body.velocity);
    }
    
    this.sprite.setTint(0xFF4444);
    this.scene.time.delayedCall(150, () => {
      if (!this.isDead) {
        this.sprite.setTint(0x90EE90);
      }
    });
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    createClownKnifeDeathEffect(this.scene, this.sprite.x, this.sprite.y);
    this.healthBarBg.destroy();
    this.healthBar.destroy();
    this.sprite.setTint(0x666666);
    this.sprite.setVelocity(0, 0);
    this.scene.audioManager.playSound('ClownKnifeDeath', { volume: 0.7 });
    this.scene.player.gainXP(this.xpValue);
    createXPGainEffect(this.scene, this.sprite.x, this.sprite.y, this.xpValue);
    
    if (this.lastHitBy) {
        if (this.lastHitBy.isGhostlyEx) {
            this.lastHitBy.player.grantBuzzShield(25);
        } else if (typeof this.lastHitBy.onEnemyKill === 'function') {
            this.lastHitBy.onEnemyKill(this.sprite.x, this.sprite.y);
        }
    }
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 1000,
      onComplete: () => {
        this.clearAllStatusEffects();
        Object.values(this.statusIcons).forEach(icon => icon.destroy());
        this.statusIcons = {};
        this.sprite.destroy();
      }
    });
  }
  updateHealthBarPosition() {
    const x = this.sprite.x - 14;
    const y = this.sprite.y - 30;
    this.healthBarBg.setPosition(x, y);
    this.healthBar.setPosition(x, y);
    
    // Update status icon positions
    Object.values(this.statusIcons).forEach((icon, index) => {
        if (icon && icon.active) {
            icon.setPosition(this.sprite.x + (index * 18) - ((Object.keys(this.statusIcons).length - 1) * 9), this.sprite.y + this.statusIconYOffset);
        }
    });
  }
  updateHealthBar() {
    this.healthBarBg.clear();
    this.healthBar.clear();
    const barWidth = 28;
    const barHeight = 4;
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const barColor = healthPercent > 0.6 ? 0x33FF33 : 
                     healthPercent > 0.3 ? 0xFFFF33 : 0xFF3333;
    
    this.healthBarBg.fillStyle(0x000000, 0.7);
    this.healthBarBg.fillRect(0, 0, barWidth, barHeight);
    
    this.healthBar.fillStyle(barColor);
    this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);
    this.updateHealthBarPosition();
  }
  showDamageNumber(damage, isCrit) {
      const x = this.sprite.x + (Math.random() * 20 - 10);
      const y = this.sprite.y - 20;
      const style = {
          ...FontStyles.buzz,
          fontSize: isCrit ? '20px' : '16px',
          fill: isCrit ? '#FFDD00' : '#FFFFFF',
          strokeThickness: isCrit ? 3 : 2
      };
      const damageText = this.scene.add.text(x, y, Math.round(damage).toString(), style)
          .setOrigin(0.5)
          .setDepth(100);
      this.scene.tweens.add({
          targets: damageText,
          y: y - 40,
          alpha: 0,
          duration: 800,
          ease: 'Cubic.easeOut',
          onComplete: () => damageText.destroy()
      });
  }
  slip() {
      this.isSlipping = true;
      this.sprite.body.velocity.x *= 0.5; // Slow down
      this.sprite.body.velocity.y *= 0.5;
      this.sprite.setTint(0xADD8E6); // Light blue tint
      // Chance to fall
      if (Math.random() < 0.25) {
          this.isStunned = true;
          this.sprite.setVelocity(0,0);
          this.sprite.setAngle(90);
          this.scene.time.delayedCall(1000, () => {
              if(this.sprite.active) {
                this.isStunned = false;
                this.sprite.setAngle(0);
              }
          });
      }
      this.scene.time.delayedCall(1000, () => {
          if (this.sprite.active) {
              this.isSlipping = false;
              this.sprite.clearTint();
          }
      });
  }
  applyGasDebuff() {
      if (this.isInGasCloud) return;
      this.isInGasCloud = true;
      this.sprite.setTint(0xDA70D6); // Orchid color for gas effect
  }
  clearGasDebuff() {
      this.isInGasCloud = false;
      if (this.sprite.active && !this.isDead) {
          this.sprite.clearTint();
          // Reset to idle tint
          this.sprite.setTint(0x90EE90);
      }
  }
  
  // --- Status Effect Handlers ---
  
  updateStatusEffects(time) {
    // Burning effect
    if (this.statusEffects.isBurning) {
      if (time > this.statusEffects.burnEndTime) {
        this.clearBurnEffect();
      } else if (time > this.statusEffects.lastBurnTick + 1000) { // Tick every second
        // Dealing damage directly to show smaller damage numbers without crit possibility
        const burnDamageToShow = Math.round(this.statusEffects.burnDamage);
        this.health -= burnDamageToShow;
        this.showDamageNumber(burnDamageToShow, false);
        this.updateHealthBar();
        if (this.health <= 0) this.die();
        this.statusEffects.lastBurnTick = time;
      }
    }
    // Armor Shred effect
    if (this.statusEffects.isShredded && time > this.statusEffects.shredEndTime) {
      this.clearShredEffect();
    }
    
    if (this.statusEffects.isVulnerable && time > this.statusEffects.vulnerableEndTime) {
        this.clearVulnerableEffect();
    }
    if (this.statusEffects.isDeafened && time > this.statusEffects.deafenedEndTime) {
        this.clearDeafenedEffect();
    }
    if (this.statusEffects.isPanicked && time > this.statusEffects.panickedEndTime) {
        this.clearPanicEffect();
    }
  }
  applyBurn(damage, duration, weapon) {
    const s = this.statusEffects;
    s.isBurning = true;
    s.burnDamage = damage;
    s.burnEndTime = this.scene.time.now + duration;
    s.lastBurnTick = this.scene.time.now - 1001; // Ensure first tick happens immediately
    if (!s.burnEffect) {
        s.burnEffect = this.scene.add.particles(0, 0, 'soft-particle', {
            speed: { min: 10, max: 30 },
            angle: { min: 250, max: 290 },
            scale: { start: 0.2, end: 0, ease: 'sine.in' },
            lifespan: { min: 300, max: 600 },
            quantity: 1,
            frequency: 100,
            blendMode: 'ADD',
            tint: 0xFF8C00
        });
        s.burnEffect.startFollow(this.sprite, 0, -20);
    }
  }
  clearBurnEffect() {
    const s = this.statusEffects;
    s.isBurning = false;
    if (s.burnEffect) {
      s.burnEffect.destroy();
      s.burnEffect = null;
    }
  }
  applyShred(duration, value) {
      if (!this.statusEffects.isShredded) {
        this.addStatusIcon('shred', 'ArmorShredIcon');
      }
      this.statusEffects.isShredded = true;
      this.statusEffects.shredEndTime = this.scene.time.now + duration;
  }
  clearShredEffect() {
      this.statusEffects.isShredded = false;
      this.removeStatusIcon('shred');
  }
  clearAllStatusEffects() {
    this.clearBurnEffect();
    this.clearShredEffect();
    this.clearVulnerableEffect();
    this.clearDeafenedEffect();
    this.clearPanicEffect();
  }
  applyStatus(type, duration, value) {
      switch (type) {
          case 'vulnerable': this.applyVulnerable(duration, value); break;
          case 'deafened': this.applyDeafened(duration); break;
          case 'panic': this.applyPanic(duration); break;
          case 'armorShred': this.applyShred(duration, value); break;
      }
  }
  applyVulnerable(duration, bonus) {
      if (!this.statusEffects.isVulnerable) {
          this.addStatusIcon('vulnerable', 'VulnerableIcon');
      }
      this.statusEffects.isVulnerable = true;
      this.statusEffects.vulnerableEndTime = this.scene.time.now + duration;
      this.statusEffects.vulnerableBonus = bonus;
  }
  clearVulnerableEffect() {
      this.statusEffects.isVulnerable = false;
      this.removeStatusIcon('vulnerable');
  }
  applyDeafened(duration) {
      if (!this.statusEffects.isDeafened) {
          this.addStatusIcon('deafened', 'DeafenedIcon');
      }
      this.statusEffects.isDeafened = true;
      this.statusEffects.deafenedEndTime = this.scene.time.now + duration;
  }
  clearDeafenedEffect() {
      this.statusEffects.isDeafened = false;
      this.removeStatusIcon('deafened');
  }
  applyPanic(duration) {
      if (!this.statusEffects.isPanicked) {
          this.addStatusIcon('panic', 'PanicIcon');
      }
      this.statusEffects.isPanicked = true;
      this.statusEffects.panickedEndTime = this.scene.time.now + duration;
  }
  clearPanicEffect() {
      this.statusEffects.isPanicked = false;
      this.removeStatusIcon('panic');
  }
  fleeFromPlayer() {
      const angle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.sprite.x, this.sprite.y);
      const fleeSpeed = this.speed * 1.2; // Move faster when panicked
      this.sprite.setVelocity(Math.cos(angle) * fleeSpeed, Math.sin(angle) * fleeSpeed);
      this.updateAnimationFromVelocity();
  }
  updateAnimationFromVelocity() {
    if (Math.abs(this.sprite.body.velocity.x) > Math.abs(this.sprite.body.velocity.y)) {
        this.sprite.anims.play(this.sprite.body.velocity.x > 0 ? 'ClownKnife-walk-right' : 'ClownKnife-walk-left', true);
    } else {
        this.sprite.anims.play(this.sprite.body.velocity.y > 0 ? 'ClownKnife-walk-down' : 'ClownKnife-walk-up', true);
    }
  }
  addStatusIcon(key, texture) {
      if (this.statusIcons[key]) return;
      const icon = this.scene.add.image(this.sprite.x, this.sprite.y + this.statusIconYOffset, texture)
          .setScale(0.25)
          .setDepth(this.sprite.depth + 1);
      this.statusIcons[key] = icon;
      this.updateHealthBarPosition(); // To reposition icons
  }
  removeStatusIcon(key) {
      if (this.statusIcons[key]) {
          this.statusIcons[key].destroy();
          delete this.statusIcons[key];
          this.updateHealthBarPosition(); // To reposition remaining icons
      }
  }
}