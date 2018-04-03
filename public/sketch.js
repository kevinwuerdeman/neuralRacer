let globalBoids = [];

/**
 * Create background and render agents
 *
 * @param {globalBoids} Collection of agents representing individual Nets.
 *
 */

function setup() {
  createCanvas(1000, 600);
  for (var i = 0; i < 40; i++) {
    globalBoids[i] = new Boid();
  }

}

/**
 * Define game logic for each round and record high score.
 */

function Game() {
  this.boids = [];
  this.score = 0;
  this.gen = 1 //[]; //array of networks
  this.alives = 0 // number of alive boids
  this.generation = 0
  this.topScore = 0;
}

//Constructor for generation of neural networks
let Neuvol = new Neuroevolution({
  population: 40,
  network: [4, [4], 3]
});

/**
 * Run at the start of each round after last boid dies in previous round
 *
 */

Game.prototype.new = function () {
  console.log(this.topScore)
  this.score = 0;
  this.generation++;
  this.gen = Neuvol.nextGeneration();
  if (this.generation > 1) {
    for (let i = 0; i < this.boids.length; i++) {
      globalBoids[i].reset()
    }
  }
  this.boids = globalBoids
  this.alives = this.boids.length;
}

/**
 * Runs throughout each round making networks decide what action to take to avoid walls
 */

Game.prototype.update = function () {
  for (let i = 0; i < this.boids.length; i++) {
    if (this.boids[i].alive) {
      // Feed inputes to NN here!!!!!!!!!

      let inputs = this.boids[i].findWalls()
      let res = this.gen[i].compute(inputs);
      let max = res.indexOf(Math.max(...res))

      if (res[0] > .7 && max === 0) {
        this.boids[i].turnRight()
      }
       else if (res[1] > .7 && max === 1) {
        this.boids[i].turnLeft()
      }
      else if (res[2] > .7 && max === 2) {
        this.boids[i].straight()
      }

      this.boids[i].run()
      if (this.boids[i].stuck) {
        if (this.boids[i].score > this.topScore) {
          this.topScore = this.boids[i].score;
        }
        this.boids[i].alive = false;
        this.alives--;
        Neuvol.networkScore(this.gen[i], this.score) //save network score at TO
        if (this.allDead()) {
          this.new();
        }
      }
    }
  }

  this.score++
  let me = this;
  setTimeout(function () {
    me.update();
  }, 20)
}

Game.prototype.allDead = function () {
  for (let i = 0; i < this.boids.length; i++) {
    if (this.boids[i].alive) {
      return false;
    }
  }
  return true
}

let game = new Game()


/**
 * draws and renders walls and boids
 */

function draw() {
  background(51);
  line(150, 460, 850, 460); //bottom
  line(150, 140, 850, 140); //Top
  line(150, 140, 150, 460); //Left
  line(850, 140, 850, 460); //right
  for (var i = 0; i < globalBoids.length; i++) {
    globalBoids[i].render();
  }
}

// Boid class
function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(2, 0);
  this.position = createVector(500, 70);
  this.r = 3.0;
  this.maxspeed = 10;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
  this.alive = true;
  this.stuck = false;
  this.nudges = [this.nudgeNorth, this.nudgeSouth, this.nudgeEast, this.nudgeWest]
  this.score = 0;
}

/**
 * Creates inputs which are piped into each neural network
 */

Boid.prototype.findWalls = function () {
  let north;
  let south;
  let east;
  let west;
  //South Lane
  if (this.position.y > 460 && (this.position.x >= 150 && this.position.x <= 850)) {
    north = this.position.y - 460;
    south = 600 - this.position.y;
    east = 1000 - this.position.x;
    west = this.position.x;
    return [north, south, east, west]
  }
  //West Lane
  if (this.position.x < 150 && (this.position.y >= 140 && this.position.y <= 460)) {
    north = this.position.y;
    south = 600 - this.position.y;
    east = 150 - this.position.x
    west = this.position.x;
    return [north, south, east, west]
  }
  //North Lane
  if (this.position.y < 140 && (this.position.x >= 150 && this.position.x <= 850)) {
    north = this.position.y;
    south = 140 - this.position.y;
    east = 1000 - this.position.x;
    west = this.position.x
    return [north, south, east, west]
  }
  //East Lane
  if (this.position.x > 850 && (this.position.y >= 140 && this.position.y <= 460)) {
    north = this.position.y;
    south = 600 - this.position.y;
    east = 1000 - this.position.x;
    west = this.position.x - 850;
    return [north, south, east, west]
  }
  //Corner
  else {
    console.log('corner')
    north = this.position.y;
    south = 600 - this.position.y;
    east = 1000 - this.position.x;
    west = this.position.x
    return [north, south, east, west]
  }
}

Boid.prototype.reset = function () {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(2, 0);
  this.position = createVector(500, 70);
  this.r = 3.0;
  this.maxspeed = 6;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
  this.alive = true;
  this.stuck = false;
  this.score = 0;
}
//Engine
Boid.prototype.run = function () {
  this.update();
  this.borders();
}


// Method to update location
Boid.prototype.update = function () {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset acceleration to 0 each cycle
  this.acceleration.mult(0);
}

// Draw boid as a circle
Boid.prototype.render = function () {
  fill(127, 127);
  stroke(200);
  triangle(this.position.x, this.position.y, this.position.x + 20, this.position.y, this.position.x + 10, this.position.y - 20)
}

// Wraparound
Boid.prototype.borders = function () {
  if (this.position.x < -this.r) {
    this.velocity = createVector(0, 0)
    this.stuck = true;
  }
  if (this.position.y < -this.r) {
    this.velocity = createVector(0, 0)
    this.stuck = true;
  }
  if (this.position.x > width) {
    this.velocity = createVector(0, 0)
    this.stuck = true;
  }
  if (this.position.y > height) {
    this.velocity = createVector(0, 0)
    this.stuck = true;
  }
  if (this.position.x > 150 && this.position.x < 850 && (this.position.y < 460 && this.position.y > 140)) {
    this.velocity = createVector(0, 0)
    this.stuck = true;
  }
}


/**
 * How Networks move straight
 */

Boid.prototype.straight = function () {
  if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
    if (this.velocity.x < 0) {
      this.velocity.x -= 0.3;
    } else {
      this.velocity.x += 0.3;
    }
  } else {
    if (this.velocity.y < 0) {
      this.velocity.y -= 0.3;
    } else {
      this.velocity.y += 0.3
    }
  }
}

/**
 * How Networks turn left
 */

Boid.prototype.turnLeft = function() {
  if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
    if (this.velocity.x > 0) {
      this.velocity.y -= 0.1
    } else {
      this.velocity.y += 0.1
    }
  } else {
    if (this.velocity.y > 0) {
      this.velocity.x -= 0.1
    } else {
      this.velocity.x += 0.1
    }
  }
}

/**
 * How Networks turn right
 */

Boid.prototype.turnRight = function() {
  if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
    if (this.velocity.x > 0) {
      this.velocity.y += 0.1;
    } else {
      this.velocity.y -= 0.1;
    }
  } else {
    if (this.velocity.y > 0) {
      this.velocity.x -= 0.1
    } else {
      this.velocity.x += 0.1
    }
  }
}

let skipButton = document.getElementById('skip');
let resetButton = document.getElementById('new');

skipButton.addEventListener('click', nextRound)
resetButton.addEventListener('click', () => {
  game.new()
  game.update()
})

function nextRound() {
  globalBoids.forEach(boid => {
    boid.stuck = true;
  })
}
