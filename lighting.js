export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.torchLights = [];
  }
  createAmbientLighting() {
    this.scene.lights.setAmbientColor(0x999999);
  }
  addTorchLight(x, y) {
    const light = this.scene.lights.addLight(x, y, 150, 0xFFC864, 1.2);
    
    this.torchLights.push({
      light: light,
      flickerOffset: Math.random() * 1000
    });
  }
  update(time) {
    this.torchLights.forEach(torch => {
      const flicker = Math.sin((time + torch.flickerOffset) * 0.005) * 0.15 + 0.85;
      torch.light.setIntensity(1.2 * flicker);
    });
  }
}