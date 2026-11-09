import assert from "node:assert/strict";
import { test } from "node:test";
import { magnetPose } from "../dist/magnet-pose.js";

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("rests outside its range", () => {
  assert.deepEqual(magnetPose(120, 0), { x: 0, y: 0, scale: 1 });
  assert.deepEqual(magnetPose(300, 400), { x: 0, y: 0, scale: 1 });
});

test("leans toward the cursor, more when it is closer", () => {
  const far = magnetPose(100, 0);
  const near = magnetPose(20, 0);
  assert.ok(far.x > 0 && near.x > far.x);
  assert.ok(near.scale > far.scale && far.scale > 1);
  const up = magnetPose(0, -30);
  assert.ok(up.y < 0 && close(up.x, 0));
});

test("never moves further than `pull` or grows more than `grow`", () => {
  for (let d = 0; d < 130; d += 0.5) {
    const p = magnetPose(d, 0);
    assert.ok(p.x <= 7 + 1e-9, `x ${p.x} at ${d}`);
    assert.ok(p.scale <= 1.1 + 1e-9);
  }
});

test("fades smoothly at the edge of its range", () => {
  const p = magnetPose(119.9, 0);
  assert.ok(p.x < 0.01 && p.scale - 1 < 0.001);
});

test("strength scales pull and grow; 0 turns it off", () => {
  const full = magnetPose(40, 0);
  const half = magnetPose(40, 0, { strength: 0.5 });
  assert.ok(close(half.x, full.x / 2));
  assert.ok(close(half.scale - 1, (full.scale - 1) / 2));
  assert.deepEqual(magnetPose(40, 0, { strength: 0 }), { x: 0, y: 0, scale: 1 });
});

test("radius widens the range by the element's own size", () => {
  assert.deepEqual(magnetPose(150, 0), { x: 0, y: 0, scale: 1 });
  assert.ok(magnetPose(150, 0, {}, 50).x > 0);
});

test("custom range, pull and grow", () => {
  const p = magnetPose(0.5, 0, { range: 200, pull: 20, grow: 0.2 });
  assert.ok(p.x > 0 && p.x <= 20);
  assert.ok(p.scale > 1.19);
  assert.deepEqual(magnetPose(210, 0, { range: 200 }), { x: 0, y: 0, scale: 1 });
});

test("options passed as undefined fall back to the defaults", () => {
  const p = magnetPose(40, 0, { range: undefined, pull: undefined, grow: undefined, strength: undefined });
  assert.deepEqual(p, magnetPose(40, 0));
  assert.ok(Number.isFinite(p.x) && p.x > 0);
});
