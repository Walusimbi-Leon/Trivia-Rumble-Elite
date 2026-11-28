export type ArenaIntroVideoFormat =
  | 'desktop-landscape'
  | 'desktop-compact'
  | 'phone-portrait'
  | 'phone-portrait-fill'
  | 'tablet-landscape'
  | 'tablet-portrait'
  | 'square'
  | 'fullscreen'
  | 'auto';

export type ArenaIntroFitMode = 'cover' | 'contain' | 'fill';
export type ArenaIntroFocalPoint = 'stack' | 'center' | 'top' | 'bottom' | string;

export interface ArenaIntroSizingOptions {
  format?: ArenaIntroVideoFormat | 'custom';
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  fitMode?: ArenaIntroFitMode;
  focalPoint?: ArenaIntroFocalPoint;
  scale?: number;
  background?: string;
}

export interface ArenaIntroSizingState {
  format: string;
  width: number | string;
  height: number | string;
  aspectRatio: string;
  fitMode: ArenaIntroFitMode;
  focalPoint: ArenaIntroFocalPoint;
  scale: number;
}

export interface ArenaIntroVideoSizer {
  setFormat(format: ArenaIntroVideoFormat): ArenaIntroSizingState;
  setFitMode(fitMode: ArenaIntroFitMode): ArenaIntroSizingState;
  setFocalPoint(focalPoint: ArenaIntroFocalPoint): ArenaIntroSizingState;
  setDimensions(
    width: number | string,
    height: number | string,
    aspectRatio?: string,
  ): ArenaIntroSizingState;
  setScale(multiplier: number): ArenaIntroSizingState;
  makeSmaller(step?: number): ArenaIntroSizingState;
  makeBigger(step?: number): ArenaIntroSizingState;
  syncVideoProgress(currentTime: number, duration: number): void;
  getState(): ArenaIntroSizingState;
  destroy(): void;
}

export const ARENA_INTRO_VIDEO_FORMATS: Record<
  Exclude<ArenaIntroVideoFormat, 'auto'>,
  {
    label: string;
    width: number | string;
    height: number | string;
    maxWidth: number | 'none';
    aspectRatio: string;
    fitMode: ArenaIntroFitMode;
    focalPoint: ArenaIntroFocalPoint;
  }
>;

export function computeArenaIntroFocalPosition(
  progress?: number,
  focalPoint?: ArenaIntroFocalPoint,
): string;

export function updateArenaIntroVideoFocalPoint(
  videoEl: HTMLVideoElement | null,
  progress?: number,
  focalPoint?: ArenaIntroFocalPoint,
): void;

export function resolveAutoFormat(container?: HTMLElement | null): ArenaIntroVideoFormat;

export function applyArenaIntroVideoSize(
  container: HTMLElement,
  videoEl?: HTMLVideoElement | null,
  sizeOrOptions?: ArenaIntroVideoFormat | number | ArenaIntroSizingOptions,
): ArenaIntroSizingState;

export function createArenaIntroVideoSizer(
  container: HTMLElement,
  videoEl?: HTMLVideoElement | null,
  initialConfig?: ArenaIntroVideoFormat | number | ArenaIntroSizingOptions,
): ArenaIntroVideoSizer;
