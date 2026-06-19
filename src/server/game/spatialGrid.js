class SpatialGrid {
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.cells = new Map();
  }

  clear() { this.cells.clear(); }
  key(cx, cy) { return `${cx},${cy}`; }
  clampCellX(x) { return Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize))); }
  clampCellY(y) { return Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize))); }

  insert(entity) {
    if (!entity) return;
    const cx = this.clampCellX(entity.x);
    const cy = this.clampCellY(entity.y);
    const key = this.key(cx, cy);
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push(entity);
  }

  queryCircle(x, y, radius) {
    const minX = this.clampCellX(x - radius);
    const maxX = this.clampCellX(x + radius);
    const minY = this.clampCellY(y - radius);
    const maxY = this.clampCellY(y + radius);
    const results = [];
    const seen = new Set();

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const entity of bucket) {
          if (seen.has(entity.id)) continue;
          seen.add(entity.id);
          results.push(entity);
        }
      }
    }

    return results;
  }
}

module.exports = { SpatialGrid };
