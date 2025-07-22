import Phaser from 'phaser';

export class StatusBar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);
        scene.add.existing(this);

        this.config = {
            width: 200,
            height: 12,
            bgColor: 0x000000,
            bgAlpha: 0.5,
            barColor: null, // A single fixed color for the bar
            colorStops: { // Or a gradient
                start: 0xFF8888, // Weak (Red)
                end: 0x88FF88    // Strong (Green)
            },
            ...config
        };
        this.barWidth = 0;
        // Background
        this.bg = scene.add.graphics();
        this.bg.fillStyle(this.config.bgColor, this.config.bgAlpha);
        this.bg.fillRoundedRect(0, 0, this.config.width, this.config.height, this.config.height / 2);
        this.add(this.bg);

        // Foreground bar
        this.bar = scene.add.graphics();
        this.add(this.bar);
        
        // Label
        if (this.config.label) {
             this.label = scene.add.text(
                this.config.label.x, 
                this.config.label.y,
                this.config.label.text, 
                this.config.label.style
            );
            this.add(this.label);
        }
    }

    setValue(value, maxValue, animate = true) {
        const percent = Phaser.Math.Clamp(value / maxValue, 0, 1);
        const targetWidth = this.config.width * percent;
        let barColor;
        if (this.config.barColor !== null) {
            barColor = this.config.barColor;
        } else {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(this.config.colorStops.start),
                Phaser.Display.Color.ValueToColor(this.config.colorStops.end),
                100,
                percent * 100
            );
            barColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        }
        if (animate) {
             this.scene.tweens.add({
                targets: this,
                barWidth: targetWidth,
                duration: 300,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    this.drawBar(barColor);
                }
            });
        } else {
            this.barWidth = targetWidth;
            this.drawBar(barColor);
        }
    }
    
    drawBar(color) {
        this.bar.clear();
        this.bar.fillStyle(color);
        this.bar.fillRoundedRect(0, 0, this.barWidth, this.config.height, this.config.height / 2);
    }
}