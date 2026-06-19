export function createKeyboardInput() {
  const state = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  function onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === "w") state.up = true;
    if (key === "s") state.down = true;
    if (key === "a") state.left = true;
    if (key === "d") state.right = true;
  }

  function onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === "w") state.up = false;
    if (key === "s") state.down = false;
    if (key === "a") state.left = false;
    if (key === "d") state.right = false;
  }

  return {
    bind() {
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    },
    getState() {
      return { ...state };
    }
  };
}