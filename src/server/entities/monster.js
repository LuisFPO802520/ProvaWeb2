class Monster {
  constructor(id, x, y, hp) {
    this.id = id;
    this.type = "monster";
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = 70;
    this.damage = 15;
  }
}

module.exports = { Monster };