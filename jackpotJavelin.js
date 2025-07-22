import { Weapon } from './weapon.js';
import { createFireEffect } from './particleEffects.js';
export class JackpotJavelin extends Weapon {
  constructor(scene, player) {
    const config = {
      damage: 20,
      attackSpeed: 500, // ms
      knockback: 150,
      critChance: 0.10,
      hitSound: 'JackpotJavelinStab',
      critSound: 'JackpotJavelinJackpotTrigger',
      swingArc: 30, // Narrow arc for a stab
      swingDuration: 100, // ms, very quick stab
      xoffset: 32, // Longer reach
      yoffset: 32,
      level: 1,
    };
    
    super(scene, player, 'JackpotJavelinModel', config);
    this.sprite.setDisplaySize(64, 64);
    this.sprite.body.setSize(32, 32);
    this.setupReelIcons();
    this.firstHitInEncounter = true;
    this.canNudge = true;
  }
  attack(pointer) {
    if (this.isAttacking) return;
    super.attack(pointer);
  }
  
  updateConfig() {
      // for runtime changes to config
  }

  onEnemyKill(x, y) {
      // Future: special effects on kill
  }
  
  onHit(enemySprite) {
    if (this.isAttacking && !this.hitEnemies.includes(enemySprite)) {
        super.onHit(enemySprite);
        if (!enemySprite.enemyInstance || enemySprite.enemyInstance.isDead) return;
        // Only trigger spin if the enemy is alive after the hit
        if (enemySprite.active) {
            this.triggerSlotSpin(enemySprite);
        }
    }
  }
  setupReelIcons() {
    this.reelIcons = [
      { key: 'cherry', texture: 'JackpotJavelinIconCherry', weight: 10, jackpot: this.jackpotHeal.bind(this) },
      { key: 'fire', texture: 'JackpotJavelinIconFire', weight: 8, jackpot: this.jackpotFire.bind(this) },
      { key: 'skull', texture: 'JackpotJavelinIconSkull', weight: 7, jackpot: this.jackpotCritShred.bind(this) },
      { key: 'clown', texture: 'JackpotJavelinIconClown', weight: 6, jackpot: this.jackpotClownDecoy.bind(this) },
      { key: 'money', texture: 'JackpotJavelinIconMoney', weight: 9, jackpot: this.jackpotBuzzShield.bind(this) },
      { key: 'dice', texture: 'JackpotJavelinDiceIcon', weight: 5, jackpot: this.jackpotCooldownRefresh.bind(this) },
    ];
  }
  triggerSlotSpin(target) {
    this.scene.audioManager.playSound('JackpotJavelinSlotSpin', { volume: 0.6 });
    const reelContainer = this.scene.add.container(target.x, target.y - 40);
    reelContainer.setDepth(200);
    const iconWidth = 24;
    const numReels = 3;
    const reels = [];
    const iconKeys = this.reelIcons.map(icon => icon.texture);
    let nudgedReelIndex = -1;
    
    const reelBg = this.scene.add.graphics();
    reelBg.fillStyle(0x000000, 0.7);
    reelBg.fillRoundedRect(-(numReels * iconWidth + (numReels - 1) * 5) / 2, -iconWidth / 2 - 2, (numReels * iconWidth + (numReels - 1) * 5), iconWidth + 4, 5);
    reelContainer.add(reelBg);
    for (let i = 0; i < numReels; i++) {
        const reelX = (i - (numReels - 1) / 2) * (iconWidth + 5);
        const iconImage = this.scene.add.image(reelX, 0, Phaser.Math.RND.pick(iconKeys));
        iconImage.setDisplaySize(iconWidth, iconWidth);
        reelContainer.add(iconImage);
        reels.push(iconImage);
        
        if (this.config.level >= 6 && this.canNudge) {
            iconImage.setInteractive({ useHandCursor: true });
            iconImage.on('pointerdown', () => {
                if (nudgedReelIndex === -1) {
                    nudgedReelIndex = i;
                    this.canNudge = false;
                    
                    // Visual feedback for nudge
                    const nudgeGlow = this.scene.add.graphics({ x: reelContainer.x + iconImage.x, y: reelContainer.y });
                    nudgeGlow.fillStyle(0xFFD700, 0.5);
                    nudgeGlow.fillCircle(0, 0, iconWidth / 2 + 4);
                    this.scene.tweens.add({ targets: nudgeGlow, alpha: 0, duration: 500, onComplete: () => nudgeGlow.destroy() });
                    // Tier II luck buff
                    this.applySlotFixerBuff();
                    
                    // Reset nudge ability after encounter
                    if (this.resetEncounterTimer) this.resetEncounterTimer.destroy();
                    this.resetEncounterTimer = this.scene.time.delayedCall(10000, () => {
                        this.canNudge = true;
                    });
                }
            });
        }
    }
    
    this.scene.events.on('update', () => {
        if (target.active) {
            reelContainer.x = target.x;
            reelContainer.y = target.y - 40;
        }
    });
    let spinDuration = 1000;
    const spinTimer = this.scene.time.addEvent({
        delay: 50,
        callback: () => {
            reels.forEach(icon => {
                icon.y = Math.random() * 4 - 2;
                icon.setTexture(Phaser.Math.RND.pick(iconKeys));
            });
        },
        repeat: spinDuration / 50 - 1
    });
    this.scene.time.delayedCall(spinDuration, () => {
        spinTimer.destroy();
        reels.forEach(r => r.removeInteractive());
        this.determineSpinResult(reels, target, nudgedReelIndex);
        
        this.scene.time.delayedCall(1500, () => {
             this.scene.tweens.add({
                targets: reelContainer,
                alpha: 0,
                y: reelContainer.y - 20,
                duration: 300,
                onComplete: () => {
                    reelContainer.destroy();
                }
            });
        });
    });
  }
  determineSpinResult(reels, target, nudgedReelIndex) {
      let results = [];
      const luck = this.player.stats.luck;
      const totalWeight = this.reelIcons.reduce((acc, icon) => acc + icon.weight, 0);
      const getWeightedRandomIcon = () => {
          let rand = Math.random() * totalWeight * (1 + (luck - 1) * 0.1);
          for (const icon of this.reelIcons) {
              rand -= icon.weight;
              if (rand <= 0) {
                  return icon;
              }
          }
          return this.reelIcons[this.reelIcons.length - 1]; // Fallback
      };
      if (this.config.level >= 3 && this.firstHitInEncounter) {
          const firstIcon = getWeightedRandomIcon();
          results.push(firstIcon, firstIcon, getWeightedRandomIcon());
          Phaser.Utils.Array.Shuffle(results);
          this.firstHitInEncounter = false;
          // Reset after a period of no combat
          if (this.resetEncounterTimer) this.resetEncounterTimer.destroy();
          this.resetEncounterTimer = this.scene.time.delayedCall(10000, () => {
              this.firstHitInEncounter = true;
          });
      } else {
          for (let i = 0; i < reels.length; i++) {
              results.push(getWeightedRandomIcon());
          }
      }
      // Tier II: Slot Fixer logic
      if (this.config.level >= 6 && nudgedReelIndex !== -1) {
          const otherReelIndexes = [0, 1, 2].filter(i => i !== nudgedReelIndex);
          const iconToMatch = results[Phaser.Math.RND.pick(otherReelIndexes)];
          results[nudgedReelIndex] = iconToMatch;
      }
      results.forEach((icon, i) => {
          reels[i].setTexture(icon.texture).setY(0);
      });
      const counts = {};
      results.forEach(res => { counts[res.key] = (counts[res.key] || 0) + 1; });
      
      const matchCount = Math.max(...Object.values(counts));
      const matchedIconKey = Object.keys(counts).find(key => counts[key] === matchCount);
      const matchedIcon = this.reelIcons.find(icon => icon.key === matchedIconKey);
      if (matchCount === 3) { // Jackpot
          this.scene.audioManager.playSound('JackpotJavelinJackpotTrigger', { volume: 0.9 });
          const wasAlive = !target.enemyInstance.isDead;
          matchedIcon.jackpot(target, matchedIcon);
          const isNowDead = target.enemyInstance.isDead;
          // Tier III: Jackpot Chain
          if (this.config.level >= 9 && wasAlive && isNowDead) {
              this.triggerJackpotChain(target.x, target.y);
          }
      } else if (matchCount === 2) { // 2 Matches
          this.scene.audioManager.playSound('JackpotJavelinFailSpin', { volume: 0.7 });
          if(target.enemyInstance) {
              const bonusDamage = this.config.damage * 0.5;
              target.enemyInstance.takeDamage(bonusDamage, 0, this);
          }
      } else { // No Match
          this.scene.audioManager.playSound('JackpotJavelinFailSpin', { volume: 0.7 });
      }
  }
  
