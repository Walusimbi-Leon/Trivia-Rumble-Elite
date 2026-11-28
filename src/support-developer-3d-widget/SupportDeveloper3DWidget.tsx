import { useEffect, useRef } from "react";
import {
  createSupportDeveloper3DWidget,
  type SupportClickEvent,
  type SupportDeveloper3DController,
  type SupportMotionMode,
} from "./support-developer-3d.js";

export interface SupportDeveloper3DWidgetProps {
  motionMode?: SupportMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | "transparent";
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  className?: string;
  onClick?: (event: SupportClickEvent) => void;
  onLetterClick?: (char: string, index: number) => void;
  onMotionChange?: (activeSubMode: SupportMotionMode) => void;
  onContextLost?: (lost: boolean) => void;
}

/**
 * Drop-in React wrapper for the multi-motion 3D SUPPORT DEVELOPER badge.
 */
export function SupportDeveloper3DWidget({
  motionMode = "wave",
  speed = 1.0,
  intensity = 1.0,
  background = "transparent",
  showStudioFloor = false,
  enableOrbit = false,
  enableSoundFeedback = true,
  masterVolume = 70,
  className = "",
  onClick,
  onLetterClick,
  onMotionChange,
  onContextLost,
}: SupportDeveloper3DWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SupportDeveloper3DController | null>(null);

  const onClickRef = useRef(onClick);
  const onLetterRef = useRef(onLetterClick);
  const onMotionRef = useRef(onMotionChange);
  const onContextLostRef = useRef(onContextLost);
  onClickRef.current = onClick;
  onLetterRef.current = onLetterClick;
  onMotionRef.current = onMotionChange;
  onContextLostRef.current = onContextLost;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let controller: SupportDeveloper3DController | null = null;
    try {
      controller = createSupportDeveloper3DWidget(el, {
        motionMode,
        speed,
        intensity,
        background,
        showStudioFloor,
        enableOrbit,
        enableSoundFeedback,
        masterVolume,
        onClick: (ev) => onClickRef.current?.(ev),
        onLetterClick: (ch, idx) => onLetterRef.current?.(ch, idx),
        onMotionChange: (sub) => onMotionRef.current?.(sub),
        onContextLost: (lost) => onContextLostRef.current?.(lost),
      });
      controllerRef.current = controller;
    } catch (err) {
      console.warn("[SupportDeveloper3DWidget] WebGL unavailable:", err);
      onContextLostRef.current?.(true);
    }

    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
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
      aria-label="Support Developer 3D button"
    />
  );
}

export default SupportDeveloper3DWidget;
