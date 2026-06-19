export const MAP_WIDTH = 1500;
export const MAP_HEIGHT = 1500;

// A área jogável é 1500x1500.
// A imagem de fundo é maior e começa antes da área jogável,
// então os prédios ficam fora da arena, onde o player não consegue atravessar.
export const BACKGROUND_X = -750;
export const BACKGROUND_Y = -750;
export const BACKGROUND_WIDTH = 3000;
export const BACKGROUND_HEIGHT = 3000;

export const TICK_RATE = 20;
export const DT = 1 / TICK_RATE;

export const INPUT_SEND_INTERVAL = 50;
export const SNAPSHOT_BUFFER_SIZE = 60;
export const INTERPOLATION_DELAY = 100;

export const LOCAL_CORRECTION_THRESHOLD = 120;
export const LOCAL_CORRECTION_EASING = 0.18;

export const GRID_CELL_SIZE = 140;
export const STATE_HISTORY_SIZE = 120;
export const MAX_SNAPSHOT_TTL = 8;

// Zoom da câmera. 1 = tamanho normal, 0.67 = parecido com Ctrl - no navegador.
export const CAMERA_ZOOM = 0.67;
