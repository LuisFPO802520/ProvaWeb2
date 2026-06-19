const { Monster, Boss, Projectile } = require("../entities");
const WAVES = require("./waves");
const { SpatialGrid } = require("./spatialGrid");
const { RespawnManager } = require("./respawn");

const MAP_WIDTH = 1500;
const MAP_HEIGHT = 1500;

// A área jogável é só o quadrado 1500x1500.
// O fundo é maior e fica deslocado para os prédios aparecerem fora dessa área.
const BACKGROUND_X = -750;
const BACKGROUND_Y = -750;
const BACKGROUND_WIDTH = 3000;
const BACKGROUND_HEIGHT = 3000;

const GRID_CELL_SIZE = 140;
const STATE_HISTORY_SIZE = 120;
const MAX_SNAPSHOT_TTL = 8;
const PROJECTILE_SPEED = 700;


class Game {
  constructor() {
    this.wave = 1;
    this.monsters = [];
    this.projectiles = [];
    this.projectileId = 1;
    this.monsterId = 1;
    this.gameOver = false;
    this.victory = false;
    this.tick = 0;
    this.time = 0;
    this.history = [];
    this.grid = new SpatialGrid(GRID_CELL_SIZE, MAP_WIDTH, MAP_HEIGHT);
    this.respawn = new RespawnManager(3);
    this.spawnWave(1);
  }

  randomPosition() {
    return {
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT
    };
  }

  spawnWave(number) {
    this.monsters = [];

    const data = WAVES[number - 1];
    if (!data) {
      this.victory = true;
      this.gameOver = true;
      return;
    }

    this.wave = number;

    if (data.boss) {
      const boss = new Boss(this.monsterId++, MAP_WIDTH / 2, MAP_HEIGHT / 2);
      boss.hp = data.hp;
      boss.maxHp = data.hp;
      this.monsters.push(boss);
      return;
    }

    for (let i = 0; i < data.count; i++) {
      const pos = this.randomPosition();
      this.monsters.push(new Monster(this.monsterId++, pos.x, pos.y, data.hp));
    }
  }

  distanceSq(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  clampToMap(entity) {
    entity.x = Math.max(0, Math.min(MAP_WIDTH, entity.x));
    entity.y = Math.max(0, Math.min(MAP_HEIGHT, entity.y));
  }

  rebuildGrid() {
    this.grid.clear();
    for (const monster of this.monsters) {
      this.grid.insert(monster);
    }
  }

  update(players, dt) {
    if (this.gameOver || this.victory) return;

    this.tick += 1;
    this.time += dt;

    this.updatePlayers(players, dt);
    this.respawn.update(players, this.time, MAP_WIDTH / 2, MAP_HEIGHT / 2);
    this.rebuildGrid();
    this.updateMonsters(players, dt);
    this.autoAttack(players, dt);
    this.updateProjectiles(players, dt);
    this.checkWave();
    this.checkGameOver(players);
    this.captureHistory(players);
    this.pruneHistory();
  }

  updatePlayers(players, dt) {
    for (const id in players) {
      const p = players[id];
      if (!p || p.dead || p.eliminated) continue;

      let vx = 0;
      let vy = 0;

      if (p.input?.up) vy -= 1;
      if (p.input?.down) vy += 1;
      if (p.input?.left) vx -= 1;
      if (p.input?.right) vx += 1;

      const len = Math.hypot(vx, vy);
      if (len > 0) {
        vx /= len;
        vy /= len;
        p.aimX = vx;
        p.aimY = vy;
      }

      p.x += vx * p.speed * dt;
      p.y += vy * p.speed * dt;
      this.clampToMap(p);
      p.shootCooldown = Math.max(0, (p.shootCooldown || 0) - dt);
    }
  }

  updateMonsters(players, dt) {
    for (const monster of this.monsters) {
      let target = null;
      let bestDistSq = Infinity;

      for (const id in players) {
        const p = players[id];
        if (!p || p.dead || p.eliminated) continue;

        const dSq = this.distanceSq(monster, p);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          target = p;
        }
      }

      if (!target) continue;

      const dx = target.x - monster.x;
      const dy = target.y - monster.y;
      const len = Math.hypot(dx, dy);

      if (len > 0) {
        monster.x += (dx / len) * monster.speed * dt;
        monster.y += (dy / len) * monster.speed * dt;
        this.clampToMap(monster);
      }

      if (len < monster.radius + target.radius) {
        target.hp -= monster.damage * dt;
        if (target.hp <= 0 && !target.dead) {
          target.hp = 0;
          this.respawn.schedule(target, this.time);
        }
      }
    }
  }

