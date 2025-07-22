import Phaser from 'phaser';

export class DirectionalAttackButton {
    constructor(scene, x, y, direction, radius = 35) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.direction = direction; // 'up', 'down', 'left', 'right'
        this.radius = radius;
        this.isDown = false;

        this.graphic = scene.add.graphics({ x: this.x, y: this.y });
        this.drawButton(0x888888); // Default color

        const shape = new Phaser.Geom.Circle(0, 0, radius);
        this.graphic.setInteractive(shape, Phaser.Geom.Circle.Contains);
        this.graphic.setScrollFactor(0);
        this.graphic.setDepth(100);

        this.graphic.on('pointerdown', () => {
            this.isDown = true;
            this.drawButton(0xffffff); // Pressed color
        });

        // Use scene input to handle pointerup globally, in case the user's finger slides off.
        this.scene.input.on('pointerup', () => {
            if (this.isDown) {
                this.isDown = false;
                this.drawButton(0x888888);
            }
        });
    }

    drawButton(color) {
        this.graphic.clear();
        this.graphic.fillStyle(color, 0.4);
        this.graphic.fillCircle(0, 0, this.radius);

        // Draw triangle for direction
        this.graphic.fillStyle(0xffffff, 0.8);
        const tri = new Phaser.Geom.Triangle(0, 0, 0, 0, 0, 0);
        const w = this.radius * 0.5;
        const h = this.radius * 0.5;

        switch (this.direction) {
            case 'up':
                Phaser.Geom.Triangle.BuildEquilateral(0, -h * 0.2, w, tri);
                break;
            case 'down':
                Phaser.Geom.Triangle.BuildEquilateral(0, h * 0.2, w, tri);
                Phaser.Geom.Triangle.Rotate(tri, Math.PI);
                break;
            case 'left':
                Phaser.Geom.Triangle.BuildEquilateral(-w * 0.2, 0, h, tri);
                Phaser.Geom.Triangle.Rotate(tri, -Math.PI / 2);
                break;
            case 'right':
                Phaser.Geom.Triangle.BuildEquilateral(w * 0.2, 0, h, tri);
                Phaser.Geom.Triangle.Rotate(tri, Math.PI / 2);
                break;
        }

        this.graphic.fillTriangleShape(tri);
    }
}