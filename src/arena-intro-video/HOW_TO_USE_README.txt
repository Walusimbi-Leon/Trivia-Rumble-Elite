================================================================================
ARENA INTRO VIDEO (TRIVIA RUMBLE ELITE + CONNECTING TO THE ARENA)
HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the Arena Intro Video package.
This self-contained folder merges TRIVIA RUMBLE ELITE (on top) with the
Arena Loading 3D emblem ("Connecting to the Arena", below) into one cohesive
6.5-second HD intro & loading video (assets/trivia-rumble-arena-intro.mp4 and
assets/trivia-rumble-arena-intro.webm), along with all code needed to integrate
and size it for any app or game.

What happens in the video (6.5 seconds, 1280x720 HD):
  * 0.0s - 1.9s : Cosmic arena sky illuminates and TRIVIA RUMBLE ELITE pops up
                  FIRST on top in a staggered 3D forged-gold letter cascade,
                  backed by roaring blue-violet fire and rising embers.
  * 1.9s - 3.3s : The Arena Loading 3D emblem enters AFTER below it: three
                  concentric brushed champagne-gold & silver gyroscopic rings
                  unfold with swirling cyan plasma energy and sparks, while
                  "Connecting to the Arena" rises cleanly underneath.
  * 3.3s - 6.5s : Both emblems stay alive together with flickering blue flames,
                  gyroscopic ring spin, and a cyan energy surge while your app
                  connects to the arena in the background.


--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt              -> This plain-text integration & sizing guide.
  README.md                          -> Quick-reference Markdown overview.
  arena-intro-video.js               -> Zero-dependency ES module that mounts and
                                        plays the video with mobile-safe inline
                                        autoplay, loop/fade-out, Skip button, and
                                        controller API.
  arena-intro-video.d.ts             -> TypeScript types for arena-intro-video.js.
  ArenaIntroVideo.tsx                -> Drop-in React component wrapper.
  arena-intro-sizing.js              -> Dedicated sizing & device-format code file
                                        for adapting the video to Portrait Phones
                                        (9:16), Landscape Desktops (16:9), Tablets,
                                        Square cards, or Full-Screen overlays.
  arena-intro-sizing.d.ts            -> TypeScript types for arena-intro-sizing.js.
  example.html                       -> Standalone runnable HTML demo page with
                                        Portrait Phone & Landscape Desktop buttons.
  assets/trivia-rumble-arena-intro.mp4  -> Universal H.264 MP4 video with audio.
  assets/trivia-rumble-arena-intro.webm -> VP9 WebM alternative with Opus audio.
  assets/trivia-rumble-arena-poster.jpg -> High-res poster image (prevents blank flash).


--------------------------------------------------------------------------------
2. OPTION A: ADD AS A LOADING / INTRO VIDEO IN PLAIN HTML / VANILLA JS
--------------------------------------------------------------------------------

Step 1: Copy the entire "arena-intro-video" folder into your project directory
        (next to index.html or inside your public/static folder).

Step 2: Add a full-screen loading overlay <div> at the top of your <body>:

  <div id="arena-loading-overlay" style="position: fixed; inset: 0; z-index: 9999; background: #04060d;"></div>

Step 3: Play the video while your app connects to the arena in the background,
        then fade out and remove the overlay once your connection is ready:

  <script type="module">
    import { createArenaIntroVideo } from './arena-intro-video/arena-intro-video.js';

    const overlay = document.getElementById('arena-loading-overlay');

    const intro = createArenaIntroVideo(overlay, {
      format: 'auto',         // Fits Portrait Phones & Landscape Desktops automatically
      autoPlay: true,
      loop: true,             // Keep looping smoothly if connection takes longer than 6.5s
      muted: true,            // Required by browsers for instant autoplay on page load
      fadeOutOnEnd: true,
      onEnded: () => {
        intro.destroy();
        overlay.remove();
      },
    });

    // Connect to your arena backend/matchmaker in the background:
    async function bootArenaApp() {
      await connectToArenaServer(); // Replace with your app's async startup/API call

      // Once connected, fade out smoothly and reveal the app:
      overlay.style.transition = 'opacity 420ms ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        intro.destroy();
        overlay.remove();
      }, 420);
    }

    bootArenaApp();
  </script>

