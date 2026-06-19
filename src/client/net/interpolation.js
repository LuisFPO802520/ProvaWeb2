import { INTERPOLATION_DELAY, SNAPSHOT_BUFFER_SIZE } from "../../shared/index.js";
import { clamp01, lerp } from "../../shared/index.js";

function entityId(entity) {
  return entity?.id ?? entity?.i ?? null;
}

function clonePlayerMap(players) {
  const out = {};
  for (const id in players || {}) {
    out[id] = { ...players[id] };
  }
  return out;
}

function cloneEntityList(list) {
  return (list || []).map((item) => ({ ...item }));
}

function normalizeState(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  const compact = state.compactState ?? state.state ?? state;

  return {
    wave: compact.wave ?? compact.w ?? 1,
    map: compact.map ?? compact.m ?? { width: 1500, height: 1500 },
    monsters: compact.monsters ?? compact.mo ?? [],
    projectiles: compact.projectiles ?? compact.pr ?? [],
    players: compact.players ?? compact.pl ?? {},
    victory: !!(compact.victory ?? compact.v),
    gameOver: !!(compact.gameOver ?? compact.g),
    tick: compact.tick ?? compact.t ?? 0,
    serverTime: compact.serverTime ?? compact.s ?? Date.now()
  };
}

function cloneState(state) {
  return {
    wave: state.wave,
    map: { ...state.map },
    monsters: cloneEntityList(state.monsters),
    projectiles: cloneEntityList(state.projectiles),
    players: clonePlayerMap(state.players),
    victory: !!state.victory,
    gameOver: !!state.gameOver,
    tick: state.tick,
    serverTime: state.serverTime
  };
}

function toMap(list) {
  const out = {};
  for (const item of list || []) {
    const id = entityId(item);
    if (id !== null) out[id] = item;
  }
  return out;
}

function interpolateEntityList(base, olderList, newerList, alpha, fields) {
  const oldMap = toMap(olderList);
  const newMap = toMap(newerList);

  for (const item of base) {
    const id = entityId(item);
    const a = oldMap[id];
    const b = newMap[id];
    if (!a || !b) continue;

    for (const field of fields) {
      if (typeof a[field] === "number" && typeof b[field] === "number") {
        item[field] = lerp(a[field], b[field], alpha);
      }
    }
  }
}

export function createInterpolationSystem() {
  const snapshots = [];

  function pushSnapshot(message) {
    snapshots.push({
      time: message.serverTime ?? Date.now(),
      state: normalizeState(message)
    });

    while (snapshots.length > SNAPSHOT_BUFFER_SIZE) {
      snapshots.shift();
    }
  }

  function getInterpolatedState(serverState, myId, predictedLocalPlayer) {
    const latest = serverState ? cloneState(normalizeState(serverState)) : null;

    if (snapshots.length < 2) {
      if (latest && myId && predictedLocalPlayer) {
        latest.players[String(myId)] = { ...predictedLocalPlayer };
      }
      return latest;
    }

    const renderTime = Date.now() - INTERPOLATION_DELAY;
    let older = null;
    let newer = null;

    for (let i = 0; i < snapshots.length - 1; i++) {
      if (snapshots[i].time <= renderTime && snapshots[i + 1].time >= renderTime) {
        older = snapshots[i];
        newer = snapshots[i + 1];
        break;
      }
    }

    const base = newer ? cloneState(newer.state) : cloneState(snapshots[snapshots.length - 1].state);

    if (!older || !newer) {
      if (base && myId && predictedLocalPlayer) {
        base.players[String(myId)] = { ...predictedLocalPlayer };
      }
      return base;
    }

    const span = Math.max(1, newer.time - older.time);
    const alpha = clamp01((renderTime - older.time) / span);

    const olderState = older.state;
    const newerState = newer.state;

    const oldPlayers = olderState.players ?? {};
    const newPlayers = newerState.players ?? {};
    for (const id of Object.keys(base.players)) {
      if (String(id) === String(myId) && predictedLocalPlayer) continue;
      const a = oldPlayers[id];
      const b = newPlayers[id];
      if (!a || !b) continue;
      base.players[id].x = lerp(a.x, b.x, alpha);
      base.players[id].y = lerp(a.y, b.y, alpha);
    }

    interpolateEntityList(base.monsters, olderState.monsters, newerState.monsters, alpha, ["x", "y", "hp"]);
    interpolateEntityList(base.projectiles, olderState.projectiles, newerState.projectiles, alpha, ["x", "y", "life"]);

    if (myId && predictedLocalPlayer) {
      base.players[String(myId)] = { ...predictedLocalPlayer };
    }

    return base;
  }

  return {
    pushSnapshot,
    getInterpolatedState
  };
}
