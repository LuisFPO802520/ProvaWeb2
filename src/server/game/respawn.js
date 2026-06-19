class RespawnManager {
  constructor(delaySeconds = 3) {
    this.delaySeconds = delaySeconds;
  }

  schedule(player, currentTime) {
    if (!player || player.dead || player.eliminated) return;

    player.lives = Math.max(0, (player.lives ?? 3) - 1);
    player.hp = 0;
    player.dead = true;

    if (player.lives <= 0) {
      player.eliminated = true;
      delete player.respawnAt;
      return;
    }

    player.respawnAt = currentTime + this.delaySeconds;
  }

  update(players, currentTime, spawnX, spawnY) {
    for (const id in players) {
      const p = players[id];
      if (!p || p.eliminated || !p.dead || typeof p.respawnAt !== "number") continue;
      if (currentTime < p.respawnAt) continue;

      p.dead = false;
      p.hp = p.maxHp;
      p.x = spawnX;
      p.y = spawnY;
      p.shootCooldown = 0;
      delete p.respawnAt;
    }
  }
}

module.exports = { RespawnManager };
