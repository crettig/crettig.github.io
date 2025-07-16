import Phaser from 'phaser';

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: { font: '20px monospace', fill: '#ffffff' }
    }).setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: { font: '18px monospace', fill: '#ffffff' }
    }).setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });

    this.load.on('complete', () => {
      this.registry.set('playerCharacter', 'ahab'); // Default character
      this.registry.set('enemySpawning', true); // Default enemy spawning to ON
      this.registry.set('worldSize', 'Medium'); // Default world size
      this.scene.start('MainMenuScene');
    });

    // Load all assets
    this.load.image('mainMenuBg', 'https://play.rosebud.ai/assets/mainmenu.png?TNo7');
    // Using existing assets as placeholders for new weapons
    this.load.image('waterBalloon', 'https://play.rosebud.ai/assets/water balloon.png?ZC8X');
    this.load.image('bottleOfRegret', 'https://play.rosebud.ai/assets/WeaponBottleOfRegret.png?IK7i');
    this.load.spritesheet('gasCloud', 'https://play.rosebud.ai/assets/BottleOfRegretGasCloud.png?pmzF', { frameWidth: 64, frameHeight: 64 });
    // Removed 'tent' and 'shopBooth' as they are no longer used.
    this.load.image('healthPickup', 'https://play.rosebud.ai/assets/healthPickup0.png?fI8z');
    this.load.image('ticketPickup', 'https://play.rosebud.ai/assets/RaffleTicket.png?WSGC');
    this.load.image('brokenShield', 'https://play.rosebud.ai/assets/BottleOfRegretBrokenShieldIcon.png?42z6');
    this.load.image('tilesetAtlas', 'https://play.rosebud.ai/assets/Haunted_Carnival_pri...-1764825410-1.png?HGsm');
    // Removed 'tentWall' as it's no longer used.
    // New unified world tileset
    this.load.image('world_tileset', 'https://play.rosebud.ai/assets/Tileset.png?ZmLm');
    this.load.image('casinofloor', 'https://play.rosebud.ai/assets/CasinoFloor.png?hDKk');
    this.load.image('casiowall', 'https://play.rosebud.ai/assets/CasinoWall.png?nkeV');
    this.load.image('casinoobjects', 'https://play.rosebud.ai/assets/CasinoObjects.png?plyA');
    this.load.spritesheet('agentter', 'https://play.rosebud.ai/assets/agentter.png?TqL6', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('sean', 'https://play.rosebud.ai/assets/sean.png?GZ52', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('drew', 'https://play.rosebud.ai/assets/drew.png?4r5t', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('ahab', 'https://play.rosebud.ai/assets/ahab.png?noSe', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('rocco', 'https://play.rosebud.ai/assets/rocco.png?hcpn', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('clown1', 'https://play.rosebud.ai/assets/clown1.png?Nu4M', { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet('clown2', 'https://play.rosebud.ai/assets/clown2.png?o36R', { frameWidth: 192, frameHeight: 192 });
    
    // Load audio
    this.load.audio('backgroundMusic', 'https://play.rosebud.ai/assets/Funhouse Frenzy.mp3?JkQN');
    this.load.audio('mainMenuMusic', 'https://play.rosebud.ai/assets/Curtain Call.mp3?XzWw');
    this.load.audio('shopMusic', 'https://play.rosebud.ai/assets/Carnival Deals.mp3?U0Az');
    this.load.audio('walk_grass', 'https://play.rosebud.ai/assets/mixkit-walking-on-grass-1921.wav?m85c');
    this.load.audio('clown1Death', 'https://play.rosebud.ai/assets/clown1DeathSound.m4a?iBA5');
    this.load.audio('clown2Death', 'https://play.rosebud.ai/assets/clown2DeathSound.m4a?W7Ry');
    this.load.audio('playerHit', 'https://play.rosebud.ai/assets/PlayerGetsHit.m4a?NkKM');
    this.load.audio('waterBalloonSplat', 'https://play.rosebud.ai/assets/WaterBallonSplat.wav?G0UX');
    // Create a dynamic texture for particles
    const graphics = this.make.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }
}