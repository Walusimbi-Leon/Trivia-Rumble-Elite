# SUPPORT DEVELOPER 3D Badge Widget

A living, multi-motion 3D hardware badge with extruded **SUPPORT DEVELOPER** typography, 7 distinct motion presets plus auto-cycle mode, adjustable speed & intensity, interactive letter ripples, and Web Audio chime feedback.

## Motion Modes Included

- `wave` — Smooth cascade wave across every letter
- `heartbeat` — Warm double-beat cardiac pulse
- `hover` — Weightless 3D figure-8 levitation
- `ripple` — Automatic center-outward shockwave ripples
- `bounce` — Sequential letter-by-letter spring pop
- `shimmer` — Sweeping studio spotlight & cyan glint across the metal letters
- `tilt` — Cursor-reactive 3D perspective tilt
- `auto` — Automatically cycles through all 7 motions every 4.5 seconds

## Quick Start

```js
import { createSupportDeveloper3DWidget } from './support-developer-3d-widget/support-developer-3d.js';

const supportBadge = createSupportDeveloper3DWidget(document.getElementById('support-slot'), {
  motionMode: 'heartbeat',    // 'wave' | 'heartbeat' | 'hover' | 'ripple' | 'bounce' | 'shimmer' | 'tilt' | 'auto'
  speed: 1.0,                 // 0.2 - 2.5
  intensity: 1.0,             // 0.2 - 2.0
  background: 'transparent',  // Transparent so it floats over your app or game UI
  showStudioFloor: false,
  onClick: () => {
    window.location.href = '/support';
  },
});
```

See `HOW_TO_USE_README.txt` for complete Vanilla JS, React, TypeScript, Game Engine HUD, and 2.5D Image Mode setup instructions.
