import {
  BACKGROUND_X,
  BACKGROUND_Y,
  BACKGROUND_WIDTH,
  BACKGROUND_HEIGHT,
  CAMERA_ZOOM
} from "../../shared/index.js";

const mapBackground = new Image();
mapBackground.src = "/assets/cyberpunk-map.png";
mapBackground.onload = () => {
  mapBackground.loaded = true;
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    img.loaded = true;
  };
  return img;
}

function loadFrameList(basePath, prefix, action, count) {
  const frames = [];
  for (let i = 1; i <= count; i++) {
    frames.push(loadImage(`${basePath}/${prefix}-${action}-${i}.png`));
  }
  return frames;
}

const playerSprites = {
  male: {
    idle: loadImage("/assets/sprites/players/male01-idle.png"),
    walk: loadFrameList("/assets/sprites/players", "male01", "walk", 6),
    diagUp: loadFrameList("/assets/sprites/players", "male01", "diagup", 6),
    diagDown: loadFrameList("/assets/sprites/players", "male01", "diagdown", 6)
  },
  female: {
    idle: loadImage("/assets/sprites/players/female01-idle.png"),
    walk: loadFrameList("/assets/sprites/players", "female01", "walk", 6),
    diagUp: loadFrameList("/assets/sprites/players", "female01", "diagup", 6),
    diagDown: loadFrameList("/assets/sprites/players", "female01", "diagdown", 6)
  }
};

const projectileSprite = loadImage("/assets/sprites/projectiles/projectile01-straight1.png");
const projectileDiagSprite = loadImage("/assets/sprites/projectiles/projectile01-diag.png");

