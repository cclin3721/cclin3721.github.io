const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler)
//canvas.addEventListener("touchstart", touchHandler, true);
//canvas.addEventListener("touchend", touchHandler, true);
//canvas.addEventListener("touchcancel", touchHandler, true);
canvas.addEventListener("touchmove", touchHandler, true);

let game = {    
    requestId: null,
    timeoutId: null,
    leftKey: false,
    rightKey: false,
    on: false,
    music: true,
    sfx: true,
	whoseturn : 1
}
let paddle = {
    height: 20,
    width: 100,
    get y() { return canvas.height - this.height; }
}
let ball = {
    radius: 10
};
let brick = {
    rows: 5,
    cols: 10,
    get width() { return canvas.width / this.cols; },
    height: 30
}
let images = {
    background: new Image(),
    ball: new Image(),
    paddle: new Image()
}
function onImageLoad(e) {
    resetGame();
    initBricks();
    resetPaddle();
    paint(game.whoseturn);
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'lime';
    ctx.fillText('PRESS START', canvas.width / 2 - 120, canvas.height / 2);
};
images.background.addEventListener('load', onImageLoad);
images.background.src = './images/bg-space.webp';
images.ball.src = './images/ball.webp';
images.paddle.src = './images/paddle.webp';

const sounds = {
    ballLost: new Audio('./sounds/ball-lost.mp3'),
    breakout: new Audio('./sounds/breakout.mp3'),
    brick: new Audio('./sounds/brick.mp3'),
    gameOver: new Audio('./sounds/game-over.mp3'),
    levelCompleted: new Audio('./sounds/level-completed.mp3'),
    music: new Audio('./sounds/music.mp3'),
    paddle: new Audio('./sounds/paddle.mp3')
}

let brickField = [];

function play() {   
    cancelAnimationFrame(game.requestId);
    clearTimeout(game.timeoutId);
    game.on = true;

    resetGame();
    resetBall();
    resetPaddle();
    initBricks();

    game.sfx && sounds.breakout.play();
    // Start music after starting sound ends.
    setTimeout(() => game.music && sounds.music.play(), 2000);

    animate();
}

function resetGame() {
    game.speed1 = 6;
	game.speed2 = 6;
    game.score1 = 0;
    game.score2 = 0;
    game.level1 = 1;
	game.level2 = 1;
    game.lives1 = 2;
	game.lives2 = 2;
    game.time = { start: performance.now(), elapsed: 0, refreshRate: 16  };
}

function initSounds() {
    sounds.music.loop = true;
    for (const [key] of Object.entries(sounds)) {
        sounds[key].volume = 0.5;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - paddle.height - 2 * ball.radius;
	if(game.whoseturn==1){
    ball.dx = game.speed1 * (Math.random() * 2 - 1);  // Random trajectory
    ball.dy = -game.speed1; // Up
	}else {
	ball.dx = game.speed2 * (Math.random() * 2 - 1);  // Random trajectory
    ball.dy = -game.speed2; // Up
	}
}

function resetPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
	if(game.whoseturn==1){
    paddle.dx = game.speed1 + 7;
	}else{
	paddle.dx = game.speed2 + 7;
	}
}

function initBricks() {
    brickField = [];
    const topMargin = 30;
    const colors = ['red', 'orange', 'yellow', 'blue', 'green'];

    for(let row = 0; row < brick.rows; row++) {
        for(let col = 0; col < brick.cols; col++) {
            brickField.push({
                x: col * brick.width,
                y: row * brick.height + topMargin,
                height: brick.height,
                width: brick.width,
                color: colors[row],
                points: (5 - row) * 2,
                hitsLeft: row === 0 ? 2 : 1
            });
        }
    }
}

function animate(now = 0) { 
    game.time.elapsed = now - game.time.start;
    if (game.time.elapsed > game.time.refreshRate) {
        game.time.start = now;

        paint();
        update();
        detectCollision();
        detectBrickCollision();
    
        if (isLevelCompleted() || isGameOver()) {
			return;
		}
    }    

    game.requestId = requestAnimationFrame(animate);
}

