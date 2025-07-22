export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
  }

  playMusic(key, config = { loop: true, volume: 0.3 }) {
    // Avoid restarting the same music
    if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
      return;
    }
    
    // Stop any currently playing music
    if (this.currentMusic && this.scene.sound.get(this.currentMusic.key)?.isPlaying) {
        this.scene.sound.stopByKey(this.currentMusic.key);
    }

    this.currentMusic = this.scene.sound.add(key, config);
    this.currentMusic.play();
  }

  playSound(key, config = {}) {
    this.scene.sound.play(key, config);
  }

  stopAllSounds() {
    this.scene.sound.stopAll();
    this.currentMusic = null;
  }
  
  pauseMusic() {
      if (this.currentMusic && this.currentMusic.isPlaying) {
          this.currentMusic.pause();
      }
  }
  
  resumeMusic() {
      if (this.currentMusic && this.currentMusic.isPaused) {
          this.currentMusic.resume();
      }
  }
}