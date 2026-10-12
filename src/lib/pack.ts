/**
 * Packs compartments into a rectangular bento tray.
 *
 * Items are placed in priority order at the free slot closest to the tray's
 * centre, so the most important things cluster around the keystone (the
 * first item, pinned to the exact centre). Whatever
 * holes remain inside the final rectangle come back as 1×1 fillers, which is
 * what makes the tray read as one solid box rather than scattered cards.
 */

/** `fixed` items keep their size; everything else may grow into empty strips. */
export type PackInput = { key: string; w: number; h: number; fixed?: boolean };
export type Placed = { key: string; col: number; row: number; w: number; h: number };
export type Packed = { cols: number; rows: number; placed: Placed[]; holes: { col: number; row: number }[] };

export function pack(items: PackInput[], cols: number): Packed {
  const area = items.reduce((sum, i) => sum + i.w * i.h, 0);
  // Smallest rectangle that can hold everything; grow a row at a time until
  // the greedy pass fits. A little slack becomes the 1×1 filler tiles.
  // Try a few contact weights per height and keep the layout with the fewest holes.
  for (let rows = Math.ceil(area / cols); rows < area; rows++) {
    const results = CONTACT_WEIGHTS.map((wgt) => tryPack(items, cols, rows, wgt)).filter((r) => r !== undefined);
    if (results.length) return results.reduce((a, b) => (b.holes.length < a.holes.length ? b : a));
  }
  throw new Error('pack: items do not fit');
}

const CONTACT_WEIGHTS = [0.35, 1, 2, 4];

function tryPack(items: PackInput[], cols: number, rows: number, contactWeight: number): Packed | undefined {
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const cx = cols / 2;
  const cy = rows / 2;
  const aspect = cols / rows;

  const fits = (c: number, r: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y][x]) return false;
    return true;
  };

  const placed: Placed[] = [];
  const put = (item: PackInput, c: number, r: number) => {
    for (let y = r; y < r + item.h; y++) for (let x = c; x < c + item.w; x++) grid[y][x] = true;
    placed.push({ key: item.key, col: c, row: r, w: item.w, h: item.h });
  };

  // The first item is the keystone: always dead centre.
  const [keystone, ...rest] = items;
  if (keystone.w > cols || keystone.h > rows) return undefined;
  put(keystone, Math.floor((cols - keystone.w) / 2), Math.floor((rows - keystone.h) / 2));

  for (const item of rest) {
    let best: { c: number; r: number; score: number } | undefined;
    for (let r = 0; r <= rows - item.h; r++) {
      for (let c = 0; c <= cols - item.w; c++) {
        if (!fits(c, r, item.w, item.h)) continue;
        // Distance to the tray centre in tray-shaped units, so the cluster grows
        // with the tray's proportions, minus a bonus for touching neighbours
        // and walls (tighter packing, fewer stranded holes).
        const dx = (c + item.w / 2 - cx) / aspect;
        const dy = r + item.h / 2 - cy;
        const score = dx * dx + dy * dy - contact(grid, c, r, item.w, item.h) * contactWeight;
        if (!best || score < best.score) best = { c, r, score };
      }
    }
    if (!best) return undefined;
    put(item, best.c, best.r);
  }

  const fixed = new Set(items.filter((i) => i.fixed).map((i) => i.key));
  grow(
    grid,
    placed.slice(1).filter((p) => !fixed.has(p.key)),
    rows,
    cols,
  );

  const holes: { col: number; row: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!grid[r][c]) holes.push({ col: c, row: r });
  return { cols, rows, placed, holes };
}

const MAX_W = 4;
const MAX_H = 3;

/**
 * Lets compartments expand into empty strips beside them (a full edge's worth
 * of free cells), so leftover space becomes bigger compartments instead of
 * stray holes. Capped so nothing grows into a banner.
 */
function grow(grid: boolean[][], items: Placed[], rows: number, cols: number) {
  const free = (c: number, r: number) => c >= 0 && r >= 0 && c < cols && r < rows && !grid[r][c];
  const strip = (cells: [number, number][]) => cells.every(([c, r]) => free(c, r));
  const fill = (cells: [number, number][]) => cells.forEach(([c, r]) => (grid[r][c] = true));
  const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);

  let changed = true;
  while (changed) {
    changed = false;
    for (const p of items) {
      if (p.h < MAX_H) {
        const below = range(p.col, p.w).map((c): [number, number] => [c, p.row + p.h]);
        const above = range(p.col, p.w).map((c): [number, number] => [c, p.row - 1]);
        if (strip(below)) {
          fill(below);
          p.h++;
          changed = true;
          continue;
        }
        if (strip(above)) {
          fill(above);
          p.row--;
          p.h++;
          changed = true;
          continue;
        }
      }
      if (p.w < MAX_W) {
        const right = range(p.row, p.h).map((r): [number, number] => [p.col + p.w, r]);
        const left = range(p.row, p.h).map((r): [number, number] => [p.col - 1, r]);
        if (strip(right)) {
          fill(right);
          p.w++;
          changed = true;
          continue;
        }
        if (strip(left)) {
          fill(left);
          p.col--;
          p.w++;
          changed = true;
          continue;
        }
      }
    }
  }
}

function contact(grid: boolean[][], c: number, r: number, w: number, h: number): number {
  let n = 0;
  // Out-of-bounds counts as contact: hugging the tray wall is good packing.
  const at = (x: number, y: number) => grid[y]?.[x] ?? true;
  for (let x = c; x < c + w; x++) n += Number(at(x, r - 1)) + Number(at(x, r + h));
  for (let y = r; y < r + h; y++) n += Number(at(c - 1, y)) + Number(at(c + w, y));
  return n;
}
