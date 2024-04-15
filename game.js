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
let countdown = 60;
let countdownEvent;


// Definindo a velocidade do jogador
const PLAYER_SPEED = 200;
const PLAYER_ROTATION_SPEED = 350;
let fireAngle = 270; // Ângulo inicial do tiro

function restartGame() {
    // Restart the game by calling the preload function again
    this.scene.restart();

    // Reset the score
    score = 0;
    scoreText.setText('Score: 0');
    fireAngle = -90;

    // Reinitialize the countdown and alien spawning events
    countdownEvent = this.time.addEvent({
        delay: 1000,
        callback: updateCountdown,
        callbackScope: this,
        loop: true
    });

    alienSpawnEvent = this.time.addEvent({
        delay: 2000,
        callback: spawnAlien,
        callbackScope: this,
        loop: true
    });
}

function goToMenu() {
    // Redireciona para a tela do menu
    window.location.href = 'Menu.html';
}

function preload() {
    this.load.image('ship', 'assets/ship2.png');
    this.load.image('alien', 'assets/ufo.png');
    this.load.image('bullet', 'assets/bullet1.png');
    this.load.image('BG', 'assets/back2.png');
    this.load.image('asteroid_big', 'assets/asteroid_big.png')
    this.load.image('asteroid_small', 'assets/asteroid_small.png')
    this.load.audio('backgroundMusic', 'assets/audio/bgm.mp3');
    this.load.audio('shootSound', 'assets/audio/arcade-beep.mp3');
    this.load.audio('gameoversong', 'assets/audio/gameover.mp3');
}

function create() {
    background = this.add.image(0, 0, 'BG').setOrigin(0);
    background.setScale(800 / background.width, 600 / background.height);

    player = this.physics.add.sprite(400, 500, 'ship').setAngle(90);

    player.body.setSize(player.width * 0.5, player.height * 0.5); 

    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', fireBullet, this);

    player.angle = -90;
    aliens = this.physics.add.group();

    bullets = this.physics.add.group();

    
    let bulletOffsetX = -40;
    let bulletOffsetY = 20;

    alienSpawnEvent = this.time.addEvent({
        delay: 2000, // Initial spawn delay
        callback: spawnAlien,
        callbackScope: this,
        loop: true
    });

    countdownText = this.add.text(750, 20, 'Time: ' + countdown, { fontSize: '24px', fill: '#fff' });
    countdownText.setOrigin(1, 0); // Set origin to top-right corner

    countdownEvent = this.time.addEvent({
        delay: 1000, // Decrease time every second
        callback: updateCountdown,
        callbackScope: this,
        loop: true
    });

    // Function to spawn aliens
    function spawnAlien() {
        let spawnX, spawnY;

        // Randomly select a side of the screen to spawn the alien
        let side = Phaser.Math.Between(0, 3); // 0: top, 1: right, 2: bottom, 3: left

        switch (side) {
            case 0: // Top side
                spawnX = Phaser.Math.Between(0, config.width);
                spawnY = -50;
                break;
            case 1: // Right side
                spawnX = config.width + 50;
                spawnY = Phaser.Math.Between(0, config.height);
                break;
            case 2: // Bottom side
                spawnX = Phaser.Math.Between(0, config.width);
                spawnY = config.height + 50;
                break;
            case 3: // Left side
                spawnX = -50;
                spawnY = Phaser.Math.Between(0, config.height);
                break;
        }

        let alien = aliens.create(spawnX, spawnY, 'alien');

        // Set velocity towards player
        let angle = Phaser.Math.Angle.Between(alien.x, alien.y, player.x, player.y);
        let velocityX = Math.cos(angle) * 100;
        let velocityY = Math.sin(angle) * 100;
        alien.setVelocity(velocityX, velocityY);

        // Decrease spawn delay based on time elapsed
        let progress = countdownEvent.getProgress();
        
    }

    // Add collision
    this.physics.add.collider(bullets, aliens, bulletHitAlien, null, this);
    this.physics.add.collider(player, aliens, playerHitAlien, null, this);

    scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff' });

    this.input.keyboard.on('keydown-ESC', goToMenu, this);
}

