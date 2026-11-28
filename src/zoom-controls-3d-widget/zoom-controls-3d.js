import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _vec2 = new THREE.Vector2();
const _targetScale = new THREE.Vector3();

export const ZOOM_CONTROLS_MOTION_MODES = ['float', 'pulse', 'orbit', 'tilt'];

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

function createBrushedMetalTexture(baseHex, highlightHex, shadowHex, maxAniso) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0.0, highlightHex);
  grad.addColorStop(0.45, baseHex);
  grad.addColorStop(0.8, shadowHex);
  grad.addColorStop(1.0, highlightHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Fine brushed grain streaks
  for (let i = 0; i < 640; i++) {
    const y = (i / 640) * 512;
    const alpha = 0.025 + ((i * 37) % 10) * 0.004;
    ctx.strokeStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(25,28,34,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + ((i % 7) - 3) * 0.8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createStudioGridTexture(maxAniso) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#dde1e8';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = 'rgba(130, 140, 158, 0.22)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let i = 0; i <= 1024; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Soft radial fade at outer edges so floor blends seamlessly into fog
  const vignette = ctx.createRadialGradient(512, 512, 180, 512, 512, 512);
  vignette.addColorStop(0, 'rgba(221, 225, 232, 0)');
  vignette.addColorStop(1, 'rgba(221, 225, 232, 1)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1024, 1024);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
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
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0, 'rgba(26, 32, 44, 0.34)');
  grad.addColorStop(0.5, 'rgba(26, 32, 44, 0.14)');
  grad.addColorStop(1, 'rgba(26, 32, 44, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLensSheenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(20, 20, 230, 230);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.36)');
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.10)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.06)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.22)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildRingGeometry(outerR, innerR) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 6,
    curveSegments: 64,
  });
  geo.center();
  return geo;
}

function buildHandleCapsuleGeometry() {
  const points = [];
  const radius = 0.165;
  const bodyLen = 0.72;
  const steps = 12;

  // Bottom spherical end cap
  for (let i = 0; i <= steps; i++) {
    const angle = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(angle) * radius, -bodyLen * 0.5 + Math.sin(angle) * radius));
  }
  // Cylindrical body up to top collar shoulder
  points.push(new THREE.Vector2(radius, bodyLen * 0.5));
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(angle) * radius, bodyLen * 0.5 + Math.sin(angle) * radius * 0.7));
  }

  const geo = new THREE.LatheGeometry(points, 36);
  geo.computeVertexNormals();
  return geo;
}

