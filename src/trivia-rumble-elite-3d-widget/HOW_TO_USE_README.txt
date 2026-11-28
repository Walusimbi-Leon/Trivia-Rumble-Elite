================================================================================
TRIVIA RUMBLE ELITE 3D EMBLEM WIDGET - HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the TRIVIA RUMBLE ELITE 3D Emblem Widget.
This self-contained folder contains the living, animated 3D "TRIVIA RUMBLE
ELITE" emblem (forged metallic gold 3D typography engulfed in roaring electric-
blue/violet flames and rising golden sparks) along with every code file needed
to drop it into any web app, trivia platform, or game.

--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt                 -> This plain-text integration & sizing guide.
  README.md                             -> Quick-reference Markdown guide.
  trivia-rumble-elite-3d.js             -> Full interactive Three.js 3D scene
                                           (extruded forged-gold 3D letters,
                                           GLSL blue-violet flame shaders, drifting
                                           smoke haze, rising embers, click flare,
                                           and 5 living motion modes).
  trivia-rumble-elite-3d.d.ts           -> TypeScript types for trivia-rumble-elite-3d.js.
  TriviaRumbleElite3DWidget.tsx         -> Drop-in React component wrapper.
  trivia-rumble-elite-image-widget.js   -> Zero-dependency 2.5D animated image widget
                                           using assets/trivia-rumble-elite-badge.jfif
                                           with live embers, sheen sweep, and motion
                                           (no Three.js required).
  trivia-rumble-elite-image-widget.d.ts -> TypeScript types for the 2.5D image widget.
  trivia-rumble-elite-sizing.js         -> Dedicated sizing helper file for making
                                           this 3D smaller or bigger or fitting it
                                           into any app slot, header, or game HUD.
  trivia-rumble-elite-sizing.d.ts       -> TypeScript types for the sizing file.
  assets/trivia-rumble-elite-badge.jfif -> Original 3D TRIVIA RUMBLE ELITE image.
  example.html                          -> Ready-to-run standalone HTML demo page.


--------------------------------------------------------------------------------
2. LIVING MOTION & INTERACTIVE FEATURES
--------------------------------------------------------------------------------

  * 5 Continuous Living Motion Modes:
    - 'blaze'  : Default roaring blue-violet flames, flickering firelight across
                 the forged gold letters, rising sparks, and heroic float.
    - 'rumble' : Arena kinetic tremor bursts rippling through the title & flames.
    - 'wave'   : Smooth 3D cascade wave across all 17 extruded gold letters.
    - 'pulse'  : Battle-anthem heartbeat pulse across typography and fire core.
    - 'tilt'   : Cursor-reactive 3D parallax tilt following the user's pointer.

  * Hover & Click Anywhere on TRIVIA RUMBLE ELITE:
    - Hovering individual 3D letters lifts and illuminates them.
    - Clicking anywhere fires a kinetic ripple + blue-flame flare burst and
      plays an epic Web Audio bass impact + harmonic chime.
  * Drag with Mouse / Touch:
    - Smoothly orbits the 3D camera around the flaming title emblem.


--------------------------------------------------------------------------------
3. OPTION A: ADD TO ANY VANILLA JS / HTML APP OR GAME (NO BUNDLER)
--------------------------------------------------------------------------------

Step 1: Copy the entire "trivia-rumble-elite-3d-widget" folder into your project
        directory (next to index.html or inside your public/static folder).

Step 2: Add a container element where the 3D title should appear (e.g., splash
        screen, game lobby header, or tournament banner):

  <div id="rumble-title" style="width: 720px; height: 385px;"></div>

Step 3: If you do not use npm/Vite, add Three.js via an importmap in <head>:

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
      }
    }
  </script>

