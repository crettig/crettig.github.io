import Phaser from 'phaser';
import { CasinoFloorTypes } from './casinoTileTypes.js';
export class Player {
  constructor(scene, x, y, characterData) {
    this.scene = scene;
    this.characterKey = characterData.name;
    this.levelGenerator = scene.levelGenerator; // Store reference to level generator
    this.sprite = scene.physics.add.sprite(x, y, this.characterKey);
    this.sprite.setDepth(10); // Ensure player is rendered above the ground layer
    this.sprite.setScale(0.5);
    // Set hitbox width to match tile size for better corridor navigation
    const newWidth = this.levelGenerator.config.tileSize;
    const newHeight = this.sprite.height * 0.75; // Keep height proportional
    this.sprite.body.setSize(newWidth, newHeight);
    
    // Recalculate offset to keep the new hitbox centered
    const offsetX = (this.sprite.width - newWidth) / 2;
    const offsetY = (this.sprite.height - newHeight) / 2;
    this.sprite.body.setOffset(offsetX, offsetY);
    // Player should now collide with the static world bounds
    this.sprite.setCollideWorldBounds(true);
    this.speed = characterData.speed;
    this.aimAngle = 0;
    
    // Add glow effect
    this.sprite.setTint(0xffeeaa);
    // Sound effects
    this.walkSound = this.scene.sound.add('walk_grass', { loop: true, volume: 0.3 });
  }
  update(keys, mobileControls) {
    let velocityX = 0;
    let velocityY = 0;
    if (mobileControls && mobileControls.isTouchDevice) {
      // Use joystick for movement
      const moveVector = mobileControls.moveVector;
      velocityX = moveVector.x * this.speed;
      velocityY = moveVector.y * this.speed;
    } else {
      // Use keyboard for movement
      if (keys.A.isDown) velocityX = -this.speed;
      if (keys.D.isDown) velocityX = this.speed;
      if (keys.W.isDown) velocityY = -this.speed;
      if (keys.S.isDown) velocityY = this.speed;
    }
    // Diagonal movement normalization
    if (velocityX !== 0 && velocityY !== 0 && !(mobileControls && mobileControls.isTouchDevice)) {
      // Normalize only for keyboard, joystick vector is already normalized
      velocityX *= 0.707;
      velocityY *= 0.707;
    }
    this.sprite.setVelocity(velocityX, velocityY);
    // Player animation based on velocity
    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
        if (Math.abs(velocityY) > Math.abs(velocityX)) {
            if (velocityY < 0) this.sprite.anims.play(this.characterKey + '_walkUp', true);
            else this.sprite.anims.play(this.characterKey + '_walkDown', true);
        } else {
            if (velocityX < 0) this.sprite.anims.play(this.characterKey + '_walkLeft', true);
            else this.sprite.anims.play(this.characterKey + '_walkRight', true);
        }
    } else {
        this.sprite.anims.stop();
        this.sprite.anims.stop();
        this.sprite.setFrame(9); // Idle frame
    }
    this.handleFootstepSounds();
  }
  handleFootstepSounds() {
    const isMoving = this.sprite.body.velocity.length() > 0.1;
    
    // Only check for tile type if the level generator exists (i.e., not in DemoScene)
    if (this.levelGenerator && this.levelGenerator.groundLayer && this.levelGenerator.groundLayer.getTileAtWorldXY) {
      const tile = this.levelGenerator.groundLayer.getTileAtWorldXY(this.sprite.x, this.sprite.y);
      // We'll check for any carpet or wood floors to play footstep sounds
      const isOnCarpet = tile && tile.tileset && (
        CasinoFloorTypes.BROWN_CARPET.indices.includes(tile.index - tile.tileset.firstgid) ||
        CasinoFloorTypes.WOOD_PANEL.indices.includes(tile.index - tile.tileset.firstgid)
      );
      const shouldPlaySound = isMoving && isOnCarpet;
      if (shouldPlaySound && !this.walkSound.isPlaying) {
        this.walkSound.play();
      } else if (!shouldPlaySound && this.walkSound.isPlaying) {
        this.walkSound.stop();
      }
    } else if (this.walkSound.isPlaying) {
        // If we are in a scene without a level generator, make sure sounds are stopped.
        this.walkSound.stop();
    }
  }
  updateAim(pointer) {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.aimAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      worldPoint.x, worldPoint.y
    );
  }
}