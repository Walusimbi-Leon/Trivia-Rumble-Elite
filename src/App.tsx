import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Question, GameState, CurrentSlotInfo } from './types';
import { initDiscord, inDiscordFrame, openExternalUrl } from './discord';
import { dbRead, dbReadRange, dbWrite, dbUpdate } from './firebaseClient';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { Leaderboard } from './components/Leaderboard';
import { LegalModal } from './components/LegalModal';

const SLOT_DURATION = 20000;
// Updated donation dashboard URL
const SUPPORT_URL = 'https://donate-to-sgss.pages.dev';
const P = 'trivia/global';

function guestNameFromId(gid: string): string {
  let sum = 0;
  for (const c of gid) sum = (sum * 31 + c.charCodeAt(0)) % 997;
  return 'Guest ' + (100 + (sum % 900));
}

const isLive = (p?: Player | null, myId?: string): boolean => {
  if (!p) return false;
  if (myId && p.id === myId) return true;
  return Boolean(p.online && p.lastSeen && Date.now() - Number(p.lastSeen) < 180000);
};

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [me, setMe] = useState<Player>({
    id: 'guest',
    username: 'Guest',
    avatarUrl: '',
    platform: 'browser',
    score: 0,
    online: true,
    lastSeen: Date.now(),
  });

  const [game, setGame] = useState<GameState | null>(null);
  const [bank, setBank] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [answers, setAnswers] = useState<Record<string, { answer: number; at: number }>>({});

  const [currentSlotInfo, setCurrentSlotInfo] = useState<CurrentSlotInfo | null>(null);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [lastGain, setLastGain] = useState<number>(0);

  // Legal modal
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Refs for smooth execution without unnecessary re-renders
  const meRef = useRef<Player>(me);
  meRef.current = me;

  const gameRef = useRef<GameState | null>(game);
  gameRef.current = game;

  const bankRef = useRef<Question[]>(bank);
  bankRef.current = bank;

  const clockOffsetRef = useRef<number>(0);
  const currentSlotRef = useRef<number>(-1);
  const hasAnsweredRef = useRef<boolean>(false);
  hasAnsweredRef.current = hasAnswered;

  const now = useCallback(() => Date.now() + clockOffsetRef.current, []);

  // ── Sync Clock & Game State ────────────────────────────────────────────────
  const syncTime = useCallback(async () => {
    try {
      const res = await fetch('/api/time');
      if (res.ok) {
        const data = await res.json();
        clockOffsetRef.current = data.now - Date.now();
        if (data.game) {
          setGame(data.game);
        }
      }
    } catch (e) {
      // keep existing offset
    }
  }, []);

  // ── Resolve Identity ───────────────────────────────────────────────────────
  const resolveIdentity = async (): Promise<Player> => {
    try {
      const discordInfo = await initDiscord();
      if (discordInfo.user) {
        return {
          id: 'u' + discordInfo.user.id,
          username: discordInfo.user.global_name || discordInfo.user.username || 'Player',
          avatarUrl: discordInfo.user.avatar
            ? `https://cdn.discordapp.com/avatars/${discordInfo.user.id}/${discordInfo.user.avatar}.png`
            : '',
          platform: 'discord',
          score: 0,
          online: true,
          lastSeen: Date.now(),
        };
      }
    } catch (err) {
      console.warn('Discord identity resolution fallback:', err);
    }

    // Browser guest: stable id in localStorage
    const key = inDiscordFrame ? 'tre_guest_id_discord' : 'tre_guest_id';
    let gid: string | null = null;
    try {
      gid = localStorage.getItem(key);
    } catch (e) {
      /* private browsing */
    }

    if (!gid) {
      gid = 'g' + Math.random().toString(36).slice(2, 10);
      try {
        localStorage.setItem(key, gid);
      } catch (e) {
        /* ignore */
      }
    }

    return {
      id: gid,
      username: guestNameFromId(gid),
      avatarUrl: '',
      platform: 'browser',
      score: 0,
      online: true,
      lastSeen: Date.now(),
    };
  };

  // ── Load Bank ──────────────────────────────────────────────────────────────
  const loadBank = useCallback(async () => {
    const rawBank = await dbRead<any>(`${P}/bank`);
    if (rawBank && typeof rawBank === 'object') {
      const list = Object.keys(rawBank)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => rawBank[k])
        .filter((q) => q && q.question && Array.isArray(q.options));
      if (list.length > 0) {
        setBank(list);
        return list;
      }
    }
    return [];
  }, []);

  // ── Join Global Room ───────────────────────────────────────────────────────
  const joinGlobal = async (initialUser: Player) => {
    const existing = await dbRead<Player>(`${P}/players/${initialUser.id}`).catch(() => null);
    let finalUser = { ...initialUser };

    if (existing && typeof existing === 'object') {
      finalUser = {
        ...initialUser,
        score: typeof existing.score === 'number' ? existing.score : 0,
        joinedAt: existing.joinedAt || Date.now(),
        online: true,
        lastSeen: Date.now(),
      };
      await dbUpdate(`${P}/players/${initialUser.id}`, {
        username: finalUser.username,
        avatarUrl: finalUser.avatarUrl,
        platform: finalUser.platform,
        online: true,
        lastSeen: Date.now(),
      });
    } else {
      await dbWrite(`${P}/players/${initialUser.id}`, {
        id: finalUser.id,
        username: finalUser.username,
        avatarUrl: finalUser.avatarUrl,
        platform: finalUser.platform,
        score: 0,
        online: true,
        lastSeen: Date.now(),
        joinedAt: Date.now(),
      });
    }

    setMe(finalUser);
    setPlayers((prev) => ({
      ...prev,
      [finalUser.id]: finalUser,
    }));
    return finalUser;
  };

  // ── Presence Heartbeat ─────────────────────────────────────────────────────
  useEffect(() => {
    const beat = async () => {
      const current = meRef.current;
      if (!current.id || current.id === 'guest') return;
      try {
        await dbUpdate(`${P}/players/${current.id}`, {
          online: document.visibilityState !== 'hidden',
          lastSeen: Date.now(),
        });
      } catch (e) {
        /* ignore */
      }
    };

    beat();
    const interval = setInterval(beat, 25000);
    document.addEventListener('visibilitychange', beat);

    const onUnload = () => {
      const current = meRef.current;
      if (current.id) {
        dbUpdate(`${P}/players/${current.id}`, { online: false, lastSeen: Date.now() }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  // ── Sync Players & Leaderboard Polling ──────────────────────────────────────
  const syncPlayers = useCallback(async () => {
    try {
      const top = await dbReadRange<Record<string, Player>>(`${P}/players`, {
        orderBy: '"$key"',
        limitToLast: '80',
      });
      const self = await dbRead<Player>(`${P}/players/${meRef.current.id}`);

      setPlayers((prev) => {
        const next = { ...prev };
        if (top && typeof top === 'object') {
          for (const [k, p] of Object.entries(top)) {
            if (p && typeof p === 'object') {
              next[k] = { ...p, id: p.id || k };
            }
          }
        }
        const localScore = meRef.current.score || 0;
        const serverScore = typeof self?.score === 'number' ? self.score : 0;
        // Never allow score to drop: resolve to highest known score
        const resolvedScore = Math.max(localScore, serverScore);

        const myProfile: Player = {
          ...meRef.current,
          ...(self || {}),
          online: true,
          lastSeen: Date.now(),
          score: resolvedScore,
        };

        next[meRef.current.id] = myProfile;

        // If local had a newer score that wasn't reflected yet, persist it
        if (localScore > serverScore) {
          dbUpdate(`${P}/players/${meRef.current.id}`, { score: resolvedScore }).catch(() => {});
        }

        setMe((m) => (m.score !== resolvedScore ? { ...m, score: resolvedScore } : m));
        return next;
      });
    } catch (e) {
      /* ignore */
    }
  }, []);

  // ── Initial Boot ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setLoading(true);
        await syncTime();
        const resolved = await resolveIdentity();
        if (!mounted) return;

        await joinGlobal(resolved);
        await loadBank();

        const all = await dbRead<Record<string, Player>>(`${P}/players`).catch(() => null);
        if (mounted && all && typeof all === 'object') {
          const normalized: Record<string, Player> = {};
          for (const [k, p] of Object.entries(all)) {
            if (p && typeof p === 'object') {
              normalized[k] = { ...p, id: p.id || k };
            }
          }
          setPlayers(normalized);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Boot error:', err);
        if (mounted) {
          setErrorMsg(err.message || 'Failed to initialize game');
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, [syncTime, loadBank]);

  // Periodic Leaderboard sync
  useEffect(() => {
    const interval = setInterval(syncPlayers, 5000);
    const clockInterval = setInterval(syncTime, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [syncPlayers, syncTime]);

  // ── Continuous Question Slot Advancement (Zero-Lag Engine) ─────────────────
  useEffect(() => {
    const checkSlot = () => {
      const g = gameRef.current;
      const b = bankRef.current;
      if (!g || !g.questionStart || !b.length) return;

      const duration = g.slotDuration || SLOT_DURATION;
      const elapsed = Math.max(0, now() - g.questionStart);
      const slot = Math.floor(elapsed / duration);
      const realSlot = slot % b.length;
      const q = b[realSlot];

      if (!q) return;

      // Slot transition: New question arrives
      if (slot !== currentSlotRef.current) {
        currentSlotRef.current = slot;
        setMyAnswer(null);
        setHasAnswered(false);
        setRevealed(false);
        setLastGain(0);
        setAnswers({});

        const slotStart = g.questionStart + slot * duration;
        const slotEnd = slotStart + duration;

        setCurrentSlotInfo({
          slot,
          realSlot,
          index: slot + 1,
          question: q,
          slotStart,
          slotEnd,
        });

        // Load existing answers for this slot
        dbRead<Record<string, { answer: number; at: number }>>(`${P}/answers/${realSlot}`)
          .then((data) => {
            if (data && typeof data === 'object') setAnswers(data);
          })
          .catch(() => {});
      }
    };

    checkSlot();
    const interval = setInterval(checkSlot, 400);
    return () => clearInterval(interval);
  }, [now]);

  // Handle timer expiration without state thrashing
  const handleTimeUp = useCallback(() => {
    if (!hasAnsweredRef.current) {
      setMyAnswer(-1);
      setHasAnswered(true);
      setRevealed(true);
    }
  }, []);

  // ── Option Selection & Scoring ─────────────────────────────────────────────
  const handleSelectOption = async (idx: number) => {
    if (hasAnsweredRef.current || !currentSlotInfo) return;

    const remainingSecs = (currentSlotInfo.slotEnd - now()) / 1000;
    // Guard: if < 3s remaining, reject late answer
    if (remainingSecs < 3) {
      setHasAnswered(true);
      setMyAnswer(-1);
      setRevealed(true);
      setLastGain(0);
      return;
    }

    setHasAnswered(true);
    setMyAnswer(idx);

    const at = now();
    const elapsed = Math.max(0, at - currentSlotInfo.slotStart);
    const isCorrect = idx === currentSlotInfo.question.correctAnswer;
    const gain = isCorrect ? Math.max(10, Math.floor(100 - (elapsed / 1000) * 5)) : 0;

    setLastGain(gain);
    setRevealed(true);

    // Optimistic local update
    setAnswers((prev) => ({
      ...prev,
      [me.id]: { answer: idx, at },
    }));

    // Record answer in Firebase
    dbUpdate(`${P}/answers/${currentSlotInfo.realSlot}/${me.id}`, { answer: idx, at }).catch((e) => {
      console.warn('Answer sync failed:', e);
    });

    if (isCorrect) {
      const nextScore = (me.score || 0) + gain;
      const updatedUser: Player = { ...me, score: nextScore };
      setMe(updatedUser);
      setPlayers((prev) => ({
        ...prev,
        [me.id]: updatedUser,
      }));

      // Immediately write score to Firebase
      dbUpdate(`${P}/players/${me.id}`, { score: nextScore }).catch((e) => {
        console.warn('Score sync failed:', e);
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <div className="w-9 h-9 border-3 border-white/20 border-t-[#7c5cff] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#9aa0c0]">Connecting to the arena…</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-white">Something went wrong</h2>
          <p className="text-xs text-[#9aa0c0] leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#4fc3f7] text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  // Always count at least 1 (the current player) plus any active players
  const liveCount = Math.max(1, Object.values(players).filter((p) => isLive(p, me.id)).length);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header player={me} />

      {/* Main Game Container */}
      <main className="flex-1 w-full max-w-[920px] mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 md:gap-5 items-start">
          {/* Main Column: Trivia Arena */}
          <div className="min-w-0">
            {currentSlotInfo ? (
              <QuestionCard
                slotInfo={currentSlotInfo}
                clockOffset={clockOffsetRef.current}
                totalDurationMs={game?.slotDuration || SLOT_DURATION}
                myAnswer={myAnswer}
                hasAnswered={hasAnswered}
                revealed={revealed}
                lastGain={lastGain}
                answeredCount={answeredCount}
                liveCount={liveCount}
                onSelectOption={handleSelectOption}
                onTimeUp={handleTimeUp}
              />
            ) : (
              <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-8 text-center text-[#9aa0c0] text-sm">
                Preparing questions...
              </div>
            )}
          </div>

          {/* Side Column: Global Leaderboard */}
          <div>
            <Leaderboard players={players} currentPlayer={me} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-4 text-xs text-[#9aa0c0] border-t border-[#2a2e4a]/50 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <button
          onClick={() => setLegalModalType('privacy')}
          className="hover:text-white transition-colors cursor-pointer text-xs"
        >
          Privacy Policy
        </button>
        <span className="text-[#3d446b] select-none">·</span>
        <button
          onClick={() => setLegalModalType('terms')}
          className="hover:text-white transition-colors cursor-pointer text-xs"
        >
          Terms of Service
        </button>
        <span className="text-[#3d446b] select-none">·</span>
        <button
          onClick={() => openExternalUrl(SUPPORT_URL)}
          className="cursor-pointer text-sm font-bold bg-[#ffd166]/15 hover:bg-[#ffd166]/25 border border-[#ffd166]/40 hover:border-[#ffd166]/70 text-[#ffd166] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <span className="text-base">💛</span>
          <span>Support Developer</span>
        </button>
      </footer>

      {/* Legal Modal */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
  );
}
