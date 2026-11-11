import React from 'react';
import { HelpCircle, X, Sparkles, Clock, Trophy, Bot } from 'lucide-react';
import { DiscordIcon } from './Icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141624] border border-[#2a2e4a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2e4a] bg-[#191c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4fc3f7]/20 border border-[#4fc3f7]/40 flex items-center justify-center text-[#4fc3f7]">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">How Trivia Rumble Elite Works</h3>
              <p className="text-xs text-[#9aa0c0]">Rules, synchronized timer &amp; question sources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9aa0c0] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#eef0ff]">
          {/* Question Source Explanation */}
          <div className="p-3.5 rounded-xl bg-[#7c5cff]/10 border border-[#7c5cff]/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#7c5cff]">
              <Bot size={16} />
              <span>Where did the game pull trivia questions from?</span>
            </div>
            <p className="text-[#9aa0c0] leading-relaxed">
              In your original codebase, the frontend called <code>POST /api/trivia</code> whenever fewer than 20 questions remained in the bank. The backend previously called an external AI service called <strong className="text-white">opencode.ai (big-pickle model)</strong> to generate raw JSON questions on the fly and push them into Firebase at <code>trivia/global/bank</code>.
            </p>
            <p className="text-[#9aa0c0] leading-relaxed">
              <strong>Why it was unreliable:</strong> External AI endpoints often suffer from rate-limits, slow generation latency (taking 5–15 seconds to reply), or formatting failures, which caused games to stall with "Preparing new questions…".
            </p>
          </div>

          {/* Timing System */}
          <div className="p-3.5 rounded-xl bg-[#191c2e] border border-[#2a2e4a] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-[#4fc3f7]">
              <Clock size={16} />
              <span>Global Synchronized Clock</span>
            </div>
            <p className="text-[#9aa0c0] leading-relaxed">
              Every player on Discord and in web browsers sees the exact same question at the same second. Time is computed deterministically:
              <br />
              <code className="bg-black/30 px-1 py-0.5 rounded text-[#ffd166] mt-1 inline-block">
                slot = floor((now - questionStart) / 20,000ms)
              </code>
              <br />
              Each question lasts 20 seconds. If fewer than 3 seconds remain, late answers are rejected to avoid race conditions.
            </p>
          </div>

          {/* Scoring */}
          <div className="p-3.5 rounded-xl bg-[#191c2e] border border-[#2a2e4a] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-[#ffd166]">
              <Trophy size={16} />
              <span>Speed-Based Scoring</span>
            </div>
            <p className="text-[#9aa0c0] leading-relaxed">
              Points are calculated based on how quickly you answer correctly:
              <br />
              <code className="bg-black/30 px-1 py-0.5 rounded text-[#ffd166] mt-1 inline-block">
                points = max(10, 100 - seconds_elapsed * 5)
              </code>
              <br />
              Answering in the 1st second gives up to 95–100 points! Answering right before time expires gives the minimum 10 points. Wrong answers give 0 points.
            </p>
          </div>

          {/* Discord Activity */}
          <div className="p-3.5 rounded-xl bg-[#191c2e] border border-[#2a2e4a] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-[#5865F2]">
              <DiscordIcon size={16} />
              <span>Discord Embedded App Activity</span>
            </div>
            <p className="text-[#9aa0c0] leading-relaxed">
              Integrated with Discord Client ID <code>1535428947624460328</code>. When opened inside a Discord voice channel, it automatically reads the user's Discord avatar and username. Profiles and scores are tied directly to Discord User IDs (e.g. <code>u953011541660282950</code>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2a2e4a] bg-[#191c2e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#262b47] hover:bg-[#343a60] text-xs font-bold text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
