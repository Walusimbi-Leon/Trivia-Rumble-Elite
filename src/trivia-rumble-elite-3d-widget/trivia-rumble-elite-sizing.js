/**
 * Dedicated Sizing & Layout Helper for TRIVIA RUMBLE ELITE 3D Widget.
 * Makes it easy to resize the 3D title smaller or bigger or place it inside
 * a game header, banner slot, modal, or full-screen intro stage.
 */

export const TRIVIA_RUMBLE_SIZE_PRESETS = {
  xs: { width: 220, height: 118 },
  sm: { width: 340, height: 182 },
  md: { width: 520, height: 278 },
  lg: { width: 720, height: 385 },
  xl: { width: 960, height: 512 },
  full: { width: '100%', height: '100%' },
};

function toCssUnit(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.max(40, Math.round(value))}px`;
  }
  return String(value);
}

export function applyTriviaRumbleElite3DSize(container, size = 'md') {
  if (!container) {
    throw new Error('applyTriviaRumbleElite3DSize requires a valid DOM container element.');
  }

  let width = TRIVIA_RUMBLE_SIZE_PRESETS.md.width;
  let height = TRIVIA_RUMBLE_SIZE_PRESETS.md.height;
  let scale = 1;
  let preset = 'md';

  if (typeof size === 'string' && TRIVIA_RUMBLE_SIZE_PRESETS[size]) {
    preset = size;
    width = TRIVIA_RUMBLE_SIZE_PRESETS[size].width;
    height = TRIVIA_RUMBLE_SIZE_PRESETS[size].height;
  } else if (typeof size === 'number' && Number.isFinite(size)) {
    preset = 'custom';
    scale = Math.max(0.25, Math.min(3.0, size));
    width = Math.round(TRIVIA_RUMBLE_SIZE_PRESETS.md.width * scale);
    height = Math.round(TRIVIA_RUMBLE_SIZE_PRESETS.md.height * scale);
  } else if (size && typeof size === 'object') {
    preset = size.preset && TRIVIA_RUMBLE_SIZE_PRESETS[size.preset] ? size.preset : 'custom';
    const base = TRIVIA_RUMBLE_SIZE_PRESETS[preset] || TRIVIA_RUMBLE_SIZE_PRESETS.md;
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

export function createTriviaRumbleElite3DSizer(container, initialSize = 'md') {
  let state = applyTriviaRumbleElite3DSize(container, initialSize);
  const baseWidth =
    typeof state.width === 'number' ? state.width : TRIVIA_RUMBLE_SIZE_PRESETS.md.width;
  const baseHeight =
    typeof state.height === 'number' ? state.height : TRIVIA_RUMBLE_SIZE_PRESETS.md.height;
  let currentScale = state.scale || 1;

  return {
    setPreset: (presetName) => {
      state = applyTriviaRumbleElite3DSize(container, presetName);
      currentScale = 1;
      return state;
    },
    setDimensions: (width, height = Math.round(Number(width) * 0.535)) => {
      state = applyTriviaRumbleElite3DSize(container, { width, height, scale: 1 });
      currentScale = 1;
      return state;
    },
    setScale: (multiplier) => {
      currentScale = Math.max(0.25, Math.min(3.0, Number(multiplier) || 1));
      state = applyTriviaRumbleElite3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeSmaller: (step = 0.2) => {
      currentScale = Math.max(0.25, currentScale - Math.abs(step));
      state = applyTriviaRumbleElite3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeBigger: (step = 0.2) => {
      currentScale = Math.min(3.0, currentScale + Math.abs(step));
      state = applyTriviaRumbleElite3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    getSize: () => ({ ...state, scale: currentScale }),
  };
}
