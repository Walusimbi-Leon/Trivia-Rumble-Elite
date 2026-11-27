import React from 'react';
import { X, Shield, FileText, ExternalLink } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0c051f]/95 border-2 border-[#d946ef] shadow-[0_0_30px_rgba(217,70,239,0.35)] rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3b2568]/80 bg-[#12072c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d946ef]/20 border border-[#d946ef]/50 flex items-center justify-center text-[#d946ef]">
              {type === 'privacy' ? <Shield size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <p className="text-xs text-[#a59ecc]">Trivia Rumble Elite · Updated May 1, 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a59ecc] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#eef0ff] leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p>
                Trivia Rumble Elite (&quot;the Game&quot;, &quot;we&quot;, &quot;us&quot;) is a multiplayer trivia game playable inside Discord or in a web browser. This policy explains what information the Game collects and how it is used.
              </p>

              <h4 className="text-sm font-bold text-[#00f5ff]">1. Information We Collect</h4>
              <ul className="list-disc pl-5 space-y-1 text-[#a59ecc]">
                <li><strong>Discord identity (when playing via Discord):</strong> your Discord user ID, username, and avatar — used to display your name, avatar, and score on the in-game leaderboard.</li>
                <li><strong>Guest identity (when playing in a browser):</strong> a randomly generated persistent ID stored in your browser&apos;s local storage so your progress is maintained.</li>
                <li><strong>Game data:</strong> answers, timing, online status, and accumulated score stored in Firebase Realtime Database.</li>
              </ul>

              <h4 className="text-sm font-bold text-[#00f5ff]">2. How We Use the Data</h4>
              <ul className="list-disc pl-5 space-y-1 text-[#a59ecc]">
                <li>To operate synchronous gameplay and calculate real-time leaderboard rankings.</li>
                <li>To preserve returning player scores and statistics across sessions.</li>
              </ul>

              <h4 className="text-sm font-bold text-[#00f5ff]">3. Data Protection &amp; Deletion</h4>
              <p className="text-[#a59ecc]">
                We do not sell, rent, or trade your personal information, and we do not read Discord messages or server content. To request data removal, contact <a href="mailto:walusimbileon2@gmail.com" className="text-[#38bdf8] underline">walusimbileon2@gmail.com</a>.
              </p>
            </>
          ) : (
            <>
              <p>
                Welcome to Trivia Rumble Elite (&quot;the Game&quot;). By accessing or playing the Game, you agree to these Terms of Service.
              </p>

              <h4 className="text-sm font-bold text-[#00f5ff]">1. Acceptable Use &amp; Fair Play</h4>
              <ul className="list-disc pl-5 space-y-1 text-[#a59ecc]">
                <li>Play for lawful, personal entertainment purposes.</li>
                <li>Do not attempt to disrupt, hack, cheat, tamper with scores, or exploit the game or server infrastructure.</li>
                <li>No automated bots or answer-scraping scripts.</li>
              </ul>

              <h4 className="text-sm font-bold text-[#00f5ff]">2. Disclaimer &amp; Trademarks</h4>
              <p className="text-[#a59ecc]">
                The Game is an independent project by Walusimbi Leon and is not affiliated with, endorsed by, or sponsored by Discord Inc. &quot;Discord&quot; is a registered trademark of Discord Inc.
              </p>
            </>
          )}

          <div className="pt-2 border-t border-[#3b2568]/60 text-[#a59ecc] space-y-1">
            <p>
              <strong className="text-white">Email:</strong>{' '}
              <a href="mailto:walusimbileon2@gmail.com" className="text-[#38bdf8] hover:underline">
                walusimbileon2@gmail.com
              </a>
            </p>
            <p>
              <strong className="text-white">GitHub:</strong>{' '}
              <a
                href="https://github.com/Walusimbi-Leon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38bdf8] hover:underline"
              >
                https://github.com/Walusimbi-Leon
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#3b2568]/80 bg-[#12072c] flex items-center justify-between gap-3">
          <a
            href={type === 'privacy' ? '/privacy' : '/terms'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#38bdf8] hover:underline flex items-center gap-1"
          >
            <span>Open full page</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#7c5cff] hover:bg-[#6b47ff] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