  autoAttack(players, dt) {
    for (const id in players) {
      const p = players[id];
      if (!p || p.dead || p.eliminated) continue;
      if ((p.shootCooldown || 0) > 0) continue;

      let aimX = Number.isFinite(p.aimX) ? p.aimX : 1;
      let aimY = Number.isFinite(p.aimY) ? p.aimY : 0;
      const len = Math.hypot(aimX, aimY) || 1;
      aimX /= len;
      aimY /= len;

      this.projectiles.push(new Projectile(
        this.projectileId++,
        p.id,
        p.x,
        p.y,
        aimX * PROJECTILE_SPEED,
        aimY * PROJECTILE_SPEED
      ));

      p.shootCooldown = 0.35;
    }
  }

  updateProjectiles(players, dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const nearbyMonsters = this.grid.queryCircle(p.x, p.y, 80);

      for (let j = nearbyMonsters.length - 1; j >= 0; j--) {
        const m = nearbyMonsters[j];
        const hitRadius = p.radius + m.radius;

        if (this.distanceSq(p, m) < hitRadius * hitRadius) {
          m.hp -= p.damage;
          this.projectiles.splice(i, 1);

          if (m.hp <= 0) {
            const owner = players[p.ownerId];
            if (owner) owner.score = (owner.score || 0) + 1;
            this.monsters = this.monsters.filter((monster) => monster.id !== m.id);
          }
          break;
        }
      }
    }
  }

  checkWave() {
    if (this.monsters.length === 0 && !this.victory) {
      this.spawnWave(this.wave + 1);
    }
  }

  checkGameOver(players) {
    const list = Object.values(players);
    if (list.length === 0) return;

    const everyoneEliminated = list.every((p) => p.eliminated);
    if (everyoneEliminated) {
      this.gameOver = true;
      this.victory = false;
    }
  }

  captureHistory(players) {
    this.history.push({
      tick: this.tick,
      time: this.time,
      wave: this.wave,
      map: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        background: {
          x: BACKGROUND_X,
          y: BACKGROUND_Y,
          width: BACKGROUND_WIDTH,
          height: BACKGROUND_HEIGHT
        }
      },
      monsters: this.monsters.map((m) => ({
        id: m.id,
        type: m.type,
        x: m.x,
        y: m.y,
        radius: m.radius,
        hp: m.hp,
        maxHp: m.maxHp,
        speed: m.speed,
        damage: m.damage
      })),
      projectiles: this.projectiles.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        radius: p.radius,
        damage: p.damage,
        life: p.life
      })),
      players: this.serializePlayers(players),
      victory: this.victory,
      gameOver: this.gameOver
    });
  }

  pruneHistory() {
    while (this.history.length > STATE_HISTORY_SIZE) {
      this.history.shift();
    }

    const cutoff = this.time - MAX_SNAPSHOT_TTL;
    while (this.history.length && this.history[0].time < cutoff) {
      this.history.shift();
    }
  }

  serializePlayers(players) {
    const out = {};

    for (const id in players) {
      const p = players[id];
      out[id] = {
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        radius: p.radius,
        speed: p.speed,
        hp: p.hp,
        maxHp: p.maxHp,
        dead: p.dead,
        eliminated: !!p.eliminated,
        lives: p.lives ?? 3,
        maxLives: p.maxLives ?? 3,
        score: p.score,
        input: {
          up: !!p.input?.up,
          down: !!p.input?.down,
          left: !!p.input?.left,
          right: !!p.input?.right
        },
        shootCooldown: p.shootCooldown,
        aimX: Number.isFinite(p.aimX) ? p.aimX : 1,
        aimY: Number.isFinite(p.aimY) ? p.aimY : 0,
        lastProcessedInput: p.lastProcessedInput ?? -1
      };
    }

    return out;
  }

  getState(players) {
    return {
      wave: this.wave,
      map: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        background: {
          x: BACKGROUND_X,
          y: BACKGROUND_Y,
          width: BACKGROUND_WIDTH,
          height: BACKGROUND_HEIGHT
        }
      },
      monsters: this.monsters.map((m) => ({
        id: m.id,
        type: m.type,
        x: m.x,
        y: m.y,
        radius: m.radius,
        hp: m.hp,
        maxHp: m.maxHp,
        speed: m.speed,
        damage: m.damage
      })),
      projectiles: this.projectiles.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        radius: p.radius,
        damage: p.damage,
        life: p.life
      })),
      players: this.serializePlayers(players),
      victory: this.victory,
      gameOver: this.gameOver,
      tick: this.tick,
      serverTime: Date.now()
    };
  }

  getCompactState(players) {
    const s = this.getState(players);
    return {
      w: s.wave,
      m: s.map,
      mo: s.monsters,
      pr: s.projectiles,
      pl: s.players,
      v: s.victory,
      g: s.gameOver,
      t: s.tick,
      s: s.serverTime
    };
  }
}

module.exports = {
  Game,
  MAP_WIDTH,
  MAP_HEIGHT,
  SpatialGrid
};
