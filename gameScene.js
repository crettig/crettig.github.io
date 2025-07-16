import Phaser from 'phaser';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { WeaponManager } from './weaponManager.js';
import { LevelGenerator } from './levelGenerator.js';
import { LevelUpScene } from './levelUpScene.js';
import { ShopScene } from './shopScene.js';
import { Skins } from './characterSkins.js';
import { EnemyTypes } from './enemyTypes.js';
import { WeaponTypes } from './weaponTypes.js';
import { PickupTypes, getPickupConfig } from './pickupTypes.js';
import { MobileControls } from './mobileControls.js';
import { Pathfinder } from './pathfinder.js';
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  init(data) {
    this.loadData = data.load ? JSON.parse(localStorage.getItem('carnivalNightmareSave')) : null;
  }
  create() {
    // Show game HUD
    document.getElementById('game-hud').style.display = 'block';
    // Add a new style for Buzz HP pulsing effect
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes buzz-pulse {
        0% { box-shadow: 0 0 4px 1px rgba(255, 215, 0, 0.7); }
        50% { box-shadow: 0 0 12px 4px rgba(255, 215, 0, 1); }
        100% { box-shadow: 0 0 4px 1px rgba(255, 215, 0, 0.7); }
      }
      .buzz-hp-active {
        animation: buzz-pulse 1.5s ease-in-out infinite;
        z-index: -1; /* Ensure glow is behind the health bar text */
      }
    `;
    document.head.appendChild(style);
    
    // Apply loaded settings if they exist
    if (this.loadData) {
        this.applyLoadedSettings();
    }
    // Initialize systems
    this.initGameState();
    this.createPlayerAnimations();
    this.createEnemyAnimations();
    
    // -- World Generation State --
    this.isGenerating = true;
    const worldSeed = this.loadData ? this.loadData.world.seed : null;
    this.levelGenerator = new LevelGenerator(this, worldSeed);
    
    this.createLoadingScreen(); // Create screen first
    this.updateLoadingStatus('Building terrain...');
    // The generator is synchronous, but we can wrap it to fit the async-style flow.
    this.time.delayedCall(10, () => { // Use a small delay to allow loading screen to render
        this.levelGenerator.generate(() => {
            // This callback runs when generation is complete
            this.isGenerating = false;
            this.initGameWorld();
            // Destroy the screen after a short delay to show the final message
            this.time.delayedCall(500, () => {
                this.loadingScreen.destroy();
            });
        });
    });
  }
  updateLoadingStatus(text) {
    if (this.loadingStatusText) {
        this.loadingStatusText.setText(text);
        console.log(`Loading Status: ${text}`); // Also log to console for debugging
    }
  }
  createLoadingScreen() {
    const { width, height } = this.cameras.main;
    const container = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
    const loadingText = this.loadData ? 'Loading World...' : 'Generating World...';
    const title = this.add.text(width / 2, height / 2 - 100, loadingText, {
        fontFamily: "'Courier New', monospace",
        fontSize: '48px',
        color: '#ffffff',
    }).setOrigin(0.5);
    
    this.loadingStatusText = this.add.text(width / 2, height / 2 + 70, 'Initializing...', {
        fontFamily: "'Courier New', monospace",
        fontSize: '24px',
        color: '#aaaaaa',
        align: 'center'
    }).setOrigin(0.5);
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x444444, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    this.progressBar = this.add.graphics();
    container.add([bg, title, this.progressBox, this.progressBar, this.loadingStatusText]);
    container.setScrollFactor(0).setDepth(100);
    this.loadingScreen = container;
  }
  initGameWorld() {
    this.updateLoadingStatus('Populating world...');
    // This function contains all the setup that should happen AFTER the world is generated
    const playerCharacterKey = this.sys.game.registry.get('playerCharacter');
    const characterData = Object.values(Skins).find(c => c.name === playerCharacterKey);
    this.updateLoadingStatus('Analyzing navigation grid...');
    this.pathfinder = new Pathfinder(this.levelGenerator);
    this.pathfinder.enableDebugging();
    
    this.updateLoadingStatus('Waking up the player...');
    // Find a random room to spawn the player in
    const startRoom = Phaser.Utils.Array.GetRandom(this.levelGenerator.rooms);
    const spawnX = (startRoom.x + startRoom.w / 2) * this.levelGenerator.config.tileSize;
    const spawnY = (startRoom.y + startRoom.h / 2) * this.levelGenerator.config.tileSize;
    this.player = new Player(this, spawnX, spawnY, characterData);
    
    this.updateLoadingStatus('Gathering the arsenal...');
    this.weaponManager = new WeaponManager(this);
    
    this.updateLoadingStatus('Unleashing the clowns...');
    this.enemyManager = new EnemyManager(this);
    this.pickups = this.physics.add.group();
    // If loading a save, apply the game state now
    if (this.loadData) {
        this.applyLoadedGameData();
    }
    // If loading a save, apply the game state now
    if (this.loadData) {
        this.updateLoadingStatus('Reading old memories...');
        this.applyLoadedGameData();
    }
    // Setup collisions
    this.updateLoadingStatus('Calculating physics...');
    this.physics.add.overlap(this.weaponManager.projectiles, this.enemyManager.enemies, this.weaponManager.handleProjectileCollision, null, this.weaponManager);
    // Set collision for all collidable layers
    this.levelGenerator.groundLayer.setCollisionByProperty({ collidable: true });
    this.levelGenerator.wallLayer.setCollisionByExclusion([-1]); // All tiles collide
    this.levelGenerator.shadowLayer.setDepth(5); // Ensure shadows render above the floor
    this.levelGenerator.wallLayer.setDepth(10); // Walls on top
    this.levelGenerator.objectLayer.setDepth(15); // Objects render above walls but below player
    this.physics.add.collider(this.player.sprite, this.levelGenerator.groundLayer);
    this.physics.add.collider(this.player.sprite, this.levelGenerator.wallLayer);
    this.levelGenerator.objectLayer.setCollisionByProperty({ collidable: true });
    this.physics.add.collider(this.player.sprite, this.levelGenerator.objectLayer);
    this.physics.add.collider(this.enemyManager.enemies, this.levelGenerator.objectLayer);
    this.physics.add.collider(this.enemyManager.enemies, this.levelGenerator.wallLayer);
    this.physics.add.collider(this.weaponManager.projectiles, this.levelGenerator.wallLayer, this.weaponManager.handleProjectileWallCollision, null, this.weaponManager);
    this.physics.add.collider(this.weaponManager.projectiles, this.levelGenerator.objectLayer, this.weaponManager.handleProjectileWallCollision, null, this.weaponManager);
    this.physics.add.overlap(this.player.sprite, this.weaponManager.projectiles, null, null, this);
    // Setup camera
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setZoom(1);
    // Apply the custom color cycle shader to the ground layer
    if (this.renderer.pipelines.has('ColorCycle')) {
        this.colorCyclePipeline = this.renderer.pipelines.get('ColorCycle');
        this.levelGenerator.groundLayer.setPostPipeline(this.colorCyclePipeline);
        // Also apply to shadows to keep the vibe consistent
        this.levelGenerator.shadowLayer.setPostPipeline(this.colorCyclePipeline);
    }
    this.music = this.sound.add('backgroundMusic', { loop: true, volume: 0.3 });
    this.music.play();
    this.events.on('resume', () => {
        if (this.music && !this.music.isPlaying) {
            this.music.resume();
        }
    });
    this.events.on('pause', () => {
        if (this.music && this.music.isPlaying) {
            this.music.pause();
        }
    });
    // Setup input
    this.keys = this.input.keyboard.addKeys('W,S,A,D,Q,ESC');
    this.input.on('pointermove', this.handleMouseMove, this);
    this.input.on('pointerdown', this.handleMouseClick, this);
    this.mobileControls = new MobileControls(this);
    // Setup UI listeners
    this.setupUIListeners();
    // Setup pickup collision
    this.physics.add.overlap(this.player.sprite, this.pickups, this.handlePickup, null, this);
    // Start enemy spawning
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemyWave,
      callbackScope: this,
      loop: true
    });
    this.updateHUD();
    this.updateWeaponUI();
    this.updateLoadingStatus('Ready to play!');
  }
  handleMouseMove(pointer) {
    if (this.mobileControls && this.mobileControls.isTouchDevice) return;
    this.player.updateAim(pointer);
    // Continuous fire for desktop
    if (pointer.isDown) {
        this.weaponManager.fireWeapon(this.player, pointer, this.enemyManager.enemies);
    }
  }
  handleMouseClick(pointer) {
    if (this.mobileControls && this.mobileControls.isTouchDevice) return;
    // Initial click fire
    this.weaponManager.fireWeapon(this.player, pointer, this.enemyManager.enemies);
  }

  spawnEnemyWave() {
    if (!this.sys.game.registry.get('enemySpawning')) {
      return; // Do not spawn enemies if the setting is off.
    }
    const elapsedTime = Math.floor(this.time.now / 1000) - this.gameState.startTime;
    if (elapsedTime < 60) {
      // For the first 60 seconds, only spawn if there are no enemies
      if (this.enemyManager.enemies.getLength() === 0) {
        this.enemyManager.spawnRandomEnemies(1);
      }
    } else {
      // After 60 seconds, ramp up spawning slowly
      const timeBonus = Math.floor((elapsedTime - 60) / 45); // One extra enemy every 45 seconds after the first minute
      const levelBonus = Math.floor(this.gameState.playerLevel / 4); // One extra enemy every 4 levels
      const waveSize = 1 + timeBonus + levelBonus;
      // Only spawn if the current number of enemies is less than the calculated wave size
      if (this.enemyManager.enemies.getLength() < waveSize) {
        this.enemyManager.spawnRandomEnemies(1);
      }
    }
  }

  update() {
    if (this.isGenerating) {
        // Since generation is now synchronous, we just show a full progress bar.
        const { width, height } = this.cameras.main;
        const progress = 1;
        this.progressBar.clear();
        this.progressBar.fillStyle(0x74b9ff, 1);
        this.progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * progress, 30);
        return;
    }
    if (!this.player) return; // Don't run game logic until initialization is complete
    this.mobileControls.update();
    this.player.update(this.keys, this.mobileControls);
    if (this.pathfinder.debugGraphics) {
        this.pathfinder.debugGraphics.clear();
    }
    this.enemyManager.update();
    this.weaponManager.update();
    this.updateBuzzHpDecay();
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.weaponManager.switchWeapon();
      this.updateWeaponUI();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.pauseGame();
    }
  }
  pauseGame() {
      // Hide HUD and pause
      document.getElementById('game-hud').style.display = 'none';
      this.scene.pause();
      this.scene.launch('PauseScene');
  }
  setupUIListeners() {
      const pauseButton = document.getElementById('pause-button');
      this.pauseButtonListener = () => this.pauseGame();
      if (pauseButton) {
          pauseButton.addEventListener('click', this.pauseButtonListener);
      }
      const switchWeaponButton = document.getElementById('weapon-switch-button');
      if (this.mobileControls.isTouchDevice) {
        switchWeaponButton.style.display = 'block';
        this.switchWeaponListener = () => {
            this.weaponManager.switchWeapon();
            this.updateWeaponUI();
        };
        switchWeaponButton.addEventListener('click', this.switchWeaponListener);
      }
  }
  removeUIListeners() {
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton && this.pauseButtonListener) {
          pauseButton.removeEventListener('click', this.pauseButtonListener);
      }
      const switchWeaponButton = document.getElementById('weapon-switch-button');
      if (switchWeaponButton && this.switchWeaponListener) {
          switchWeaponButton.removeEventListener('click', this.switchWeaponListener);
      }
  }
  takeDamage(amount) {
    if (this.isGameOver || this.playerInvincible || (this.gameState.playerHealth <= 0 && this.gameState.buzzHp <= 0)) return;
    // Damage buzzHp first
    const damageToBuzz = Math.min(amount, this.gameState.buzzHp);
    if (damageToBuzz > 0) {
        this.gameState.buzzHp -= damageToBuzz;
        amount -= damageToBuzz;
    }
    // Apply remaining damage to health
    if (amount > 0) {
        this.gameState.playerHealth -= amount;
    }
    this.updateHUD();
    // Set invincible and start visual feedback
    this.playerInvincible = true;
    if (this.player && this.player.sprite) {
        this.player.sprite.setTint(0xff6666); // Set damage tint
        // Create a tween to flash the player sprite, indicating invincibility
        this.tweens.add({
            targets: this.player.sprite,
            alpha: 0.3,
            duration: 150,
            ease: 'Power1',
            yoyo: true,
            repeat: 2, // Flashes for about 900ms
            onComplete: () => {
                if (this.player && this.player.sprite) {
                    this.player.sprite.setAlpha(1.0);
                    this.player.sprite.setTint(0xffeeaa); // Return to original glow
                    this.playerInvincible = false; // Invincibility ends when flash ends
                }
            }
        });
    } else {
       // Fallback if there's no sprite, just use a timer
       this.time.delayedCall(1000, () => { this.playerInvincible = false; });
    }
    if (this.gameState.playerHealth <= 0) {
      this.gameOver();
    }
    // Screen shake
    this.cameras.main.shake(200, 0.02);
  }
  gainXP(amount) {
    this.gameState.xp += amount;
    console.log(`Gained ${amount} XP. Total XP: ${this.gameState.xp}`);
    if (this.gameState.xp >= this.gameState.xpToNextLevel) {
      this.levelUp();
    }
    this.updateHUD();
  }
  levelUp() {
    this.gameState.playerLevel++;
    this.gameState.xp -= this.gameState.xpToNextLevel;
    this.gameState.xpToNextLevel = Math.floor(this.gameState.xpToNextLevel * 1.5);
    
    console.log(`Leveled up to ${this.gameState.playerLevel}!`);
    
    // Pause game and show level up screen
    this.scene.pause();
    this.scene.launch('LevelUpScene');
    // Level up visual feedback
    this.cameras.main.flash(400, 100, 255, 100);
  }

  findFriend() {
    this.gameState.friendsFound++;
    this.updateHUD();
    
    // Celebration effect
    this.cameras.main.flash(500, 255, 255, 0);
  }

  updateHUD() {
    document.getElementById('friends-count').textContent = this.gameState.friendsFound;
    document.getElementById('tickets-count').textContent = this.gameState.tickets;
    this.updateHealthBar();
    document.getElementById('level').textContent = this.gameState.playerLevel;
    document.getElementById('xp-text').textContent = `${this.gameState.xp} / ${this.gameState.xpToNextLevel}`;
    const xpPercent = (this.gameState.xp / this.gameState.xpToNextLevel) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercent}%`;
  }
  updateHealthBar() {
      const healthPercent = Math.max(0, this.gameState.playerHealth) / this.gameState.maxHealth;
      const healthBar = document.getElementById('health-bar');
      const healthText = document.getElementById('health-text');
      // Create or get Buzz HP bar
      let buzzBar = document.getElementById('buzz-health-bar');
      if (!buzzBar && healthBar) {
          buzzBar = document.createElement('div');
          buzzBar.id = 'buzz-health-bar';
          buzzBar.style.position = 'absolute';
          buzzBar.style.top = '0';
          buzzBar.style.left = '0';
          buzzBar.style.height = '100%';
          buzzBar.style.backgroundColor = '#FFD700'; // Gold color for Buzz HP
          buzzBar.style.transition = 'width 0.2s ease-in-out';
          healthBar.parentNode.appendChild(buzzBar);
      }
      // Regular Health
      healthBar.style.width = `${healthPercent * 100}%`;
      const r = Math.round(255 * (1 - healthPercent));
      const g = Math.round(255 * healthPercent);
      healthBar.style.backgroundColor = `rgb(${r}, ${g}, 0)`;
      // Buzz Health
      if (buzzBar) {
        // Allow buzz health to extend beyond the normal max health bar width
        const buzzPercent = (this.gameState.buzzHp / this.gameState.maxHealth);
        buzzBar.style.width = `${(healthPercent + buzzPercent) * 100}%`;
        if (this.gameState.buzzHp > 0) {
          buzzBar.classList.add('buzz-hp-active');
        } else {
          buzzBar.classList.remove('buzz-hp-active');
        }
      }
      
      // Update text
      const displayHealth = Math.ceil(this.gameState.playerHealth);
      let healthString = `${displayHealth} / ${this.gameState.maxHealth}`;
      if (this.gameState.buzzHp > 0) {
          healthString += ` (+${Math.ceil(this.gameState.buzzHp)})`;
      }
      healthText.textContent = healthString;
      // Low health pulse effect
      if (healthPercent < 0.2 && this.gameState.buzzHp <= 0) {
          if (!healthBar.classList.contains('low-health-pulse')) {
              healthBar.classList.add('low-health-pulse');
          }
      } else {
          if (healthBar.classList.contains('low-health-pulse')) {
              healthBar.classList.remove('low-health-pulse');
          }
      }
  }
  updateWeaponUI() {
    const weaponData = this.weaponManager.getCurrentWeaponData();
    const weaponText = `(${this.mobileControls.isTouchDevice ? 'Tap Switch' : 'Q'}) ${weaponData.name}`;
    document.getElementById('current-weapon').textContent = weaponText;
    document.getElementById('weapon-icon').src = weaponData.iconUrl;
  }
  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.music) {
        this.music.stop();
    }
    // Stop all game action
    this.physics.pause();
    this.time.removeAllEvents();
    this.input.off('pointermove', this.handleMouseMove, this);
    this.input.off('pointerdown', this.handleMouseClick, this);
    // Create a black rectangle to fade in over the screen
    const fadeRect = this.add.rectangle(
      0, 0,
      this.cameras.main.width, this.cameras.main.height,
      0x1a1a2e
    ).setOrigin(0,0).setScrollFactor(0).setDepth(1000).setAlpha(0);
    // Animate the fade
    this.tweens.add({
      targets: fadeRect,
      alpha: 0.85,
      duration: 1500,
      onComplete: () => {
        // Hide game HUD on game over
        document.getElementById('game-hud').style.display = 'none';
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Add death text and buttons, ensuring they are pinned to the screen
        const deathText = this.add.text(centerX, centerY - 150, 'YOU DIED', {
          fontFamily: 'CarnivalFreakshow, "Courier New", monospace',
          fontSize: '120px',
          color: '#ff0000',
          align: 'center',
          stroke: '#000',
          strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
        
        const replayButton = this.add.text(centerX, centerY + 50, 'Replay', {
          fontFamily: "'Courier New', monospace",
          fontSize: '40px',
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive({ useHandCursor: true });
        
        const mainMenuButton = this.add.text(centerX, centerY + 120, 'Main Menu', {
          fontFamily: "'Courier New', monospace",
          fontSize: '40px',
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive({ useHandCursor: true });
        replayButton.on('pointerdown', () => this.scene.restart());
        mainMenuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
        const setupHover = (btn) => {
          btn.on('pointerover', () => btn.setBackgroundColor('#ff6b6b'));
          btn.on('pointerout', () => btn.setBackgroundColor('#444444'));
        };
        
        setupHover(replayButton);
        setupHover(mainMenuButton);
      }
    });
  }
  shutdown() {
    if (this.music && this.music.isPlaying) {
        this.music.stop();
    }
    if (this.mobileControls) {
        this.mobileControls.destroy();
    }
    this.removeUIListeners();
  }
  initGameState() {
    this.isGameOver = false;
    this.playerInvincible = false;
    const playerCharacterKey = this.sys.game.registry.get('playerCharacter');
    const characterData = Object.values(Skins).find(c => c.name === playerCharacterKey);
    this.gameState = {
      friendsFound: 0,
      playerHealth: characterData.startingHealth,
      maxHealth: characterData.startingHealth,
      score: 0,
      playerLevel: 1,
      xp: 0,
      xpToNextLevel: 100,
      startTime: Math.floor(this.time.now / 1000),
      tickets: 0,
      luck: characterData.luck,
      buzzHp: 0
    };
  }
  applyLiquidCourage(amount) {
    const healToFull = this.gameState.maxHealth - this.gameState.playerHealth;
    
    if (amount <= healToFull) {
      // Standard heal, no overheal
      this.gameState.playerHealth += amount;
    } else {
      // Heal to full and add the rest to Buzz HP
      this.gameState.playerHealth = this.gameState.maxHealth;
      const overhealAmount = amount - healToFull;
      this.gameState.buzzHp += overhealAmount;
    }
    
    this.updateHUD();
  }
  updateBuzzHpDecay() {
    if (this.gameState.buzzHp > 0) {
      const decayRate = 2; // Buzz HP per second
      const decayAmount = decayRate * (this.sys.game.loop.delta / 1000);
      this.gameState.buzzHp = Math.max(0, this.gameState.buzzHp - decayAmount);
      this.updateHealthBar();
    }
  }
  applyLoadedGameData() {
      console.log('Applying loaded game data:', this.loadData);
      // Restore player state
      // If loading, we use the saved position. If not, the player is already in a random room.
      if (this.loadData.player && this.loadData.player.x !== undefined) {
          this.player.sprite.setPosition(this.loadData.player.x, this.loadData.player.y);
      }
      // Directly replace the initial game state with the loaded one.
      this.gameState = { ...this.gameState, ...this.loadData.player.state };
      // The character's speed might have been upgraded, so we need to restore that too.
      // We'll pull it from the loaded gameState's maxHealth to avoid adding a new save field.
      const characterData = Object.values(Skins).find(c => c.name === this.sys.game.registry.get('playerCharacter'));
      const healthUpgrades = (this.gameState.maxHealth - characterData.startingHealth) / 20;
      // This is a bit of a hack, assuming speed boost is always 1.15. A better way would be to save speed directly.
      // For now, let's just restore the player's speed from the save if it exists.
      // A better approach: Let's assume player speed is saved in gameState. If not, we should add it.
      // It's not there. Let's look at `levelUpScene`. It modifies `scene.player.speed`.
      // Let's modify `pauseScene` to save `player.speed`.
      
      // Let's assume for now we don't restore upgraded speed to keep this step minimal.
      // Restore weapon state by rebuilding stats from base
      this.weaponManager.currentWeaponIndex = this.loadData.weapons.currentWeaponIndex;
      for (const weaponId in this.loadData.weapons.levels) {
          const level = this.loadData.weapons.levels[weaponId];
          if (level > 0) { // Only rebuild if it has been upgraded
            this.weaponManager.rebuildWeaponStats(weaponId, level);
          }
      }
      
      console.log("Game state and weapons restored.");
  }
  
  applyLoadedSettings() {
      console.log('Applying loaded settings:', this.loadData.settings);
      const { settings } = this.loadData;
      this.sys.game.registry.set('playerCharacter', settings.playerCharacter);
      this.sys.game.registry.set('worldSize', this.loadData.world.size);
      this.sys.game.registry.set('enemySpawning', settings.enemySpawning);
  }
  createPickup(x, y, pickupId) {
    const config = getPickupConfig(pickupId);
    if (!config) {
      console.warn(`No pickup config found for ID: ${pickupId}`);
      return;
    }
    const pickup = this.pickups.create(x, y, config.texture);
    pickup.setScale(config.scale);
    pickup.setData('pickupId', config.id);
    pickup.body.setCircle(pickup.width / 2);
    
    // Animate the pickup
    this.tweens.add({
      targets: pickup,
      angle: 360,
      duration: 2000,
      repeat: -1
    });
  }
  handlePickup(playerSprite, pickup) {
    const pickupId = pickup.getData('pickupId');
    const config = getPickupConfig(pickupId);
    if (config && config.apply) {
        config.apply(this, pickupId);
    }
    
    pickup.destroy();
    
    // Visual/Audio feedback for pickup
    this.cameras.main.flash(200, 255, 255, 100);
  }
  createPlayerAnimations() {
    Object.values(Skins).forEach(character => {
      const charKey = character.name;
      // Assumes a 4x4 (16-frame) spritesheet layout
      this.anims.create({
        key: charKey + '_walkUp',
        frames: this.anims.generateFrameNumbers(charKey, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: charKey + '_walkRight',
        frames: this.anims.generateFrameNumbers(charKey, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: charKey + '_walkDown',
        frames: this.anims.generateFrameNumbers(charKey, { start: 8, end: 11 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: charKey + '_walkLeft',
        frames: this.anims.generateFrameNumbers(charKey, { start: 12, end: 15 }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }
  createEnemyAnimations() {
    // Use a Set to only create animations for unique spriteKeys
    const uniqueEnemySprites = new Set(Object.values(EnemyTypes).map(e => e.spriteKey));
    uniqueEnemySprites.forEach(enemyKey => {
      // Assumes a 4x4 (16-frame) spritesheet layout, same as player
      this.anims.create({
        key: enemyKey + '_walkUp',
        frames: this.anims.generateFrameNumbers(enemyKey, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: enemyKey + '_walkRight',
        frames: this.anims.generateFrameNumbers(enemyKey, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: enemyKey + '_walkDown',
        frames: this.anims.generateFrameNumbers(enemyKey, { start: 8, end: 11 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: enemyKey + '_walkLeft',
        frames: this.anims.generateFrameNumbers(enemyKey, { start: 12, end: 15 }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }
}