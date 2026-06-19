import { createSocketClient } from "./net/index.js";
import { createPredictionSystem } from "./net/index.js";
import { createInterpolationSystem } from "./net/index.js";
import { createKeyboardInput } from "./input/index.js";
import { createRenderer, createUI } from "./render/index.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socketClient = createSocketClient();
const keyboard = createKeyboardInput();
const prediction = createPredictionSystem();
const interpolation = createInterpolationSystem();
const renderer = createRenderer(ctx, canvas);
const ui = createUI();

let myId = null;
let lobby = null;
let serverState = null;
let renderState = null;
let gameStarted = false;
let lastRenderTime = performance.now();

function handleLobby(payload) {
  lobby = payload;

  if (payload?.state === "playing") {
    gameStarted = true;
    ui.showGame();
  } else {
    gameStarted = false;
    ui.showLobby();
  }

  ui.renderLobby(lobby, myId);
}

function handleHostChanged(hostId) {
  if (!lobby) return;
  lobby.hostId = hostId;
  ui.renderLobby(lobby, myId);
}

function handleGameStarted() {
  gameStarted = true;
  ui.showGame();
}

function handleReconnect(playerId) {
  myId = playerId ?? myId;

  if (lobby?.state === "playing") {
    gameStarted = true;
    ui.showGame();
  }
}

function handleState(message) {
  serverState = message.compactState ?? message.state ?? message.fullState ?? message;
  interpolation.pushSnapshot(message);
  prediction.acknowledge(message.lastProcessedInput, serverState, myId);
}

window.returnToMenu = () => {
  localStorage.removeItem("arenaToken");
  localStorage.removeItem("arenaLobby");
  location.reload();
};

socketClient.setHandlers({
  onState: handleState,
  onLobby: handleLobby,
  onGameStarted: handleGameStarted,
  onHostChanged: handleHostChanged,
  onReconnect: handleReconnect
});

function bindButtons() {
  document.getElementById("createBtn").onclick = () => {
    socketClient.send({ type: "createLobby" });
  };

  document.getElementById("joinBtn").onclick = () => {
    socketClient.send({
      type: "joinLobby",
      code: document.getElementById("roomCode").value.toUpperCase()
    });
  };

  document.getElementById("readyBtn").onclick = () => {
    socketClient.send({ type: "ready" });
  };

  document.getElementById("startBtn").onclick = () => {
    socketClient.send({ type: "startGame" });
  };
}

socketClient.connect();
bindButtons();
keyboard.bind();

function loop() {
  requestAnimationFrame(loop);

  const now = performance.now();
  const dt = Math.min(0.05, (now - lastRenderTime) / 1000 || 0);
  lastRenderTime = now;

  if (!gameStarted) return;

  prediction.step({
    myId,
    serverState,
    input: keyboard.getState(),
    dt,
    now,
    send: socketClient.send
  });

  renderState = interpolation.getInterpolatedState(
    serverState,
    myId,
    prediction.getPredictedLocalPlayer()
  );

  renderer.draw(renderState, myId);
  ui.updateHud(renderState, myId);
}

loop();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
