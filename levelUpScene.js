import Phaser from 'phaser';
export class LevelUpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelUpScene' });
    }
    create() {
        const gameScene = this.scene.get('GameScene');
        const availableUpgrades = this.getAvailableUpgrades(gameScene);
        // Dark, semi-transparent background
        const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0);
        // Title
        this.add.text(this.cameras.main.width / 2, 150, 'LEVEL UP!', {
            fontFamily: "'Courier New', monospace",
            fontSize: '64px',
            color: '#74b9ff',
            align: 'center',
            stroke: '#fff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Choose 3 unique upgrades
        const chosenUpgrades = Phaser.Utils.Array.Shuffle(availableUpgrades).slice(0, 3);
        
        chosenUpgrades.forEach((upgrade, index) => {
            const yPos = 300 + index * 100;
            const button = this.add.text(this.cameras.main.width / 2, yPos, upgrade.text, {
                fontFamily: "'Courier New', monospace",
                fontSize: '32px',
                color: '#ffffff',
                backgroundColor: '#444444',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.on('pointerdown', () => {
                upgrade.apply(gameScene);
                gameScene.updateHUD(); // Ensure HUD reflects changes
                this.scene.stop();
                this.scene.resume('GameScene');
            });
            
            button.on('pointerover', () => button.setBackgroundColor('#ff6b6b'));
            button.on('pointerout', () => button.setBackgroundColor('#444444'));
        });
    }
    getAvailableUpgrades(gameScene) {
        const upgrades = [
            { id: 'hp_boost', text: 'Full Heal & +20 Max HP', apply: (scene) => {
                scene.gameState.maxHealth += 20;
                scene.gameState.playerHealth = scene.gameState.maxHealth;
            }},
            { id: 'speed_boost', text: '+15% Movement Speed', apply: (scene) => {
                scene.player.speed *= 1.15;
            }},
            { id: 'luck_boost', text: '+10 Luck', apply: (scene) => {
                scene.gameState.luck += 10;
            }}
        ];
        // Add upgrades for each weapon the player has
        const weaponManager = gameScene.weaponManager;
        weaponManager.weaponOrder.forEach(weaponId => {
            const weaponData = Object.values(weaponManager.weapons).find(w => w.id === weaponId);
            const level = weaponManager.weaponLevels[weaponId];
            upgrades.push({
                id: `upgrade_${weaponId}`,
                text: `Upgrade ${weaponData.name} (Lvl ${level + 1})`,
                apply: (scene) => {
                    scene.weaponManager.upgradeWeapon(weaponId);
                }
            });
        });
        return upgrades;
    }
}