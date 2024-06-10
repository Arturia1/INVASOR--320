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
let boss;
let bullets;
let bulletboss;
let background;
let bosshealth = 10;
let score = 0;
let scoreText;
let bgMusic;
let shootSound;
let gameoversong;
let asteroid_big;
let asteroid_small;
let angle = 0;
let distance = 100;
let isBossAlive = true;
let isBossInvulnerable = false;
let bossTween; // Variável para armazenar o tweener do chefe
let bossHealthBar; // Variável para armazenar a barra de vida do chefe

// Definindo a velocidade do jogador
const PLAYER_SPEED = 200;
const PLAYER_ROTATION_SPEED = 350;
let fireAngle = 270; // Ângulo inicial do tiro

function restartGame() {
    // Reinicia o jogo chamando a função preload novamente
    this.scene.restart();

    // Reseta a pontuação
    boss.disableBody(true, true);
    bosshealth = 10;
    score = 0;
    scoreText.setText('Score: 0');
    fireAngle = -90;
    isBossAlive = true; // Redefina isBossAlive como true
}

function goToMenu() {
    // Redireciona para a tela do menu
    window.location.href = 'Menu.html';
}

function preload() {
    this.load.image('ship', 'assets/ship3.png');
    this.load.image('boss', 'assets/boss.png');
    this.load.image('bossinv', 'assets/bossinv.png');
    this.load.image('bullet', 'assets/bullet1.png');
    this.load.image('BG', 'assets/bckboss.png');
    this.load.image('asteroid_big', 'assets/asteroid_big.png');
    this.load.image('asteroid_small', 'assets/asteroid_small.png');
    this.load.spritesheet('explosion', 'assets/explosionimg.png', { frameWidth: 32, frameHeight: 16, endFrame: 4});
    this.load.image('bulletboss', 'assets/bulletboss.png');
    this.load.audio('explosion_alien', 'assets/audio/explosion.mp3');
    this.load.audio('backgroundMusic', 'assets/audio/bgm.mp3');
    this.load.audio('shoot_sound', 'assets/audio/arcade-beep.mp3');
    this.load.audio('gameoversong', 'assets/audio/gameover.mp3');
}

function create() {
    background = this.add.image(0, 0, 'BG').setOrigin(0);
    background.setScale(800 / background.width, 600 / background.height);
    player = this.physics.add.sprite(400, 500, 'ship').setAngle(90);

    player.body.setSize(player.width * 0.5, player.height * 0.5);

    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    player.angle = -90;
    this.input.keyboard.on('keydown-SPACE', fireBullet, this);

    this.beamSound = this.sound.add("shoot_sound");

    boss = this.physics.add.sprite(0, 10, 'boss').setAngle(90);
    boss.body.setSize(boss.width * 0.8, boss.height * 1);
    boss.angle = -90;
    boss.health = bosshealth;  // Add a custom health property to the boss object

    bossTween = this.tweens.add({
        targets: boss,
        x: 800,
        duration: 3000,
        ease: 'Linear',
        yoyo: true,
        repeat: -1
    });

    this.bossFireEvent = this.time.addEvent({
        delay: 1000, // Intervalo de 1,5 segundos
        callback: bossFire,
        callbackScope: this,
        loop: true, // Loop infinito
        condition: () => isBossAlive // Adicione esta linha
    });

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
        frameRate: 30,
        repeat: 0,
        hideOnComplete: true
    });

    this.bossinvEvent = this.time.delayedCall(1500, toggleBossInvulnerability, [], this);

    bullets = this.physics.add.group();
    bulletboss = this.physics.add.group();

    // Adicionando colisão entre os objetos
    this.physics.add.overlap(boss, bullets, checkOverLap, null, this);
    this.physics.add.collider(player, boss, playerHitBoss, null, this);
    this.physics.add.overlap(player, bulletboss, bulletHitPlayer, null, this);

    this.explosionSound = this.sound.add("explosion_alien");

    scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff' });

    this.input.keyboard.on('keydown-ESC', goToMenu, this);

    // Create boss health bar
    bossHealthBar = createBossHealthBar.call(this);
}

