export function createUI() {
  const menu = document.getElementById("menu");
  const lobbyEl = document.getElementById("lobby");
  const hud = document.getElementById("hud");
  const gameCanvas = document.getElementById("game");
  const playerList = document.getElementById("playerList");
  const lobbyCode = document.getElementById("lobbyCode");
  const hostInfo = document.getElementById("hostInfo");
  const bossBar = document.getElementById("bossBar");
  const bossWrap = document.getElementById("bossBarContainer");
  const waveEl = document.getElementById("wave");
  const scoreEl = document.getElementById("score");
  const gameOver = document.getElementById("gameOver");
  const gameOverText = document.getElementById("gameOverText");

  function showMenu() {
    menu.classList.remove("hidden");
    lobbyEl.classList.add("hidden");
    hud.classList.add("hidden");
    gameCanvas.classList.add("hidden");
    gameOver.classList.add("hidden");
  }

  function showLobby() {
    menu.classList.add("hidden");
    lobbyEl.classList.remove("hidden");
    hud.classList.add("hidden");
    gameCanvas.classList.add("hidden");
    gameOver.classList.add("hidden");
  }

  function showGame() {
    menu.classList.add("hidden");
    lobbyEl.classList.add("hidden");
    gameCanvas.classList.remove("hidden");
    hud.classList.remove("hidden");
    gameOver.classList.add("hidden");
  }

  function renderLobby(lobby, myId) {
    if (!lobby) return;

    lobbyCode.innerText = `Código: ${lobby.code}`;
    hostInfo.innerText = `Host: P${lobby.hostId}`;
    playerList.innerHTML = "";

    (lobby.players || []).forEach((p) => {
      const d = document.createElement("div");
      d.className = "playerCard" + (p.ready ? " playerReady" : "");
      d.innerText = `P${p.id} ${p.isHost ? "👑" : ""} ${p.connected ? "" : "(offline)"}`;
      playerList.appendChild(d);
    });

    const me = (lobby.players || []).find((p) => p.id === myId);
    document.getElementById("startBtn").style.display = me?.isHost ? "block" : "none";
  }

  function updateHud(state, myId) {
    if (!state) return;

    waveEl.innerText = `Onda ${state.wave ?? state.w ?? 1}`;

    const local = state.players?.[myId] ?? state.pl?.[myId] ?? null;
    scoreEl.innerText = `Pontos: ${local?.score ?? local?.c ?? 0}`;

    const monsters = state.monsters ?? state.mo ?? [];
    const boss = monsters.find((m) => m.type === "boss" || m.t === "boss");

    if (boss) {
      bossWrap.classList.remove("hidden");
      const hp = boss.hp ?? boss.h ?? 0;
      const maxHp = boss.maxHp ?? boss.m ?? 1;
      bossBar.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
    } else {
      bossWrap.classList.add("hidden");
    }

    const victory = !!(state.victory || state.v);
    const ended = !!(state.gameOver || state.g || victory);

    if (ended) {
      gameOver.classList.remove("hidden");
      gameOverText.innerText = victory ? "VITÓRIA" : "DERROTA";
    } else {
      gameOver.classList.add("hidden");
    }
  }

  return {
    showMenu,
    showLobby,
    showGame,
    renderLobby,
    updateHud
  };
}
