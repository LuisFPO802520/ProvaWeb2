export function createSocketClient() {
  const socket = new WebSocket(`ws://${location.host}`);
  let handlers = {};
  const queue = [];

  function setHandlers(nextHandlers) {
    handlers = { ...handlers, ...nextHandlers };
  }

  function flushQueue() {
    while (queue.length > 0 && socket.readyState === WebSocket.OPEN) {
      const item = queue.shift();
      socket.send(JSON.stringify(item));
    }
  }

  function send(obj) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(obj));
      return true;
    }

    queue.push(obj);
    return false;
  }

  socket.onopen = () => {
    flushQueue();
  };

  socket.onclose = () => {};
  socket.onerror = () => {};

  socket.onmessage = (e) => {
    const m = JSON.parse(e.data);

    if (m.type === "init") {
      handlers.onReconnect?.(m.playerId);
      return;
    }

    if (m.type === "lobbyCreated" || m.type === "joinedLobby" || m.type === "lobbyUpdate") {
      handlers.onLobby?.(m);
      return;
    }

    if (m.type === "hostChanged") {
      handlers.onHostChanged?.(m.hostId);
      return;
    }

    if (m.type === "gameStarted") {
      handlers.onGameStarted?.();
      return;
    }

    if (m.type === "state") {
      handlers.onState?.(m);
      return;
    }

    if (m.type === "error") {
      handlers.onError?.(m.message);
    }
  };

  return {
    connect() {},
    send,
    setHandlers
  };
}