function paint() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.ball, ball.x, ball.y, 2 * ball.radius, 2 * ball.radius);
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);
    drawBricks();
    drawScore();
    drawLives();
}

function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (game.rightKey) {
        paddle.x += paddle.dx;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    }
    if (game.leftKey) {
        paddle.x -= paddle.dx;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }
}

function drawBricks() {
    brickField.forEach((brick) => {
      if (brick.hitsLeft) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });
  }

function drawScore() {
    ctx.font = '18px ArcadeClassic';
    ctx. fillStyle = 'yellow';

	//if( game.whoseturn==1){
	const { level1, score1 } = game;
    ctx.fillText(`人:第${level1}關`, 5, 23);
    ctx.fillText(`Score: ${score1}`,  100, 23);
	document.getElementById('Message').value = score1;
	//}else {
	ctx. fillStyle = 'white';
	const { level2, score2 } = game;
	ctx.fillText(`AI: 第${level2}關`, canvas.width / 2 + 5, 23);
    ctx.fillText(`Score: ${score2}`, canvas.width / 2 + 100, 23);	
	//}
}

function drawLives() {
	//if (game.whoseturn ==1){
    if (game.lives1 > 2) { ctx.drawImage(images.paddle,180, 12, 20, 8); }
    if (game.lives1 > 1) { ctx.drawImage(images.paddle, 205, 12, 20, 8); }
    if (game.lives1 > 0) { ctx.drawImage(images.paddle, 230, 12, 20, 8); }
	//}
	//else {
	if (game.lives2 > 2) { ctx.drawImage(images.paddle, canvas.width/2 +180, 12, 20, 8); }
    if (game.lives2 > 1) { ctx.drawImage(images.paddle, canvas.width/2+205, 12, 20, 8); }
    if (game.lives2 > 0) { ctx.drawImage(images.paddle, canvas.width/2+230, 12, 20, 8); }
	//}
	
}

function detectCollision() {
    const hitTop = () => ball.y < 0;
    const hitLeftWall = () => ball.x < 0;
    const hitRightWall = () => ball.x + ball.radius * 2 > canvas.width;
    const hitPaddle = () => 
        ball.y + 2 * ball.radius > canvas.height - paddle.height &&
        ball.y + ball.radius < canvas.height && 
        ball.x + ball.radius > paddle.x &&
        ball.x + ball.radius < paddle.x + paddle.width;

    if (hitLeftWall()) {
        ball.dx = -ball.dx;
        ball.x = 0;
    }        
    if (hitRightWall()) {
        ball.dx = -ball.dx;
        ball.x = canvas.width - 2 * ball.radius;
    }
    if (hitTop()) {
        ball.dy = -ball.dy;
        ball.y = 0;
    }
    if (hitPaddle()) {
        ball.dy = -ball.dy;
        ball.y = canvas.height - paddle.height - 2 * ball.radius;
        game.sfx && sounds.paddle.play();
        // TODO change this logic to angles with sin/cos
        // Change x depending on where on the paddle the ball bounces.
        // Bouncing ball more on one side draws ball a little to that side.
        const drawingConst = 5
        const paddleMiddle = 2;
        const algo = (((ball.x - paddle.x) / paddle.width) * drawingConst);
        ball.dx = ball.dx + algo - paddleMiddle;
    }
}

function detectBrickCollision() {
    let directionChanged = false;
    const isBallInsideBrick = (brick) => 
        ball.x + 2 * ball.radius > brick.x &&
        ball.x < brick.x + brick.width && 
        ball.y + 2 * ball.radius > brick.y && 
        ball.y < brick.y + brick.height;
  
    brickField.forEach((brick) => {
        if (brick.hitsLeft && isBallInsideBrick(brick)) {
            sounds.brick.currentTime = 0;
            game.sfx && sounds.brick.play();
            brick.hitsLeft--;
            if (brick.hitsLeft == 1) {
                brick.color = 'darkgray';
            }
			if (game.whoseturn ==1 ){
				game.score1 += brick.points;
			}else {
				game.score2 += brick.points;
			}
    
            if (!directionChanged) {
                directionChanged = true;
                detectCollisionDirection(brick);
            }
        }
    });
}

