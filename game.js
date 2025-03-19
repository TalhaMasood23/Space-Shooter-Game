import { Asteroids } from "./js/Asteriods.js";
import { Bullet } from "./js/Bullet.js";
import { CONSTANTS } from "./js/constants.js";
import { EnemyBullet } from "./js/EnemyBullet.js";
import { EnemySpaceShip } from "./js/EnemySpaceShip.js";
import { Fuel } from "./js/Fuel.js";
import { asteriods, canvasBackground, backgroundSound, destroyedSound, fuelImage } from "./js/GameAssets.js";
import { Player } from "./js/Player.js";
import { Score } from "./js/score.js";
import { Vector } from "./js/Vector.js";

const _ = (q) => document.querySelector(q);



class Game {

    player = new Player();


    elements = [this.player];
    enemyElements = [];
    shots = [];
    fuelTanks = [];
    keys = {};

    timeElapsedFor = {
        asteroids: 0,
        enemySpaceShip: 0,
        enemySpaceShipShoot: 0,
        fuelTicks: 0,
        gameTimerTicks: 0,
    }



    constructor() {
        this.canvas = document.querySelector("canvas");
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth * 0.9;
        this.canvas.height = window.innerHeight * 0.85;
        this.canvas.style.backgroundColor = "black";

        requestAnimationFrame(this.render.bind(this));

        // INITIALIZING CONSTANGS
        CONSTANTS.canvasheight = this.canvas.height;
        CONSTANTS.canvaswidth = this.canvas.width;

        this.score = 0;

        this.playerGotHit = false;


        this.registerEventListeners();
        this.spawnElements.spawnAsteroids();


        this.currentTime = Date.now();
        this.diff = 2;

        this.timer = 0;
    }



    // isPlaying = false;
    // playBackgroundSound() {
    //     if(!this.isPlaying)
    //     backgroundSound.play();

    // }

    registerEventListeners() {
        document.addEventListener("keydown", (e) => {



            this.keys[e.code] = true;

            if (e.code === "Space") {
                this.shots.push(this.player.shoot())
            }
            if (e.code === "KeyP") {
                CONSTANTS.gamePaused = CONSTANTS.gamePaused ? false : true;
            }
        })
        document.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        })


        document.querySelector("#playerNameInput").addEventListener("input", (e) => {
            if (e.target.value.length == 0) {
                document.querySelector("#ContinueButton").setAttribute("disabled", true);
            } else {
                document.querySelector("#ContinueButton").removeAttribute("disabled");
            }
        })

        document.querySelector("#ContinueButton").addEventListener("click", (e) => {
            this.submitRank(document.querySelector("#playerNameInput").value);

        })
    }

    generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min)) + min;


    submitRank(name) {
        let root = this;
        $.post("game.php", { name: name, score: this.score, timer: this.timer }, function (data, status) {
            let response = JSON.parse(data);

//             if (response.message === "inserted") {
                root.resetGame();
//             }
        })
    }
