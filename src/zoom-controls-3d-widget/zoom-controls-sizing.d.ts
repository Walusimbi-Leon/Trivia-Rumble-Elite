export type ZoomControlsSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ZoomControlsSizeConfig {
  preset?: ZoomControlsSizePreset;
  width?: number | string;
  height?: number | string;
  scale?: number;
}

export interface AppliedZoomControlsSize {
  width: number | string;
  height: number | string;
  scale: number;
  preset: string;
}

export interface ZoomControls3DSizer {
  setPreset(presetName: ZoomControlsSizePreset): AppliedZoomControlsSize;
  setDimensions(width: number | string, height?: number | string): AppliedZoomControlsSize;
  setScale(multiplier: number): AppliedZoomControlsSize;
  makeSmaller(step?: number): AppliedZoomControlsSize;
  makeBigger(step?: number): AppliedZoomControlsSize;
  getSize(): AppliedZoomControlsSize;
}

export const ZOOM_CONTROLS_SIZE_PRESETS: Record<
  ZoomControlsSizePreset,
  { width: number | string; height: number | string }
>;

export function applyZoomControls3DSize(
  container: HTMLElement,
  size?: ZoomControlsSizePreset | number | ZoomControlsSizeConfig,
): AppliedZoomControlsSize;

export function createZoomControls3DSizer(
  container: HTMLElement,
  initialSize?: ZoomControlsSizePreset | number | ZoomControlsSizeConfig,
): ZoomControls3DSizer;
