export type ZoomControlsMotionMode = 'float' | 'pulse' | 'orbit' | 'tilt';
export type ZoomButtonId = 'zoom-in' | 'zoom-out';

export interface ZoomActionEvent {
  zoom: number;
  delta: number;
  action: 'in' | 'out';
}

export interface ZoomControls3DOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  motionMode?: ZoomControlsMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  onZoomIn?: (event: ZoomActionEvent) => void;
  onZoomOut?: (event: ZoomActionEvent) => void;
  onChange?: (zoomPercent: number, action: 'in' | 'out' | 'set') => void;
  onHoverButton?: (button: ZoomButtonId | null) => void;
  onContextLost?: (lost: boolean) => void;
}

export interface ZoomControls3DController {
  triggerZoomIn(): number;
  triggerZoomOut(): number;
  setZoom(percent: number): number;
  getZoom(): number;
  setMotionMode(mode: ZoomControlsMotionMode): void;
  setSpeed(speed: number): void;
  setIntensity(intensity: number): void;
  setAudioEnabled(enabled: boolean): void;
  setMasterVolume(percent: number): void;
  resetCamera(): void;
  destroy(): void;
}

export const ZOOM_CONTROLS_MOTION_MODES: ZoomControlsMotionMode[];

export function createZoomControls3DWidget(
  container: HTMLElement,
  options?: ZoomControls3DOptions,
): ZoomControls3DController;
