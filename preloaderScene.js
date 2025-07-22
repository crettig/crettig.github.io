import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
import { Characters } from './characterData.js';
import { GameAssets } from './assets.js';
export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }
  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x332841, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const progressBar = this.add.graphics();
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading Assets...',
      style: { ...FontStyles.preloader, fontSize: '20px' }
    });
    loadingText.setOrigin(0.5, 0.5);
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: { ...FontStyles.preloader, fontSize: '18px' }
    });
    percentText.setOrigin(0.5, 0.5);
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
    this.load.on('complete', () => {
      this.scene.start('MainMenuScene');
    });
    // Load all assets from the centralized file
    GameAssets.images.forEach(asset => {
        this.load.image(asset.key, asset.url);
    });
    this.load.image('VulnerableIcon', 'https://play.rosebud.ai/assets/JackpotJavelinIconSkull.png?MGZp');
    this.load.image('DeafenedIcon', 'https://play.rosebud.ai/assets/MeatHornBuffIconDeafened.png?0hOY');
    this.load.image('PanicIcon', 'https://play.rosebud.ai/assets/MeatHornIconPanic.png?31PP');
    this.load.image('ArmorShredIcon', 'https://play.rosebud.ai/assets/JackpotJavelinIconCherry.png?UMxE');
    GameAssets.spritesheets.forEach(asset => {
        // Special handling for character assets to use the character name as the key
        const charKey = Object.keys(Characters).find(key => Characters[key].assetKey === asset.key);
        if (charKey) {
            this.load.spritesheet(charKey, asset.url, asset.frameConfig);
        } else {
            this.load.spritesheet(asset.key, asset.url, asset.frameConfig);
        }
    });
    GameAssets.audio.forEach(asset => {
        this.load.audio(asset.key, asset.url);
    });
    this.load.audio('MeatHornCharge', 'https://play.rosebud.ai/assets/MeatHornCharge.mp3?Ht0x');
    this.load.spritesheet('MeatHornConeSpriteSheet', 'https://play.rosebud.ai/assets/MeatHornConeSpriteSheet.png?4KvB', { frameWidth: 192, frameHeight: 192 });
  }
}