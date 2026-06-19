const { normalizeInput } = require("./protocol");
const { lobbies, createLobby, getLobby, removeLobby } = require("./lobbyManager");

module.exports = {
  normalizeInput,
  lobbies,
  createLobby,
  getLobby,
  removeLobby
};
