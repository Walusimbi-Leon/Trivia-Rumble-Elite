export type SupportMotionMode =
  | 'wave'
  | 'heartbeat'
  | 'hover'
  | 'ripple'
  | 'bounce'
  | 'shimmer'
  | 'tilt'
  | 'auto';

export const SUPPORT_MOTION_MODES: SupportMotionMode[];

export interface SupportClickEvent {
  letterIndex: number;
  char: string;
  motionMode: SupportMotionMode;
}

export interface SupportDeveloper3DOptions {
  motionMode?: SupportMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  onClick?: (event: SupportClickEvent) => void;
  onLetterClick?: (char: string, index: number) => void;
  onMotionChange?: (activeSubMode: SupportMotionMode) => void;
  onContextLost?: (lost: boolean) => void;
}

export interface SupportDeveloper3DController {
  getMotionMode: () => SupportMotionMode;
  setMotionMode: (mode: SupportMotionMode) => void;
  setSpeed: (nextSpeed: number) => void;
  setIntensity: (nextIntensity: number) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setMasterVolume: (percent: number) => void;
  pulse: (letterIndex?: number) => void;
  resetCamera: () => void;
  destroy: () => void;
}

export declare function createSupportDeveloper3DWidget(
  container: HTMLElement,
  options?: SupportDeveloper3DOptions,
): SupportDeveloper3DController;
