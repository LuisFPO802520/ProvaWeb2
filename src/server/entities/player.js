class Player {
  constructor(id, name = "Player") {
    this.id = id;
    this.name = name;
    this.x = 750;
    this.y = 750;
    this.radius = 20;
    this.speed = 250;
    this.hp = 100;
    this.maxHp = 100;
    this.dead = false;
    this.eliminated = false;
    this.maxLives = 3;
    this.lives = 3;
    this.score = 0;
    this.input = { up: false, down: false, left: false, right: false };
    this.aimX = 1;
    this.aimY = 0;
    this.shootCooldown = 0;
    this.lastProcessedInput = -1;
  }
}

module.exports = { Player };