//
    resetGame() {
        this.score = 0;
        this.timer = 0;
        this.player.pos = new Vector(10, 10);
        this.enemyElements = []
        this.shots = []
        this.fuelTanks = [];
        CONSTANTS.gameStarted = true;
        console.log('eh');
        this.player.fuelLevel = 20;
        document.querySelector(".gameOverOverlay").style.display = "none";
    }

    spawnElements = {
        spawnSpaceShip: () => {
            this.enemyElements.push(new EnemySpaceShip({ position: new Vector(this.canvas.width, this.generateRandomNumber(10, this.canvas.height - 200)) }));
        },
        spawnAsteroids: () => {
            this.enemyElements.push(new Asteroids({ position: new Vector(this.canvas.width - 20, this.generateRandomNumber(10, this.canvas.height - 200)) }))

        }
    }


    render(ts) {

        this.ctx.drawImage(canvasBackground, 0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = "rgba(0,0,0,0.3)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        requestAnimationFrame(this.render.bind(this));



        this.elements.map((e) => e.render(this.ctx))
        this.enemyElements.map((e) => e.render(this.ctx));
        this.shots.map(e => e.render(this.ctx));
        this.fuelTanks.map(e => e.render(this.ctx));


        // MAKING FPS CONSTANT
        if (CONSTANTS.gameStarted) {
            if (!CONSTANTS.gamePaused) {
                if (Date.now() - this.currentTime > this.diff) {
                    this.update();
                    this.currentTime = Date.now();
                }
            }
        }


    }

    startgame() {
        CONSTANTS.gameStarted = true;
        backgroundSound.play();
    }

    updateGameTimer() {
        this.timer++;
        document.querySelector("#Timer").innerHTML = "Timer: " + this.timer;
    }

    update() {
        this.elements.map((e, i) => {
            e.update(this.keys)
        })
        this.enemyElements.map((e) => e.update(this.keys));
        this.shots.map(e => e.update(this.keys));
        this.fuelTanks.map(e => e.update(this.keys));

        Object.entries(this.timeElapsedFor).forEach((object) => {
            this.timeElapsedFor[object[0]]++;
        })

        if (this.timeElapsedFor.asteroids > 80) {
            this.spawnElements.spawnAsteroids();
            this.timeElapsedFor.asteroids = 0;
        }

        if (this.timeElapsedFor.enemySpaceShip > Math.floor(Math.random() * 80) + 200) {
            this.spawnElements.spawnSpaceShip();
            this.timeElapsedFor.enemySpaceShip = 0;
        }

        if (this.timeElapsedFor.enemySpaceShipShoot > Math.floor(Math.random() * 90) + 150) {

            this.enemyElements.forEach((spaceship) => {


                if (spaceship.canShoot) {

                    this.enemyElements.push(new EnemyBullet({ position: new Vector(spaceship.position.x, spaceship.position.y + spaceship.height / 2) }))
                    this.timeElapsedFor.enemySpaceShipShoot = 0;

                }


            });

        }

        if (this.timeElapsedFor.fuelTicks > 200) {
            this.fuelTanks.push(new Fuel({ position: new Vector(this.generateRandomNumber(20, this.canvas.width - 20), 0 - 200) }))
            this.timeElapsedFor.fuelTicks = 0;
        }

        if (this.timeElapsedFor.gameTimerTicks > 60) {
            this.updateGameTimer();
            this.timeElapsedFor.gameTimerTicks = 0;
        }



        this.collisions.playerCollisionWithAsteroids();
        this.collisions.bulletCollisionWithAsteroids();
        this.collisions.playerWithfuelCollision();
        this.clearEnemyElements();

    }


    enemySpaceShipShoot() {

    }


    clearEnemyElements() {
        this.enemyElements.forEach((enemy, index) => {
            if (enemy.position.x + enemy.width < 0) {
                this.enemyElements.splice(index, 1);
            }
        })
    }


    collisions = {
        bulletCollisionWithAsteroids: () => {
            this.shots.forEach((bullet, bulletPos) => {
                this.enemyElements.forEach((enemy, enemyPos) => {
                    // console.log(`${bullet.position.x + bullet.width} > ${enemy.position.x} && ${bullet.position.x + bullet.width} < ${enemy.position.x + enemy.width}`)
                    if (bullet.position.x + bullet.width - Bullet.bulletActualhit > enemy.position.x &&
                        bullet.position.x + bullet.width < enemy.position.x + enemy.width + 20 &&
                        ((bullet.position.y > enemy.position.y && bullet.position.y < enemy.position.y + enemy.width))) {


                        this.elements.push(new Score({ x: enemy.position.x, y: enemy.position.y, state: "success" }));

                        this.shots.splice(bulletPos, 1);
                        this.enemyElements.splice(enemyPos, 1);
                        destroyedSound.play();

                        this.score++;

                        document.querySelector("#scoreArea").innerHTML = `Score: ${this.score}`;


                    }
                })
            })
        },

        playerCollisionWithAsteroids: () => {
            this.enemyElements.forEach((enemy) => {
                // COLLISION CHECK 1
                if (enemy.position.x < this.player.pos.x + this.player.width &&
                    enemy.position.x > this.player.pos.x &&
                    ((enemy.position.y > this.player.pos.y &&
                        enemy.position.y < this.player.pos.y + this.player.height) ||
                        (enemy.position.y + enemy.height > this.player.pos.y &&
                            enemy.position.y + enemy.height < this.player.pos.y + this.player.height))
                ) {
                    // console.log("collided");


                    if (!this.playerGotHit) {
                        this.player.fuelLevel -= 2;
                        this.playerGotHit = true;
                        this.elements.push(new Score({ x: this.player.pos.x, y: this.player.pos.y, state: "error" }));

                    }
                    var root = this;
                    document.querySelector(".gameArea").classList.add("shakeBoard");
                    setTimeout(function () {
                        root.playerGotHit = false;
                        document.querySelector('.gameArea').classList.remove("shakeBoard");
                    }, 300)
                }
            })
        },

        playerWithfuelCollision: () => {
            this.fuelTanks.forEach((fuelTank, fuelPostion) => {
                if (fuelTank.position.x > this.player.pos.x &&
                    fuelTank.position.x < this.player.pos.x + this.player.width &&
                    fuelTank.position.y + fuelTank.height > this.player.pos.y &&
                    fuelTank.position.y + fuelTank.height < this.player.pos.y + this.player.height) {



                    this.fuelTanks.splice(fuelPostion, 1);

                    this.player.fuelLevel = 20;

                }
            })
        }
    }



}


window.addEventListener("load", () => {
    window.game = new Game()

})
