import React from 'react';

interface HexOptionButtonProps {
  letter: string;
  text: string;
  index: number;
  revealed: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isDimmed: boolean;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const HexOptionButton: React.FC<HexOptionButtonProps> = ({
  letter,
  text,
  revealed,
  isCorrect,
  isWrong,
  isDimmed,
  isSelected,
  disabled,
  onClick,
}) => {
  // Determine styling based on game state
  let borderClasses = 'border-[#2d1b54] hover:border-[#00f5ff]/60 group-hover:border-[#00f5ff]';
  let bgClasses = 'bg-[#12082b]/90 hover:bg-[#1b0d3d]';
  let badgeClasses = 'bg-[#2d1b54] text-[#a59ecc] group-hover:bg-[#00f5ff]/20 group-hover:text-[#00f5ff]';
  let textClasses = 'text-white/90 group-hover:text-white';
  let glowClasses = 'hover:shadow-[0_0_16px_rgba(0,245,255,0.25)]';

  if (revealed) {
    if (isCorrect) {
      borderClasses = 'border-[#2ecc71] shadow-[0_0_20px_rgba(46,204,113,0.5)]';
      bgClasses = 'bg-[#2ecc71]/20';
      badgeClasses = 'bg-[#2ecc71] text-black font-extrabold';
      textClasses = 'text-[#2ecc71] font-bold';
      glowClasses = '';
    } else if (isWrong) {
      borderClasses = 'border-[#ff4d6d] shadow-[0_0_20px_rgba(255,77,109,0.5)]';
      bgClasses = 'bg-[#ff4d6d]/20';
      badgeClasses = 'bg-[#ff4d6d] text-white font-extrabold';
      textClasses = 'text-[#ff4d6d]';
      glowClasses = '';
    } else if (isDimmed) {
      borderClasses = 'border-[#22153e]/60 opacity-40';
      bgClasses = 'bg-[#0b041c]/60';
      badgeClasses = 'bg-[#1b1033] text-gray-500';
      textClasses = 'text-gray-400';
      glowClasses = '';
    }
  } else if (isSelected) {
    borderClasses = 'border-[#00f5ff] shadow-[0_0_22px_rgba(0,245,255,0.45)] ring-1 ring-[#00f5ff]';
    bgClasses = 'bg-[#00f5ff]/15';
    badgeClasses = 'bg-[#00f5ff] text-black font-extrabold';
    textClasses = 'text-white font-bold';
    glowClasses = '';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-150 text-left w-full cursor-pointer disabled:cursor-default active:scale-[0.98] ${borderClasses} ${bgClasses} ${glowClasses}`}
    >
      {/* Letter badge (A, B, C, D) */}
      <span
        className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-colors shrink-0 shadow-sm ${badgeClasses}`}
      >
        {letter}
      </span>

      {/* Answer text */}
      <span className={`text-sm sm:text-base font-medium leading-snug tracking-wide flex-1 break-words ${textClasses}`}>
        {text}
      </span>
    </button>
  );
};
