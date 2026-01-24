import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Headphones, Zap } from 'lucide-react';
import TierBadge from './TierBadge';
import StateBadge from './StateBadge';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

export default function TokenCard({ token, rank, showRank = false }) {
  return (
    <Link to={createPageUrl(`Room?id=${token.id}`)}>
      <div className={cn(
        "relative p-4 rounded-2xl border transition-all duration-300",
        "bg-gradient-to-br from-gray-900/80 to-gray-800/50",
        "border-gray-700/50 hover:border-gray-600",
        "backdrop-blur-xl hover:scale-[1.02]",
        token.tier === "GOLD" && "border-amber-500/30 hover:border-amber-500/50",
        token.tier === "PURPLE" && "border-purple-500/30 hover:border-purple-500/50"
      )}>
        {/* Rank badge */}
        {showRank && (
          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {rank}
          </div>
        )}
        
        <div className="flex items-start gap-3">
          {/* Token avatar */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
            "bg-gradient-to-br",
            token.tier === "GOLD" ? "from-amber-500/30 to-orange-600/30 text-amber-400" :
            token.tier === "PURPLE" ? "from-purple-500/30 to-pink-600/30 text-purple-400" :
            "from-cyan-500/30 to-blue-600/30 text-cyan-400"
          )}>
            {token.ticker?.slice(0, 2) || "??"}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white truncate">${token.ticker}</span>
              <TierBadge tier={token.tier} />
              <StateBadge state={token.state} />
            </div>
            
            <p className="text-gray-400 text-xs truncate mb-2">{token.name}</p>
            
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-gray-400">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>${formatNumber(token.marketCap)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Headphones className="w-3 h-3 text-cyan-400" />
                <span>{token.listeners || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3 h-3 text-purple-400" />
                <span>{token.holders || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+{token.joinVelocity || 0}/m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}