function detectCollisionDirection(brick) {
    const hitFromLeft = () => ball.x + 2 * ball.radius - ball.dx <= brick.x;
    const hitFromRight = () => ball.x - ball.dx >= brick.x + brick.width;

    if (hitFromLeft() || hitFromRight()) {
      ball.dx = -ball.dx;
    } else { // Hit from above or below
      ball.dy = -ball.dy;
    }
}

function keyDownHandler(e) {
    if (!game.on && e.key === ' ') {
        play();
    }
    if (game.on && (e.key === 'm' || e.key === 'M')) {
        game.music = !game.music;
        game.music ? sounds.music.play() : sounds.music.pause();
    }
    if (game.on && (e.key === 's' || e.key === 'S')) {
        game.sfx = !game.sfx;
    }
    if (e.key === 'ArrowUp') {
        volumeUp();
    }
    if (e.key === 'ArrowDown') {
        volumeDown();
    }
    if (e.key === 'ArrowRight') {
        game.rightKey = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = false;
    }
}

function mouseMoveHandler(e) {
    const mouseX = e.clientX - canvas.offsetLeft;    
    const isInsideCourt = () => mouseX > 0 && mouseX < canvas.width;

    if(isInsideCourt()) {
        paddle.x = mouseX - paddle.width / 2;
    }
}

function touchHandler(event) {
    var touch = event.changedTouches[0];

    var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup"
    }[event.type], true, true, window, 1,
        touch.screenX, touch.screenY,
        touch.clientX, touch.clientY, false,
        false, false, false, 0, null);

    touch.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function isLevelCompleted() {
    const levelComplete = brickField.every((b) => b.hitsLeft === 0);

    if (levelComplete) {
        initNextLevel();
        resetBall();
        resetPaddle();
        initBricks();
        game.timeoutId = setTimeout(() => {
            animate();
            sounds.music.play();
        }, 3000);

        return true;
    }
    return false;
}

function initNextLevel() {
    if (game.whoseturn == 1) {
    game.level1++;
    game.speed1++;
	} else {
	game.level2++;
    game.speed2++;
	}
    sounds.music.pause();
    game.sfx && sounds.levelCompleted.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'yellow';
	if (game.whoseturn == 1) {
    ctx.fillText(`LEVEL ${game.level1}!`, canvas.width / 2 - 120, canvas.height / 2);
	}else {
	ctx.fillText(`LEVEL ${game.level2}!`, canvas.width / 2 - 120, canvas.height / 2);	
	}
}

function isGameOver() {
    const isBallLost = () => ball.y - ball.radius > canvas.height;

    if (isBallLost()) {

        game.sfx && sounds.ballLost.play();
		if (game.whoseturn == 1) {
			game.lives1 -= 1;
			game.whoseturn = 2;
			alert("換AI玩，它還有"+game.lives2+"條命")

		}
		else if (game.whoseturn == 2) {
			game.lives2 -= 1;
			game.whoseturn = 1;
			if (game.lives1 > 0)
			alert("換你玩,你還有"+game.lives1+"條命")

		}
		//alert(game.whoseturn)
        if (game.lives2 == 0) {
            gameOver();
            return true;
        }
        resetBall();
        resetPaddle();
    }
    return false;
}

function gameOver() {
    game.on = false;
    sounds.music.pause();
    sounds.currentTime = 0;
    game.sfx && sounds.gameOver.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'red';
	if (game.score1> game.score2)
    ctx.fillText('YES,你贏了AI', canvas.width / 2 - 180, canvas.height / 2+40);
    else if (game.score1 < game.score2)
	ctx.fillText('嗚~你輸了AI', canvas.width / 2 - 180, canvas.height / 2+40);
    else 
    ctx.fillText('平手', canvas.width / 2 - 100, canvas.height / 2);
}

function volumeDown() {
    if (sounds.music.volume >= 0.1) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume -= 0.1;
        }
    }
}


function volumeUp() {
    if (sounds.music.volume <= 0.9) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume += 0.1;
        }
    }
}

initSounds();
