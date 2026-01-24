import React from 'react';
import { useMockData } from '@/components/MockDataProvider';
import TokenCard from '@/components/TokenCard';
import WalletToggle from '@/components/WalletToggle';
import TierBadge from '@/components/TierBadge';
import { getGlobalTitle } from '@/components/TitleBadge';
import { Flame, Radio, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Lobby() {
  const { 
    getPopularNow, 
    getActiveTokens, 
    walletConnected, 
    setWalletConnected,
    globalPNLTier 
  } = useMockData();
  
  const popularNow = getPopularNow();
  const activeTokens = getActiveTokens();
  const globalTitle = getGlobalTitle(globalPNLTier);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
            模音
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">当 Meme 长了嘴巴</p>
        </div>
        
        <div className="flex items-center gap-3">
          {walletConnected && (
            <span className={cn("text-xs font-medium", globalTitle.color)}>
              {globalTitle.title}
            </span>
          )}
          <WalletToggle 
            isConnected={walletConnected} 
            onToggle={() => setWalletConnected(!walletConnected)} 
          />
        </div>
      </div>

      {/* Popular Now Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <h2 className="font-bold text-lg">热门房间</h2>
          <span className="text-gray-500 text-xs">Top 10</span>
        </div>
        
        {/* Horizontal scroll for top items */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {popularNow.slice(0, 5).map((token, index) => (
            <div key={token.id} className="flex-shrink-0 w-[280px]">
              <TokenCard token={token} rank={index + 1} showRank />
            </div>
          ))}
        </div>
        
        {/* Grid for remaining */}
        <div className="grid gap-3 mt-3">
          {popularNow.slice(5, 10).map((token, index) => (
            <TokenCard key={token.id} token={token} rank={index + 6} showRank />
          ))}
        </div>
      </section>

      {/* Live Rooms Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="font-bold text-lg">直播中</h2>
            <span className="text-gray-500 text-xs">{activeTokens.length} 个房间</span>
          </div>
          
          {/* Tier filters */}
          <div className="flex gap-1">
            <TierBadge tier="BLUE" size="sm" />
            <TierBadge tier="PURPLE" size="sm" />
            <TierBadge tier="GOLD" size="sm" />
          </div>
        </div>
        
        <div className="grid gap-3">
          {activeTokens.map(token => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
        
        {activeTokens.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无直播房间</p>
            <p className="text-xs mt-1">等待代币达到开播条件</p>
          </div>
        )}
      </section>
    </div>
  );
}