  // --- JACKPOT IMPLEMENTATIONS ---
  jackpotHeal(target, icon) {
      this.player.heal(10);
  }
  jackpotFire(target, icon) {
      this.scene.audioManager.playSound('JackpotJavelinFireExplosion', { volume: 0.8 });
      createFireEffect(this.scene, target.x, target.y, 2000);
      const enemies = this.scene.enemies.getChildren();
      enemies.forEach(enemySprite => {
          if (enemySprite.active && Phaser.Math.Distance.Between(target.x, target.y, enemySprite.x, enemySprite.y) < 80) {
              const enemy = enemySprite.enemyInstance;
              enemy.takeDamage(this.config.damage * 0.75, 50, this);
              enemy.applyBurn(this.config.damage * 0.2, 3000, this); // 20% damage per second for 3 seconds
          }
      });
  }
  jackpotCritShred(target, icon) {
      if(target.enemyInstance) {
        this.showCritEffect(target.x, target.y);
        target.enemyInstance.takeDamage(this.config.damage * 2, this.config.knockback, this);
        target.enemyInstance.applyShred(5000); // 25% more damage for 5 seconds
      }
  }
  jackpotClownDecoy(target, icon) {
    this.scene.audioManager.playSound('JackpotJavelinClownDecoySpawn', { volume: 0.8 });
    const decoy = this.scene.physics.add.sprite(target.x, target.y, 'JackpotJavelinClownDecoy');
    decoy.setPipeline('Light2D');
    decoy.setDisplaySize(48, 48);
    decoy.anims.play('JackpotJavelinClownDecoy-walk-down', true);
    
    // Taunt nearby enemies
    const enemies = this.scene.enemies.getChildren();
    enemies.forEach(enemySprite => {
        if (enemySprite.active && Phaser.Math.Distance.Between(decoy.x, decoy.y, enemySprite.x, enemySprite.y) < 150) {
            enemySprite.enemyInstance.detectionRange = 1000; // Force chase
            enemySprite.enemyInstance.target = decoy; // Temp redirect target
        }
    });
    this.scene.time.delayedCall(5000, () => {
        enemies.forEach(enemySprite => {
            if (enemySprite.active && enemySprite.enemyInstance.target === decoy) {
                 enemySprite.enemyInstance.target = this.player.sprite; // Restore target
                 enemySprite.enemyInstance.detectionRange = 150; // Restore range
            }
        });
        if(decoy.active) decoy.destroy();
    });
  }
  jackpotBuzzShield(target, icon) {
    this.player.grantBuzzShield(25);
  }
  jackpotCooldownRefresh(target, icon) {
      const otherWeapons = this.player.weapons.filter(w => w !== this);
      if (otherWeapons.length > 0) {
          const weaponToRefresh = Phaser.Math.RND.pick(otherWeapons);
          weaponToRefresh.resetCooldown();
          
          // Show visual feedback for the refresh
          const refreshText = this.scene.add.text(this.player.sprite.x, this.player.sprite.y - 50, `COOLDOWN RESET!`, {
              ...this.scene.uiManager.levelText.style,
              fill: '#00FF00',
              fontSize: '18px'
          }).setOrigin(0.5);
          
          this.scene.tweens.add({
              targets: refreshText,
              y: refreshText.y - 30,
              alpha: 0,
              duration: 1500,
              ease: 'Power1',
              onComplete: () => refreshText.destroy()
          });
      }
  }
  applySlotFixerBuff() {
      // Glow effect on player
      const glow = this.scene.add.sprite(this.player.sprite.x, this.player.sprite.y, 'soft-particle');
      glow.setTint(0xFFD700).setBlendMode('ADD').setAlpha(0.5).setScale(2);
      this.scene.add.tween({ targets: glow, alpha: 0, scale: 3, duration: 1000, onComplete: () => glow.destroy() });
      // Apply buff
      this.player.stats.luck *= 1.5; // Temporarily boost luck
      this.player.weapons.forEach(w => w.updateConfig());
      // Remove buff after 10 seconds
      this.scene.time.delayedCall(10000, () => {
          this.player.stats.luck /= 1.5;
          this.player.weapons.forEach(w => w.updateConfig());
      });
  }
  triggerJackpotChain(x, y) {
      const chainRadius = 150;
      const nearbyEnemies = this.scene.enemies.getChildren().filter(enemySprite => {
          return enemySprite.active &&
                 !enemySprite.enemyInstance.isDead &&
                 Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y) <= chainRadius;
      });
      nearbyEnemies.forEach((enemySprite, i) => {
          this.scene.time.delayedCall(i * 150, () => {
              if (enemySprite.active && !enemySprite.enemyInstance.isDead) {
                  this.triggerSlotSpin(enemySprite);
              }
          });
      });
  }
}