function update() {
    // Verifica o movimento horizontal

    // Debugging
    if (cursors.left.isDown) {
        player.setAngularVelocity(-PLAYER_ROTATION_SPEED);
        // Atualiza o ângulo do tiro quando o jogador gira para a esquerda
        fireAngle -= 5; // Ajuste o valor conforme necessário para a rotação desejada
    } else if (cursors.right.isDown) {
        player.setAngularVelocity(PLAYER_ROTATION_SPEED);
        // Atualiza o ângulo do tiro quando o jogador gira para a direita
        fireAngle += 5; // Ajuste o valor conforme necessário para a rotação desejada
    } else {
        player.setAngularVelocity(0);
    }

    // Movimento constante na direção do ângulo atual do jogador
    if (cursors.up.isDown) {
        // Define a velocidade na direção do ângulo atual do jogador
        player.setVelocityX(Math.cos(player.rotation) * PLAYER_SPEED);
        player.setVelocityY(Math.sin(player.rotation) * PLAYER_SPEED);

        // Atualiza o ângulo do tiro para corresponder ao ângulo do jogador
        fireAngle = player.angle;
    } else if (cursors.down.isDown) {
        // Define a velocidade inversa na direção oposta do ângulo atual do jogador
        player.setVelocityX(-Math.cos(player.rotation) * PLAYER_SPEED);
        player.setVelocityY(-Math.sin(player.rotation) * PLAYER_SPEED);
    } else {
        // Define a velocidade como zero quando não houver entrada de movimento
        player.setVelocity(0);
    }

    // Ajusta o ângulo do tiro para garantir que esteja dentro do intervalo de 0 a 360
    fireAngle = Phaser.Math.Wrap(fireAngle, 0, 360);
}

function fireBullet() {
    // Calculate the offset position where the bullet should be created
    let offsetX = Math.cos(Phaser.Math.DegToRad(player.angle)) * (player.width / 2);
    let offsetY = Math.sin(Phaser.Math.DegToRad(player.angle)) * (player.height / 2);

    // Create the bullet at the offset position
    let bullet = bullets.create(player.x + offsetX, player.y + offsetY, 'bullet');

    bullet.angle = player.angle;

    // Set the bullet's velocity based on the player's angle
    bullet.setVelocityX(Math.cos(Phaser.Math.DegToRad(player.angle)) * 300);
    bullet.setVelocityY(Math.sin(Phaser.Math.DegToRad(player.angle)) * 300);

    this.beamSound.play();
}

function endGame() {
    bossTween.stop(); // Para a animação do chefe
    boss.removeAllListeners(); // Remove todos os ouvintes do chefe
    bulletboss.clear(true, true); // Limpa todas as balas disparadas pelo chefe
    isBossAlive = false; // Defina isBossAlive como false
    this.bossFireEvent.remove(); // Remova o evento bossFireEvent
    this.bossinvEvent.remove();
}

function toggleBossInvulnerability() {
    if (boss) { // Verifica se boss não é undefined
        isBossInvulnerable = !isBossInvulnerable;
        if (isBossInvulnerable) {
            boss.setTexture('bossinv');
            this.time.delayedCall(1000, toggleBossInvulnerability, [], this);
        } else {
            boss.setTexture('boss');
            this.time.delayedCall(2000, toggleBossInvulnerability, [], this);
        }
    }
}

