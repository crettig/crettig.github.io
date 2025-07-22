import Phaser from 'phaser';
import { Button } from './button.js';
import { Title } from './title.js';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        // Create a transparent overlay
        const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5);
        overlay.setOrigin(0);

        new Title(this, this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'PAUSED');

        const resumeButton = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 25,
            'UIPlay'
        )
        .setDisplaySize(64, 64)
        .setInteractive({ useHandCursor: true });
        resumeButton.on('pointerover', () => {
            this.tweens.add({ targets: resumeButton, scale: 1.1, duration: 150, ease: 'Power1' });
        });
        resumeButton.on('pointerout', () => {
            this.tweens.add({ targets: resumeButton, scale: 1, duration: 150, ease: 'Power1' });
        });
        resumeButton.on('pointerdown', () => {
            this.tweens.add({
                targets: resumeButton,
                scale: 0.9,
                duration: 80,
                ease: 'Power1',
                yoyo: true,
                onComplete: () => {
                    const gameScene = this.scene.get('GameScene');
                    gameScene.togglePause(false); // Force resume
                }
            });
        });
        // Test button to upgrade current weapon
        new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 110,
            'Upgrade Weapon',
            () => {
                const gameScene = this.scene.get('GameScene');
                if (gameScene && gameScene.player && gameScene.player.weapon) {
                    gameScene.player.weapon.upgrade();
                    gameScene.uiManager.updateWeaponUI();
                }
            }
        );
        // Main Menu Button
        new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 170,
            'Main Menu',
            () => {
                const gameScene = this.scene.get('GameScene');
                if (gameScene && gameScene.audioManager) {
                    gameScene.audioManager.stopAllSounds();
                }
                this.scene.stop('GameScene');
                this.scene.start('MainMenuScene');
            }
        );
    }
}