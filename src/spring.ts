/** Where something sits relative to its resting place, and how big it is. */
export type Pose = { x: number; y: number; scale: number };

export const REST: Readonly<Pose> = Object.freeze({ x: 0, y: 0, scale: 1 });

export type Spring = {
  /** The pose to draw now (between the last two simulation steps). */
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** Where the spring is heading. */
  setTarget(target: Pose): void;
  /**
   * Moves the spring on by `elapsed` milliseconds. Returns true while it is still moving,
   * false once it has settled on its target (and stays there until the target changes).
   */
  advance(elapsed: number): boolean;
  /** Jumps straight to the target, e.g. under reduced motion. */
  snap(): void;
};

/** The spring always steps at 60 Hz, so it feels the same on 60, 120 and 144 Hz screens. */
export const STEP_MS = 1000 / 60;
/** After a long pause (background tab, slow frame) the spring doesn't try to catch up. */
const MAX_ELAPSED_MS = 100;
/** Below this the motion is invisible; the spring settles exactly on its target. */
const SETTLE = 0.002;

// Per-step stiffness and damping: the position springs a little softer than the scale.
const MOVE_STIFFNESS = 0.12;
const MOVE_DAMPING = 0.72;
const SCALE_STIFFNESS = 0.16;
const SCALE_DAMPING = 0.68;

export function createSpring(start: Pose = REST): Spring {
  const target = { ...start };
  // Two states, so drawing can blend between them when a frame falls between steps.
  const prev = { ...start };
  const cur = { ...start };
  const v = { x: 0, y: 0, scale: 0 };
  let carry = 0;
  let resting = true;

  const settle = () => {
    Object.assign(prev, target);
    Object.assign(cur, target);
    v.x = v.y = v.scale = 0;
    carry = 0;
    resting = true;
  };

  const step = () => {
    Object.assign(prev, cur);
    v.x = (v.x + (target.x - cur.x) * MOVE_STIFFNESS) * MOVE_DAMPING;
    v.y = (v.y + (target.y - cur.y) * MOVE_STIFFNESS) * MOVE_DAMPING;
    v.scale = (v.scale + (target.scale - cur.scale) * SCALE_STIFFNESS) * SCALE_DAMPING;
    cur.x += v.x;
    cur.y += v.y;
    cur.scale += v.scale;
  };

  const blend = (key: keyof Pose) => prev[key] + (cur[key] - prev[key]) * (carry / STEP_MS);

  return {
    get x() {
      return blend("x");
    },
    get y() {
      return blend("y");
    },
    get scale() {
      return blend("scale");
    },
    setTarget(next) {
      if (next.x === target.x && next.y === target.y && next.scale === target.scale) return;
      Object.assign(target, next);
      resting = false;
    },
    advance(elapsed) {
      if (resting) return false;
      carry += Math.min(Math.max(elapsed, 0), MAX_ELAPSED_MS);
      while (carry >= STEP_MS) {
        step();
        carry -= STEP_MS;
      }
      const moving =
        Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.scale) > SETTLE ||
        Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) + Math.abs(target.scale - cur.scale) > SETTLE;
      if (!moving) settle();
      return moving;
    },
    snap: settle,
  };
}
