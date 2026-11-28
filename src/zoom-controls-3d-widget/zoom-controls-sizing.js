/**
 * Dedicated Sizing & Layout Helper for Zoom Controls 3D Widget.
 * Makes it easy to resize the 3D Zoom In (i+ & Zoom Out (i- buttons smaller or
 * bigger or place them inside a toolbar, game HUD, viewer panel, or full-screen stage.
 */

export const ZOOM_CONTROLS_SIZE_PRESETS = {
  xs: { width: 160, height: 96 },
  sm: { width: 280, height: 168 },
  md: { width: 440, height: 264 },
  lg: { width: 640, height: 384 },
  xl: { width: 880, height: 528 },
  full: { width: '100%', height: '100%' },
};

function toCssUnit(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.max(40, Math.round(value))}px`;
  }
  return String(value);
}

export function applyZoomControls3DSize(container, size = 'md') {
  if (!container) {
    throw new Error('applyZoomControls3DSize requires a valid DOM container element.');
  }

  let width = ZOOM_CONTROLS_SIZE_PRESETS.md.width;
  let height = ZOOM_CONTROLS_SIZE_PRESETS.md.height;
  let scale = 1;
  let preset = 'md';

  if (typeof size === 'string' && ZOOM_CONTROLS_SIZE_PRESETS[size]) {
    preset = size;
    width = ZOOM_CONTROLS_SIZE_PRESETS[size].width;
    height = ZOOM_CONTROLS_SIZE_PRESETS[size].height;
  } else if (typeof size === 'number' && Number.isFinite(size)) {
    preset = 'custom';
    scale = Math.max(0.25, Math.min(3.0, size));
    width = Math.round(ZOOM_CONTROLS_SIZE_PRESETS.md.width * scale);
    height = Math.round(ZOOM_CONTROLS_SIZE_PRESETS.md.height * scale);
  } else if (size && typeof size === 'object') {
    preset = size.preset && ZOOM_CONTROLS_SIZE_PRESETS[size.preset] ? size.preset : 'custom';
    const base = ZOOM_CONTROLS_SIZE_PRESETS[preset] || ZOOM_CONTROLS_SIZE_PRESETS.md;
    scale = typeof size.scale === 'number' ? Math.max(0.25, Math.min(3.0, size.scale)) : 1;
    const rawW = size.width !== undefined ? size.width : base.width;
    const rawH = size.height !== undefined ? size.height : base.height;
    width = typeof rawW === 'number' ? Math.round(rawW * scale) : rawW;
    height = typeof rawH === 'number' ? Math.round(rawH * scale) : rawH;
  }

  container.style.width = toCssUnit(width);
  container.style.height = toCssUnit(height);
  container.style.flexShrink = '0';
  container.style.position = container.style.position || 'relative';
  container.style.transition = 'width 220ms ease, height 220ms ease';

  return { width, height, scale, preset };
}

export function createZoomControls3DSizer(container, initialSize = 'md') {
  let state = applyZoomControls3DSize(container, initialSize);
  const baseWidth =
    typeof state.width === 'number' ? state.width : ZOOM_CONTROLS_SIZE_PRESETS.md.width;
  const baseHeight =
    typeof state.height === 'number' ? state.height : ZOOM_CONTROLS_SIZE_PRESETS.md.height;
  let currentScale = state.scale || 1;

  return {
    setPreset: (presetName) => {
      state = applyZoomControls3DSize(container, presetName);
      currentScale = 1;
      return state;
    },
    setDimensions: (width, height = Math.round(Number(width) * 0.6)) => {
      state = applyZoomControls3DSize(container, { width, height, scale: 1 });
      currentScale = 1;
      return state;
    },
    setScale: (multiplier) => {
      currentScale = Math.max(0.25, Math.min(3.0, Number(multiplier) || 1));
      state = applyZoomControls3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeSmaller: (step = 0.2) => {
      currentScale = Math.max(0.25, currentScale - Math.abs(step));
      state = applyZoomControls3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeBigger: (step = 0.2) => {
      currentScale = Math.min(3.0, currentScale + Math.abs(step));
      state = applyZoomControls3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    getSize: () => ({ ...state, scale: currentScale }),
  };
}
