import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Question, GameState, CurrentSlotInfo } from './types';
import {
  initDiscord,
  inDiscordFrame,
  openExternalUrl,
  getDiscordAvatarUrl,
  getDiscordDisplayName,
} from './discord';
import { dbRead, dbReadRange, dbWrite, dbUpdate } from './firebaseClient';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { Leaderboard } from './components/Leaderboard';
import { LegalModal } from './components/LegalModal';
import { SgssIntroVideo } from './sgss-intro-video/SgssIntroVideo';
import { SupportDeveloper3DWidget } from './support-developer-3d-widget/SupportDeveloper3DWidget';
import { applySupportDeveloper3DSize } from './support-developer-3d-widget/support-developer-sizing.js';
import initialBankJson from './data/initial_bank.json';

const SLOT_DURATION = 20000;
// Stable global tournament epoch matching server.ts and Firebase /trivia/global/game
const DEFAULT_GAME_EPOCH = 1793995178901;

// Updated donation dashboard URL
const SUPPORT_URL = 'https://donate-to-sgss.pages.dev';

const P = 'trivia/global';

const FALLBACK_BANK: Question[] = (() => {
  const raw = initialBankJson as Record<string, any>;
  return Object.keys(raw)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => raw[k])
    .filter((q) => q && q.question && Array.isArray(q.options));
})();

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

