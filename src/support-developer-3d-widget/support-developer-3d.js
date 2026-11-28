import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _vec2 = new THREE.Vector2();
const _targetScale = new THREE.Vector3();

export const SUPPORT_MOTION_MODES = [
  'wave',
  'heartbeat',
  'hover',
  'ripple',
  'bounce',
  'shimmer',
  'tilt',
  'auto',
];

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

function createRoundedRectShape(width, height, radius) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw * 0.48, hh * 0.48);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function createThickStrokeShape(points, halfWidth) {
  const left = [];
  const right = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;
    left.push({ x: points[i].x + nx * halfWidth, y: points[i].y + ny * halfWidth });
    right.push({ x: points[i].x - nx * halfWidth, y: points[i].y - ny * halfWidth });
  }

  const shape = new THREE.Shape();
  shape.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) {
    shape.lineTo(left[i].x, left[i].y);
  }

  const endPt = points[n - 1];
  const endAngleL = Math.atan2(left[n - 1].y - endPt.y, left[n - 1].x - endPt.x);
  const endAngleR = Math.atan2(right[n - 1].y - endPt.y, right[n - 1].x - endPt.x);
  shape.absarc(endPt.x, endPt.y, halfWidth, endAngleL, endAngleR, true);

  for (let i = n - 2; i >= 0; i--) {
    shape.lineTo(right[i].x, right[i].y);
  }

  const startPt = points[0];
  const startAngleR = Math.atan2(right[0].y - startPt.y, right[0].x - startPt.x);
  const startAngleL = Math.atan2(left[0].y - startPt.y, left[0].x - startPt.x);
  shape.absarc(startPt.x, startPt.y, halfWidth, startAngleR, startAngleL, true);

  return shape;
}

/**
 * Procedural 3D glyph shapes for SUPPORT DEVELOPER (S, U, P, O, R, T, D, E, V, L).
 * Zero external font files required.
 */
