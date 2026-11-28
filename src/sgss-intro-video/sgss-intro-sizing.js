/**
 * Dedicated Format & Sizing Helper for the SGSS Intro Video.
 * Makes it effortless to display the intro video cleanly across portrait phones
 * (9:16), landscape desktops (16:9), tablets, square cards, or full-screen
 * splash overlays, with smart focal-point tracking onto the monitor screen.
 */

export const SGSS_INTRO_VIDEO_FORMATS = {
  'desktop-landscape': {
    label: 'Desktop Landscape (16:9)',
    width: '100%',
    height: 'auto',
    maxWidth: 1280,
    aspectRatio: '16 / 9',
    fitMode: 'cover',
    focalPoint: 'monitor',
  },
  'desktop-compact': {
    label: 'Desktop Compact (960x540)',
    width: 960,
    height: 540,
    maxWidth: 960,
    aspectRatio: '16 / 9',
    fitMode: 'cover',
    focalPoint: 'monitor',
  },
  'phone-portrait': {
    label: 'Phone Portrait Fit (9:16)',
    width: 360,
    height: 640,
    maxWidth: 430,
    aspectRatio: '9 / 16',
    fitMode: 'contain',
    focalPoint: 'monitor',
  },
  'phone-portrait-fill': {
    label: 'Phone Portrait Full-Bleed (9:16 Cover)',
    width: 360,
    height: 640,
    maxWidth: 430,
    aspectRatio: '9 / 16',
    fitMode: 'cover',
    focalPoint: 'monitor',
  },
  'tablet-landscape': {
    label: 'Tablet Landscape (4:3)',
    width: 760,
    height: 570,
    maxWidth: 1024,
    aspectRatio: '4 / 3',
    fitMode: 'cover',
    focalPoint: 'monitor',
  },
  'tablet-portrait': {
    label: 'Tablet Portrait (3:4)',
    width: 480,
    height: 640,
    maxWidth: 768,
    aspectRatio: '3 / 4',
    fitMode: 'contain',
    focalPoint: 'monitor',
  },
  square: {
    label: 'Square Card (1:1)',
    width: 520,
    height: 520,
    maxWidth: 640,
    aspectRatio: '1 / 1',
    fitMode: 'cover',
    focalPoint: 'monitor',
  },
  fullscreen: {
    label: 'Full-Screen App Intro',
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    aspectRatio: 'auto',
    fitMode: 'cover',
    focalPoint: 'monitor',
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
 * Computes CSS object-position for the <video> so that on portrait phones or
 * narrow viewports in 'cover' mode, the camera remains centered on the curved
 * monitor screen during the wide studio shot, then smoothly centers to 50% 50%
 * once the camera locks onto the monitor screen (at 3.0s / 50% of video).
 */
export function computeSgssIntroFocalPosition(progress = 0, focalPoint = 'monitor') {
  if (focalPoint === 'center') return '50% 50%';
  if (focalPoint === 'left') return '28% 46%';
  if (focalPoint === 'right') return '72% 46%';
  if (typeof focalPoint === 'string' && focalPoint.includes('%')) {
    return focalPoint;
  }

  // 'monitor' smart focal-point tracking:
  // At t=0..0.90s (progress 0..0.15), the monitor sits around x=36%, y=46%.
  // By t=3.00s (progress 0.50), the monitor fills 100% of the frame -> 50% 50%,
  // holding centered as the wavy clear immediately sweeps in to reveal SGSS.
  const p = clamp01((progress - 0.15) / 0.35);
  const eased = p * p * (3 - 2 * p);
  const xPct = 36 + (50 - 36) * eased;
  const yPct = 46 + (50 - 46) * eased;
  return `${xPct.toFixed(1)}% ${yPct.toFixed(1)}%`;
}

export function updateSgssIntroVideoFocalPoint(videoEl, progress = 0, focalPoint = 'monitor') {
  if (!videoEl) return;
  videoEl.style.objectPosition = computeSgssIntroFocalPosition(progress, focalPoint);
}

/**
 * Resolves 'auto' into either 'desktop-landscape' or 'phone-portrait-fill'
 * based on the current viewport or parent container aspect ratio.
 */
export function resolveAutoFormat(container) {
  if (typeof window === 'undefined') return 'desktop-landscape';
  const parent = container && container.parentElement;
  const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
  const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
  return h > w * 1.08 ? 'phone-portrait-fill' : 'desktop-landscape';
}

/**
 * Applies a format preset, custom dimensions, scale, fitMode ('cover' | 'contain' | 'fill'),
 * and focalPoint ('monitor' | 'center' | 'left' | 'right') to the video container and <video>.
 */
export function applySgssIntroVideoSize(container, videoEl = null, sizeOrOptions = 'desktop-landscape') {
  if (!container) {
    throw new Error('applySgssIntroVideoSize requires a valid DOM container element.');
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
    SGSS_INTRO_VIDEO_FORMATS[formatName] || SGSS_INTRO_VIDEO_FORMATS['desktop-landscape'];

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
  container.style.backgroundColor = opts.background || '#060911';
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
    updateSgssIntroVideoFocalPoint(targetVideo, progress, focalPoint);
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
 * Creates a live stateful sizer controller for resizing or switching video
 * formats (e.g. Portrait Phone <-> Landscape Desktop) dynamically at runtime.
 */
export function createSgssIntroVideoSizer(
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

  let state = applySgssIntroVideoSize(container, videoEl, currentConfig);

  const onWindowResize = () => {
    if (isAuto || currentConfig.format === 'auto') {
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize);
  }

  return {
    setFormat: (format) => {
      currentConfig = { ...currentConfig, format, width: undefined, height: undefined };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setFitMode: (fitMode) => {
      currentConfig = { ...currentConfig, fitMode };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setFocalPoint: (focalPoint) => {
      currentConfig = { ...currentConfig, focalPoint };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setDimensions: (width, height, aspectRatio = 'auto') => {
      currentConfig = { ...currentConfig, format: 'custom', width, height, aspectRatio, scale: 1 };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    setScale: (multiplier) => {
      const nextScale = Math.max(0.25, Math.min(2.5, Number(multiplier) || 1));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    makeSmaller: (step = 0.15) => {
      const nextScale = Math.max(0.25, (currentConfig.scale || 1) - Math.abs(step));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    makeBigger: (step = 0.15) => {
      const nextScale = Math.min(2.5, (currentConfig.scale || 1) + Math.abs(step));
      currentConfig = { ...currentConfig, scale: nextScale };
      state = applySgssIntroVideoSize(container, videoEl, currentConfig);
      return state;
    },
    syncVideoProgress: (currentTime, duration) => {
      const targetVideo = videoEl || (container && container.querySelector('video'));
      if (!targetVideo || !duration) return;
      updateSgssIntroVideoFocalPoint(targetVideo, currentTime / duration, state.focalPoint);
    },
    getState: () => ({ ...state }),
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onWindowResize);
      }
    },
  };
}
