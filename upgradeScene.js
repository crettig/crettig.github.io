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
        this.numWeapons = this.player.weapons.length;
    }
    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.7)');
        this.player.canAttack = false;
        this.createPanel();
        this.createTitle();
        this.createWeaponSlots();
        this.createCloseButton();
    }
    createPanel() {
        const panelWidth = 500;
        const cardHeight = 70;
        const cardSpacing = 15;
        const paddingTop = 80;
        const paddingBottom = 80;
        
        const contentHeight = (this.numWeapons * (cardHeight + cardSpacing)) - cardSpacing;
        const panelHeight = paddingTop + contentHeight + paddingBottom;
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2;
        const cornerRadius = 20;
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0a0a, 0.9);
        panel.fillRoundedRect(x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight, cornerRadius);
        panel.lineStyle(2, 0x333333);
        panel.strokeRoundedRect(x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight, cornerRadius);
        // Decorative corner lines
        panel.lineStyle(3, 0xFFD700, 1);
        const cornerLength = 30;
        // Top-left
        panel.beginPath();
        panel.moveTo(x - panelWidth / 2 + cornerRadius, y - panelHeight / 2);
        panel.lineTo(x - panelWidth / 2 + cornerRadius - cornerLength, y - panelHeight / 2);
        panel.moveTo(x - panelWidth / 2, y - panelHeight / 2 + cornerRadius);
        panel.lineTo(x - panelWidth / 2, y - panelHeight / 2 + cornerRadius - cornerLength);
        panel.strokePath();
        // Top-right
        panel.beginPath();
        panel.moveTo(x + panelWidth / 2 - cornerRadius, y - panelHeight / 2);
        panel.lineTo(x + panelWidth / 2 - cornerRadius + cornerLength, y - panelHeight / 2);
        panel.moveTo(x + panelWidth / 2, y - panelHeight / 2 + cornerRadius);
        panel.lineTo(x + panelWidth / 2, y - panelHeight / 2 + cornerRadius - cornerLength);
        panel.strokePath();
        // Bottom-left
        panel.beginPath();
        panel.moveTo(x - panelWidth / 2 + cornerRadius, y + panelHeight / 2);
        panel.lineTo(x - panelWidth / 2 + cornerRadius - cornerLength, y + panelHeight / 2);
        panel.moveTo(x - panelWidth / 2, y + panelHeight / 2 - cornerRadius);
        panel.lineTo(x - panelWidth / 2, y + panelHeight / 2 - cornerRadius + cornerLength);
        panel.strokePath();
        // Bottom-right
        panel.beginPath();
        panel.moveTo(x + panelWidth / 2 - cornerRadius, y + panelHeight / 2);
        panel.lineTo(x + panelWidth / 2 - cornerRadius + cornerLength, y + panelHeight / 2);
        panel.moveTo(x + panelWidth / 2, y + panelHeight / 2 - cornerRadius);
        panel.lineTo(x + panelWidth / 2, y + panelHeight / 2 - cornerRadius + cornerLength);
        panel.strokePath();
    }
    
    createTitle() {
        const x = this.cameras.main.width / 2;
        const panelCenterY = this.cameras.main.height / 2;
        
        const cardHeight = 70;
        const cardSpacing = 15;
        const paddingTop = 80;
        const contentHeight = (this.numWeapons * (cardHeight + cardSpacing)) - cardSpacing;
        const panelHeight = paddingTop + contentHeight + 80;
        const panelTopY = panelCenterY - panelHeight / 2;
        const titleY = panelTopY + 45;
        this.add.text(x, titleY, 'UPGRADE AVAILABLE', { ...FontStyles.title, fontSize: '32px', letterSpacing: '1.5px' }).setOrigin(0.5);
    }
    
    createWeaponSlots() {
        const cardHeight = 70;
        const cardSpacing = 15;
        const paddingTop = 80;
        const totalSlotHeight = cardHeight + cardSpacing;
        const panelCenterY = this.cameras.main.height / 2;
        const contentHeight = (this.numWeapons * totalSlotHeight) - cardSpacing;
        const panelHeight = paddingTop + contentHeight + 80;
        const panelTopY = panelCenterY - panelHeight / 2;
        
        const startY = panelTopY + paddingTop + cardHeight / 2;
        const centerX = this.cameras.main.width / 2;
        this.player.weapons.forEach((weapon, index) => {
            const y = startY + (index * totalSlotHeight);
            this.createSlot(centerX, y, weapon);
        });
    }
    createSlot(x, y, weapon) {
        const cardWidth = 460;
        const cardHeight = 70;
        // Card background
        const card = this.add.graphics();
        card.fillStyle(0x1c1c1c, 1);
        card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 10);
        card.lineStyle(1, 0x444444);
        card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 10);
        
        // Icon
        this.add.image(x - cardWidth / 2 + 50, y, weapon.sprite.texture.key).setDisplaySize(50, 50).setOrigin(0.5);
        // Text Info
        const weaponName = weapon.constructor.name.replace(/([A-Z])/g, ' $1').trim();
        const infoText = `${weaponName}\nLevel: ${weapon.config.level}`;
        this.add.text(x - cardWidth / 2 + 95, y, infoText, { ...FontStyles.button, align: 'left', fontSize: '18px' }).setOrigin(0, 0.5);
        // Upgrade Button
        new Button(this, x + cardWidth / 2 - 80, y, 'Upgrade', () => this.onUpgrade(weapon));
    }
    
    createCloseButton() {
        const cardHeight = 70;
        const cardSpacing = 15;
        const paddingTop = 80;
        const paddingBottom = 80;
        const contentHeight = (this.numWeapons * (cardHeight + cardSpacing)) - cardSpacing;
        const panelHeight = paddingTop + contentHeight + paddingBottom;
        new Button(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + panelHeight / 2 - 40,
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
        this.player.canAttack = true;
        this.scene.stop();
        const gameScene = this.scene.get('GameScene');
        gameScene.resumeGame();
    }
}