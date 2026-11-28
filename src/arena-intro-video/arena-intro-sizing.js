/**
 * Dedicated Format & Sizing Helper for the Arena Intro Video
 * (TRIVIA RUMBLE ELITE + Connecting to the Arena merged intro video).
 * Makes it easy to adapt the video format and dimensions cleanly for Portrait
 * Phones (9:16), Landscape Desktops (16:9), Tablets, Square Cards, or
 * Full-Screen app loading overlays, with smart focal-point tracking.
 */

export const ARENA_INTRO_VIDEO_FORMATS = {
  'desktop-landscape': {
    label: 'Desktop Landscape (16:9)',
    width: '100%',
    height: 'auto',
    maxWidth: 1280,
    aspectRatio: '16 / 9',
    fitMode: 'cover',
    focalPoint: 'stack',
  },
  'desktop-compact': {
    label: 'Desktop Compact (960x540)',
    width: 960,
    height: 540,
    maxWidth: 960,
    aspectRatio: '16 / 9',
    fitMode: 'cover',
    focalPoint: 'stack',
  },
  'phone-portrait': {
    label: 'Phone Portrait Fit (9:16)',
    width: 360,
    height: 640,
    maxWidth: 430,
    aspectRatio: '9 / 16',
    fitMode: 'contain',
    focalPoint: 'stack',
  },
  'phone-portrait-fill': {
    label: 'Phone Portrait Full-Bleed (9:16 Cover)',
    width: 360,
    height: 640,
    maxWidth: 430,
    aspectRatio: '9 / 16',
    fitMode: 'cover',
    focalPoint: 'stack',
  },
  'tablet-landscape': {
    label: 'Tablet Landscape (4:3)',
    width: 760,
    height: 570,
    maxWidth: 1024,
    aspectRatio: '4 / 3',
    fitMode: 'cover',
    focalPoint: 'stack',
  },
  'tablet-portrait': {
    label: 'Tablet Portrait (3:4)',
    width: 480,
    height: 640,
    maxWidth: 768,
    aspectRatio: '3 / 4',
    fitMode: 'contain',
    focalPoint: 'stack',
  },
  square: {
    label: 'Square Card (1:1)',
    width: 520,
    height: 520,
    maxWidth: 640,
    aspectRatio: '1 / 1',
    fitMode: 'cover',
    focalPoint: 'stack',
  },
  fullscreen: {
    label: 'Full-Screen App Loading Intro',
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    aspectRatio: 'auto',
    fitMode: 'contain',
    focalPoint: 'stack',
  },
};

function toCssDimension(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return `${Math.max(120, Math.round(val))}px`;
  }
  return String(val);
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Computes CSS object-position for the <video> so that during the opening
 * TRIVIA RUMBLE ELITE pop-up (0.0s - 1.9s), vertical focus sits gracefully
 * on the top emblem (50% 34%), then smoothly shifts to 50% 50% once the
 * Arena Loading gyroscopic rings & "Connecting to the Arena" enter below.
 */
export function computeArenaIntroFocalPosition(progress = 0, focalPoint = 'stack') {
  if (focalPoint === 'center') return '50% 50%';
  if (focalPoint === 'top') return '50% 30%';
  if (focalPoint === 'bottom') return '50% 72%';
  if (typeof focalPoint === 'string' && focalPoint.includes('%')) {
    return focalPoint;
  }

  // 'stack' smart tracking:
  // Phase 1 (progress 0.00 -> 0.29): TRIVIA RUMBLE ELITE pops up on top (50% 34%)
  // Phase 2 (progress 0.29 -> 0.52): Arena Loading joins below -> settle on 50% 50%
  const p = clamp01((progress - 0.28) / 0.22);
  const eased = p * p * (3 - 2 * p);
  const yPct = 34 + (50 - 34) * eased;
  return `50.0% ${yPct.toFixed(1)}%`;
}

export function updateArenaIntroVideoFocalPoint(videoEl, progress = 0, focalPoint = 'stack') {
  if (!videoEl) return;
  videoEl.style.objectPosition = computeArenaIntroFocalPosition(progress, focalPoint);
}

/**
 * Resolves 'auto' into 'phone-portrait' on portrait phones/tall viewports
 * or 'desktop-landscape' on widescreen desktops, updating dynamically on resize.
 */
export function resolveAutoFormat(container) {
  if (typeof window === 'undefined') return 'desktop-landscape';
  const parent = container && container.parentElement;
  const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
  const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
  return h > w * 1.08 ? 'phone-portrait' : 'desktop-landscape';
}

/**
 * Applies a device format preset, custom dimensions, scale, fitMode ('cover' | 'contain' | 'fill'),
 * and focalPoint ('stack' | 'center' | 'top' | 'bottom') to the video container and <video>.
 */
