import Phaser from 'phaser';

export class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        this.music = this.sound.add('shopMusic', { loop: true, volume: 0.5 });
        this.music.play();
        const gameScene = this.scene.get('GameScene');
        // Semi-transparent background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.85).setOrigin(0);

        // Shop Title
        this.add.text(this.cameras.main.width / 2, 80, 'UPGRADE SHOP', {
            fontFamily: "'Courier New', monospace",
            fontSize: '52px',
            color: '#ffd700',
            align: 'center'
        }).setOrigin(0.5);

        // Display current tickets
        this.add.text(this.cameras.main.width / 2, 140, `Tickets: ${gameScene.gameState.tickets}`, {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Placeholder for upgrade items
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Upgrades coming soon!', {
            fontFamily: "'Courier New', monospace",
            fontSize: '28px',
            color: '#aaaaaa',
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Close Button
        const closeButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 'Close Shop', {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeButton.on('pointerdown', () => this.closeShop());
        closeButton.on('pointerover', () => closeButton.setBackgroundColor('#ff6b6b'));
        closeButton.on('pointerout', () => closeButton.setBackgroundColor('#444444'));

        this.input.keyboard.on('keydown-ESC', this.closeShop, this);
    }
    
    closeShop() {
        this.music.stop();
        this.scene.stop();
        this.scene.resume('GameScene');
    }
    shutdown() {
        if (this.music) {
            this.music.stop();
        }
    }
}