import type { TriviaChallengeMotionMode } from './trivia-challenge-3d.js';

export interface TriviaChallengeImageOptions {
  imageSrc?: string;
  motionMode?: TriviaChallengeMotionMode;
  speed?: number;
  intensity?: number;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  onClick?: () => void;
}

export interface TriviaChallengeImageController {
  pulse(): void;
  setMotionMode(mode: TriviaChallengeMotionMode): void;
  setSpeed(speed: number): void;
  setIntensity(intensity: number): void;
  setAudioEnabled(enabled: boolean): void;
  setMasterVolume(percent: number): void;
  destroy(): void;
}

export function createTriviaChallengeImageWidget(
  container: HTMLElement,
  options?: TriviaChallengeImageOptions,
): TriviaChallengeImageController;