Note on Using a Raw <video> HTML Tag:
  <video
    src="./arena-intro-video/assets/trivia-rumble-arena-intro.mp4"
    poster="./arena-intro-video/assets/trivia-rumble-arena-poster.jpg"
    autoplay
    muted
    loop
    playsinline
    style="width: 100%; height: 100%; object-fit: contain; background: #04060d;"
  ></video>

  IMPORTANT for iOS & Android mobile browsers: Keep "muted" and "playsinline"
  so the intro video autoplays inline without opening a native fullscreen popup.


--------------------------------------------------------------------------------
3. OPTION B: ADD IN REACT / VITE / NEXT.JS / TYPESCRIPT
--------------------------------------------------------------------------------

Step 1: Copy the "arena-intro-video" folder into your "src/" folder (or copy
        assets/ into "public/arena-intro-video/assets/" for Next.js).

Step 2: Render <ArenaIntroVideo /> while connecting to the arena in the background:

  import { useEffect, useState } from 'react';
  import { ArenaIntroVideo } from './arena-intro-video/ArenaIntroVideo';
  import mp4Src from './arena-intro-video/assets/trivia-rumble-arena-intro.mp4';
  import webmSrc from './arena-intro-video/assets/trivia-rumble-arena-intro.webm';
  import posterSrc from './arena-intro-video/assets/trivia-rumble-arena-poster.jpg';

  export function App() {
    const [arenaReady, setArenaReady] = useState(false);
    const [minIntroDone, setMinIntroDone] = useState(false);

    useEffect(() => {
      // Connect to your arena server / preload assets in the background
      connectToArena().then(() => setArenaReady(true));
    }, []);

    // Show the intro video until BOTH the intro plays AND arena is connected
    if (!arenaReady || !minIntroDone) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#04060d' }}>
          <ArenaIntroVideo
            mp4Src={mp4Src}
            webmSrc={webmSrc}
            posterSrc={posterSrc}
            format="auto"
            autoPlay
            muted
            loop={false}
            fadeOutOnEnd={false}
            onEnded={() => setMinIntroDone(true)}
          />
        </div>
      );
    }

    return <YourArenaMainApp />;
  }

Tip: If your connection may take longer than 6.5s, set loop={true} on
<ArenaIntroVideo /> and hide the overlay as soon as `arenaReady` turns true.


--------------------------------------------------------------------------------
4. OPTION C: ADD TO ANY GAME (HTML5 CANVAS, PHASER, UNITY, GODOT, UNREAL)
--------------------------------------------------------------------------------

  * HTML5 / Phaser / PixiJS / Three.js Web Games:
    Mount createArenaIntroVideo() inside a fixed overlay <div> above your game
    canvas while your game scene, textures, and multiplayer socket connect in
    the background. Destroy the overlay once ready.

  * Unity / Godot / Unreal / Native iOS & Android Apps:
    Drop "assets/trivia-rumble-arena-intro.mp4" directly into your engine's
    VideoPlayer / VideoStreamPlayer / AVPlayer / ExoPlayer assets folder. It is
    encoded in standard H.264 YUV420p MP4 with AAC stereo audio and fast-start
    streaming metadata for instant playback on all mobile and desktop GPUs.


--------------------------------------------------------------------------------
5. CONTROLLER API REFERENCE (arena-intro-video.js)
--------------------------------------------------------------------------------

  const intro = createArenaIntroVideo(container, options);

  intro.play()                  -> Start or resume playback
  intro.pause()                 -> Pause playback
  intro.restart()               -> Jump back to 0.0s and play again
  intro.skip()                  -> Stop immediately & fire onSkip / onEnded
  intro.seek(seconds)           -> Scrub to a specific time (0.0 - 6.5)
  intro.setMuted(boolean)       -> Mute or unmute audio
  intro.setVolume(0..100)       -> Adjust audio volume percentage
  intro.setLoop(boolean)        -> Loop continuously while connecting
  intro.setPlaybackRate(rate)   -> Playback speed (0.5x to 2.0x)
  intro.setFormat(formatName)   -> Switch device format live (Section 6)
  intro.setFitMode(mode)        -> 'cover' | 'contain' | 'fill'
  intro.setScale(multiplier)    -> Scale container size (0.25x - 2.5x)
  intro.makeSmaller(step)       -> Shrink container by step (default 0.15)
  intro.makeBigger(step)        -> Enlarge container by step (default 0.15)
  intro.getState()              -> Returns currentTime, duration, sizing state
  intro.destroy()               -> Release video & remove listeners


