const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");

const { Player } = require("./entities");
const { Game } = require("./game");
const { createLobby, getLobby, lobbies } = require("./net/lobbyManager");

const app = express();

app.use(express.static(path.join(__dirname, "../../public")));
app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let nextPlayerId = 1;
let currentTick = 0;

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function serializePlayerForLobby(player, lobby) {
  return {
    id: player.id,
    ready: player.ready,
    connected: player.connected,
    isHost: player.id === lobby.hostId
  };
}

function broadcastLobby(lobby) {
  const players = Object.values(lobby.players).map((p) =>
    serializePlayerForLobby(p, lobby)
  );

  Object.values(lobby.players).forEach((player) => {
    send(player.ws, {
      type: "lobbyUpdate",
      code: lobby.code,
      hostId: lobby.hostId,
      state: lobby.state,
      players
    });
  });
}

function startGame(lobby) {
  lobby.state = "playing";
  lobby.game = new Game();

  Object.values(lobby.players).forEach((player) => {
    player.entity = new Player(player.id);
    player.entity.x = 750 + Math.random() * 100 - 50;
    player.entity.y = 750 + Math.random() * 100 - 50;
    player.entity.lastProcessedInput = -1;
  });

  broadcastLobby(lobby);

  Object.values(lobby.players).forEach((player) => {
    send(player.ws, { type: "gameStarted" });
  });
}

function findPlayerByToken(token, code) {
  const lobby = getLobby(code);
  if (!lobby) return null;

  for (const id in lobby.players) {
    const p = lobby.players[id];
    if (p.token === token) {
      return { lobby, player: p };
    }
  }

  return null;
}

wss.on("connection", (ws) => {
  let currentLobby = null;
  let currentPlayer = null;

  ws.on("message", (raw) => {
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    switch (data.type) {
      case "createLobby": {
        const lobby = createLobby();
        const id = nextPlayerId++;
        const token = crypto.randomUUID();

        const player = {
          id,
          token,
          ws,
          ready: false,
          connected: true,
          entity: null,
          lastProcessedInput: -1
        };

        lobby.players[id] = player;
        lobby.hostId = id;
        lobby.state = "waiting";

        currentLobby = lobby;
        currentPlayer = player;

        send(ws, { type: "init", playerId: id, token, code: lobby.code });
        send(ws, { type: "lobbyCreated", code: lobby.code });
        broadcastLobby(lobby);
        break;
      }

      case "joinLobby": {
        const lobby = getLobby(data.code);

        if (!lobby) {
          send(ws, { type: "error", message: "Sala inexistente" });
          return;
        }

        if (Object.keys(lobby.players).length >= 2) {
          send(ws, { type: "error", message: "Sala cheia" });
          return;
        }

        const id = nextPlayerId++;
        const token = crypto.randomUUID();

        const player = {
          id,
          token,
          ws,
          ready: false,
          connected: true,
          entity: null,
          lastProcessedInput: -1
        };

        lobby.players[id] = player;

        currentLobby = lobby;
        currentPlayer = player;

        send(ws, { type: "init", playerId: id, token, code: lobby.code });
        send(ws, { type: "joinedLobby", code: lobby.code });
        broadcastLobby(lobby);
        break;
      }

      case "ready": {
        if (!currentPlayer) return;
        currentPlayer.ready = !currentPlayer.ready;
        broadcastLobby(currentLobby);
        break;
      }

      case "startGame": {
        if (!currentLobby) return;
        if (currentPlayer.id !== currentLobby.hostId) return;

        const players = Object.values(currentLobby.players);
        const connectedPlayers = players.filter((p) => p.connected);

        if (connectedPlayers.length < 1) return;
        if (!connectedPlayers.every((p) => p.ready)) return;
        if (!players.every((p) => p.ready)) return;

        startGame(currentLobby);
        break;
      }

      case "input": {
        if (!currentPlayer?.entity) return;

        const sequence = Number.isFinite(data.sequence) ? data.sequence : -1;
        const input = data.input && typeof data.input === "object" ? data.input : {};

        currentPlayer.entity.input = {
          up: !!input.up,
          down: !!input.down,
          left: !!input.left,
          right: !!input.right
        };

        currentPlayer.entity.lastProcessedInput = sequence;
        currentPlayer.lastProcessedInput = sequence;
        break;
      }

      case "reconnect": {
        const result = findPlayerByToken(data.token, data.code);
        if (!result) return;

        result.player.ws = ws;
        result.player.connected = true;

        currentLobby = result.lobby;
        currentPlayer = result.player;

        send(ws, {
          type: "reconnected",
          playerId: currentPlayer.id
        });

        broadcastLobby(currentLobby);

        if (currentLobby.state === "playing") {
          const players = {};
          Object.values(currentLobby.players).forEach((p) => {
            if (p.entity) players[p.id] = p.entity;
          });

          const compactState = currentLobby.game.getCompactState(players);

          send(ws, {
            type: "state",
            tick: currentTick,
            serverTime: Date.now(),
            lastProcessedInput:
              currentPlayer.lastProcessedInput ??
              currentPlayer.entity?.lastProcessedInput ??
              -1,
            state: compactState,
            compactState,
            protocol: "compact-v2"
          });
        }

        break;
      }
    }
  });

  ws.on("close", () => {
    if (!currentPlayer || !currentLobby) return;

    currentPlayer.connected = false;
    broadcastLobby(currentLobby);
  });
});

setInterval(() => {
  for (const code in lobbies) {
    const lobby = lobbies[code];

    if (lobby.state !== "playing") continue;

    const players = {};

    Object.values(lobby.players).forEach((p) => {
      if (p.entity) players[p.id] = p.entity;
    });

    lobby.game.update(players, DT);

    const compactState = lobby.game.getCompactState(players);

    Object.values(lobby.players).forEach((p) => {
      send(p.ws, {
        type: "state",
        tick: currentTick++,
        serverTime: Date.now(),
        lastProcessedInput: p.lastProcessedInput ?? p.entity?.lastProcessedInput ?? -1,
        state: compactState,
        compactState,
        protocol: "compact-v2"
      });
    });
  }
}, 1000 / TICK_RATE);

server.listen(3000, () => {
  console.log("Servidor rodando:");
  console.log("http://localhost:3000");
});