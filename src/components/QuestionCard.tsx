import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CurrentSlotInfo } from '../types';
import { TriviaChallenge3DWidget } from '../trivia-challenge-3d-widget/TriviaChallenge3DWidget';
import { applyTriviaChallenge3DSize } from '../trivia-challenge-3d-widget/trivia-challenge-sizing.js';
import { ZoomControls3DWidget } from '../zoom-controls-3d-widget/ZoomControls3DWidget';
import { applyZoomControls3DSize } from '../zoom-controls-3d-widget/zoom-controls-sizing.js';
import type { TriviaChallenge3DController } from '../trivia-challenge-3d-widget/trivia-challenge-3d';

interface QuestionCardProps {
  slotInfo: CurrentSlotInfo;
  clockOffset: number;
  totalDurationMs: number;
  myAnswer: number | null;
  hasAnswered: boolean;
  revealed: boolean;
  lastGain: number;
  answeredCount: number;
  liveCount: number;
  onSelectOption: (index: number) => void;
  onTimeUp?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  slotInfo,
  clockOffset,
  totalDurationMs,
  myAnswer,
  hasAnswered,
  revealed,
  lastGain,
  answeredCount,
  liveCount,
  onSelectOption,
  onTimeUp,
}) => {
  const { question } = slotInfo;
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const slotContainerRef = useRef<HTMLDivElement | null>(null);
  const zoomSlotRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<TriviaChallenge3DController | null>(null);
  const timeUpFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onSelectOptionRef = useRef(onSelectOption);
  onTimeUpRef.current = onTimeUp;
  onSelectOptionRef.current = onSelectOption;

  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [zoomWebglLost, setZoomWebglLost] = useState(false);
  const [fallbackRemainingSecs, setFallbackRemainingSecs] = useState(() =>
    Math.max(0, Math.ceil((slotInfo.slotEnd - (Date.now() + clockOffset)) / 1000))
  );

  const initialRemainingSeconds = Math.max(
    0,
    (slotInfo.slotEnd - (Date.now() + clockOffset)) / 1000
  );
  const maxTimerSeconds = Math.max(1, totalDurationMs / 1000);

  // Sync both 3D monitor and 3D zoom controls responsively using their dedicated sizing helpers
  useEffect(() => {
    const wrapper = stageWrapperRef.current;
    if (!wrapper) return;

    const updateSizes = () => {
      const availW = Math.max(240, Math.floor(wrapper.clientWidth));
      if (slotContainerRef.current) {
        const monW = Math.min(availW, 760);
        const monH = Math.max(210, Math.round(monW * 0.625));
        applyTriviaChallenge3DSize(slotContainerRef.current, { width: monW, height: monH });
      }
      if (zoomSlotRef.current) {
        const zoomW = Math.min(availW, 280);
        const zoomH = Math.round(zoomW * 0.6);
        applyZoomControls3DSize(zoomSlotRef.current, { width: zoomW, height: zoomH });
      }
    };

    updateSizes();
    const ro = new ResizeObserver(updateSizes);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Synchronize the 3D monitor timer directly to the server-calibrated slot deadline
  useEffect(() => {
    timeUpFiredRef.current = false;
    let rafId = 0;

    const tick = () => {
      const currentNow = Date.now() + clockOffset;
      const remainingMs = Math.max(0, slotInfo.slotEnd - currentNow);
      const remainingSec = remainingMs / 1000;
      const maxSec = Math.max(1, totalDurationMs / 1000);

      controllerRef.current?.setTimer(remainingSec, maxSec);

      if (webglUnavailable) {
        setFallbackRemainingSecs(Math.ceil(remainingSec));
      }

      if (remainingMs <= 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        onTimeUpRef.current?.();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [slotInfo.slotStart, slotInfo.slotEnd, totalDurationMs, clockOffset, webglUnavailable]);

  // Keyboard shortcuts (A/B/C/D or 1/2/3/4) for fast accessible answering
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = e.key.toUpperCase();
      const map: Record<string, number> = {
        A: 0, '1': 0,
        B: 1, '2': 1,
        C: 2, '3': 2,
        D: 3, '4': 3,
      };
      if (key in map) {
        e.preventDefault();
        onSelectOptionRef.current(map[key]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasAnswered]);

  const handleWidgetSelect = useCallback((ev: { index: number | null }) => {
    if (typeof ev.index === 'number' && ev.index >= 0 && ev.index <= 3) {
      onSelectOptionRef.current(ev.index);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    controllerRef.current?.zoomIn(0.85);
  }, []);

  const handleZoomOut = useCallback(() => {
    controllerRef.current?.zoomOut(0.85);
  }, []);

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Quiet Unboxed Metadata Header */}
      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-[#a59ecc] px-1">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="text-white font-extrabold tracking-wide whitespace-nowrap">
            Question {slotInfo.index}
          </span>
          {question.category ? (
            <>
              <span aria-hidden="true" className="text-[#4a4273]">·</span>
              <span className="text-[#9aa0c0] truncate">{question.category}</span>
            </>
          ) : null}
        </div>
        <span className="font-bold text-[#00f5ff] tabular-nums whitespace-nowrap shrink-0">
          {answeredCount}/{Math.max(1, liveCount)} answered
        </span>
      </div>

      {/* 3D Trivia Challenge Monitor (Locked to Float motion; scroll/pinch zoom enabled; rotation locked) */}
      <div ref={stageWrapperRef} className="w-full flex flex-col items-center gap-2.5">
        {!webglUnavailable ? (
          <div
            ref={slotContainerRef}
            className="rounded-2xl overflow-hidden border border-[#38bdf8]/20 bg-[#060918]/70 shadow-[0_18px_50px_rgba(6,10,30,0.65)]"
            style={{ width: '100%', height: '420px' }}
          >
            <TriviaChallenge3DWidget
              question={question.question}
              options={question.options}
              correctIndex={question.correctAnswer}
              selectedOption={myAnswer}
              timerSeconds={initialRemainingSeconds}
              maxTimerSeconds={maxTimerSeconds}
              timerRunning={false}
              locked={hasAnswered}
              motionMode="float"
              background="transparent"
              showStudioFloor={false}
              enableOrbit={true}
              enableRotate={false}
              enableSoundFeedback={true}
              onSelectOption={handleWidgetSelect}
              onContextLost={(lost) => setWebglUnavailable(lost)}
              onControllerReady={(ctrl) => {
                controllerRef.current = ctrl;
              }}
            />
          </div>
        ) : (
          /* Graceful 2D Fallback if WebGL context is unavailable */
          <div className="w-full rounded-2xl bg-[#0c051f] border border-[#38bdf8]/35 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7dd3fc] font-mono tabular-nums">
              <span>Interactive 3D fallback view</span>
              <span>{fallbackRemainingSecs}s</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug text-center">
              {question.question}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options.map((option, idx) => {
                const isCorrect = revealed && idx === question.correctAnswer;
                const isWrong = revealed && idx === myAnswer && idx !== question.correctAnswer;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold text-left transition-colors ${
                      isCorrect
                        ? 'border-[#2ecc71] bg-[#2ecc71]/20 text-white'
                        : isWrong
                        ? 'border-[#ff4d6d] bg-[#ff4d6d]/20 text-white'
                        : 'border-[#2a2e4a] bg-[#191c2e] text-[#eef0ff] hover:border-[#38bdf8]'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-[#262b47] flex items-center justify-center text-xs font-black shrink-0">
                      {letters[idx]}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer Outcome Feedback Banner */}
        {revealed && (
          <div
            className={`w-full p-3 sm:p-3.5 rounded-xl text-center font-bold text-sm border transition-all ${
              myAnswer === question.correctAnswer
                ? 'bg-[#2ecc71]/15 border-[#2ecc71]/70 text-[#6ee7b7]'
                : 'bg-[#ff4d6d]/15 border-[#ff4d6d]/70 text-[#fda4af]'
            }`}
          >
            {myAnswer === question.correctAnswer ? (
              <span className="tabular-nums">Correct! +{lastGain} points</span>
            ) : myAnswer === -1 ? (
              <span>
                Time&apos;s up! Correct answer:{' '}
                <strong className="text-white underline decoration-[#38bdf8]">
                  {question.options[question.correctAnswer]}
                </strong>
              </span>
            ) : (
              <span>
                Incorrect! Correct answer:{' '}
                <strong className="text-white underline decoration-[#38bdf8]">
                  {question.options[question.correctAnswer]}
                </strong>
              </span>
            )}
          </div>
        )}

        {/* 3D Zoom In & Zoom Out Controls replacing the bottom control buttons */}
        {!webglUnavailable && (
          <div className="flex flex-col items-center gap-1 pt-0.5">
            {!zoomWebglLost ? (
              <div
                ref={zoomSlotRef}
                className="rounded-xl overflow-hidden border border-[#38bdf8]/20 bg-[#080d22]/85"
                style={{ width: '280px', height: '168px' }}
              >
                <ZoomControls3DWidget
                  initialZoom={100}
                  minZoom={50}
                  maxZoom={200}
                  step={15}
                  motionMode="float"
                  background="transparent"
                  showStudioFloor={false}
                  enableOrbit={false}
                  enableSoundFeedback={true}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onContextLost={(lost) => setZoomWebglLost(lost)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="px-3.5 py-2 rounded-lg bg-[#160f35] border border-[#38bdf8]/40 text-xs font-bold text-[#7dd3fc] hover:text-white cursor-pointer"
                >
                  Zoom In
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="px-3.5 py-2 rounded-lg bg-[#160f35] border border-[#38bdf8]/40 text-xs font-bold text-[#7dd3fc] hover:text-white cursor-pointer"
                >
                  Zoom Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
