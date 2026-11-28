/**
 * Zero-dependency 2.5D Living Image Widget for Clickable Zoom In (i+ & Zoom Out (i- Buttons.
 * Uses assets/zoom-controls-badge.jfif with continuous living motion ('float' | 'pulse' | 'orbit' | 'tilt'),
 * metallic specular sheen, cursor-reactive 3D parallax, and clickable left/right lens hit zones.
 */
export function createZoomControlsImageWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createZoomControlsImageWidget requires a valid DOM container element.');
  }

  const options = {
    imageSrc: './assets/zoom-controls-badge.jfif',
    initialZoom: 100,
    minZoom: 50,
    maxZoom: 200,
    step: 15,
    motionMode: 'float', // 'float' | 'pulse' | 'orbit' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    enableSoundFeedback: true,
    masterVolume: 75,
    onZoomIn: null,
    onZoomOut: null,
    onChange: null,
    ...userOptions,
  };

  let audioCtx = null;
  let zoomLevel = Math.max(
    options.minZoom,
    Math.min(options.maxZoom, Math.round(Number(options.initialZoom) || 100)),
  );
  let volume = Math.max(0, Math.min(1, options.masterVolume / 100));
  let motionMode = options.motionMode;
  let speed = Math.max(0.2, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.2, Math.min(2.2, Number(options.intensity) || 1.0));
  let audioEnabled = Boolean(options.enableSoundFeedback);
  let pointerTiltX = 0;
  let pointerTiltY = 0;
  let pulseIn = 0;
  let pulseOut = 0;
  let disposed = false;
  let rafId = 0;

  function playTone(direction) {
    if (!audioEnabled || typeof window === 'undefined' || volume <= 0.001) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const freqs = direction === 'in' ? [523.25, 698.46, 880.0] : [698.46, 523.25, 392.0];
      freqs.forEach((freq, i) => {
        const now = audioCtx.currentTime + i * 0.042;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.095 * volume, now + 0.016);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      });
    } catch {
      // Ignore audio restriction errors
    }
  }

  function triggerZoom(direction) {
    const isIn = direction === 'in';
    if (isIn) {
      zoomLevel = Math.min(options.maxZoom, zoomLevel + options.step);
      pulseIn = 1.0;
    } else {
      zoomLevel = Math.max(options.minZoom, zoomLevel - options.step);
      pulseOut = 1.0;
    }

    playTone(direction);

    const payload = {
      zoom: zoomLevel,
      delta: isIn ? options.step : -options.step,
      action: direction,
    };

    if (isIn) options.onZoomIn?.(payload);
    else options.onZoomOut?.(payload);
    options.onChange?.(zoomLevel, direction);
    return zoomLevel;
  }

  const root = document.createElement('div');
  root.style.cssText = [
    'position: relative',
    'width: 100%',
    'height: 100%',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'perspective: 1100px',
    'user-select: none',
  ].join(';');

  const stage = document.createElement('div');
  stage.style.cssText = [
    'position: relative',
    'width: min(100%, 720px)',
    'aspect-ratio: 16 / 9',
    'border-radius: 18px',
    'overflow: hidden',
    'border: 1px solid rgba(148, 163, 184, 0.35)',
    'box-shadow: 0 22px 54px rgba(15, 23, 42, 0.22)',
    'transform-style: preserve-3d',
    'will-change: transform',
  ].join(';');

  const img = document.createElement('img');
  img.src = options.imageSrc;
  img.alt = '3D Zoom In (i+ and Zoom Out (i- Magnifying Glass Buttons';
  img.draggable = false;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
  stage.appendChild(img);

  // Specular metallic sheen sweep
  const sheen = document.createElement('div');
  sheen.style.cssText = [
    'position: absolute',
    'inset: -45%',
    'pointer-events: none',
    'background: linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.28) 49%, rgba(246, 224, 166, 0.16) 53%, transparent 62%)',
    'will-change: transform',
  ].join(';');
  stage.appendChild(sheen);

  function createLensHitButton(label, side) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.ariaLabel = label;
    btn.title = label;
    btn.style.cssText = [
      'position: absolute',
      side === 'left' ? 'left: 14%' : 'left: 53%',
      'top: 12%',
      'width: 33%',
      'height: 76%',
      'border: none',
      'border-radius: 9999px',
      'background: transparent',
      'cursor: pointer',
      'outline: none',
      'transition: box-shadow 160ms ease, background 160ms ease',
    ].join(';');

    btn.addEventListener('pointerenter', () => {
      btn.style.background =
        side === 'left' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(148, 163, 184, 0.1)';
      btn.style.boxShadow =
        side === 'left'
          ? '0 0 24px rgba(217, 179, 96, 0.35)'
          : '0 0 24px rgba(148, 163, 184, 0.35)';
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.background = 'transparent';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('click', () => {
      triggerZoom(side === 'left' ? 'in' : 'out');
    });
    return btn;
  }

  const zoomInHit = createLensHitButton('Zoom In (i+', 'left');
  const zoomOutHit = createLensHitButton('Zoom Out (i-', 'right');
  stage.appendChild(zoomInHit);
  stage.appendChild(zoomOutHit);

  stage.addEventListener('pointermove', (e) => {
    const rect = stage.getBoundingClientRect();
    pointerTiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    pointerTiltY = -((e.clientY - rect.top) / rect.height - 0.5) * 11;
  });

  stage.addEventListener('pointerleave', () => {
    pointerTiltX = 0;
    pointerTiltY = 0;
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
    pulseIn *= 0.88;
    pulseOut *= 0.88;

    const amp = intensity;
    let floatY = Math.sin(phase * 1.65) * 7 * amp;
    let rotX = Math.sin(phase * 1.1) * 3.0 * amp + pointerTiltY * 0.6;
    let rotY = Math.cos(phase * 0.9) * 4.5 * amp + pointerTiltX * 0.6;
    let scale = 1 + Math.sin(phase * 2.0) * 0.014 * amp + pulseIn * 0.032 - pulseOut * 0.028;

    if (motionMode === 'pulse') {
      const beat = Math.pow(Math.max(0, Math.sin(phase * 3.0)), 4);
      floatY = Math.sin(phase * 2.0) * 4 * amp;
      scale = 1 + beat * 0.035 * amp + pulseIn * 0.03 - pulseOut * 0.025;
    } else if (motionMode === 'orbit') {
      floatY = Math.sin(phase * 1.5) * 8 * amp;
      rotY = Math.sin(phase * 0.95) * 9.5 * amp + pointerTiltX * 0.5;
      rotX = Math.cos(phase * 1.25) * 4.5 * amp + pointerTiltY * 0.5;
    } else if (motionMode === 'tilt') {
      floatY = Math.sin(phase * 1.2) * 3 * amp;
      rotX = pointerTiltY * 1.2 * amp + Math.sin(phase * 0.8) * 1.5;
      rotY = pointerTiltX * 1.25 * amp + Math.cos(phase * 0.7) * 1.8;
    }

    stage.style.transform = `translateY(${floatY.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;

    const sweep = ((phase * 0.3) % 2) - 1;
    sheen.style.transform = `translateX(${(sweep * 78).toFixed(1)}%)`;

    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);

  return {
    triggerZoomIn: () => triggerZoom('in'),
    triggerZoomOut: () => triggerZoom('out'),
    setZoom: (percent) => {
      zoomLevel = Math.max(
        options.minZoom,
        Math.min(options.maxZoom, Math.round(Number(percent) || 100)),
      );
      options.onChange?.(zoomLevel, 'set');
      return zoomLevel;
    },
    getZoom: () => zoomLevel,
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
