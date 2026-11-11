import React, { useRef, useEffect } from 'react';
import { Player } from '../types';
import { CrownIcon, DiscordIcon, GlobeIcon, StarIcon } from './Icons';

interface LeaderboardProps {
  players: Record<string, Player>;
  currentPlayer: Player;
}

const LIVE_STALE_MS = 180000; // 3 min without heartbeat = offline

export const isPlayerLive = (p?: Player | null): boolean => {
  if (!p) return false;
  return Boolean(p.online && p.lastSeen && Date.now() - Number(p.lastSeen) < LIVE_STALE_MS);
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, currentPlayer }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const myRowRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef(false);

  // Ensure every player has a valid ID, and deduplicate by ID
  const playerMap = new Map<string, Player>();
  for (const [key, p] of Object.entries(players)) {
    if (!p || typeof p !== 'object') continue;
    const resolvedId = String(p.id || key).trim();
    if (!resolvedId) continue;
    playerMap.set(resolvedId, {
      ...p,
      id: resolvedId,
    });
  }

  // Ensure current player is present and marked live
  if (currentPlayer && currentPlayer.id) {
    const existing = playerMap.get(currentPlayer.id);
    playerMap.set(currentPlayer.id, {
      ...existing,
      ...currentPlayer,
      id: currentPlayer.id,
      online: true,
      lastSeen: Date.now(),
    });
  }

  const allPlayers = Array.from(playerMap.values());

  // Sort strictly by score descending, then by lastSeen descending
  const sorted = allPlayers.sort(
    (a, b) => (b.score || 0) - (a.score || 0) || (b.lastSeen || 0) - (a.lastSeen || 0)
  );

  const myIdx = sorted.findIndex((p) => p.id === currentPlayer.id);
  const myRank = myIdx >= 0 ? myIdx + 1 : sorted.length;
  // Always at least 1 (the current user playing)
  const liveCount = Math.max(1, sorted.filter(isPlayerLive).length);

  // True ranking order without artificial dividers or forced #8 pinning
  const ranked = sorted.map((p, i) => ({ p, rank: i + 1 }));

  // Automatically aim at current user's row by default, and follow them as they move up
  useEffect(() => {
    if (!myRowRef.current || !scrollContainerRef.current) return;

    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      const row = myRowRef.current;
      if (!container || !row) return;

      // Calculate target scrollTop to keep user row nicely centered in view
      const targetScrollTop =
        row.offsetTop - container.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: hasInitialScrolledRef.current ? 'smooth' : 'auto',
      });

      hasInitialScrolledRef.current = true;
    }, 80);

    return () => clearTimeout(timer);
  }, [myRank, currentPlayer.score]);

  const scrollToMyPosition = () => {
    if (myRowRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const row = myRowRef.current;
      const targetScrollTop =
        row.offsetTop - container.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ffe08a] via-[#ffb347] to-[#e8921e] text-[#6b3a00] flex items-center justify-center font-extrabold text-[11px] shadow-sm shadow-[#ffb347]/50"
          title="#1 Champion"
        >
          <CrownIcon size={12} className="text-[#6b3a00]" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f0f0f6] via-[#c9c9d6] to-[#9a9aac] text-[#3a3a48] flex items-center justify-center font-extrabold text-[10px] shadow-sm shadow-[#c9c9d6]/40"
          title="#2 Silver"
        >
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f2b98d] via-[#d9894a] to-[#b06a2c] text-[#4a2608] flex items-center justify-center font-extrabold text-[10px] shadow-sm shadow-[#d9894a]/40"
          title="#3 Bronze"
        >
          3
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#9aa0c0] flex items-center justify-center font-extrabold text-[10px]">
        {rank}
      </span>
    );
  };

  return (
    <aside className="w-full">
      <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-3.5 shadow-lg shadow-black/35 sticky top-16 max-h-[calc(100vh-80px)] flex flex-col">
        {/* Leaderboard Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#2a2e4a]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Leaderboard
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#9aa0c0]">
            <span>{sorted.length.toLocaleString()} players</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#2ecc71] bg-[#2ecc71]/10 border border-[#2ecc71]/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse" />
              {liveCount} live
            </span>
          </div>
        </div>

        {/* Scrollable Player Rows (Auto-aimed at user row by default) */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto space-y-1.5 pr-1 flex-1 scroll-smooth"
        >
          {ranked.map((item, idx) => {
            const { p, rank } = item;
            const isMe = p.id === currentPlayer.id;
            const isFirst = rank === 1;
            const isOffline = !isPlayerLive(p);
            const initial = (p.username || '?').trim().charAt(0).toUpperCase() || '?';
            const rowKey = p.id ? `p-${p.id}` : `rank-${rank}-${idx}`;

            return (
              <div
                key={rowKey}
                ref={isMe ? myRowRef : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-300 ${
                  isMe
                    ? 'bg-gradient-to-r from-[#7c5cff]/35 to-[#7c5cff]/15 border border-[#7c5cff] shadow-md shadow-[#7c5cff]/30 font-semibold text-white ring-1 ring-[#7c5cff]'
                    : isFirst
                    ? 'bg-gradient-to-r from-[#ffd166]/15 to-transparent border border-[#ffd166]/30 text-white'
                    : 'bg-white/[0.02] border border-transparent text-[#eef0ff]'
                } ${isOffline ? 'opacity-45' : 'opacity-100'}`}
              >
                {/* Rank Number or Crown */}
                <div className="w-5 flex justify-center shrink-0">
                  {renderRankBadge(rank)}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border border-[#2a2e4a] bg-[#141624]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#4fc3f7] text-white text-[10px] font-bold items-center justify-center border border-[#2a2e4a] ${
                      p.avatarUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    {initial}
                  </div>
                </div>

                {/* Name */}
                <span className="flex-1 min-w-0 truncate text-[12px] font-medium flex items-center gap-1.5">
                  <span className="truncate">{p.username}</span>
                  {isMe && (
                    <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#7c5cff] text-white shrink-0 shadow-sm">
                      you
                    </span>
                  )}
                </span>

                {/* Platform Badge */}
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                    p.platform === 'discord'
                      ? 'bg-[#5865F2] text-white'
                      : 'bg-white/10 text-[#9aa0c0]'
                  }`}
                  title={p.platform === 'discord' ? 'Playing via Discord' : 'Playing in Browser'}
                >
                  {p.platform === 'discord' ? <DiscordIcon size={10} /> : <GlobeIcon size={10} />}
                </span>

                {/* Score */}
                <span className="font-extrabold text-[12px] text-[#ffd166] flex items-center gap-1 shrink-0">
                  <StarIcon size={11} className="text-[#ffd166]" />
                  {(p.score || 0).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Current Rank Footer (Clickable to jump to your row anytime) */}
        <button
          onClick={scrollToMyPosition}
          className="pt-2.5 mt-2 border-t border-[#2a2e4a] flex items-center justify-between text-xs text-[#9aa0c0] hover:text-white transition-colors cursor-pointer w-full text-left"
          title="Click to center your rank on the leaderboard"
        >
          <span>
            Your rank: <strong className="text-[#ffd166]">#{myRank}</strong>
          </span>
          <span className="flex items-center gap-1 font-bold text-[#ffd166]">
            <StarIcon size={11} />
            {(currentPlayer.score || 0).toLocaleString()} pts
          </span>
        </button>
      </div>
    </aside>
  );
};
