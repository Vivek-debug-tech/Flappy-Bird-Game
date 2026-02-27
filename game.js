/**
 * Flappy Bird - Core Game Logic
 **/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const bestScoreDisplay = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const GRAVITY = 0.25;
const JUMP_FORCE = -5.5;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_GAP = 160;
const BIRD_SIZE = 50;

// Game state
let bird = {
    x: 50,
    y: 0,
    velocity: 0,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    rotation: 0
};

let pipes = [];
let frameCount = 0;
let score = 0;
let bestScore = parseInt(localStorage.getItem('Sudharma BestScore')) || 0;
let gameState = 'START'; // START, PLAYING, GAME_OVER

// Assets
const backgroundImage = new Image();
backgroundImage.src = 'Background.jpg';

const birdImage = new Image();
birdImage.src = 'Flappy Bird.jpg';

const pillarImage = new Image();
pillarImage.src = 'Pillar.jpg';

// Audio
const startSound = new Audio('Start Game.mp3');
const gameOverSound = new Audio('Game Over.mp3');

// Initialize
function init() {
    resizeCanvas();
    
    // Set initial bird position
    bird.y = canvas.height / 2 - bird.height / 2;
    
    window.addEventListener('resize', resizeCanvas);

    // Controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleInput();
    });
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput();
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Recalculate bird initial position
    bird.x = canvas.width / 4;
    if (gameState === 'START') {
        bird.y = canvas.height / 2 - bird.height / 2;
    }
}

function handleInput() {
    if (gameState === 'PLAYING') {
        bird.velocity = JUMP_FORCE;
    } else if (gameState === 'START') {
        startGame();
    } else if (gameState === 'GAME_OVER') {
        // Debounce restart slightly
        if (frameCount > 30) startGame();
    }
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    pipes = [];
    bird.y = canvas.height / 2 - bird.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    frameCount = 0;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    scoreDisplay.textContent = '0';

    // Play start sound
    startSound.currentTime = 0;
    startSound.play().catch(e => console.log("Audio play failed:", e));
}

function gameOver() {
    gameState = 'GAME_OVER';
    frameCount = 0; // Reset for debounce

    // Play game over sound
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(e => console.log("Audio play failed:", e));

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('Sudharma BestScore', bestScore);
    }

    finalScore.textContent = score;
    bestScoreDisplay.textContent = bestScore;
    gameOverScreen.classList.remove('hidden');
}

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: canvas.height - (topHeight + PIPE_GAP),
        passed: false
    });
}

function update() {
    if (gameState !== 'PLAYING') return;

    frameCount++;

    // Bird physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Rotation based on velocity
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1));

    // Boundary check
    if (bird.y < 0 || bird.y + bird.height > canvas.height) {
        gameOver();
    }

    // Pipe logic
    if (frameCount % PIPE_SPAWN_RATE === 0) {
        spawnPipe();
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;

        // Collision detection
        if (
            bird.x + bird.width * 0.8 > pipe.x &&
            bird.x + bird.width * 0.2 < pipe.x + 60
        ) {
            if (bird.y + bird.height * 0.2 < pipe.top || bird.y + bird.height * 0.8 > canvas.height - pipe.bottom) {
                gameOver();
            }
        }

        // Scoring
        if (!pipe.passed && pipe.x + 60 < bird.x) {
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = score;
        }
    });

    // Cleanup off-screen pipes
    if (pipes.length > 0 && pipes[0].x < -100) {
        pipes.shift();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    if (backgroundImage.complete) {
        // Cover logic for background
        const scale = Math.max(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height);
        const x = (canvas.width - backgroundImage.width * scale) / 2;
        const y = (canvas.height - backgroundImage.height * scale) / 2;
        ctx.drawImage(backgroundImage, x, y, backgroundImage.width * scale, backgroundImage.height * scale);
    } else {
        ctx.fillStyle = '#4d94ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Pipes
    pipes.forEach(pipe => {
        if (pillarImage.complete) {
            // Draw top pipe (rotated 180 deg)
            ctx.save();
            ctx.translate(pipe.x + 30, pipe.top / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(pillarImage, -30, -pipe.top / 2, 60, pipe.top);
            ctx.restore();

            // Draw bottom pipe
            ctx.drawImage(pillarImage, pipe.x, canvas.height - pipe.bottom, 60, pipe.bottom);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;

            // Top pipe
            ctx.fillRect(pipe.x, 0, 60, pipe.top);
            ctx.strokeRect(pipe.x, 0, 60, pipe.top);

            // Bottom pipe
            ctx.fillRect(pipe.x, canvas.height - pipe.bottom, 60, pipe.bottom);
            ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, 60, pipe.bottom);
        }
    });

    // Draw Bird
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);

    if (birdImage.complete) {
        // Draw bird image (circular crop effect conceptually via drawing)
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(birdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);

        ctx.restore();
        // Draw border for bird
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.fillStyle = '#ff4d4d';
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
