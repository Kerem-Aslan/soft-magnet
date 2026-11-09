"use client";

import { useEffect, useRef, type RefObject } from "react";
import { magnet, type Magnet } from "./magnet.js";
import type { MagnetOptions } from "./magnet-pose.js";

export type { MagnetOptions } from "./magnet-pose.js";

/**
 * React hook for `magnet()`: the element in `ref` leans toward the cursor and grows a little.
 *
 *   const ref = useRef<HTMLButtonElement>(null);
 *   useMagnet(ref, { strength: 0.5 });
 */
export function useMagnet(ref: RefObject<HTMLElement | SVGElement | null>, options: MagnetOptions = {}) {
  const handle = useRef<Magnet | null>(null);
  const { range, pull, grow, strength } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = magnet(el);
    handle.current = m;
    return () => {
      m.destroy();
      handle.current = null;
    };
  }, [ref]);

  // Declared after the effect above, so on mount it runs once the magnet exists.
  useEffect(() => {
    handle.current?.update({ range, pull, grow, strength });
  }, [ref, range, pull, grow, strength]);
}
