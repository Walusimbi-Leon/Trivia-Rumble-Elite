import React, { useEffect, useRef, useState } from "react";
import { Player } from "../types";
import { StarIcon } from "./Icons";
import { TriviaRumbleElite3DWidget } from "../trivia-rumble-elite-3d-widget/TriviaRumbleElite3DWidget";
import { applyTriviaRumbleElite3DSize } from "../trivia-rumble-elite-3d-widget/trivia-rumble-elite-sizing.js";

interface HeaderProps {
  player: Player;
}

export const Header: React.FC<HeaderProps> = ({ player }) => {
  const initial = (player.username || "?").trim().charAt(0).toUpperCase() || "?";
  const logoSlotRef = useRef<HTMLDivElement | null>(null);
  const [logoWebglLost, setLogoWebglLost] = useState(false);

  useEffect(() => {
    const syncLogoSize = () => {
      const el = logoSlotRef.current;
      if (!el) return;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      const width = vw < 480 ? 156 : vw < 640 ? 186 : 230;
      const height = vw < 480 ? 52 : vw < 640 ? 60 : 72;
      applyTriviaRumbleElite3DSize(el, { width, height });
    };
    syncLogoSize();
    window.addEventListener("resize", syncLogoSize);
    return () => window.removeEventListener("resize", syncLogoSize);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#09041a]/85 backdrop-blur-md border-b border-[#3b2568]/60 px-3 sm:px-6 py-1.5 transition-all">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Top-Left Fixed 3D TRIVIA RUMBLE ELITE Emblem */}
        <div className="flex items-center shrink-0">
          {!logoWebglLost ? (
            <div
              ref={logoSlotRef}
              className="rounded-xl overflow-hidden select-none pointer-events-none"
              style={{ width: "230px", height: "72px" }}
            >
              <TriviaRumbleElite3DWidget
                motionMode="blaze"
                speed={1.0}
                intensity={1.0}
                background="transparent"
                showStudioFloor={false}
                enableOrbit={false}
                enableSoundFeedback={false}
                onContextLost={(lost) => setLogoWebglLost(lost)}
              />
            </div>
          ) : (
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white whitespace-nowrap">
              TRIVIA RUMBLE <span className="text-[#00f5ff] font-extrabold">ELITE</span>
            </h1>
          )}
        </div>

        {/* Right Section: User Profile Chip */}
        <div className="flex items-center gap-2 bg-[#12092e]/80 border border-[#4a2e80]/80 rounded-full px-3 py-1 shadow-inner">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-[#00f5ff]/40 bg-[#140b30]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#00f5ff] text-white text-[11px] font-black items-center justify-center border border-[#00f5ff]/40 ${
              player.avatarUrl ? "hidden" : "flex"
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
              player.platform === "discord"
                ? "bg-[#5865F2] text-white shadow-sm shadow-[#5865F2]/40"
                : "bg-[#26154d] text-[#b3a8e0] border border-[#4a2e80]"
            }`}
          >
            {player.platform === "discord" ? "Discord" : "Browser"}
          </span>
        </div>
      </div>
    </header>
  );
};
