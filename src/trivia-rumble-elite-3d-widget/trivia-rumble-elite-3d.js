import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _vec2 = new THREE.Vector2();
const _targetScale = new THREE.Vector3();

export const TRIVIA_RUMBLE_MOTION_MODES = ['blaze', 'rumble', 'wave', 'pulse', 'tilt'];

function detectSoftwareWebGL() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/**
 * Procedural chiseled 3D glyph shapes for "TRIVIA RUMBLE ELITE".
 * Unique characters: T, R, I, V, A, U, M, B, L, E.
 * Zero external font JSON files required.
 */
function createRumbleLetterShape(char) {
  switch (char) {
    case 'T': {
      const s = new THREE.Shape();
      s.moveTo(-0.068, -0.32);
      s.lineTo(0.068, -0.32);
      s.lineTo(0.068, 0.19);
      s.lineTo(0.225, 0.19);
      s.lineTo(0.245, 0.32);
      s.lineTo(-0.245, 0.32);
      s.lineTo(-0.225, 0.19);
      s.lineTo(-0.068, 0.19);
      s.closePath();
      return s;
    }

    case 'I': {
      const s = new THREE.Shape();
      s.moveTo(-0.145, -0.32);
      s.lineTo(0.145, -0.32);
      s.lineTo(0.145, -0.21);
      s.lineTo(0.068, -0.21);
      s.lineTo(0.068, 0.21);
      s.lineTo(0.145, 0.21);
      s.lineTo(0.145, 0.32);
      s.lineTo(-0.145, 0.32);
      s.lineTo(-0.145, 0.21);
      s.lineTo(-0.068, 0.21);
      s.lineTo(-0.068, -0.21);
      s.lineTo(-0.145, -0.21);
      s.closePath();
      return s;
    }

    case 'L': {
      const s = new THREE.Shape();
      s.moveTo(-0.2, -0.32);
      s.lineTo(0.21, -0.32);
      s.lineTo(0.22, -0.17);
      s.lineTo(0.15, -0.205);
      s.lineTo(-0.072, -0.205);
      s.lineTo(-0.072, 0.32);
      s.lineTo(-0.2, 0.32);
      s.closePath();
      return s;
    }

    case 'E': {
      const s = new THREE.Shape();
      s.moveTo(-0.205, -0.32);
      s.lineTo(0.21, -0.32);
      s.lineTo(0.21, -0.205);
      s.lineTo(-0.078, -0.205);
      s.lineTo(-0.078, -0.055);
      s.lineTo(0.165, -0.055);
      s.lineTo(0.165, 0.055);
      s.lineTo(-0.078, 0.055);
      s.lineTo(-0.078, 0.205);
      s.lineTo(0.21, 0.205);
      s.lineTo(0.21, 0.32);
      s.lineTo(-0.205, 0.32);
      s.closePath();
      return s;
    }

    case 'V': {
      const s = new THREE.Shape();
      s.moveTo(-0.064, -0.32);
      s.lineTo(0.064, -0.32);
      s.lineTo(0.245, 0.32);
      s.lineTo(0.112, 0.32);
      s.lineTo(0, -0.105);
      s.lineTo(-0.112, 0.32);
      s.lineTo(-0.245, 0.32);
      s.closePath();
      return s;
    }

    case 'A': {
      const s = new THREE.Shape();
      s.moveTo(-0.255, -0.32);
      s.lineTo(-0.125, -0.32);
      s.lineTo(-0.082, -0.165);
      s.lineTo(0.082, -0.165);
      s.lineTo(0.125, -0.32);
      s.lineTo(0.255, -0.32);
      s.lineTo(0.068, 0.32);
      s.lineTo(-0.068, 0.32);
      s.closePath();

      const hole = new THREE.Path();
      hole.moveTo(0, 0.155);
      hole.lineTo(0.056, -0.055);
      hole.lineTo(-0.056, -0.055);
      hole.closePath();
      s.holes.push(hole);
      return s;
    }

    case 'M': {
      const s = new THREE.Shape();
      s.moveTo(-0.275, -0.32);
      s.lineTo(-0.152, -0.32);
      s.lineTo(-0.152, 0.085);
      s.lineTo(-0.042, -0.22);
      s.lineTo(0.042, -0.22);
      s.lineTo(0.152, 0.085);
      s.lineTo(0.152, -0.32);
      s.lineTo(0.275, -0.32);
      s.lineTo(0.275, 0.32);
      s.lineTo(0.135, 0.32);
      s.lineTo(0, -0.035);
      s.lineTo(-0.135, 0.32);
      s.lineTo(-0.275, 0.32);
      s.closePath();
      return s;
    }

    case 'U': {
      const s = new THREE.Shape();
      s.moveTo(-0.22, 0.32);
      s.lineTo(-0.22, -0.05);
      s.absellipse(0, -0.05, 0.22, 0.27, Math.PI, Math.PI * 2, false, 0);
      s.lineTo(0.22, 0.32);
      s.lineTo(0.095, 0.32);
      s.lineTo(0.095, -0.05);
      s.absellipse(0, -0.05, 0.095, 0.155, 0, -Math.PI, true, 0);
      s.lineTo(-0.095, 0.32);
      s.closePath();
      return s;
    }

    case 'R': {
      const s = new THREE.Shape();
      s.moveTo(-0.215, -0.32);
      s.lineTo(-0.09, -0.32);
      s.lineTo(-0.09, -0.04);
      s.lineTo(0.015, -0.04);
      s.lineTo(0.135, -0.32);
      s.lineTo(0.265, -0.32);
      s.lineTo(0.148, -0.005);
      s.absellipse(0.032, 0.14, 0.192, 0.18, -0.92, Math.PI / 2, false, 0);
      s.lineTo(-0.215, 0.32);
      s.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.09, 0.072);
      hole.lineTo(-0.09, 0.212);
      hole.lineTo(0.025, 0.212);
      hole.absellipse(0.025, 0.142, 0.088, 0.07, Math.PI / 2, -Math.PI / 2, true, 0);
      hole.closePath();
      s.holes.push(hole);
      return s;
    }

    case 'B':
    default: {
      const s = new THREE.Shape();
      s.moveTo(-0.215, -0.32);
      s.lineTo(0.045, -0.32);
      s.absellipse(0.045, -0.155, 0.2, 0.165, -Math.PI / 2, Math.PI / 2 - 0.14, false, 0);
      s.lineTo(0.165, 0.005);
      s.absellipse(0.035, 0.16, 0.182, 0.16, -Math.PI / 2 + 0.14, Math.PI / 2, false, 0);
      s.lineTo(-0.215, 0.32);
      s.closePath();

      const topHole = new THREE.Path();
      topHole.moveTo(-0.09, 0.068);
      topHole.lineTo(-0.09, 0.218);
      topHole.lineTo(0.028, 0.218);
      topHole.absellipse(0.028, 0.143, 0.085, 0.075, Math.PI / 2, -Math.PI / 2, true, 0);
      topHole.closePath();
      s.holes.push(topHole);

      const botHole = new THREE.Path();
      botHole.moveTo(-0.09, -0.218);
      botHole.lineTo(-0.09, -0.058);
      botHole.lineTo(0.038, -0.058);
      botHole.absellipse(0.038, -0.138, 0.095, 0.08, Math.PI / 2, -Math.PI / 2, true, 0);
      botHole.closePath();
      s.holes.push(botHole);
      return s;
    }
  }
}

