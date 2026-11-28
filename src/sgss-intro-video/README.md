# SGSS Intro Video

Drop-in, living studio-to-monitor intro video (`assets/sgss-intro.mp4` & `assets/sgss-intro.webm`) with responsive device sizing (`sgss-intro-sizing.js`) for Portrait Phones (`9:16`), Landscape Desktops (`16:9`), Tablets, Square cards, and Full-Screen app splash screens.

## Quick Start (App Intro Overlay)

```html
<div id="app-intro" style="position: fixed; inset: 0; z-index: 9999; background: #060911;"></div>

<script type="module">
  import { createSgssIntroVideo } from './sgss-intro-video/sgss-intro-video.js';

  const overlay = document.getElementById('app-intro');
  const intro = createSgssIntroVideo(overlay, {
    format: 'auto',
    autoPlay: true,
    muted: true,
    showSkipButton: true,
    fadeOutOnEnd: true,
    onEnded: () => {
      intro.destroy();
      overlay.remove();
    },
  });
</script>
```

See **`HOW_TO_USE_README.txt`** for complete Vanilla JS, React/Next.js, Game Engine, and `sgss-intro-sizing.js` documentation.
