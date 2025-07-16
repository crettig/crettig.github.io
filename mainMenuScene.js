import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }
  create() {
    // Use the document.fonts API to check if our custom font is ready
    document.fonts.load('84px CarnivalFreakshow').then(() => {
        // This code runs only after the font is loaded and ready
        this.createSceneContent();
    }).catch(err => {
        console.warn('Custom font failed to load, falling back to default.', err);
        // If the font fails for some reason, create the scene with the fallback font
        this.createSceneContent();
    });
  }
  createSceneContent() {
    this.music = this.sound.add('mainMenuMusic', { loop: true, volume: 0.4 });
    this.music.play();
    // Ensure HUD is hidden
    document.getElementById('game-hud').style.display = 'none';
    if (document.getElementById('joystick-zones')) {
        document.getElementById('joystick-zones').style.display = 'none';
    }
    const { width, height } = this.cameras.main;
    // instead of tileSprite…
    const bg = this.add.image(0, 0, 'mainMenuBg')
      .setOrigin(0)
      .setDisplaySize(width, height);
    
    
    // Game Title
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 300, 'Walt, serious question', {
      fontFamily: 'CarnivalFreakshow, "Courier New", monospace',
      fontSize: '84px',
      color: '#ff6b6b',
      align: 'center',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    // --- Menu Buttons ---
    const createButton = (y, text, onClick) => {
        const button = this.add.text(width / 2, y, text, {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 30, y: 15 },
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        // Hover Effects
        button.on('pointerover', () => {
            this.tweens.add({ targets: button, scale: 1.05, duration: 200, ease: 'Sine.easeInOut' });
            button.setBackgroundColor('#ff6b6b');
        });
        button.on('pointerout', () => {
            this.tweens.add({ targets: button, scale: 1, duration: 200, ease: 'Sine.easeInOut' });
            button.setBackgroundColor('#444444');
        });
        // Click Action
        button.on('pointerdown', onClick);
        return button;
    };
    const startButton = createButton(height / 2 + 50, 'Start Game', () => {
        this.shutdown();
        this.scene.start('GameScene');
    });
    const settingsButton = createButton(height / 2 + 130, 'Settings', () => {
        this.shutdown();
        this.scene.start('SettingsScene');
    });
    const hasSave = localStorage.getItem('carnivalNightmareSave') !== null;
    if (hasSave) {
        const continueButton = createButton(height / 2 + 210, 'Continue Game', () => {
            this.shutdown();
            // We'll pass a flag to tell GameScene to load data
            this.scene.start('GameScene', { load: true });
        });
    } else {
        // Show a disabled-looking button if no save exists
        this.add.text(width / 2, height / 2 + 210, 'No Saved Data', {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#999999', // Grayed out text
            backgroundColor: '#2a2a2a', // Darker background
            padding: { x: 30, y: 15 },
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }
     // Fullscreen Button
    const fullscreenButton = this.add.text(this.cameras.main.width - 20, 20, 'Fullscreen', {
        fontFamily: "'Courier New', monospace",
        fontSize: '20px',
        color: '#fff',
        align: 'right'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fullscreenButton.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        fullscreenButton.setText('Fullscreen');
      } else {
        this.scale.startFullscreen();
        fullscreenButton.setText('Exit Fullscreen');
      }
    });
    this.scale.on('fullscreenchange', (isFullscreen) => {
      if (isFullscreen) {
        fullscreenButton.setText('Exit Fullscreen');
      } else {
        fullscreenButton.setText('Fullscreen');
      }
    });
  }
  shutdown() {
    if (this.music) {
      this.music.stop();
    }
  }
}