import Phaser from 'phaser';
import { Button } from './button.js';
import { FontStyles } from './fontStyles.js';

export class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    init(data) {
        this.player = data.player;
        this.upgrader = data.upgrader;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.7)');

        this.createPanel();
        this.createTitle();
        this.createWeaponSlots();
        this.createCloseButton();
    }

    createPanel() {
        const width = 500;
        const height = 350; // Increased height for close button
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2;
        
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 0.95);
        panel.lineStyle(4, 0xFFD700);
        panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, 20);
        panel.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 20);
    }

    createTitle() {
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2 - 140;
        this.add.text(x, y, 'Upgrade Weapon', { ...FontStyles.title, fontSize: '40px' }).setOrigin(0.5);
    }
    
    createWeaponSlots() {
        const startY = this.cameras.main.height / 2 - 60;
        const ySpacing = 90;
        const centerX = this.cameras.main.width / 2;

        this.player.weapons.forEach((weapon, index) => {
            const y = startY + (index * ySpacing);
            this.createSlot(centerX, y, weapon);
        });
    }

    createSlot(x, y, weapon) {
        // Icon
        this.add.image(x - 180, y, weapon.sprite.texture.key).setDisplaySize(64, 64);

        // Text Info
        const weaponName = weapon.constructor.name.replace(/([A-Z])/g, ' $1').trim();
        const infoText = `${weaponName}\nLevel: ${weapon.config.level}`;
        this.add.text(x - 130, y, infoText, { ...FontStyles.button, align: 'left' }).setOrigin(0, 0.5);

        // Upgrade Button
        new Button(this, x + 120, y, 'Upgrade', () => this.onUpgrade(weapon));
    }
    
    createCloseButton() {
        new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 130,
            'Skip',
            () => this.closeScene(false) // Don't explode upgrader if skipped
        );
    }

    onUpgrade(weapon) {
        weapon.upgrade();
        this.player.weapons.forEach(w => w.updateConfig()); // Refresh stats for all weapons
        this.closeScene(true);
    }
    
    closeScene(upgraded) {
        if (upgraded) {
            this.upgrader.explode();
        }
        this.scene.stop();
        const gameScene = this.scene.get('GameScene');
        gameScene.resumeGame();
    }
}