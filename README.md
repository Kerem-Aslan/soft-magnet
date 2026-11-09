# soft-magnet

A subtle magnetic hover effect. When the cursor comes near, an element leans toward it a few
pixels and grows a little, with spring motion. It's meant to be felt more than seen.

[**Live demo**](https://kerem-aslan.github.io/soft-magnet/) · made for [flowgraphs.app](https://flowgraphs.app)

- **No dependencies**, about 2.5 kB gzipped. Plain DOM API plus an optional React hook.
- **Same feel at any refresh rate.** The spring steps at a fixed 60 Hz and blends between steps,
  so it isn't faster on 120 or 144 Hz screens.
- **Doesn't chase itself.** Distance is measured from where the element sits at rest, not where
  it has leaned to, so it never creeps after the cursor.
- **One listener for everything.** Any number of elements share one `pointermove` listener and one
  animation frame loop, which stops when everything is still.
- **Polite.** Off on touch screens and when the visitor prefers reduced motion.
- **Keeps your transforms.** It moves the element with the `translate` and `scale` CSS
  properties, so the element's own `transform` keeps working.

## Install

```sh
npm install soft-magnet
```

## Use

```js
import { magnet } from "soft-magnet";

const m = magnet(document.querySelector("button"));

m.update({ strength: 0.5 }); // change options while it runs
m.destroy(); // stop and put the element back
```

### React

```tsx
import { useRef } from "react";
import { useMagnet } from "soft-magnet/react";

function MagnetButton() {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnet(ref, { strength: 0.5 });
  return <button ref={ref}>Hello</button>;
}
```

The hook file starts with `"use client"`, so it works from Next.js App Router client components.

## Options

| Option     | Default | Meaning                                                              |
| ---------- | ------- | -------------------------------------------------------------------- |
| `range`    | `120`   | How far from the element's edge (px) the cursor starts pulling it.   |
| `pull`     | `7`     | The most it moves toward the cursor (px).                            |
| `grow`     | `0.1`   | How much it grows at most (`0.1` = 10%).                             |
| `strength` | `1`     | Multiplies `pull` and `grow`. `0.5` is half as strong, `0` is off.   |

The pull fades out toward the edge of the range, so nothing jumps when the cursor crosses it.

Tip: add `will-change: translate, scale;` to the element's CSS for smoother motion.

## Building your own

The two pieces inside `magnet()` are exported too, for when you run your own animation loop
(for example many nodes on a canvas, or things that live in a zoomed coordinate space):

```js
import { createSpring, magnetPose } from "soft-magnet";

const spring = createSpring();

// When the cursor moves: dx, dy = cursor minus the element's resting center.
spring.setTarget(magnetPose(dx, dy, { range: 120 }));

// Every animation frame:
const moving = spring.advance(elapsedMs); // false once it has settled
el.style.translate = `${spring.x}px ${spring.y}px`;
el.style.scale = String(spring.scale);
```

`magnetPose(dx, dy, options, radius)` returns `{ x, y, scale }`; `radius` adds the element's own
size to the range. `spring.snap()` jumps straight to the target (useful under reduced motion).

## Notes

- Works with the default `transform-origin` (center). If an ancestor is scaled, distances are
  measured on screen, so the effect is scaled with it.
- The demo runs locally with `npm run demo`.

## License

MIT