Step 4: Mount the living 3D emblem inside a <script type="module">:

  <script type="module">
    import { createTriviaRumbleElite3DWidget } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-3d.js';

    const emblem = createTriviaRumbleElite3DWidget(document.getElementById('rumble-title'), {
      motionMode: 'blaze',        // 'blaze' | 'rumble' | 'wave' | 'pulse' | 'tilt'
      speed: 1.0,                 // Animation speed multiplier (0.25 - 2.5)
      intensity: 1.0,             // Flame & motion intensity (0.25 - 2.2)
      background: 'transparent',  // Use 'transparent' over custom app/game backgrounds
      showStudioFloor: false,     // Hide floor plane when overlaying on your UI
      enableOrbit: true,          // Allow drag-to-orbit camera
      enableSoundFeedback: true,  // Play epic flare sound on click
      masterVolume: 70,           // 0 - 100 audio level
      onClick: (event) => {
        console.log('TRIVIA RUMBLE ELITE clicked! Letter:', event.char);
        // Example: start match, open lobby, or trigger round transition
      }
    });
  </script>


--------------------------------------------------------------------------------
4. OPTION B: ADD TO A BUNDLED APP OR GAME (REACT / VITE / NEXT.JS / TYPESCRIPT)
--------------------------------------------------------------------------------

Step 1: Install Three.js in your project if not already installed:

  npm install three
  npm install -D @types/three   (if using TypeScript)

Step 2: Copy the "trivia-rumble-elite-3d-widget" folder into your "src/" folder.

Step 3 (React / Next.js): Render <TriviaRumbleElite3DWidget /> inside any screen:

  import { TriviaRumbleElite3DWidget } from './trivia-rumble-elite-3d-widget/TriviaRumbleElite3DWidget';

  export function GameTitleHeader() {
    return (
      <div style={{ width: '100%', height: 360 }}>
        <TriviaRumbleElite3DWidget
          motionMode="blaze"
          speed={1.0}
          intensity={1.0}
          background="transparent"
          showStudioFloor={false}
          masterVolume={75}
          onClick={() => console.log('Enter Trivia Rumble Elite')}
        />
      </div>
    );
  }


--------------------------------------------------------------------------------
5. OPTION C: ADD TO ANY GAME HUD / CANVAS OVERLAY (PHASER, THREE.JS, UNITY, GODOT)
--------------------------------------------------------------------------------

Mount the widget inside a transparent overlay <div> positioned above your game
canvas so the flaming 3D title floats over your arena or lobby background:

  <div style="position: relative; width: 100vw; height: 100vh;">
    <canvas id="game-canvas"></canvas>
    <div
      id="rumble-hud-banner"
      style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 560px; height: 300px; z-index: 20;"
    ></div>
  </div>

Trigger a kinetic flame flare burst from your game events (e.g., countdown end,
streak bonus, or player round start):

  emblem.pulse();                 // Fires shockwave & blue-flame flare burst
  emblem.setMotionMode('rumble'); // Switch to energetic arena rumble


--------------------------------------------------------------------------------
6. OPTION D: ZERO-DEPENDENCY 2.5D IMAGE MODE (NO THREE.JS REQUIRED)
--------------------------------------------------------------------------------

If your project does not use Three.js, use "trivia-rumble-elite-image-widget.js"
with "assets/trivia-rumble-elite-badge.jfif". It animates the original image
with continuous 3D motion, live rising golden embers & blue sparks, sweeping
metallic sheen, cursor parallax tilt, and click audio feedback:

  import { createTriviaRumbleEliteImageWidget } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-image-widget.js';

  const card = createTriviaRumbleEliteImageWidget(document.getElementById('rumble-title'), {
    imageSrc: './trivia-rumble-elite-3d-widget/assets/trivia-rumble-elite-badge.jfif',
    motionMode: 'blaze',   // 'blaze' | 'rumble' | 'wave' | 'pulse' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    enableSoundFeedback: true,
    onClick: () => console.log('Title clicked!'),
  });


--------------------------------------------------------------------------------
7. CONTROLLER API & CLEANUP
--------------------------------------------------------------------------------

