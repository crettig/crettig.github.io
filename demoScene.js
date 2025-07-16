import Phaser from 'phaser';
import { Player } from './player.js';
import { Skins } from './characterSkins.js';
import { MobileControls } from './mobileControls.js';

export class DemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DemoScene' });
    }

    create() {
        // Since this scene is for debugging, we'll give it a distinct background
        this.cameras.main.setBackgroundColor('#333333');
        // Animations must be created before the player is
        this.createPlayerAnimations();
        // Add player
        const characterData = Skins.AHAB; // Use a default character
        this.player = new Player(this, 100, 100, characterData);
        // Setup input
        this.keys = this.input.keyboard.addKeys('W,S,A,D');
        this.mobileControls = new MobileControls(this);
        this.displayTileset();
        // Adjust camera to follow the player and zoom in
        const camera = this.cameras.main;
        camera.startFollow(this.player.sprite);
        camera.setZoom(2);
        // Add mouse wheel zoom controls
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomAmount = deltaY > 0 ? -0.1 : 0.1; // Scrolling down zooms out, up zooms in
            const newZoom = Phaser.Math.Clamp(camera.zoom + zoomAmount, 0.5, 10); // Clamp zoom
            camera.setZoom(newZoom);
        });
        // Add a back button
        const backButton = this.add.text(10, 10, '< Back to Menu', {
            fontFamily: "'Courier New', monospace",
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000'
        })
        .setPadding(10)
        .setScrollFactor(0) // Pinned to the camera
        .setInteractive({ useHandCursor: true });
        
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
    displayTileset() {
        const tilesetTexture = this.textures.get('world_tileset');
        if (!tilesetTexture || tilesetTexture.key === '__MISSING') {
            console.error("Tileset 'world_tileset' not found.");
            this.add.text(100, 200, "Error: Tileset 'world_tileset' not loaded.", { color: '#ff0000' }).setOrigin(0);
            return;
        }
        const tileWidth = 16;
        const tileHeight = 16;
        const tilesetWidthInTiles = tilesetTexture.source[0].width / tileWidth;
        const tilesetHeightInTiles = tilesetTexture.source[0].height / tileHeight;
        const map = this.make.tilemap({ tileWidth, tileHeight, width: tilesetWidthInTiles, height: tilesetHeightInTiles });
        const tiles = map.addTilesetImage('world_tileset', 'world_tileset', tileWidth, tileHeight, 0, 0);
        const layer = map.createBlankLayer('TileDisplay', tiles, 0, 0);
        
        // Let's make the tiles bigger for better visibility
        const displayScale = 4;
        layer.setScale(displayScale);
        let tileIndex = 0;
        for (let y = 0; y < tilesetHeightInTiles; y++) {
            for (let x = 0; x < tilesetWidthInTiles; x++) {
                layer.putTileAt(tileIndex, x, y);
                // Add the index number on top of the tile, adjusted for the new scale
                const scaledTileWidth = tileWidth * displayScale;
                const scaledTileHeight = tileHeight * displayScale;
                this.add.text(x * scaledTileWidth + (scaledTileWidth / 2), y * scaledTileHeight + (scaledTileHeight / 2), tileIndex.toString(), {
                    fontSize: '18px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5, 0.5);
                tileIndex++;
            }
        }
        // Set the world bounds to match the scaled size of the tile display
        const worldWidth = tilesetWidthInTiles * tileWidth * displayScale;
        const worldHeight = tilesetHeightInTiles * tileHeight * displayScale;
        // Display all three casino tilesets
        const startX = worldWidth + 200;
        let currentX = startX;
        let totalCasinoHeight = 0;
        const floor = this.displayCasinoTileset('casinofloor', 48, 16, 24, currentX, 0);
        currentX += floor.width + 50;
        totalCasinoHeight = Math.max(totalCasinoHeight, floor.height);
        const wall = this.displayCasinoTileset('casiowall', 48, 16, 15, currentX, 0);
        currentX += wall.width + 50;
        totalCasinoHeight = Math.max(totalCasinoHeight, wall.height);
        const objects = this.displayCasinoTileset('casinoobjects', 48, 16, 16, currentX, 0);
        currentX += objects.width;
        totalCasinoHeight = Math.max(totalCasinoHeight, objects.height);
        const totalWorldWidth = currentX;
        const totalWorldHeight = Math.max(worldHeight, totalCasinoHeight);
        this.physics.world.setBounds(0, 0, totalWorldWidth, totalWorldHeight, true, true, true, true);
    }
    displayCasinoTileset(textureKey, tileSize, tilesWide, tilesHigh, offsetX, offsetY) {
        const map = this.make.tilemap({
            tileWidth: tileSize,
            tileHeight: tileSize,
            width: tilesWide,
            height: tilesHigh
        });
        const tileset = map.addTilesetImage(textureKey, textureKey, tileSize, tileSize, 0, 0);
        const layer = map.createBlankLayer(textureKey + 'Layer', tileset, offsetX, offsetY);
        let tileIndex = 0;
        for (let y = 0; y < tilesHigh; y++) {
            for (let x = 0; x < tilesWide; x++) {
                layer.putTileAt(tileIndex, x, y);
                this.add.text(offsetX + x * tileSize + (tileSize / 2), offsetY + y * tileSize + (tileSize / 2), tileIndex.toString(), {
                    fontSize: '14px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5, 0.5);
                tileIndex++;
            }
        }
        return { width: map.widthInPixels, height: map.heightInPixels };
    }
    update() {
        this.player.update(this.keys, this.mobileControls);
        this.player.update(this.keys, this.mobileControls);
    }
    createPlayerAnimations() {
        // This is the same animation logic from the main GameScene
        Object.values(Skins).forEach(character => {
            const charKey = character.name;
            // Assumes a 4x4 (16-frame) spritesheet layout
            if (this.anims.exists(charKey + '_walkUp')) return; // Avoid re-creating anims
            this.anims.create({
                key: charKey + '_walkUp',
                frames: this.anims.generateFrameNumbers(charKey, { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: charKey + '_walkRight',
                frames: this.anims.generateFrameNumbers(charKey, { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: charKey + '_walkDown',
                frames: this.anims.generateFrameNumbers(charKey, { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: charKey + '_walkLeft',
                frames: this.anims.generateFrameNumbers(charKey, { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1,
            });
        });
    }
    shutdown() {
        if (this.mobileControls) {
            this.mobileControls.destroy();
        }
    }
}