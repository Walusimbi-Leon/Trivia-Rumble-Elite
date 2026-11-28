export type SgssIntroVideoFormat =
  | 'desktop-landscape'
  | 'desktop-compact'
  | 'phone-portrait'
  | 'phone-portrait-fill'
  | 'tablet-landscape'
  | 'tablet-portrait'
  | 'square'
  | 'fullscreen'
  | 'auto';

export type SgssIntroFitMode = 'cover' | 'contain' | 'fill';
export type SgssIntroFocalPoint = 'monitor' | 'center' | 'left' | 'right' | string;

export interface SgssIntroSizingOptions {
  format?: SgssIntroVideoFormat | 'custom';
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  fitMode?: SgssIntroFitMode;
  focalPoint?: SgssIntroFocalPoint;
  scale?: number;
  background?: string;
}

export interface SgssIntroSizingState {
  format: string;
  width: number | string;
  height: number | string;
  aspectRatio: string;
  fitMode: SgssIntroFitMode;
  focalPoint: SgssIntroFocalPoint;
  scale: number;
}

export interface SgssIntroVideoSizer {
  setFormat(format: SgssIntroVideoFormat): SgssIntroSizingState;
  setFitMode(fitMode: SgssIntroFitMode): SgssIntroSizingState;
  setFocalPoint(focalPoint: SgssIntroFocalPoint): SgssIntroSizingState;
  setDimensions(
    width: number | string,
    height: number | string,
    aspectRatio?: string,
  ): SgssIntroSizingState;
  setScale(multiplier: number): SgssIntroSizingState;
  makeSmaller(step?: number): SgssIntroSizingState;
  makeBigger(step?: number): SgssIntroSizingState;
  syncVideoProgress(currentTime: number, duration: number): void;
  getState(): SgssIntroSizingState;
  destroy(): void;
}

export const SGSS_INTRO_VIDEO_FORMATS: Record<
  Exclude<SgssIntroVideoFormat, 'auto'>,
  {
    label: string;
    width: number | string;
    height: number | string;
    maxWidth: number | 'none';
    aspectRatio: string;
    fitMode: SgssIntroFitMode;
    focalPoint: SgssIntroFocalPoint;
  }
>;

export function computeSgssIntroFocalPosition(
  progress?: number,
  focalPoint?: SgssIntroFocalPoint,
): string;

export function updateSgssIntroVideoFocalPoint(
  videoEl: HTMLVideoElement | null,
  progress?: number,
  focalPoint?: SgssIntroFocalPoint,
): void;

export function resolveAutoFormat(container?: HTMLElement | null): SgssIntroVideoFormat;

export function applySgssIntroVideoSize(
  container: HTMLElement,
  videoEl?: HTMLVideoElement | null,
  sizeOrOptions?: SgssIntroVideoFormat | number | SgssIntroSizingOptions,
): SgssIntroSizingState;

export function createSgssIntroVideoSizer(
  container: HTMLElement,
  videoEl?: HTMLVideoElement | null,
  initialConfig?: SgssIntroVideoFormat | number | SgssIntroSizingOptions,
): SgssIntroVideoSizer;
