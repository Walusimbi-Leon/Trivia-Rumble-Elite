import { useEffect, useRef } from 'react';
import {
  createTriviaChallenge3DWidget,
  type TriviaChallenge3DController,
  type TriviaChallengeMotionMode,
  type TriviaChallengeSelectEvent,
} from './trivia-challenge-3d.js';

export interface TriviaChallenge3DWidgetProps {
  question?: string;
  options?: string[];
  correctIndex?: number | null;
  selectedOption?: number | null;
  timerSeconds?: number;
  maxTimerSeconds?: number;
  timerRunning?: boolean;
  locked?: boolean;
  motionMode?: TriviaChallengeMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  className?: string;
  onSelectOption?: (event: TriviaChallengeSelectEvent) => void;
  onClick?: (event: TriviaChallengeSelectEvent) => void;
  onContextLost?: (lost: boolean) => void;
  onControllerReady?: (controller: TriviaChallenge3DController | null) => void;
}

/**
 * Drop-in React wrapper for the living 3D SGSS Trivia Challenge Monitor.
 */
export function TriviaChallenge3DWidget({
  question = 'Which company developed the first commercial graphical web browser, Mosaic, in 1993?',
  options = [
    'Netscape Communications',
    'Microsoft Corporation',
    'Spyglass, Inc.',
    'The National Center for Supercomputing Applications (NCSA)',
  ],
  correctIndex = 3,
  selectedOption = null,
  timerSeconds = 30,
  maxTimerSeconds = 30,
  timerRunning = true,
  locked = false,
  motionMode = 'float',
  speed = 1.0,
  intensity = 1.0,
  background = 'transparent',
  showStudioFloor = false,
  enableOrbit = true,
  enableSoundFeedback = true,
  masterVolume = 70,
  className = '',
  onSelectOption,
  onClick,
  onContextLost,
  onControllerReady,
}: TriviaChallenge3DWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<TriviaChallenge3DController | null>(null);
  const onSelectRef = useRef(onSelectOption);
  const onClickRef = useRef(onClick);
  const onContextLostRef = useRef(onContextLost);
  const onReadyRef = useRef(onControllerReady);
  onSelectRef.current = onSelectOption;
  onClickRef.current = onClick;
  onContextLostRef.current = onContextLost;
  onReadyRef.current = onControllerReady;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let controller: TriviaChallenge3DController | null = null;
    try {
      controller = createTriviaChallenge3DWidget(el, {
        question,
        options,
        correctIndex,
        selectedOption,
        timerSeconds,
        maxTimerSeconds,
        timerRunning,
        locked,
        motionMode,
        speed,
        intensity,
        background,
        showStudioFloor,
        enableOrbit,
        enableSoundFeedback,
        masterVolume,
        onSelectOption: (ev) => onSelectRef.current?.(ev),
        onClick: (ev) => onClickRef.current?.(ev),
        onContextLost: (lost) => onContextLostRef.current?.(lost),
      });
      controllerRef.current = controller;
      onReadyRef.current?.(controller);
    } catch (err) {
      console.warn('[TriviaChallenge3DWidget] WebGL unavailable:', err);
      onContextLostRef.current?.(true);
      onReadyRef.current?.(null);
    }

    return () => {
      controller?.destroy();
      controllerRef.current = null;
      onReadyRef.current?.(null);
    };
    // Mount once; dynamic updates happen via controller methods below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background, showStudioFloor, enableOrbit]);

  useEffect(() => {
    controllerRef.current?.setQuestion({
      question,
      options,
      correctIndex,
      selectedOption,
    });
  }, [question, options, correctIndex, selectedOption]);

  useEffect(() => {
    controllerRef.current?.setTimer(timerSeconds, maxTimerSeconds);
  }, [timerSeconds, maxTimerSeconds]);

  useEffect(() => {
    controllerRef.current?.setTimerRunning(timerRunning);
  }, [timerRunning]);

  useEffect(() => {
    controllerRef.current?.setLocked(locked);
  }, [locked]);

  useEffect(() => {
    controllerRef.current?.setMotionMode(motionMode);
  }, [motionMode]);

  useEffect(() => {
    controllerRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    controllerRef.current?.setIntensity(intensity);
  }, [intensity]);

  useEffect(() => {
    controllerRef.current?.setAudioEnabled(enableSoundFeedback);
  }, [enableSoundFeedback]);

  useEffect(() => {
    controllerRef.current?.setMasterVolume(masterVolume);
  }, [masterVolume]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      aria-label="Interactive animated 3D SGSS Trivia Challenge Monitor"
    />
  );
}

export default TriviaChallenge3DWidget;
