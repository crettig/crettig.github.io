import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, onClick) {
    super(scene, x, y);

    const buttonWidth = 190;
    const buttonHeight = 50;

    // Button Background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x8C0000); // Deep Casino Red
    this.background.lineStyle(4, 0xFFD700); // Gold Border
    this.background.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    this.background.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    this.add(this.background);

    // Button Text
    this.buttonText = scene.add.text(0, 0, text, FontStyles.casinoButton).setOrigin(0.5);
    this.add(this.buttonText);

    // Add to scene
    scene.add.existing(this);

    this.originalY = y;
    this.activeTween = null;
    // Interactivity
    this.setSize(buttonWidth, buttonHeight)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.stopTween();
        this.activeTween = scene.tweens.add({
          targets: this,
          scale: 0.97,
          y: this.originalY + 2,
          duration: 80,
          ease: 'Power1'
        });
        if (onClick) {
          onClick();
        }
      })
      .on('pointerup', () => {
        this.stopTween();
        this.activeTween = scene.tweens.add({
          targets: this,
          scale: 1.1,
          y: this.originalY,
          duration: 80,
          ease: 'Power1'
        });
      });
      if (!scene.sys.game.device.input.touch) {
          this.on('pointerover', () => {
              this.stopTween();
              this.activeTween = scene.tweens.add({
                  targets: this,
                  scale: 1.1,
                  y: this.originalY,
                  duration: 150,
                  ease: 'Power2'
              });
              if (this.background.preFX) {
                  this.background.preFX.setPadding(4);
                  this.background.preFX.addGlow(0xFFD700, 2);
              }
          }).on('pointerout', () => {
              this.stopTween();
              this.activeTween = scene.tweens.add({
                  targets: this,
                  scale: 1,
                  y: this.originalY,
                  duration: 150,
                  ease: 'Power2'
              });
              if (this.background.preFX) {
                  this.background.preFX.clear();
              }
          });
      }
  }
  stopTween() {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
  }
}