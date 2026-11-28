================================================================================
SGSS INTRO VIDEO - HOW TO USE & INTEGRATION GUIDE
================================================================================

Thank you for using the SGSS Intro Video package.
This self-contained folder contains the living studio-to-monitor intro video
(assets/sgss-intro.mp4 and assets/sgss-intro.webm) plus all code needed to
integrate it as an intro splash video into any web app, mobile app, or game.

What happens in the video (6.0 seconds, 1280x720 HD):
  * 0.0s - 0.9s : Wide shot of the living studio desk (glowing SGSS wall sign,
                  RGB keyboard ripple, floating dust motes, and an active
                  animated dashboard on the curved ultrawide monitor).
  * 0.9s - 3.0s : Smooth first-person handheld camera push-in that walks up
                  and locks squarely onto the monitor screen right at 3.0s
                  (100% pure monitor fill -- zero desk, zero bezel).
  * 3.0s - 4.3s : The exact moment the camera reaches the screen at 3.0s, a
                  glowing cyan energy wave sweeps across and wavely clears away
                  all dashboard widgets and charts.
  * 4.3s - 6.0s : Crisp metallic 3D "SGSS" lettering reveals in the center of
                  the cleared monitor screen with a specular light sweep
                  before transitioning into your app or game.


--------------------------------------------------------------------------------
1. FOLDER CONTENTS
--------------------------------------------------------------------------------

  HOW_TO_USE_README.txt      -> This plain-text integration & sizing guide.
  README.md                  -> Quick-reference Markdown documentation.
  sgss-intro-video.js        -> Zero-dependency ES module that mounts and plays
                                the intro video with mobile-safe inline autoplay,
                                optional Skip Intro button, fade-out, and hooks.
  sgss-intro-video.d.ts      -> TypeScript declarations for sgss-intro-video.js.
  SgssIntroVideo.tsx         -> Drop-in React component wrapper.
  sgss-intro-sizing.js       -> Dedicated video sizing & device-format code file
                                for adapting the video to Portrait Phones (9:16),
                                Landscape Desktops (16:9), Tablets, Square, or
                                Full-Screen app intros.
  sgss-intro-sizing.d.ts     -> TypeScript declarations for sgss-intro-sizing.js.
  example.html               -> Standalone runnable HTML demo page with Portrait
                                Phone & Landscape Desktop format buttons.
  assets/sgss-intro.mp4      -> Universal H.264 MP4 video (with stereo audio).
  assets/sgss-intro.webm     -> VP9 WebM video alternative (with Opus audio).
  assets/sgss-intro-poster.jpg -> First-frame poster image (prevents blank flash).


--------------------------------------------------------------------------------
2. OPTION A: ADD AS AN APP INTRO VIDEO IN PLAIN HTML / VANILLA JS
--------------------------------------------------------------------------------

Step 1: Copy the entire "sgss-intro-video" folder into your project directory
        (next to index.html or inside your public/static folder).

Step 2: Add an intro overlay container at the top of your <body>:

  <div id="app-intro" style="position: fixed; inset: 0; z-index: 9999; background: #060911;"></div>

Step 3: Mount the intro video in a <script type="module"> and hide the overlay
        when the video finishes (or when the user clicks Skip):

  <script type="module">
    import { createSgssIntroVideo } from './sgss-intro-video/sgss-intro-video.js';

    const overlay = document.getElementById('app-intro');

    const intro = createSgssIntroVideo(overlay, {
      format: 'auto',             // Automatically fits portrait phone or landscape desktop!
      autoPlay: true,
      muted: true,                // Required by browsers for reliable instant autoplay
      showSkipButton: true,       // Shows a "Skip Intro" button in bottom-right
      fadeOutOnEnd: true,         // Smoothly fades out at 6.0s
      onEnded: () => {
        intro.destroy();
        overlay.remove();         // Reveal your main app or game!
      }
    });
  </script>

