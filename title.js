import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';

export class Title extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text) {
    super(scene, x, y);
    this.titleText = scene.add.text(0, 0, text, FontStyles.title).setOrigin(0.5);
    const gradient = this.titleText.context.createLinearGradient(0, 0, 0, this.titleText.height);
    gradient.addColorStop(0, '#FFDB70');
    gradient.addColorStop(0.5, '#F5B543');
    gradient.addColorStop(1, '#FFDB70');
    this.titleText.setFill(gradient);
    
    this.titleText.setShadow(3, 3, 'rgba(0,0,0,0.6)', 6);
    this.add(this.titleText);
    scene.add.existing(this);
    scene.tweens.add({
      targets: this.titleText,
      scale: 1.03,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    // Shine effect
    const shine = scene.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.3 } });
    const shape = new Phaser.Geom.Rectangle(-this.titleText.width, -this.titleText.height/2, this.titleText.width/2, this.titleText.height*2);
    shine.fillRectShape(shape);
    shine.setBlendMode(Phaser.BlendModes.ADD);
    shine.setMask(this.titleText.createBitmapMask());
    this.add(shine);
    
    scene.tweens.add({
      targets: shine,
      x: this.titleText.width * 2,
      duration: 1500,
      ease: 'Cubic.easeInOut',
      repeat: -1,
      delay: 500,
      repeatDelay: 1000
    });
  }
}