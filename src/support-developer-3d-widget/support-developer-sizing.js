/**
 * Dedicated Sizing & Button-Fit Helper for Support Developer 3D Widget.
 * Makes it easy to embed "SUPPORT DEVELOPER" as a compact footer/sidebar button
 * or a large callout card, and dynamically make it smaller or bigger.
 */

export const SUPPORT_SIZE_PRESETS = {
  xs: { width: 130, height: 82 },
  sm: { width: 210, height: 132 },
  md: { width: 320, height: 200 },
  lg: { width: 460, height: 290 },
  xl: { width: 640, height: 400 },
  full: { width: '100%', height: '100%' },
};

function toCssUnit(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.max(40, Math.round(value))}px`;
  }
  return String(value);
}

export function applySupportDeveloper3DSize(container, size = 'md') {
  if (!container) {
    throw new Error('applySupportDeveloper3DSize requires a valid DOM container element.');
  }

  let width = SUPPORT_SIZE_PRESETS.md.width;
  let height = SUPPORT_SIZE_PRESETS.md.height;
  let scale = 1;
  let preset = 'md';

  if (typeof size === 'string' && SUPPORT_SIZE_PRESETS[size]) {
    preset = size;
    width = SUPPORT_SIZE_PRESETS[size].width;
    height = SUPPORT_SIZE_PRESETS[size].height;
  } else if (typeof size === 'number' && Number.isFinite(size)) {
    preset = 'custom';
    scale = Math.max(0.25, Math.min(3.0, size));
    width = Math.round(SUPPORT_SIZE_PRESETS.md.width * scale);
    height = Math.round(SUPPORT_SIZE_PRESETS.md.height * scale);
  } else if (size && typeof size === 'object') {
    preset = size.preset && SUPPORT_SIZE_PRESETS[size.preset] ? size.preset : 'custom';
    const base = SUPPORT_SIZE_PRESETS[preset] || SUPPORT_SIZE_PRESETS.md;
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

export function createSupportDeveloper3DSizer(container, initialSize = 'md') {
  let state = applySupportDeveloper3DSize(container, initialSize);
  const baseWidth = typeof state.width === 'number' ? state.width : SUPPORT_SIZE_PRESETS.md.width;
  const baseHeight = typeof state.height === 'number' ? state.height : SUPPORT_SIZE_PRESETS.md.height;
  let currentScale = state.scale || 1;

  return {
    setPreset: (presetName) => {
      state = applySupportDeveloper3DSize(container, presetName);
      currentScale = 1;
      return state;
    },
    setDimensions: (width, height = Math.round(Number(width) * 0.625)) => {
      state = applySupportDeveloper3DSize(container, { width, height, scale: 1 });
      currentScale = 1;
      return state;
    },
    setScale: (multiplier) => {
      currentScale = Math.max(0.25, Math.min(3.0, Number(multiplier) || 1));
      state = applySupportDeveloper3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeSmaller: (step = 0.2) => {
      currentScale = Math.max(0.25, currentScale - Math.abs(step));
      state = applySupportDeveloper3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeBigger: (step = 0.2) => {
      currentScale = Math.min(3.0, currentScale + Math.abs(step));
      state = applySupportDeveloper3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    getSize: () => ({ ...state, scale: currentScale }),
  };
}
