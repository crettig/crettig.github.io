import Phaser from 'phaser';
import { Skins } from './characterSkins.js';
export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    // Background
    const { width, height } = this.cameras.main;
    this.bg = this.add.tileSprite(0, 0, width, height, 'mainMenuBg')
      .setOrigin(0)
      .setAlpha(0.7);

    // Title
    this.add.text(width / 2, 60, 'Settings', {
      fontFamily: 'CarnivalFreakshow, "Courier New", monospace',
      fontSize: '72px',
      color: '#ff6b6b',
      align: 'center',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    // --- Character Selection ---
    this.add.text(width / 2, 140, 'Choose Your Character', {
        fontFamily: "'Courier New', monospace",
        fontSize: '32px', color: '#ffd700', align: 'center'
    }).setOrigin(0.5);
    const facingForwardIndex = 9;
    const characters = Object.values(Skins);
    const charSpacing = 170;
    const startX = width / 2 - (characters.length - 1) * (charSpacing / 2);
    
    characters.forEach((charData, index) => {
        const charX = startX + index * charSpacing;
        const charY = 280;
        const charSprite = this.add.sprite(charX, charY, charData.name, facingForwardIndex)
            .setScale(0.7)
            .setInteractive({ useHandCursor: true });
        charSprite.on('pointerdown', () => {
            this.sys.game.registry.set('playerCharacter', charData.name);
            this.updateSelection();
        });
        charSprite.setData('key', charData.name);
        this.add.text(charX, charY + 90, charData.name.charAt(0).toUpperCase() + charData.name.slice(1), {
            fontFamily: "'Courier New', monospace", fontSize: '22px', color: '#fff',
        }).setOrigin(0.5);
        const statsText = `HP: ${charData.startingHealth}\nSpeed: ${charData.speed}\nLuck: ${charData.luck}`;
        this.add.text(charX, charY + 140, statsText, {
            fontFamily: "'Courier New', monospace", fontSize: '16px', color: '#aaa', align: 'center',
        }).setOrigin(0.5);
    });
    this.selectionIndicator = this.add.graphics();
    let yPos = height - 250; // Start positioning from the bottom up for options
    
    // --- Gameplay Options Container ---
    const optionsContainer = this.add.container(width / 2, yPos);
    
    // Enemy Spawning Button
    const enemySpawningText = this.add.text(0, 0, '', {
        fontFamily: "'Courier New', monospace", fontSize: '24px', color: '#ffffff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    optionsContainer.add(enemySpawningText);
    
    // World Size Button
    const worldSizeText = this.add.text(0, 60, '', {
        fontFamily: "'Courier New', monospace", fontSize: '24px', color: '#ffffff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    optionsContainer.add(worldSizeText);
    
    // Demo Button
    const demoButton = this.add.text(0, 120, 'Launch Tileset Demo', {
        fontFamily: "'Courier New', monospace", fontSize: '24px', color: '#ffffff', backgroundColor: '#54a0ff', padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    optionsContainer.add(demoButton);
    
    // --- Button Logic ---
    // Enemy Spawning
    const updateEnemySpawningText = () => {
        const isEnabled = this.sys.game.registry.get('enemySpawning');
        enemySpawningText.setText(`Enemy Spawning: ${isEnabled ? 'ON' : 'OFF'}`);
        enemySpawningText.setBackgroundColor(isEnabled ? '#4caf50' : '#f44336');
    };
    enemySpawningText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        const currentValue = this.sys.game.registry.get('enemySpawning');
        this.sys.game.registry.set('enemySpawning', !currentValue);
        updateEnemySpawningText();
    });
    updateEnemySpawningText();
    // World Size
    const worldSizes = ['Micro', 'Small', 'Medium', 'Large', 'Giant'];
    const updateWorldSizeText = () => {
        const currentSize = this.sys.game.registry.get('worldSize');
        worldSizeText.setText(`World Size: < ${currentSize} >`);
    };
    worldSizeText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        const currentSize = this.sys.game.registry.get('worldSize');
        const currentIndex = worldSizes.indexOf(currentSize);
        const nextIndex = (currentIndex + 1) % worldSizes.length;
        const newSize = worldSizes[nextIndex];
        this.sys.game.registry.set('worldSize', newSize);
        updateWorldSizeText();
    });
    updateWorldSizeText();
    // Demo Button
    demoButton.setInteractive({ useHandCursor: true });
    demoButton.on('pointerdown', () => this.scene.start('DemoScene'));
    demoButton.on('pointerover', () => demoButton.setBackgroundColor('#74b9ff'));
    demoButton.on('pointerout', () => demoButton.setBackgroundColor('#54a0ff'));
    
    // --- Back Button ---
    const backButton = this.add.text(width / 2, height - 60, 'Back to Menu', {
      fontFamily: "'Courier New', monospace",
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backButton.on('pointerover', () => backButton.setBackgroundColor('#ff6b6b'));
    backButton.on('pointerout', () => backButton.setBackgroundColor('#444444'));
    
    this.updateSelection();
  }
  
  updateSelection() {
    const selectedCharKey = this.sys.game.registry.get('playerCharacter');
    this.selectionIndicator.clear();
    this.selectionIndicator.lineStyle(4, 0x74b9ff, 1);

    this.children.each(child => {
      if (child.getData && child.getData('key') === selectedCharKey) {
        // Adjust selection box to be a bit larger and more noticeable
        const padding = 10;
        this.selectionIndicator.strokeRect(
            child.x - child.displayWidth / 2 - padding, 
            child.y - child.displayHeight / 2 - padding, 
            child.displayWidth + padding * 2, 
            child.displayHeight + padding * 2
        );
      }
    });
  }
  update() {
    if (this.bg) {
        this.bg.tilePositionX += 0.1;
        this.bg.tilePositionY -= 0.1;
    }
  }
}