class Projectile {
  constructor(id, ownerId, x, y, vx, vy) {
    this.id = id;
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.damage = 20;
    this.life = 3.0;
  }
}

module.exports = { Projectile };
