import type {
  ArenaIntroFitMode,
  ArenaIntroFocalPoint,
  ArenaIntroSizingState,
  ArenaIntroVideoFormat,
  ArenaIntroVideoSizer,
} from './arena-intro-sizing';

export type ArenaIntroPhase =
  | 'rumble-popup'
  | 'arena-connect-enter'
  | 'unified-loading';

export interface ArenaIntroTimeUpdateEvent {
  currentTime: number;
  duration: number;
  progress: number;
  phase: ArenaIntroPhase;
}

export interface ArenaIntroVideoOptions {
  mp4Src?: string;
  webmSrc?: string;
  posterSrc?: string;
  format?: ArenaIntroVideoFormat;
  fitMode?: ArenaIntroFitMode;
  focalPoint?: ArenaIntroFocalPoint;
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
  onTimeUpdate?: (event: ArenaIntroTimeUpdateEvent) => void;
  onEnded?: (info: { reason: 'completed' | 'skip' }) => void;
  onSkip?: () => void;
}

export interface ArenaIntroVideoController {
  readonly videoElement: HTMLVideoElement;
  readonly sizer: ArenaIntroVideoSizer;
  play(): Promise<void>;
  pause(): void;
  restart(): Promise<void>;
  skip(): void;
  seek(seconds: number): void;
  setMuted(muted: boolean): void;
  setVolume(pct: number): void;
  setLoop(loop: boolean): void;
  setPlaybackRate(rate: number): void;
  setFormat(format: ArenaIntroVideoFormat): ArenaIntroSizingState;
  setFitMode(fitMode: ArenaIntroFitMode): ArenaIntroSizingState;
  setFocalPoint(focalPoint: ArenaIntroFocalPoint): ArenaIntroSizingState;
  setScale(scale: number): ArenaIntroSizingState;
  makeSmaller(step?: number): ArenaIntroSizingState;
  makeBigger(step?: number): ArenaIntroSizingState;
  getState(): {
    currentTime: number;
    duration: number;
    paused: boolean;
    ended: boolean;
    muted: boolean;
    playbackRate: number;
    sizing: ArenaIntroSizingState;
  };
  destroy(): void;
}

export function createArenaIntroVideo(
  container: HTMLElement,
  options?: ArenaIntroVideoOptions,
): ArenaIntroVideoController;
