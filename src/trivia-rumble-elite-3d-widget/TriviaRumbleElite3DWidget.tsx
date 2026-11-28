import { useEffect, useRef } from "react";
import {
  createTriviaRumbleElite3DWidget,
  type TriviaRumbleClickEvent,
  type TriviaRumbleElite3DController,
  type TriviaRumbleMotionMode,
} from "./trivia-rumble-elite-3d.js";

export interface TriviaRumbleElite3DWidgetProps {
  motionMode?: TriviaRumbleMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | "transparent";
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  className?: string;
  onClick?: (event: TriviaRumbleClickEvent) => void;
  onLetterClick?: (char: string, index: number) => void;
  onContextLost?: (lost: boolean) => void;
}

/**
 * Drop-in React wrapper for the living 3D TRIVIA RUMBLE ELITE emblem.
 */
export function TriviaRumbleElite3DWidget({
  motionMode = "blaze",
  speed = 1.0,
  intensity = 1.0,
  background = "transparent",
  showStudioFloor = false,
  enableOrbit = false,
  enableSoundFeedback = false,
  masterVolume = 70,
  className = "",
  onClick,
  onLetterClick,
  onContextLost,
}: TriviaRumbleElite3DWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<TriviaRumbleElite3DController | null>(null);

  const onClickRef = useRef(onClick);
  const onLetterClickRef = useRef(onLetterClick);
  const onContextLostRef = useRef(onContextLost);
  onClickRef.current = onClick;
  onLetterClickRef.current = onLetterClick;
  onContextLostRef.current = onContextLost;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let controller: TriviaRumbleElite3DController | null = null;
    try {
      controller = createTriviaRumbleElite3DWidget(el, {
        motionMode,
        speed,
        intensity,
        background,
        showStudioFloor,
        enableOrbit,
        enableSoundFeedback,
        masterVolume,
        onClick: (ev) => onClickRef.current?.(ev),
        onLetterClick: (ch, idx) => onLetterClickRef.current?.(ch, idx),
        onContextLost: (lost) => onContextLostRef.current?.(lost),
      });
      controllerRef.current = controller;
    } catch (err) {
      console.warn("[TriviaRumbleElite3DWidget] WebGL unavailable:", err);
      onContextLostRef.current?.(true);
    }

    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
    // Mount once; live parameter updates happen via controller methods below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background, showStudioFloor, enableOrbit]);

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
      style={{ width: "100%", height: "100%", position: "relative" }}
      aria-label="TRIVIA RUMBLE ELITE 3D emblem"
    />
  );
}

export default TriviaRumbleElite3DWidget;
