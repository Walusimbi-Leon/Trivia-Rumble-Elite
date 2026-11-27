import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { CurrentSlotInfo } from '../types';
import { TriviaChallenge3DWidget } from '../trivia-challenge-3d-widget/TriviaChallenge3DWidget';
import { applyTriviaChallenge3DSize } from '../trivia-challenge-3d-widget/trivia-challenge-sizing.js';
import type {
  TriviaChallenge3DController,
  TriviaChallengeMotionMode,
} from '../trivia-challenge-3d-widget/trivia-challenge-3d';

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

const MOTION_MODES: Array<{ id: TriviaChallengeMotionMode; label: string }> = [
  { id: 'float', label: 'Float' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'tilt', label: 'Tilt' },
];

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
  const controllerRef = useRef<TriviaChallenge3DController | null>(null);
  const timeUpFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onSelectOptionRef = useRef(onSelectOption);
  onTimeUpRef.current = onTimeUp;
  onSelectOptionRef.current = onSelectOption;

  const [motionMode, setMotionMode] = useState<TriviaChallengeMotionMode>('float');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sizeScale, setSizeScale] = useState(1.0);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [fallbackRemainingSecs, setFallbackRemainingSecs] = useState(() =>
    Math.max(0, Math.ceil((slotInfo.slotEnd - (Date.now() + clockOffset)) / 1000))
  );

  // Compute initial synchronized seconds on slot change
  const initialRemainingSeconds = Math.max(
    0,
    (slotInfo.slotEnd - (Date.now() + clockOffset)) / 1000
  );
  const maxTimerSeconds = Math.max(1, totalDurationMs / 1000);

  // Sync 3D monitor container size responsively via trivia-challenge-sizing.js
  useEffect(() => {
    const wrapper = stageWrapperRef.current;
    const slotEl = slotContainerRef.current;
    if (!wrapper || !slotEl) return;

    const updateSize = () => {
      const availW = Math.max(240, Math.floor(wrapper.clientWidth));
      const baseW = Math.min(availW, 760);
      const targetW = Math.min(availW, Math.max(240, Math.round(baseW * sizeScale)));
      const targetH = Math.max(210, Math.round(targetW * 0.625));
      applyTriviaChallenge3DSize(slotEl, { width: targetW, height: targetH });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [sizeScale]);

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

  const handleSmaller = () => setSizeScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))));
  const handleBigger = () => setSizeScale((s) => Math.min(1.15, Number((s + 0.15).toFixed(2))));

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

      {/* 3D Trivia Challenge Monitor Replacing Question Card, Answers Card, and Timer */}
      <div ref={stageWrapperRef} className="w-full flex flex-col items-center">
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
              motionMode={motionMode}
              background="transparent"
              showStudioFloor={false}
              enableOrbit={true}
              enableSoundFeedback={soundEnabled}
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
      </div>

      {/* Answer Outcome Feedback Banner */}
      {revealed && (
        <div
          className={`p-3 sm:p-3.5 rounded-xl text-center font-bold text-sm border transition-all ${
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

      {/* Compact Control Dock Below the 3D Stage */}
      {!webglUnavailable && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0e0824]/90 border border-[#3b2568]/60 text-xs">
          {/* Motion Mode Selector */}
          <div className="flex items-center gap-1 bg-[#160f35] p-0.5 rounded-lg border border-[#2d2154]">
            {MOTION_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMotionMode(m.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  motionMode === m.id
                    ? 'bg-[#38bdf8]/20 text-[#7dd3fc] border border-[#38bdf8]/40'
                    : 'text-[#9aa0c0] hover:text-white border border-transparent'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sizing, Sound & Camera Reset */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSmaller}
              disabled={sizeScale <= 0.6}
              title="Smaller 3D Monitor"
              aria-label="Make 3D monitor smaller"
              className="p-1.5 rounded-lg bg-[#160f35] border border-[#2d2154] text-[#9aa0c0] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={handleBigger}
              disabled={sizeScale >= 1.15}
              title="Larger 3D Monitor"
              aria-label="Make 3D monitor larger"
              className="p-1.5 rounded-lg bg-[#160f35] border border-[#2d2154] text-[#9aa0c0] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'Mute 3D feedback sound' : 'Unmute 3D feedback sound'}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className="px-2.5 py-1.5 rounded-lg bg-[#160f35] border border-[#2d2154] text-[#9aa0c0] hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={14} className="text-[#7dd3fc]" /> : <VolumeX size={14} />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={() => controllerRef.current?.resetCamera()}
              title="Reset 3D camera angle"
              aria-label="Center 3D view"
              className="px-2.5 py-1.5 rounded-lg bg-[#160f35] border border-[#2d2154] text-[#9aa0c0] hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Center</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