"createTriviaRumbleElite3DWidget(...)" returns a controller with these methods:

  emblem.setMotionMode(mode)      -> 'blaze' | 'rumble' | 'wave' | 'pulse' | 'tilt'
  emblem.setSpeed(multiplier)     -> Animation speed (0.25 - 2.5)
  emblem.setIntensity(multiplier) -> Motion & flame amplitude (0.25 - 2.2)
  emblem.setAudioEnabled(bool)    -> Enable/disable Web Audio click flare sound
  emblem.setMasterVolume(percent) -> Set audio level (0 - 100)
  emblem.pulse(letterIndex)       -> Programmatically fire flare & letter ripple
  emblem.resetCamera()            -> Smoothly reset 3D orbit camera
  emblem.destroy()                -> Clean up WebGL resources & listeners

Always call "emblem.destroy()" when unmounting or changing game scenes.


--------------------------------------------------------------------------------
8. HOW THE SIZING FILE WORKS (trivia-rumble-elite-sizing.js)
--------------------------------------------------------------------------------

The dedicated sizing file "trivia-rumble-elite-sizing.js" controls the width and
height of the widget container so you can make this 3D smaller or bigger at any
time without writing manual CSS. Both the Three.js 3D widget and the 2.5D image
widget automatically detect container size changes via ResizeObserver and refit
cleanly.

Available Size Presets:
  * 'xs'   -> 220 x 118 px  (compact navbar badge or mini HUD title)
  * 'sm'   -> 340 x 182 px  (sidebar card or compact lobby header)
  * 'md'   -> 520 x 278 px  (default balanced title banner)
  * 'lg'   -> 720 x 385 px  (featured game splash / modal header)
  * 'xl'   -> 960 x 512 px  (large hero presentation stage)
  * 'full' -> 100% x 100%   (fills its parent container completely)

Method 1 — Set an initial size with "applyTriviaRumbleElite3DSize(container, size)":

  import { applyTriviaRumbleElite3DSize } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-sizing.js';
  import { createTriviaRumbleElite3DWidget } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-3d.js';

  const slot = document.getElementById('rumble-title');

  // Option A: Use a preset name ('xs', 'sm', 'md', 'lg', 'xl', 'full')
  applyTriviaRumbleElite3DSize(slot, 'lg');

  // Option B: Use a scale number (e.g., 0.6 = smaller, 1.5 = bigger)
  applyTriviaRumbleElite3DSize(slot, 0.75);

  // Option C: Pass custom pixel dimensions
  applyTriviaRumbleElite3DSize(slot, { width: 640, height: 342 });

  // Then mount the 3D widget inside the sized slot:
  createTriviaRumbleElite3DWidget(slot, { background: 'transparent', showStudioFloor: false });

Method 2 — Resize smaller or bigger dynamically at runtime with
           "createTriviaRumbleElite3DSizer(container, initialSize)":

  import { createTriviaRumbleElite3DSizer } from './trivia-rumble-elite-3d-widget/trivia-rumble-elite-sizing.js';

  const sizer = createTriviaRumbleElite3DSizer(slot, 'md');

  // Make it smaller or bigger in steps (default step is 0.2 = 20%):
  sizer.makeSmaller(0.2);        // Shrinks container by 20% (min scale 0.25x)
  sizer.makeBigger(0.2);         // Enlarges container by 20% (max scale 3.0x)

  // Jump to an exact scale, preset, or pixel dimensions:
  sizer.setScale(1.4);           // 1.4x bigger than initial size
  sizer.setPreset('sm');         // Switch to small 340x182 preset
  sizer.setDimensions(800, 428); // Set exact custom width & height in px
  console.log(sizer.getSize());  // Returns { width, height, scale, preset }


--------------------------------------------------------------------------------
9. RUNNING THE EXAMPLE LOCALLY
--------------------------------------------------------------------------------

Serve the folder over a local HTTP server (ES modules require HTTP):

  npx serve .
  (or: python3 -m http.server 8080)

Then open http://localhost:8080/example.html in your browser.
================================================================================
