document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d');
    canvas.width = window.innerWidth - 300; 
    canvas.height = window.innerHeight;

    const bugSize = 80;
    const wireWidth = 10; 
    const wireSpacing = canvas.width / 5; 
    const initialWireIndex = 2; 
    let gameSpeed = 5;
    let score = 0;

    const spriteSheet = new Image();
    spriteSheet.src = '../Assets/images/bugsprite.png';

    const crowImage = new Image();
    crowImage.src = '../Assets/images/bird.png';

    class Bug {
        constructor() {
            this.position = {
                x: wireSpacing * initialWireIndex - bugSize / 2,
                y: canvas.height / 2 - bugSize / 2 
            };
            this.velocity = {
                x: 0,
                y: 0
            };
            this.width = bugSize;
            this.height = bugSize;
            this.wireIndex = initialWireIndex;
            this.onWire = true;
            this.spriteX = 0; 
            this.spriteY = 0; 
            this.spriteWidth = 64; 
            this.spriteHeight = 88; 
            this.frameIndex = 0; 
            this.frameCount = 4; 
            this.frameSpeed = 10; 
            this.frameTick = 0; // Counter to switch frames
        }

        draw() {
            c.drawImage(
                spriteSheet,
                this.frameIndex * this.spriteWidth,
                this.spriteY,
                this.spriteWidth,
                this.spriteHeight,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
        }

        update() {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;

            //  same wire after a jump
            if (!this.onWire) {
                this.velocity.y += 1.5; 
                if (this.position.y >= canvas.height / 2 - bugSize / 2) {
                    this.position.y = canvas.height / 2 - bugSize / 2;
                    this.velocity.y = 0;
                    this.onWire = true;
                }
            }

            //  canvas bounds horizontally
            if (this.position.x < 0) this.position.x = 0;
            if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;

            // Update the sprite 
            this.frameTick++;
            if (this.frameTick >= this.frameSpeed) {
                this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                this.frameTick = 0;
            }
        }

        jump() {
            if (this.onWire) {
                this.velocity.y = -30; 
                this.onWire = false;
            }
        }

        changeWire(direction) {
            if (direction === 'left' && this.wireIndex > 1) {
                this.wireIndex -= 1;
                if (this.onWire) {
                    this.position.x = wireSpacing * this.wireIndex - bugSize / 2;
                }
            } else if (direction === 'right' && this.wireIndex < 4) {
                this.wireIndex += 1;
                if (this.onWire) {
                    this.position.x = wireSpacing * this.wireIndex - bugSize / 2;
                }
            }
        }
    }

    class Obstacle {
        constructor(y, wireIndex, width, height) {
            this.position = {
                x: wireSpacing * wireIndex - width / 2,
                y: y
            };
            this.width = width;
            this.height = height;
        }

        draw() {
            c.drawImage(crowImage, this.position.x, this.position.y, this.width, this.height);
        }

        update() {
            this.draw();
            this.position.y += gameSpeed;
        }
    }

    let bug = new Bug();
    let obstacles = [];
    const keys = {
        space: {
            pressed: false
        },
        left: {
            pressed: false
        },
        right: {
            pressed: false
        }
    };

    function init() {
        bug = new Bug();
        obstacles = [];
        score = 0;
    }

    function animate() {
        requestAnimationFrame(animate);
        c.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the wires
        for (let i = 1; i <= 4; i++) {
            c.beginPath();
            c.moveTo(wireSpacing * i, 0);
            c.lineTo(wireSpacing * i, canvas.height);
            c.strokeStyle = '#000';
            c.lineWidth = wireWidth;
            c.stroke();
        }

        bug.update();

        if (keys.space.pressed) {
            bug.jump();
        }

        obstacles.forEach((obstacle, index) => {
            obstacle.update();

            // Remove obstacles 
            if (obstacle.position.y > canvas.height) {
                obstacles.splice(index, 1);
                score++;
            }

            // Check for collision
            if (
                bug.onWire && 
                bug.position.x < obstacle.position.x + obstacle.width &&
                bug.position.x + bug.width > obstacle.position.x &&
                bug.position.y < obstacle.position.y + obstacle.height &&
                bug.position.y + bug.height > obstacle.position.y
            ) {
                alert('Game Over! Your score: ' + score);
                init();
            }
        });

        // Add new obstacles
        if (Math.random() < 0.02) {
            const width = 50; 
            const height = 50; 
            const wireIndex = Math.floor(Math.random() * 4) + 1;
            obstacles.push(new Obstacle(-30, wireIndex, width, height)); 
        }

        // Display score
        c.fillStyle = 'black';
        c.font = '24px Arial';
        c.fillText('Score: ' + score, 20, 30);
    }

    init();
    animate();

    window.addEventListener('keydown', ({ keyCode }) => {
        switch (keyCode) {
            case 32: // Space
                if (!keys.space.pressed) {
                    keys.space.pressed = true;
                    bug.jump();
                }
                break;
            case 37: // Left arrow
                if (!keys.left.pressed) {
                    keys.left.pressed = true;
                    bug.changeWire('left');
                }
                break;
            case 39: // Right arrow
                if (!keys.right.pressed) {
                    keys.right.pressed = true;
                    bug.changeWire('right');
                }
                break;
        }
    });

    window.addEventListener('keyup', ({ keyCode }) => {
        switch (keyCode) {
            case 32:
                keys.space.pressed = false;
                break;
            case 37:
                keys.left.pressed = false;
                break;
            case 39:
                keys.right.pressed = false;
                break;
        }
    });
});
