function cloneSnapshot(snap) {
  if (!snap) return null;
  return JSON.parse(JSON.stringify(snap));
}

module.exports = { cloneSnapshot };