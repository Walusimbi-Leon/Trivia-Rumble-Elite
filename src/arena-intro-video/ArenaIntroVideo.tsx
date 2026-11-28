import { useEffect, useRef } from 'react';
import {
  createArenaIntroVideo,
  type ArenaIntroTimeUpdateEvent,
  type ArenaIntroVideoController,
} from './arena-intro-video.js';
import type {
  ArenaIntroFitMode,
  ArenaIntroFocalPoint,
  ArenaIntroVideoFormat,
} from './arena-intro-sizing.js';

export interface ArenaIntroVideoProps {
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
  className?: string;
  onTimeUpdate?: (event: ArenaIntroTimeUpdateEvent) => void;
  onEnded?: (info: { reason: 'completed' | 'skip' }) => void;
  onSkip?: () => void;
}

export function ArenaIntroVideo({
  mp4Src,
  webmSrc,
  posterSrc,
  format = 'auto',
  fitMode,
  focalPoint = 'stack',
  scale = 1,
  autoPlay = true,
  loop = true,
  muted = true,
  playbackRate = 1.0,
  volume = 80,
  controls = false,
  showSkipButton = false,
  skipButtonLabel = 'Skip',
  fadeOutOnEnd = true,
  className,
  onTimeUpdate,
  onEnded,
  onSkip,
}: ArenaIntroVideoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<ArenaIntroVideoController | null>(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const controller = createArenaIntroVideo(el, {
      mp4Src,
      webmSrc,
      posterSrc,
      format,
      fitMode,
      focalPoint,
      scale,
      autoPlay,
      loop,
      muted,
      playbackRate,
      volume,
      controls,
      showSkipButton,
      skipButtonLabel,
      fadeOutOnEnd,
      onTimeUpdate: (ev) => onTimeUpdateRef.current?.(ev),
      onEnded: (info) => onEndedRef.current?.(info),
      onSkip: () => onSkipRef.current?.(),
    });
    ctrlRef.current = controller;

    return () => {
      controller.destroy();
      ctrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp4Src, webmSrc, posterSrc, showSkipButton, skipButtonLabel, controls, fadeOutOnEnd]);

  useEffect(() => {
    ctrlRef.current?.setFormat(format);
  }, [format]);

  useEffect(() => {
    if (fitMode) ctrlRef.current?.setFitMode(fitMode);
  }, [fitMode]);

  useEffect(() => {
    ctrlRef.current?.setFocalPoint(focalPoint);
  }, [focalPoint]);

  useEffect(() => {
    ctrlRef.current?.setScale(scale);
  }, [scale]);

  useEffect(() => {
    ctrlRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    ctrlRef.current?.setLoop(loop);
  }, [loop]);

  useEffect(() => {
    ctrlRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    ctrlRef.current?.setVolume(volume);
  }, [volume]);

  return <div ref={mountRef} className={className} />;
}