function updateCountdown() {
    if (countdown > 0) {
        countdown -= 1; // Decrement countdown by 1 second
        countdownText.setText('Time: ' + countdown);

        // Adjust the alien spawn delay based on the remaining time
        adjustAlienSpawnDelay();
    } else {
        // Handle case when countdown reaches 0
        countdownEvent.remove(); // Stop the countdown event
        alienSpawnEvent.remove(); // Stop the alien spawning event
        // Add any additional logic for when the countdown reaches 0
    }
}

function adjustAlienSpawnDelay() {
    let progress = 1 - (countdown / 60); // Calculate the progress from 0 to 1

    if (progress > 0.5) {
        alienSpawnEvent.delay = 500; // Reduce spawn delay to 0.5 seconds if more than half time elapsed
    } else if (progress > 0.25) {
        alienSpawnEvent.delay = 1000; // Reduce spawn delay to 1 second if more than quarter time elapsed
    } else {
        alienSpawnEvent.delay = 2000; // Use the initial spawn delay of 2 seconds if less than quarter time elapsed
    }
}

function update() {
    // Verifica o movimento horizontal
    
      // Debugging
    console.log("Countdown before update:", countdown);
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

    
  
      // Debugging
      console.log("Countdown:", countdown);

    // Atualizações dos asteroides
    /*asteroid_big.angle += asteroid_big.body.angularVelocity;
    angle = 0.05;
    Phaser.Math.RotateAroundDistance(asteroid_small, asteroid_big.x, asteroid_big.y, angle, distance);*/
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
}

function bulletHitAlien(bullet, alien) {
    bullet.destroy();
    alien.destroy();

    score += 10;
    scoreText.setText('Score: ' + score);

    if (aliens.countActive(true) === 0) {
        displayVictoryMessage.call(this);
        this.input.keyboard.once('keydown-R', restartGame, this);
    }
}

function playerHitAlien(player, alien) {
     // Pause the game
     this.physics.pause();

     // Stop the countdown and alien spawning events
     countdownEvent.remove();
     alienSpawnEvent.remove();
 
     // Reset the countdown
     countdown = 60;
 
     // Display the game over message
     displayGameOverMessage.call(this);
 
     // Add an event to restart the game when the player presses 'R'
     this.input.keyboard.once('keydown-R', restartGame, this);
}

function saveScore() {
    // Store the current score in localStorage
    localStorage.setItem('currentScore', score);

    let playerName = prompt('Insira seu nome para salvar sua pontuação:');
    if (!playerName) {
        playerName = 'Jogador'; // Define um nome padrão se nenhum nome for inserido
    }

    // Obtém os scores armazenados localmente ou cria um array vazio se não houver nenhum
    let scores = JSON.parse(localStorage.getItem('scores')) || [];

    // Adiciona o novo score atual com o nome do jogador à lista de scores
    scores.push({ name: playerName, score: parseInt(localStorage.getItem('currentScore')) });

    // Ordena os scores em ordem decrescente
    scores.sort((a, b) => b.score - a.score);

    // Limita os scores apenas aos 10 mais altos
    scores = scores.slice(0, 10);

    // Salva os scores atualizados no armazenamento local
    localStorage.setItem('scores', JSON.stringify(scores));

}

function displayVictoryMessage() {
    saveScore.call(this);
    // Crie um texto para exibir a mensagem de vitória
    let gameoverText = this.add.text(400, 300, 'Vitória!', { fontSize: '64px', fill: '#fff' });
    let gameoverauxText = this.add.text(400, 340, 'Pressione R para reiniciar!', { fontSize: '15px', fill: '#fff' });
    gameoverText.setOrigin(0.5);
    gameoverauxText.setOrigin(0.5);

}


function displayGameOverMessage() {
    saveScore.call(this);
    // Crie um texto para exibir a mensagem de vitória
    let gameoverText = this.add.text(400, 300, 'Game over!', { fontSize: '64px', fill: '#fff' });
    let gameoverauxText = this.add.text(400, 340, 'Pressione R para reiniciar!', { fontSize: '15px', fill: '#fff' });
    gameoverText.setOrigin(0.5);
    gameoverauxText.setOrigin(0.5);
}
