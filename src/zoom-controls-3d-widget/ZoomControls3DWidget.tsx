import { useEffect, useRef } from 'react';
import {
  createZoomControls3DWidget,
  type ZoomActionEvent,
  type ZoomButtonId,
  type ZoomControls3DController,
  type ZoomControlsMotionMode,
} from './zoom-controls-3d.js';

export interface ZoomControls3DWidgetProps {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  motionMode?: ZoomControlsMotionMode;
  speed?: number;
  intensity?: number;
  background?: string | 'transparent';
  showStudioFloor?: boolean;
  enableOrbit?: boolean;
  enableSoundFeedback?: boolean;
  masterVolume?: number;
  className?: string;
  onZoomIn?: (event: ZoomActionEvent) => void;
  onZoomOut?: (event: ZoomActionEvent) => void;
  onChange?: (zoomPercent: number, action: 'in' | 'out' | 'set') => void;
  onHoverButton?: (button: ZoomButtonId | null) => void;
  onContextLost?: (lost: boolean) => void;
}

/**
 * Drop-in React wrapper for the living 3D Clickable Zoom In (i+ and Zoom Out (i- widget.
 */
export function ZoomControls3DWidget({
  initialZoom = 100,
  minZoom = 50,
  maxZoom = 200,
  step = 15,
  motionMode = 'float',
  speed = 1.0,
  intensity = 1.0,
  background = 'transparent',
  showStudioFloor = false,
  enableOrbit = false,
  enableSoundFeedback = true,
  masterVolume = 75,
  className = '',
  onZoomIn,
  onZoomOut,
  onChange,
  onHoverButton,
  onContextLost,
}: ZoomControls3DWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ZoomControls3DController | null>(null);
  const onZoomInRef = useRef(onZoomIn);
  const onZoomOutRef = useRef(onZoomOut);
  const onChangeRef = useRef(onChange);
  const onHoverRef = useRef(onHoverButton);
  const onContextLostRef = useRef(onContextLost);

  onZoomInRef.current = onZoomIn;
  onZoomOutRef.current = onZoomOut;
  onChangeRef.current = onChange;
  onHoverRef.current = onHoverButton;
  onContextLostRef.current = onContextLost;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let controller: ZoomControls3DController | null = null;
    try {
      controller = createZoomControls3DWidget(el, {
        initialZoom,
        minZoom,
        maxZoom,
        step,
        motionMode,
        speed,
        intensity,
        background,
        showStudioFloor,
        enableOrbit,
        enableSoundFeedback,
        masterVolume,
        onZoomIn: (ev) => onZoomInRef.current?.(ev),
        onZoomOut: (ev) => onZoomOutRef.current?.(ev),
        onChange: (pct, action) => onChangeRef.current?.(pct, action),
        onHoverButton: (btn) => onHoverRef.current?.(btn),
        onContextLost: (lost) => onContextLostRef.current?.(lost),
      });
      controllerRef.current = controller;
    } catch (err) {
      console.warn('[ZoomControls3DWidget] WebGL unavailable:', err);
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
      style={{ width: '100%', height: '100%', position: 'relative' }}
      aria-label="Interactive 3D Zoom In and Zoom Out magnifying glass buttons"
    />
  );
}

export default ZoomControls3DWidget;
