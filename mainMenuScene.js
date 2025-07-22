import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
import { Button } from './button.js';
import { Title } from './title.js';
import { AudioManager } from './audioManager.js';
import { Characters } from './characterData.js';
import { CharacterSelection } from './characterSelection.js';
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    // Assets are now loaded in PreloaderScene
  }
  create() {
    this.audioManager = new AudioManager(this);
    this.audioManager.playMusic('mainmenu');
    
    new Title(this, this.cameras.main.width / 2, 150, 'Choose Your Hero');
    
    this.characterSelection = new CharacterSelection(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
    
    const buttonX = this.cameras.main.width * 0.75;
    const startButtonY = this.cameras.main.height - 120;
    const randomButtonY = startButtonY - 80;
    
    // Random Character Button
    new Button(
      this,
      buttonX,
      randomButtonY,
      'Random',
      () => {
        this.characterSelection.selectRandomCharacter();
      }
    );
    // Start Game Button
    new Button(
      this,
      buttonX,
      startButtonY,
      'Start Game',
      () => {
        this.audioManager.stopAllSounds();
        const selectedCharacter = this.characterSelection.getSelectedCharacter();
        this.scene.start('GameScene', { character: selectedCharacter });
      }
    );
  }
}