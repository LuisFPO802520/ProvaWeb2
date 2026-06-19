class Boss {
  constructor(id, x, y) {
    this.id = id;
    this.type = "boss";
    this.x = x;
    this.y = y;
    this.radius = 60;
    this.hp = 3000;
    this.maxHp = 3000;
    this.speed = 40;
    this.damage = 30;
  }
}

module.exports = { Boss };
