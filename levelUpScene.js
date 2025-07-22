import Phaser from 'phaser';
import { FontStyles } from './fontStyles.js';
import { Button } from './button.js';

export class LevelUpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelUpScene' });
    }

    init(data) {
        this.player = data.player;
        this.gameScene = this.scene.get('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0.8)');
        
        const { width, height } = this.cameras.main;

        this.add.text(width / 2, height * 0.2, 'LEVEL UP!', FontStyles.title)
            .setOrigin(0.5);

        this.add.text(width / 2, height * 0.3, 'Choose an Upgrade', FontStyles.subtitle)
            .setOrigin(0.5);

        const availableUpgrades = this.getAvailableUpgrades();
        const optionsToShow = this.selectRandomUpgrades(availableUpgrades, 3);
        
        optionsToShow.forEach((option, index) => {
            const yPos = height * 0.45 + index * 100;
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0x111111, 0.9);
            cardBg.lineStyle(2, 0xeeeeee, 1);
            cardBg.fillRoundedRect(width / 2 - 200, yPos - 40, 400, 80, 10);
            cardBg.strokeRoundedRect(width / 2 - 200, yPos - 40, 400, 80, 10);
            
            const title = this.add.text(width / 2, yPos - 15, option.title, { ...FontStyles.subtitle, fontSize: '20px' }).setOrigin(0.5);
            const description = this.add.text(width / 2, yPos + 15, option.description, { ...FontStyles.body, fontSize: '16px', wordWrap: { width: 380 } }).setOrigin(0.5);

            const cardContainer = this.add.container(0, 0, [cardBg, title, description]);
            cardContainer.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 200, yPos - 40, 400, 80), Phaser.Geom.Rectangle.Contains);
            cardContainer.on('pointerdown', () => {
                option.apply();
                this.closeScene();
            });
            cardContainer.on('pointerover', () => cardBg.lineStyle(3, 0xFFD700, 1).strokeRoundedRect(width / 2 - 200, yPos - 40, 400, 80, 10));
            cardContainer.on('pointerout', () => cardBg.lineStyle(2, 0xeeeeee, 1).strokeRoundedRect(width / 2 - 200, yPos - 40, 400, 80, 10));
        });
    }

    closeScene() {
        this.gameScene.physics.resume();
        this.gameScene.tweens.resumeAll();
        this.scene.stop();
    }

    getAvailableUpgrades() {
        const player = this.player;
        const weapons = player.weapons;
        let upgrades = [];

        // Player stat upgrades
        upgrades.push({
            title: 'Max Health +20',
            description: 'Increases your maximum health by 20.',
            apply: () => { player.maxHealth += 20; player.heal(20); }
        });
        upgrades.push({
            title: 'Movement Speed +5%',
            description: 'Increases your base movement speed.',
            apply: () => { player.stats.movement *= 1.05; player.speed = 180 * player.stats.movement; }
        });
        upgrades.push({
            title: 'Luck +10%',
            description: 'Slightly increases your chances for good outcomes.',
            apply: () => { player.stats.luck *= 1.1; }
        });
         upgrades.push({
            title: 'Haste +7%',
            description: 'Reduces weapon cooldowns.',
            apply: () => { player.stats.haste *= 1.07; player.weapons.forEach(w => w.updateConfig()); }
        });
        upgrades.push({
            title: 'Strength +10%',
            description: 'Increases base damage for all weapons.',
            apply: () => { player.stats.strength *= 1.1; player.weapons.forEach(w => w.updateConfig()); }
        });


        // Weapon-specific upgrades
        weapons.forEach(weapon => {
            upgrades.push({
                title: `Upgrade ${weapon.constructor.name}`,
                description: `Levels up your ${weapon.constructor.name}, improving its stats.`,
                apply: () => weapon.upgrade()
            });
        });

        return upgrades;
    }

    selectRandomUpgrades(upgrades, count) {
        Phaser.Utils.Array.Shuffle(upgrades);
        return upgrades.slice(0, count);
    }
}