function buildLeftParenGeometry() {
  const shape = new THREE.Shape();
  const outerR = 0.44;
  const innerR = 0.36;
  const startA = Math.PI * 0.76;
  const endA = Math.PI * 1.24;
  const segs = 24;

  for (let i = 0; i <= segs; i++) {
    const a = startA + (i / segs) * (endA - startA);
    const x = Math.cos(a) * outerR;
    const y = Math.sin(a) * outerR * 1.08;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const a = startA + (i / segs) * (endA - startA);
    const x = Math.cos(a) * innerR;
    const y = Math.sin(a) * innerR * 1.08;
    shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.center();
  return geo;
}

function buildSerifIStemGeometry() {
  const shape = new THREE.Shape();
  // Classic serif lowercase 'i' stem with top-left flag & bottom foot serif
  shape.moveTo(-0.105, -0.22);
  shape.lineTo(0.105, -0.22);
  shape.lineTo(0.105, -0.16);
  shape.lineTo(0.055, -0.155);
  shape.lineTo(0.055, 0.14);
  shape.lineTo(-0.085, 0.14);
  shape.lineTo(-0.085, 0.085);
  shape.lineTo(-0.055, 0.08);
  shape.lineTo(-0.055, -0.155);
  shape.lineTo(-0.105, -0.16);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

function buildPlusGeometry() {
  const s = new THREE.Shape();
  const arm = 0.165;
  const t = 0.046;
  s.moveTo(-t, -arm);
  s.lineTo(t, -arm);
  s.lineTo(t, -t);
  s.lineTo(arm, -t);
  s.lineTo(arm, t);
  s.lineTo(t, t);
  s.lineTo(t, arm);
  s.lineTo(-t, arm);
  s.lineTo(-t, t);
  s.lineTo(-arm, t);
  s.lineTo(-arm, -t);
  s.lineTo(-t, -t);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

function buildMinusGeometry() {
  const s = new THREE.Shape();
  const arm = 0.165;
  const t = 0.044;
  s.moveTo(-arm, -t);
  s.lineTo(arm, -t);
  s.lineTo(arm, t);
  s.lineTo(-arm, t);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

function playZoomTone(audioState, direction) {
  if (!audioState.enabled || typeof window === 'undefined' || audioState.volume <= 0.001) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioState.ctx) audioState.ctx = new AudioCtx();
    if (audioState.ctx.state === 'suspended') audioState.ctx.resume();

    const freqs = direction === 'in' ? [523.25, 698.46, 880.0] : [698.46, 523.25, 392.0];
    freqs.forEach((freq, i) => {
      const now = audioState.ctx.currentTime + i * 0.042;
      const osc = audioState.ctx.createOscillator();
      const gain = audioState.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.095 * audioState.volume, now + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      osc.connect(gain);
      gain.connect(audioState.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    });
  } catch {
    // Ignore audio context restriction errors
  }
}

/**
 * Create and mount the living 3D Clickable Zoom In (i+ and Zoom Out (i- widget.
 */
export function createZoomControls3DWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createZoomControls3DWidget requires a valid DOM container element.');
  }

  const options = {
    initialZoom: 100,
    minZoom: 50,
    maxZoom: 200,
    step: 15,
    motionMode: 'float', // 'float' | 'pulse' | 'orbit' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    background: '#dde1e8', // Pass 'transparent' to overlay on any app or game
    showStudioFloor: true,
    enableOrbit: true,
    enableSoundFeedback: true,
    masterVolume: 75,
    onZoomIn: null,
    onZoomOut: null,
    onChange: null,
    onHoverButton: null,
    onContextLost: null,
    ...userOptions,
  };

  let zoomLevel = Math.max(
    options.minZoom,
    Math.min(options.maxZoom, Math.round(Number(options.initialZoom) || 100)),
  );
  let motionMode = ZOOM_CONTROLS_MOTION_MODES.includes(options.motionMode)
    ? options.motionMode
    : 'float';
  let speed = Math.max(0.2, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.2, Math.min(2.2, Number(options.intensity) || 1.0));

  const audioState = {
    ctx: null,
    enabled: Boolean(options.enableSoundFeedback),
    volume: Math.max(0, Math.min(1, Number(options.masterVolume) / 100)),
  };

  const isSoftwareGl = detectSoftwareWebGL();
  const isTransparent = options.background === 'transparent';

  const scene = new THREE.Scene();
  if (!isTransparent) {
    const bgColor = new THREE.Color(options.background);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor, 0.032);
  }

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 420;
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);
  const DEFAULT_CAM_POS = new THREE.Vector3(0.0, 0.45, 7.6);
  const DEFAULT_TARGET = new THREE.Vector3(0.0, -0.1, 0);
  camera.position.copy(DEFAULT_CAM_POS);

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
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // Studio 3-point lighting matching the warm/cool light studio aesthetic
  const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x94a3b8, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.45);
  keyLight.position.set(3.2, 5.5, 4.8);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -4.2;
    keyLight.shadow.camera.right = 4.2;
    keyLight.shadow.camera.top = 3.2;
    keyLight.shadow.camera.bottom = -3.2;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.72);
  fillLight.position.set(-4.5, 2.5, 3.0);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
  rimLight.position.set(0.2, 3.0, -4.5);
  scene.add(rimLight);

  const disposables = [];
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Studio grid floor + soft contact shadows
  let leftShadowMesh = null;
  let rightShadowMesh = null;

  if (options.showStudioFloor && !isTransparent) {
    const gridTex = createStudioGridTexture(maxAniso);
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.88,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.65;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);
    disposables.push(gridTex, floorGeo, floorMat);

    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(2.3, 1.35);
    const shadowMatLeft = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMatRight = shadowMatLeft.clone();

    leftShadowMesh = new THREE.Mesh(shadowGeo, shadowMatLeft);
    leftShadowMesh.rotation.x = -Math.PI / 2;
    leftShadowMesh.position.set(-1.38, -1.625, 0.15);
    scene.add(leftShadowMesh);

    rightShadowMesh = new THREE.Mesh(shadowGeo, shadowMatRight);
    rightShadowMesh.rotation.x = -Math.PI / 2;
    rightShadowMesh.position.set(1.78, -1.625, 0.15);
    scene.add(rightShadowMesh);

    disposables.push(shadowTex, shadowGeo, shadowMatLeft, shadowMatRight);
  }

  // Shared procedural metallic & optical glass materials
  const goldTex = createBrushedMetalTexture('#d4bd89', '#f2e4bd', '#a68c54', maxAniso);
  const platinumTex = createBrushedMetalTexture('#d6d0c4', '#f1eee7', '#9c9588', maxAniso);
  const silverTex = createBrushedMetalTexture('#d5dae2', '#f8fafc', '#8e96a3', maxAniso);
  const lensSheenTex = createLensSheenTexture();
  disposables.push(goldTex, platinumTex, silverTex, lensSheenTex);

  const goldBezelMat = new THREE.MeshPhysicalMaterial({
    map: goldTex,
    color: 0xffffff,
    metalness: 0.92,
    roughness: 0.19,
    anisotropy: 0.8,
    clearcoat: 0.45,
    clearcoatRoughness: 0.14,
  });

  const platinumBezelMat = new THREE.MeshPhysicalMaterial({
    map: platinumTex,
    color: 0xffffff,
    metalness: 0.91,
    roughness: 0.19,
    anisotropy: 0.8,
    clearcoat: 0.45,
    clearcoatRoughness: 0.14,
  });

  const silverMat = new THREE.MeshPhysicalMaterial({
    map: silverTex,
    color: 0xffffff,
    metalness: 0.93,
    roughness: 0.16,
    anisotropy: 0.85,
    clearcoat: 0.55,
    clearcoatRoughness: 0.1,
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x7c8492,
    metalness: 0.88,
    roughness: 0.24,
  });

  const lensMatLeft = new THREE.MeshPhysicalMaterial({
    color: 0xf8fbff,
    metalness: 0.02,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.28 : 1.0,
    ior: 1.52,
    thickness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false,
  });
  const lensMatRight = lensMatLeft.clone();

  const sheenMat = new THREE.MeshBasicMaterial({
    map: lensSheenTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });

  disposables.push(
    goldBezelMat,
    platinumBezelMat,
    silverMat,
    collarMat,
    lensMatLeft,
    lensMatRight,
    sheenMat,
  );

  // Shared Geometries
  const ringGeo = buildRingGeometry(0.95, 0.74);
  const innerTrimGeo = new THREE.TorusGeometry(0.75, 0.024, 16, 64);
  const lensGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.045, 48);
  lensGeo.rotateX(Math.PI / 2);
  const sheenGeo = new THREE.CircleGeometry(0.72, 48);
  const handleGeo = buildHandleCapsuleGeometry();
  const collarGeo = new THREE.CylinderGeometry(0.115, 0.13, 0.14, 24);
  const parenGeo = buildLeftParenGeometry();
  const iStemGeo = buildSerifIStemGeometry();
  const iDotGeo = new THREE.SphereGeometry(0.068, 24, 24);
  const plusGeo = buildPlusGeometry();
  const minusGeo = buildMinusGeometry();
  const hitProxyGeo = new THREE.CircleGeometry(1.18, 24);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  disposables.push(
    ringGeo,
    innerTrimGeo,
    lensGeo,
    sheenGeo,
    handleGeo,
    collarGeo,
    parenGeo,
    iStemGeo,
    iDotGeo,
    plusGeo,
    minusGeo,
    hitProxyGeo,
    hitMat,
  );

  function buildMagnifierButton({ id, bezelMat, lensMat, symbolType }) {
    const root = new THREE.Group();
    const headPivot = new THREE.Group();
    root.add(headPivot);

    // 1. Metallic circular beveled ring
    const bezelMesh = new THREE.Mesh(ringGeo, bezelMat);
    bezelMesh.castShadow = !isSoftwareGl;
    bezelMesh.receiveShadow = !isSoftwareGl;
    headPivot.add(bezelMesh);

    // 2. Inner bright silver trim ring
    const trimMesh = new THREE.Mesh(innerTrimGeo, silverMat);
    trimMesh.position.z = 0.02;
    headPivot.add(trimMesh);

    // 3. Crystal optical glass lens
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.renderOrder = 4;
    headPivot.add(lensMesh);

    // 4. Specular reflection sheen disc
    const sheenMesh = new THREE.Mesh(sheenGeo, sheenMat);
    sheenMesh.position.z = 0.032;
    sheenMesh.renderOrder = 5;
    headPivot.add(sheenMesh);

    // 5. Angled brushed silver handle assembly (-45 deg bottom-right)
    const handlePivot = new THREE.Group();
    handlePivot.rotation.z = Math.PI * 0.24;
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, -1.01, 0);
    collarMesh.castShadow = !isSoftwareGl;
    handlePivot.add(collarMesh);

    const handleMesh = new THREE.Mesh(handleGeo, silverMat);
    handleMesh.position.set(0, -1.46, 0);
    handleMesh.castShadow = !isSoftwareGl;
    handlePivot.add(handleMesh);
    headPivot.add(handlePivot);

    // 6. Floating 3D metallic emblem inside lens: "(i+" or "(i-"
    const emblemGroup = new THREE.Group();
    emblemGroup.position.set(0, 0, 0.025);
    headPivot.add(emblemGroup);

    const parenMesh = new THREE.Mesh(parenGeo, silverMat);
    parenMesh.position.set(-0.26, -0.02, 0);
    parenMesh.castShadow = !isSoftwareGl;
    emblemGroup.add(parenMesh);

    const iStemMesh = new THREE.Mesh(iStemGeo, silverMat);
    iStemMesh.position.set(-0.02, -0.055, 0);
    iStemMesh.castShadow = !isSoftwareGl;
    emblemGroup.add(iStemMesh);

    const iDotMesh = new THREE.Mesh(iDotGeo, silverMat);
    iDotMesh.position.set(-0.02, 0.24, 0.01);
    iDotMesh.castShadow = !isSoftwareGl;
    emblemGroup.add(iDotMesh);

    const signMesh = new THREE.Mesh(symbolType === 'plus' ? plusGeo : minusGeo, silverMat);
    signMesh.position.set(0.32, -0.01, 0);
    signMesh.castShadow = !isSoftwareGl;
    emblemGroup.add(signMesh);

    // 7. Simplified invisible raycast hit disc (Layer 1)
    const hitDisc = new THREE.Mesh(hitProxyGeo, hitMat);
    hitDisc.position.set(0.08, -0.1, 0.14);
    hitDisc.layers.set(1);
    hitDisc.userData = { buttonId: id };
    headPivot.add(hitDisc);

    return {
      id,
      root,
      headPivot,
      emblemGroup,
      signMesh,
      hitDisc,
      bezelMesh,
    };
  }

  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0.22, 0);
  scene.add(stageGroup);

  const zoomInBtn = buildMagnifierButton({
    id: 'zoom-in',
    bezelMat: goldBezelMat,
    lensMat: lensMatLeft,
    symbolType: 'plus',
  });
  zoomInBtn.root.position.set(-1.58, 0.04, 0.0);
  zoomInBtn.root.rotation.set(-0.04, 0.24, 0.0);
  stageGroup.add(zoomInBtn.root);

  const zoomOutBtn = buildMagnifierButton({
    id: 'zoom-out',
    bezelMat: platinumBezelMat,
    lensMat: lensMatRight,
    symbolType: 'minus',
  });
  zoomOutBtn.root.position.set(1.58, 0.04, 0.0);
  zoomOutBtn.root.rotation.set(-0.04, 0.2, 0.0);
  stageGroup.add(zoomOutBtn.root);

  const hitTargets = [zoomInBtn.hitDisc, zoomOutBtn.hitDisc];

  let controls = null;
  if (options.enableOrbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 12.0;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.update();
  }

  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);

  let hoveredButton = null;
  let lastMoveTs = 0;
  let pointerNormX = 0;
  let pointerNormY = 0;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let cameraTransitioning = false;

  // Per-button spring & click impulse state
  let hoverIn = 0;
  let hoverOut = 0;
  let pressIn = 0;
  let pressOut = 0;

  if (controls) {
    controls.addEventListener('start', () => {
      cameraTransitioning = false;
    });
  }

  function pickButton(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    const hits = raycaster.intersectObjects(hitTargets, false);
    return hits.length > 0 ? hits[0].object.userData.buttonId : null;
  }

  function triggerZoom(direction) {
    const isIn = direction === 'in';
    if (isIn) {
      zoomLevel = Math.min(options.maxZoom, zoomLevel + options.step);
      pressIn = 1.0;
    } else {
      zoomLevel = Math.max(options.minZoom, zoomLevel - options.step);
      pressOut = 1.0;
    }

    playZoomTone(audioState, direction);

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

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNormX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerNormY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const now = performance.now();
    if (now - lastMoveTs < 45) return;
    lastMoveTs = now;

    const picked = pickButton(e.clientX, e.clientY);
    if (picked !== hoveredButton) {
      hoveredButton = picked;
      renderer.domElement.style.cursor = picked ? 'pointer' : options.enableOrbit ? 'grab' : 'default';
      options.onHoverButton?.(picked);
    }
  }

  function onPointerLeave() {
    pointerNormX = 0;
    pointerNormY = 0;
    if (hoveredButton !== null) {
      hoveredButton = null;
      renderer.domElement.style.cursor = options.enableOrbit ? 'grab' : 'default';
      options.onHoverButton?.(null);
    }
  }

  function onPointerDown(e) {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    if (cameraTransitioning) cameraTransitioning = false;
  }

  function onPointerUp(e) {
    if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 7) return;
    const picked = pickButton(e.clientX, e.clientY);
    if (picked === 'zoom-in') {
      triggerZoom('in');
    } else if (picked === 'zoom-out') {
      triggerZoom('out');
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
  domEl.style.cursor = options.enableOrbit ? 'grab' : 'default';
  domEl.addEventListener('pointermove', onPointerMove);
  domEl.addEventListener('pointerleave', onPointerLeave);
  domEl.addEventListener('pointerdown', onPointerDown);
  domEl.addEventListener('pointerup', onPointerUp);
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
  let phase = 0;
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
    phase += dt * speed;

    hoverIn = THREE.MathUtils.damp(hoverIn, hoveredButton === 'zoom-in' ? 1 : 0, 12, dt);
    hoverOut = THREE.MathUtils.damp(hoverOut, hoveredButton === 'zoom-out' ? 1 : 0, 12, dt);
    pressIn = THREE.MathUtils.damp(pressIn, 0, 8, dt);
    pressOut = THREE.MathUtils.damp(pressOut, 0, 8, dt);

    const amp = intensity;
    let leftY = Math.sin(phase * 1.55) * 0.085 * amp;
    let rightY = Math.sin(phase * 1.55 + 1.1) * 0.085 * amp;
    let leftRotX = Math.sin(phase * 1.1) * 0.045 * amp;
    let leftRotY = 0.24 + Math.cos(phase * 0.9) * 0.065 * amp;
    let rightRotX = Math.sin(phase * 1.1 + 0.9) * 0.045 * amp;
    let rightRotY = 0.2 + Math.cos(phase * 0.9 + 0.9) * 0.065 * amp;
    let leftScale = 1 + hoverIn * 0.065 + pressIn * 0.12;
    let rightScale = 1 + hoverOut * 0.065 - pressOut * 0.09;

    if (motionMode === 'pulse') {
      const beatLeft = Math.pow(Math.max(0, Math.sin(phase * 2.5)), 4);
      const beatRight = Math.pow(Math.max(0, Math.sin(phase * 2.5 + 0.7)), 4);
      leftY = Math.sin(phase * 1.8) * 0.05 * amp + beatLeft * 0.06 * amp;
      rightY = Math.sin(phase * 1.8 + 0.9) * 0.05 * amp + beatRight * 0.06 * amp;
      leftScale += beatLeft * 0.065 * amp;
      rightScale += beatRight * 0.065 * amp;
    } else if (motionMode === 'orbit') {
      leftY = Math.sin(phase * 1.45) * 0.1 * amp;
      rightY = Math.cos(phase * 1.45) * 0.1 * amp;
      leftRotY = 0.24 + Math.sin(phase * 1.15) * 0.22 * amp;
      rightRotY = 0.2 + Math.sin(phase * 1.15 + 0.5) * 0.22 * amp;
      leftRotX = Math.cos(phase * 1.2) * 0.09 * amp;
      rightRotX = Math.cos(phase * 1.2 + 0.5) * 0.09 * amp;
    } else if (motionMode === 'tilt') {
      leftY = Math.sin(phase * 1.2) * 0.035 * amp;
      rightY = Math.sin(phase * 1.2 + 0.8) * 0.035 * amp;
      leftRotY = 0.24 + pointerNormX * 0.26 * amp;
      leftRotX = -0.04 - pointerNormY * 0.18 * amp;
      rightRotY = 0.2 + pointerNormX * 0.26 * amp;
      rightRotX = -0.04 - pointerNormY * 0.18 * amp;
    }

    // Apply living transforms + subtle hover/click Z-depth
    zoomInBtn.root.position.y = 0.04 + leftY + hoverIn * 0.06;
    zoomInBtn.root.position.z = hoverIn * 0.18 + pressIn * 0.34;
    zoomInBtn.root.rotation.set(leftRotX - hoverIn * 0.04, leftRotY, Math.sin(phase * 0.8) * 0.025 * amp);
    _targetScale.setScalar(leftScale);
    zoomInBtn.headPivot.scale.lerp(_targetScale, 1 - Math.exp(-15 * dt));

    zoomOutBtn.root.position.y = 0.04 + rightY + hoverOut * 0.06;
    zoomOutBtn.root.position.z = hoverOut * 0.18 - pressOut * 0.24;
    zoomOutBtn.root.rotation.set(
      rightRotX - hoverOut * 0.04,
      rightRotY,
      Math.sin(phase * 0.8 + 1.0) * 0.025 * amp,
    );
    _targetScale.setScalar(rightScale);
    zoomOutBtn.headPivot.scale.lerp(_targetScale, 1 - Math.exp(-15 * dt));

    // Inner (i+ and (i- emblems float independently inside the crystal lenses
    zoomInBtn.emblemGroup.position.z = 0.03 + Math.sin(phase * 2.1) * 0.025 * amp + pressIn * 0.09;
    zoomInBtn.signMesh.rotation.z = pressIn * 0.35 + Math.sin(phase * 1.7) * 0.04 * amp;

    zoomOutBtn.emblemGroup.position.z = 0.03 + Math.cos(phase * 2.1) * 0.025 * amp - pressOut * 0.06;
    zoomOutBtn.signMesh.scale.setScalar(1 + pressOut * 0.16);

    // Subtle grounded contact shadows respond to height
    if (leftShadowMesh && rightShadowMesh) {
      const sLeft = 1 - leftY * 0.8;
      const sRight = 1 - rightY * 0.8;
      leftShadowMesh.scale.set(sLeft, sLeft, 1);
      rightShadowMesh.scale.set(sRight, sRight, 1);
      leftShadowMesh.material.opacity = THREE.MathUtils.clamp(0.75 - leftY * 1.2, 0.35, 0.9);
      rightShadowMesh.material.opacity = THREE.MathUtils.clamp(0.75 - rightY * 1.2, 0.35, 0.9);
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
    setMotionMode: (nextMode) => {
      if (ZOOM_CONTROLS_MOTION_MODES.includes(nextMode)) {
        motionMode = nextMode;
      }
    },
    setSpeed: (nextSpeed) => {
      speed = Math.max(0.2, Math.min(2.5, Number(nextSpeed) || 1.0));
    },
    setIntensity: (nextIntensity) => {
      intensity = Math.max(0.2, Math.min(2.2, Number(nextIntensity) || 1.0));
    },
    setAudioEnabled: (enabled) => {
      audioState.enabled = Boolean(enabled);
    },
    setMasterVolume: (percent) => {
      audioState.volume = Math.max(0, Math.min(1, Number(percent) / 100));
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
      if (audioState.ctx) audioState.ctx.close().catch(() => {});
      renderer.dispose();
      if (domEl.parentElement === container) {
        container.removeChild(domEl);
      }
    },
  };
}