Note on Native <video> Tag Usage (if you only want raw HTML):
  <video
    src="./sgss-intro-video/assets/sgss-intro.mp4"
    poster="./sgss-intro-video/assets/sgss-intro-poster.jpg"
    autoplay
    muted
    playsinline
    style="width: 100%; height: 100%; object-fit: cover;"
  ></video>

  IMPORTANT for iOS/Android mobile web: Always include "muted" and
  "playsinline" if autoplaying on page load so mobile Safari/Chrome play the
  video inline instead of blocking or opening a native fullscreen popup.


--------------------------------------------------------------------------------
3. OPTION B: ADD AS AN INTRO VIDEO IN REACT / VITE / NEXT.JS / TYPESCRIPT
--------------------------------------------------------------------------------

Step 1: Copy the "sgss-intro-video" folder into your "src/" folder (or copy
        assets/ into "public/sgss-intro-video/assets/" for Next.js).

Step 2: Render <SgssIntroVideo /> conditionally on app launch:

  import { useState } from 'react';
  import { SgssIntroVideo } from './sgss-intro-video/SgssIntroVideo';
  import mp4Src from './sgss-intro-video/assets/sgss-intro.mp4';
  import webmSrc from './sgss-intro-video/assets/sgss-intro.webm';
  import posterSrc from './sgss-intro-video/assets/sgss-intro-poster.jpg';

  export function App() {
    const [showIntro, setShowIntro] = useState(true);

    if (showIntro) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#060911' }}>
          <SgssIntroVideo
            mp4Src={mp4Src}
            webmSrc={webmSrc}
            posterSrc={posterSrc}
            format="fullscreen"
            autoPlay
            muted
            showSkipButton
            fadeOutOnEnd
            onEnded={() => setShowIntro(false)}
          />
        </div>
      );
    }

    return <YourMainApp />;
  }


--------------------------------------------------------------------------------
4. OPTION C: ADD TO ANY GAME (HTML5 CANVAS, PHASER, UNITY, GODOT, UNREAL)
--------------------------------------------------------------------------------

  * HTML5 / Phaser / PixiJS / Three.js Web Games:
    Mount createSgssIntroVideo() into a fixed overlay <div> above your game
    canvas while your game assets preload in the background. When onEnded fires,
    destroy the intro and start your title menu or first scene.

  * Unity / Godot / Unreal / Native iOS & Android Apps:
    Drop "assets/sgss-intro.mp4" directly into your engine's VideoPlayer /
    VideoStreamPlayer / AVPlayer / ExoPlayer asset folder. It is encoded in
    standard H.264 YUV420p MP4 with AAC stereo audio and fast-start metadata,
    which plays natively on all mobile and desktop GPUs.


--------------------------------------------------------------------------------
5. CONTROLLER API REFERENCE (sgss-intro-video.js)
--------------------------------------------------------------------------------

  const intro = createSgssIntroVideo(container, options);

  intro.play()                  -> Start or resume playback
  intro.pause()                 -> Pause playback
  intro.restart()               -> Jump to 0.0s and play again
  intro.skip()                  -> Stop immediately & fire onSkip / onEnded
  intro.seek(seconds)           -> Scrub to a specific time (0.0 - 6.0)
  intro.setMuted(boolean)       -> Mute or unmute the intro audio track
  intro.setVolume(0..100)       -> Adjust audio volume percentage
  intro.setLoop(boolean)        -> Loop continuously (e.g. for title backgrounds)
  intro.setPlaybackRate(rate)   -> Change speed (0.5 = slow, 1.0 = normal, 2.0 = fast)
  intro.setFormat(formatName)   -> Switch device format live (see Section 6)
  intro.setFitMode(mode)        -> 'cover' | 'contain' | 'fill'
  intro.setScale(multiplier)    -> Scale container size (0.25x - 2.5x)
  intro.makeSmaller(step)       -> Shrink container by step (default 0.15)
  intro.makeBigger(step)        -> Enlarge container by step (default 0.15)
  intro.getState()              -> Returns currentTime, duration, sizing state
  intro.destroy()               -> Stop playback, release video & remove listeners


