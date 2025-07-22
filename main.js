import Phaser from 'phaser';
import { GameScene } from './gameScene.js';
import { MainMenuScene } from './mainMenuScene.js';
import { PreloaderScene } from './preloaderScene.js';
import { GameOverScene } from './gameOverScene.js';
import { UpgradeScene } from './upgradeScene.js';
import { LevelUpScene } from './levelUpScene.js';
import { PauseScene } from './pauseScene.js';
import VirtualJoystickPlugin from 'https://esm.sh/phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { GameConfig } from './config.js';
const config = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: GameConfig.physics.debug
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'phaser-game-container',
    width: 1024,
    height: 768
  },
  backgroundColor: '#6B5B73',
  plugins: {
    global: [{
        key: 'rexVirtualJoystick',
        plugin: VirtualJoystickPlugin,
        start: true
    }]
  },
  scene: [PreloaderScene, MainMenuScene, GameScene, GameOverScene, UpgradeScene, PauseScene, LevelUpScene]
};
new Phaser.Game(config);