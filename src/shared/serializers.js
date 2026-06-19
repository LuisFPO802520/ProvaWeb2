export function serializePlayer(player) {
  if (!player) return null;
  return {
    id: player.id,
    name: player.name,
    x: player.x,
    y: player.y,
    radius: player.radius,
    speed: player.speed,
    hp: player.hp,
    maxHp: player.maxHp,
    dead: player.dead,
    score: player.score,
    input: {
      up: !!player.input?.up,
      down: !!player.input?.down,
      left: !!player.input?.left,
      right: !!player.input?.right
    },
    shootCooldown: player.shootCooldown,
    lastProcessedInput: player.lastProcessedInput ?? -1
  };
}

export function serializeMonster(monster) {
  if (!monster) return null;
  return {
    id: monster.id,
    type: monster.type,
    x: monster.x,
    y: monster.y,
    radius: monster.radius,
    hp: monster.hp,
    maxHp: monster.maxHp,
    speed: monster.speed,
    damage: monster.damage
  };
}

export function serializeProjectile(projectile) {
  if (!projectile) return null;
  return {
    id: projectile.id,
    ownerId: projectile.ownerId,
    x: projectile.x,
    y: projectile.y,
    vx: projectile.vx,
    vy: projectile.vy,
    radius: projectile.radius,
    damage: projectile.damage,
    life: projectile.life
  };
}
