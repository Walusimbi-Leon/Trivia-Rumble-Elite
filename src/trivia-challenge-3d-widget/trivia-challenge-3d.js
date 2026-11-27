import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _vec2 = new THREE.Vector2();
const _targetScale = new THREE.Vector3();

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

function createRoundedRectRingShape(outerW, outerH, innerW, innerH, outerR, innerR) {
  const outer = createRoundedRectShape(outerW, outerH, outerR);
  const hw = innerW / 2;
  const hh = innerH / 2;
  const r = Math.min(innerR, hw * 0.48, hh * 0.48);
  const hole = new THREE.Path();
  hole.moveTo(-hw + r, -hh);
  hole.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  hole.lineTo(-hw, hh - r);
  hole.quadraticCurveTo(-hw, hh, -hw + r, hh);
  hole.lineTo(hw - r, hh);
  hole.quadraticCurveTo(hw, hh, hw, hh - r);
  hole.lineTo(hw, -hh + r);
  hole.quadraticCurveTo(hw, -hh, hw - r, -hh);
  hole.lineTo(-hw + r, -hh);
  outer.holes.push(hole);
  return outer;
}

function createHexBadgeShape(width, height, chamfer) {
  const hw = width / 2;
  const hh = height / 2;
  const c = Math.min(chamfer, hw * 0.38, hh * 0.65);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, hh);
  shape.lineTo(hw - c, hh);
  shape.lineTo(hw, 0);
  shape.lineTo(hw - c * 1.15, -hh);
  shape.lineTo(-hw + c * 1.15, -hh);
  shape.lineTo(-hw, 0);
  shape.closePath();
  return shape;
}

function createFloorShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.56)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSgssCrestTexture() {
  const w = 512;
  const h = 144;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2a3342');
  bg.addColorStop(0.45, '#19212c');
  bg.addColorStop(1, '#0e141d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle metallic bevel border
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.lineTo(w - 28, 12);
  ctx.lineTo(w - 10, h / 2);
  ctx.lineTo(w - 32, h - 12);
  ctx.lineTo(32, h - 12);
  ctx.lineTo(10, h / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 72px "Outfit", "Inter", system-ui, sans-serif';
  const textGrad = ctx.createLinearGradient(w * 0.25, 24, w * 0.75, h - 24);
  textGrad.addColorStop(0, '#f8fafc');
  textGrad.addColorStop(0.5, '#bae6fd');
  textGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = textGrad;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
  ctx.shadowBlur = 14;
  ctx.fillText('SGSS', w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChamferedBox(ctx, x, y, w, h, cut = 12) {
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        if (lines.length === maxLines - 1) {
          let rest = words.slice(i).join(' ');
          while (ctx.measureText(rest).width > maxWidth && rest.length > 4) {
            rest = `${rest.slice(0, -4)}...`;
          }
          lines.push(rest);
          return lines;
        }
        current = word;
      } else {
        let clipped = word;
        while (ctx.measureText(clipped).width > maxWidth && clipped.length > 4) {
          clipped = `${clipped.slice(0, -4)}...`;
        }
        lines.push(clipped);
        current = '';
      }
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const OPTION_BOXES = [
  { x: 68, y: 204, w: 434, h: 112 },
  { x: 522, y: 204, w: 434, h: 112 },
  { x: 68, y: 334, w: 434, h: 112 },
  { x: 522, y: 334, w: 434, h: 112 },
];

function formatTimerText(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

function renderScreenCanvas(canvas, state, anim) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, w, h);

  // Deep cyber indigo radial backdrop
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 30, w * 0.5, h * 0.52, w * 0.68);
  bg.addColorStop(0, '#102954');
  bg.addColorStop(0.5, '#091836');
  bg.addColorStop(1, '#040b1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Perspective cyber floor grid at bottom
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1.2;
  const horizonY = 398;
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const y = horizonY + Math.pow(t, 1.65) * (h - horizonY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * 38, horizonY);
    ctx.lineTo(w / 2 + i * 110, h);
    ctx.stroke();
  }
  ctx.restore();

  // Animated vertical holographic scan sweep
  const sweepX = ((anim.phase * 0.22) % 1.4 - 0.2) * w;
  const sweepGrad = ctx.createLinearGradient(sweepX - 110, 0, sweepX + 110, 0);
  sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  sweepGrad.addColorStop(0.5, 'rgba(103, 232, 249, 0.08)');
  sweepGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
  ctx.fillStyle = sweepGrad;
  ctx.fillRect(0, 0, w, h);

  // Outer HUD neon frame + corner brackets
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2.5;
  drawChamferedBox(ctx, 22, 22, w - 44, h - 44, 22);
  ctx.stroke();

  // Left & Right side vertical energy bars
  const sidePulse = 0.55 + Math.sin(anim.phase * 3.1) * 0.25;
  ctx.strokeStyle = `rgba(103, 232, 249, ${sidePulse.toFixed(2)})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(32, 175);
  ctx.lineTo(32, 385);
  ctx.moveTo(w - 32, 175);
  ctx.lineTo(w - 32, 385);
  ctx.stroke();
  ctx.restore();

  // Question Text (reclaiming full upper display space with larger typography)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.8)';
  ctx.shadowBlur = 8;
  let qFontSize = 38;
  ctx.font = `700 ${qFontSize}px "Outfit", "DM Sans", "Inter", system-ui, sans-serif`;
  let qLines = wrapLines(ctx, state.question, w - 120, 3);
  if (qLines.length > 2) {
    qFontSize = 33;
    ctx.font = `700 ${qFontSize}px "Outfit", "DM Sans", "Inter", system-ui, sans-serif`;
    qLines = wrapLines(ctx, state.question, w - 120, 3);
  }
  const qLineHeight = qFontSize + 10;
  const qCenterY = 118;
  const qStartY = qCenterY - ((qLines.length - 1) * qLineHeight) / 2;
  qLines.forEach((line, idx) => {
    ctx.fillText(line, w / 2, qStartY + idx * qLineHeight);
  });
  ctx.restore();

  // 2x2 Interactive Option Buttons (A, B, C, D) with larger letters & text
  for (let i = 0; i < 4; i++) {
    const box = OPTION_BOXES[i];
    const letter = OPTION_LETTERS[i];
    const optText = state.options[i] || '';
    const isHovered = anim.hoveredOption === i;
    const isSelected = state.selectedOption === i;
    const hasCorrect = typeof state.correctIndex === 'number' && state.correctIndex >= 0;
    const isCorrectPick = isSelected && hasCorrect && i === state.correctIndex;
    const isWrongPick = isSelected && hasCorrect && i !== state.correctIndex;
    const isRevealedCorrect =
      state.selectedOption !== null && hasCorrect && i === state.correctIndex && !isCorrectPick;

    ctx.save();
    drawChamferedBox(ctx, box.x, box.y, box.w, box.h, 13);

    let fillTop = 'rgba(30, 58, 110, 0.42)';
    let fillBot = 'rgba(15, 32, 68, 0.65)';
    let strokeCol = 'rgba(103, 232, 249, 0.55)';
    let glowCol = 'rgba(56, 189, 248, 0.25)';

    if (isCorrectPick || isRevealedCorrect) {
      fillTop = 'rgba(16, 185, 129, 0.34)';
      fillBot = 'rgba(6, 78, 59, 0.66)';
      strokeCol = '#34d399';
      glowCol = 'rgba(16, 185, 129, 0.6)';
    } else if (isWrongPick) {
      fillTop = 'rgba(244, 63, 94, 0.34)';
      fillBot = 'rgba(136, 19, 55, 0.62)';
      strokeCol = '#fb7185';
      glowCol = 'rgba(244, 63, 94, 0.55)';
    } else if (isSelected) {
      fillTop = 'rgba(56, 189, 248, 0.38)';
      fillBot = 'rgba(30, 64, 175, 0.68)';
      strokeCol = '#7dd3fc';
      glowCol = 'rgba(56, 189, 248, 0.65)';
    } else if (isHovered) {
      fillTop = 'rgba(56, 189, 248, 0.24)';
      fillBot = 'rgba(30, 58, 138, 0.62)';
      strokeCol = '#67e8f9';
      glowCol = 'rgba(103, 232, 249, 0.5)';
    }

    const boxGrad = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    boxGrad.addColorStop(0, fillTop);
    boxGrad.addColorStop(1, fillBot);
    ctx.fillStyle = boxGrad;
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = isHovered || isSelected ? 16 : 8;
    ctx.fill();

    ctx.lineWidth = isHovered || isSelected ? 2.8 : 1.8;
    ctx.strokeStyle = strokeCol;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Option Letter & Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '800 28px "Outfit", "Inter", system-ui, sans-serif';
    ctx.fillStyle = isCorrectPick || isRevealedCorrect ? '#6ee7b7' : isWrongPick ? '#fda4af' : '#7dd3fc';
    ctx.fillText(`${letter}.`, box.x + 20, box.y + box.h / 2);

    ctx.fillStyle = '#f1f5f9';
    const textLeft = box.x + 58;
    const textMaxW = box.w - 76;
    let optFontSize = 25;
    ctx.font = `600 ${optFontSize}px "DM Sans", "Inter", system-ui, sans-serif`;
    let optLines = wrapLines(ctx, optText, textMaxW, 3);
    if (optLines.length > 2) {
      optFontSize = 21;
      ctx.font = `600 ${optFontSize}px "DM Sans", "Inter", system-ui, sans-serif`;
      optLines = wrapLines(ctx, optText, textMaxW, 3);
    }
    const optLineH = optFontSize + 6;
    const optStartY = box.y + box.h / 2 - ((optLines.length - 1) * optLineH) / 2;
    optLines.forEach((line, idx) => {
      ctx.fillText(line, textLeft, optStartY + idx * optLineH);
    });
    ctx.restore();
  }

  // Bottom Progress Bar
  const barW = 440;
  const barH = 14;
  const barX = 240;
  const barY = 492;
  const ratio = state.maxTimer > 0 ? Math.max(0, Math.min(1, state.timer / state.maxTimer)) : 0;

  ctx.save();
  drawRoundedRect(ctx, barX, barY, barW, barH, 7);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.55)';
  ctx.stroke();

  if (ratio > 0) {
    const fillW = Math.max(10, barW * ratio);
    drawRoundedRect(ctx, barX + 2, barY + 2, fillW - 4, barH - 4, 5);
    const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    barGrad.addColorStop(0, '#38bdf8');
    barGrad.addColorStop(0.6, '#a5f3fc');
    barGrad.addColorStop(1, '#e879f9');
    ctx.fillStyle = barGrad;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
    ctx.shadowBlur = 10;
    ctx.fill();
  }
  ctx.restore();

  // Bottom-Right Countdown Clock Dial + Time Readout (30 seconds countdown)
  const clockCx = 768;
  const clockCy = 496;
  const clockR = 24;
  ctx.save();
  ctx.beginPath();
  ctx.arc(clockCx, clockCy, clockR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.stroke();

  // Active countdown arc
  if (ratio > 0) {
    const arcStart = -Math.PI / 2;
    const arcEnd = arcStart + Math.PI * 2 * ratio;
    ctx.beginPath();
    ctx.arc(clockCx, clockCy, clockR, arcStart, arcEnd);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = state.timer <= 5 ? '#fb7185' : '#67e8f9';
    ctx.shadowColor = state.timer <= 5 ? 'rgba(251, 113, 133, 0.7)' : 'rgba(103, 232, 249, 0.75)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Animated clock hand
  const handAngle = -Math.PI / 2 + anim.phase * 1.4;
  ctx.beginPath();
  ctx.moveTo(clockCx, clockCy);
  ctx.lineTo(clockCx + Math.cos(handAngle) * 12, clockCy + Math.sin(handAngle) * 12);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#e0f2fe';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 28px "JetBrains Mono", "Outfit", monospace';
  ctx.fillStyle = state.timer <= 5 ? '#fda4af' : '#e0f2fe';
  ctx.fillText(formatTimerText(state.timer), clockCx + 36, clockCy - 7);
  ctx.font = '500 13px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('seconds', clockCx + 38, clockCy + 15);
  ctx.restore();
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

  function playNote(freq, delay, duration, type = 'triangle', gainAmt = 0.12) {
    const audio = ensureContext();
    if (!audio || masterVolume <= 0.001) return;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
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
    playSelect: (isCorrect) => {
      if (isCorrect === true) {
        playNote(523.25, 0, 0.22, 'triangle', 0.13);
        playNote(659.25, 0.06, 0.24, 'triangle', 0.13);
        playNote(783.99, 0.12, 0.34, 'sine', 0.14);
      } else if (isCorrect === false) {
        playNote(261.63, 0, 0.22, 'sawtooth', 0.07);
        playNote(207.65, 0.09, 0.3, 'triangle', 0.09);
      } else {
        playNote(440, 0, 0.18, 'triangle', 0.11);
        playNote(659.25, 0.05, 0.24, 'sine', 0.11);
      }
    },
    playPulse: () => {
      playNote(392.0, 0, 0.16, 'sine', 0.09);
      playNote(587.33, 0.05, 0.22, 'triangle', 0.09);
    },
    dispose: () => {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
    },
  };
}

/**
 * Living Interactive 3D SGSS Trivia Challenge Display Monitor.
 */
export function createTriviaChallenge3DWidget(container, userOptions = {}) {
  if (!container) {
    throw new Error('createTriviaChallenge3DWidget requires a valid DOM container element.');
  }

  const options = {
    question: 'Which company developed the first commercial graphical web browser, Mosaic, in 1993?',
    options: [
      'Netscape Communications',
      'Microsoft Corporation',
      'Spyglass, Inc.',
      'The National Center for Supercomputing Applications (NCSA)',
    ],
    correctIndex: 3,
    selectedOption: null,
    timerSeconds: 30,
    maxTimerSeconds: 30,
    timerRunning: true,
    motionMode: 'float', // 'float' | 'pulse' | 'orbit' | 'tilt'
    speed: 1.0,
    intensity: 1.0,
    background: '#0a0f1a',
    showStudioFloor: true,
    enableOrbit: true,
    enableSoundFeedback: true,
    locked: false,
    masterVolume: 70,
    onSelectOption: null,
    onClick: null,
    onContextLost: null,
    ...userOptions,
  };

  let motionMode = options.motionMode;
  let speed = Math.max(0.25, Math.min(2.5, Number(options.speed) || 1.0));
  let intensity = Math.max(0.25, Math.min(2.2, Number(options.intensity) || 1.0));
  let audioEnabled = Boolean(options.enableSoundFeedback);
  let timerRunning = Boolean(options.timerRunning);
  let locked = Boolean(options.locked);

  let state = {
    question: options.question,
    options: Array.isArray(options.options) ? [...options.options] : ['', '', '', ''],
    correctIndex: options.correctIndex,
    selectedOption: options.selectedOption,
    timer: Number.isFinite(Number(options.timerSeconds)) ? Number(options.timerSeconds) : 30,
    maxTimer: Number(options.maxTimerSeconds) || 30,
  };

  const sound = createSoundEffects((options.masterVolume ?? 70) / 100);
  const disposables = [];
  const isSoftwareGl = detectSoftwareWebGL();

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 420;

  const scene = new THREE.Scene();
  if (options.background && options.background !== 'transparent') {
    scene.background = new THREE.Color(options.background);
  }

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);
  const DEFAULT_CAM_POS = new THREE.Vector3(-1.35, 0.65, 6.25);
  const DEFAULT_TARGET = new THREE.Vector3(0, 0.05, 0);
  camera.position.copy(DEFAULT_CAM_POS);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: options.background === 'transparent',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1.25 : 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  disposables.push(pmrem, envTex);

  // Studio Lighting
  scene.add(new THREE.AmbientLight(0xdbeafe, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(3.2, 4.5, 4.8);
  scene.add(keyLight);

  const rimCyan = new THREE.PointLight(0x38bdf8, 4.5, 14);
  rimCyan.position.set(-3.2, 1.4, 2.2);
  scene.add(rimCyan);

  const rimViolet = new THREE.PointLight(0xc084fc, 3.6, 14);
  rimViolet.position.set(3.4, 1.2, 2.0);
  scene.add(rimViolet);

  // Optional Studio Desk Surface
  let shadowMesh = null;
  if (options.showStudioFloor) {
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.42,
      metalness: 0.35,
    });
    const deskGeo = new THREE.PlaneGeometry(18, 12);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -1.46;
    scene.add(desk);

    const shadowTex = createFloorShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowGeo = new THREE.PlaneGeometry(4.4, 2.6);
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.455, 0.08);
    scene.add(shadowMesh);

    disposables.push(deskMat, deskGeo, shadowTex, shadowMat, shadowGeo);
  }

  // Root Assembly
  const monitorRoot = new THREE.Group();
  scene.add(monitorRoot);

  // Stand Base + Neck
  const standGroup = new THREE.Group();
  monitorRoot.add(standGroup);

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    roughness: 0.36,
    metalness: 0.82,
  });
  const silverRimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.92,
  });
  const glowAccentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.6,
  });
  disposables.push(darkMetalMat, silverRimMat, glowAccentMat);

  const baseShape = createRoundedRectShape(1.92, 1.04, 0.08);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  baseGeo.center();
  const baseMesh = new THREE.Mesh(baseGeo, darkMetalMat);
  baseMesh.rotation.x = -Math.PI / 2;
  baseMesh.position.set(0, -1.39, 0.08);
  standGroup.add(baseMesh);

  const neckGeo = new THREE.BoxGeometry(0.46, 0.95, 0.14);
  const neckMesh = new THREE.Mesh(neckGeo, darkMetalMat);
  neckMesh.position.set(0, -0.94, -0.14);
  neckMesh.rotation.x = -0.12;
  standGroup.add(neckMesh);
  disposables.push(baseGeo, neckGeo);

  // Articulated Monitor Head (floats & tilts smoothly!)
  const monitorHead = new THREE.Group();
  monitorHead.position.set(0, 0.12, 0);
  monitorRoot.add(monitorHead);

  const MON_W = 4.32;
  const MON_H = 2.52;
  const SCR_W = 4.02;
  const SCR_H = 2.24;

  // Outer Metallic Chrome Frame Ring
  const outerBezelShape = createRoundedRectRingShape(
    MON_W + 0.06,
    MON_H + 0.06,
    SCR_W + 0.05,
    SCR_H + 0.05,
    0.13,
    0.06,
  );
  const outerBezelGeo = new THREE.ExtrudeGeometry(outerBezelShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  outerBezelGeo.center();
  const outerBezelMesh = new THREE.Mesh(outerBezelGeo, silverRimMat);
  monitorHead.add(outerBezelMesh);

  // Inner Dark Gunmetal Bezel
  const innerBezelShape = createRoundedRectRingShape(
    MON_W - 0.03,
    MON_H - 0.03,
    SCR_W,
    SCR_H,
    0.1,
    0.04,
  );
  const innerBezelGeo = new THREE.ExtrudeGeometry(innerBezelShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  innerBezelGeo.center();
  const innerBezelMesh = new THREE.Mesh(innerBezelGeo, darkMetalMat);
  innerBezelMesh.position.z = 0.01;
  monitorHead.add(innerBezelMesh);

  // Back Panel Housing
  const backShape = createRoundedRectShape(MON_W - 0.08, MON_H - 0.08, 0.1);
  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  backGeo.center();
  const backMesh = new THREE.Mesh(backGeo, darkMetalMat);
  backMesh.position.z = -0.09;
  monitorHead.add(backMesh);

  // Subtle rear cyan light bar
  const rearStripGeo = new THREE.BoxGeometry(2.1, 0.04, 0.03);
  const rearStrip = new THREE.Mesh(rearStripGeo, glowAccentMat);
  rearStrip.position.set(0, 0.52, -0.155);
  monitorHead.add(rearStrip);

  disposables.push(outerBezelGeo, innerBezelGeo, backGeo, rearStripGeo);

  // Top Center Hexagonal SGSS Emblem Crest
  const crestGroup = new THREE.Group();
  crestGroup.position.set(0, MON_H / 2 + 0.02, 0.08);
  monitorHead.add(crestGroup);

  const crestShape = createHexBadgeShape(0.86, 0.25, 0.11);
  const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  crestGeo.center();
  const crestBody = new THREE.Mesh(crestGeo, silverRimMat);
  crestGroup.add(crestBody);

  const sgssTex = createSgssCrestTexture();
  const crestFaceMat = new THREE.MeshStandardMaterial({
    map: sgssTex,
    emissive: 0x38bdf8,
    emissiveMap: sgssTex,
    emissiveIntensity: 0.45,
    roughness: 0.28,
    metalness: 0.5,
  });
  const crestFaceGeo = new THREE.PlaneGeometry(0.76, 0.21);
  const crestFaceMesh = new THREE.Mesh(crestFaceGeo, crestFaceMat);
  crestFaceMesh.position.z = 0.052;
  crestGroup.add(crestFaceMesh);
  disposables.push(crestGeo, sgssTex, crestFaceMat, crestFaceGeo);

  // Live Holographic Screen Plane (1024 x 576 CanvasTexture)
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 576;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.92,
    roughness: 0.16,
    metalness: 0.08,
  });
  const screenGeo = new THREE.PlaneGeometry(SCR_W, SCR_H);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = 0.075;
  monitorHead.add(screenMesh);
  disposables.push(screenTex, screenMat, screenGeo);

  // Floating Cyber Particles flanking the screen
  const particles = [];
  const moteGeo = new THREE.OctahedronGeometry(0.038, 0);
  const moteMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.6,
  });
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    const side = i % 2 === 0 ? -1 : 1;
    m.userData = {
      baseX: side * (2.42 + (i % 3) * 0.14),
      baseY: -0.75 + Math.floor(i / 2) * 0.55,
      baseZ: 0.18 + (i % 2) * 0.15,
      phaseOffset: i * 0.85,
    };
    monitorHead.add(m);
    particles.push(m);
  }
  disposables.push(moteGeo, moteMat);

  // OrbitControls
  let controls = null;
  if (options.enableOrbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.0;
    controls.maxDistance = 12.0;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.update();
  }

  // Interaction & Raycasting onto A/B/C/D options directly on the 3D monitor screen
  const raycaster = new THREE.Raycaster();
  let pointerDownX = 0;
  let pointerDownY = 0;
  let pointerTiltX = 0;
  let pointerTiltY = 0;
  let hoveredOption = null;
  let clickBurst = 0;
  let cameraTransitioning = false;

  function detectHoveredOption(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    const hits = raycaster.intersectObject(screenMesh, false);
    if (hits.length > 0 && hits[0].uv) {
      const cx = hits[0].uv.x * screenCanvas.width;
      const cy = (1 - hits[0].uv.y) * screenCanvas.height;
      for (let i = 0; i < OPTION_BOXES.length; i++) {
        const b = OPTION_BOXES[i];
        if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
          return i;
        }
      }
    }
    return null;
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTiltX = nx * 0.22;
    pointerTiltY = ny * 0.14;

    const opt = locked ? null : detectHoveredOption(e.clientX, e.clientY);
    hoveredOption = opt;
    renderer.domElement.style.cursor = opt !== null ? 'pointer' : options.enableOrbit ? 'grab' : 'default';
  }

  function onPointerLeave() {
    pointerTiltX = 0;
    pointerTiltY = 0;
    hoveredOption = null;
    renderer.domElement.style.cursor = 'default';
  }

  function onPointerDown(e) {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    if (cameraTransitioning) cameraTransitioning = false;
  }

  function selectOptionAtIndex(idx) {
    if (locked || idx < 0 || idx > 3) return;
    state.selectedOption = idx;
    clickBurst = 1.0;

    const hasCorrect = typeof state.correctIndex === 'number' && state.correctIndex >= 0;
    const isCorrect = hasCorrect ? idx === state.correctIndex : null;

    if (audioEnabled) {
      sound.playSelect(isCorrect);
    }

    const payload = {
      index: idx,
      letter: OPTION_LETTERS[idx],
      text: state.options[idx] || '',
      isCorrect,
    };
    options.onSelectOption?.(payload);
    options.onClick?.(payload);
  }

  function onPointerUp(e) {
    if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;

    const opt = locked ? null : detectHoveredOption(e.clientX, e.clientY);
    if (opt !== null) {
      selectOptionAtIndex(opt);
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    _vec2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _vec2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_vec2, camera);
    const hits = raycaster.intersectObject(monitorHead, true);
    if (hits.length > 0) {
      clickBurst = 0.85;
      if (audioEnabled) sound.playPulse();
      options.onClick?.({ index: null, letter: null, text: null, isCorrect: null });
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
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const clock = new THREE.Clock();
  let livePhase = 0;
  let lastScreenDraw = 0;
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

  renderScreenCanvas(screenCanvas, state, { phase: 0, hoveredOption: null });
  screenTex.needsUpdate = true;

  function tick() {
    if (disposed) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    livePhase += dt * speed;
    clickBurst = THREE.MathUtils.damp(clickBurst, 0, 7, dt);

    if (timerRunning && state.timer > 0 && state.selectedOption === null) {
      state.timer = Math.max(0, state.timer - dt);
    }

    // Update animated screen texture ~30fps (or on state changes)
    const now = performance.now();
    if (now - lastScreenDraw > 32) {
      renderScreenCanvas(screenCanvas, state, { phase: livePhase, hoveredOption });
      screenTex.needsUpdate = true;
      lastScreenDraw = now;
    }

    // Living 3D Motion Modes
    const amp = intensity;
    let headY = 0.12;
    let headRotX = 0;
    let headRotY = 0;
    let headRotZ = 0;
    let rootY = 0;
    let rootScale = 1 + clickBurst * 0.035;

    if (motionMode === 'pulse') {
      const beat = Math.pow(Math.max(0, Math.sin(livePhase * 3.4)), 4);
      rootScale = 1 + beat * 0.038 * amp + clickBurst * 0.045;
      headY = 0.12 + Math.sin(livePhase * 2.2) * 0.045 * amp;
      headRotX = Math.sin(livePhase * 1.7) * 0.035 * amp + pointerTiltY * 0.4;
      headRotY = Math.cos(livePhase * 1.2) * 0.06 * amp + pointerTiltX * 0.4;
      glowAccentMat.emissiveIntensity = 1.0 + beat * 1.4 + clickBurst * 1.2;
      screenMat.emissiveIntensity = 0.9 + beat * 0.25 + clickBurst * 0.25;
    } else if (motionMode === 'orbit') {
      rootY = Math.sin(livePhase * 1.5) * 0.06 * amp;
      headY = 0.12 + Math.cos(livePhase * 1.8) * 0.04 * amp;
      headRotY = Math.sin(livePhase * 0.95) * 0.16 * amp + pointerTiltX * 0.35;
      headRotX = Math.sin(livePhase * 1.35) * 0.055 * amp + pointerTiltY * 0.35;
      headRotZ = Math.cos(livePhase * 0.95) * 0.025 * amp;
      glowAccentMat.emissiveIntensity = 1.1 + Math.sin(livePhase * 2.5) * 0.35 + clickBurst;
      screenMat.emissiveIntensity = 0.94 + clickBurst * 0.22;
    } else if (motionMode === 'tilt') {
      headY = 0.12 + Math.sin(livePhase * 1.4) * 0.02 * amp;
      headRotY = pointerTiltX * 1.25 * amp + Math.sin(livePhase * 0.7) * 0.03;
      headRotX = pointerTiltY * 1.15 * amp + Math.cos(livePhase * 0.8) * 0.02;
      headRotZ = -pointerTiltX * 0.12 * amp;
      glowAccentMat.emissiveIntensity = 1.1 + clickBurst;
      screenMat.emissiveIntensity = 0.94 + clickBurst * 0.22;
    } else {
      // 'float': Alive studio gimbal float + breathing holographic glow
      rootY = Math.sin(livePhase * 1.45) * 0.045 * amp;
      headY = 0.12 + Math.sin(livePhase * 1.9 + 0.5) * 0.03 * amp;
      headRotX = Math.sin(livePhase * 1.1) * 0.032 * amp + pointerTiltY * 0.45;
      headRotY = Math.cos(livePhase * 0.85) * 0.075 * amp + pointerTiltX * 0.45;
      headRotZ = Math.sin(livePhase * 1.3) * 0.015 * amp;
      glowAccentMat.emissiveIntensity = 1.05 + Math.sin(livePhase * 2.8) * 0.32 + clickBurst;
      screenMat.emissiveIntensity = 0.92 + Math.sin(livePhase * 2.4) * 0.07 + clickBurst * 0.24;
    }

    _targetScale.setScalar(rootScale);
    monitorRoot.scale.lerp(_targetScale, 1 - Math.exp(-12 * dt));
    monitorRoot.position.y = THREE.MathUtils.damp(monitorRoot.position.y, rootY, 8, dt);

    monitorHead.position.y = THREE.MathUtils.damp(monitorHead.position.y, headY, 8, dt);
    monitorHead.rotation.x = THREE.MathUtils.damp(monitorHead.rotation.x, headRotX, 8, dt);
    monitorHead.rotation.y = THREE.MathUtils.damp(monitorHead.rotation.y, headRotY, 8, dt);
    monitorHead.rotation.z = THREE.MathUtils.damp(monitorHead.rotation.z, headRotZ, 8, dt);

    // Subtle SGSS top crest gleam
    crestFaceMat.emissiveIntensity = 0.45 + Math.sin(livePhase * 2.6) * 0.18 + clickBurst * 0.5;

    // Floating holographic particles around monitor
    particles.forEach((p, idx) => {
      const { baseX, baseY, baseZ, phaseOffset } = p.userData;
      const t = livePhase * 1.5 + phaseOffset;
      p.position.x = baseX + Math.sin(t * 1.1) * 0.08 * amp;
      p.position.y = baseY + Math.cos(t * 1.4) * 0.12 * amp;
      p.position.z = baseZ + Math.sin(t * 0.9 + idx) * 0.09 * amp;
      p.rotation.x = t * 1.3;
      p.rotation.y = t * 1.7;
      p.scale.setScalar(0.85 + Math.sin(t * 2.2) * 0.22 + clickBurst * 0.45);
    });

    if (shadowMesh) {
      shadowMesh.material.opacity = THREE.MathUtils.clamp(0.85 - rootY * 1.8, 0.45, 0.92);
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
    setQuestion: (next = {}) => {
      const questionChanged = next.question !== undefined && next.question !== state.question;
      state = {
        ...state,
        question: next.question !== undefined ? next.question : state.question,
        options: Array.isArray(next.options) ? [...next.options] : state.options,
        correctIndex: next.correctIndex !== undefined ? next.correctIndex : state.correctIndex,
        selectedOption: next.selectedOption !== undefined ? next.selectedOption : null,
        timer: next.timerSeconds !== undefined ? Number(next.timerSeconds) : state.timer,
        maxTimer: next.maxTimerSeconds !== undefined ? Number(next.maxTimerSeconds) : state.maxTimer,
      };
      if (questionChanged) {
        clickBurst = 0.65;
      }
      lastScreenDraw = 0;
    },
    selectOption: (index) => {
      selectOptionAtIndex(index);
      lastScreenDraw = 0;
    },
    resetSelection: () => {
      state.selectedOption = null;
      state.timer = state.maxTimer;
      lastScreenDraw = 0;
    },
    setTimer: (seconds, maxSeconds) => {
      const prevCeil = Math.ceil(state.timer);
      if (maxSeconds !== undefined) state.maxTimer = Math.max(1, Number(maxSeconds) || 30);
      state.timer = Math.max(0, Number(seconds) || 0);
      if (Math.ceil(state.timer) !== prevCeil) {
        lastScreenDraw = 0;
      }
    },
    setTimerRunning: (running) => {
      timerRunning = Boolean(running);
    },
    setLocked: (nextLocked) => {
      locked = Boolean(nextLocked);
      if (locked) {
        hoveredOption = null;
      }
      lastScreenDraw = 0;
    },
    setMotionMode: (mode) => {
      if (mode === 'float' || mode === 'pulse' || mode === 'orbit' || mode === 'tilt') {
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
    pulse: () => {
      clickBurst = 1.0;
      if (audioEnabled) sound.playPulse();
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
