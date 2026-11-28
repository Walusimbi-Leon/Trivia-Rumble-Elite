================================================================================
SUPPORT DEVELOPER 3D WIDGET - HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the SUPPORT DEVELOPER 3D Widget.
This folder contains the living, multi-motion 3D "SUPPORT DEVELOPER" badge
and every file needed to drop it into any web application, portfolio, donation
page, or browser game.

--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt              -> This step-by-step plain-text guide.
  README.md                          -> Quick-reference Markdown guide.
  support-developer-3d.js            -> Full interactive Three.js 3D module with
                                        all 7 motions + Auto Cycle, speed,
                                        intensity, click ripples, and chimes.
  support-developer-3d.d.ts          -> TypeScript types for support-developer-3d.js.
  SupportDeveloper3DWidget.tsx       -> Drop-in React component wrapper.
  support-developer-image-widget.js  -> Zero-dependency 2.5D animated image
                                        version (uses the .jfif image with all
                                        motion modes, no Three.js required).
  support-developer-image-widget.d.ts-> TypeScript types for the 2.5D image widget.
  support-developer-sizing.js        -> Dedicated sizing helper for button/card
                                        presets and resizing smaller or bigger.
  support-developer-sizing.d.ts      -> TypeScript types for sizing helper.
  assets/support-developer-badge.jfif-> Original 3D Support Developer image asset.
  example.html                       -> Runnable standalone demo with all controls.


--------------------------------------------------------------------------------
2. INCLUDED MOTION MODES, SPEED & INTENSITY
--------------------------------------------------------------------------------

  All motion logic lives inside "support-developer-3d.js" (and 2.5D equivalents
  inside "support-developer-image-widget.js"):

  1) 'wave'       -> Continuous harmonic wave flowing across all 16 letters.
  2) 'heartbeat'  -> Warm double-beat cardiac pulse across the badge & text.
  3) 'hover'      -> Weightless 3D figure-8 float with gentle gimbal sway.
  4) 'ripple'     -> Periodic shockwave ripple radiating from the center.
  5) 'bounce'     -> Sequential letter-by-letter spring pop animation.
  6) 'shimmer'    -> Diagonal studio spotlight & cyan glint sweeping letters.
  7) 'tilt'       -> Interactive 3D tilt following the user's cursor.
  8) 'auto'       -> Automatically showcases and cycles through all 7 motions.

  Adjustable Parameters:
  * speed     : Number from 0.2 to 2.5 (default: 1.0)
  * intensity : Number from 0.2 to 2.0 (default: 1.0)

  Interactive Click & Hover:
  * Hovering any letter lifts it forward with a cyan glow.
  * Clicking anywhere on the badge fires a kinetic ripple + musical chime and
    triggers your "onClick" callback (ideal for opening a support/donation link).


--------------------------------------------------------------------------------
3. OPTION A: ADD TO ANY VANILLA JS / HTML APP OR GAME (NO BUNDLER)
--------------------------------------------------------------------------------

Step 1: Copy the entire "support-developer-3d-widget" folder next to your
        index.html (or inside your static/public directory).

Step 2: Add a container <div> where you want the Support Developer badge:

  <div id="support-btn" style="width: 300px; height: 190px;"></div>

Step 3: If your project does not use npm/Vite, add Three.js via an importmap in
        your HTML <head>:

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
      }
    }
  </script>

Step 4: Import and configure the motion, speed, and click action:

  <script type="module">
    import { createSupportDeveloper3DWidget } from './support-developer-3d-widget/support-developer-3d.js';

    const badge = createSupportDeveloper3DWidget(document.getElementById('support-btn'), {
      motionMode: 'wave',         // 'wave'|'heartbeat'|'hover'|'ripple'|'bounce'|'shimmer'|'tilt'|'auto'
      speed: 1.0,                 // Animation speed (0.2 - 2.5)
      intensity: 1.0,             // Motion amplitude (0.2 - 2.0)
      background: 'transparent',  // Transparent to blend into your app or game UI
      showStudioFloor: false,     // Hide studio grid when overlaying on your UI
      enableOrbit: true,          // Allow drag to inspect 3D angle
      enableSoundFeedback: true,  // Soft harmonic chime when clicked
      masterVolume: 70,           // 0 - 100
      onClick: (event) => {
        console.log('Clicked letter:', event.char);
        // Hook your support action here (open modal, link to Patreon/Ko-fi, etc.)
      },
    });
  </script>


--------------------------------------------------------------------------------
4. OPTION B: ADD TO A BUNDLED APP OR GAME (REACT / VITE / NEXT.JS / TYPESCRIPT)
--------------------------------------------------------------------------------

Step 1: Install Three.js if not already installed:

  npm install three
  npm install -D @types/three   (if using TypeScript)

Step 2: Copy the "support-developer-3d-widget" folder into your "src/" folder.

Step 3 (React / Next.js): Render <SupportDeveloper3DWidget />:

  import { SupportDeveloper3DWidget } from './support-developer-3d-widget/SupportDeveloper3DWidget';

  export function SupportBanner() {
    return (
      <div style={{ width: 320, height: 210 }}>
        <SupportDeveloper3DWidget
          motionMode="heartbeat"
          speed={1.1}
          intensity={1.0}
          background="transparent"
          showStudioFloor={false}
          onClick={() => {
            // Open your support / tip modal
          }}
        />
      </div>
    );
  }


