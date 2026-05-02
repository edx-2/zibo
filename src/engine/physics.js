// AABB platformer physics. Resolves collisions axis-by-axis against an
// array of solid rects so we can detect the side that was hit.

export const TILE = 64;

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectCenter(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

// Move a body by (dx, dy) against `solids` (array of { x, y, w, h, oneWay? }).
// Returns hit flags so the caller can react (zero out velocity on grounded, etc).
export function moveAndCollide(body, dx, dy, solids) {
  const result = { hitLeft: false, hitRight: false, hitTop: false, hitBottom: false, ground: null };

  body.x += dx;
  for (const s of solids) {
    if (s.oneWay) continue; // one-way platforms only check vertical
    if (!aabb(body, s)) continue;
    if (dx > 0) { body.x = s.x - body.w; result.hitRight = true; }
    else if (dx < 0) { body.x = s.x + s.w; result.hitLeft = true; }
  }

  body.y += dy;
  for (const s of solids) {
    if (!aabb(body, s)) continue;
    if (s.oneWay) {
      // Only collide when falling and the body's previous bottom was above the platform top.
      if (dy <= 0) continue;
      const prevBottom = body.y - dy + body.h;
      if (prevBottom > s.y + 1) continue;
      body.y = s.y - body.h;
      result.hitBottom = true;
      result.ground = s;
      continue;
    }
    if (dy > 0) { body.y = s.y - body.h; result.hitBottom = true; result.ground = s; }
    else if (dy < 0) { body.y = s.y + s.h; result.hitTop = true; }
  }
  return result;
}
