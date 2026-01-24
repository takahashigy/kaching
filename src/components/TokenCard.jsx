import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import TierBadge from './TierBadge';
import LiveBadge from './LiveBadge';
import WaveformIcon from './WaveformIcon';

export default function TokenCard({ token, rank, showRank = false }) {
  const [imgOk, setImgOk] = React.useState(true);

  const logoSrc =
    token?.logo ||
    token?.pfp ||
    token?.image ||
    token?.logoUrl ||
    token?.meta?.logo ||
    null;

  const showImage = Boolean(logoSrc) && imgOk;

  return (
    <Link to={createPageUrl(`Room?id=${token.id}`)}>
      <div
        className={cn(
          "relative w-full max-w-full p-4 rounded-2xl border transition-all duration-300 overflow-hidden",
          "bg-gradient-to-br from-[#1a1f3a]/80 to-[#0f1229]/50",
          "border-gray-700/50 hover:border-gray-600",
          "backdrop-blur-xl hover:scale-[1.02]",
          token.tier === "GOLD" && "border-amber-500/30 hover:border-amber-500/50",
          token.tier === "PURPLE" && "border-purple-500/30 hover:border-purple-500/50"
        )}
      >
        {/* Waveform background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-5 pointer-events-none">
          <WaveformIcon
            className="absolute top-1/2 right-4 -translate-y-1/2 scale-[2]"
            color={
              token.tier === "GOLD"
                ? "orange"
                : token.tier === "PURPLE"
                ? "purple"
                : "cyan"
            }
          />
        </div>

        {/* Rank badge */}
        {showRank && (
          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
            {rank}
          </div>
        )}

        <div className="relative flex items-start gap-3 min-w-0">
          {/* Token avatar */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-bold border-2 shrink-0",
              "bg-gradient-to-br shadow-lg",
              token.tier === "GOLD"
                ? "from-amber-500/30 to-orange-600/30 text-amber-400 border-amber-500/50"
                : token.tier === "PURPLE"
                ? "from-purple-500/30 to-pink-600/30 text-purple-400 border-purple-500/50"
                : "from-cyan-500/30 to-blue-600/30 text-cyan-400 border-cyan-500/50"
            )}
          >
            {showImage ? (
              <img
                src={logoSrc}
                alt={token?.name || token?.ticker || "token"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgOk(false)}
              />
            ) : (
              <span>{token?.ticker?.slice(0, 2) || "??"}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <span className="font-bold text-white text-lg truncate">
                ${token?.ticker || token?.symbol || "?"}
              </span>
              <TierBadge tier={token?.tier} />
            </div>

            <p className="text-gray-400 text-xs truncate mb-2">
              {token?.name || ""}
            </p>

            {token?.state === "ACTIVE" && (
              <LiveBadge className="mb-2" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
