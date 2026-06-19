const lobbies = {};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createLobby() {
  let code;
  do { code = generateCode(); } while (lobbies[code]);
  lobbies[code] = { code, players: {}, game: null, createdAt: Date.now() };
  return lobbies[code];
}

function getLobby(code) { return lobbies[code]; }
function removeLobby(code) { delete lobbies[code]; }

module.exports = { lobbies, createLobby, getLobby, removeLobby };
