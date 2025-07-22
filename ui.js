import { FontStyles } from './fontStyles.js';
import { BoomerangFlask } from './boomerangFlask.js';
import { StatusBar } from './statusBar.js';
import { DirectionalAttackButton } from './directionalAttackButton.js';
export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.directionalAttackButtons = {};
    this.isWeaponOnCooldown = false;
    this.createHealthAndShieldBars();
    this.createWeaponUI();
    this.createXPBar();
    this.createPauseButton();
    if (this.scene.sys.game.device.input.touch) {
        this.createMobileControls();
    }
  }
  createCooldownIndicator(x, y, size) {
      this.cooldownIndicator = this.scene.add.graphics();
      this.cooldownIndicator.setScrollFactor(0);
      this.cooldownIndicator.x = x;
      this.cooldownIndicator.y = y;
      this.cooldownIndicator.radius = size / 2;
  }
  createHealthAndShieldBars() {
      // Health Bar
      this.healthBar = new StatusBar(this.scene, 80, 25, {
          width: 140,
          height: 18,
          bgColor: 0x4B0000,
          colorStops: { start: 0xFF3333, end: 0x33FF33 }
      });
      this.healthBar.setScrollFactor(0);
      // Shield Bar, created on top of the health bar
      this.shieldBar = new StatusBar(this.scene, 80, 25, {
          width: 140,
          height: 18,
          bgColor: 0x000000,
          bgAlpha: 0, // Transparent background
          barColor: 0x00BFFF
      });
      this.shieldBar.setScrollFactor(0);
      
      this.buzzText = this.scene.add.text(20, 34, 'Buzz', { ...FontStyles.buzz, fontSize: '18px' }).setOrigin(0, 0.5);
      this.buzzText.setScrollFactor(0);
  }
  update() {
    const player = this.scene.player;
    this.healthBar.setValue(player.health, player.maxHealth, false);
    this.shieldBar.setValue(player.buzzShield, player.maxBuzzShield, true);
    this.updateWeaponUI();
    this.updateXPBar();
  }
  updateWeaponUI() {
    const weapon = this.scene.player.weapon;
    const player = this.scene.player;
    const weaponKey = weapon.sprite.texture.key;
    if (this.weaponIcon.texture.key !== weaponKey) {
        this.weaponIcon.setTexture(weaponKey);
    }
    this.cooldownIndicator.clear();
    
    let cooldownPercent = 0;
    let remainingTime = 0;
    let cooldownDuration = 0;
    if (weapon instanceof BoomerangFlask && weapon.isOnCooldown) {
        cooldownDuration = weapon.config.missCooldown;
        remainingTime = Math.max(0, weapon.cooldownStartTime + cooldownDuration - this.scene.time.now);
        cooldownPercent = (this.scene.time.now - weapon.cooldownStartTime) / cooldownDuration;
    } else if (weapon.lastAttackTime > 0) {
        cooldownDuration = weapon.config.attackSpeed;
        const timeSinceAttack = this.scene.time.now - weapon.lastAttackTime;
        remainingTime = Math.max(0, cooldownDuration - timeSinceAttack);
        cooldownPercent = timeSinceAttack / cooldownDuration;
    }
    if (cooldownPercent > 0 && cooldownPercent < 1) {
        this.isWeaponOnCooldown = true;
        this.weaponIcon.setAlpha(0.7);
        this.cooldownIndicator.fillStyle(0x000000, 0.7);
        this.cooldownIndicator.slice(
            0, 0, this.cooldownIndicator.radius,
            Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(270 + (360 * (1 - cooldownPercent))),
            true
        );
        this.cooldownIndicator.fillPath();
        this.cooldownText.setText((remainingTime / 1000).toFixed(1));
        this.cooldownText.setVisible(true);
    } else {
        if (this.isWeaponOnCooldown) {
            this.isWeaponOnCooldown = false;
            this.scene.tweens.add({
                targets: this.weaponIcon,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 100,
                yoyo: true,
                ease: 'quad.inout'
            });
        }
        this.weaponIcon.setAlpha(1.0);
        this.cooldownText.setVisible(false);
    }
    
    this.levelText.setText(`Lvl: ${weapon.config.level || 1}`);
  }
  createWeaponUI() {
    const iconSize = 64;
    const padding = 15;
    const x = this.scene.cameras.main.width - padding - iconSize / 2;
    const y = this.scene.cameras.main.height - padding - iconSize / 2;
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.6);
    background.fillRoundedRect(x - iconSize / 2 - 5, y - iconSize / 2 - 5, iconSize + 10, iconSize + 10, 10);
    background.setScrollFactor(0);
    // Use a placeholder icon if the weapon doesn't have a texture key (like the boomerang)
    const weaponKey = this.scene.player.weapon.sprite.texture.key;
    this.weaponIcon = this.scene.add.image(x, y, weaponKey);
    this.weaponIcon.setDisplaySize(iconSize, iconSize);
    this.weaponIcon.setScrollFactor(0);
    this.createCooldownIndicator(x, y, iconSize);
    this.levelText = this.scene.add.text(x, y + iconSize / 2 + 10, `Lvl: ${this.scene.player.weapon.config.level || 1}`, FontStyles.buzz)
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.cooldownText = this.scene.add.text(x, y, '', { ...FontStyles.buzz, fontSize: '24px', align: 'center', stroke: '#000000', strokeThickness: 4 })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
    // Weapon switching is handled in createMobileControls for touch devices
  }
  createXPBar() {
      const barWidth = this.scene.cameras.main.width * 0.4;
      const barHeight = 20;
      const x = this.scene.cameras.main.width / 2;
      const y = 20;
      this.xpBar = new StatusBar(this.scene, x - barWidth / 2, y - barHeight / 2, {
          width: barWidth,
          height: barHeight,
          barColor: 0x6633FF
      });
      this.xpBar.setScrollFactor(0);
      this.levelTextUI = this.scene.add.text(x, y, `Level: ${this.scene.player.level}`, {
          ...FontStyles.buzz,
          fontSize: '14px',
          fill: '#FFD700'
      }).setOrigin(0.5).setScrollFactor(0);
  }
  updateXPBar() {
      const player = this.scene.player;
      this.xpBar.setValue(player.xp, player.xpToNextLevel, true);
      this.levelTextUI.setText(`Level: ${player.level}`);
  }
  createPauseButton() {
      const padding = 20;
      const iconSize = 48;
      const x = this.scene.cameras.main.width - padding - iconSize / 2;
      const y = padding + iconSize / 2;
      this.pauseButton = this.scene.add.image(x, y, 'UIPause')
          .setScrollFactor(0)
          .setDepth(100)
          .setDisplaySize(iconSize, iconSize)
          .setInteractive({ useHandCursor: true });
      this.pauseButton.on('pointerdown', () => {
          this.scene.togglePause();
      });
  }
  setPauseButtonTexture(isPaused) {
      this.pauseButton.setTexture(isPaused ? 'UIPlay' : 'UIPause');
  }
  createMobileControls() {
    const { width, height } = this.scene.cameras.main;
    const radius = 35;
    const spacing = 45;
    const centerX = width - radius - spacing;
    const centerY = height - radius * 2 - spacing;
    this.directionalAttackButtons = {
        up: new DirectionalAttackButton(this.scene, centerX, centerY - spacing, 'up', radius),
        down: new DirectionalAttackButton(this.scene, centerX, centerY + spacing, 'down', radius),
        left: new DirectionalAttackButton(this.scene, centerX - spacing, centerY, 'left', radius),
        right: new DirectionalAttackButton(this.scene, centerX + spacing, centerY, 'right', radius)
    };
    // Reposition weapon UI icon to be an interactive switch button
    const iconSize = 48;
    const iconX = width - 100;
    const iconY = height - 240; // Increased vertical separation
    this.weaponIcon
        .setPosition(iconX, iconY)
        .setDisplaySize(iconSize, iconSize)
        .setInteractive({ useHandCursor: true });
        
    this.weaponIcon.on('pointerdown', () => {
        this.scene.player.switchWeapon(1);
    });
    this.levelText.setPosition(iconX, iconY + iconSize / 2 + 10);
    this.cooldownIndicator.x = iconX;
    this.cooldownIndicator.y = iconY;
    this.cooldownIndicator.radius = iconSize / 2;
    this.cooldownText.setPosition(iconX, iconY);
  }
}