--------------------------------------------------------------------------------
5. OPTION C: ADD TO ANY GAME HUD OR MENU (PHASER, THREE.JS, PIXI, UNITY, GODOT)
--------------------------------------------------------------------------------

Position a transparent <div> over your game <canvas> (for example, in the
bottom-right corner of your main menu, pause screen, or credits):

  <div style="position: relative; width: 100vw; height: 100vh;">
    <canvas id="game-canvas"></canvas>
    <div
      id="support-hud"
      style="position: absolute; bottom: 20px; right: 20px; width: 240px; height: 150px; z-index: 20;"
    ></div>
  </div>

Then mount with "background: 'transparent'" and "showStudioFloor: false".
You can also trigger a ripple dynamically from your game code:

  badge.setMotionMode('auto'); // Cycle all motions on the title screen
  badge.setSpeed(1.3);
  badge.pulse();               // Fire a ripple on achievement or thank-you


--------------------------------------------------------------------------------
6. OPTION D: ZERO-DEPENDENCY 2.5D IMAGE MODE (NO THREE.JS REQUIRED)
--------------------------------------------------------------------------------

If your app or game does not use Three.js, use "support-developer-image-widget.js"
with "assets/support-developer-badge.jfif". It supports the motion modes, speed,
intensity, pointer tilt, cyan sheen sweep, and click chime with zero packages:

  import { createSupportDeveloperImageWidget } from './support-developer-3d-widget/support-developer-image-widget.js';

  const imgBadge = createSupportDeveloperImageWidget(document.getElementById('support-btn'), {
    imageSrc: './support-developer-3d-widget/assets/support-developer-badge.jfif',
    motionMode: 'heartbeat',
    speed: 1.0,
    intensity: 1.0,
    masterVolume: 70,
    onClick: () => console.log('Support Developer clicked!'),
  });


--------------------------------------------------------------------------------
7. FULL CONTROLLER API & CLEANUP
--------------------------------------------------------------------------------

"createSupportDeveloper3DWidget(...)" returns a controller with:

  badge.getMotionMode()            -> Returns current motion mode string
  badge.setMotionMode(mode)        -> Switch between any of the 8 modes live
  badge.setSpeed(multiplier)       -> Set animation speed (0.2 - 2.5)
  badge.setIntensity(multiplier)   -> Set motion strength (0.2 - 2.0)
  badge.setAudioEnabled(boolean)   -> Enable/disable click chimes
  badge.setMasterVolume(percent)   -> Set chime volume (0 - 100)
  badge.pulse(letterIndex)         -> Trigger ripple wave & chime
  badge.resetCamera()              -> Smoothly reset camera angle
  badge.destroy()                  -> Dispose WebGL & remove listeners

Always call "badge.destroy()" when removing the widget or changing game scenes.


--------------------------------------------------------------------------------
8. SIZING FOR BUTTONS & APP SECTIONS (support-developer-sizing.js)
--------------------------------------------------------------------------------

Use "support-developer-sizing.js" to turn the Support Developer 3D badge into a
compact footer/menu button or a large callout card, and resize it at runtime.

Available presets:
  * 'xs'   -> 130 x  82 px (compact footer/nav button)
  * 'sm'   -> 210 x 132 px (sidebar / card button)
  * 'md'   -> 320 x 200 px (default section badge)
  * 'lg'   -> 460 x 290 px (featured support banner)
  * 'xl'   -> 640 x 400 px (hero display)
  * 'full' -> 100% x 100% (fills parent container)

Example 1 — Size as a compact button in your app or game:

  import { applySupportDeveloper3DSize } from './support-developer-3d-widget/support-developer-sizing.js';
  import { createSupportDeveloper3DWidget } from './support-developer-3d-widget/support-developer-3d.js';

  const btnSlot = document.getElementById('support-btn');
  applySupportDeveloper3DSize(btnSlot, 'sm'); // Or 0.65 for 65% scale
  createSupportDeveloper3DWidget(btnSlot, { background: 'transparent', showStudioFloor: false });

Example 2 — Dynamically make it smaller or bigger:

  import { createSupportDeveloper3DSizer } from './support-developer-3d-widget/support-developer-sizing.js';

  const sizer = createSupportDeveloper3DSizer(btnSlot, 'md');
  sizer.makeSmaller(0.2);        // Shrinks by 20%
  sizer.makeBigger(0.2);         // Enlarges by 20%
  sizer.setScale(0.75);          // 75% scale
  sizer.setPreset('xs');         // Switch to mini button size
  sizer.setDimensions(180, 112); // Exact pixel width & height


--------------------------------------------------------------------------------
9. RUNNING THE INCLUDED EXAMPLE LOCALLY
--------------------------------------------------------------------------------

Serve the folder over a local HTTP server:

  npx serve .
  (or: python3 -m http.server 8080)

Then open http://localhost:8080/example.html in your browser.
================================================================================
