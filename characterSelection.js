import Phaser from 'phaser';
import { Characters } from './characterData.js';
import { FontStyles } from './fontStyles.js';
import { StatusBar } from './statusBar.js';
import { createCharacterSelectionParticles } from './selectionParticles.js';
export class CharacterSelection {
    constructor(scene, x, y) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.selectedCharacterKey = 'Ahab'; // Default
        this.characterIcons = {};
        this.statTexts = {};
        this.statBars = {};
        this.selectionEmitter = null;
        // Name text is added to the scene directly to allow absolute positioning
        this.characterNameText = scene.add.text(0, 0, '', FontStyles.characterName)
            .setOrigin(0.5)
            .setDepth(10);
        
        this.characterDescriptionText = scene.add.text(this.scene.cameras.main.width / 2, y + 120, '', {
            ...FontStyles.buzz,
            fontSize: '16px',
            fill: '#E0E0E0',
            wordWrap: { width: 450 },
            align: 'center'
        }).setOrigin(0.5).setDepth(10);
        
        this.createPanel();
        this.createIcons();
        this.createStatDisplay();
        // Emitter is now created/updated within updateSelectionVisuals
        this.updateSelectionVisuals();
    }
    createPanel() {
        const characters = Object.keys(Characters);
        const iconSpacing = 90;
        const iconSize = 72;
        const padding = 30;
        const panelWidth = (characters.length - 1) * iconSpacing + iconSize + (padding * 2);
        const panelHeight = iconSize + padding * 2;
        const startX = -panelWidth / 2;
        const startY = -panelHeight / 2;
        
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x000000, 0.4);
        panel.lineStyle(2, 0xFFD700, 0.6);
        panel.fillRoundedRect(startX, startY, panelWidth, panelHeight, 20);
        panel.strokeRoundedRect(startX, startY, panelWidth, panelHeight, 20);
        
        this.container.add(panel);
    }
    createIcons() {
        const characters = Object.keys(Characters);
        const iconSpacing = 90;
        const totalWidth = (characters.length - 1) * iconSpacing;
        const startX = -totalWidth / 2;

        characters.forEach((charKey, index) => {
            const x = startX + (index * iconSpacing);
            const iconSize = 72;
            const boxSize = 82;
            const iconBox = this.scene.add.graphics();
            iconBox.fillStyle(0x000000, 0.2);
            iconBox.fillRoundedRect(x - boxSize / 2, -boxSize / 2, boxSize, boxSize, 12);
            iconBox.setInteractive(new Phaser.Geom.Rectangle(x - boxSize/2, -boxSize/2, boxSize, boxSize), Phaser.Geom.Rectangle.Contains);
            this.container.add(iconBox);
            const characterData = Characters[charKey];
            const iconFrame = characterData.menuIconFrame || 9; // Default frame
            const icon = this.scene.add.sprite(x, 0, charKey, iconFrame)
                .setDisplaySize(iconSize, iconSize);
            iconBox.on('pointerdown', () => {
                this.selectedCharacterKey = charKey;
                this.updateSelectionVisuals();
            });
            if (!this.scene.sys.game.device.input.touch) {
                iconBox.on('pointerover', () => {
                    this.characterNameText.setText(charKey);
                    const iconWorldPos = new Phaser.Math.Vector2();
                    this.container.getWorldTransformMatrix().transformPoint(x, -boxSize / 2, iconWorldPos);
                    this.characterNameText.setPosition(iconWorldPos.x, iconWorldPos.y - 30);
                    this.characterDescriptionText.setText(characterData.description);
                    if (charKey !== this.selectedCharacterKey) {
                         this.scene.tweens.add({ targets: icon, scale: 1.1, duration: 150, ease: 'Power1' });
                    }
                });
                iconBox.on('pointerout', () => {
                    if (charKey !== this.selectedCharacterKey) {
                        this.scene.tweens.add({ targets: icon, scale: 1.0, duration: 150, ease: 'Power1' });
                    }
                    this.updateNameTextPosition();
                    this.updateDescriptionText();
                });
            }
            this.characterIcons[charKey] = { icon, box: iconBox };
            this.container.add(icon);
        });
    }
    createStatDisplay() {
        const stats = ['strength', 'haste', 'movement', 'luck', 'stealth'];
        const startY = 180;
        const spacing = 35;
        const barWidth = 200;
        const labelXOffset = - (barWidth / 2) - 10;
        // This is the X offset from the center of the screen
        const barXOffset = -this.scene.cameras.main.width / 4;
        stats.forEach((statKey, index) => {
            const y = startY + index * spacing;
            const labelText = statKey.charAt(0).toUpperCase() + statKey.slice(1);
            const statBar = new StatusBar(this.scene, barXOffset, y, {
                width: barWidth,
                height: 12,
                label: {
                    text: labelText,
                    x: labelXOffset,
                    y: 6,
                    style: { ...FontStyles.buzz, fontSize: '16px', fill: '#E0E0E0', origin: {x: 1, y: 0.5} }
                }
            });
            
            this.container.add(statBar);
            this.statBars[statKey] = statBar;
        });
    }
    updateSelectionVisuals() {
        if (this.selectionEmitter) {
            this.selectionEmitter.destroy();
        }
        this.selectionEmitter = createCharacterSelectionParticles(this.scene, this.selectedCharacterKey);
        for (const charKey in this.characterIcons) {
            const { icon, box } = this.characterIcons[charKey];
            this.scene.tweens.killTweensOf(icon);
            if (charKey === this.selectedCharacterKey) {
                icon.setTint(0xffffff);
                box.clear();
                box.fillStyle(0x000000, 0.5);
                box.lineStyle(2, 0xFFD700, 1.0);
                box.fillRoundedRect(icon.x - 41, -41, 82, 82, 12);
                box.strokeRoundedRect(icon.x - 41, -41, 82, 82, 12);
                this.scene.tweens.add({ targets: icon, scale: 1.2, duration: 200, ease: 'Power2' });
                const iconWorldPos = new Phaser.Math.Vector2();
                this.container.getWorldTransformMatrix().transformPoint(icon.x, icon.y, iconWorldPos);
                this.selectionEmitter.setPosition(iconWorldPos.x, iconWorldPos.y);
                this.selectionEmitter.start();
            } else {
                icon.setTint(0x999999);
                box.clear();
                box.fillStyle(0x000000, 0.2);
                box.fillRoundedRect(icon.x - 41, -41, 82, 82, 12);
                this.scene.tweens.add({ targets: icon, scale: 1.0, duration: 200, ease: 'Power2' });
            }
        }
        this.updateNameTextPosition();
        this.updateDescriptionText();
        this.updateStatDisplay();
    }
    updateNameTextPosition() {
        this.characterNameText.setText(this.selectedCharacterKey);
        const selectedIcon = this.characterIcons[this.selectedCharacterKey].icon;
        if (selectedIcon) {
            const iconWorldPos = new Phaser.Math.Vector2();
            this.container.getWorldTransformMatrix().transformPoint(selectedIcon.x, -41, iconWorldPos);
            this.characterNameText.setPosition(iconWorldPos.x, iconWorldPos.y - 25);
        }
    }
    
    updateDescriptionText() {
        const characterData = Characters[this.selectedCharacterKey];
        this.characterDescriptionText.setText(characterData.description);
    }
    updateStatDisplay() {
        const characterData = Characters[this.selectedCharacterKey];
        if (!characterData) return;
        const maxStatValue = 1.5; // Assumed max for normalization
        for (const statKey in this.statBars) {
            const bar = this.statBars[statKey];
            const statValue = characterData[statKey] || 0;
            bar.setValue(statValue, maxStatValue);
        }
    }
    getSelectedCharacter() {
        return this.selectedCharacterKey;
    }
    selectRandomCharacter() {
        const characterKeys = Object.keys(Characters);
        const currentKeyIndex = characterKeys.indexOf(this.selectedCharacterKey);
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * characterKeys.length);
        } while (randomIndex === currentKeyIndex); // Ensure it picks a *new* random character
        this.selectedCharacterKey = characterKeys[randomIndex];
        this.updateSelectionVisuals();
    }
}