export function createRenderer(ctx, canvas) {
  const camera = { x: 0, y: 0 };

  function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function getBackgroundBounds(map) {
    const bg = map?.background;

    return {
      x: bg?.x ?? BACKGROUND_X,
      y: bg?.y ?? BACKGROUND_Y,
      width: bg?.width ?? BACKGROUND_WIDTH,
      height: bg?.height ?? BACKGROUND_HEIGHT
    };
  }

  function getViewportWorldSize() {
    return {
      width: canvas.width / CAMERA_ZOOM,
      height: canvas.height / CAMERA_ZOOM
    };
  }

  function clampCameraToBackground(bg) {
    const viewport = getViewportWorldSize();

    const minX = bg.x;
    const minY = bg.y;
    const maxX = bg.x + bg.width - viewport.width;
    const maxY = bg.y + bg.height - viewport.height;

    if (maxX >= minX) {
      camera.x = Math.max(minX, Math.min(maxX, camera.x));
    } else {
      camera.x = bg.x + bg.width / 2 - viewport.width / 2;
    }

    if (maxY >= minY) {
      camera.y = Math.max(minY, Math.min(maxY, camera.y));
    } else {
      camera.y = bg.y + bg.height / 2 - viewport.height / 2;
    }
  }

  function drawMapBackground(map) {
    const bg = getBackgroundBounds(map);

    // Cor de segurança caso a câmera veja além da imagem em telas muito grandes.
    ctx.fillStyle = "#101624";
    ctx.fillRect(bg.x - 2000, bg.y - 2000, bg.width + 4000, bg.height + 4000);

    if (mapBackground.loaded) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mapBackground, bg.x, bg.y, bg.width, bg.height);
      return;
    }

    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(bg.x, bg.y, bg.width, bg.height);
  }

  function drawPlayableBorder(bounds) {
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, bounds.width, bounds.height);
  }

  function getInput(entity) {
    return entity?.input ?? entity?.ic ?? {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }

  function isMoving(input) {
    return input.up || input.down || input.left || input.right;
  }

  function getFrame(frames, frameMs = 110) {
    const frame = Math.floor(performance.now() / frameMs) % frames.length;
    return frames[frame];
  }

  function choosePlayerSprite(player) {
    const id = Number(player.id ?? player.i ?? 1);
    const set = id % 2 === 0 ? playerSprites.female : playerSprites.male;
    const input = getInput(player);

    let flip = false;
    let image = set.idle;

    if (isMoving(input)) {
      if (input.up && (input.left || input.right)) {
        image = getFrame(set.diagUp);
        flip = !!input.left;
      } else if (input.down && (input.left || input.right)) {
        image = getFrame(set.diagDown);
        flip = !!input.left;
      } else if (input.up) {
        image = getFrame(set.diagUp);
      } else if (input.down) {
        image = getFrame(set.diagDown);
      } else if (input.left || input.right) {
        image = getFrame(set.walk);
        flip = !!input.left;
      }
    }

    return { image, flip };
  }

  function drawImageCentered(image, x, y, width, height, flip = false) {
    if (!image?.loaded) return false;

    ctx.save();
    ctx.translate(x, y);

    if (flip) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      image,
      -width / 2,
      -height / 2,
      width,
      height
    );

    ctx.restore();
    return true;
  }

  function drawPlayerLives(player, x, y, spriteSize) {
    const maxLives = Math.max(1, Number(player.maxLives ?? player.ml ?? 3) || 3);
    const lives = Math.max(0, Number(player.lives ?? player.l ?? maxLives) || 0);
    const dotRadius = 4.5;
    const gap = 5;
    const totalWidth = maxLives * dotRadius * 2 + (maxLives - 1) * gap;
    const startX = x - totalWidth / 2 + dotRadius;
    const yPos = y - spriteSize / 2 - 12;

    for (let i = 0; i < maxLives; i++) {
      const cx = startX + i * (dotRadius * 2 + gap);
      const filled = i < lives;

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.arc(cx, yPos, dotRadius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = filled ? "#ff3b5f" : "rgba(255, 255, 255, 0.22)";
      ctx.beginPath();
      ctx.arc(cx, yPos, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(player, myId) {
    if (player.eliminated) return;

    const x = player.x;
    const y = player.y;
    const radius = player.radius ?? player.r ?? 20;
    const id = player.id ?? player.i;
    const isLocalPlayer = String(id) === String(myId);
    const isDead = !!player.dead;

    const { image, flip } = choosePlayerSprite(player);
    const size = radius * 5.6;

    ctx.save();
    if (isDead) {
      ctx.globalAlpha = 0.45;
    }

    // Pequena sombra no chão para ajudar a leitura do sprite.
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.75, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawn = drawImageCentered(image, x, y, size, size, flip);

    if (!drawn) {
      drawCircle(x, y, radius, isLocalPlayer ? "cyan" : "lime");
    }

    ctx.restore();

    drawPlayerLives(player, x, y, size);
  }

  function drawProjectile(projectile) {
    const x = projectile.x;
    const y = projectile.y;
    const vx = projectile.vx ?? 1;
    const vy = projectile.vy ?? 0;
    const radius = projectile.radius ?? projectile.r ?? 5;
    const angle = Math.atan2(vy, vx);
    const useDiag = Math.abs(vx) > 0.1 && Math.abs(vy) > 0.1;
    const img = useDiag ? projectileDiagSprite : projectileSprite;

    if (!img.loaded) {
      drawCircle(x, y, radius, "yellow");
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -radius * 4.4, -radius * 4.4, radius * 8.8, radius * 8.8);
    ctx.restore();
  }

  function drawMonster(monster) {
    const x = monster.x;
    const y = monster.y;
    const radius = monster.radius ?? monster.r ?? 18;
    const type = monster.type ?? monster.t;
    const isBoss = type === "boss";

    const body = isBoss ? "#9b002f" : "#6820a8";
    const border = isBoss ? "#ff2f61" : "#d94cff";
    const eye = isBoss ? "#ffdd55" : "#6dffea";

    // Sombra.
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.75, radius * 1.05, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chifres/pontas simples.
    ctx.fillStyle = border;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.7, y - radius * 0.45);
    ctx.lineTo(x - radius * 1.05, y - radius * 1.2);
    ctx.lineTo(x - radius * 0.25, y - radius * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + radius * 0.7, y - radius * 0.45);
    ctx.lineTo(x + radius * 1.05, y - radius * 1.2);
    ctx.lineTo(x + radius * 0.25, y - radius * 0.8);
    ctx.closePath();
    ctx.fill();

    // Corpo.
    ctx.fillStyle = body;
    ctx.strokeStyle = border;
    ctx.lineWidth = isBoss ? 4 : 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Olhos.
    ctx.fillStyle = eye;
    ctx.fillRect(x - radius * 0.45, y - radius * 0.2, radius * 0.28, radius * 0.22);
    ctx.fillRect(x + radius * 0.17, y - radius * 0.2, radius * 0.28, radius * 0.22);

    // Boca.
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.35, y + radius * 0.35);
    ctx.lineTo(x + radius * 0.35, y + radius * 0.35);
    ctx.stroke();

    // Barra de vida pequena.
    const hp = monster.hp ?? monster.h;
    const maxHp = monster.maxHp ?? monster.m;
    if (typeof hp === "number" && typeof maxHp === "number" && maxHp > 0) {
      const barWidth = radius * 2.2;
      const barHeight = 5;
      const percent = Math.max(0, Math.min(1, hp / maxHp));

      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(x - barWidth / 2, y - radius - 14, barWidth, barHeight);

      ctx.fillStyle = isBoss ? "#ff3355" : "#9dff5c";
      ctx.fillRect(x - barWidth / 2, y - radius - 14, barWidth * percent, barHeight);
    }
  }

  function draw(state, myId) {
    if (!state) return;

    const players = state.players ?? state.pl ?? {};
    const local = players?.[myId] ?? players?.[String(myId)];
    if (!local) return;

    const bounds = state.map ?? state.m ?? {
      width: 1500,
      height: 1500,
      background: {
        x: BACKGROUND_X,
        y: BACKGROUND_Y,
        width: BACKGROUND_WIDTH,
        height: BACKGROUND_HEIGHT
      }
    };

    const bg = getBackgroundBounds(bounds);

    const viewport = getViewportWorldSize();
    camera.x = local.x - viewport.width / 2;
    camera.y = local.y - viewport.height / 2;
    clampCameraToBackground(bg);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
    ctx.translate(-camera.x, -camera.y);

    drawMapBackground(bounds);
    drawPlayableBorder(bounds);

    (state.projectiles ?? state.pr ?? []).forEach(drawProjectile);
    (state.monsters ?? state.mo ?? []).forEach(drawMonster);

    Object.values(players).forEach((pl) => {
      drawPlayer(pl, myId);
    });

    ctx.restore();
  }

  return { draw };
}
