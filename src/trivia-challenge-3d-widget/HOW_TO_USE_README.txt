================================================================================
SGSS TRIVIA CHALLENGE 3D MONITOR WIDGET - HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the SGSS Trivia Challenge 3D Monitor Widget.
This self-contained folder includes the living, animated 3D SGSS Trivia
Challenge monitor and all code needed to drop it into any web app, quiz
platform, or game.

--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt              -> This plain-text integration guide.
  README.md                          -> Quick-reference Markdown guide.
  trivia-challenge-3d.js             -> Full interactive Three.js 3D monitor
                                        with SGSS top crest, glowing holographic
                                        screen, clickable A/B/C/D options, live
                                        countdown timer, and 4 living motions.
  trivia-challenge-3d.d.ts           -> TypeScript types for trivia-challenge-3d.js.
  TriviaChallenge3DWidget.tsx        -> Drop-in React component wrapper.
  trivia-challenge-image-widget.js   -> Zero-dependency 2.5D animated image widget
                                        using assets/trivia-challenge-badge.jfif
                                        (no Three.js required).
  trivia-challenge-image-widget.d.ts -> TypeScript types for the 2.5D image widget.
  trivia-challenge-sizing.js         -> Dedicated sizing helper for making this
                                        3D widget smaller or bigger or fitting
                                        into any layout slot/button.
  trivia-challenge-sizing.d.ts       -> TypeScript types for trivia-challenge-sizing.js.
  assets/trivia-challenge-badge.jfif -> Original 3D SGSS Trivia Challenge image.
  example.html                       -> Ready-to-run standalone HTML demo page.


--------------------------------------------------------------------------------
2. LIVING MOTION & INTERACTIVE FEATURES
--------------------------------------------------------------------------------

  * 4 Continuous Living Motion Modes:
    - 'float' : Smooth studio levitation, gimbal head sway, scanline sweep,
                floating cyber particles, and breathing holographic glow.
    - 'pulse' : Rhythmic stage/game-show pulse across the screen & bezel.
    - 'orbit' : Graceful figure-8 3D showcase motion with sweeping rim lights.
    - 'tilt'  : Pointer-reactive 3D tilt that tracks the user's cursor.

  * Directly Clickable 3D Monitor Screen:
    - Hover and click options A, B, C, or D directly on the 3D glass display.
    - Highlights Correct (Emerald) or Incorrect (Crimson) and plays synthesized
      Web Audio chime/buzz feedback.
    - Live ticking 30-second countdown ring (`0:30 seconds`) and animated progress bar.


--------------------------------------------------------------------------------
3. OPTION A: ADD TO ANY VANILLA JS / HTML APP OR GAME (NO BUNDLER)
--------------------------------------------------------------------------------

Step 1: Copy the entire "trivia-challenge-3d-widget" folder into your project
        (next to index.html or inside your public/static folder).

Step 2: Add a container element where the 3D monitor should appear:

  <div id="trivia-monitor" style="width: 620px; height: 388px;"></div>

Step 3: If you do not use npm/Vite, add Three.js via an importmap in <head>:

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
      }
    }
  </script>

Step 4: Mount the living 3D monitor inside a <script type="module">:

  <script type="module">
    import { createTriviaChallenge3DWidget } from './trivia-challenge-3d-widget/trivia-challenge-3d.js';

    const monitor = createTriviaChallenge3DWidget(document.getElementById('trivia-monitor'), {
      question: 'Which company developed the first commercial graphical web browser, Mosaic, in 1993?',
      options: [
        'Netscape Communications',
        'Microsoft Corporation',
        'Spyglass, Inc.',
        'The National Center for Supercomputing Applications (NCSA)',
      ],
      correctIndex: 3,            // Index 0..3 (3 = D), or null to disable auto-grading
      timerSeconds: 30,
      maxTimerSeconds: 30,
      timerRunning: true,
      motionMode: 'float',        // 'float' | 'pulse' | 'orbit' | 'tilt'
      speed: 1.0,
      intensity: 1.0,
      background: 'transparent',  // Use 'transparent' over your app or game background
      showStudioFloor: false,
      enableOrbit: true,
      enableSoundFeedback: true,
      masterVolume: 70,
      onSelectOption: (event) => {
        console.log('Player picked:', event.letter, event.text, 'Correct?', event.isCorrect);
      },
    });
  </script>


