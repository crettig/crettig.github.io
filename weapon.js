import { createHitSparks } from './particleEffects.js';
import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
export class Weapon {
  constructor(scene, player, key, config) {
    this.scene = scene;
    this.player = player;
    this.config = config;
    // Apply player stats to weapon config
    this.config.damage *= this.player.stats.strength;
    this.config.attackSpeed /= this.player.stats.haste;
    if (this.config.swingDuration) {
        this.config.swingDuration /= this.player.stats.haste;
    }
    this.isAttacking = false;
    this.hitEnemies = [];
    this.attackTween = null;
    this.lastAttackTime = 0;
    this.sprite = scene.physics.add.sprite(player.sprite.x, player.sprite.y, key);
    this.sprite.setPipeline('Light2D');
    this.sprite.setVisible(false);
    this.sprite.body.setEnable(false);
    this.sprite.setOrigin(0.5, 0.85);
    this.sprite.weaponInstance = this;
  }
  onEnemyKill(x, y) {
      // Base method, can be overridden by specific weapons
  }
  upgrade() {
      this.config.level++;
      this.config.damage *= 1.2;
      if (this.config.attackSpeed > 50) {
          this.config.attackSpeed *= 0.95;
      }
  }
  update() {
    if (this.isAttacking) {
      this.sprite.setAngle(this.attackTween.getValue() + 90);
    } else {
       this.sprite.setPosition(this.player.sprite.x, this.player.sprite.y);
       const angleToMouse = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
           this.player.sprite.x, this.player.sprite.y,
           this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY
       ));
       this.sprite.setAngle(angleToMouse + 90);
    }
  }
  attack(pointer) {
    if (this.isAttacking) return;
    this.lastAttackTime = this.scene.time.now;
    this.isAttacking = true;
    this.hitEnemies = [];
    
    this.sprite.setVisible(true);
    this.sprite.body.setEnable(true);
    this.scene.audioManager.playSound('bottleSwing', { volume: 0.5 });
    
    const attackAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
        this.player.sprite.x, this.player.sprite.y, 
        pointer.worldX, pointer.worldY
    ));
    const swingArc = this.config.swingArc || 180;
    const startAngle = attackAngle - (swingArc / 2);
    const endAngle = attackAngle + (swingArc / 2);
    
    this.attackTween = this.scene.tweens.addCounter({
        from: startAngle,
        to: endAngle,
        duration: this.config.swingDuration,
        ease: 'Power2',
        onUpdate: (tween) => {
            const currentAngle = tween.getValue();
            const radAngle = Phaser.Math.DegToRad(currentAngle);
            const reach = this.config.xoffset || 32; // Use xoffset as reach
            const weaponOffset = 32; // How far the weapon sprite is from its attack center
            
            // Calculate the center of the attack arc based on player and reach
            const attackCenterX = this.player.sprite.x + Math.cos(radAngle) * reach;
            const attackCenterY = this.player.sprite.y + Math.sin(radAngle) * reach;
            // Position the weapon sprite itself
            const spriteOffsetX = Math.cos(radAngle) * weaponOffset;
            const spriteOffsetY = Math.sin(radAngle) * weaponOffset;
            this.sprite.setPosition(attackCenterX + spriteOffsetX, attackCenterY + spriteOffsetY);
        },
        onComplete: () => {
            this.sprite.body.setEnable(false);
            this.sprite.setVisible(false);
            this.isAttacking = false;
            this.attackTween = null;
        }
    });
  }
  
  canAttack() {
      const now = this.scene.time.now;
      return now > this.lastAttackTime + this.config.attackSpeed;
  }
  
  resetCooldown() {
      this.lastAttackTime = 0;
  }
  
  onHit(enemySprite) {
      if (!enemySprite.active || this.hitEnemies.includes(enemySprite)) return;
      this.hitEnemies.push(enemySprite);
      
      createHitSparks(this.scene, enemySprite.x, enemySprite.y);
      
      if (enemySprite.enemyInstance) {
          const isCrit = Math.random() < this.getCritChance();
          const critMultiplier = 2;
          const damage = isCrit ? this.config.damage * critMultiplier : this.config.damage;
          if (isCrit) {
              this.showCritEffect(enemySprite.x, enemySprite.y);
              if (this.config.critSound) {
                  this.scene.audioManager.playSound(this.config.critSound, { volume: 0.9 });
              }
          } else if (this.config.hitSound) {
              this.scene.audioManager.playSound(this.config.hitSound, { volume: 0.6 });
          }
          enemySprite.enemyInstance.takeDamage(damage, this.config.knockback, this);
      }
  }
  getCritChance() {
    let finalCritChance = this.config.critChance * this.player.stats.luck;
    // Jackpot Javelin Tier 1 Bonus
    if (this.constructor.name === 'JackpotJavelin' && this.config.level >= 3) {
        if (this.player.buzzShield / this.player.maxBuzzShield >= 0.5) {
            finalCritChance += 0.10;
        }
    }
    
    return finalCritChance;
  }
  showCritEffect(x, y) {
      const critText = this.scene.add.text(x, y - 20, 'CRIT!', {
          ...FontStyles.title,
          fontSize: '28px',
          fill: '#FF3333',
          stroke: '#FFFFFF',
          strokeThickness: 5
      }).setOrigin(0.5).setDepth(100);
      this.scene.tweens.add({
          targets: critText,
          y: y - 70,
          alpha: 0,
          duration: 1000,
          ease: 'Power1',
          onComplete: () => critText.destroy()
      });
  }
}