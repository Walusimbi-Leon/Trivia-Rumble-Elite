# Zoom Controls 3D Widget

Self-contained interactive 3D **Zoom In `(i+`** and **Zoom Out `(i-`** magnifying-glass buttons with continuous living motion (`float`, `pulse`, `orbit`, `tilt`), hover lift, spring click recoil, optical Web Audio chimes, a dedicated sizing helper (`zoom-controls-sizing.js`), and a zero-dependency 2.5D image fallback.

## Quick Start

```html
<div id="zoom-buttons"></div>
<script type="module">
  import { applyZoomControls3DSize } from './zoom-controls-3d-widget/zoom-controls-sizing.js';
  import { createZoomControls3DWidget } from './zoom-controls-3d-widget/zoom-controls-3d.js';

  const slot = document.getElementById('zoom-buttons');
  applyZoomControls3DSize(slot, 'md');

  createZoomControls3DWidget(slot, {
    background: 'transparent',
    showStudioFloor: false,
    onZoomIn: ({ zoom }) => console.log('Zoomed In:', zoom),
    onZoomOut: ({ zoom }) => console.log('Zoomed Out:', zoom),
  });
</script>
```

See `HOW_TO_USE_README.txt` for full React, Vanilla JS, Game HUD, and `zoom-controls-sizing.js` documentation.
