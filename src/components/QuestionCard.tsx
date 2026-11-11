import React from 'react';
import { CurrentSlotInfo } from '../types';
import { SmoothTimer } from './SmoothTimer';

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
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 w-full">
      {/* Question metadata row */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#a59ecc] px-1">
        <span className="text-white tracking-wide font-extrabold">
          Question {slotInfo.index}
        </span>
        <span className="flex items-center gap-1.5 font-black text-[#00f5ff] drop-shadow-[0_0_6px_rgba(0,245,255,0.7)]">
          <span>⚡</span>
          <span>
            {answeredCount}/{Math.max(1, liveCount)} answered
          </span>
        </span>
      </div>

      {/* Synchronized 60fps Countdown Bar */}
      <SmoothTimer
        slotStart={slotInfo.slotStart}
        slotEnd={slotInfo.slotEnd}
        slotDuration={totalDurationMs}
        clockOffset={clockOffset}
        onTimeUp={onTimeUp}
      />

      {/* Question Box */}
      <div className="relative rounded-2xl md:rounded-3xl p-[2px] bg-gradient-to-r from-[#d946ef] via-[#a855f7] to-[#00f5ff]/70 shadow-[0_0_28px_rgba(217,70,239,0.35)]">
        <div className="relative rounded-[14px] md:rounded-[22px] bg-[#0c051f]/85 backdrop-blur-md p-6 sm:p-8 md:p-10 border border-[#d946ef]/40 flex items-center justify-center min-h-[150px] sm:min-h-[175px] md:min-h-[195px] text-center shadow-inner">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug md:leading-normal tracking-wide drop-shadow-md">
            {question.question}
          </h2>
        </div>
      </div>

      {/* 2x2 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-1">
        {question.options.map((option, idx) => {
          let btnStyle = 'bg-[#191c2e]/90 border-[#2a2e4a] text-[#eef0ff] hover:border-[#7c5cff] hover:bg-[#7c5cff]/15';
          let letterStyle = 'bg-[#262b47] text-[#eef0ff]';

          if (revealed) {
            if (idx === question.correctAnswer) {
              btnStyle = 'border-[#2ecc71] bg-[#2ecc71]/20 text-white ring-2 ring-[#2ecc71] shadow-[0_0_15px_rgba(46,204,113,0.35)]';
              letterStyle = 'bg-[#2ecc71] text-white';
            } else if (idx === myAnswer) {
              btnStyle = 'border-[#ff4d6d] bg-[#ff4d6d]/20 text-white ring-2 ring-[#ff4d6d] shadow-[0_0_15px_rgba(255,77,109,0.35)]';
              letterStyle = 'bg-[#ff4d6d] text-white';
            } else {
              btnStyle = 'border-[#2a2e4a]/60 bg-[#191c2e]/40 opacity-40 text-[#9aa0c0]';
              letterStyle = 'bg-[#262b47]/50 text-[#9aa0c0]';
            }
          } else if (hasAnswered && idx === myAnswer) {
            btnStyle = 'border-[#7c5cff] bg-[#7c5cff]/30 text-white ring-2 ring-[#7c5cff]';
            letterStyle = 'bg-[#7c5cff] text-white';
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              disabled={hasAnswered}
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border text-sm md:text-[15px] font-semibold text-left transition-all duration-150 ${btnStyle} ${
                hasAnswered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-colors ${letterStyle}`}
              >
                {letters[idx]}
              </span>
              <span className="flex-1 leading-snug">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Answer Outcome Feedback Banner */}
      {revealed && (
        <div
          className={`p-3 sm:p-4 rounded-xl text-center font-black text-sm sm:text-base border transition-all animate-in fade-in zoom-in-95 duration-200 ${
            myAnswer === question.correctAnswer
              ? 'bg-[#2ecc71]/20 border-[#2ecc71] text-[#2ecc71] shadow-[0_0_15px_rgba(46,204,113,0.4)]'
              : 'bg-[#ff4d6d]/20 border-[#ff4d6d] text-[#ff4d6d] shadow-[0_0_15px_rgba(255,77,109,0.4)]'
          }`}
        >
          {myAnswer === question.correctAnswer ? (
            <span className="flex items-center justify-center gap-2">
              <span>✅</span>
              <span>Correct! +{lastGain} points</span>
            </span>
          ) : myAnswer === -1 ? (
            <span>
              ⏰ Time's up! The answer was: <strong className="text-white underline decoration-[#00f5ff]">{question.options[question.correctAnswer]}</strong>
            </span>
          ) : (
            <span>
              ❌ Incorrect! The answer was: <strong className="text-white underline decoration-[#00f5ff]">{question.options[question.correctAnswer]}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
