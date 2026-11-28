import type { ZoomActionEvent, ZoomControlsMotionMode } from './zoom-controls-3d.js';

export interface ZoomControlsImageOptions {
  imageSrc?: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  motionMode?: ZoomControlsMotionMode;
  speed?: number;
  intensity?: number;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  onZoomIn?: (event: ZoomActionEvent) => void;
  onZoomOut?: (event: ZoomActionEvent) => void;
  onChange?: (zoomPercent: number, action: 'in' | 'out' | 'set') => void;
}

export interface ZoomControlsImageController {
  triggerZoomIn(): number;
  triggerZoomOut(): number;
  setZoom(percent: number): number;
  getZoom(): number;
  setMotionMode(mode: ZoomControlsMotionMode): void;
  setSpeed(speed: number): void;
  setIntensity(intensity: number): void;
  setAudioEnabled(enabled: boolean): void;
  setMasterVolume(percent: number): void;
  destroy(): void;
}

export function createZoomControlsImageWidget(
  container: HTMLElement,
  options?: ZoomControlsImageOptions,
): ZoomControlsImageController;
