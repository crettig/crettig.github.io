import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
import { getSoftParticleTextureKey } from './particleEffects.js';
export class BoomerangFlask {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.physics.add.sprite(player.sprite.x, player.sprite.y, 'boomerangFlask');
    this.sprite.setPipeline('Light2D');
    this.sprite.setVisible(false);
    this.sprite.body.setEnable(false);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.weaponInstance = this;
    this.sprite.setDisplaySize(32, 32);
    this.isAttacking = false;
    this.throwSpeed = 400;
    this.returnSpeed = 500;
    this.rotationSpeed = 15;
    this.hitEnemies = new Set();
    this.canPerfectCatch = false;
    this.perfectCatchTimer = null;
    this.returnOverlap = null;
    this.maxRicochets = 3;
    this.ricochetCount = 0;
    this.attackTimeout = null;
    this.isOnCooldown = false;
    this.isMiss = false;
    this.cooldownStartTime = 0;
    this.trailParticles = null;
    this.isReturning = false;
    this.lastAttackAngle = 0;
    this.ghostFlasks = [];
    this.lastPuddleTime = 0;
    this.lastGhostTime = 0;
    this.config = {
        damage: 25,
        knockback: 50,
        attackSpeed: 700,
        level: 1,
        missTimeout: 2500,
        missCooldown: 5000,
        critChance: 0.05,
        critSound: 'BoomerangCrit'
    };
    this.obstacleCollider = null;
    // Apply player stats to weapon config
    this.config.damage *= this.player.stats.strength;
    this.config.missTimeout /= this.player.stats.haste;
    this.config.missCooldown /= this.player.stats.haste;
    this.config.attackSpeed /= this.player.stats.haste;
  }
  upgrade() {
      this.config.level++;
      this.config.damage *= 1.15;
      this.config.knockback *= 1.1;
      if(this.config.level % 2 === 0) {
          this.maxRicochets++;
      }
      if (this.config.level >= 5 && !this.trailParticles) {
          this.createTrailEffect();
      }
  }
  createTrailEffect() {
      const particleKey = getSoftParticleTextureKey(this.scene);
      this.trailParticles = this.scene.add.particles(0, 0, particleKey, {
          speed: 10,
          scale: { start: 0.2, end: 0 },
          lifespan: 350,
          blendMode: 'ADD',
          tint: 0x00ffaa,
          frequency: 30,
      });
      this.trailParticles.stop();
      this.trailParticles.startFollow(this.sprite);
  }
  updateConfig() {
      // for runtime changes to config
  }
  update() {
    if (!this.isAttacking) {
      this.sprite.setPosition(this.player.sprite.x, this.player.sprite.y);
      this.sprite.setVisible(false);
    } else {
        this.sprite.angle += this.rotationSpeed;
        if (this.isReturning) {
            if (this.config.level >= 3) {
                this.leavePuddle();
            }
            if (this.config.level >= 2) {
                this.createGhostAfterimage();
            }
        }
        this.updateGhostFlasks();
    }
  }

  attack(pointer) {
    if (this.isAttacking || this.isOnCooldown) return;
    this.isAttacking = true;
    this.isAttacking = true;
    this.isMiss = false;
    this.isReturning = false;
    this.hitEnemies.clear();
    this.ricochetCount = 0;
    if (this.returnOverlap) {
        this.returnOverlap.destroy();
        this.returnOverlap = null;
    }
    this.sprite.setPosition(this.player.sprite.x, this.player.sprite.y);
    this.sprite.setVisible(true);
    this.sprite.body.setEnable(true);
    this.sprite.body.setBounce(1, 1);
    this.sprite.body.setCollideWorldBounds(true);
    this.scene.audioManager.playSound('boomerangThrow', { volume: 0.6 });
    if (this.trailParticles) {
        this.trailParticles.start();
    }
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      pointer.worldX, pointer.worldY
    );
    this.lastAttackAngle = angle;
    this.scene.physics.velocityFromRotation(this.lastAttackAngle, this.throwSpeed, this.sprite.body.velocity);
    if(this.attackTimeout) this.attackTimeout.remove();
    this.startMissTimer();
    if (this.scene.obstacles) {
        this.obstacleCollider = this.scene.physics.add.collider(this.sprite, this.scene.obstacles, this.onObstacleHit, null, this);
    }
  }
  
  returnToPlayer() {
    if (!this.sprite.active) return;
    this.isReturning = true;
    if (this.config.level >= 10) {
        this.scene.time.delayedCall(1000, () => this.createDopplerGhost());
    }
    this.scene.physics.moveToObject(this.sprite, this.player.sprite, this.returnSpeed);
    this.canPerfectCatch = true;
    if (this.perfectCatchTimer) {
      this.perfectCatchTimer.remove();
    }
    this.perfectCatchTimer = this.scene.time.delayedCall(400, () => {
      this.canPerfectCatch = false;
    }, [], this);
    if (this.returnOverlap) {
        this.returnOverlap.destroy();
    }
    this.returnOverlap = this.scene.physics.add.overlap(this.sprite, this.player.sprite, this.handleCatch, null, this);
  }
  handleCatch() {
    if (this.isMiss) {
        this.isOnCooldown = true;
        this.cooldownStartTime = this.scene.time.now;
        this.scene.time.delayedCall(this.config.missCooldown, () => {
            this.isOnCooldown = false;
        });
        this.player.takeDamage(10);
        this.scene.audioManager.playSound('boomerangCatchFail', { volume: 0.7 });
    } else if (this.canPerfectCatch) {
        this.player.heal(5);
        this.scene.audioManager.playSound('boomerangCatchSuccess', { volume: 0.5 });
    } else {
        this.player.takeDamage(10);
        this.scene.audioManager.playSound('boomerangCatchFail', { volume: 0.7 });
    }
    
    if (this.trailParticles) {
        this.trailParticles.stop();
    }
    this.isAttacking = false;
    this.isReturning = false;
    this.sprite.body.setEnable(false);
    this.sprite.body.setVelocity(0, 0);
    this.canPerfectCatch = false;
    
    if (this.perfectCatchTimer) {
        this.perfectCatchTimer.remove();
        this.perfectCatchTimer = null;
    }
    if (this.returnOverlap) {
        this.returnOverlap.destroy();
        this.returnOverlap = null;
    }
    this.sprite.body.setCollideWorldBounds(false);
    if (this.attackTimeout) {
        this.attackTimeout.remove();
        this.attackTimeout = null;
    }
    this.isAttacking = false;
    this.isReturning = false;
    this.sprite.body.setEnable(false);
    this.sprite.body.setVelocity(0, 0);
    this.canPerfectCatch = false;
    
    if (this.perfectCatchTimer) {
        this.perfectCatchTimer.remove();
        this.perfectCatchTimer = null;
    }
    if (this.returnOverlap) {
        this.returnOverlap.destroy();
        this.returnOverlap = null;
    }
    if (this.obstacleCollider) {
        this.obstacleCollider.destroy();
        this.obstacleCollider = null;
    }
  }
  ricochet() {
    this.ricochetCount++;
    this.scene.audioManager.playSound('boomerangRicochet', { volume: 0.5 });
    this.startMissTimer(); // Reset miss timer on ricochet
    if (this.ricochetCount >= this.maxRicochets) {
        this.returnToPlayer();
    }
  }
  onHit(enemySprite) {
    if (this.hitEnemies.has(enemySprite) || !this.isAttacking) return;
    this.hitEnemies.add(enemySprite);
    
    this.ricochet();
    
    if (enemySprite.enemyInstance) {
      const isCrit = Math.random() < (this.config.critChance * this.player.stats.luck);
      const critMultiplier = 2;
      const damage = isCrit ? this.config.damage * critMultiplier : this.config.damage;
      if (isCrit) {
          this.showCritEffect(enemySprite.x, enemySprite.y);
          if (this.config.critSound) {
              this.scene.audioManager.playSound(this.config.critSound, { volume: 0.9 });
          }
      } else {
        // Play regular ricochet sound on non-crit hits.
        this.scene.audioManager.playSound('boomerangRicochet', { volume: 0.5 });
      }
      enemySprite.enemyInstance.takeDamage(damage, this.config.knockback, this);
    }
    if (this.ricochetCount < this.maxRicochets) {
        const nextTarget = this.findNextTarget();
        if (nextTarget) {
            this.scene.physics.moveToObject(this.sprite, nextTarget, this.throwSpeed);
        }
    } else {
        this.returnToPlayer();
    }
  }
  onObstacleHit() {
    if (!this.isAttacking) return;
    this.ricochet();
    const nextTarget = this.findNextTarget();
    if (nextTarget) {
        this.scene.physics.moveToObject(this.sprite, nextTarget, this.throwSpeed);
    } else {
        if (this.ricochetCount >= this.maxRicochets) {
            this.returnToPlayer();
        }
    }
  }
  findNextTarget() {
      let closestEnemy = null;
      let minDistance = Infinity;
      this.scene.enemies.children.each(enemy => {
          if (enemy.active && !this.hitEnemies.has(enemy) && enemy.enemyInstance && !enemy.enemyInstance.isDead) {
              const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.x, enemy.y);
              if (distance < minDistance) {
                  minDistance = distance;
                  closestEnemy = enemy;
              }
          }
      });
      return closestEnemy;
  }
  startMissTimer() {
    if (this.attackTimeout) {
      this.attackTimeout.remove();
    }
    this.attackTimeout = this.scene.time.delayedCall(this.config.missTimeout, () => {
        if (this.isAttacking) {
            this.isMiss = true;
            this.fizzleOut();
        }
    });
  }
  fizzleOut() {
    if (!this.isAttacking) return;
    // Create a fizzle particle effect
    const particleKey = getSoftParticleTextureKey(this.scene);
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, particleKey, {
      speed: { min: 20, max: 80 },
      scale: { start: 0.15, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: 0xAAAAAA,
      blendMode: 'ADD'
    });
    this.scene.time.delayedCall(400, () => particles.destroy());
    
    // Fail the boomerang catch
    this.handleCatch();
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
  leavePuddle() {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastPuddleTime < 100) return;
    this.lastPuddleTime = currentTime;
    const puddle = this.scene.liquorPuddles.create(this.sprite.x, this.sprite.y, 'cobblestoneTile');
    puddle.setDisplaySize(32, 32);
    puddle.setTint(0x663300);
    puddle.setAlpha(0.6);
    puddle.setCircle(16);
    puddle.setPipeline('Light2D');
    
    this.scene.time.delayedCall(3000, () => {
        puddle.destroy();
    });
  }
  createGhostAfterimage() {
      const now = this.scene.time.now;
      if (now - this.lastGhostTime < 75) return;
      this.lastGhostTime = now;
      const ghost = this.scene.add.image(this.sprite.x, this.sprite.y, 'boomerangFlask')
          .setAngle(this.sprite.angle)
          .setDisplaySize(this.sprite.displayWidth, this.sprite.displayHeight)
          .setAlpha(0.4)
          .setTint(0xADD8E6)
          .setDepth(this.sprite.depth - 1)
          .setPipeline('Light2D');
      this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 0.5,
          duration: 400,
          ease: 'Power1',
          onComplete: () => {
              ghost.destroy();
          }
      });
  }
  createDopplerGhost() {
      if (!this.scene) return; // Scene might be gone
      const ghost = this.scene.physics.add.sprite(this.player.sprite.x, this.player.sprite.y, 'boomerangFlask');
      ghost.setPipeline('Light2D');
      ghost.setDisplaySize(32, 32);
      ghost.setAlpha(0.6);
      ghost.setTint(0x00FFFF);
      ghost.setBlendMode(Phaser.BlendModes.ADD);
      ghost.body.setCircle(16);
      const ghostData = {
          sprite: ghost,
          hitEnemies: new Set(),
          damage: this.config.damage * 0.75,
      };
      this.ghostFlasks.push(ghostData);
      this.scene.physics.velocityFromRotation(this.lastAttackAngle, this.throwSpeed * 0.9, ghost.body.velocity);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: this.config.missTimeout,
        onComplete: () => {
            ghost.destroy();
            this.ghostFlasks = this.ghostFlasks.filter(g => g !== ghostData);
        }
      });
  }
  updateGhostFlasks() {
      this.ghostFlasks.forEach(ghostData => {
          if (!ghostData.sprite.active) return;
          ghostData.sprite.angle += this.rotationSpeed;
          this.scene.physics.overlap(ghostData.sprite, this.scene.enemies, (gSprite, enemySprite) => {
              if (ghostData.hitEnemies.has(enemySprite)) return;
              ghostData.hitEnemies.add(enemySprite);
              if (enemySprite.enemyInstance) {
                  // Ghost flasks don't trigger on-kill effects, so we don't pass `this`
                  enemySprite.enemyInstance.takeDamage(ghostData.damage, this.config.knockback * 0.5, null);
              }
              
              // Ghostly "pop" effect
              const particleKey = getSoftParticleTextureKey(this.scene);
              const particles = this.scene.add.particles(gSprite.x, gSprite.y, particleKey, {
                speed: { min: 20, max: 60 }, scale: { start: 0.15, end: 0 },
                lifespan: 200, quantity: 8, tint: 0x00FFFF, blendMode: 'ADD'
              });
              this.scene.time.delayedCall(200, () => particles.destroy());
          });
      });
  }
  canAttack() {
    return !this.isAttacking && !this.isOnCooldown;
  }
}