function checkOverLap(boss, bullet) {
    bullet.disableBody(true, true);
    
    if (isBossInvulnerable) {
        if (bosshealth < 10) {
            bosshealth += 1;
        }
        // Atualiza a barra de vida do chefe
        updateBossHealthBar(bosshealth);
    }

    if (!isBossInvulnerable) {
        let explosion = this.add.sprite(bullet.x, bullet.y, 'explosion');
        explosion.anims.play('explode');
        explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        explosion.destroy();
        this.explosionSound.play();})
        // Diminui a saúde do chefe em 10%
        bosshealth -= 1;
        
            if (bosshealth < 6) {
            // Dobra a velocidade do tween do chefe
            bossTween.timeScale = 2;

            // Altera o intervalo de disparo do chefe para 0.75 segundos
            this.bossFireEvent.delay = 750;
        }

        // Atualiza a barra de vida do chefe
        updateBossHealthBar(bosshealth);

    }

    
    if (bosshealth <= 0) { // Verifica se a saúde do chefe é menor ou igual a zero
        endGame.call(this);
        boss.disableBody(true, true);

        score += 1000;
        scoreText.setText('Score: ' + score);

        displayVictoryMessage.call(this);
        this.physics.pause();
        this.input.keyboard.once('keydown-R', restartGame, this);
    }
}



function bossFire() {
    // Calcula o ângulo entre o boss e o jogador
    let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);

    // Cria um projétil na posição do boss
    let bullet2 = bulletboss.create(boss.x, boss.y+80, 'bulletboss');

    // Define a velocidade do projétil em direção ao jogador
    bullet2.setVelocityX(Math.cos(angleToPlayer) * 300);
    bullet2.setVelocityY(Math.sin(angleToPlayer) * 300);
}

function bulletHitPlayer(player, bullet2) {
    endGame.call(this);
    let explosion2 = this.add.sprite(player.x, player.y, 'explosion');
    explosion2.anims.play('explode');
    explosion2.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    explosion2.destroy();
    this.explosionSound.play();
    player.disableBody(true, true)})
    this.physics.pause();
    
    
    
    displayGameOverMessage.call(this);
    this.input.keyboard.once('keydown-R', restartGame, this);
}

function playerHitBoss(player, boss) {
    // Pausa o jogo
    endGame.call(this)
    this.physics.pause();
    
    // Exibe a mensagem de game over
    displayGameOverMessage.call(this);

    // Adiciona um evento de teclado para reiniciar o jogo
    this.input.keyboard.once('keydown-R', restartGame, this);
}

function displayVictoryMessage() {
    // Crie um texto para exibir a mensagem de vitória
    let gameoverText = this.add.text(400, 300, 'Vitória!', { fontSize: '64px', fill: '#fff' });
    let gameoverauxText = this.add.text(400, 340, 'Pressione R para reiniciar!', { fontSize: '15px', fill: '#fff' });
    gameoverText.setOrigin(0.5);
    gameoverauxText.setOrigin(0.5);
}

function displayGameOverMessage() {
    // Crie um texto para exibir a mensagem de vitória
    let gameoverText = this.add.text(400, 300, 'Game over!', { fontSize: '64px', fill: '#fff' });
    let gameoverauxText = this.add.text(400, 340, 'Pressione R para reiniciar!', { fontSize: '15px', fill: '#fff' });
    gameoverText.setOrigin(0.5);
    gameoverauxText.setOrigin(0.5);
}

function createBossHealthBar() {
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = config.width - healthBarWidth - 10;
    const healthBarY = 10;
    healthBar = this.add.graphics();
    const healthBarBg = this.add.graphics();
    
    healthBarBg.fillStyle(0x000000, 0.5);
    healthBarBg.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    healthBar.fillStyle(0x00ff00, 1);
    healthBar.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    return {
        bg: healthBarBg,
        bar: healthBar
    };
}

function updateBossHealthBar(health) {
    const healthBarWidth = 200;
    const healthBarX = config.width - healthBarWidth - 10;
    const healthBarY = 10;

    bossHealthBar.bar.clear();
    bossHealthBar.bar.fillStyle(0x00ff00, 1);
    bossHealthBar.bar.fillRect(healthBarX, healthBarY, (health / 10) * healthBarWidth, 20);
}