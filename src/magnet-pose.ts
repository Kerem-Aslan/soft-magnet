import type { Pose } from "./spring.js";

export type MagnetOptions = {
  /** How far from the element (px) the cursor starts pulling it. Default 120. */
  range?: number;
  /** The most it moves toward the cursor (px). Default 7. */
  pull?: number;
  /** How much it grows at most (0.1 = 10%). Default 0.1. */
  grow?: number;
  /** Multiplies `pull` and `grow`: 0.5 is half as strong, 0 turns it off. Default 1. */
  strength?: number;
};

export const DEFAULTS: Readonly<Required<MagnetOptions>> = Object.freeze({
  range: 120,
  pull: 7,
  grow: 0.1,
  strength: 1,
});

/**
 * Where an element should lean, given the cursor's offset (`dx`, `dy`) from the element's
 * resting center. `radius` adds the element's own size to the range, so a wide button starts
 * pulling when the cursor nears its edge rather than its center. The pull fades out linearly
 * toward the edge of the range, so there is no jump when the cursor crosses it.
 */
export function magnetPose(dx: number, dy: number, options: MagnetOptions = {}, radius = 0): Pose {
  // `??` rather than spreading, so an option passed as undefined still gets its default.
  const range = options.range ?? DEFAULTS.range;
  const pull = options.pull ?? DEFAULTS.pull;
  const grow = options.grow ?? DEFAULTS.grow;
  const strength = options.strength ?? DEFAULTS.strength;
  const reach = range + radius;
  const d = Math.hypot(dx, dy);
  if (reach <= 0 || d >= reach || strength === 0) return { x: 0, y: 0, scale: 1 };
  const f = 1 - d / reach;
  const k = (pull * strength * f) / Math.max(d, 1);
  return { x: dx * k, y: dy * k, scale: 1 + grow * strength * f };
}