export function applyArenaIntroVideoSize(container, videoEl = null, sizeOrOptions = 'desktop-landscape') {
  if (!container) {
    throw new Error('applyArenaIntroVideoSize requires a valid DOM container element.');
  }

  let formatName = 'desktop-landscape';
  let opts = {};

  if (typeof sizeOrOptions === 'string') {
    formatName = sizeOrOptions === 'auto' ? resolveAutoFormat(container) : sizeOrOptions;
  } else if (typeof sizeOrOptions === 'number' && Number.isFinite(sizeOrOptions)) {
    opts = { scale: sizeOrOptions };
  } else if (sizeOrOptions && typeof sizeOrOptions === 'object') {
    opts = sizeOrOptions;
    if (opts.format) {
      formatName = opts.format === 'auto' ? resolveAutoFormat(container) : opts.format;
    }
  }

  const preset =
    ARENA_INTRO_VIDEO_FORMATS[formatName] || ARENA_INTRO_VIDEO_FORMATS['desktop-landscape'];

  const scale =
    typeof opts.scale === 'number' && Number.isFinite(opts.scale)
      ? Math.max(0.25, Math.min(2.5, opts.scale))
      : 1;

  const rawW = opts.width !== undefined ? opts.width : preset.width;
  const rawH = opts.height !== undefined ? opts.height : preset.height;
  const width = typeof rawW === 'number' ? Math.round(rawW * scale) : rawW;
  const height = typeof rawH === 'number' ? Math.round(rawH * scale) : rawH;
  const aspectRatio = opts.aspectRatio || preset.aspectRatio;
  const fitMode = opts.fitMode || preset.fitMode;
  const focalPoint = opts.focalPoint || preset.focalPoint;

  container.style.width = toCssDimension(width);
  container.style.height = toCssDimension(height);
  container.style.maxWidth =
    preset.maxWidth === 'none'
      ? 'none'
      : typeof preset.maxWidth === 'number'
        ? `${Math.round(preset.maxWidth * scale)}px`
        : '100%';
  container.style.aspectRatio = aspectRatio;
  container.style.position = container.style.position || 'relative';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = opts.background || '#04060d';
  container.style.transition =
    'width 220ms ease, height 220ms ease, max-width 220ms ease';

  const targetVideo = videoEl || container.querySelector('video');
  if (targetVideo) {
    targetVideo.style.width = '100%';
    targetVideo.style.height = '100%';
    targetVideo.style.display = 'block';
    targetVideo.style.objectFit = fitMode;
    const progress =
      targetVideo.duration > 0 ? targetVideo.currentTime / targetVideo.duration : 0;
    updateArenaIntroVideoFocalPoint(targetVideo, progress, focalPoint);
  }

  return {
    format: formatName,
    width,
    height,
    aspectRatio,
    fitMode,
    focalPoint,
    scale,
  };
}

/**
 * Creates a live stateful sizer controller for switching formats (e.g. Portrait Phone <->
 * Landscape Desktop) or resizing smaller/bigger dynamically at runtime.
 */
export function createArenaIntroVideoSizer(
  container,
  videoEl = null,
  initialConfig = 'desktop-landscape',
) {
  const isAuto =
    initialConfig === 'auto' ||
    (initialConfig && typeof initialConfig === 'object' && initialConfig.format === 'auto');

  let currentConfig =
    typeof initialConfig === 'string'
      ? { format: initialConfig }
      : typeof initialConfig === 'number'
        ? { format: 'desktop-landscape', scale: initialConfig }
        : { format: 'desktop-landscape', ...initialConfig };

  let state = applyArenaIntroVideoSize(container, videoEl, currentConfig);

  const onWindowResize = () => {
    if (isAuto || currentConfig.format === 'auto') {
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize);
  }

  return {
    setFormat: (format) => {
      currentConfig = { ...currentConfig, format, width: undefined, height: undefined };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setFitMode: (fitMode) => {
      currentConfig = { ...currentConfig, fitMode };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setFocalPoint: (focalPoint) => {
      currentConfig = { ...currentConfig, focalPoint };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setDimensions: (width, height, aspectRatio = 'auto') => {
      currentConfig = { ...currentConfig, format: 'custom', width, height, aspectRatio, scale: 1 };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setScale: (multiplier) => {
      const nextScale = Math.max(0.25, Math.min(2.5, Number(multiplier) || 1));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    makeSmaller: (step = 0.15) => {
      const nextScale = Math.max(0.25, (currentConfig.scale || 1) - Math.abs(step));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    makeBigger: (step = 0.15) => {
      const nextScale = Math.min(2.5, (currentConfig.scale || 1) + Math.abs(step));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applyArenaIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    syncVideoProgress: (currentTime, duration) => {
      const targetVideo = videoEl || (container && container.querySelector('video'));
      if (!targetVideo || !duration) return;
      updateArenaIntroVideoFocalPoint(targetVideo, currentTime / duration, state.focalPoint);
    },
    getState: () => ({ ...state }),
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onWindowResize);
      }
    },
  };
}
