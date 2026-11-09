import { magnetPose, type MagnetOptions } from "./magnet-pose.js";
import { createSpring, STEP_MS, type Spring } from "./spring.js";

export type Magnet = {
  /** Changes the options; the element keeps moving smoothly from where it is. */
  update(options: MagnetOptions): void;
  /** Stops the effect and puts the element back. */
  destroy(): void;
};

type Entry = { el: HTMLElement | SVGElement; options: MagnetOptions; spring: Spring };

// Every magnetized element shares one set of listeners and one animation frame loop.
const entries = new Set<Entry>();
let pointer: { x: number; y: number } | null = null;
let frame = 0;
let lastTime: number | null = null;
/** The cursor moved or the page scrolled since the targets were last worked out. */
let stale = true;
let finePointer: MediaQueryList | null = null;
let reduceMotion: MediaQueryList | null = null;

/**
 * Makes `el` lean toward the cursor and grow a little when the cursor comes near, with spring
 * motion. Off on touch screens and when the visitor prefers reduced motion. It moves the element
 * with the `translate` and `scale` CSS properties, so the element's own `transform` still works.
 */
export function magnet(el: HTMLElement | SVGElement, options: MagnetOptions = {}): Magnet {
  const entry: Entry = { el, options, spring: createSpring() };
  if (entries.size === 0) listen();
  entries.add(entry);
  stale = true;
  kick();
  return {
    update(next) {
      entry.options = next;
      stale = true;
      kick();
    },
    destroy() {
      if (!entries.delete(entry)) return;
      el.style.removeProperty("translate");
      el.style.removeProperty("scale");
      if (entries.size === 0) unlisten();
    },
  };
}

function listen() {
  finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("scroll", onChange, { passive: true, capture: true });
  addEventListener("resize", onChange, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  reduceMotion.addEventListener("change", onChange);
}

function unlisten() {
  removeEventListener("pointermove", onMove);
  removeEventListener("scroll", onChange, { capture: true });
  removeEventListener("resize", onChange);
  document.documentElement.removeEventListener("pointerleave", onLeave);
  reduceMotion?.removeEventListener("change", onChange);
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = null;
  pointer = null;
}

function onMove(e: PointerEvent) {
  if (e.pointerType === "touch") return;
  pointer = { x: e.clientX, y: e.clientY };
  onChange();
}

function onLeave() {
  pointer = null;
  onChange();
}

function onChange() {
  stale = true;
  kick();
}

function kick() {
  if (!frame && entries.size > 0) frame = requestAnimationFrame(tick);
}

function tick(now: number) {
  frame = 0;
  const elapsed = lastTime === null ? STEP_MS : now - lastTime;
  lastTime = now;
  const active = !!finePointer?.matches && !reduceMotion?.matches;

  // All reads first, then all writes, so the page lays out once per frame.
  if (stale) {
    stale = false;
    for (const { el, options, spring } of entries) {
      if (!active || !pointer || !el.isConnected) {
        spring.setTarget({ x: 0, y: 0, scale: 1 });
        continue;
      }
      // Measured from where the element would be at rest, so it doesn't chase itself.
      const r = el.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2 - spring.x);
      const dy = pointer.y - (r.top + r.height / 2 - spring.y);
      const radius = Math.max(r.width, r.height) / (2 * spring.scale);
      spring.setTarget(magnetPose(dx, dy, options, radius));
    }
  }

  let moving = false;
  for (const { el, spring } of entries) {
    if (reduceMotion?.matches) spring.snap();
    else if (spring.advance(elapsed)) moving = true;
    const { x, y, scale } = spring;
    if (x === 0 && y === 0 && scale === 1) {
      el.style.removeProperty("translate");
      el.style.removeProperty("scale");
    } else {
      el.style.translate = `${x}px ${y}px`;
      el.style.scale = String(scale);
    }
  }

  if (moving) {
    frame = requestAnimationFrame(tick);
  } else {
    lastTime = null;
  }
}
