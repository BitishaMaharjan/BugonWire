document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d');
    canvas.width = window.innerWidth - 300;
    canvas.height = window.innerHeight;

    const bugSize = 80;
    const initialWireIndex = 2;
    let gameSpeed = 4;
    let score = 0;

    const bugImage = new Image();
    bugImage.src = './Assets/images/bugsprite.png';

    const birdEating = new Image();
    birdEating.src = './Assets/images/fly.png'; 

    const crowImage = new Image();
    crowImage.src = './Assets/images/bird.png';

    const bgImage = new Image();
    bgImage.src = './Assets/images/background.png';
    const gameOverMusic = new Audio('./Assets/audio/gameover.mp3');
    gameOverMusic.pause();

    const gameMusic = new Audio('./Assets/audio/background.mp3');
    

    class Bug {
        constructor() {
            this.position = {
                x: this.getWireX(initialWireIndex) - bugSize / 2,
                y: canvas.height - bugSize - 50
            };
            this.velocity = {
                x: 0,
                y: 0
            };
            this.width = bugSize;
            this.height = bugSize;
            this.wireIndex = initialWireIndex;
            this.onWire = true;

            // Sprite animation properties
            this.frame = 0;
            this.numFrames = 4; 
            this.frameWidth = 64;
            this.frameHeight = 95; 
            this.frameDelay = 9; 
            this.frameCounter = 0;
        }

        getWireX(wireIndex) {
            const middle = canvas.width / 2 - 150;
            const spacing = 148;
            return middle + (wireIndex - 2) * spacing; 
        }

        draw() {
            // Calculate  current frame
            const srcX = this.frame * this.frameWidth;
            const srcY = 0; 

            c.drawImage(
                bugImage,
                srcX, srcY, this.frameWidth, this.frameHeight, 
                this.position.x, this.position.y, this.width, this.height 
            );
        }

        update() {
            this.draw();

            //  bug  on the wire
            if (this.onWire) {
                this.position.x = this.getWireX(this.wireIndex) - this.width / 2;
            }

            this.position.y += this.velocity.y;

            if (!this.onWire) {
                this.velocity.y += 1.5;
                if (this.position.y >= canvas.height - bugSize - 50) {
                    this.position.y = canvas.height - bugSize - 50;
                    this.velocity.y = 0;
                    this.onWire = true;
                }
            }

            if (this.position.x < 0) this.position.x = 0;
            if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;

            // Update the frame counter
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.frame = (this.frame + 1) % this.numFrames;
                this.frameCounter = 0;
            }
        }

        jump() {
            if (this.onWire) {
                this.velocity.y = -30;
                this.onWire = false;
            }
        }

        changeWire(direction) {
            const newWireIndex = direction === 'left' ? this.wireIndex - 1 : this.wireIndex + 1;
        
            //  stays within valid wire indices (1 to 4)
            if (newWireIndex >= 1 && newWireIndex <= 4) {
                // Check if the bug is already on the wire before changing
                if (this.onWire) {
                    this.wireIndex = newWireIndex;
                    this.position.x = this.getWireX(this.wireIndex) - this.width / 2; // Update position to new wire
                    this.onWire = false;
                }
            }
        }
    }

    class Obstacle {
        constructor(y, wireIndex, width, height, isBird) {
            this.wireIndex = wireIndex;
            this.position = {
                x: this.getWireX(wireIndex) - width / 2, // Center the obstacle on the wire
                y: y
            };
            this.width = width;
            this.height = height;
            this.isBird = isBird; // Indicates if this obstacle is a bird
            this.image = this.isBird ? birdEating : crowImage; // Select image based on isBird flag
        }
    
        getWireX(wireIndex) {
            const middle = canvas.width / 2 - 150;
            const spacing = 148;
            return middle + (wireIndex - 2) * spacing + 30;
        }
    
        draw() {
            c.drawImage(this.image, this.position.x - (this.isBird ? 0 : 20), this.position.y, this.width, this.height);
        }
    
        update() {
            this.draw();
            this.position.y += gameSpeed;
        }
    }
    
    
      

    let bug;
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

    let wirePositions = [];

    function drawWires() {
        const wireCount = 4; 
        const spacing = 190; 
        const tiltFactor = 0.12; // tilt factor for more or less tilt
        const vanishingPointY = canvas.height + bgOffset + 60; // Y-coordinate of the bottom of the wires adjusted by bgOffset
        const vanishingPointX = canvas.width / 2; // X-coordinate of the center of the canvas

        
        if (wirePositions.length === 0) {
            for (let i = 0; i < wireCount; i++) {
                const startX = vanishingPointX - (wireCount / 2) * spacing + i * spacing;
                const endX = startX; 
                const startY = vanishingPointY;
                const endY = bgOffset - 200; // Extend wires upwards

                wirePositions.push({ startX, startY, endX, endY });
            }
        }

        // tilt amount for all wires
        const tiltAmount = (vanishingPointY - bgOffset) * tiltFactor;

        // Update positions
        for (let i = 0; i < wireCount; i++) {
            const wire = wirePositions[i];
            wire.startX = vanishingPointX - (wireCount / 2) * spacing + i * spacing;
            wire.endX = wire.startX + tiltAmount * (wireCount / 2 - i);

            //  wire segment with bending effect
            const controlPointX = (wire.startX + wire.endX) / 2;
            const controlPointY = wire.startY + 200; 

            c.beginPath();
            c.moveTo(wire.startX, wire.startY);
            c.quadraticCurveTo(controlPointX, controlPointY, wire.endX, wire.endY); 
            c.strokeStyle = '#000';
            c.lineWidth = 8 - Math.abs(i - wireCount / 2); 
            c.stroke();
        }

        //  plank dimensions and position
        const plankY = bgOffset; 
        const plankThickness = 25;
        const plankColor = '#8B4513'; 

        // on wire positions
        const plankStartX = wirePositions[0].startX - 20; 
        const plankEndX = wirePositions[wireCount - 1].startX + spacing - 200;

        //  tilt for the plank
        const plankTiltStartX = plankStartX;
        const plankTiltEndX = plankStartX + (plankEndX - plankStartX) + tiltAmount; // Adjust end X based on tilt amount

        c.beginPath();
        c.moveTo(plankTiltStartX, plankY);
        c.lineTo(plankTiltEndX, plankY); 
        c.strokeStyle = plankColor;
        c.lineWidth = plankThickness;
        c.stroke();
    }

    let bgOffset = 0;
    function drawBackground() {
        c.drawImage(bgImage, 0, bgOffset, canvas.width, canvas.height);
        c.drawImage(bgImage, 0, bgOffset - canvas.height, canvas.width, canvas.height);
        bgOffset += gameSpeed / 2;
        if (bgOffset >= canvas.height) {
            bgOffset = 0;
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        c.clearRect(0, 0, canvas.width, canvas.height);

        drawBackground();
        drawWires();

        bug.update();

        if (keys.space.pressed) {
            bug.jump();
        }

        obstacles.forEach((obstacle, index) => {
            obstacle.update();

            if (obstacle.position.y > canvas.height) {
                obstacles.splice(index, 1);
                score++;
            }

            if (
                bug.onWire &&
                bug.position.x < obstacle.position.x + obstacle.width &&
                bug.position.x + bug.width > obstacle.position.x &&
                bug.position.y + 35 < obstacle.position.y + obstacle.height &&
                bug.position.y + bug.height > obstacle.position.y  + 30
            ) {
                obstacle.isEating = true;
        
                const backgroundMusic = document.getElementById('background-music');
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                // gameOverMusic.play()
                // window.location.href = 'gameOver.html';
                // Inside the collision detection or game over logic
               // Inside the collision detection or game over logic
               const currentScore = score; // Replace with your actual score logic
              localStorage.setItem('score', currentScore.toString()); // Store score in local storage

            // Redirect to game over screen
              window.location.href = 'gameOver.html';


              
                

                // Play game over music
               
                // setTimeout(() => {
                //     obstacle.isEating = false;
                    
                // }, 2000); 
               
                
                gameOverMusic.pause()
                gameOverMusic.currentTime = 0;
                backgroundMusic.play();
                init();
               
                // Redirect to gameover.html with score
                
            }
        });

      // Generate obstacles
      // Generate obstacles
      if (Math.random() < 0.02) {
        const width = 50;
        const height = 50;
        let wireIndex;

        // Track last obstacle wire index
        let lastObstacleWireIndex = -1;
        if (obstacles.length > 0) {
            lastObstacleWireIndex = obstacles[obstacles.length - 1].wireIndex;
        }

        // Randomly choose wire index, avoiding the middle two wires for regular crow obstacles
        do {
            wireIndex = Math.floor(Math.random() * 4) + 1;
        } while (
            (wireIndex === 2 && lastObstacleWireIndex === 3) || // Avoid placing on adjacent wires
            (wireIndex === 3 && lastObstacleWireIndex === 2) ||
            (wireIndex === lastObstacleWireIndex) // Avoid placing on the same wire as the last obstacle
        );

        if (wireIndex === 1 || wireIndex === 4) {
            // Create fly obstacle
            obstacles.push(new Obstacle(-height, wireIndex, width, height, true));
        } else {
            // Create crow obstacle
            obstacles.push(new Obstacle(-height, wireIndex, width, height));
           
        }
    }

    
        c.fillStyle = '#000';
        c.font = '24px Arial';
        c.fillText('Score: ' + score, 10, 30);
    }

    window.addEventListener('keydown', (event) => {
        if (event.code === 'ArrowUp') {
            keys.space.pressed = true;
        }
        if (event.code === 'ArrowLeft') {
            bug.changeWire('left');
        }
        if (event.code === 'ArrowRight') {
            bug.changeWire('right');
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'ArrowUp') {
            keys.space.pressed = false;
        }
    });

    function startGame() {
        init();
        animate();
    }

    bugImage.onload = () => {
        console.log('Bug image loaded');
        crowImage.onload = () => {
            console.log('Crow image loaded');
            birdEating.onload = () => {
                console.log('Bird eating image loaded');
                bgImage.onload = () => {
                    console.log('Background image loaded');
                    
                };
            };
        };
    };
    startGame();
});