const CHAR_WIDTH_MAP = {
  T: 0.49,
  R: 0.48,
  I: 0.31,
  V: 0.49,
  A: 0.51,
  U: 0.46,
  M: 0.56,
  B: 0.48,
  L: 0.43,
  E: 0.44,
  ' ': 0.26,
};

/**
 * Procedural forged weathered metallic gold/brass texture + battle-scar bump map.
 */
function createForgedGoldTextures(maxAnisotropy) {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  const grad = cctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#c89e46');
  grad.addColorStop(0.35, '#e8c468');
  grad.addColorStop(0.65, '#9d7629');
  grad.addColorStop(1, '#d7ad4e');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  let seed = 4919;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Brushed metal grain
  for (let i = 0; i < 2400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 10 + rand() * 34;
    const bright = rand() > 0.5;
    cctx.strokeStyle = bright ? 'rgba(255, 240, 185, 0.08)' : 'rgba(62, 42, 10, 0.10)';
    cctx.lineWidth = 0.8 + rand() * 1.1;
    cctx.beginPath();
    cctx.moveTo(x, y);
    cctx.lineTo(x + len, y + (rand() - 0.5) * 4);
    cctx.stroke();

    bctx.strokeStyle = bright ? 'rgba(210, 210, 210, 0.14)' : 'rgba(50, 50, 50, 0.16)';
    bctx.lineWidth = 1;
    bctx.beginPath();
    bctx.moveTo(x, y);
    bctx.lineTo(x + len, y + (rand() - 0.5) * 4);
    bctx.stroke();
  }

  // Subtle battle-forged cracks & patina crevices
  for (let i = 0; i < 42; i++) {
    let px = rand() * size;
    let py = rand() * size;
    cctx.strokeStyle = 'rgba(48, 32, 12, 0.34)';
    cctx.lineWidth = 1.2 + rand() * 1.4;
    bctx.strokeStyle = 'rgba(24, 24, 24, 0.45)';
    bctx.lineWidth = 1.5 + rand() * 1.5;

    cctx.beginPath();
    bctx.beginPath();
    cctx.moveTo(px, py);
    bctx.moveTo(px, py);
    const segs = 4 + Math.floor(rand() * 5);
    for (let s = 0; s < segs; s++) {
      px += (rand() - 0.5) * 32;
      py += (rand() - 0.3) * 28;
      cctx.lineTo(px, py);
      bctx.lineTo(px, py);
    }
    cctx.stroke();
    bctx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

function createFloorShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, 'rgba(30, 58, 138, 0.42)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.24)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural GLSL volumetric blue-violet fire shader material.
 */
function createBlueFlameMaterial(layerSeed, opacityScale, isFrontWisp = false) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uFlare: { value: 0.0 },
      uSeed: { value: layerSeed },
      uOpacityScale: { value: opacityScale },
      uFrontWisp: { value: isFrontWisp ? 1.0 : 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uFlare;
      uniform float uSeed;
      uniform float uOpacityScale;
      uniform float uFrontWisp;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.52;
        mat2 rot = mat2(0.82, 0.57, -0.57, 0.82);
        for (int i = 0; i < 5; i++) {
          v += amp * noise(p);
          p = rot * p * 2.06 + vec2(1.7, 9.2);
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * (1.15 + uFlare * 0.45);

        // Horizontal envelope covering "TRIVIA RUMBLE ELITE"
        float xNorm = (uv.x - 0.5) * 2.0;
        float yNorm = (uv.y - 0.48) * 2.0;

        float xMask = smoothstep(1.02, 0.72, abs(xNorm));
        // Slight organic wave along top & bottom flame silhouette
        float waveY = sin(uv.x * 11.0 + t * 1.4 + uSeed) * 0.08 +
                      cos(uv.x * 23.0 - t * 2.1) * 0.05;
        float ySpread = 0.44 + 0.16 * uIntensity + 0.14 * uFlare;
        float bandMask = smoothstep(ySpread + 0.36, 0.08, abs(yNorm + waveY));

        // Dual-direction roaring upward + outward flame curl
        vec2 flowA = vec2(uv.x * 9.5 + uSeed, uv.y * 5.2 - t * 2.15);
        vec2 flowB = vec2(uv.x * 16.0 - t * 0.45 + uSeed * 1.7, uv.y * 8.5 - t * 3.1);
        float n1 = fbm(flowA);
        float n2 = fbm(flowB + vec2(n1 * 1.6, -n1 * 1.2));
        float turb = n1 * 0.55 + n2 * 0.45;

        // Vertical asymmetry: stronger tongues licking upward above the emblem
        float upperBias = smoothstep(-0.75, 0.65, yNorm);
        float density = bandMask * xMask * (0.45 + turb * 1.25 + upperBias * 0.18);

        if (uFrontWisp > 0.5) {
          density = smoothstep(0.56, 0.92, density) * 0.55;
        } else {
          density = smoothstep(0.18, 0.88, density);
        }

        // Electric blue-violet-white flame palette matching the reference
        vec3 deepIndigo = vec3(0.14, 0.18, 0.65);
        vec3 electricBlue = vec3(0.36, 0.52, 1.00);
        vec3 violetGlow = vec3(0.58, 0.52, 1.00);
        vec3 iceWhite = vec3(0.92, 0.96, 1.00);

        vec3 col = mix(deepIndigo, violetGlow, smoothstep(0.1, 0.48, density));
        col = mix(col, electricBlue, smoothstep(0.32, 0.72, density));
        col = mix(col, iceWhite, smoothstep(0.62, 0.96, density + uFlare * 0.28));

        float alpha = clamp(density * uOpacityScale * (0.85 + 0.25 * uIntensity + uFlare * 0.4), 0.0, 1.0);
        gl_FragColor = vec4(col * (1.15 + uFlare * 0.55), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function createSmokeHazeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uIntensity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 p = vUv * vec2(4.5, 2.8) + vec2(uTime * 0.08, -uTime * 0.18);
        float n = noise(p) * 0.6 + noise(p * 2.1 - uTime * 0.12) * 0.4;
        float dist = length((vUv - 0.5) * vec2(1.15, 1.45));
        float vignette = smoothstep(0.95, 0.12, dist);
        float alpha = vignette * smoothstep(0.25, 0.85, n) * 0.42 * clamp(uIntensity, 0.5, 1.5);
        vec3 col = mix(vec3(0.06, 0.11, 0.24), vec3(0.16, 0.24, 0.48), n);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

function createSoundEffects(initialVolume = 0.7) {
  let ctx = null;
  let masterVolume = Math.max(0, Math.min(1, initialVolume));

  function ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playTone(freq, delay, duration, type = 'triangle', gainAmt = 0.12, slideTo = null) {
    const audio = ensureContext();
    if (!audio || masterVolume <= 0.001) return;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainAmt * masterVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    setVolume: (v) => {
      masterVolume = Math.max(0, Math.min(1, v));
    },
    playFlare: (letterIndex = 8) => {
      const pentatonic = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
      const base = pentatonic[Math.abs(letterIndex) % pentatonic.length];
      playTone(98.0, 0, 0.36, 'sine', 0.16, 54.0);
      playTone(base, 0.01, 0.34, 'triangle', 0.11);
      playTone(base * 1.5, 0.05, 0.42, 'sine', 0.09);
    },
    dispose: () => {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
    },
  };
}

/**
 * Living 3D TRIVIA RUMBLE ELITE Emblem Widget with roaring blue-violet flames,
 * forged metallic gold typography, rising embers, and interactive motion modes.
 */
export function createTriviaRumbleElite3DWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createTriviaRumbleElite3DWidget requires a valid DOM container element.');
  }

  const options = {
    motionMode: 'blaze', // 'blaze' | 'rumble' | 'wave' | 'pulse' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    background: '#05070e',
    showStudioFloor: true,
    enableOrbit: true,
    enableSoundFeedback: true,
    masterVolume: 70,
    onClick: null,
    onLetterClick: null,
    onContextLost: null,
    ...userOptions,
  };

  let motionMode = TRIVIA_RUMBLE_MOTION_MODES.includes(options.motionMode)
    ? options.motionMode
    : 'blaze';
  let speed = Math.max(0.25, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.25, Math.min(2.2, Number(options.intensity) || 1.0));
  let audioEnabled = Boolean(options.enableSoundFeedback);

  const sound = createSoundEffects((options.masterVolume ?? 70) / 100);
  const disposables = [];
  const isSoftwareGl = detectSoftwareWebGL();

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 380;

  const scene = new THREE.Scene();
  if (options.background && options.background !== 'transparent') {
    scene.background = new THREE.Color(options.background);
    scene.fog = new THREE.FogExp2(options.background, 0.042);
  }

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 70);
  const getFittedZ = (aspect) => Math.max(5.2, 13.8 / Math.max(aspect, 0.58));
  const DEFAULT_CAM_POS = new THREE.Vector3(0, 0.24, getFittedZ(width / height));
  const DEFAULT_TARGET = new THREE.Vector3(0, 0.04, 0);
  camera.position.copy(DEFAULT_CAM_POS);
  if (!options.enableOrbit) {
    camera.lookAt(DEFAULT_TARGET);
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: options.background === 'transparent',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = options.enableOrbit ? 'none' : 'pan-y';
  container.appendChild(renderer.domElement);

  // Studio environment reflection for realistic brushed metallic gold
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  disposables.push(pmrem, envTex);

  // Warm / Cool Lighting Rig
  const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e1b4b, 0.72);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
  keyLight.position.set(2.8, 4.4, 5.2);
  scene.add(keyLight);

  const rimBlueLeft = new THREE.PointLight(0x60a5fa, 5.8, 16);
  rimBlueLeft.position.set(-3.4, 0.4, 1.4);
  scene.add(rimBlueLeft);

  const rimVioletRight = new THREE.PointLight(0x818cf8, 5.2, 16);
  rimVioletRight.position.set(3.4, 0.4, 1.4);
  scene.add(rimVioletRight);

  const flameCoreLight = new THREE.PointLight(0x93c5fd, 6.2, 14);
  flameCoreLight.position.set(0, 0.25, -0.6);
  scene.add(flameCoreLight);

  const warmEmberLight = new THREE.PointLight(0xfbbf24, 2.4, 12);
  warmEmberLight.position.set(0, -1.2, 2.4);
  scene.add(warmEmberLight);

  // Optional Obsidian Studio Floor
  let shadowMesh = null;
  if (options.showStudioFloor) {
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b101d,
      roughness: 0.45,
      metalness: 0.4,
    });
    const floorGeo = new THREE.PlaneGeometry(24, 16);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.42;
    scene.add(floor);

    const shadowTex = createFloorShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowGeo = new THREE.PlaneGeometry(8.8, 3.2);
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.4, 0);
    scene.add(shadowMesh);

    disposables.push(floorMat, floorGeo, shadowTex, shadowMat, shadowGeo);
  }

  // Hero Assembly
  const emblemRoot = new THREE.Group();
  scene.add(emblemRoot);

  // Smoke Atmosphere Layer
  const smokeMat = createSmokeHazeMaterial();
  const smokeGeo = new THREE.PlaneGeometry(11.6, 5.2);
  const smokePlane = new THREE.Mesh(smokeGeo, smokeMat);
  smokePlane.position.set(0, 0.05, -0.68);
  emblemRoot.add(smokePlane);
  disposables.push(smokeMat, smokeGeo);

  // Multi-layer Volumetric Blue-Violet Fire Sheets
  const backFlameMat = createBlueFlameMaterial(1.3, 0.92, false);
  const backFlameGeo = new THREE.PlaneGeometry(9.6, 3.6);
  const backFlameMesh = new THREE.Mesh(backFlameGeo, backFlameMat);
  backFlameMesh.position.set(0, 0.08, -0.34);
  emblemRoot.add(backFlameMesh);

  const midFlameMat = createBlueFlameMaterial(5.7, 0.78, false);
  const midFlameGeo = new THREE.PlaneGeometry(9.2, 3.15);
  const midFlameMesh = new THREE.Mesh(midFlameGeo, midFlameMat);
  midFlameMesh.position.set(0, 0.1, -0.14);
  emblemRoot.add(midFlameMesh);

  const frontWispMat = createBlueFlameMaterial(9.1, 0.52, true);
  const frontWispGeo = new THREE.PlaneGeometry(8.9, 2.75);
  const frontWispMesh = new THREE.Mesh(frontWispGeo, frontWispMat);
  frontWispMesh.position.set(0, 0.12, 0.25);
  frontWispMesh.renderOrder = 4;
  emblemRoot.add(frontWispMesh);

  disposables.push(
    backFlameMat,
    backFlameGeo,
    midFlameMat,
    midFlameGeo,
    frontWispMat,
    frontWispGeo,
  );

  // Forged Gold / Bronze Material for "TRIVIA RUMBLE ELITE"
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const goldTex = createForgedGoldTextures(maxAnisotropy);
  disposables.push(goldTex.map, goldTex.bumpMap);

  const baseGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4cd6a,
    map: goldTex.map,
    bumpMap: goldTex.bumpMap,
    bumpScale: 0.025,
    metalness: 0.92,
    roughness: 0.24,
    clearcoat: 0.35,
    clearcoatRoughness: 0.22,
    anisotropy: 0.65,
    emissive: 0x3b2608,
    emissiveIntensity: 0.28,
  });
  disposables.push(baseGoldMat);

  // Build "TRIVIA RUMBLE ELITE" 3D extruded letters
  const TITLE_TEXT = 'TRIVIA RUMBLE ELITE';
  const LETTER_GAP = 0.055;
  const chars = TITLE_TEXT.split('');
  const charWidths = chars.map((ch) => CHAR_WIDTH_MAP[ch] ?? 0.45);
  const totalWidth =
    charWidths.reduce((sum, w) => sum + w, 0) + LETTER_GAP * Math.max(0, chars.length - 1);

  const titleGroup = new THREE.Group();
  emblemRoot.add(titleGroup);

  const glyphGeometryCache = new Map();
  const letterNodes = [];
  let cursorX = -totalWidth / 2;

  chars.forEach((ch, idx) => {
    const cw = charWidths[idx];
    const centerX = cursorX + cw / 2;
    cursorX += cw + LETTER_GAP;

    if (ch === ' ') return;

    let geo = glyphGeometryCache.get(ch);
    if (!geo) {
      const shape = createRumbleLetterShape(ch);
      geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.22,
        bevelEnabled: true,
        bevelThickness: 0.032,
        bevelSize: 0.022,
        bevelSegments: 3,
        curveSegments: 14,
      });
      geo.center();
      glyphGeometryCache.set(ch, geo);
      disposables.push(geo);
    }

    const mat = baseGoldMat.clone();
    disposables.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    // Subtle heroic arch & slight inward flare
    const normX = centerX / (totalWidth / 2);
    const archY = (1 - normX * normX) * 0.06;
    const archZ = (1 - Math.abs(normX)) * 0.08;

    const holder = new THREE.Group();
    holder.position.set(centerX, archY, archZ);
    holder.rotation.y = -normX * 0.08;
    holder.add(mesh);
    titleGroup.add(holder);

    // Scale slightly smaller overall so 19 chars fit generously inside viewport
    mesh.userData = {
      char: ch,
      letterIndex: letterNodes.length,
      baseX: centerX,
      baseY: archY,
      baseZ: archZ,
      baseRotY: -normX * 0.08,
      rippleEnergy: 0,
      hoverMix: 0,
    };
    letterNodes.push({ holder, mesh, mat });
  });

  // Scale titleGroup so width ~ 7.5 world units cleanly inside the flame envelope
  titleGroup.scale.setScalar(0.84);

  // Rising Golden Sparks & Ice-Blue Embers (Points with custom soft glow shader)
  const SPARK_COUNT = 88;
  const sparkPositions = new Float32Array(SPARK_COUNT * 3);
  const sparkColors = new Float32Array(SPARK_COUNT * 3);
  const sparkSeeds = new Float32Array(SPARK_COUNT * 4);

  const warmGoldCol = new THREE.Color('#fbbf24');
  const hotOrangeCol = new THREE.Color('#fb923c');
  const iceBlueCol = new THREE.Color('#bae6fd');

  for (let i = 0; i < SPARK_COUNT; i++) {
    const x = (Math.random() - 0.5) * 9.0;
    const y = (Math.random() - 0.5) * 3.4;
    const z = (Math.random() - 0.5) * 1.1;
    sparkPositions[i * 3] = x;
    sparkPositions[i * 3 + 1] = y;
    sparkPositions[i * 3 + 2] = z;

    const cPick = Math.random();
    const col = cPick < 0.48 ? warmGoldCol : cPick < 0.78 ? hotOrangeCol : iceBlueCol;
    sparkColors[i * 3] = col.r;
    sparkColors[i * 3 + 1] = col.g;
    sparkColors[i * 3 + 2] = col.b;

    sparkSeeds[i * 4] = x;
    sparkSeeds[i * 4 + 1] = Math.random(); // phase 0..1
    sparkSeeds[i * 4 + 2] = 0.45 + Math.random() * 0.85; // speed factor
    sparkSeeds[i * 4 + 3] = 0.6 + Math.random() * 1.1; // size
  }

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('aColor', new THREE.BufferAttribute(sparkColors, 3));
  sparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeeds, 4));

  const sparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uFlare: { value: 0.0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute vec4 aSeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uFlare;
      uniform float uPixelRatio;

      void main() {
        vColor = aColor;
        float life = fract(aSeed.y + uTime * 0.24 * aSeed.z);
        vec3 pos = position;
        pos.y = -1.45 + life * 3.15;
        pos.x = aSeed.x + sin(uTime * 1.8 * aSeed.z + aSeed.y * 12.0) * (0.28 * uIntensity);
        pos.z += cos(uTime * 1.4 + aSeed.y * 9.0) * 0.18;

        vAlpha = sin(life * 3.14159265) * (0.65 + 0.35 * sin(uTime * 6.0 + aSeed.y * 20.0));
        vAlpha *= (0.85 + uFlare * 0.65);

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (18.0 * aSeed.w * uPixelRatio) / max(1.0, -mvPos.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float glow = smoothstep(0.5, 0.04, d);
        float core = smoothstep(0.2, 0.0, d);
        vec3 col = mix(vColor, vec3(1.0), core * 0.65);
        gl_FragColor = vec4(col, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.renderOrder = 5;
  emblemRoot.add(sparkPoints);
  disposables.push(sparkGeo, sparkMat);

  // OrbitControls
  let controls = null;
  if (options.enableOrbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 18.0;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.update();
  }

  // Pointer Interaction & Raycasting
  const raycaster = new THREE.Raycaster();
  const letterMeshes = letterNodes.map((n) => n.mesh);
  let pointerDownX = 0;
  let pointerDownY = 0;
  let pointerTiltX = 0;
  let pointerTiltY = 0;
  let hoveredIndex = -1;
  let flareEnergy = 0;
  let cameraTransitioning = false;

  function triggerRipple(centerIndex = 8) {
    flareEnergy = 1.0;
    letterNodes.forEach(({ mesh }, idx) => {
      const dist = Math.abs(idx - centerIndex);
      mesh.userData.rippleEnergy = Math.max(mesh.userData.rippleEnergy, Math.exp(-dist * 0.24));
    });
    if (audioEnabled) {
      sound.playFlare(centerIndex);
    }
  }

  function detectHoveredLetter(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    const hits = raycaster.intersectObjects(letterMeshes, false);
    if (hits.length > 0) {
      return hits[0].object.userData.letterIndex;
    }
    return -1;
  }

  function onPointerMove(e) {
    if (!options.enableOrbit) {
      pointerTiltX = 0;
      pointerTiltY = 0;
      hoveredIndex = -1;
      renderer.domElement.style.cursor = 'default';
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTiltX = nx * 0.22;
    pointerTiltY = ny * 0.14;

    hoveredIndex = detectHoveredLetter(e.clientX, e.clientY);
    renderer.domElement.style.cursor =
      hoveredIndex >= 0 ? 'pointer' : 'grab';
  }

  function onPointerLeave() {
    pointerTiltX = 0;
    pointerTiltY = 0;
    hoveredIndex = -1;
    renderer.domElement.style.cursor = 'default';
  }

  function onPointerDown(e) {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    if (cameraTransitioning) cameraTransitioning = false;
  }

  function onPointerUp(e) {
    if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;

    const hitIdx = detectHoveredLetter(e.clientX, e.clientY);
    if (hitIdx >= 0) {
      const node = letterNodes[hitIdx];
      triggerRipple(hitIdx);
      const payload = { char: node.mesh.userData.char, index: hitIdx };
      options.onLetterClick?.(node.mesh.userData.char, hitIdx);
      options.onClick?.(payload);
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    const bodyHits = raycaster.intersectObject(emblemRoot, true);
    if (bodyHits.length > 0) {
      triggerRipple(8);
      options.onClick?.({ char: null, index: null });
    }
  }

  function onContextLost(e) {
    e.preventDefault();
    options.onContextLost?.(true);
  }

  function onContextRestored() {
    options.onContextLost?.(false);
  }

  const domEl = renderer.domElement;
  domEl.addEventListener('pointermove', onPointerMove);
  domEl.addEventListener('pointerleave', onPointerLeave);
  domEl.addEventListener('pointerdown', onPointerDown);
  domEl.addEventListener('pointerup', onPointerUp);
  domEl.addEventListener('webglcontextlost', onContextLost);
  domEl.addEventListener('webglcontextrestored', onContextRestored);

  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    DEFAULT_CAM_POS.set(0, 0.24, getFittedZ(aspect));
    if (!controls) {
      camera.position.copy(DEFAULT_CAM_POS);
      camera.lookAt(DEFAULT_TARGET);
    } else if (cameraTransitioning) {
      camera.position.copy(DEFAULT_CAM_POS);
    }
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const clock = new THREE.Clock();
  let livePhase = 0;
  let frameId = 0;
  let disposed = false;

  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) return;
      const syncState = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (syncState === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    if (disposed) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    livePhase += dt * speed;
    flareEnergy = THREE.MathUtils.damp(flareEnergy, 0, 5.5, dt);

    const amp = intensity;

    // Drive Flame & Smoke & Spark shaders
    backFlameMat.uniforms.uTime.value = livePhase;
    backFlameMat.uniforms.uIntensity.value = amp;
    backFlameMat.uniforms.uFlare.value = flareEnergy;

    midFlameMat.uniforms.uTime.value = livePhase * 1.12;
    midFlameMat.uniforms.uIntensity.value = amp;
    midFlameMat.uniforms.uFlare.value = flareEnergy;

    frontWispMat.uniforms.uTime.value = livePhase * 1.25;
    frontWispMat.uniforms.uIntensity.value = amp;
    frontWispMat.uniforms.uFlare.value = flareEnergy;

    smokeMat.uniforms.uTime.value = livePhase;
    smokeMat.uniforms.uIntensity.value = amp;

    sparkMat.uniforms.uTime.value = livePhase;
    sparkMat.uniforms.uIntensity.value = amp;
    sparkMat.uniforms.uFlare.value = flareEnergy;

    // Flickering blue-violet firelight reflections on the gold typography
    const flickerA =
      Math.sin(livePhase * 7.3) * 0.5 +
      Math.sin(livePhase * 13.7 + 1.2) * 0.35 +
      Math.cos(livePhase * 21.1) * 0.15;
    const flickerB = Math.cos(livePhase * 8.9 + 0.8) * 0.55 + Math.sin(livePhase * 17.3) * 0.45;
    flameCoreLight.intensity = 5.6 + flickerA * 1.6 * amp + flareEnergy * 4.5;
    rimBlueLeft.intensity = 5.2 + flickerB * 1.4 * amp + flareEnergy * 3.0;
    rimVioletRight.intensity = 4.8 - flickerA * 1.3 * amp + flareEnergy * 3.0;

    // Overall emblem motion mode
    let rootY = 0;
    let rootX = 0;
    let rootRotX = 0;
    let rootRotY = 0;
    let rootRotZ = 0;
    let rootScale = 1 + flareEnergy * 0.045;

    if (motionMode === 'rumble') {
      const rumbleGate = Math.pow(Math.abs(Math.sin(livePhase * 2.1)), 1.6);
      rootX = Math.sin(livePhase * 26.0) * 0.045 * rumbleGate * amp;
      rootY = Math.cos(livePhase * 31.0) * 0.032 * rumbleGate * amp + Math.sin(livePhase * 1.8) * 0.04;
      rootRotZ = Math.sin(livePhase * 22.0) * 0.012 * rumbleGate * amp;
      rootRotY = Math.sin(livePhase * 1.1) * 0.06 * amp + pointerTiltX * 0.4;
      rootRotX = pointerTiltY * 0.4;
    } else if (motionMode === 'wave') {
      rootY = Math.sin(livePhase * 1.5) * 0.05 * amp;
      rootRotY = Math.sin(livePhase * 0.85) * 0.09 * amp + pointerTiltX * 0.35;
      rootRotX = Math.cos(livePhase * 1.1) * 0.035 * amp + pointerTiltY * 0.35;
    } else if (motionMode === 'pulse') {
      const beat = Math.pow(Math.max(0, Math.sin(livePhase * 3.4)), 4);
      rootScale = 1 + beat * 0.065 * amp + flareEnergy * 0.05;
      rootY = Math.sin(livePhase * 1.7) * 0.03 * amp;
      rootRotY = Math.cos(livePhase * 0.9) * 0.05 * amp + pointerTiltX * 0.4;
      rootRotX = pointerTiltY * 0.4;
    } else if (motionMode === 'tilt') {
      rootY = Math.sin(livePhase * 1.4) * 0.025 * amp;
      rootRotY = pointerTiltX * 1.35 * amp + Math.sin(livePhase * 0.7) * 0.03;
      rootRotX = pointerTiltY * 1.2 * amp + Math.cos(livePhase * 0.8) * 0.02;
      rootRotZ = -pointerTiltX * 0.14 * amp;
    } else {
      // 'blaze' default living motion
      rootY = Math.sin(livePhase * 1.55) * 0.055 * amp;
      rootRotY = Math.sin(livePhase * 0.75) * 0.075 * amp + pointerTiltX * 0.45;
      rootRotX = Math.cos(livePhase * 1.05) * 0.03 * amp + pointerTiltY * 0.45;
      rootRotZ = Math.sin(livePhase * 0.9) * 0.012 * amp;
    }

    _targetScale.setScalar(rootScale);
    emblemRoot.scale.lerp(_targetScale, 1 - Math.exp(-10 * dt));
    emblemRoot.position.x = THREE.MathUtils.damp(emblemRoot.position.x, rootX, 14, dt);
    emblemRoot.position.y = THREE.MathUtils.damp(emblemRoot.position.y, rootY, 8, dt);
    emblemRoot.rotation.x = THREE.MathUtils.damp(emblemRoot.rotation.x, rootRotX, 8, dt);
    emblemRoot.rotation.y = THREE.MathUtils.damp(emblemRoot.rotation.y, rootRotY, 8, dt);
    emblemRoot.rotation.z = THREE.MathUtils.damp(emblemRoot.rotation.z, rootRotZ, 8, dt);

    // Individual 3D Letter Motion
    letterNodes.forEach(({ holder, mesh, mat }, i) => {
      const ud = mesh.userData;
      ud.rippleEnergy = THREE.MathUtils.damp(ud.rippleEnergy, 0, 4.5, dt);
      const isHovered = hoveredIndex === i ? 1 : 0;
      ud.hoverMix = THREE.MathUtils.damp(ud.hoverMix, isHovered, 10, dt);

      let dy = 0;
      let dz = ud.rippleEnergy * 0.34 + ud.hoverMix * 0.22;
      let rx = 0;
      let ry = ud.baseRotY;
      let rz = 0;
      let letterScale = 1 + ud.rippleEnergy * 0.12 + ud.hoverMix * 0.08;

      if (motionMode === 'wave') {
        const w = livePhase * 2.8 - i * 0.42;
        dy = Math.sin(w) * 0.085 * amp;
        dz += Math.cos(w) * 0.09 * amp;
        rx = Math.sin(w) * 0.12 * amp;
        ry += Math.cos(w) * 0.1 * amp;
      } else if (motionMode === 'rumble') {
        const w = livePhase * 5.2 - i * 0.5;
        dy = Math.sin(w * 2.5) * 0.038 * amp;
        dz += Math.max(0, Math.sin(w)) * 0.08 * amp;
        rz = Math.sin(w * 3.1) * 0.045 * amp;
      } else if (motionMode === 'pulse') {
        const beat = Math.pow(Math.max(0, Math.sin(livePhase * 3.4 - i * 0.14)), 4);
        dz += beat * 0.14 * amp;
        letterScale += beat * 0.08 * amp;
      } else {
        // 'blaze' / 'tilt' subtle heat-shimmer breathe per letter
        const h = livePhase * 2.3 + i * 0.48;
        dy = Math.sin(h) * 0.028 * amp;
        dz += Math.cos(h * 0.85) * 0.032 * amp;
        rx = Math.sin(h * 0.7) * 0.04 * amp;
      }

      holder.position.y = ud.baseY + dy;
      holder.position.z = ud.baseZ + dz;
      holder.rotation.x = rx;
      holder.rotation.y = ry;
      holder.rotation.z = rz;
      mesh.scale.setScalar(letterScale);

      // Subtle hot gold/electric glow on hover & ripple
      mat.emissiveIntensity = 0.26 + ud.rippleEnergy * 0.75 + ud.hoverMix * 0.55 + flareEnergy * 0.35;
    });

    if (shadowMesh) {
      shadowMesh.material.opacity = THREE.MathUtils.clamp(0.82 - rootY * 1.4 + flareEnergy * 0.18, 0.45, 0.96);
    }

    if (cameraTransitioning && controls) {
      camera.position.lerp(DEFAULT_CAM_POS, 1 - Math.exp(-7 * dt));
      controls.target.lerp(DEFAULT_TARGET, 1 - Math.exp(-7 * dt));
      if (camera.position.distanceTo(DEFAULT_CAM_POS) < 0.015) {
        camera.position.copy(DEFAULT_CAM_POS);
        controls.target.copy(DEFAULT_TARGET);
        cameraTransitioning = false;
      }
    }

    if (controls) controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  return {
    setMotionMode: (mode) => {
      if (TRIVIA_RUMBLE_MOTION_MODES.includes(mode)) {
        motionMode = mode;
      }
    },
    setSpeed: (nextSpeed) => {
      speed = Math.max(0.25, Math.min(2.5, Number(nextSpeed) || 1.0));
    },
    setIntensity: (nextIntensity) => {
      intensity = Math.max(0.25, Math.min(2.2, Number(nextIntensity) || 1.0));
    },
    setAudioEnabled: (enabled) => {
      audioEnabled = Boolean(enabled);
    },
    setMasterVolume: (percent) => {
      sound.setVolume(percent / 100);
    },
    pulse: (letterIndex = 8) => {
      triggerRipple(letterIndex);
    },
    resetCamera: () => {
      cameraTransitioning = true;
    },
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);
      controls?.dispose();
      disposables.forEach((d) => d.dispose?.());
      sound.dispose();
      renderer.dispose();
      if (domEl.parentElement === container) {
        container.removeChild(domEl);
      }
    },
  };
}
