================================================================================
ZOOM CONTROLS 3D WIDGET - HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the Zoom Controls 3D Widget.
This self-contained folder contains the living, animated 3D Zoom In "(i+" and
Zoom Out "(i-" magnifying-glass buttons (brushed champagne-gold & platinum bezels,
crystal optical lenses, angled brushed-silver handles, and floating 3D metallic
"(i+" and "(i-" symbols) along with every code file needed to drop them into any
web app, map/photo viewer, document reader, or game HUD.

--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt           -> This plain-text integration & sizing guide.
  README.md                       -> Quick-reference Markdown guide.
  zoom-controls-3d.js             -> Full interactive Three.js 3D scene with
                                     clickable Zoom In (i+ and Zoom Out (i-
                                     magnifying glasses, 4 living motion modes,
                                     hover lift, spring click recoil & Web Audio.
  zoom-controls-3d.d.ts           -> TypeScript types for zoom-controls-3d.js.
  ZoomControls3DWidget.tsx        -> Drop-in React component wrapper.
  zoom-controls-image-widget.js   -> Zero-dependency 2.5D animated image widget
                                     using assets/zoom-controls-badge.jfif with
                                     clickable left (i+ & right (i- hit zones
                                     (no Three.js required).
  zoom-controls-image-widget.d.ts -> TypeScript types for the 2.5D image widget.
  zoom-controls-sizing.js         -> Dedicated sizing code file for making this
                                     3D smaller or bigger or fitting it into any
                                     app toolbar, corner HUD, or viewer panel.
  zoom-controls-sizing.d.ts       -> TypeScript types for the sizing file.
  assets/zoom-controls-badge.jfif -> Original 3D magnifying-glass buttons image.
  example.html                    -> Ready-to-run standalone HTML demo page.


--------------------------------------------------------------------------------
2. CLICKABLE BUTTONS & LIVING MOTION FEATURES
--------------------------------------------------------------------------------

  * Clickable Zoom In "(i+" (Left Magnifying Glass):
    - Hovering lifts the champagne-gold magnifier toward the user.
    - Clicking fires a spring zoom-forward pulse, plays an ascending optical
      chime, increases the zoom level by +step (default +15%), and invokes
      onZoomIn({ zoom, delta, action: 'in' }) and onChange(zoom, 'in').

  * Clickable Zoom Out "(i-" (Right Magnifying Glass):
    - Hovering lifts the brushed platinum magnifier toward the user.
    - Clicking fires a pull-back pulse, plays a descending optical chime,
      decreases the zoom level by -step (default -15%), and invokes
      onZoomOut({ zoom, delta, action: 'out' }) and onChange(zoom, 'out').

  * 4 Continuous Living Motion Modes:
    - 'float' : Counter-phase levitation, gentle 3D sway, and floating "(i+" /
                "(i-" emblems inside the crystal lenses.
    - 'pulse' : Rhythmic optical-zoom heartbeat across both lenses.
    - 'orbit' : Smooth orbital tilt so studio light glides over brushed metal.
    - 'tilt'  : Cursor-reactive 3D parallax tilt following the user's pointer.


--------------------------------------------------------------------------------
3. OPTION A: ADD TO ANY VANILLA JS / HTML APP OR GAME (NO BUNDLER)
--------------------------------------------------------------------------------

Step 1: Copy the entire "zoom-controls-3d-widget" folder into your project
        directory (next to index.html or inside your public/static folder).

Step 2: Add a container element where the 3D buttons should appear (e.g., over a
        map, image gallery, canvas viewer, or game camera toolbar):

  <div id="zoom-buttons" style="width: 440px; height: 264px;"></div>

Step 3: If you do not use npm/Vite, add Three.js via an importmap in <head>:

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
      }
    }
  </script>

Step 4: Mount the living 3D zoom buttons inside a <script type="module">:

  <script type="module">
    import { createZoomControls3DWidget } from './zoom-controls-3d-widget/zoom-controls-3d.js';

    const zoomUI = createZoomControls3DWidget(document.getElementById('zoom-buttons'), {
      initialZoom: 100,          // Starting zoom %
      minZoom: 50,               // Minimum zoom %
      maxZoom: 200,              // Maximum zoom %
      step: 15,                  // Change per click (%)
      motionMode: 'float',       // 'float' | 'pulse' | 'orbit' | 'tilt'
      speed: 1.0,                // Animation speed (0.2 - 2.5)
      intensity: 1.0,            // Motion amplitude (0.2 - 2.2)
      background: 'transparent', // Transparent over your app or game canvas
      showStudioFloor: false,    // Hide studio grid floor when overlaying on UI
      enableOrbit: true,         // Allow drag-to-orbit inspection
      enableSoundFeedback: true, // Play ascending/descending optical chime
      masterVolume: 75,          // 0 - 100 audio level
      onZoomIn: ({ zoom }) => {
        console.log('Zoomed In to:', zoom + '%');
        // Example: apply CSS scale or camera zoom to your app target
        document.getElementById('viewer-content').style.transform = `scale(${zoom / 100})`;
      },
      onZoomOut: ({ zoom }) => {
        console.log('Zoomed Out to:', zoom + '%');
        document.getElementById('viewer-content').style.transform = `scale(${zoom / 100})`;
      }
    });
  </script>


--------------------------------------------------------------------------------
4. OPTION B: ADD TO A BUNDLED APP OR GAME (REACT / VITE / NEXT.JS / TYPESCRIPT)
--------------------------------------------------------------------------------

Step 1: Install Three.js in your project if not already installed:

  npm install three
  npm install -D @types/three   (if using TypeScript)

Step 2: Copy the "zoom-controls-3d-widget" folder into your "src/" folder.

Step 3 (React / Next.js): Render <ZoomControls3DWidget /> inside any component:

  import { useState } from 'react';
  import { ZoomControls3DWidget } from './zoom-controls-3d-widget/ZoomControls3DWidget';

  export function MapZoomToolbar() {
    const [zoom, setZoom] = useState(100);

    return (
      <div style={{ width: 280, height: 168 }}>
        <ZoomControls3DWidget
          initialZoom={zoom}
          step={15}
          motionMode="float"
          background="transparent"
          showStudioFloor={false}
          onChange={(nextZoom) => setZoom(nextZoom)}
        />
      </div>
    );
  }


--------------------------------------------------------------------------------
5. OPTION C: ADD TO ANY GAME HUD / CANVAS OVERLAY (PHASER, THREE.JS, UNITY, GODOT)
--------------------------------------------------------------------------------

Mount the widget inside a transparent overlay <div> pinned over your game canvas
so the floating 3D "(i+" and "(i-" magnifier buttons sit in a corner HUD:

  <div style="position: relative; width: 100vw; height: 100vh;">
    <canvas id="game-canvas"></canvas>
    <div
      id="game-zoom-hud"
      style="position: absolute; bottom: 20px; right: 20px; width: 240px; height: 144px; z-index: 20;"
    ></div>
  </div>

Connect "onZoomIn" / "onZoomOut" directly to your game camera's zoom property:

  onChange: (zoomPercent) => {
    gameCamera.zoom = zoomPercent / 100;
  }


--------------------------------------------------------------------------------
6. OPTION D: ZERO-DEPENDENCY 2.5D IMAGE MODE (NO THREE.JS REQUIRED)
--------------------------------------------------------------------------------

If your project does not use Three.js, use "zoom-controls-image-widget.js" with
"assets/zoom-controls-badge.jfif". It animates the original image with living
3D motion, specular sheen, cursor parallax tilt, and clickable left "(i+" and
right "(i-" lens buttons:

  import { createZoomControlsImageWidget } from './zoom-controls-3d-widget/zoom-controls-image-widget.js';

  const imgZoom = createZoomControlsImageWidget(document.getElementById('zoom-buttons'), {
    imageSrc: './zoom-controls-3d-widget/assets/zoom-controls-badge.jfif',
    motionMode: 'float',
    onZoomIn: ({ zoom }) => console.log('Zoom In:', zoom + '%'),
    onZoomOut: ({ zoom }) => console.log('Zoom Out:', zoom + '%'),
  });


--------------------------------------------------------------------------------
7. CONTROLLER API & CLEANUP
--------------------------------------------------------------------------------

"createZoomControls3DWidget(...)" returns a controller with these methods:

  zoomUI.triggerZoomIn()         -> Programmatically trigger Zoom In (+step)
  zoomUI.triggerZoomOut()        -> Programmatically trigger Zoom Out (-step)
  zoomUI.setZoom(percent)        -> Jump to a specific zoom percentage
  zoomUI.getZoom()               -> Read current zoom percentage
  zoomUI.setMotionMode(mode)     -> 'float' | 'pulse' | 'orbit' | 'tilt'
  zoomUI.setSpeed(multiplier)    -> Animation speed (0.2 - 2.5)
  zoomUI.setIntensity(mult)      -> Motion amplitude (0.2 - 2.2)
  zoomUI.setAudioEnabled(bool)   -> Enable/disable optical click chimes
  zoomUI.setMasterVolume(pct)    -> Set audio level (0 - 100)
  zoomUI.resetCamera()           -> Smoothly reset 3D orbit camera
  zoomUI.destroy()               -> Clean up WebGL resources & listeners

Always call "zoomUI.destroy()" when unmounting or changing game scenes.


--------------------------------------------------------------------------------
8. HOW THE SIZING FILE WORKS (zoom-controls-sizing.js)
--------------------------------------------------------------------------------

The dedicated sizing file "zoom-controls-sizing.js" controls the width and height
of the widget container so you can make this 3D smaller or bigger at any time
without writing manual CSS. Both the Three.js 3D widget and the 2.5D image
widget automatically detect container size changes via ResizeObserver and refit
cleanly.

Available Size Presets:
  * 'xs'   -> 160 x  96 px  (compact floating corner HUD or mini toolbar)
  * 'sm'   -> 280 x 168 px  (map/viewer overlay button pair)
  * 'md'   -> 440 x 264 px  (default balanced dual-button control)
  * 'lg'   -> 640 x 384 px  (featured showcase or large touch panel)
  * 'xl'   -> 880 x 528 px  (hero presentation stage)
  * 'full' -> 100% x 100%   (fills its parent container completely)

Method 1 — Set an initial size with "applyZoomControls3DSize(container, size)":

  import { applyZoomControls3DSize } from './zoom-controls-3d-widget/zoom-controls-sizing.js';
  import { createZoomControls3DWidget } from './zoom-controls-3d-widget/zoom-controls-3d.js';

  const slot = document.getElementById('zoom-buttons');

  // Option A: Use a preset name ('xs', 'sm', 'md', 'lg', 'xl', 'full')
  applyZoomControls3DSize(slot, 'sm');

  // Option B: Use a scale number (e.g., 0.6 = smaller, 1.5 = bigger)
  applyZoomControls3DSize(slot, 0.75);

  // Option C: Pass custom pixel dimensions
  applyZoomControls3DSize(slot, { width: 360, height: 216 });

  // Then mount the 3D widget inside the sized slot:
  createZoomControls3DWidget(slot, { background: 'transparent', showStudioFloor: false });

Method 2 — Resize smaller or bigger dynamically at runtime with
           "createZoomControls3DSizer(container, initialSize)":

  import { createZoomControls3DSizer } from './zoom-controls-3d-widget/zoom-controls-sizing.js';

  const sizer = createZoomControls3DSizer(slot, 'md');

  // Make it smaller or bigger in steps (default step is 0.2 = 20%):
  sizer.makeSmaller(0.2);        // Shrinks container by 20% (min scale 0.25x)
  sizer.makeBigger(0.2);         // Enlarges container by 20% (max scale 3.0x)

  // Jump to an exact scale, preset, or pixel dimensions:
  sizer.setScale(1.4);           // 1.4x bigger than initial size
  sizer.setPreset('xs');         // Switch to compact 160x96 HUD preset
  sizer.setDimensions(500, 300); // Set exact custom width & height in px
  console.log(sizer.getSize());  // Returns { width, height, scale, preset }


--------------------------------------------------------------------------------
9. RUNNING THE EXAMPLE LOCALLY
--------------------------------------------------------------------------------

Serve the folder over a local HTTP server (ES modules require HTTP):

  npx serve .
  (or: python3 -m http.server 8080)

Then open http://localhost:8080/example.html in your browser.
================================================================================
