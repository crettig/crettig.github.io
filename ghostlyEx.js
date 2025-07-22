import Phaser from 'phaser';
export class GhostlyEx {
    constructor(scene, x, y, enemiesGroup, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemiesGroup;
        this.duration = 10000; // 10 seconds
        this.speed = 150;
        this.damage = 10;
        this.attackRange = 40;
        this.attackCooldown = 1000;
        this.lastAttackTime = 0;
        this.target = null;
        this.isDead = false;
        this.isGhostlyEx = true;
        this.sprite = this.scene.physics.add.sprite(x, y, 'BottleOfRegretGhostlyEx');
        this.sprite.setPipeline('Light2D');
        this.sprite.setDisplaySize(48, 48);
        this.sprite.setAlpha(0.7);
        this.sprite.setTint(0xADD8E6); // Light blue, ghostly tint
        this.sprite.setBlendMode(Phaser.BlendModes.ADD);
        this.sprite.body.setCircle(24);
        this.sprite.body.setAllowGravity(false);
        this.sprite.owner = this;

        // Fade in
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.7,
            duration: 500
        });

        // Self-destruct timer
        this.scene.time.delayedCall(this.duration, this.disappear, [], this);
    }

    update(time, delta) {
        if (this.isDead || !this.sprite.active) return;
        
        if (!this.target || !this.target.active || this.target.enemyInstance.isDead) {
            this.findTarget();
        }

        if (this.target) {
            const distanceToTarget = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.target.x, this.target.y);

            if (distanceToTarget > this.attackRange) {
                this.scene.physics.moveToObject(this.sprite, this.target, this.speed);
                const vel = this.sprite.body.velocity;
                if (Math.abs(vel.x) > Math.abs(vel.y)) {
                    this.sprite.anims.play(vel.x > 0 ? 'BottleOfRegretGhostlyEx-walk-right' : 'BottleOfRegretGhostlyEx-walk-left', true);
                } else {
                    this.sprite.anims.play(vel.y > 0 ? 'BottleOfRegretGhostlyEx-walk-down' : 'BottleOfRegretGhostlyEx-walk-up', true);
                }
            } else {
                this.sprite.setVelocity(0, 0);
                this.sprite.anims.stop();
                if (time > this.lastAttackTime + this.attackCooldown) {
                    this.attack();
                    this.lastAttackTime = time;
                }
            }
        }
    }

    findTarget() {
        let closestEnemy = null;
        let minDistance = Infinity;

        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.enemyInstance && !enemy.enemyInstance.isDead) {
                const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.x, enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });
        this.target = closestEnemy;
    }

    attack() {
        if (this.target && this.target.enemyInstance) {
            // Psychic damage doesn't apply knockback and is attributed to the Ex
            this.target.enemyInstance.takeDamage(this.damage, 0, this);
        }
    }

    disappear() {
        this.isDead = true;
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }
}