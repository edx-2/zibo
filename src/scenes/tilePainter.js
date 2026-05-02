// Tile painter — gives the foreground a per-theme palette so a generic level
// shape feels like a different planet.

const PALETTES = {
  grassland: { top: '#65a843', body: '#5b3724', edge: '#3a1f12' },
  ice: { top: '#dff3ff', body: '#a5c1de', edge: '#5a83ad' },
  desert: { top: '#e6c673', body: '#a88944', edge: '#6a5223' },
  mushroom: { top: '#bb6dd9', body: '#5a3a8a', edge: '#2a1a4a' },
  cave: { top: '#5a4a7c', body: '#3a2a5a', edge: '#1a1538' },
  water: { top: '#5db8c9', body: '#3a7a8a', edge: '#1a4858' },
  candy: { top: '#ffb1d9', body: '#d68aae', edge: '#8a4a73' },
  magnet: { top: '#7a90b8', body: '#3a4f78', edge: '#1a2540' },
  volcano: { top: '#a0282d', body: '#5a1818', edge: '#1a0808' },
  palace: { top: '#cabaff', body: '#8a72c8', edge: '#3a2a78' }
};

export function drawTiles(ctx, tiles, theme) {
  const p = PALETTES[theme] || PALETTES.grassland;
  for (const t of tiles) {
    if (t.oneWay) {
      // thin one-way platform
      ctx.fillStyle = p.top;
      ctx.fillRect(t.x, t.y, t.w, 8);
      ctx.fillStyle = p.body;
      ctx.fillRect(t.x, t.y + 8, t.w, t.h - 8);
      continue;
    }
    // body
    ctx.fillStyle = p.body;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    // top accent
    ctx.fillStyle = p.top;
    ctx.fillRect(t.x, t.y, t.w, 12);
    // edge
    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2);
    // interior pattern
    ctx.fillStyle = p.edge;
    for (let xx = t.x + 16; xx < t.x + t.w - 16; xx += 64) {
      for (let yy = t.y + 24; yy < t.y + t.h - 8; yy += 32) {
        ctx.fillRect(xx, yy, 6, 4);
      }
    }
  }
}
