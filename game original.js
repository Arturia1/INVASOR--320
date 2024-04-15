const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player;
let cursors;
let aliens;
let bullets;

function preload() {
    this.load.image('ship', 'assets/ship2.png');
    this.load.image('alien', 'assets/alien.png');
    this.load.image('bullet', 'assets/bullet1.png');
}

function create() {
    player = this.physics.add.sprite(400, 500, 'ship');
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', fireBullet, this);

    aliens = this.physics.add.group({
        key: 'alien',
        repeat: 5,
        setXY: { x: 100, y: 50, stepX: 100 }
    });

    bullets = this.physics.add.group();
    
    this.physics.add.collider(bullets, aliens, bulletHitAlien, null, this);
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }
}

function fireBullet() {
    let bullet = bullets.create(player.x, player.y - 10, 'bullet');
    bullet.setVelocityY(-400);
}

function bulletHitAlien(bullet, alien) {
    bullet.destroy();
    alien.destroy();
}