function createSupportLetterShape(char) {
  switch (char) {
    case 'T': {
      const s = new THREE.Shape();
      s.moveTo(-0.052, -0.28);
      s.lineTo(0.052, -0.28);
      s.lineTo(0.052, 0.175);
      s.lineTo(0.21, 0.175);
      s.lineTo(0.21, 0.28);
      s.lineTo(-0.21, 0.28);
      s.lineTo(-0.21, 0.175);
      s.lineTo(-0.052, 0.175);
      s.closePath();
      return s;
    }

    case 'L': {
      const s = new THREE.Shape();
      s.moveTo(-0.18, -0.28);
      s.lineTo(0.18, -0.28);
      s.lineTo(0.18, -0.175);
      s.lineTo(-0.075, -0.175);
      s.lineTo(-0.075, 0.28);
      s.lineTo(-0.18, 0.28);
      s.closePath();
      return s;
    }

    case 'E': {
      const s = new THREE.Shape();
      s.moveTo(-0.19, -0.28);
      s.lineTo(0.19, -0.28);
      s.lineTo(0.19, -0.175);
      s.lineTo(-0.085, -0.175);
      s.lineTo(-0.085, -0.048);
      s.lineTo(0.15, -0.048);
      s.lineTo(0.15, 0.052);
      s.lineTo(-0.085, 0.052);
      s.lineTo(-0.085, 0.175);
      s.lineTo(0.19, 0.175);
      s.lineTo(0.19, 0.28);
      s.lineTo(-0.19, 0.28);
      s.closePath();
      return s;
    }

    case 'V': {
      const s = new THREE.Shape();
      s.moveTo(-0.055, -0.28);
      s.lineTo(0.055, -0.28);
      s.lineTo(0.22, 0.28);
      s.lineTo(0.11, 0.28);
      s.lineTo(0, -0.08);
      s.lineTo(-0.11, 0.28);
      s.lineTo(-0.22, 0.28);
      s.closePath();
      return s;
    }

    case 'U': {
      const pts = [
        { x: -0.148, y: 0.23 },
        { x: -0.148, y: 0.06 },
        { x: -0.148, y: -0.07 },
      ];
      const arcSteps = 18;
      for (let i = 1; i < arcSteps; i++) {
        const a = Math.PI + (i / arcSteps) * Math.PI;
        pts.push({ x: Math.cos(a) * 0.148, y: -0.07 + Math.sin(a) * 0.152 });
      }
      pts.push({ x: 0.148, y: -0.07 });
      pts.push({ x: 0.148, y: 0.06 });
      pts.push({ x: 0.148, y: 0.23 });
      return createThickStrokeShape(pts, 0.052);
    }

    case 'O': {
      const s = new THREE.Shape();
      s.absellipse(0, 0, 0.215, 0.28, 0, Math.PI * 2, false, 0);
      const hole = new THREE.Path();
      hole.absellipse(0, 0, 0.10, 0.172, 0, Math.PI * 2, true, 0);
      s.holes.push(hole);
      return s;
    }

    case 'D': {
      const s = new THREE.Shape();
      s.moveTo(-0.20, -0.28);
      s.lineTo(0.01, -0.28);
      s.absellipse(0.01, 0, 0.21, 0.28, -Math.PI / 2, Math.PI / 2, false, 0);
      s.lineTo(-0.20, 0.28);
      s.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.095, -0.175);
      hole.lineTo(-0.095, 0.175);
      hole.lineTo(0.01, 0.175);
      hole.absellipse(0.01, 0, 0.105, 0.175, Math.PI / 2, -Math.PI / 2, true, 0);
      hole.closePath();
      s.holes.push(hole);
      return s;
    }

    case 'P': {
      const s = new THREE.Shape();
      s.moveTo(-0.19, -0.28);
      s.lineTo(-0.085, -0.28);
      s.lineTo(-0.085, -0.03);
      s.lineTo(0.03, -0.03);
      s.absellipse(0.03, 0.125, 0.17, 0.155, -Math.PI / 2, Math.PI / 2, false, 0);
      s.lineTo(-0.19, 0.28);
      s.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.085, 0.068);
      hole.lineTo(-0.085, 0.182);
      hole.lineTo(0.025, 0.182);
      hole.absellipse(0.025, 0.125, 0.068, 0.057, Math.PI / 2, -Math.PI / 2, true, 0);
      hole.closePath();
      s.holes.push(hole);
      return s;
    }

    case 'R': {
      const s = new THREE.Shape();
      s.moveTo(-0.19, -0.28);
      s.lineTo(-0.085, -0.28);
      s.lineTo(-0.085, -0.03);
      s.lineTo(0.01, -0.03);
      s.lineTo(0.12, -0.28);
      s.lineTo(0.23, -0.28);
      s.lineTo(0.133, 0.002);
      s.absellipse(0.03, 0.125, 0.17, 0.155, -0.92, Math.PI / 2, false, 0);
      s.lineTo(-0.19, 0.28);
      s.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.085, 0.068);
      hole.lineTo(-0.085, 0.182);
      hole.lineTo(0.025, 0.182);
      hole.absellipse(0.025, 0.125, 0.068, 0.057, Math.PI / 2, -Math.PI / 2, true, 0);
      hole.closePath();
      s.holes.push(hole);
      return s;
    }

    case 'S':
    default: {
      const pts = [];
      const topSteps = 16;
      for (let i = 0; i <= topSteps; i++) {
        const t = i / topSteps;
        const a = 0.38 + t * (Math.PI - 0.38);
        pts.push({ x: Math.cos(a) * 0.145, y: 0.13 + Math.sin(a) * 0.092 });
      }
      const midSteps = 14;
      for (let i = 1; i < midSteps; i++) {
        const t = i / midSteps;
        const inv = 1 - t;
        const x =
          inv * inv * inv * -0.145 +
          3 * inv * inv * t * -0.145 +
          3 * inv * t * t * 0.145 +
          t * t * t * 0.145;
        const y =
          inv * inv * inv * 0.13 +
          3 * inv * inv * t * 0.025 +
          3 * inv * t * t * -0.025 +
          t * t * t * -0.13;
        pts.push({ x, y });
      }
      const botSteps = 16;
      for (let i = 0; i <= botSteps; i++) {
        const t = i / botSteps;
        const a = -t * (Math.PI + 0.38);
        pts.push({ x: Math.cos(a) * 0.145, y: -0.13 + Math.sin(a) * 0.092 });
      }
      return createThickStrokeShape(pts, 0.054);
    }
  }
}

