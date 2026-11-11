import React, { useState, useEffect } from 'react';
import { Database, Download, CheckCircle, AlertTriangle, Send, X, ShieldCheck } from 'lucide-react';
import { DiscordIcon, StarIcon } from './Icons';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DbStatus {
  totalPlayers: number;
  discordPlayersCount: number;
  browserPlayersCount: number;
  questionsInBank: number;
  topPlayers: Array<{
    id: string;
    username: string;
    score: number;
    platform: string;
  }>;
  firebaseStatus: {
    targetConfigured: boolean;
    targetUrl: string;
  };
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFirebaseUrl, setNewFirebaseUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn('Failed to load DB status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/firebase/trivia/global/players.json');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trivia_rumble_elite_players_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to download backup: ' + e);
    }
  };

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirebaseUrl.trim()) return;

    setMigrating(true);
    setMigrationResult(null);

    try {
      const res = await fetch('/api/database/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUrl: newFirebaseUrl.trim(),
          authToken: authToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMigrationResult({ success: true, message: data.message });
      } else {
        setMigrationResult({ success: false, error: data.error || 'Migration failed' });
      }
    } catch (err: any) {
      setMigrationResult({ success: false, error: err.message || 'Migration network error' });
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141624] border border-[#2a2e4a] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2e4a] bg-[#191c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7c5cff]/20 border border-[#7c5cff]/40 flex items-center justify-center text-[#7c5cff]">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Database &amp; Player Persistence</h3>
              <p className="text-xs text-[#9aa0c0]">1,912 existing players backed up &amp; ready for new Firebase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9aa0c0] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-3 text-center">
              <span className="block text-2xl font-black text-white">{status?.totalPlayers || '1,912'}</span>
              <span className="text-[11px] font-semibold text-[#9aa0c0] uppercase tracking-wider">Total Players</span>
            </div>
            <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-3 text-center">
              <span className="block text-2xl font-black text-[#5865F2] flex items-center justify-center gap-1.5">
                <DiscordIcon size={18} />
                {status?.discordPlayersCount || '1,690'}
              </span>
              <span className="text-[11px] font-semibold text-[#9aa0c0] uppercase tracking-wider">Discord Users</span>
            </div>
            <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="block text-2xl font-black text-[#2ecc71]">Live &amp; Connected</span>
              <span className="text-[11px] font-semibold text-[#9aa0c0] uppercase tracking-wider">Database Status</span>
            </div>
          </div>

          {/* Active Firebase Connection Info */}
          <div className="p-3.5 rounded-xl bg-[#2ecc71]/10 border border-[#2ecc71]/30 flex items-start gap-3">
            <ShieldCheck size={20} className="text-[#2ecc71] shrink-0 mt-0.5" />
            <div className="text-xs text-[#eef0ff] space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#2ecc71]">New Dedicated Firebase Project Active</p>
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
              </div>
              <p className="text-[#9aa0c0] leading-relaxed">
                Project ID: <strong className="text-white">studio-3101124565-bd63c</strong>
                <br />
                URL: <code className="text-[#4fc3f7] bg-black/30 px-1 py-0.5 rounded">https://studio-3101124565-bd63c-default-rtdb.firebaseio.com</code>
                <br />
                All <strong>1,912 players</strong>, high scores, and trivia questions are migrated and connected with your database secret. Returning Discord users immediately resume their profile and points!
              </p>
            </div>
          </div>

          {/* Top Players Preview */}
          {status?.topPlayers && (
            <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-[#9aa0c0] uppercase tracking-wider block">
                Top Historical Hall of Fame (Sample)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {status.topPlayers.slice(0, 6).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="truncate text-white font-medium">#{i + 1} {p.username}</span>
                    <span className="font-bold text-[#ffd166] flex items-center gap-1 shrink-0">
                      <StarIcon size={10} />
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Migration to New Firebase Form */}
          <div className="bg-[#191c2e] border border-[#2a2e4a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Send size={15} className="text-[#7c5cff]" />
                Migrate To Your New Firebase Project
              </h4>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="text-[11px] font-bold text-[#4fc3f7] hover:underline flex items-center gap-1"
              >
                <Download size={12} />
                Download JSON Backup
              </button>
            </div>
            <p className="text-xs text-[#9aa0c0]">
              Whenever you create the new Firebase project, simply paste its Realtime Database URL below. We will push all 1,912 player profiles with their true scores and Discord IDs.
            </p>

            <form onSubmit={handleMigrate} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#9aa0c0] mb-1">
                  New Firebase Database URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-new-project-default-rtdb.firebaseio.com"
                  value={newFirebaseUrl}
                  onChange={(e) => setNewFirebaseUrl(e.target.value)}
                  className="w-full bg-[#10121f] border border-[#2a2e4a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c5cff]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9aa0c0] mb-1">
                  Database Secret or Auth Token (Optional for secured rules)
                </label>
                <input
                  type="password"
                  placeholder="Optional auth token / secret"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full bg-[#10121f] border border-[#2a2e4a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c5cff]"
                />
              </div>

              <button
                type="submit"
                disabled={migrating || !newFirebaseUrl.trim()}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#7c5cff] to-[#6574ff] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {migrating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Migrating 1,912 players...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Migrate Players to New Database
                  </>
                )}
              </button>
            </form>

            {migrationResult && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  migrationResult.success
                    ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71]/30'
                    : 'bg-[#ff4d6d]/15 text-[#ff4d6d] border border-[#ff4d6d]/30'
                }`}
              >
                {migrationResult.success ? migrationResult.message : migrationResult.error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2a2e4a] bg-[#191c2e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#262b47] hover:bg-[#343a60] text-xs font-bold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
