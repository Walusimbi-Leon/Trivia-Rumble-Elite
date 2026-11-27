/**
 * Dedicated Sizing & Layout Helper for Trivia Challenge 3D Monitor Widget.
 * Makes it effortless to drop the 3D trivia monitor into a sidebar card,
 * quiz modal, or full-screen game stage and make it smaller or bigger.
 */

export const TRIVIA_CHALLENGE_SIZE_PRESETS = {
  xs: { width: 180, height: 112 },
  sm: { width: 280, height: 175 },
  md: { width: 420, height: 262 },
  lg: { width: 620, height: 388 },
  xl: { width: 840, height: 525 },
  full: { width: '100%', height: '100%' },
};

function toCssUnit(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.max(80, Math.round(value))}px`;
  }
  return String(value);
}

export function applyTriviaChallenge3DSize(container, size = 'md') {
  if (!container) {
    throw new Error('applyTriviaChallenge3DSize requires a valid DOM container element.');
  }

  let width = TRIVIA_CHALLENGE_SIZE_PRESETS.md.width;
  let height = TRIVIA_CHALLENGE_SIZE_PRESETS.md.height;
  let scale = 1;
  let preset = 'md';

  if (typeof size === 'string' && TRIVIA_CHALLENGE_SIZE_PRESETS[size]) {
    preset = size;
    width = TRIVIA_CHALLENGE_SIZE_PRESETS[size].width;
    height = TRIVIA_CHALLENGE_SIZE_PRESETS[size].height;
  } else if (typeof size === 'number' && Number.isFinite(size)) {
    preset = 'custom';
    scale = Math.max(0.25, Math.min(3.0, size));
    width = Math.round(TRIVIA_CHALLENGE_SIZE_PRESETS.md.width * scale);
    height = Math.round(TRIVIA_CHALLENGE_SIZE_PRESETS.md.height * scale);
  } else if (size && typeof size === 'object') {
    preset = size.preset && TRIVIA_CHALLENGE_SIZE_PRESETS[size.preset] ? size.preset : 'custom';
    const base = TRIVIA_CHALLENGE_SIZE_PRESETS[preset] || TRIVIA_CHALLENGE_SIZE_PRESETS.md;
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

export function createTriviaChallenge3DSizer(container, initialSize = 'md') {
  let state = applyTriviaChallenge3DSize(container, initialSize);
  const baseWidth =
    typeof state.width === 'number' ? state.width : TRIVIA_CHALLENGE_SIZE_PRESETS.md.width;
  const baseHeight =
    typeof state.height === 'number' ? state.height : TRIVIA_CHALLENGE_SIZE_PRESETS.md.height;
  let currentScale = state.scale || 1;

  return {
    setPreset: (presetName) => {
      state = applyTriviaChallenge3DSize(container, presetName);
      currentScale = 1;
      return state;
    },
    setDimensions: (width, height = Math.round(Number(width) * 0.625)) => {
      state = applyTriviaChallenge3DSize(container, { width, height, scale: 1 });
      currentScale = 1;
      return state;
    },
    setScale: (multiplier) => {
      currentScale = Math.max(0.25, Math.min(3.0, Number(multiplier) || 1));
      state = applyTriviaChallenge3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeSmaller: (step = 0.2) => {
      currentScale = Math.max(0.25, currentScale - Math.abs(step));
      state = applyTriviaChallenge3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    makeBigger: (step = 0.2) => {
      currentScale = Math.min(3.0, currentScale + Math.abs(step));
      state = applyTriviaChallenge3DSize(container, {
        width: baseWidth,
        height: baseHeight,
        scale: currentScale,
      });
      return state;
    },
    getSize: () => ({ ...state, scale: currentScale }),
  };
}
