import React from 'react';
import { Player } from '../types';
import { StarIcon } from './Icons';

interface HeaderProps {
  player: Player;
}

export const Header: React.FC<HeaderProps> = ({ player }) => {
  const initial = (player.username || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 bg-[#09041a]/85 backdrop-blur-md border-b border-[#3b2568]/60 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl md:text-2xl select-none" role="img" aria-label="Game Controller">
            🎮
          </span>
          <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white whitespace-nowrap">
            Trivia Rumble <span className="text-[#00f5ff] font-extrabold drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]">Elite</span>
          </h1>
        </div>

        {/* Right Section: User Profile Chip */}
        <div className="flex items-center gap-2 bg-[#12092e]/80 border border-[#4a2e80]/80 rounded-full px-3 py-1 shadow-inner">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-[#00f5ff]/40 bg-[#140b30]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#00f5ff] text-white text-[11px] font-black items-center justify-center border border-[#00f5ff]/40 ${
              player.avatarUrl ? 'hidden' : 'flex'
            }`}
          >
            {initial}
          </div>

          <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[160px]">
            {player.username}
          </span>

          <span className="text-xs font-black text-[#ffd166] flex items-center gap-1">
            <StarIcon size={12} className="text-[#ffd166]" />
            {player.score || 0}
          </span>

          <span
            className={`hidden sm:inline-block text-[8.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase ${
              player.platform === 'discord'
                ? 'bg-[#5865F2] text-white shadow-sm shadow-[#5865F2]/40'
                : 'bg-[#26154d] text-[#b3a8e0] border border-[#4a2e80]'
            }`}
          >
            {player.platform === 'discord' ? 'Discord' : 'Browser'}
          </span>
        </div>
      </div>
    </header>
  );
};

