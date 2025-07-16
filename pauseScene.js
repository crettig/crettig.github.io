import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const gameScene = this.scene.get('GameScene');

        // Semi-transparent background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6).setOrigin(0);

        // Pause Title
        this.add.text(this.cameras.main.width / 2, 150, 'PAUSED', {
            fontFamily: 'CarnivalFreakshow, "Courier New", monospace',
            fontSize: '84px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // --- Create a more organized layout ---
        const padding = 60;
        const columnWidth = (this.cameras.main.width - padding * 3) / 2;
        const leftColumnX = padding + columnWidth / 2;
        const rightColumnX = padding * 2 + columnWidth + columnWidth / 2;
        const contentY = 250;
        const sectionTitleStyle = {
            fontFamily: "'Courier New', monospace",
            fontSize: '28px', color: '#ffd700',
            align: 'center',
            stroke: '#000', strokeThickness: 2
        };
        const statTextStyle = {
            fontFamily: "'Courier New', monospace",
            fontSize: '20px', color: '#ffffff',
            align: 'left', lineSpacing: 8
        };
        // --- Player Stats Column ---
        this.add.text(leftColumnX, contentY, 'Player Stats', sectionTitleStyle).setOrigin(0.5, 0);
        const elapsedTime = Math.floor(gameScene.time.now / 1000) - gameScene.gameState.startTime;
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        const playerStats = [
            `Time: ${minutes}:${seconds}`,
            `Level: ${gameScene.gameState.playerLevel}`,
            `Health: ${gameScene.gameState.playerHealth} / ${gameScene.gameState.maxHealth}`,
            `Speed: ${gameScene.player.speed.toFixed(0)}`,
            `Luck: ${gameScene.gameState.luck}`
        ];
        this.add.text(leftColumnX, contentY + 50, playerStats, statTextStyle).setOrigin(0.5, 0);
        // --- Weapon Stats Column ---
        this.add.text(rightColumnX, contentY, 'Weapon Stats', sectionTitleStyle).setOrigin(0.5, 0);
        const weaponManager = gameScene.weaponManager;
        const weaponStats = [];
        weaponManager.weaponOrder.forEach(weaponId => {
            const weapon = Object.values(weaponManager.weapons).find(w => w.id === weaponId);
            const level = weaponManager.weaponLevels[weaponId];
            weaponStats.push(
                `${weapon.name} (Lvl ${level})`,
                `  DMG: ${weapon.damage.toFixed(1)} | CD: ${(weapon.cooldown / 1000).toFixed(2)}s`
            );
        });
        this.add.text(rightColumnX, contentY + 50, weaponStats, {
            ...statTextStyle,
            fontSize: '18px'
        }).setOrigin(0.5, 0);


        // Resume Button
        const resumeButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 150, 'Resume', {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeButton.on('pointerdown', () => this.resumeGame());
        resumeButton.on('pointerover', () => resumeButton.setBackgroundColor('#ff6b6b'));
        resumeButton.on('pointerout', () => resumeButton.setBackgroundColor('#444444'));
        // Save Button
        const saveButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 220, 'Save Game', {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        saveButton.on('pointerdown', () => this.saveGame(saveButton));
        saveButton.on('pointerover', () => saveButton.setBackgroundColor('#74b9ff'));
        saveButton.on('pointerout', () => saveButton.setBackgroundColor('#444444'));
        const mainMenuButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 80, 'Main Menu', {
            fontFamily: "'Courier New', monospace",
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        mainMenuButton.on('pointerdown', () => {
            // Need to stop the game scene completely before going to main menu
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MainMenuScene');
        });
        mainMenuButton.on('pointerover', () => mainMenuButton.setBackgroundColor('#ff6b6b'));
        mainMenuButton.on('pointerout', () => mainMenuButton.setBackgroundColor('#444444'));
        // Listen for Escape key to resume as well
        this.input.keyboard.on('keydown-ESC', this.resumeGame, this);
    }
    
    resumeGame() {
        document.getElementById('game-hud').style.display = 'block';
        const gameScene = this.scene.get('GameScene');
        if (gameScene.mobileControls && gameScene.mobileControls.isTouchDevice) {
            document.getElementById('joystick-zones').style.display = 'block';
        }
        this.scene.stop();
        this.scene.resume('GameScene');
    }
    saveGame(button) {
        const gameScene = this.scene.get('GameScene');
        const saveData = {
            scene: 'GameScene', // In case we add more playable scenes later
            timestamp: new Date().toISOString(),
            player: {
                x: gameScene.player.sprite.x,
                y: gameScene.player.sprite.y,
                state: gameScene.gameState // This saves health, xp, level, etc.
            },
            weapons: {
                levels: gameScene.weaponManager.weaponLevels,
                data: gameScene.weaponManager.weapons, // Save the modified weapon stats
                currentWeaponIndex: gameScene.weaponManager.currentWeaponIndex
            },
            world: {
                seed: gameScene.levelGenerator.seed,
                size: this.sys.game.registry.get('worldSize')
            },
            settings: {
                playerCharacter: this.sys.game.registry.get('playerCharacter'),
                enemySpawning: this.sys.game.registry.get('enemySpawning'),
            }
        };
        localStorage.setItem('carnivalNightmareSave', JSON.stringify(saveData));
        // Visual feedback
        button.setText('Game Saved!');
        button.setBackgroundColor('#4caf50');
        this.time.delayedCall(2000, () => {
            button.setText('Save Game');
            button.setBackgroundColor('#444444');
        });
    }
}