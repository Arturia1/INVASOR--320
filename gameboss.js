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
let bossHealth = 5;
let bullets;
let bulletboss;
let background;
let score = 0;
let scoreText;
let bgMusic;
let shootSound;
let gameoversong;
let asteroid_big;
let asteroid_small;
let angle = 0;
let distance = 100;
let bossTween; // Variável para armazenar o tweener do chefe

// Definindo a velocidade do jogador
const PLAYER_SPEED = 200;
const PLAYER_ROTATION_SPEED = 350;
let fireAngle = 270; // Ângulo inicial do tiro

function restartGame() {
    // Reinicia o jogo chamando a função preload novamente
    this.scene.restart();
    
    // Reseta a pontuação
    score = 0;
    scoreText.setText('Score: 0');
    fireAngle = -90;
}

function goToMenu() {
    // Redireciona para a tela do menu
    window.location.href = 'Menu.html';
}

function preload() {
    this.load.image('ship', 'assets/ship2.png');
    this.load.image('boss', 'assets/boss.png');
    this.load.image('bullet', 'assets/bullet1.png');
    this.load.image('BG', 'assets/back2.png');
    this.load.image('asteroid_big', 'assets/asteroid_big.png');
    this.load.image('asteroid_small', 'assets/asteroid_small.png');
    this.load.image('bulletboss', 'assets/bulletboss.png');
    this.load.audio('backgroundMusic', 'assets/audio/bgm.mp3');
    this.load.audio('shootSound', 'assets/audio/arcade-beep.mp3');
    this.load.audio('gameoversong', 'assets/audio/gameover.mp3');
    
}

function create() {
    background = this.add.image(0, 0, 'BG').setOrigin(0);
    background.setScale(800 / background.width, 600 / background.height);

    player = this.physics.add.sprite(400, 500, 'ship').setAngle(-90);
    player.setCollideWorldBounds(true);
    
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', fireBullet, this);

    boss = this.physics.add.sprite(0, 50, 'boss').setAngle(90);
    bossTween = this.tweens.add({
        targets: boss,
        x: 800,
        duration: 3000,
        ease: 'Linear',
        yoyo: true,
        repeat: -1
    });

    this.time.addEvent({
        delay: 1500, // Intervalo de 1,5 segundos
        callback: bossFire,
        callbackScope: this,
        loop: true // Loop infinito
    });

    bullets = this.physics.add.group();
    bulletboss = this.physics.add.group();
    

    // Adicionando colisão entre os objetos
    this.physics.add.collider(bullets, boss, bulletHitBoss, null, this);
    this.physics.add.collider(player, boss, playerHitBoss, null, this);
    this.physics.add.collider(player, bulletboss, bulletHitPlayer, null, this);

    scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff' });

    this.input.keyboard.on('keydown-ESC', goToMenu, this);
}

function update() {
    // Verifica o movimento horizontal
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

    // Atualizações dos asteroides
    /*asteroid_big.angle += asteroid_big.body.angularVelocity;
    angle = 0.05;
    Phaser.Math.RotateAroundDistance(asteroid_small, asteroid_big.x, asteroid_big.y, angle, distance);*/
}


function fireBullet() {
    // Crie um ponto fixo em 90º com base na posição inicial do jogador
    let offsetX = Math.cos(Phaser.Math.DegToRad(player.angle + 90)) * 10; // Ajuste a distância do ponto fixo conforme necessário
    let offsetY = Math.sin(Phaser.Math.DegToRad(player.angle + 90)) * 10; // Ajuste a distância do ponto fixo conforme necessário

    // Crie o tiro no ponto fixo
    let bullet = bullets.create(player.x + offsetX, player.y + offsetY, 'bullet');

    // Defina a velocidade do tiro de acordo com o ângulo do ponto fixo
    bullet.setVelocityX(Math.cos(Phaser.Math.DegToRad(fireAngle)) * 300); 
    bullet.setVelocityY(Math.sin(Phaser.Math.DegToRad(fireAngle)) * 300); 
}


function bulletHitBoss(bullet, boss) {
    bullet.destroy();
    boss.destroy();

    score += 1000;
    scoreText.setText('Score: ' + score);

    displayVictoryMessage.call(this);
    this.physics.pause();
    this.input.keyboard.once('keydown-R', restartGame, this);
}

function bossFire() {
    // Calcula o ângulo entre o boss e o jogador
    let angleToPlayer = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);

    // Cria um projétil na posição do boss
    let bullet2 = bulletboss.create(boss.x, boss.y, 'bulletboss');
    
    // Define a velocidade do projétil em direção ao jogador
    bullet2.setVelocityX(Math.cos(angleToPlayer) * 300); 
    bullet2.setVelocityY(Math.sin(angleToPlayer) * 300); 
}

function bulletHitPlayer(bullet2, player) {
    this.physics.pause();
    
    displayGameOverMessage.call(this);
    this.input.keyboard.once('keydown-R', restartGame, this);
}

function playerHitBoss(player, boss) {
    // Pausa o jogo
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
