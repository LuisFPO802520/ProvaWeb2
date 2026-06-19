import { INPUT_SEND_INTERVAL, LOCAL_CORRECTION_EASING, LOCAL_CORRECTION_THRESHOLD } from "../../shared/index.js";

function clonePlayer(player) {
  if (!player) return null;

  return {
    id: player.id,
    name: player.name ?? "Player",
    x: Number(player.x) || 0,
    y: Number(player.y) || 0,
    radius: Number(player.radius) || 20,
    speed: Number(player.speed) || 250,
    hp: Number(player.hp) || 0,
    maxHp: Number(player.maxHp) || 100,
    dead: !!player.dead,
    eliminated: !!player.eliminated,
    lives: Number.isFinite(player.lives) ? player.lives : 3,
    maxLives: Number.isFinite(player.maxLives) ? player.maxLives : 3,
    aimX: Number.isFinite(player.aimX) ? player.aimX : 1,
    aimY: Number.isFinite(player.aimY) ? player.aimY : 0,
    score: Number(player.score) || 0,
    shootCooldown: Number(player.shootCooldown) || 0,
    lastProcessedInput: Number(player.lastProcessedInput) || -1,
    input: player.input ? { ...player.input } : { up: false, down: false, left: false, right: false }
  };
}

function extractPlayer(state, myId) {
  if (!state || myId === null || myId === undefined) return null;

  const players = state.players ?? state.pl ?? {};
  return players[String(myId)] ?? players[myId] ?? null;
}

function extractMap(state) {
  return state?.map ?? state?.m ?? { width: 1500, height: 1500 };
}

function applyInput(player, input, dt, map) {
  if (!player || player.dead || player.eliminated) return player;

  let vx = 0;
  let vy = 0;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;

  const len = Math.hypot(vx, vy);
  if (len > 0) {
    vx /= len;
    vy /= len;
    player.aimX = vx;
    player.aimY = vy;
  }

  const speed = Number(player.speed) || 250;
  const width = map?.width ?? 1500;
  const height = map?.height ?? 1500;

  player.x += vx * speed * dt;
  player.y += vy * speed * dt;
  player.x = Math.max(0, Math.min(width, player.x));
  player.y = Math.max(0, Math.min(height, player.y));

  return player;
}

export function createPredictionSystem() {
  let predictedLocalPlayer = null;
  let inputSequence = 0;
  let lastSentAt = 0;
  let lastAcknowledgedInput = -1;
  const pendingInputs = [];

  function step({ myId, serverState, input, dt, now, send }) {
    const authoritative = extractPlayer(serverState, myId);
    if (!authoritative) return;

    if (!predictedLocalPlayer) {
      predictedLocalPlayer = clonePlayer(authoritative);
    }

    const shouldSend = now - lastSentAt >= INPUT_SEND_INTERVAL;
    if (shouldSend && typeof send === "function") {
      const packet = {
        type: "input",
        sequence: inputSequence++,
        input: { ...input },
        clientTime: Date.now()
      };

      pendingInputs.push(packet);
      send(packet);
      lastSentAt = now;
    }

    predictedLocalPlayer.input = { ...input };
    applyInput(predictedLocalPlayer, input, dt, extractMap(serverState));
  }

  function acknowledge(lastProcessedInput, serverState, myId) {
    const authoritative = extractPlayer(serverState, myId);
    if (!authoritative) return;

    if (typeof lastProcessedInput === "number") {
      lastAcknowledgedInput = Math.max(lastAcknowledgedInput, lastProcessedInput);
      while (pendingInputs.length && pendingInputs[0].sequence <= lastAcknowledgedInput) {
        pendingInputs.shift();
      }
    }

    const base = clonePlayer(authoritative);
    if (!predictedLocalPlayer) {
      predictedLocalPlayer = base;
      return;
    }

    for (const packet of pendingInputs) {
      applyInput(base, packet.input, INPUT_SEND_INTERVAL / 1000, extractMap(serverState));
    }

    const dx = base.x - predictedLocalPlayer.x;
    const dy = base.y - predictedLocalPlayer.y;
    const distance = Math.hypot(dx, dy);

    if (distance > LOCAL_CORRECTION_THRESHOLD) {
      predictedLocalPlayer.x += dx * LOCAL_CORRECTION_EASING;
      predictedLocalPlayer.y += dy * LOCAL_CORRECTION_EASING;
    } else {
      predictedLocalPlayer.x = base.x;
      predictedLocalPlayer.y = base.y;
    }

    predictedLocalPlayer.hp = base.hp;
    predictedLocalPlayer.maxHp = base.maxHp;
    predictedLocalPlayer.dead = base.dead;
    predictedLocalPlayer.eliminated = base.eliminated;
    predictedLocalPlayer.lives = base.lives;
    predictedLocalPlayer.maxLives = base.maxLives;
    predictedLocalPlayer.aimX = base.aimX;
    predictedLocalPlayer.aimY = base.aimY;
    predictedLocalPlayer.score = base.score;
    predictedLocalPlayer.shootCooldown = base.shootCooldown;
    predictedLocalPlayer.lastProcessedInput = base.lastProcessedInput;
    predictedLocalPlayer.input = base.input;
  }

  function getPredictedLocalPlayer() {
    return predictedLocalPlayer ? clonePlayer(predictedLocalPlayer) : null;
  }

  return {
    step,
    acknowledge,
    getPredictedLocalPlayer
  };
}
