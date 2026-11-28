import type {
  SgssIntroFitMode,
  SgssIntroFocalPoint,
  SgssIntroSizingState,
  SgssIntroVideoFormat,
  SgssIntroVideoSizer,
} from './sgss-intro-sizing';

export type SgssIntroPhase =
  | 'studio-wide'
  | 'camera-push-in'
  | 'monitor-lock'
  | 'wave-clear'
  | 'sgss-reveal';

export interface SgssIntroTimeUpdateEvent {
  currentTime: number;
  duration: number;
  progress: number;
  phase: SgssIntroPhase;
}

export interface SgssIntroVideoOptions {
  mp4Src?: string;
  webmSrc?: string;
  posterSrc?: string;
  format?: SgssIntroVideoFormat;
  fitMode?: SgssIntroFitMode;
  focalPoint?: SgssIntroFocalPoint;
  scale?: number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playbackRate?: number;
  volume?: number;
  controls?: boolean;
  showSkipButton?: boolean;
  skipButtonLabel?: string;
  fadeOutOnEnd?: boolean;
  fadeDurationMs?: number;
  borderRadius?: string;
  onReady?: (info: { duration: number }) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (event: SgssIntroTimeUpdateEvent) => void;
  onEnded?: (info: { reason: 'completed' | 'skip' }) => void;
  onSkip?: () => void;
}

export interface SgssIntroVideoController {
  readonly videoElement: HTMLVideoElement;
  readonly sizer: SgssIntroVideoSizer;
  play(): Promise<void>;
  pause(): void;
  restart(): Promise<void>;
  skip(): void;
  seek(seconds: number): void;
  setMuted(muted: boolean): void;
  setVolume(pct: number): void;
  setLoop(loop: boolean): void;
  setPlaybackRate(rate: number): void;
  setFormat(format: SgssIntroVideoFormat): SgssIntroSizingState;
  setFitMode(fitMode: SgssIntroFitMode): SgssIntroSizingState;
  setFocalPoint(focalPoint: SgssIntroFocalPoint): SgssIntroSizingState;
  setScale(scale: number): SgssIntroSizingState;
  makeSmaller(step?: number): SgssIntroSizingState;
  makeBigger(step?: number): SgssIntroSizingState;
  getState(): {
    currentTime: number;
    duration: number;
    paused: boolean;
    ended: boolean;
    muted: boolean;
    playbackRate: number;
    sizing: SgssIntroSizingState;
  };
  destroy(): void;
}

export function createSgssIntroVideo(
  container: HTMLElement,
  options?: SgssIntroVideoOptions,
): SgssIntroVideoController;
