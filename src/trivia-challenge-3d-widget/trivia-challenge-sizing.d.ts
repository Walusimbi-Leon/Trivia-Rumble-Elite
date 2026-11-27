export type TriviaChallengeSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface TriviaChallengeSizeConfig {
  preset?: TriviaChallengeSizePreset;
  width?: number | string;
  height?: number | string;
  scale?: number;
}

export interface AppliedTriviaChallengeSize {
  width: number | string;
  height: number | string;
  scale: number;
  preset: string;
}

export interface TriviaChallenge3DSizer {
  setPreset(presetName: TriviaChallengeSizePreset): AppliedTriviaChallengeSize;
  setDimensions(width: number | string, height?: number | string): AppliedTriviaChallengeSize;
  setScale(multiplier: number): AppliedTriviaChallengeSize;
  makeSmaller(step?: number): AppliedTriviaChallengeSize;
  makeBigger(step?: number): AppliedTriviaChallengeSize;
  getSize(): AppliedTriviaChallengeSize;
}

export const TRIVIA_CHALLENGE_SIZE_PRESETS: Record<
  TriviaChallengeSizePreset,
  { width: number | string; height: number | string }
>;

export function applyTriviaChallenge3DSize(
  container: HTMLElement,
  size?: TriviaChallengeSizePreset | number | TriviaChallengeSizeConfig,
): AppliedTriviaChallengeSize;

export function createTriviaChallenge3DSizer(
  container: HTMLElement,
  initialSize?: TriviaChallengeSizePreset | number | TriviaChallengeSizeConfig,
): TriviaChallenge3DSizer;
