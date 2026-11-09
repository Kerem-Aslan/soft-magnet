import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpring, STEP_MS } from "../dist/spring.js";

/** Runs a spring toward a target at a given refresh rate and samples it at `atMs`. */
function sample(hz: number, atMs: number) {
  const s = createSpring();
  s.setTarget({ x: 7, y: -3, scale: 1.1 });
  const frame = 1000 / hz;
  let t = 0;
  while (t + frame <= atMs + 1e-9) {
    s.advance(frame);
    t += frame;
  }
  return { x: s.x, y: s.y, scale: s.scale };
}

test("feels the same at 60, 120 and 144 Hz", () => {
  for (const at of [50, 100, 200, 400]) {
    const ref = sample(60, at);
    for (const hz of [120, 144, 240]) {
      const got = sample(hz, at);
      // Frames don't line up exactly with `at`; within one 60 Hz step of motion is the same feel.
      assert.ok(Math.abs(got.x - ref.x) < 0.6, `x at ${at} ms, ${hz} Hz: ${got.x} vs ${ref.x}`);
      assert.ok(Math.abs(got.scale - ref.scale) < 0.02, `scale at ${at} ms, ${hz} Hz`);
    }
  }
});

test("settles exactly on its target and then reports rest", () => {
  const s = createSpring();
  s.setTarget({ x: 7, y: 0, scale: 1.1 });
  let frames = 0;
  while (s.advance(STEP_MS)) frames++;
  assert.ok(frames > 5 && frames < 300, `settled after ${frames} frames`);
  assert.deepEqual({ x: s.x, y: s.y, scale: s.scale }, { x: 7, y: 0, scale: 1.1 });
  assert.equal(s.advance(STEP_MS), false);
});

test("doesn't run away after a long pause", () => {
  const s = createSpring();
  s.setTarget({ x: 7, y: 0, scale: 1 });
  s.advance(10_000);
  assert.ok(s.x > 0 && s.x < 10, `x after a stall: ${s.x}`);
});

test("snap jumps to the target", () => {
  const s = createSpring();
  s.setTarget({ x: 3, y: 4, scale: 1.05 });
  s.snap();
  assert.deepEqual({ x: s.x, y: s.y, scale: s.scale }, { x: 3, y: 4, scale: 1.05 });
  assert.equal(s.advance(STEP_MS), false);
});

test("a frame shorter than a step blends instead of jumping", () => {
  const s = createSpring();
  s.setTarget({ x: 10, y: 0, scale: 1 });
  s.advance(STEP_MS);
  const one = s.x;
  s.advance(STEP_MS / 2);
  assert.ok(s.x > one, "moved on during the half step");
  s.advance(STEP_MS / 2);
  const two = s.x;
  assert.ok(two > one);
});
