import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMockData } from '@/components/MockDataProvider';
import TokenCard from '@/components/TokenCard';
import WalletToggle from '@/components/WalletToggle';
import TierBadge from '@/components/TierBadge';
import PopularCarousel from '@/components/PopularCarousel';
import WaveformIcon from '@/components/WaveformIcon';
import { getGlobalTitle } from '@/components/TitleBadge';
import { Flame, Radio, Search, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
              模音
            </h1>
            <p className="text-gray-400 text-sm">当 Meme 长了嘴巴</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Search')}>
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-gray-800/50">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              onClick={() => setWalletConnected(!walletConnected)}
              className={cn(
                "px-5 py-2 rounded-full font-medium text-sm transition-all",
                walletConnected 
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700" 
                  : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
              )}
            >
              {walletConnected ? "已连接" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>

      {/* Popular Now Section - Carousel */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <WaveformIcon color="cyan" animate />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">热门房间</h2>
            <p className="text-gray-400 text-xs">Slide to browse</p>
          </div>
        </div>
        
        {popularNow.length > 0 ? (
          <PopularCarousel tokens={popularNow} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无热门房间</p>
          </div>
        )}
      </section>

      {/* Live Rooms Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <WaveformIcon color="green" animate />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">直播中</h2>
              <p className="text-gray-400 text-xs">直播中 {activeTokens.length} 个房间</p>
            </div>
          </div>
          
          {/* Tier filters */}
          <div className="flex gap-2">
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