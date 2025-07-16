import { WeaponTypes } from './weaponTypes.js';

export const PickupTypes = Object.freeze({
  HEALTH: {
    id: 'health',
    texture: 'healthPickup',
    scale: 0.08,
    isWeapon: false,
    apply: (gameScene) => {
      const healAmount = 25;
      gameScene.gameState.playerHealth = Math.min(gameScene.gameState.maxHealth, gameScene.gameState.playerHealth + healAmount);
      gameScene.updateHUD();
    }
  },
  TICKET: {
    id: 'ticket',
    texture: 'ticketPickup',
    scale: 0.08,
    isWeapon: false,
    apply: (gameScene) => {
      const ticketAmount = Phaser.Math.Between(1, 5);
      gameScene.gameState.tickets += ticketAmount;
      gameScene.updateHUD();
    }
  },
  WATER_BALLOON: {
    id: WeaponTypes.WATER_BALLOON.id,
    texture: WeaponTypes.WATER_BALLOON.id,
    scale: 0.05,
    isWeapon: true,
    apply: (gameScene, pickupId) => {
      gameScene.weaponManager.upgradeWeapon(pickupId);
    }
  }
});
export const getPickupConfig = (pickupId) => {
    // Check hardcoded types first
    const staticPickup = Object.values(PickupTypes).find(p => p.id === pickupId);
    if (staticPickup) {
        return staticPickup;
    }
    // Then, check if it's a weapon not explicitly listed
    const weaponData = Object.values(WeaponTypes).find(w => w.id === pickupId);
    if (weaponData) {
        return {
            id: weaponData.id,
            texture: weaponData.id,
            scale: 0.05,
            isWeapon: true,
            apply: (gameScene, pId) => {
                gameScene.weaponManager.upgradeWeapon(pId);
            }
        };
    }
    return null;
};