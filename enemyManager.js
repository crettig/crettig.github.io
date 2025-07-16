import Phaser from 'phaser';
import { EnemyTypes } from './enemyTypes.js';
export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = scene.physics.add.group();
    this.enemyTypes = Object.values(EnemyTypes);
    this.gasClouds = this.scene.physics.add.group({
        allowGravity: false,
    });
  }
  spawnRandomEnemies(count) {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }
  spawnEnemy() {
    const player = this.scene.player.sprite;
    const groundLayer = this.scene.levelGenerator.groundLayer;
    let x, y, tile;
    let attempts = 0;
    const maxAttempts = 50; // To prevent infinite loops
    do {
      const angle = Math.random() * Math.PI * 2;
      const distance = 400 + Math.random() * 200; // Spawn off-screen
      x = player.x + Math.cos(angle) * distance;
      y = player.y + Math.sin(angle) * distance;
      tile = groundLayer.getTileAtWorldXY(x, y);
      attempts++;
    } while (!tile && attempts < maxAttempts);
    if (!tile) {
      console.warn("Could not find a valid spawn location for an enemy.");
      return; // Skip spawning this enemy
    }
    const enemyData = Phaser.Utils.Array.GetRandom(this.enemyTypes);
    const enemy = this.scene.physics.add.sprite(x, y, enemyData.spriteKey);
    enemy.setDepth(10); // Match player depth
    enemy.setScale(0.5); // Adjusted scale for new spritesheets
    // Set hitbox width to match tile size for better corridor navigation
    const newWidth = this.scene.levelGenerator.config.tileSize;
    const newHeight = enemy.height * 0.75; // Keep height proportional
    enemy.body.setSize(newWidth, newHeight);
    
    // Recalculate offset to keep the new hitbox centered
    const offsetX = (enemy.width - newWidth) / 2;
    const offsetY = (enemy.height - newHeight) / 2;
    enemy.body.setOffset(offsetX, offsetY);
    enemy.setTint(enemyData.color);
    enemy.enemyType = enemyData.key;
    enemy.enemyData = enemyData;
    enemy.health = enemyData.health;
    enemy.armor = enemyData.armor || 0; // Default to 0 if not specified
    enemy.speed = enemyData.speed;
    enemy.lastAttack = 0;
    enemy.debuffs = {}; // For tracking effects like armor shred
    enemy.hitCounters = {}; // For tracking hits from specific weapons
    enemy.isInGasCloud = false;
    // Pathfinding properties
    enemy.path = null;
    enemy.pathRecalculationTimer = 0;
    enemy.stuckData = {
        lastPosition: new Phaser.Math.Vector2(enemy.x, enemy.y),
        stuckTime: 0,
    };
    
    // Health bar
    enemy.healthBarBg = this.scene.add.graphics();
    enemy.healthBar = this.scene.add.graphics();
    this.updateHealthBar(enemy);
    this.enemies.add(enemy);
    
    // Setup collision with player
    this.scene.physics.add.overlap(enemy, this.scene.player.sprite, this.hitPlayer, null, this);
  }
  update() {
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.active) {
          this.updateDebuffs(enemy);
          this.updateGasCloudStatus(enemy);
          this.updateEnemyBehavior(enemy);
          this.updateDebuffVisuals(enemy);
          this.updateHealthBarPosition(enemy);
      }
    });
  }
  updateEnemyBehavior(enemy) {
    const player = this.scene.player.sprite;
    const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    // Cull enemies that are very far away to keep performance steady
    if (distanceToPlayer > 2000) {
      enemy.destroy();
      return;
    }
    // Unsticking logic
    this.checkIfStuck(enemy);
    if (enemy.isInGasCloud && Math.random() < 0.1) {
        this.setConfusedTarget(enemy);
    }
    // Path recalculation logic
    if (this.scene.time.now > enemy.pathRecalculationTimer) {
        const startVec = this.scene.pathfinder.worldToGrid(enemy.x, enemy.y);
        let endVec;
        if (enemy.confusedTarget) {
            endVec = this.scene.pathfinder.worldToGrid(enemy.confusedTarget.x, enemy.confusedTarget.y);
        } else {
            endVec = this.scene.pathfinder.worldToGrid(player.x, player.y);
        }
        
        enemy.path = this.scene.pathfinder.findPath(startVec, endVec);
        
        if (this.scene.pathfinder.debugGraphics && enemy.path) {
            this.scene.pathfinder.drawDebugPath(enemy.path);
        }
        
        // Stagger recalculations for performance
        enemy.pathRecalculationTimer = this.scene.time.now + 1000 + Math.random() * 500;
        
        if (enemy.path && enemy.path.length > 1) {
            enemy.path.shift(); // Remove the starting node
        }
    }
    // Movement logic
    let targetReached = false;
    // Special behavior for bomber type
    if (enemy.enemyType === EnemyTypes.BOMBER.key && distanceToPlayer <= 150) {
        enemy.setVelocity(0, 0); // Stop moving when close
        if (this.scene.time.now - enemy.lastAttack > 2000) {
            this.explode(enemy);
            enemy.lastAttack = this.scene.time.now;
            // The bomber should be destroyed after its main attack
            this.scene.time.delayedCall(500, () => this.killEnemy(enemy, { silent: true }));
        }
        // If the player moves out of range, the bomber should start moving again.
    } else if (!enemy.path || enemy.path.length === 0) {
        // This ensures the bomber will chase if it has no path or its path is complete.
        let targetX, targetY;
        if (enemy.confusedTarget) {
            targetX = enemy.confusedTarget.x;
            targetY = enemy.confusedTarget.y;
        } else {
            targetX = player.x;
            targetY = player.y;
        }
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
        enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
    } else if (enemy.path && enemy.path.length > 0) {
        const targetTile = enemy.path[0];
        const tileSize = this.scene.pathfinder.tileSize;
        const targetX = targetTile.x * tileSize + tileSize / 2;
        const targetY = targetTile.y * tileSize + tileSize / 2;
        const distanceToWaypoint = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY);
        if (distanceToWaypoint < tileSize / 4) {
            enemy.path.shift();
            if (enemy.path.length === 0) {
                targetReached = true;
            }
        }
        if (!targetReached) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
            enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
        }
    } else {
        // Fallback: If no path, just stop. Prevents running into walls.
        targetReached = true;
    }
    
    // Stop enemy if it reached the end of its path or has no path
    if (targetReached) {
        // For non-bombers, stop near the player
        if (enemy.enemyType === EnemyTypes.STALKER.key && distanceToPlayer <= 100) {
            enemy.setVelocity(0, 0);
        } else if (enemy.enemyType === EnemyTypes.RUSHER.key && distanceToPlayer > 50) {
             // Rusher continues direct charge if close and path is done
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
        } else {
            enemy.setVelocity(0, 0);
        }
    }
    this.updateEnemyAnimation(enemy);
  }
  updateDebuffs(enemy) {
    if (!enemy.debuffs) return;
    const now = this.scene.time.now;
    let armorNeedsRecalculating = false;
    for (const debuffKey in enemy.debuffs) {
        const debuff = enemy.debuffs[debuffKey];
        if (now > debuff.expires) {
            if (debuffKey === 'glassFracture' || debuffKey === 'armorShred') {
                armorNeedsRecalculating = true;
            }
            delete enemy.debuffs[debuffKey];
        }
    }
    if (armorNeedsRecalculating) {
        this.recalculateArmor(enemy);
    }
  }
  updateDebuffVisuals(enemy) {
    const hasDebuff = (enemy.debuffs && (enemy.debuffs.glassFracture || enemy.debuffs.armorShred));
    if (hasDebuff && enemy.debuffIndicator && enemy.debuffIndicator.active) {
      // Update position to follow the enemy
      enemy.debuffIndicator.setPosition(enemy.x, enemy.y - 40);
    } else if (!hasDebuff && enemy.debuffIndicator && enemy.debuffIndicator.active) {
      // If debuff expired, hide the indicator
      enemy.debuffIndicator.setVisible(false);
    }
  }
  checkIfStuck(enemy) {
      const body = enemy.body;
      const isTryingToMove = body.velocity.length() > 10;
      
      if (isTryingToMove) {
          const distanceMoved = Phaser.Math.Distance.Between(
              enemy.x, enemy.y,
              enemy.stuckData.lastPosition.x, enemy.stuckData.lastPosition.y
          );
          
          if (distanceMoved < 0.5) { // Threshold for being "stuck"
              enemy.stuckData.stuckTime += this.scene.game.loop.delta;
          } else {
              enemy.stuckData.stuckTime = 0;
          }
      } else {
          enemy.stuckData.stuckTime = 0;
      }
      
      // If stuck for over 300ms, invalidate path to force recalculation
      if (enemy.stuckData.stuckTime > 300) {
          enemy.path = null;
          enemy.stuckData.stuckTime = 0; // Reset timer to avoid constant recalculation
          enemy.pathRecalculationTimer = this.scene.time.now; // Recalculate immediately
      }
      
      enemy.stuckData.lastPosition.set(enemy.x, enemy.y);
  }
  updateEnemyAnimation(enemy) {
    const velocityX = enemy.body.velocity.x;
    const velocityY = enemy.body.velocity.y;
    const spriteKey = enemy.enemyData.spriteKey;
    if (Math.abs(velocityY) > Math.abs(velocityX)) {
      if (velocityY < 0) {
        enemy.anims.play(spriteKey + '_walkUp', true);
      } else {
        enemy.anims.play(spriteKey + '_walkDown', true);
      }
    } else if (Math.abs(velocityX) > 0) {
      if (velocityX < 0) {
        enemy.anims.play(spriteKey + '_walkLeft', true);
      } else {
        enemy.anims.play(spriteKey + '_walkRight', true);
      }
    } else {
      enemy.anims.stop();
      enemy.setFrame(9); // Idle frame (first from 'down' animation)
    }
  }
  explode(enemy) {
    // Create explosion effect
    const explosion = this.scene.add.circle(enemy.x, enemy.y, 100, 0xff6b6b, 0.3);
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => explosion.destroy()
    });
    
    // Damage player if in range
    const distance = Phaser.Math.Distance.Between(
      enemy.x, enemy.y,
      this.scene.player.sprite.x, this.scene.player.sprite.y
    );
    
    if (distance < 100) {
      this.scene.sound.play('playerHit', { volume: 0.5 });
      this.scene.takeDamage(25);
    }
  }
  hitPlayer(enemy, player) {
    if (!enemy.active) return; // Don't hit if enemy is being destroyed
    const enemyData = enemy.enemyData;
    this.scene.sound.play('playerHit', { volume: 0.5 });
    this.scene.takeDamage(enemyData.contactDamage || 5); // Use contact damage from type, or a default
    if (enemy.enemyType === EnemyTypes.STALKER.key) {
        // Stalker knocks player back and pauses
        const knockbackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.body.velocity.x = Math.cos(knockbackAngle) * 200;
        player.body.velocity.y = Math.sin(knockbackAngle) * 200;
        
        enemy.setActive(false).setVisible(false); // Temporarily disable enemy
        this.scene.time.delayedCall(1500, () => { // Cooldown before re-engaging
            if (enemy.body) { // Check if enemy still exists
                enemy.setActive(true).setVisible(true);
            }
        });
    } else {
        // Rusher and any other types are destroyed on contact
        this.killEnemy(enemy);
    }
  }
  damageEnemy(enemy, damage, weaponId) {
    if (!enemy.active) return;
    // Calculate effective damage after armor reduction
    const currentArmor = enemy.armor || 0;
    const damageReduction = currentArmor / (currentArmor + 100);
    const effectiveDamage = Math.max(1, Math.round(damage * (1 - damageReduction)));
    enemy.health -= effectiveDamage;
    enemy.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.setTint(enemy.enemyData.color);
      }
    });
    // Check for and apply special effects
    const weapon = this.scene.weaponManager.weapons[weaponId];
    if (weapon && weapon.specialEffect === 'glassFracture') {
        this.applyGlassFracture(enemy);
    }
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
    this.updateHealthBar(enemy);
  }
  applyArmorDebuff(enemy, amount, duration) {
    if (!enemy.debuffs) enemy.debuffs = {};
    const debuffKey = 'armorShred';
    
    // Get existing debuff or create a new one
    let debuff = enemy.debuffs[debuffKey];
    if (!debuff) {
      debuff = { amount: 0 };
      enemy.debuffs[debuffKey] = debuff;
    }
    
    // Apply the armor reduction amount and refresh its duration
    debuff.amount += amount;
    debuff.expires = this.scene.time.now + duration;
    
    this.recalculateArmor(enemy);
    this.createOrUpdateDebuffIndicator(enemy);
  }
  applyGlassFracture(enemy) {
    if (!enemy.hitCounters.bottleOfRegret) {
        enemy.hitCounters.bottleOfRegret = 0;
    }
    enemy.hitCounters.bottleOfRegret++;
    if (enemy.hitCounters.bottleOfRegret % 3 === 0) {
        // Apply the debuff
        if (!enemy.debuffs.glassFracture) {
            enemy.debuffs.glassFracture = { stacks: 0 };
        }
        const debuff = enemy.debuffs.glassFracture;
        if (debuff.stacks < 5) { // Max 5 stacks (25% shred)
            debuff.stacks++;
        }
        debuff.expires = this.scene.time.now + 6000; // Stacks last 6 seconds
        this.recalculateArmor(enemy);
        this.createOrUpdateDebuffIndicator(enemy, debuff.stacks);
    }
  }
  recalculateArmor(enemy) {
    let finalArmor = enemy.enemyData.armor;
    // Apply flat reduction first
    if (enemy.debuffs.armorShred) {
      finalArmor -= enemy.debuffs.armorShred.amount;
    }
    // Then apply percentage reduction
    if (enemy.debuffs.glassFracture) {
        const stacks = enemy.debuffs.glassFracture.stacks;
        const reduction = 1 - (stacks * 0.05); // 5% per stack
        finalArmor *= reduction;
    }
    enemy.armor = Math.max(0, Math.round(finalArmor)); // Armor can't be negative
  }
  createOrUpdateDebuffIndicator(enemy) {
    if (!enemy.debuffs || (!enemy.debuffs.glassFracture && !enemy.debuffs.armorShred)) {
      if (enemy.debuffIndicator) {
        enemy.debuffIndicator.destroy();
        enemy.debuffIndicator = null;
      }
      return;
    }
    if (!enemy.debuffIndicator || !enemy.debuffIndicator.scene) {
      enemy.debuffIndicator = this.scene.add.image(enemy.x, enemy.y - 40, 'brokenShield')
        .setScale(0.08)
        .setDepth(20);
    }
    
    // Simple visual: just show the icon. More complex text can be added later if needed.
    enemy.debuffIndicator.setVisible(true);
  }
  killEnemy(enemy, options = {}) {
    if (!enemy.active) return; // Prevent multiple kill calls
    enemy.setActive(false); // Mark as inactive to prevent further interactions
    // Play death sound
    if (enemy.enemyData.spriteKey === 'clown1') {
        this.scene.sound.play('clown1Death', { volume: 0.5 });
    } else if (enemy.enemyData.spriteKey === 'clown2') {
        this.scene.sound.play('clown2Death', { volume: 0.5 });
    }
    // Don't award XP/items for contact deaths or silent kills (like bomber timeout)
    if (!options.silent) {
        this.scene.gainXP(15); // Grant XP
        this.dropPickup(enemy.x, enemy.y);
    }
    
    enemy.body.enable = false; // Disable physics body
    // Create a death animation tween
    this.scene.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: 0.2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (enemy.debuffIndicator) {
            enemy.debuffIndicator.destroy();
        }
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        enemy.destroy();
      }
    });
  }
  dropPickup(x, y) {
    const dropRoll = Math.random();
    const ticketDropChance = 0.25 + (this.scene.gameState.luck / 1000); // Base 25% + luck bonus
    if (dropRoll < ticketDropChance) {
      this.scene.createPickup(x, y, 'ticket');
      return; // Only drop one thing at a time
    }
    const otherDropRoll = Math.random();
    // 10% chance for health pickup
    if (otherDropRoll < 0.10) {
      this.scene.createPickup(x, y, 'health');
    } 
    // 15% chance for weapon upgrade
    else if (otherDropRoll < 0.25) {
      const weaponToDrop = Phaser.Utils.Array.GetRandom(this.scene.weaponManager.weaponOrder);
      this.scene.createPickup(x, y, weaponToDrop);
    }
  }
  isEnemyInGasCloud(enemy) {
    let inCloud = false;
    this.gasClouds.children.each(cloud => {
        if (!cloud.active) return;
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, cloud.x, cloud.y);
        // Check if the enemy is within the visual radius of the cloud
        if (distance < (cloud.displayWidth / 2)) {
            inCloud = true;
        }
    });
    return inCloud;
  }
  spawnGasCloud(x, y) {
    // Create animation if it doesn't exist
    if (!this.scene.anims.exists('gas_cloud_anim')) {
        this.scene.anims.create({
            key: 'gas_cloud_anim',
            frames: this.scene.anims.generateFrameNumbers('gasCloud', { start: 0, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }
    const cloud = this.gasClouds.create(x, y, 'gasCloud');
    cloud.play('gas_cloud_anim');
    cloud.setDepth(15).setScale(0).setAlpha(0.6).setCircle(cloud.width / 2 * 0.8);
    
    this.scene.tweens.add({
        targets: cloud,
        scale: { from: 0, to: 0.8 },
        alpha: { from: 0, to: 0.6 },
        duration: 500,
        ease: 'Sine.easeInOut'
    });
    // Add a custom pipeline for visual effect
    const fx = cloud.postFX.add('ColorCycle');
    
    this.scene.time.delayedCall(4000, () => {
        if (!cloud.scene) return; // a check to ensure cloud hasn't been destroyed prematurely.
        this.scene.tweens.add({
            targets: cloud,
            alpha: 0,
            scale: 0,
            duration: 1000,
            onComplete: () => {
                cloud.destroy();
            }
        });
    });
  }
  updateGasCloudStatus(enemy) {
      const wasInCloud = enemy.isInGasCloud;
      enemy.isInGasCloud = this.isEnemyInGasCloud(enemy);
      if (enemy.isInGasCloud && !wasInCloud) {
          // Just entered a cloud, make it confused
          enemy.setTint(0xcc00ff); // Visual indicator
          this.setConfusedTarget(enemy, 4000);
      } else if (!enemy.isInGasCloud && wasInCloud) {
          // Just left a cloud
          enemy.clearTint();
          enemy.confusedTarget = null;
          enemy.path = null; // Force path recalculation
          enemy.pathRecalculationTimer = 0;
      }
  }
  setConfusedTarget(enemy, duration = 2000) {
      const nearbyEnemies = this.enemies.getChildren().filter(e =>
          e.active && e !== enemy && Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) < 300
      );
      if (nearbyEnemies.length > 0) {
          enemy.confusedTarget = Phaser.Utils.Array.GetRandom(nearbyEnemies);
      } else {
          enemy.confusedTarget = null; // No target, just wanders
      }
      // Remove confusion after a delay
      this.scene.time.delayedCall(duration, () => {
          if (enemy.active) {
              enemy.confusedTarget = null;
              enemy.path = null;
              enemy.pathRecalculationTimer = 0;
          }
      });
  }
  updateHealthBar(enemy) {
    if (!enemy.active || !enemy.healthBar) return;
    enemy.healthBar.clear();
    enemy.healthBarBg.clear();
    const width = 40;
    const height = 5;
    const x = enemy.x - width / 2;
    const y = enemy.y - 40;
    const healthPercentage = enemy.health / enemy.enemyData.health;
    // Background
    enemy.healthBarBg.fillStyle(0x000000, 0.5);
    enemy.healthBarBg.fillRect(0, 0, width, height); // Draw at origin of Graphics object
    // Foreground
    enemy.healthBar.fillStyle(healthPercentage > 0.5 ? 0x00ff00 : 0xffff00, 1);
    enemy.healthBar.fillRect(0, 0, width * healthPercentage, height); // Draw at origin of Graphics object
    enemy.healthBar.setDepth(20);
    enemy.healthBarBg.setDepth(19);
    // Set position initially
    enemy.healthBar.setPosition(x, y);
    enemy.healthBarBg.setPosition(x, y);
  }
  updateHealthBarPosition(enemy) {
    if (!enemy.active || !enemy.healthBar) return;
    const width = 40;
    const x = enemy.x - width / 2;
    const y = enemy.y - 40;
    // For Graphics objects, setPosition updates their origin relative to the scene.
    // Unlike sprites, you don't need to subtract the current position.
    enemy.healthBar.setPosition(x, y);
    enemy.healthBarBg.setPosition(x, y);
  }
}