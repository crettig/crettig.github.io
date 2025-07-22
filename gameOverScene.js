import Phaser from 'phaser';
import { Button } from './button.js';
import { FontStyles } from './fontStyles.js';
import { Title } from './title.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.7)');

        new Title(this, this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'GAME OVER');

        new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Main Menu',
            () => {
                this.scene.stop('GameScene');
                this.scene.start('MainMenuScene');
            }
        );
    }
}