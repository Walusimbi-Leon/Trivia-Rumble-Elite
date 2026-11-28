export type TriviaRumbleSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface TriviaRumbleSizeConfig {
  preset?: TriviaRumbleSizePreset;
  width?: number | string;
  height?: number | string;
  scale?: number;
}

export interface AppliedTriviaRumbleSize {
  width: number | string;
  height: number | string;
  scale: number;
  preset: string;
}

export interface TriviaRumbleElite3DSizer {
  setPreset(presetName: TriviaRumbleSizePreset): AppliedTriviaRumbleSize;
  setDimensions(width: number | string, height?: number | string): AppliedTriviaRumbleSize;
  setScale(multiplier: number): AppliedTriviaRumbleSize;
  makeSmaller(step?: number): AppliedTriviaRumbleSize;
  makeBigger(step?: number): AppliedTriviaRumbleSize;
  getSize(): AppliedTriviaRumbleSize;
}

export const TRIVIA_RUMBLE_SIZE_PRESETS: Record<
  TriviaRumbleSizePreset,
  { width: number | string; height: number | string }
>;

export function applyTriviaRumbleElite3DSize(
  container: HTMLElement,
  size?: TriviaRumbleSizePreset | number | TriviaRumbleSizeConfig,
): AppliedTriviaRumbleSize;

export function createTriviaRumbleElite3DSizer(
  container: HTMLElement,
  initialSize?: TriviaRumbleSizePreset | number | TriviaRumbleSizeConfig,
): TriviaRumbleElite3DSizer;
