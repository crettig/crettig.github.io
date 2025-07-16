

import Phaser from 'phaser';
import { WeaponTypes } from './weaponTypes.js';

export class WeaponManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = this.scene.physics.add.group({
            defaultKey: 'bottleOfRegret', // A default texture
            maxSize: 50,
            runChildUpdate: true
        });

        // Initialize weapon data from types
        this.weapons = {};
        this.weaponLevels = {}; // Track levels separately
        this.baseWeapons = {}; // Store original stats
        Object.values(WeaponTypes).forEach(type => {
            this.baseWeapons[type.id] = { ...type }; // Store base stats
            this.weapons[type.id] = { ...type }; // Make a mutable copy for current stats
            this.weaponLevels[type.id] = 0; // Start at level 0 (un-upgraded)
        });

        this.weaponOrder = Object.keys(this.weapons);
        this.currentWeaponIndex = 0;
    }

    fireWeapon(player, pointer) {
        const weapon = this.getCurrentWeaponData();
        if (!weapon || (this.scene.time.now < weapon.lastFired + weapon.cooldown)) {
            return;
        }
        if (weapon.type === 'melee') {
            this.fireMeleeWeapon(player, pointer, weapon);
        } else {
            this.fireProjectileWeapon(player, pointer, weapon);
        }
    }
    fireProjectileWeapon(player, pointer, weapon) {
        const projectile = this.projectiles.get(player.sprite.x, player.sprite.y, weapon.texture);
        if (!projectile) return;
        projectile.setActive(true);
        projectile.setVisible(true);
        projectile.setDepth(9);
        projectile.setScale(weapon.scale);
        projectile.setTint(weapon.tint || 0xffffff);
        projectile.setData('damage', weapon.damage);
        projectile.setData('pierce', weapon.pierce);
        projectile.setData('hitEnemies', []);
        projectile.setData('weaponId', weapon.id); // Tag projectile with its weapon type
        
        const angle = Phaser.Math.Angle.Between(player.sprite.x, player.sprite.y, pointer.worldX, pointer.worldY);
        
        this.scene.physics.velocityFromRotation(angle, weapon.projectileSpeed, projectile.body.velocity);
        
        // Add arc for projectiles with gravity
        if (weapon.hasGravity) {
            projectile.body.setGravityY(800);
            projectile.body.velocity.y -= 350; // Initial upward velocity for the arc
        }
        
        projectile.body.velocity.add(player.sprite.body.velocity);
        
        projectile.rotation = angle + Math.PI / 2;
        projectile.setData('hasGravity', weapon.hasGravity || false);
        
        // Lifespan for non-gravity projectiles
        if (!weapon.hasGravity) {
            projectile.lifespan = weapon.range / weapon.projectileSpeed * 1000;
        }
        
        weapon.lastFired = this.scene.time.now;
    }
    fireMeleeWeapon(player, pointer, weapon) {
        // Offset the swing pivot in the direction of the aim
        const SWING_OFFSET = 20; // pixels
        let aimVector;
        let aimAngle;
        if (this.scene.mobileControls && this.scene.mobileControls.isTouchDevice && this.scene.mobileControls.aimVector.length() > 0) {
            // For mobile, use the normalized aim joystick vector
            aimVector = this.scene.mobileControls.aimVector.clone();
            aimAngle = aimVector.angle();
        } else {
            // For desktop, calculate vector from player to mouse pointer
            aimVector = new Phaser.Math.Vector2(pointer.worldX - player.sprite.x, pointer.worldY - player.sprite.y).normalize();
            aimAngle = aimVector.angle();
        }
        const swordX = player.sprite.x + aimVector.x * SWING_OFFSET;
        const swordY = player.sprite.y + aimVector.y * SWING_OFFSET;
        const sword = this.projectiles.get(swordX, swordY, weapon.texture);
        if (!sword) return;
        const arc = weapon.attackArc || Math.PI / 2; // Default to 90 degrees
        const startAngle = aimAngle - arc / 2;
        const endAngle = aimAngle + arc / 2;
        sword.setActive(true);
        sword.setVisible(true);
        sword.setDepth(player.sprite.depth + 1); // Render above player
        sword.setScale(weapon.scale);
        sword.setOrigin(0.5, 1); // Pivot around the hilt
        // Use a circular hitbox centered around the visual swing.
        // The origin is (0.5, 1), so the pivot is at the hilt.
        // The sword's origin (0.5, 1) means it pivots around its bottom-center point.
        // We want a circular hitbox centered on the visual part of the sword as it swings.
        const radius = sword.displayHeight * 0.5;
        const offsetX = (sword.width - radius * 2) * 0.5;
        const offsetY = -sword.displayHeight * 0.5;
        sword.body.setCircle(
            radius,
            offsetX,
            offsetY
        );
        sword.setData('damage', weapon.damage);
        sword.setData('pierce', weapon.pierce);
        sword.setData('hitEnemies', []);
        sword.setData('weaponId', weapon.id); // Tag projectile with its weapon type
        sword.rotation = startAngle;
        
        // Disable velocity, position is locked to player
        sword.body.setVelocity(0, 0);
        sword.meleeWeaponData = {
            isMelee: true,
            player: player.sprite,
            offset: new Phaser.Math.Vector2(aimVector.x * SWING_OFFSET, aimVector.y * SWING_OFFSET)
        };
        
        this.scene.tweens.add({
            targets: sword,
            rotation: { from: startAngle, to: endAngle },
            duration: weapon.attackDuration || 150,
            ease: 'Sine.easeInOut',
            // onUpdate is no longer needed as the circular hitbox does not need to rotate.
            onComplete: () => {
                sword.destroy();
            }
        });
        
        weapon.lastFired = this.scene.time.now;
    }

    handleProjectileCollision(projectile, enemySprite) {
        const weaponId = projectile.getData('weaponId');
        const weapon = this.weapons[weaponId];
        if (weapon && weapon.explosive) {
            this.explodeProjectile(projectile);
            return;
        }
        // The enemySprite from the collision IS the enemy object we need.
        const enemy = enemySprite;
        if (!enemy || !enemy.active) return;
        const hitEnemies = projectile.getData('hitEnemies');
        if (hitEnemies.includes(enemy.body.gameObject)) { // Compare with the actual gameObject
            return; // Already hit this enemy
        }
        const damage = projectile.getData('damage');
        const pierce = projectile.getData('pierce');
        
        const weaponLevel = this.weaponLevels[weaponId] + 1;
        this.applyOnHitEffects(enemy, weaponId, weaponLevel);
        const killed = this.scene.enemyManager.damageEnemy(enemy, damage, weaponId);
        
        if (killed) {
            this.handleEnemyKill(enemy, weaponId);
        }
        hitEnemies.push(enemy.body.gameObject);
        projectile.setData('hitEnemies', hitEnemies);
        if (hitEnemies.length >= pierce) {
            this.destroyProjectile(projectile);
        }
    }
    handleEnemyKill(enemy, weaponId) {
        const weapon = this.weapons[weaponId];
        const weaponLevel = this.weaponLevels[weaponId] + 1;
        if (!weapon || !weapon.upgrades) return;
        // Tier 4: Liquid Courage (unlocked at weapon level 7)
        const liquidCourageUpgrade = weapon.upgrades.find(u => u.special === 'liquidCourage');
        if (liquidCourageUpgrade && weaponLevel >= 7) {
            this.scene.healPlayer(10); // Heal player for 10 HP
        }
        // Tier 3: Vicious Cycle (unlocked at weapon level 6)
        const viciousCycleUpgrade = weapon.upgrades.find(u => u.special === 'viciousCycle');
        if (viciousCycleUpgrade && weaponLevel >= 6) {
            const isInsideCloud = this.scene.enemyManager.isEnemyInGasCloud(enemy);
            if (isInsideCloud && Math.random() < 0.50) { // 50% chance
                this.scene.enemyManager.spawnGasCloud(enemy.x, enemy.y);
                return; // Vicious Cycle procs, so we don't also check for Shattercloud
            }
        }
        // Tier 2: Shattercloud (unlocked at weapon level 4)
        const shatterCloudUpgrade = weapon.upgrades.find(u => u.special === 'shattercloud');
        if (shatterCloudUpgrade && weaponLevel >= 4) {
            if (Math.random() < 0.20) { // 20% chance
                this.scene.enemyManager.spawnGasCloud(enemy.x, enemy.y);
            }
        }
    }
    applyOnHitEffects(enemy, weaponId, weaponLevel) {
        const weapon = this.weapons[weaponId];
        if (!weapon || !weapon.upgrades) return;
        
        // Tier 1: Glass Fracture (Bottle of Regret, Level 2+)
        const glassFractureUpgrade = weapon.upgrades.find(u => u.special === 'glassFracture');
        if (glassFractureUpgrade && weaponLevel >= 2) {
            let hitCount = enemy.getData('bottleHits') || 0;
            hitCount++;
            
            if (hitCount >= 3) {
                this.scene.enemyManager.applyArmorDebuff(enemy, 10, 5000); // Reduce armor by 10 for 5 seconds
                hitCount = 0; // Reset counter
            }
            enemy.setData('bottleHits', hitCount);
        }
    }
    handleProjectileWallCollision(projectile, wall) {
        // You can add effects here like sparks or sound
        const weaponId = projectile.getData('weaponId');
        const weapon = this.weapons[weaponId];
        if (weapon && weapon.explosive) {
            this.explodeProjectile(projectile);
        } else {
            this.destroyProjectile(projectile);
        }
    }
    explodeProjectile(projectile) {
        const weaponId = projectile.getData('weaponId');
        const weapon = this.weapons[weaponId];
        if (!weapon) {
            projectile.destroy();
            return;
        }
        const x = projectile.x;
        const y = projectile.y;
        const radius = weapon.range;
        const damage = weapon.damage;
        // Play sound effect
        this.scene.sound.play('waterBalloonSplat', { volume: 0.6 });
        // Visual effect for explosion with particles
        const particles = this.scene.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: { min: 200, max: 500 },
            quantity: 50,
            blendMode: 'ADD',
            tint: 0x66ccff,
            emitting: false
        });
        particles.explode(50);
        this.scene.time.delayedCall(1000, () => {
            if (particles) {
                particles.destroy();
            }
        });
        
        // Damage enemies in radius
        this.scene.enemyManager.enemies.children.each(enemy => {
            if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
                const killed = this.scene.enemyManager.damageEnemy(enemy, damage, weaponId);
                if (killed) {
                    this.handleEnemyKill(enemy, weaponId);
                }
            }
        });
        
        projectile.destroy();
    }
    update() {
        // Custom update logic for projectiles (like lifespan)
        this.projectiles.children.each(p => {
            if (p.active) {
                // The melee weapon's position is handled by its tween and does not need manual updates.
                // Handle projectile lifespan for non-gravity projectiles
                if (!p.getData('hasGravity') && !p.meleeWeaponData) {
                    p.lifespan -= this.scene.sys.game.loop.delta;
                    if (p.lifespan <= 0) {
                        this.destroyProjectile(p);
                    }
                } else if (p.getData('hasGravity')) {
                    // For gravity projectiles, update rotation to match trajectory
                    p.rotation = p.body.velocity.angle() + Math.PI / 2;
                }
            }
        });
    }

    getCurrentWeaponData() {
        const weaponId = this.weaponOrder[this.currentWeaponIndex];
        return this.weapons[weaponId];
    }
    
    upgradeWeapon(weaponId) {
        const weaponToUpgrade = this.weapons[weaponId];
        const baseWeapon = this.baseWeapons[weaponId];
        const currentLevel = this.weaponLevels[weaponId];
        if (!weaponToUpgrade || !baseWeapon.upgrades || currentLevel >= baseWeapon.upgrades.length) {
            console.log(`${weaponToUpgrade.name} is at max level or has no upgrade path.`);
            return;
        }
        const upgradeData = baseWeapon.upgrades[currentLevel];
        // Apply all stat changes from the upgrade data
        for (const stat in upgradeData) {
            if (weaponToUpgrade.hasOwnProperty(stat)) {
                weaponToUpgrade[stat] += upgradeData[stat];
            }
        }
        this.weaponLevels[weaponId]++;
        console.log(`${weaponToUpgrade.name} upgraded to level ${this.weaponLevels[weaponId]}`);
        console.log(`New stats:`, weaponToUpgrade);
    }

    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weaponOrder.length;
    }
    // This function will be needed when loading a saved game
    // to correctly apply all upgrades up to the saved level.
    rebuildWeaponStats(weaponId, level) {
        if (!this.weapons[weaponId] || !this.baseWeapons[weaponId]) return;
        // Reset to base stats
        this.weapons[weaponId] = { ...this.baseWeapons[weaponId] };
        this.weaponLevels[weaponId] = 0;
        // Apply all upgrades sequentially up to the target level
        for (let i = 0; i < level; i++) {
            this.upgradeWeapon(weaponId);
        }
    }
    destroyProjectile(projectile) {
        if (!projectile || !projectile.active) return;
        const weaponId = projectile.getData('weaponId');
        const weapon = this.weapons[weaponId];
        if (weapon && weapon.fragmentsOnImpact) {
            this.spawnFragments(projectile.x, projectile.y, weapon);
        }
        projectile.destroy();
    }
    spawnFragments(x, y, weapon) {
        const count = weapon.fragmentCount || 6;
        const damage = weapon.fragmentDamage || 10;
        const speed = weapon.fragmentSpeed || 200;
        const range = weapon.fragmentRange || 100;
        const scale = weapon.fragmentScale || 0.04;
        const texture = weapon.fragmentTexture || weapon.texture;
        const pierce = weapon.fragmentPierce || 1;
        for (let i = 0; i < count; i++) {
            const fragment = this.projectiles.get(x, y, texture);
            if (!fragment) continue;
            fragment.setActive(true);
            fragment.setVisible(true);
            fragment.setDepth(9);
            fragment.setScale(scale);
            fragment.setData('damage', damage);
            fragment.setData('pierce', pierce);
            fragment.setData('hitEnemies', []);
            fragment.setData('weaponId', null); // Fragments don't create more fragments
            
            const angle = Math.random() * 2 * Math.PI;
            this.scene.physics.velocityFromRotation(angle, speed, fragment.body.velocity);
            fragment.rotation = angle + Math.PI / 2;
            fragment.lifespan = range / speed * 1000;
        }
    }
}