--------------------------------------------------------------------------------
6. HOW THE SIZING CODE FILE WORKS (arena-intro-sizing.js)
--------------------------------------------------------------------------------

The dedicated sizing code file "arena-intro-sizing.js" controls the container
dimensions, aspect ratio, fitMode, and vertical focal-point tracking so the
merged video looks clean on BOTH Portrait Phone screens and Landscape Desktops.

6A. Available Format Presets (ARENA_INTRO_VIDEO_FORMATS):

  * 'auto'                -> Automatically checks the screen/parent dimensions
                             and selects 'phone-portrait' on tall portrait
                             phones or 'desktop-landscape' on wide desktops.
                             Updates automatically whenever the window resizes!
  * 'desktop-landscape'   -> 16:9 widescreen (max 1280px wide, object-fit: cover)
  * 'desktop-compact'     -> 960 x 540 px (16:9 medium desktop card)
  * 'phone-portrait'      -> 9:16 mobile portrait (360 x 640 px, object-fit:
                             contain so ALL of TRIVIA RUMBLE ELITE on top and
                             Connecting to the Arena below fit side-to-side
                             with seamless #04060d cosmic blending)
  * 'phone-portrait-fill' -> 9:16 edge-to-edge full bleed (360 x 640 px,
                             object-fit: cover with smart focal tracking)
  * 'tablet-landscape'    -> 4:3 (760 x 570 px)
  * 'tablet-portrait'     -> 3:4 (480 x 640 px)
  * 'square'              -> 1:1 (520 x 520 px)
  * 'fullscreen'          -> 100% x 100% (fills entire viewport/overlay cleanly)

6B. Smart Dual-Emblem Focal Tracking ('stack'):

  Because TRIVIA RUMBLE ELITE pops up FIRST in the top half (0.0s - 1.9s) and
  the Arena Loading emblem enters AFTER below it (1.9s - 3.3s),
  computeArenaIntroFocalPosition(progress, 'stack') smoothly glides vertical
  focus from 50% 34% (top emblem) to 50% 50% (full stack) when in cover mode.

6C. Using the Sizing File Directly (Standalone or with Custom <video>):

  import {
    applyArenaIntroVideoSize,
    createArenaIntroVideoSizer,
  } from './arena-intro-video/arena-intro-sizing.js';

  const box = document.getElementById('video-box');
  const video = box.querySelector('video');

  // Option 1: One-shot preset or custom size
  applyArenaIntroVideoSize(box, video, 'phone-portrait');
  // Or custom pixel dimensions:
  applyArenaIntroVideoSize(box, video, {
    width: 400,
    height: 700,
    aspectRatio: '9 / 16',
    fitMode: 'contain',
    focalPoint: 'stack',
  });

  // Option 2: Stateful runtime sizer (switch devices or scale smaller/bigger)
  const sizer = createArenaIntroVideoSizer(box, video, 'desktop-landscape');

  sizer.setFormat('phone-portrait');     // Switch to 9:16 phone view
  sizer.setFormat('desktop-landscape');  // Switch back to 16:9 desktop view
  sizer.setFitMode('contain');           // 'contain' | 'cover' | 'fill'
  sizer.makeSmaller(0.15);               // Shrink by 15%
  sizer.makeBigger(0.15);                // Grow by 15%
  sizer.setScale(0.8);                   // Set exact 80% scale
  sizer.setDimensions(800, 450);         // Set exact pixel dimensions

  // Keep smart focal tracking synced if driving your own <video>:
  video.addEventListener('timeupdate', () => {
    sizer.syncVideoProgress(video.currentTime, video.duration);
  });


--------------------------------------------------------------------------------
7. RUNNING THE EXAMPLE LOCALLY
--------------------------------------------------------------------------------

Serve the folder over any local HTTP server (ES modules require HTTP):

  npx serve .
  (or: python3 -m http.server 8080)

Then open http://localhost:8080/example.html in your browser.
================================================================================