function createBeadBlastedTexture(maxAnisotropy) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#5a636e';
  ctx.fillRect(0, 0, size, size);

  let seed = 9341;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 4200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.5 + rand() * 1.1;
    const v = Math.floor(78 + rand() * 28);
    ctx.fillStyle = `rgb(${v}, ${v + 6}, ${v + 14})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.5, 2.2);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(canvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(3.5, 2.2);
  bump.colorSpace = THREE.NoColorSpace;
  bump.anisotropy = maxAnisotropy;

  return { map, bump };
}

function createCobaltCyanTexture(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 256, 256, 0);
  grad.addColorStop(0.0, '#163f73');
  grad.addColorStop(0.35, '#216eb8');
  grad.addColorStop(0.75, '#43bdf0');
  grad.addColorStop(1.0, '#8fefff');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0, 'rgba(18, 24, 34, 0.42)');
  grad.addColorStop(0.55, 'rgba(18, 24, 34, 0.15)');
  grad.addColorStop(1, 'rgba(18, 24, 34, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class SupportAudioFeedback {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.7;
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(norm) {
    this.volume = Math.max(0, Math.min(1, norm));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
  }

  playSupportChime(index = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const scale = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25];
    const root = scale[index % scale.length];
    const now = ctx.currentTime;

    [root, root * 1.25, root * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(idx === 0 ? 0.12 : 0.06, now + idx * 0.035 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.38);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.4);
    });
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

/**
 * Create and mount the living, multi-motion 3D SUPPORT DEVELOPER plaque.
 */
export function createSupportDeveloper3DWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createSupportDeveloper3DWidget requires a valid DOM container element.');
  }

  const options = {
    motionMode: 'wave', // 'wave' | 'heartbeat' | 'hover' | 'ripple' | 'bounce' | 'shimmer' | 'tilt' | 'auto'
    speed: 1.0,
    intensity: 1.0,
    background: '#d7dce3', // Pass 'transparent' to float over apps or games
    showStudioFloor: true,
    enableOrbit: true,
    enableSoundFeedback: true,
    masterVolume: 70,
    onClick: null,
    onLetterClick: null,
    onMotionChange: null,
    onContextLost: null,
    ...userOptions,
  };

  let motionMode = options.motionMode;
  let speed = Math.max(0.2, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.2, Math.min(2.0, Number(options.intensity) || 1.0));
  let soundEnabled = Boolean(options.enableSoundFeedback);
  let hoveredLetterIdx = -1;
  let pointerNormX = 0;
  let pointerNormY = 0;

  const audio = new SupportAudioFeedback();
  audio.setVolume(options.masterVolume / 100);

  const isSoftwareGl = detectSoftwareWebGL();
  const isTransparent = options.background === 'transparent';

  const scene = new THREE.Scene();
  if (!isTransparent) {
    const bgColor = new THREE.Color(options.background);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(bgColor, 10, 24);
  }

  const width = container.clientWidth || 560;
  const height = container.clientHeight || 420;
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
  const DEFAULT_CAM_POS = new THREE.Vector3(0.0, 0.16, 4.95);
  const DEFAULT_TARGET = new THREE.Vector3(0, 0.08, 0);
  camera.position.copy(DEFAULT_CAM_POS);
  if (!options.enableOrbit) {
    camera.lookAt(DEFAULT_TARGET);
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: isTransparent,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = options.enableOrbit ? 'none' : 'pan-y';
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // Studio 3-point lighting + dynamic cyan shimmer light
  const hemiLight = new THREE.HemisphereLight(0xf3f7ff, 0x8d95a3, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.85);
  keyLight.position.set(3.8, 5.4, 4.8);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 16;
    const d = 3.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8be2ff, 1.05);
  rimLight.position.set(-4.2, 2.8, -3.6);
  scene.add(rimLight);

  const sweepLight = new THREE.PointLight(0x5ce1ff, 1.15, 9, 2);
  sweepLight.position.set(0, 0.8, 2.8);
  scene.add(sweepLight);

  const disposables = [];
  if (options.showStudioFloor && !isTransparent) {
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(options.background).multiplyScalar(0.97),
      roughness: 0.92,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.78;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);
    disposables.push(floorGeo, floorMat);

    const grid = new THREE.GridHelper(32, 32, 0xb2b9c4, 0xc3c9d3);
    grid.position.y = -1.76;
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.35;
      });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
    }
    scene.add(grid);

    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(4.6, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -1.74, 0);
    scene.add(contactShadow);
    disposables.push(shadowTex, shadowGeo, shadowMat);
  }

  // Front-facing rounded aluminum plaque matching the uploaded Support Developer image
  const tileRoot = new THREE.Group();
  tileRoot.position.set(0, 0.08, 0);
  scene.add(tileRoot);

  const badgeGroup = new THREE.Group();
  tileRoot.add(badgeGroup);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const { map: beadMap, bump: beadBump } = createBeadBlastedTexture(maxAniso);
  const cobaltTex = createCobaltCyanTexture(maxAniso);
  disposables.push(beadMap, beadBump, cobaltTex);

  // 1. Outer Aluminum Rim
  const outerShape = createRoundedRectShape(3.96, 2.26, 0.62);
  const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.075,
    bevelSegments: 6,
    curveSegments: 24,
  });
  outerGeo.center();
  const aluminumMat = new THREE.MeshPhysicalMaterial({
    color: 0xc5ccd5,
    metalness: 0.88,
    roughness: 0.25,
    anisotropy: 0.65,
    clearcoat: 0.3,
    clearcoatRoughness: 0.24,
  });
  const outerMesh = new THREE.Mesh(outerGeo, aluminumMat);
  outerMesh.castShadow = !isSoftwareGl;
  outerMesh.receiveShadow = !isSoftwareGl;
  badgeGroup.add(outerMesh);
  disposables.push(outerGeo, aluminumMat);

  // 2. Inner Recessed Lip Groove
  const lipShape = createRoundedRectShape(3.66, 1.98, 0.50);
  const lipGeo = new THREE.ExtrudeGeometry(lipShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.025,
    bevelSegments: 4,
    curveSegments: 20,
  });
  lipGeo.center();
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0x343a43,
    metalness: 0.45,
    roughness: 0.48,
  });
  const lipMesh = new THREE.Mesh(lipGeo, lipMat);
  lipMesh.position.z = 0.095;
  badgeGroup.add(lipMesh);
  disposables.push(lipGeo, lipMat);

  // 3. Recessed Cool-Slate Bead-Blasted Plate
  const plateShape = createRoundedRectShape(3.56, 1.88, 0.46);
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 4,
    curveSegments: 20,
  });
  plateGeo.center();
  const plateMat = new THREE.MeshStandardMaterial({
    map: beadMap,
    bumpMap: beadBump,
    bumpScale: 0.01,
    roughness: 0.72,
    metalness: 0.22,
  });
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.position.z = 0.132;
  plateMesh.receiveShadow = !isSoftwareGl;
  badgeGroup.add(plateMesh);
  disposables.push(plateGeo, plateMat);

  // 4. Individual Extruded 3D Letters: "SUPPORT" + "DEVELOPER"
  const uniqueChars = ['S', 'U', 'P', 'O', 'R', 'T', 'D', 'E', 'V', 'L'];
  const glyphGeoCache = {};
  uniqueChars.forEach((ch) => {
    const shape = createSupportLetterShape(ch);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.025,
      bevelSegments: 5,
      curveSegments: 18,
    });
    geo.center();
    glyphGeoCache[ch] = geo;
    disposables.push(geo);
  });

  const topWord = 'SUPPORT';
  const botWord = 'DEVELOPER';
  const topSpacing = 0.425;
  const botSpacing = 0.375;

  const letterSpecs = [];
  for (let i = 0; i < topWord.length; i++) {
    const x = (i - (topWord.length - 1) / 2) * topSpacing;
    letterSpecs.push({ char: topWord[i], x, y: 0.35, row: 0, col: i });
  }
  for (let i = 0; i < botWord.length; i++) {
    const x = (i - (botWord.length - 1) / 2) * botSpacing;
    letterSpecs.push({ char: botWord[i], x, y: -0.34, row: 1, col: i });
  }

  const letterMeshes = letterSpecs.map((spec, index) => {
    const mat = new THREE.MeshPhysicalMaterial({
      map: cobaltTex,
      color: 0xdff6ff,
      metalness: 0.84,
      roughness: 0.17,
      clearcoat: 0.82,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(glyphGeoCache[spec.char], mat);
    mesh.position.set(spec.x, spec.y, 0.29);
    mesh.scale.set(0.95, 0.95, 1);
    mesh.castShadow = !isSoftwareGl;
    mesh.userData = {
      ...spec,
      index,
      baseX: spec.x,
      baseY: spec.y,
      baseZ: 0.29,
    };
    badgeGroup.add(mesh);
    disposables.push(mat);
    return mesh;
  });

  const interactiveObjects = [outerMesh, plateMesh, lipMesh, ...letterMeshes];

  let controls = null;
  if (options.enableOrbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.0;
    controls.maxDistance = 12.0;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.update();
  } else {
    camera.lookAt(DEFAULT_TARGET);
  }

  let tilePressZ = 0;
  let rippleOriginIndex = -1;
  let rippleTime = 99;
  let autoRippleClock = 0;
  let clickBurst = 0;
  let cameraTransitioning = false;
  let lastAutoMode = 'wave';

  const AUTO_CYCLE_ORDER = [
    'wave',
    'heartbeat',
    'hover',
    'ripple',
    'bounce',
    'shimmer',
    'tilt',
  ];

  function triggerRipple(centerIndex = 3, withSound = true) {
    tilePressZ = -0.09;
    rippleOriginIndex = centerIndex;
    rippleTime = 0;
    clickBurst = 1.0;
    if (withSound && soundEnabled) {
      audio.playSupportChime(centerIndex);
    }
    const ch = letterMeshes[centerIndex]?.userData.char || '';
    options.onClick?.({ letterIndex: centerIndex, char: ch, motionMode });
    if (centerIndex >= 0 && ch) {
      options.onLetterClick?.(ch, centerIndex);
    }
  }

  const raycaster = new THREE.Raycaster();
  let pointerDownX = 0;
  let pointerDownY = 0;
  let lastHoverCheck = 0;

  function raycastAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    return raycaster.intersectObjects(interactiveObjects, false);
  }

  function onPointerDown(e) {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    if (cameraTransitioning) cameraTransitioning = false;
  }

  function onPointerUp(e) {
    if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;
    const hits = raycastAt(e.clientX, e.clientY);
    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const idx = typeof hitObj.userData?.index === 'number' ? hitObj.userData.index : 3;
      triggerRipple(idx, true);
    }
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNormX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    pointerNormY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;

    const now = performance.now();
    if (now - lastHoverCheck < 45) return;
    lastHoverCheck = now;

    const hits = raycastAt(e.clientX, e.clientY);
    const nextIdx =
      hits.length > 0 && typeof hits[0].object.userData?.index === 'number'
        ? hits[0].object.userData.index
        : -1;
    hoveredLetterIdx = nextIdx;
    renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : options.enableOrbit ? 'grab' : 'default';
  }

  function onPointerLeave() {
    pointerNormX = 0;
    pointerNormY = 0;
    hoveredLetterIdx = -1;
  }

  function onContextLost(e) {
    e.preventDefault();
    options.onContextLost?.(true);
  }

  function onContextRestored() {
    options.onContextLost?.(false);
  }

  const domEl = renderer.domElement;
  domEl.addEventListener('pointerdown', onPointerDown);
  domEl.addEventListener('pointerup', onPointerUp);
  domEl.addEventListener('pointermove', onPointerMove);
  domEl.addEventListener('pointerleave', onPointerLeave);
  domEl.addEventListener('webglcontextlost', onContextLost);
  domEl.addEventListener('webglcontextrestored', onContextRestored);

  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const clock = new THREE.Clock();
  let phaseTime = 0;
  let frameId = 0;
  let disposed = false;

  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
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
    phaseTime += dt * speed;
    rippleTime += dt;
    autoRippleClock += dt * speed;
    clickBurst = THREE.MathUtils.damp(clickBurst, 0, 5.5, dt);
    tilePressZ = THREE.MathUtils.damp(tilePressZ, 0, 12, dt);

    // Resolve active motion (supports 'auto' cycling every 4.5s)
    let activeMotion = motionMode;
    if (motionMode === 'auto') {
      const cycleIdx = Math.floor(phaseTime / 4.5) % AUTO_CYCLE_ORDER.length;
      activeMotion = AUTO_CYCLE_ORDER[cycleIdx];
      if (activeMotion !== lastAutoMode) {
        lastAutoMode = activeMotion;
        options.onMotionChange?.(activeMotion);
      }
    }

    // Periodic automatic center ripple when in 'ripple' motion mode
    if (activeMotion === 'ripple' && autoRippleClock > 1.8) {
      autoRippleClock = 0;
      rippleOriginIndex = 3; // Center 'P' in SUPPORT
      rippleTime = 0;
    }

    // Badge-level motion transforms
    let rootTargetX = 0;
    let rootTargetY = 0.08 + Math.sin(phaseTime * 1.4) * 0.04 * intensity;
    let rotTargetX = 0;
    let rotTargetY = 0;
    let rotTargetZ = 0;
    let badgeScaleTarget = 1 + clickBurst * 0.025;

    if (activeMotion === 'wave') {
      rotTargetX = Math.sin(phaseTime * 1.1) * 0.045 * intensity;
      rotTargetY = Math.cos(phaseTime * 0.85) * 0.09 * intensity;
      rotTargetZ = Math.sin(phaseTime * 0.9) * 0.02 * intensity;
    } else if (activeMotion === 'heartbeat') {
      const lub = Math.pow(Math.max(0, Math.sin(phaseTime * 2.8)), 8);
      const dub = Math.pow(Math.max(0, Math.sin(phaseTime * 2.8 - 0.55)), 10);
      const beat = lub * 0.65 + dub * 0.45;
      badgeScaleTarget += beat * 0.05 * intensity;
      rootTargetY += beat * 0.04 * intensity;
      rotTargetX = -beat * 0.04 * intensity;
    } else if (activeMotion === 'hover') {
      rootTargetX = Math.sin(phaseTime * 0.85) * 0.14 * intensity;
      rootTargetY = 0.1 + Math.sin(phaseTime * 1.65) * 0.11 * intensity;
      rotTargetX = Math.sin(phaseTime * 1.15) * 0.1 * intensity;
      rotTargetY = Math.sin(phaseTime * 0.75) * 0.18 * intensity;
      rotTargetZ = Math.cos(phaseTime * 0.95) * 0.06 * intensity;
    } else if (activeMotion === 'ripple') {
      rotTargetX = Math.sin(phaseTime * 0.9) * 0.03 * intensity;
      rotTargetY = Math.cos(phaseTime * 0.7) * 0.05 * intensity;
    } else if (activeMotion === 'bounce') {
      rotTargetX = Math.sin(phaseTime * 1.5) * 0.04 * intensity;
      rotTargetY = Math.cos(phaseTime * 1.2) * 0.07 * intensity;
    } else if (activeMotion === 'shimmer') {
      rotTargetY = Math.sin(phaseTime * 0.7) * 0.07 * intensity;
    } else if (activeMotion === 'tilt') {
      const idleX = Math.sin(phaseTime * 0.9) * 0.06;
      const idleY = Math.cos(phaseTime * 0.7) * 0.09;
      rotTargetY = (pointerNormX * 0.26 + idleY) * intensity;
      rotTargetX = (pointerNormY * 0.18 + idleX) * intensity;
      rotTargetZ = -pointerNormX * 0.04 * intensity;
    }

    tileRoot.position.x = THREE.MathUtils.damp(tileRoot.position.x, rootTargetX, 7, dt);
    tileRoot.position.y = THREE.MathUtils.damp(tileRoot.position.y, rootTargetY, 7, dt);
    tileRoot.rotation.x = THREE.MathUtils.damp(tileRoot.rotation.x, rotTargetX, 7, dt);
    tileRoot.rotation.y = THREE.MathUtils.damp(tileRoot.rotation.y, rotTargetY, 7, dt);
    tileRoot.rotation.z = THREE.MathUtils.damp(tileRoot.rotation.z, rotTargetZ, 7, dt);

    _targetScale.set(badgeScaleTarget, badgeScaleTarget, 1);
    badgeGroup.scale.lerp(_targetScale, 1 - Math.exp(-12 * dt));
    badgeGroup.position.z = tilePressZ;

    // Sweeping highlight light
    const sweepRate = activeMotion === 'shimmer' ? 2.6 : 1.2;
    sweepLight.position.x = Math.sin(phaseTime * sweepRate) * 2.4;
    sweepLight.position.y = Math.cos(phaseTime * sweepRate * 0.7) * 1.0 + 0.25;
    sweepLight.intensity =
      (activeMotion === 'shimmer' ? 2.1 : 1.15) + clickBurst * 1.1;

    // Individual per-letter living animation
    letterMeshes.forEach((mesh, idx) => {
      const { baseX, baseY, baseZ, row, col } = mesh.userData;
      let targetZ = baseZ;
      let targetY = baseY;
      let targetRotX = 0;
      let targetRotY = 0;
      let scaleBoost = 0.95;
      let emissiveTarget = 0.08;

      if (activeMotion === 'wave') {
        const arg = phaseTime * 3.1 - col * 0.52 - row * 0.95;
        const w = Math.sin(arg);
        targetZ += w * 0.048 * intensity;
        targetY += Math.cos(arg) * 0.018 * intensity;
        targetRotX = Math.sin(arg) * 0.06 * intensity;
        targetRotY = Math.cos(arg) * 0.08 * intensity;
        emissiveTarget += Math.max(0, w) * 0.24 * intensity;
      } else if (activeMotion === 'heartbeat') {
        const lub = Math.pow(Math.max(0, Math.sin(phaseTime * 2.8 - row * 0.15)), 8);
        const dub = Math.pow(Math.max(0, Math.sin(phaseTime * 2.8 - 0.55 - row * 0.15)), 10);
        const beat = lub * 0.65 + dub * 0.45;
        targetZ += beat * 0.095 * intensity;
        scaleBoost += beat * 0.09 * intensity;
        emissiveTarget += beat * 0.48 * intensity;
      } else if (activeMotion === 'hover') {
        const f = Math.sin(phaseTime * 2.1 + idx * 0.48);
        targetZ += f * 0.032 * intensity;
        targetRotY = Math.cos(phaseTime * 1.5 + idx * 0.4) * 0.06 * intensity;
        emissiveTarget += Math.max(0, f) * 0.16;
      } else if (activeMotion === 'bounce') {
        const seq = (phaseTime * 2.5 - idx * 0.22) % (Math.PI * 2);
        const hop = Math.pow(Math.max(0, Math.sin(seq)), 4);
        targetY += hop * 0.085 * intensity;
        targetZ += hop * 0.095 * intensity;
        scaleBoost += hop * 0.08 * intensity;
        emissiveTarget += hop * 0.38 * intensity;
      } else if (activeMotion === 'shimmer') {
        const diagPos = baseX * 0.65 + baseY * 0.55;
        const sweepCoord = Math.sin(phaseTime * 2.6) * 1.6;
        const dist = Math.abs(diagPos - sweepCoord);
        const glint = Math.max(0, 1 - dist / 0.65);
        targetZ += glint * 0.065 * intensity;
        scaleBoost += glint * 0.06 * intensity;
        emissiveTarget += glint * 0.58 * intensity;
      } else if (activeMotion === 'tilt') {
        targetZ += (Math.abs(pointerNormX) + Math.abs(pointerNormY)) * 0.025 * intensity;
        targetRotY = pointerNormX * 0.08 * intensity;
        targetRotX = pointerNormY * 0.06 * intensity;
        emissiveTarget += 0.08;
      }

      // Click / Auto-ripple shockwave radiating across letters
      if (rippleOriginIndex >= 0 && rippleTime < 1.5) {
        const origin = letterMeshes[rippleOriginIndex].userData;
        const dist = Math.hypot(baseX - origin.baseX, baseY - origin.baseY);
        const waveFront = rippleTime * 4.2 - dist;
        if (waveFront > 0 && waveFront < Math.PI * 1.5) {
          const amp = Math.sin(waveFront) * Math.exp(-rippleTime * 2.2) * 0.15 * intensity;
          targetZ += amp;
          scaleBoost += Math.max(0, amp) * 0.5;
          emissiveTarget += Math.max(0, amp) * 2.6;
        }
      }

      if (hoveredLetterIdx === idx) {
        targetZ += 0.09;
        scaleBoost += 0.08;
        emissiveTarget += 0.35;
      }

      mesh.position.z = THREE.MathUtils.damp(mesh.position.z, targetZ, 14, dt);
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, targetY, 13, dt);
      mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, targetRotX, 12, dt);
      mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, targetRotY, 12, dt);
      _targetScale.set(scaleBoost, scaleBoost, 1 + (scaleBoost - 0.95) * 0.6);
      mesh.scale.lerp(_targetScale, 1 - Math.exp(-14 * dt));
      mesh.material.emissiveIntensity = THREE.MathUtils.damp(
        mesh.material.emissiveIntensity,
        emissiveTarget + clickBurst * 0.22,
        12,
        dt,
      );
    });

    if (cameraTransitioning && controls) {
      camera.position.lerp(DEFAULT_CAM_POS, 1 - Math.exp(-7 * dt));
      controls.target.lerp(DEFAULT_TARGET, 1 - Math.exp(-7 * dt));
      if (camera.position.distanceTo(DEFAULT_CAM_POS) < 0.015) {
        camera.position.copy(DEFAULT_CAM_POS);
        controls.target.copy(DEFAULT_TARGET);
        cameraTransitioning = false;
      }
    }

    if (controls) {
      controls.update();
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  return {
    getMotionMode: () => motionMode,
    setMotionMode: (mode) => {
      motionMode = mode;
      autoRippleClock = 1.9;
    },
    setSpeed: (nextSpeed) => {
      speed = Math.max(0.2, Math.min(2.5, Number(nextSpeed) || 1.0));
    },
    setIntensity: (nextIntensity) => {
      intensity = Math.max(0.2, Math.min(2.0, Number(nextIntensity) || 1.0));
    },
    setAudioEnabled: (enabled) => {
      soundEnabled = Boolean(enabled);
    },
    setMasterVolume: (percent) => {
      audio.setVolume(percent / 100);
    },
    pulse: (letterIndex = 3) => {
      triggerRipple(letterIndex, true);
    },
    resetCamera: () => {
      cameraTransitioning = true;
    },
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);
      controls?.dispose();
      disposables.forEach((d) => d.dispose?.());
      audio.dispose();
      renderer.dispose();
      if (domEl.parentElement === container) {
        container.removeChild(domEl);
      }
    },
  };
}
