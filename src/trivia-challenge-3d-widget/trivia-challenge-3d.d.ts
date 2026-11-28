export type TriviaChallengeMotionMode = 'float' | 'pulse' | 'orbit' | 'tilt';

export interface TriviaChallengeSelectEvent {
  index: number | null;
  letter: string | null;
  text: string | null;
  isCorrect: boolean | null;
}

export interface TriviaChallengeQuestionPayload {
  question?: string;
  options?: string[];
  correctIndex?: number | null;
  selectedOption?: number | null;
  timerSeconds?: number;
  maxTimerSeconds?: number;
}

export interface TriviaChallenge3DOptions {
  question?: string;
  options?: string[];
  correctIndex?: number | null;
  selectedOption?: number | null;
  timerSeconds?: number;
  maxTimerSeconds?: number;
  timerRunning?: boolean;
  motionMode?: TriviaChallengeMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableRotate?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  locked?: boolean;
  onSelectOption?: (event: TriviaChallengeSelectEvent) => void;
  onClick?: (event: TriviaChallengeSelectEvent) => void;
  onContextLost?: (lost: boolean) => void;
}

export interface TriviaChallenge3DController {
  setQuestion(next: TriviaChallengeQuestionPayload): void;
  selectOption(index: number): void;
  resetSelection(): void;
  setTimer(seconds: number, maxSeconds?: number): void;
  setTimerRunning(running: boolean): void;
  setLocked(locked: boolean): void;
  setMotionMode(mode: TriviaChallengeMotionMode): void;
  setSpeed(speed: number): void;
  setIntensity(intensity: number): void;
  setAudioEnabled(enabled: boolean): void;
  setMasterVolume(percent: number): void;
  pulse(): void;
  zoomIn(step?: number): void;
  zoomOut(step?: number): void;
  resetCamera(): void;
  destroy(): void;
}

export function createTriviaChallenge3DWidget(
  container: HTMLElement,
  options?: TriviaChallenge3DOptions,
): TriviaChallenge3DController;