--------------------------------------------------------------------------------
6. HOW THE SIZING CODE FILE WORKS (sgss-intro-sizing.js)
--------------------------------------------------------------------------------

The dedicated sizing file "sgss-intro-sizing.js" controls the aspect ratio,
container size, fit mode, and smart monitor focal tracking so the intro video
looks sharp and properly framed on BOTH Portrait Phone screens and Landscape
Desktop displays.

6A. Available Format Presets (SGSS_INTRO_VIDEO_FORMATS):

  * 'auto'                -> Automatically inspects the screen/parent width vs
                             height and chooses 'phone-portrait-fill' on tall
                             portrait phones or 'desktop-landscape' on wide
                             screens. Updates automatically on window resize!
  * 'desktop-landscape'   -> 16:9 widescreen (max 1280px wide, object-fit: cover)
  * 'desktop-compact'     -> 960 x 540 px (16:9 medium desktop card)
  * 'phone-portrait'      -> 9:16 mobile portrait (360 x 640 px, object-fit:
                             contain so the entire studio room & monitor show
                             with zero horizontal cropping)
  * 'phone-portrait-fill' -> 9:16 edge-to-edge full bleed (360 x 640 px,
                             object-fit: cover WITH smart focal-point tracking!)
  * 'tablet-landscape'    -> 4:3 (760 x 570 px)
  * 'tablet-portrait'     -> 3:4 (480 x 640 px)
  * 'square'              -> 1:1 (520 x 520 px)
  * 'fullscreen'          -> 100% x 100% (fills entire viewport/overlay)

6B. Why Smart Focal-Point Tracking ('monitor') Matters for Portrait Phones:

  In the first ~0.9 seconds of the video, the monitor sits slightly left of
  center (x ~ 36%, y ~ 46%) in the 16:9 studio room. As the camera walks in
  (0.9s -> 3.0s), the monitor fills 100% of the frame (50% 50%) right at 3.0s,
  keeping the wavy screen clear and SGSS logo reveal centered on phones.

  If you display a 16:9 video in full-bleed 'cover' mode on a tall 9:16
  portrait phone with static center crop (50% 50%), the left side of the
  monitor would get cropped off at the start!

  "sgss-intro-sizing.js" solves this automatically via:
    computeSgssIntroFocalPosition(progress, 'monitor')
  which smoothly glides CSS object-position from "36% 46%" (centered directly
  on the monitor during the wide shot) to "50% 50%" (full monitor lock), so
  portrait phones stay locked on the action the whole time!

6C. Using the Sizing File Directly (Standalone or with Custom <video>):

  import {
    applySgssIntroVideoSize,
    createSgssIntroVideoSizer,
  } from './sgss-intro-video/sgss-intro-sizing.js';

  const box = document.getElementById('video-box');
  const video = box.querySelector('video');

  // Option 1: One-shot preset or custom size
  applySgssIntroVideoSize(box, video, 'phone-portrait-fill');
  // Or custom dimensions:
  applySgssIntroVideoSize(box, video, {
    width: 420,
    height: 740,
    aspectRatio: '9 / 16',
    fitMode: 'cover',
    focalPoint: 'monitor',
  });

  // Option 2: Stateful runtime sizer (switch formats or resize smaller/bigger)
  const sizer = createSgssIntroVideoSizer(box, video, 'desktop-landscape');

  sizer.setFormat('phone-portrait');     // Switch to 9:16 phone view
  sizer.setFormat('desktop-landscape');  // Switch back to 16:9 desktop view
  sizer.setFitMode('cover');             // Switch between 'cover' | 'contain' | 'fill'
  sizer.makeSmaller(0.15);               // Shrink by 15%
  sizer.makeBigger(0.15);                // Grow by 15%
  sizer.setScale(0.8);                   // Set exact 80% scale
  sizer.setDimensions(800, 450);         // Set exact pixel dimensions

  // Keep focal tracking synced if controlling your own <video>:
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
