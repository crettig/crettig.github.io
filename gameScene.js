import Phaser from 'phaser';
import { BoomerangFlask } from './boomerangFlask.js';
import { JackpotJavelin } from './jackpotJavelin.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { LightingManager } from './lighting.js';
import { UIManager } from './ui.js';
import { GameOverScene } from './gameOverScene.js';
import { AudioManager } from './audioManager.js';
import { WeaponUpgrader } from './weaponUpgrader.js';
import { UpgradeScene } from './upgradeScene.js';
import { LevelUpScene } from './levelUpScene.js';
import { PauseScene } from './pauseScene.js';
import { Characters } from './characterData.js';
import { GhostlyEx } from './ghostlyEx.js';
import { GameConfig } from './config.js';
import { createGameAnimations } from './animations.js';
import { 
    getSoftParticleTextureKey,
    createHitSparks,
    createFireEffect,
    createIceEffect,
    createElectricityEffect,
    createEarthEffect,
    createAirEffect,
    createVoidEffect
} from './particleEffects.js';
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  init(data) {
    this.characterKey = data.character;
    this.isGamePaused = false;
  }
  preload() {
    // Assets are now loaded in PreloaderScene
  }
  create() {
    this.audioManager = new AudioManager(this);
    this.audioManager.playMusic('normalgameplay', { loop: true, volume: 0.4 });
    this.worldWidth = GameConfig.world.width;
    this.worldHeight = GameConfig.world.height;
    
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    
    this.lights.enable();
    this.createWorld();
    this.createLighting();
    createGameAnimations(this.anims);
    this.createPlayer();
    this.createEnemies();
    this.createCrates();
    this.createTorches();
    this.createWeaponUpgraders();
    this.ghostlyExes = this.add.group();
    this.createUI();
    this.setupCamera();
    this.setupControls();
    this.setupPauseControls();
    this.liquorPuddles = this.physics.add.group({
        allowGravity: false,
      immovable: true,
    });
    this.gasClouds = this.physics.add.group({
        allowGravity: false,
        immovable: true,
    });
  }
  createWorld() {
    const tileSize = 128;
    for (let x = 0; x < this.worldWidth; x += tileSize) {
      for (let y = 0; y < this.worldHeight; y += tileSize) {
        const tile = this.add.image(x + tileSize/2, y + tileSize/2, 'cobblestoneTile');
        tile.setPipeline('Light2D');
        tile.setDisplaySize(tileSize, tileSize);
        tile.setTint(0xB8A082);
      }
    }
  }

  createLighting() {
    this.lightingManager = new LightingManager(this);
    this.lightingManager.createAmbientLighting();
  }
  createPlayer() {
    this.player = new Player(this, GameConfig.player.spawn.x, GameConfig.player.spawn.y, this.characterKey);
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    
    const enemyPositions = GameConfig.enemies.positions;
    enemyPositions.forEach(pos => {
      const enemy = new Enemy(this, pos.x, pos.y, this.player);
      this.enemies.add(enemy.sprite);
    });
  }

  createCrates() {
    this.crates = this.physics.add.staticGroup();
    
    const cratePositions = GameConfig.crates.positions;
    cratePositions.forEach(pos => {
      const crate = this.physics.add.sprite(pos.x, pos.y, 'woodenCrate');
      crate.setPipeline('Light2D');
      crate.setDisplaySize(64, 64);
      crate.setTint(0xD4A574);
      crate.body.setSize(60, 60);
      this.crates.add(crate);
    });
  }

  createTorches() {
    this.torches = [];
    const torchPositions = GameConfig.torches.positions;
    torchPositions.forEach(pos => {
      const torch = this.add.image(pos.x, pos.y, 'torch');
      torch.setPipeline('Light2D');
      torch.setDisplaySize(32, 48);
      torch.setTint(0xFFAA66);
      this.torches.push(torch);
      
      this.lightingManager.addTorchLight(pos.x, pos.y);
    });
  }
  createWeaponUpgraders() {
      this.weaponUpgraders = this.physics.add.group({
          immovable: true,
          allowGravity: false
      });
      
      GameConfig.upgraders.positions.forEach(pos => {
        const upgrader = new WeaponUpgrader(this, pos.x, pos.y);
        this.weaponUpgraders.add(upgrader.sprite);
      });
  }
  createUI() {
    this.uiManager = new UIManager(this);
  }
  setupCamera() {
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setDeadzone(200, 100);
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');
    this.joystickCursors = { up: {isDown: false}, down: {isDown: false}, left: {isDown: false}, right: {isDown: false} };
    if (this.sys.game.device.input.touch) {
        this.joyStick = this.plugins.get('rexVirtualJoystick').add(this, {
            x: 120,
            y: this.cameras.main.height - 120,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x888888, 0.5).setDepth(10),
            thumb: this.add.circle(0, 0, 30, 0xcccccc, 0.7).setDepth(10),
        }).on('update', this.dumpJoyStickState, this);
        this.joystickCursors = this.joyStick.createCursorKeys();
    }
  }
  dumpJoyStickState() {
    // This method is used by the joystick plugin, but we can leave it empty
    // if we are using createCursorKeys().
  }
  update(time, delta) {
    if (this.isGamePaused) return;
    this.player.update(this.cursors, this.wasd, this.joystickCursors);
    
    this.enemies.children.entries.forEach(enemySprite => {
      if (enemySprite.enemyInstance) {
        enemySprite.enemyInstance.update(time, delta);
      }
    });
    this.ghostlyExes.children.each(ex => {
        if (ex.owner) {
            ex.owner.update(time, delta);
        }
    });
    this.lightingManager.update(time);
    this.uiManager.update();
    this.physics.add.collider(this.player.sprite, this.enemies, this.handlePlayerEnemyCollision, null, this);
    this.player.weapons.forEach(weapon => {
        this.physics.add.overlap(weapon.sprite, this.enemies, this.handleWeaponEnemyCollision, null, this);
        if (weapon instanceof BoomerangFlask) {
            this.physics.add.collider(weapon.sprite, this.crates, () => weapon.ricochet());
        }
    });
    this.physics.add.overlap(this.player.sprite, this.crates, this.handleCrateCollision, null, this);
    this.physics.add.collider(this.player.sprite, this.weaponUpgraders, this.handleWeaponUpgraderCollision, null, this);
    this.physics.add.overlap(this.enemies, this.liquorPuddles, this.handleEnemyPuddleCollision, null, this);
    this.physics.add.overlap(this.enemies, this.gasClouds, this.handleEnemyGasCloudCollision, null, this);
  }
  handlePlayerEnemyCollision(playerSprite, enemySprite) {
    if (enemySprite.enemyInstance && !enemySprite.enemyInstance.isDead) {
      this.player.takeDamage(10);
      const knockback = 100;
      this.physics.velocityFromAngle(
        Phaser.Math.Angle.Between(enemySprite.x, enemySprite.y, playerSprite.x, playerSprite.y) * 180 / Math.PI,
        knockback,
        playerSprite.body.velocity
      );
    }
  }
  handleWeaponEnemyCollision(weaponSprite, enemySprite) {
    if (weaponSprite.weaponInstance && weaponSprite.weaponInstance.isAttacking) {
        weaponSprite.weaponInstance.onHit(enemySprite);
    }
  }
  handleCrateCollision(player, crate) {
    crate.destroy();
    this.player.heal(5);
    this.player.gainXP(10); // Grant some XP for breaking crates
    
    const particleKey = getSoftParticleTextureKey(this);
    const particles = this.add.particles(crate.x, crate.y, particleKey, {
        speed: { min: 50, max: 150 },
        scale: { start: 0.25, end: 0 },
        lifespan: 500,
        quantity: 15,
        tint: 0x8B4513, // Wood color
        blendMode: 'ADD'
    });
    
    this.time.delayedCall(500, () => particles.destroy());
  }
  handlePlayerDeath() {
      // Stop all sounds immediately except for the death sound which is about to be played.
      this.audioManager.stopAllSounds();
      this.player.playDeathSound();
      
      this.time.delayedCall(1500, () => {
          if (!this.scene.isActive()) return; // Prevent errors if scene is already stopped
          this.scene.launch('GameOverScene');
          this.scene.pause();
      });
  }
  handleWeaponUpgraderCollision(playerSprite, upgraderSprite) {
      if (this.upgradeActive) return;
      const upgrader = upgraderSprite.owner;
      if (upgrader) {
          this.pauseGame();
          this.scene.launch('UpgradeScene', { player: this.player, upgrader: upgrader });
          upgraderSprite.body.setEnable(false); // prevent multiple triggers
      }
  }
  pauseGame(isLevelUp = false) {
      if (!isLevelUp) {
        this.upgradeActive = true;
      }
      this.player.sprite.body.setEnable(false);
      this.physics.pause();
  }
  resumeGame() {
      this.upgradeActive = false;
      this.player.sprite.body.setEnable(true);
      this.physics.resume();
      this.player.weapons.forEach(w => {
        w.updateConfig();
        this.uiManager.update();
      });
  }
  setupPauseControls() {
      this.input.keyboard.on('keydown-ESC', () => {
          this.togglePause();
      });
  }
  togglePause(forceState) {
      this.isGamePaused = typeof forceState === 'boolean' ? forceState : !this.isGamePaused;
      this.uiManager.setPauseButtonTexture(this.isGamePaused);
      if (this.isGamePaused) {
          this.physics.pause();
          this.tweens.pauseAll();
          if (!this.vignette) {
             this.vignette = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.4);
          }
          this.cameras.main.postFX.addBlur(2, 2, 2);
          this.scene.launch('PauseScene');
          this.audioManager.pauseMusic();
      } else {
          this.physics.resume();
          this.tweens.resumeAll();
          if (this.vignette) {
             this.cameras.main.postFX.remove(this.vignette);
             this.vignette = null;
          }
          this.cameras.main.postFX.clear();
          this.scene.stop('PauseScene');
          this.audioManager.resumeMusic();
      }
  }
  handleEnemyPuddleCollision(enemySprite, puddle) {
      if (enemySprite.enemyInstance && !enemySprite.enemyInstance.isSlipping) {
          enemySprite.enemyInstance.slip();
      }
  }
  handleEnemyGasCloudCollision(enemySprite, cloud) {
      if (enemySprite.enemyInstance) {
          enemySprite.enemyInstance.applyGasDebuff();
      }
  }
}