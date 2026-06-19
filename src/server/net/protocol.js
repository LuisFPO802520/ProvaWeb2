const MAX_MESSAGE_BYTES = 4096;
const WINDOW_MS = 1000;
const MAX_MESSAGES_PER_WINDOW = 40;
const rateState = new WeakMap();

function parseMessage(raw) {
  if (typeof raw !== "string" && !Buffer.isBuffer(raw)) return null;

  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function allowMessage(ws, raw) {
  const bytes = Buffer.isBuffer(raw)
    ? raw.byteLength
    : Buffer.byteLength(typeof raw === "string" ? raw : String(raw), "utf8");

  if (bytes > MAX_MESSAGE_BYTES) return false;

  const now = Date.now();
  const current = rateState.get(ws) ?? { windowStart: now, count: 0 };

  if (now - current.windowStart > WINDOW_MS) {
    current.windowStart = now;
    current.count = 0;
  }

  current.count += 1;
  rateState.set(ws, current);
  return current.count <= MAX_MESSAGES_PER_WINDOW;
}

function normalizeLobbyCode(code) {
  return String(code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
}

function normalizeToken(token) {
  return typeof token === "string" ? token : "";
}

function normalizeInput(input) {
  const raw = input && typeof input === "object" ? input : {};
  return {
    up: !!raw.up,
    down: !!raw.down,
    left: !!raw.left,
    right: !!raw.right
  };
}

function normalizeSequence(sequence) {
  return Number.isInteger(sequence) && sequence >= 0 ? sequence : -1;
}

module.exports = {
  parseMessage,
  allowMessage,
  normalizeLobbyCode,
  normalizeToken,
  normalizeInput,
  normalizeSequence
};
