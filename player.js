import { BottleOfRegret } from './bottleOfRegret.js';
import { BoomerangFlask } from './boomerangFlask.js';
import { JackpotJavelin } from './jackpotJavelin.js';
import { MeatHorn } from './meatHorn.js';
import { FontStyles } from './fontStyles.js';
import { Characters } from './characterData.js';
export class Player {
  constructor(scene, x, y, characterKey) {
    this.scene = scene;
    this.characterKey = characterKey;
    this.mobileAttackVector = new Phaser.Math.Vector2(0, 0);
    this.stats = Characters[this.characterKey];
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.buzzShield = 0;
    this.maxBuzzShield = 50; // Max shield capacity
    this.speed = 180 * this.stats.movement;
    this.lastDamageTime = 0;
    this.lastDirection = 'down';
    this.isAttacking = false; // General flag, but individual weapons manage their own cooldowns
    this.attackStartTime = 0;
    this.isAttackHeld = false;
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;
    this.sprite = scene.physics.add.sprite(x, y, this.characterKey);
    this.sprite.setPipeline('Light2D');
    this.sprite.setDisplaySize(48, 48);
    this.sprite.body.setSize(24, 32).setOffset(12, 16);
    this.sprite.setCollideWorldBounds(true);
    
    this.sprite.anims.play(`${this.characterKey}-walk-down`);
    this.sprite.anims.stop();
    this.weapons = [
      new BottleOfRegret(scene, this),
      new BoomerangFlask(scene, this),
      new JackpotJavelin(scene, this),
      new MeatHorn(scene, this)
    ];
    this.currentWeaponIndex = 0;
    this.weapon = this.weapons[this.currentWeaponIndex];
    this.weapons.forEach((w, index) => {
        if(index !== this.currentWeaponIndex) {
            w.sprite.setVisible(false);
            w.sprite.body.setEnable(false);
        }
    });
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.switchWeapon(deltaY);
    });
    this.playSpawnSound();
    
    this.stealthIndicator = this.scene.add.graphics();
    this.stealthIndicator.setDepth(this.sprite.depth - 1); // Draw behind player
  }
  applyShameDebuff() {
      if (this.shameDebuffActive) return;
      this.shameDebuffActive = true;
      this.stats.haste *= 0.9; // -10% attack speed
      this.weapons.forEach(w => w.updateConfig());
      const shameText = this.scene.add.text(this.sprite.x, this.sprite.y - 40, 'SHAME!', {
          ...FontStyles.buzz,
          fontSize: '22px',
          fill: '#FFA07A' // Light Salmon color
      }).setOrigin(0.5).setDepth(101);
      this.scene.tweens.add({
          targets: shameText,
          y: this.sprite.y - 70,
          alpha: 0,
          duration: 1500,
          ease: 'Power1',
          onComplete: () => shameText.destroy()
      });
      this.scene.time.delayedCall(5000, () => {
          this.shameDebuffActive = false;
          this.stats.haste /= 0.9; // Restore haste
          this.weapons.forEach(w => w.updateConfig());
      });
  }
  switchWeapon(scrollDelta) {
    if (this.isAttacking || this.isAttackHeld) return;
    this.weapon.sprite.setVisible(false);
    if (scrollDelta > 0) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    } else {
      this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    }
    this.weapon = this.weapons[this.currentWeaponIndex];
    this.weapon.sprite.setVisible(true);
    this.scene.uiManager.updateWeaponUI();
  }
  update(cursors, wasd, joystickCursors) {
    this.weapon.update();
    this.updateStealthIndicator();
    
    // Buzz shield decay
    if (this.buzzShield > 0) {
        this.buzzShield -= 0.1; // Decay rate
        if (this.buzzShield < 0) this.buzzShield = 0;
    }
    // Attack logic
    const pointer = this.scene.input.activePointer;
    const isTouch = this.scene.sys.game.device.input.touch;
    let isAttackingNow = false;
    let attackPointer = pointer; // Default to mouse/touch pointer
    if (isTouch) {
        const buttons = this.scene.uiManager.directionalAttackButtons;
        this.mobileAttackVector.reset();
        if (buttons.up?.isDown) this.mobileAttackVector.y -= 1;
        if (buttons.down?.isDown) this.mobileAttackVector.y += 1;
        if (buttons.left?.isDown) this.mobileAttackVector.x -= 1;
        if (buttons.right?.isDown) this.mobileAttackVector.x += 1;
        isAttackingNow = this.mobileAttackVector.length() > 0;
        if(isAttackingNow) {
            // Create a fake pointer object for aiming
            attackPointer = {
                worldX: this.sprite.x + this.mobileAttackVector.x * 100,
                worldY: this.sprite.y + this.mobileAttackVector.y * 100,
                isDown: true
            };
        }
    } else {
        const isPointerOnJoystick = this.scene.joyStick && this.scene.joyStick.pointer === pointer;
        isAttackingNow = pointer.isDown && !isPointerOnJoystick;
    }
    // Check for attack start (press)
    if (isAttackingNow && !this.isAttackHeld) {
      if (this.weapon.canAttack()) {
        this.weapon.attack(attackPointer);
      }
    }
    // Check for attack end (release)
    else if (!isAttackingNow && this.isAttackHeld) {
      if (typeof this.weapon.endAttack === 'function') {
        this.weapon.endAttack(pointer);
      }
    }
    
    this.isAttackHeld = isAttackingNow;
    let velocityX = 0;
    let velocityY = 0;
    if (cursors.left.isDown || wasd.A.isDown || joystickCursors.left.isDown) {
      velocityX = -this.speed;
    } else if (cursors.right.isDown || wasd.D.isDown || joystickCursors.right.isDown) {
      velocityX = this.speed;
    }
    if (cursors.up.isDown || wasd.W.isDown || joystickCursors.up.isDown) {
      velocityY = -this.speed;
      } else if (cursors.down.isDown || wasd.S.isDown || joystickCursors.down.isDown) {
      velocityY = this.speed;
    }
    if (!this.weapon.isAttacking) {
       this.weapon.sprite.setVisible(true);
    }
    this.sprite.setVelocity(velocityX, velocityY);
    if (velocityX !== 0 || velocityY !== 0) {
      if (velocityY < 0) {
        this.sprite.anims.play(`${this.characterKey}-walk-up`, true);
        this.lastDirection = 'up';
      } else if (velocityY > 0) {
        this.sprite.anims.play(`${this.characterKey}-walk-down`, true);
        this.lastDirection = 'down';
      } else if (velocityX < 0) {
        this.sprite.anims.play(`${this.characterKey}-walk-left`, true);
        this.lastDirection = 'left';
      } else if (velocityX > 0) {
        this.sprite.anims.play(`${this.characterKey}-walk-right`, true);
        this.lastDirection = 'right';
      }
    } else {
      this.sprite.anims.stop();
    }
  }

  takeDamage(amount) {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastDamageTime > 500 && this.health > 0) {
      if (this.buzzShield > 0) {
          const damageAbsorbed = Math.min(this.buzzShield, amount);
          this.buzzShield -= damageAbsorbed;
          amount -= damageAbsorbed;
      }
      if (amount > 0) {
        this.health = Math.max(0, this.health - amount);
      }
      this.lastDamageTime = currentTime;
      
      this.sprite.setTint(0xFF6666);
      this.scene.time.delayedCall(200, () => {
        if (this.sprite.active) {
            this.sprite.clearTint();
        }
      });
      this.scene.cameras.main.shake(150, 0.015);
      this.playHitSound();
      if (this.health <= 0) {
          this.die();
      }
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.sprite.setTint(0x66FF66);
    this.scene.time.delayedCall(300, () => {
        if (this.sprite.active) {
            this.sprite.clearTint();
        }
    });
  }
  die() {
      this.sprite.setVelocity(0, 0);
      this.sprite.anims.stop();
      this.sprite.setTint(0x444444);
      this.scene.handlePlayerDeath();
  }
  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
        this.levelUp();
    }
  }
  levelUp() {
      this.level++;
      this.xp -= this.xpToNextLevel;
      this.xpToNextLevel = Math.floor(100 * Math.pow(1.15, this.level - 1));
      
      this.showLevelUpEffect();
      
      this.scene.physics.pause();
      this.scene.tweens.pauseAll();
      this.scene.scene.launch('LevelUpScene', { player: this });
  }
  showLevelUpEffect() {
      // Trigger a level up effect
      const levelUpText = this.scene.add.text(this.sprite.x, this.sprite.y - 40, 'LEVEL UP!', {
          ...FontStyles.title,
          fontSize: '24px',
          strokeThickness: 4,
          fill: '#33FF33'
      }).setOrigin(0.5).setDepth(101);
      this.scene.tweens.add({
          targets: levelUpText,
          y: this.sprite.y - 80,
          alpha: 0,
          duration: 1500,
          ease: 'Power1',
          onComplete: () => levelUpText.destroy()
      });
  }
  grantBuzzShield(amount) {
    this.buzzShield = Math.min(this.maxBuzzShield, this.buzzShield + amount);
    if (this.shieldGainTween) this.shieldGainTween.stop();
    this.shieldGainTween = this.scene.tweens.add({
        targets: this.scene.uiManager.shieldBar,
        scaleX: [1.1, 1],
        scaleY: [1.1, 1],
        duration: 200,
        ease: 'Sine.easeInOut'
    });
  }
  playSpawnSound() {
      const soundKey = this.stats.sounds?.spawn;
      if (soundKey) {
          this.scene.audioManager.playSound(soundKey, { volume: 0.8 });
      }
  }
  playHitSound() {
      const soundKey = this.stats.sounds?.hit;
      if (soundKey) {
          this.scene.audioManager.playSound(soundKey, { volume: 0.7 });
      }
  }
  playDeathSound() {
      const soundKey = this.stats.sounds?.death;
      if (soundKey) {
          this.scene.audioManager.playSound(soundKey, { volume: 0.9 });
      }
  }
  updateStealthIndicator() {
    this.stealthIndicator.clear();
    
    // We assume a base enemy detection range of 150 for the visualizer, as defined in Enemy.js.
    const baseDetectionRange = 150;
    const effectiveRadius = baseDetectionRange / (this.stats.stealth || 1);
    
    this.stealthIndicator.lineStyle(2, 0x00FFFF, 0.25); // Cyan, semi-transparent
    this.stealthIndicator.strokeCircle(this.sprite.x, this.sprite.y, effectiveRadius);
    this.stealthIndicator.setDepth(this.sprite.depth - 1);
  }
}