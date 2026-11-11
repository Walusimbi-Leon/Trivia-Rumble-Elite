import React, { useEffect, useRef } from 'react';

interface SmoothTimerProps {
  slotStart: number;
  slotEnd: number;
  slotDuration: number;
  clockOffset: number;
  onTimeUp?: () => void;
}

export const SmoothTimer: React.FC<SmoothTimerProps> = ({
  slotStart,
  slotEnd,
  slotDuration,
  clockOffset,
  onTimeUp,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const timeUpFiredRef = useRef<boolean>(false);

  useEffect(() => {
    timeUpFiredRef.current = false;
    let animFrameId: number;

    const tick = () => {
      const currentNow = Date.now() + clockOffset;
      const remainingMs = Math.max(0, slotEnd - currentNow);
      const pct = Math.max(0, Math.min(100, (remainingMs / slotDuration) * 100));
      const remainingSecs = Math.ceil(remainingMs / 1000);
      const isDanger = remainingMs < 4500;

      if (barRef.current) {
        barRef.current.style.width = `${pct}%`;
        if (isDanger) {
          barRef.current.className =
            'h-full rounded-full bg-[#ff4d6d] shadow-[0_0_12px_rgba(255,77,109,0.8)] transition-colors';
        } else {
          barRef.current.className =
            'h-full rounded-full bg-gradient-to-r from-[#d946ef] via-[#7c5cff] to-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.7)] transition-colors';
        }
      }

      if (textRef.current) {
        textRef.current.textContent = `${remainingSecs}s`;
        if (isDanger) {
          textRef.current.className = 'font-mono text-xs md:text-sm font-black tracking-tight text-[#ff4d6d] animate-pulse';
        } else {
          textRef.current.className = 'font-mono text-xs md:text-sm font-black tracking-tight text-[#a5a0cc]';
        }
      }

      if (remainingMs <= 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        if (onTimeUp) onTimeUp();
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [slotStart, slotEnd, slotDuration, clockOffset, onTimeUp]);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="h-2 flex-1 bg-[#0c051f]/80 rounded-full overflow-hidden border border-[#3b2568]/80 shadow-inner">
        <div
          ref={barRef}
          className="h-full rounded-full bg-gradient-to-r from-[#d946ef] via-[#7c5cff] to-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.7)]"
          style={{ width: '100%', willChange: 'width' }}
        />
      </div>
      <span
        ref={textRef}
        className="font-mono text-xs md:text-sm font-black tracking-tight text-[#a5a0cc] shrink-0 min-w-[28px] text-right"
      >
        20s
      </span>
    </div>
  );
};