function filterSlotAnswers(
  raw: Record<string, { answer: number; at: number }> | null | undefined,
  slotStart: number,
  slotEnd: number
): Record<string, { answer: number; at: number }> {
  if (!raw || typeof raw !== 'object') return {};
  const valid: Record<string, { answer: number; at: number }> = {};
  for (const [pid, rec] of Object.entries(raw)) {
    if (
      rec &&
      typeof rec === 'object' &&
      typeof rec.at === 'number' &&
      rec.at >= slotStart - 2000 &&
      rec.at <= slotEnd + 2000
    ) {
      valid[pid] = rec;
    }
  }
  return valid;
}

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [introStage, setIntroStage] = useState<'sgss' | 'done'>('sgss');
  const [leaderboardSynced, setLeaderboardSynced] = useState(false);
  const [monitorReady, setMonitorReady] = useState(false);
  const [sgssCycleDone, setSgssCycleDone] = useState(false);
  const [sgssIntroFading, setSgssIntroFading] = useState(false);
  const [supportWebglLost, setSupportWebglLost] = useState(false);
  const sgssCycleDoneRef = useRef(false);
  const supportSlotRef = useRef<HTMLDivElement | null>(null);
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
  const [bank, setBank] = useState<Question[]>(FALLBACK_BANK);
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

  const currentSlotInfoRef = useRef<CurrentSlotInfo | null>(currentSlotInfo);
  currentSlotInfoRef.current = currentSlotInfo;

  const clockOffsetRef = useRef<number>(0);
  const currentSlotRef = useRef<number>(-1);
  const hasAnsweredRef = useRef<boolean>(false);
  hasAnsweredRef.current = hasAnswered;

  const now = useCallback(() => Date.now() + clockOffsetRef.current, []);

  // ── Sync Clock & Game State ────────────────────────────────────────────────
  const syncTime = useCallback(async () => {
    try {
      const t0 = Date.now();
      const res = await fetch('/api/time', { cache: 'no-store' });
      const t1 = Date.now();
      if (res.ok) {
        const data = await res.json();
        const rttMid = (t0 + t1) / 2;
        if (typeof data.now === 'number') {
          clockOffsetRef.current = data.now - rttMid;
        }
        if (data.game) {
          const epoch = Number(data.game.startedAt) || Number(data.game.questionStart) || DEFAULT_GAME_EPOCH;
          const nextGame: GameState = {
            bankLen: Number(data.game.bankLen) || FALLBACK_BANK.length,
            slotDuration: Number(data.game.slotDuration) || SLOT_DURATION,
            startedAt: epoch,
            questionStart: epoch,
          };
          setGame(nextGame);
          return nextGame;
        }
      }
    } catch {
      // keep existing offset or use deterministic epoch fallback below
    }

    if (!gameRef.current) {
      const fbGame = await dbRead<GameState>(`${P}/game`).catch(() => null);
      const epoch = Number(fbGame?.startedAt) || Number(fbGame?.questionStart) || DEFAULT_GAME_EPOCH;
      const fallbackGame: GameState = {
        bankLen: Number(fbGame?.bankLen) || FALLBACK_BANK.length,
        slotDuration: Number(fbGame?.slotDuration) || SLOT_DURATION,
        startedAt: epoch,
        questionStart: epoch,
      };
      setGame(fallbackGame);
      return fallbackGame;
    }
    return gameRef.current;
  }, []);

  // ── Resolve Identity ───────────────────────────────────────────────────────
  const resolveIdentity = async (): Promise<Player> => {
    try {
      const discordInfo = await initDiscord();
      if (discordInfo.user) {
        return {
          id: 'u' + discordInfo.user.id,
          username: getDiscordDisplayName(discordInfo.user),
          avatarUrl: getDiscordAvatarUrl(discordInfo.user),
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
    } catch {
      /* private browsing */
    }
    if (!gid) {
      gid = 'g' + Math.random().toString(36).slice(2, 10);
      try {
        localStorage.setItem(key, gid);
      } catch {
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
    setBank(FALLBACK_BANK);
    return FALLBACK_BANK;
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

    meRef.current = finalUser;
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
      } catch {
        /* ignore */
      }
    };

    beat();
    const interval = setInterval(beat, 25000);
    document.addEventListener('visibilitychange', beat);

    const onUnload = () => {
      const current = meRef.current;
      if (current.id && current.id !== 'guest') {
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

  // ── Sync Players, Live Answers & Leaderboard Polling ───────────────────────
  const syncPlayers = useCallback(async () => {
    const currentMe = meRef.current;
    if (!currentMe.id || currentMe.id === 'guest') return;

    try {
      const activeSlot = currentSlotInfoRef.current;
      const [top, self, slotAnswers] = await Promise.all([
        dbReadRange<Record<string, Player>>(`${P}/players`, {
          orderBy: '"$key"',
          limitToLast: '80',
        }),
        dbRead<Player>(`${P}/players/${currentMe.id}`),
        activeSlot
          ? dbRead<Record<string, { answer: number; at: number }>>(`${P}/answers/${activeSlot.realSlot}`)
          : Promise.resolve(null),
      ]);

      const localScore = meRef.current.score || 0;
      const serverScore = typeof self?.score === 'number' ? self.score : 0;
      const resolvedScore = Math.max(localScore, serverScore);

      const myProfile: Player = {
        ...meRef.current,
        ...(self || {}),
        username: meRef.current.platform === 'discord' ? meRef.current.username : (self?.username || meRef.current.username),
        avatarUrl: meRef.current.platform === 'discord' ? meRef.current.avatarUrl : (self?.avatarUrl ?? meRef.current.avatarUrl),
        platform: meRef.current.platform === 'discord' ? 'discord' : (self?.platform || meRef.current.platform),
        online: true,
        lastSeen: Date.now(),
        score: resolvedScore,
      };

      setPlayers((prev) => {
        const next = { ...prev };
        if (top && typeof top === 'object') {
          for (const [k, p] of Object.entries(top)) {
            if (p && typeof p === 'object') {
              next[k] = { ...p, id: p.id || k };
            }
          }
        }
        next[myProfile.id] = myProfile;
        return next;
      });

      if (meRef.current.score !== resolvedScore) {
        setMe((m) => (m.score !== resolvedScore ? { ...m, score: resolvedScore } : m));
      }

      if (localScore > serverScore) {
        dbUpdate(`${P}/players/${myProfile.id}`, { score: resolvedScore }).catch(() => {});
      }

      if (activeSlot && slotAnswers && currentSlotInfoRef.current?.slot === activeSlot.slot) {
        setAnswers(filterSlotAnswers(slotAnswers, activeSlot.slotStart, activeSlot.slotEnd));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Initial Boot ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        setLoading(true);
        const [, , resolved] = await Promise.all([
          syncTime(),
          loadBank(),
          resolveIdentity(),
        ]);
        if (!mounted) return;
        await joinGlobal(resolved);

        const all = await dbRead<Record<string, Player>>(`${P}/players`).catch(() => null);
        if (mounted && all && typeof all === 'object') {
          const normalized: Record<string, Player> = {};
          for (const [k, p] of Object.entries(all)) {
            if (p && typeof p === 'object') {
              normalized[k] = { ...p, id: p.id || k };
            }
          }
          if (meRef.current.id && meRef.current.id !== 'guest') {
            normalized[meRef.current.id] = meRef.current;
          }
          setPlayers(normalized);
        }

        if (mounted) {
          setLeaderboardSynced(true);
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

  // Periodic Leaderboard & Clock sync
  useEffect(() => {
    const interval = setInterval(syncPlayers, 4000);
    const clockInterval = setInterval(syncTime, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [syncPlayers, syncTime]);

  // ── Continuous Question Slot Advancement (Global Synchronized Engine) ──────
  useEffect(() => {
    const checkSlot = () => {
      const g = gameRef.current;
      const b = bankRef.current;
      if (!g || !b.length) return;

      // Always anchor slot math on the fixed tournament epoch (`startedAt`),
      // never on a shifting per-slot timestamp, so every player sees the same question.
      const epoch = g.startedAt || g.questionStart || DEFAULT_GAME_EPOCH;
      const duration = g.slotDuration || SLOT_DURATION;
      const elapsed = Math.max(0, now() - epoch);
      const slot = Math.floor(elapsed / duration);
      const realSlot = slot % b.length;
      const q = b[realSlot];
      if (!q) return;

      // Slot transition: New question arrives synchronously for everyone
      if (slot !== currentSlotRef.current) {
        currentSlotRef.current = slot;
        setMyAnswer(null);
        setHasAnswered(false);
        setRevealed(false);
        setLastGain(0);
        setAnswers({});

        const slotStart = epoch + slot * duration;
        const slotEnd = slotStart + duration;
        const nextSlotInfo: CurrentSlotInfo = {
          slot,
          realSlot,
          index: slot + 1,
          question: q,
          slotStart,
          slotEnd,
        };
        currentSlotInfoRef.current = nextSlotInfo;
        setCurrentSlotInfo(nextSlotInfo);

        // Load active round answers only (filtering out older cycle rounds)
        dbRead<Record<string, { answer: number; at: number }>>(`${P}/answers/${realSlot}`)
          .then((data) => {
            if (currentSlotRef.current !== slot) return;
            const valid = filterSlotAnswers(data, slotStart, slotEnd);
            setAnswers(valid);
            const mine = meRef.current.id ? valid[meRef.current.id] : undefined;
            if (mine && typeof mine.answer === 'number' && !hasAnsweredRef.current) {
              setMyAnswer(mine.answer);
              setHasAnswered(true);
              setRevealed(true);
            }
          })
          .catch(() => {});
      }
    };

    checkSlot();
    const interval = setInterval(checkSlot, 250);
    return () => clearInterval(interval);
  }, [now, game, bank]);

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
      meRef.current = updatedUser;
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

  const handleMonitorReady = useCallback(() => {
    setMonitorReady(true);
  }, []);

  // Re-sync leaderboard & active slot answers in the background while SGSS Intro Video plays
  useEffect(() => {
    if (introStage !== 'sgss' || loading) return;
    let active = true;
    syncPlayers().finally(() => {
      if (active) setLeaderboardSynced(true);
    });
    return () => {
      active = false;
    };
  }, [introStage, loading, syncPlayers]);

  // Safety failsafe if strict autoplay throttles video progress callbacks on locked WebViews
  useEffect(() => {
    if (introStage !== 'sgss') return;
    const timer = window.setTimeout(() => {
      if (!sgssCycleDoneRef.current) {
        sgssCycleDoneRef.current = true;
        setSgssCycleDone(true);
      }
    }, 12500);
    return () => window.clearTimeout(timer);
  }, [introStage]);

  // Size the 3D Support Developer footer button responsively
  useEffect(() => {
    const syncSupportSize = () => {
      if (!supportSlotRef.current) return;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      const w = vw < 480 ? 136 : 152;
      const h = vw < 480 ? 76 : 84;
      applySupportDeveloper3DSize(supportSlotRef.current, { width: w, height: h });
    };
    syncSupportSize();
    window.addEventListener("resize", syncSupportSize);
    return () => window.removeEventListener("resize", syncSupportSize);
  }, [supportWebglLost, errorMsg, introStage]);

  const appFullyReady =
    !loading &&
    !errorMsg &&
    Boolean(currentSlotInfo) &&
    leaderboardSynced &&
    monitorReady;

  // Disappear SGSS Intro Video smoothly once full connection, leaderboard sync, and 3D monitor are ready
  useEffect(() => {
    if (introStage !== 'sgss') return;
    if (!sgssCycleDone) return;
    if (!appFullyReady && !errorMsg) return;
    setSgssIntroFading(true);
    const fadeTimer = window.setTimeout(() => {
      setIntroStage('done');
      setSgssIntroFading(false);
    }, 460);
    return () => window.clearTimeout(fadeTimer);
  }, [introStage, sgssCycleDone, appFullyReady, errorMsg]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (introStage === 'done' && errorMsg) {
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
    <>
      {introStage === 'sgss' && (
        <div
          className={`fixed inset-0 z-50 bg-[#060911] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
            sgssIntroFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SgssIntroVideo
            mp4Src="/sgss-intro-video/assets/sgss-intro.mp4"
            webmSrc="/sgss-intro-video/assets/sgss-intro.webm"
            posterSrc="/sgss-intro-video/assets/sgss-intro-poster.jpg"
            format="fullscreen"
            focalPoint="monitor"
            autoPlay={true}
            loop={true}
            muted={true}
            playbackRate={0.65}
            showSkipButton={false}
            fadeOutOnEnd={false}
            onTimeUpdate={(ev) => {
              if (ev.progress >= 0.96 && !sgssCycleDoneRef.current) {
                sgssCycleDoneRef.current = true;
                setSgssCycleDone(true);
              }
            }}
            className="w-full h-full"
          />
        </div>
      )}
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header player={me} />

      {/* Main Game Container */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-4 md:gap-6 items-start">
          {/* Main Column: Trivia Arena */}
          <div className="min-w-0">
            {!loading && currentSlotInfo ? (
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
                introActive={introStage !== 'done'}
                onSelectOption={handleSelectOption}
                onTimeUp={handleTimeUp}
                onReady={handleMonitorReady}
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
        {!supportWebglLost ? (
          <div
            ref={supportSlotRef}
            role="button"
            tabIndex={0}
            aria-label="Support Developer"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openExternalUrl(SUPPORT_URL);
              }
            }}
            className="cursor-pointer rounded-xl overflow-hidden hover:brightness-110 active:scale-95 transition-transform"
            style={{ width: '152px', height: '84px' }}
          >
            <SupportDeveloper3DWidget
              motionMode="wave"
              speed={1.0}
              intensity={1.0}
              background="transparent"
              showStudioFloor={false}
              enableOrbit={false}
              enableSoundFeedback={introStage === 'done'}
              onClick={() => openExternalUrl(SUPPORT_URL)}
              onContextLost={(lost) => setSupportWebglLost(lost)}
            />
          </div>
        ) : (
          <button
            onClick={() => openExternalUrl(SUPPORT_URL)}
            className="cursor-pointer text-sm font-bold bg-[#ffd166]/15 hover:bg-[#ffd166]/25 border border-[#ffd166]/40 hover:border-[#ffd166]/70 text-[#ffd166] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>Support Developer</span>
          </button>
        )}
      </footer>

      {/* Legal Modal */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
    </>
  );
}
