import nipplejs from 'https://esm.sh/nipplejs?external=phaser';

export class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.moveVector = new Phaser.Math.Vector2(0, 0);
        this.aimVector = new Phaser.Math.Vector2(0, 0);

        this.isTouchDevice = this.scene.sys.game.device.input.touch;

        if (this.isTouchDevice) {
            document.getElementById('joystick-zones').style.display = 'block';
            this.setupJoysticks();
        }
    }

    setupJoysticks() {
        const moveZone = document.getElementById('joystick-move');
        const aimZone = document.getElementById('joystick-aim');

        const moveOptions = {
            zone: moveZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 120
        };

        const aimOptions = {
            zone: aimZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 120,
            lockX: false,
            lockY: false
        };

        this.moveStick = nipplejs.create(moveOptions);
        this.aimStick = nipplejs.create(aimOptions);

        this.moveStick.on('move', (evt, data) => {
            if (data.vector) {
                this.moveVector.set(data.vector.x, -data.vector.y); // Y is inverted
            }
        });

        this.moveStick.on('end', () => {
            this.moveVector.set(0, 0);
        });

        this.aimStick.on('move', (evt, data) => {
            if (data.vector) {
                this.aimVector.set(data.vector.x, -data.vector.y); // nipplejs y is inverted for phaser's coordinate system
                // Phaser's weapon manager expects an object with worldX and worldY.
                const pointer = {
                    worldX: this.scene.player.sprite.x + this.aimVector.x * 500, // Extend range for better targeting
                    worldY: this.scene.player.sprite.y + this.aimVector.y * 500
                };
                this.scene.player.aimAngle = this.aimVector.angle();
                // Fire weapon continuously while aiming
                this.scene.weaponManager.fireWeapon(this.scene.player, pointer, this.scene.enemyManager.enemies);
            }
        });

        this.aimStick.on('end', () => {
            this.aimVector.set(0, 0);
        });
    }

    update() {
        // No longer needed, aim is updated on move event
    }

    destroy() {
        if (this.moveStick) {
            this.moveStick.destroy();
        }
        if (this.aimStick) {
            this.aimStick.destroy();
        }
        document.getElementById('joystick-zones').style.display = 'none';
    }
}