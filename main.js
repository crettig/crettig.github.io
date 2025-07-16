import Phaser from 'phaser';
import { GameScene } from './gameScene.js';
import { MainMenuScene } from './mainMenuScene.js';
import { PreloaderScene } from './preloaderScene.js';
import { SettingsScene } from './settingsScene.js';
import { LevelUpScene } from './levelUpScene.js';
import { PauseScene } from './pauseScene.js';
import { ShopScene } from './shopScene.js';
import { DemoScene } from './demoScene.js';
import { ColorCyclePipeline } from './ColorCyclePipeline.js';
const config = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'phaser-game-container',
    width: 1024,
    height: 768
  },
  scene: [PreloaderScene, MainMenuScene, SettingsScene, GameScene, LevelUpScene, PauseScene, ShopScene, DemoScene],
  backgroundColor: '#2c1810',
  pipeline: {
    'ColorCycle': ColorCyclePipeline
  }
};

const game = new Phaser.Game(config);