--------------------------------------------------------------------------------
4. OPTION B: ADD TO A BUNDLED APP OR GAME (REACT / VITE / NEXT.JS / TYPESCRIPT)
--------------------------------------------------------------------------------

Step 1: Install Three.js in your project if not already installed:

  npm install three
  npm install -D @types/three   (if using TypeScript)

Step 2: Copy the "trivia-challenge-3d-widget" folder into your "src/" folder.

Step 3 (React / Next.js): Render <TriviaChallenge3DWidget /> inside any screen:

  import { TriviaChallenge3DWidget } from './trivia-challenge-3d-widget/TriviaChallenge3DWidget';

  export function QuizStage() {
    return (
      <div style={{ width: 620, height: 388 }}>
        <TriviaChallenge3DWidget
          question="Which planet has the most moons in our solar system?"
          options={['Earth', 'Saturn', 'Mars', 'Venus']}
          correctIndex={1}
          motionMode="float"
          background="transparent"
          showStudioFloor={false}
          onSelectOption={(ev) => console.log('Picked:', ev)}
        />
      </div>
    );
  }


--------------------------------------------------------------------------------
5. OPTION C: ADD TO ANY GAME HUD / CANVAS OVERLAY (PHASER, THREE.JS, UNITY, GODOT)
--------------------------------------------------------------------------------

Mount the widget inside a transparent overlay <div> positioned over your game
canvas so it floats cleanly above your game world:

  <div style="position: relative; width: 100vw; height: 100vh;">
    <canvas id="game-canvas"></canvas>
    <div
      id="trivia-hud"
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 560px; height: 350px; z-index: 20;"
    ></div>
  </div>

Then drive new trivia rounds directly from your game loop:

  monitor.setQuestion({
    question: 'Next round question...',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 2,
    timerSeconds: 20,
    maxTimerSeconds: 20,
  });


--------------------------------------------------------------------------------
6. OPTION D: ZERO-DEPENDENCY 2.5D IMAGE MODE (NO THREE.JS REQUIRED)
--------------------------------------------------------------------------------

If your project does not use Three.js, use "trivia-challenge-image-widget.js"
with "assets/trivia-challenge-badge.jfif". It brings the original 3D image to
life with smooth floating/breathing motion, holographic cyan-magenta sheen
sweeps, cursor-reactive 3D tilt, and click audio feedback:

  import { createTriviaChallengeImageWidget } from './trivia-challenge-3d-widget/trivia-challenge-image-widget.js';

  const card = createTriviaChallengeImageWidget(document.getElementById('trivia-monitor'), {
    imageSrc: './trivia-challenge-3d-widget/assets/trivia-challenge-badge.jfif',
    motionMode: 'float',   // 'float' | 'pulse' | 'orbit' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    enableSoundFeedback: true,
    onClick: () => console.log('3D Monitor clicked!'),
  });


--------------------------------------------------------------------------------
7. CONTROLLER API & CLEANUP
--------------------------------------------------------------------------------

