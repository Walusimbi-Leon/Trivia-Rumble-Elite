# SGSS Trivia Challenge 3D Monitor Widget

A living, interactive 3D trivia monitor featuring the **SGSS** metallic top crest, glowing holographic screen, clickable `A` / `B` / `C` / `D` option cards, animated countdown timer, and 4 continuous motion modes (`float`, `pulse`, `orbit`, `tilt`).

## Quick Start (Vanilla JS / Games)

```html
<div id="trivia-stage" style="width: 620px; height: 388px;"></div>
<script type="module">
  import { createTriviaChallenge3DWidget } from './trivia-challenge-3d-widget/trivia-challenge-3d.js';

  const monitor = createTriviaChallenge3DWidget(document.getElementById('trivia-stage'), {
    motionMode: 'float',
    background: 'transparent',
    showStudioFloor: false,
    onSelectOption: (ev) => console.log('Selected:', ev.letter, ev.isCorrect),
  });
</script>
```

## Sizing Helper (`trivia-challenge-sizing.js`)

```js
import { createTriviaChallenge3DSizer } from './trivia-challenge-3d-widget/trivia-challenge-sizing.js';

const sizer = createTriviaChallenge3DSizer(document.getElementById('trivia-stage'), 'md');
sizer.makeSmaller(0.2); // Shrinks 20%
sizer.makeBigger(0.2);  // Enlarges 20%
sizer.setPreset('lg');  // Jump to 620x388
```

See `HOW_TO_USE_README.txt` for full React, HTML5/Phaser/Unity/Godot game HUD, 2.5D image mode, and sizing documentation.
