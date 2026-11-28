export type TriviaRumbleMotionMode = 'blaze' | 'rumble' | 'wave' | 'pulse' | 'tilt';

export interface TriviaRumbleClickEvent {
  char: string | null;
  index: number | null;
}

export interface TriviaRumbleElite3DOptions {
  motionMode?: TriviaRumbleMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  onClick?: (event: TriviaRumbleClickEvent) => void;
  onLetterClick?: (char: string, index: number) => void;
  onContextLost?: (lost: boolean) => void;
}

export interface TriviaRumbleElite3DController {
  setMotionMode(mode: TriviaRumbleMotionMode): void;
  setSpeed(speed: number): void;
  setIntensity(intensity: number): void;
  setAudioEnabled(enabled: boolean): void;
  setMasterVolume(percent: number): void;
  pulse(letterIndex?: number): void;
  resetCamera(): void;
  destroy(): void;
}

export const TRIVIA_RUMBLE_MOTION_MODES: TriviaRumbleMotionMode[];

export function createTriviaRumbleElite3DWidget(
  container: HTMLElement,
  options?: TriviaRumbleElite3DOptions,
): TriviaRumbleElite3DController;
