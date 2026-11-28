export type SupportSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type SupportSizeInput =
  | SupportSizePreset
  | number
  | {
      preset?: SupportSizePreset;
      width?: number | string;
      height?: number | string;
      scale?: number;
    };

export interface SupportAppliedSize {
  width: number | string;
  height: number | string;
  scale: number;
  preset: string;
}

export interface SupportDeveloper3DSizer {
  setPreset: (presetName: SupportSizePreset) => SupportAppliedSize;
  setDimensions: (width: number | string, height?: number | string) => SupportAppliedSize;
  setScale: (multiplier: number) => SupportAppliedSize;
  makeSmaller: (step?: number) => SupportAppliedSize;
  makeBigger: (step?: number) => SupportAppliedSize;
  getSize: () => SupportAppliedSize;
}

export const SUPPORT_SIZE_PRESETS: Record<SupportSizePreset, { width: number | string; height: number | string }>;

export function applySupportDeveloper3DSize(container: HTMLElement, size?: SupportSizeInput): SupportAppliedSize;

export function createSupportDeveloper3DSizer(container: HTMLElement, initialSize?: SupportSizeInput): SupportDeveloper3DSizer;
