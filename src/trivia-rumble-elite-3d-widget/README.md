# TRIVIA RUMBLE ELITE 3D Emblem Widget

A living, interactive 3D emblem featuring forged metallic gold **TRIVIA RUMBLE ELITE** typography engulfed in roaring electric-blue/violet GLSL flames, drifting dark smoke haze, rising golden sparks, and 5 motion modes (`blaze`, `rumble`, `wave`, `pulse`, `tilt`).

## Quick Start (Vanilla JS / Games)

```html
<div id="rumble-stage" style="width: 720px; height: 385px;"></div>
<script type="module">
  import { createTriviaRumbleElite3DWidget } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-3d.js';

  const emblem = createTriviaRumbleElite3DWidget(document.getElementById('rumble-stage'), {
    motionMode: 'blaze',
    background: 'transparent',
    showStudioFloor: false,
    onClick: (ev) => console.log('TRIVIA RUMBLE ELITE clicked:', ev.char),
  });
</script>
```

## Sizing Helper (`trivia-rumble-elite-sizing.js`)

```js
import { createTriviaRumbleElite3DSizer } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-sizing.js';

const sizer = createTriviaRumbleElite3DSizer(document.getElementById('rumble-stage'), 'md');
sizer.makeSmaller(0.2); // Shrinks 20%
sizer.makeBigger(0.2);  // Enlarges 20%
sizer.setPreset('lg');  // Jump to 720x385
```

See `HOW_TO_USE_README.txt` for full React, HTML5/Phaser/Unity/Godot game HUD, 2.5D image mode, and sizing documentation.