"createTriviaChallenge3DWidget(...)" returns a controller with these methods:

  monitor.setQuestion(payload)       -> Load a new question, 4 options & timer
  monitor.selectOption(index)        -> Programmatically select option 0..3
  monitor.resetSelection()           -> Clear selection and reset timer
  monitor.setTimer(sec, maxSec)      -> Update countdown readout & bar
  monitor.setTimerRunning(bool)      -> Start or pause countdown timer
  monitor.setMotionMode(mode)        -> 'float' | 'pulse' | 'orbit' | 'tilt'
  monitor.setSpeed(multiplier)       -> Animation speed (0.25 - 2.5)
  monitor.setIntensity(multiplier)   -> Motion amplitude (0.25 - 2.2)
  monitor.setAudioEnabled(bool)      -> Toggle Web Audio feedback
  monitor.setMasterVolume(percent)   -> Set audio volume (0 - 100)
  monitor.pulse()                    -> Trigger a kinetic glow pulse
  monitor.resetCamera()              -> Smoothly reset 3D orbit camera
  monitor.destroy()                  -> Clean up WebGL resources & listeners

Always call "monitor.destroy()" when unmounting or changing game scenes.


--------------------------------------------------------------------------------
8. HOW THE SIZING FILE WORKS (trivia-challenge-sizing.js)
--------------------------------------------------------------------------------

The dedicated sizing file "trivia-challenge-sizing.js" controls the container
dimensions of the 3D monitor (both the Three.js 3D mode and the 2.5D image
mode) so you can make it smaller or bigger at any time without editing CSS.
Because the 3D widget uses a ResizeObserver, changing the container size via
this file automatically resizes the WebGL canvas smoothly.

Available Size Presets:
  * 'xs'   -> 180 x 112 px  (compact HUD thumbnail or mini corner preview)
  * 'sm'   -> 280 x 175 px  (sidebar card or compact quiz widget)
  * 'md'   -> 420 x 262 px  (default balanced card size)
  * 'lg'   -> 620 x 388 px  (featured trivia modal / game stage)
  * 'xl'   -> 840 x 525 px  (large presentation hero monitor)
  * 'full' -> 100% x 100%   (fills its parent container completely)

Method 1 — One-time sizing with "applyTriviaChallenge3DSize(container, size)":

  import { applyTriviaChallenge3DSize } from './trivia-challenge-3d-widget/trivia-challenge-sizing.js';
  import { createTriviaChallenge3DWidget } from './trivia-challenge-3d-widget/trivia-challenge-3d.js';

  const slot = document.getElementById('trivia-monitor');

  // Option A: Use a preset name ('xs', 'sm', 'md', 'lg', 'xl', 'full')
  applyTriviaChallenge3DSize(slot, 'lg');

  // Option B: Use a scale multiplier (e.g., 0.65 = smaller, 1.5 = bigger)
  applyTriviaChallenge3DSize(slot, 0.75);

  // Option C: Pass exact pixel dimensions
  applyTriviaChallenge3DSize(slot, { width: 520, height: 325 });

  // Then mount the 3D widget inside the sized slot:
  createTriviaChallenge3DWidget(slot, { background: 'transparent' });

Method 2 — Dynamic resizing (make smaller / make bigger at runtime) with
           "createTriviaChallenge3DSizer(container, initialSize)":

  import { createTriviaChallenge3DSizer } from './trivia-challenge-3d-widget/trivia-challenge-sizing.js';

  const sizer = createTriviaChallenge3DSizer(slot, 'md');

  // Make it smaller or bigger in steps (default step is 0.2 = 20%):
  sizer.makeSmaller(0.2);        // Shrinks container by 20% (min scale 0.25x)
  sizer.makeBigger(0.2);         // Enlarges container by 20% (max scale 3.0x)

  // Jump to an exact scale, preset, or pixel dimensions:
  sizer.setScale(1.4);           // 1.4x bigger than initial size
  sizer.setPreset('sm');         // Switch to small 280x175 preset
  sizer.setDimensions(720, 450); // Set exact custom width & height in px
  console.log(sizer.getSize());  // Returns { width, height, scale, preset }


--------------------------------------------------------------------------------
9. RUNNING THE EXAMPLE LOCALLY
--------------------------------------------------------------------------------

Serve the folder over a local HTTP server (ES modules require HTTP):

  npx serve .
  (or: python3 -m http.server 8080)

Then open http://localhost:8080/example.html in your browser.
================================================================================
