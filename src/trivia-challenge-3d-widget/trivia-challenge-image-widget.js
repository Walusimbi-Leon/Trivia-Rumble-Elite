/**
 * Zero-dependency 2.5D Living Image Widget for SGSS Trivia Challenge Monitor.
 * Uses assets/trivia-challenge-badge.jfif with continuous living motion
 * ('float' | 'pulse' | 'orbit' | 'tilt'), holographic light sweep,
 * breathing cyan/magenta aura, cursor-reactive 3D tilt, and click sound feedback.
 */
export function createTriviaChallengeImageWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createTriviaChallengeImageWidget requires a valid DOM container element.');
  }

  const options = {
    imageSrc: './assets/trivia-challenge-badge.jfif',
    motionMode: 'float', // 'float' | 'pulse' | 'orbit' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    enableSoundFeedback: true,
    masterVolume: 70,
    onClick: null,
    ...userOptions,
  };

  let audioCtx = null;
  let volume = Math.max(0, Math.min(1, options.masterVolume / 100));
  let motionMode = options.motionMode;
  let speed = Math.max(0.2, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.2, Math.min(2.2, Number(options.intensity) || 1.0));
  let audioEnabled = Boolean(options.enableSoundFeedback);
  let pointerTiltX = 0;
  let pointerTiltY = 0;
  let clickBounce = 0;
  let disposed = false;
  let rafId = 0;

  function playChime() {
    if (!audioEnabled || typeof window === 'undefined' || volume <= 0.001) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const now = audioCtx.currentTime + i * 0.045;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.11 * volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    } catch {
      // Ignore audio errors
    }
  }

  const root = document.createElement('div');
  root.style.cssText = [
    'position: relative',
    'width: 100%',
    'height: 100%',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'perspective: 1150px',
    'user-select: none',
  ].join(';');

  const stage = document.createElement('div');
  stage.style.cssText = [
    'position: relative',
    'width: min(100%, 720px)',
    'aspect-ratio: 16 / 9',
    'border-radius: 18px',
    'overflow: hidden',
    'cursor: pointer',
    'border: 1px solid rgba(103, 232, 249, 0.35)',
    'box-shadow: 0 24px 64px rgba(8, 47, 73, 0.55), 0 0 36px rgba(56, 189, 248, 0.22)',
    'transform-style: preserve-3d',
    'will-change: transform, box-shadow',
  ].join(';');

  const img = document.createElement('img');
  img.src = options.imageSrc;
  img.alt = 'SGSS Trivia Challenge 3D Monitor';
  img.draggable = false;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
  stage.appendChild(img);

  // Holographic specular sweep across the screen
  const sheen = document.createElement('div');
  sheen.style.cssText = [
    'position: absolute',
    'inset: -45%',
    'pointer-events: none',
    'background: linear-gradient(115deg, transparent 38%, rgba(103, 232, 249, 0.22) 48%, rgba(232, 121, 249, 0.16) 52%, transparent 62%)',
    'will-change: transform',
  ].join(';');
  stage.appendChild(sheen);

  // Subtle breathing ambient border glow
  const glowOverlay = document.createElement('div');
  glowOverlay.style.cssText = [
    'position: absolute',
    'inset: 0',
    'pointer-events: none',
    'border-radius: 18px',
    'box-shadow: inset 0 0 32px rgba(56, 189, 248, 0.25)',
    'will-change: opacity',
  ].join(';');
  stage.appendChild(glowOverlay);

  stage.addEventListener('pointermove', (e) => {
    const rect = stage.getBoundingClientRect();
    pointerTiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    pointerTiltY = -((e.clientY - rect.top) / rect.height - 0.5) * 11;
  });

  stage.addEventListener('pointerleave', () => {
    pointerTiltX = 0;
    pointerTiltY = 0;
  });

  stage.addEventListener('click', () => {
    clickBounce = 1.0;
    playChime();
    options.onClick?.();
  });

  root.appendChild(stage);
  container.appendChild(root);

  let phase = 0;
  let prev = performance.now();

  function animate(now) {
    if (disposed) return;
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    phase += dt * speed;
    clickBounce *= 0.88;

    const amp = intensity;
    let floatY = Math.sin(phase * 1.7) * 7 * amp;
    let rotX = Math.sin(phase * 1.1) * 3.0 * amp + pointerTiltY * 0.6;
    let rotY = Math.cos(phase * 0.9) * 4.5 * amp + pointerTiltX * 0.6;
    let scale = 1 + Math.sin(phase * 2.1) * 0.014 * amp - clickBounce * 0.032;

    if (motionMode === 'pulse') {
      const beat = Math.pow(Math.max(0, Math.sin(phase * 3.2)), 4);
      floatY = Math.sin(phase * 2.1) * 4 * amp;
      scale = 1 + beat * 0.038 * amp - clickBounce * 0.035;
      glowOverlay.style.opacity = String(0.55 + beat * 0.45);
    } else if (motionMode === 'orbit') {
      floatY = Math.sin(phase * 1.5) * 8 * amp;
      rotY = Math.sin(phase * 0.95) * 9.5 * amp + pointerTiltX * 0.5;
      rotX = Math.cos(phase * 1.25) * 4.5 * amp + pointerTiltY * 0.5;
      glowOverlay.style.opacity = String(0.65 + Math.sin(phase * 2.2) * 0.25);
    } else if (motionMode === 'tilt') {
      floatY = Math.sin(phase * 1.3) * 3 * amp;
      rotX = pointerTiltY * 1.2 * amp + Math.sin(phase * 0.8) * 1.5;
      rotY = pointerTiltX * 1.25 * amp + Math.cos(phase * 0.7) * 1.8;
      glowOverlay.style.opacity = '0.8';
    } else {
      glowOverlay.style.opacity = String(0.6 + Math.sin(phase * 2.4) * 0.25);
    }

    stage.style.transform = `translateY(${floatY.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;

    const sweep = ((phase * 0.32) % 2) - 1;
    sheen.style.transform = `translateX(${(sweep * 78).toFixed(1)}%)`;

    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);

  return {
    pulse: () => {
      clickBounce = 1.0;
      playChime();
    },
    setMotionMode: (mode) => {
      if (mode === 'float' || mode === 'pulse' || mode === 'orbit' || mode === 'tilt') {
        motionMode = mode;
      }
    },
    setSpeed: (nextSpeed) => {
      speed = Math.max(0.2, Math.min(2.5, Number(nextSpeed) || 1.0));
    },
    setIntensity: (nextIntensity) => {
      intensity = Math.max(0.2, Math.min(2.2, Number(nextIntensity) || 1.0));
    },
    setAudioEnabled: (enabled) => {
      audioEnabled = Boolean(enabled);
    },
    setMasterVolume: (percent) => {
      volume = Math.max(0, Math.min(1, percent / 100));
    },
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (audioCtx) audioCtx.close().catch(() => {});
      if (root.parentElement === container) container.removeChild(root);
    },
  };
}
