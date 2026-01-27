import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import TierBadge from './TierBadge';
import LiveBadge from './LiveBadge';
import WaveformIcon from './WaveformIcon';
import { Copy, Check, Clock, Snowflake } from 'lucide-react';

export default function TokenCard({ token, rank, showRank = false }) {
  const [imgOk, setImgOk] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const logoSrc =
    token?.logo ||
    token?.pfp ||
    token?.image ||
    token?.logoUrl ||
    token?.meta?.logo ||
    null;

  const showImage = Boolean(logoSrc) && imgOk;

  const handleCopyCA = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ca = token?.contractAddress;
    if (ca) {
      navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenCA = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时`;
    const days = Math.floor(hours / 24);
    return `${days}天`;
  };

  return (
    <Link to={createPageUrl(`Room?id=${token.id}`)} className="block w-full">
      <div
        className={cn(
          "relative w-full p-3 rounded-2xl border transition-all duration-300 overflow-hidden",
          "bg-gradient-to-br from-[#1a1f3a]/80 to-[#0f1229]/50",
          "border-gray-700/50 hover:border-gray-600",
          "backdrop-blur-xl hover:scale-[1.02]",
          "lg:max-w-none lg:h-full",
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

        <div className="relative flex items-start gap-2.5 min-w-0">
          {/* Token avatar */}
          <div
            className={cn(
              "w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-base font-bold border-2 shrink-0",
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
            <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
              <span className="font-bold text-white text-base truncate">
                ${token?.ticker || token?.symbol || "?"}
              </span>
              <TierBadge tier={token?.tier} size="sm" />
            </div>

            <p className="text-gray-400 text-xs truncate mb-1.5">
              {token?.name || ""}
            </p>

            {token?.state === "ACTIVE" && (
              <LiveBadge />
            )}

            {token?.contractAddress && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-gray-500 font-mono">
                  {shortenCA(token.contractAddress)}
                </span>
                <button
                  onClick={handleCopyCA}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {/* 存活时长和冻结次数 */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
              {token?.aliveMinutes > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(token.aliveMinutes)}</span>
                </div>
              )}
              {token?.freezeCount > 0 && (
                <div className="flex items-center gap-1">
                  <Snowflake className="w-3 h-3 text-blue-400" />
                  <span>冻结{token.freezeCount}次</span>
                </div>
              )}
            </div>
            </div>
            </div>
            </div>
            </Link>
            );
            }