import React, { useState } from 'react';
import { useMockData } from '@/components/MockDataProvider';
import TierBadge from '@/components/TierBadge';
import StateBadge from '@/components/StateBadge';
import TitleBadge, { getHoldingTitle, getGlobalTitle } from '@/components/TitleBadge';
import SpeakButton from '@/components/SpeakButton';
import { 
  ArrowLeft, 
  Headphones, 
  Users, 
  Mic, 
  TrendingUp, 
  Droplets,
  Activity,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

function formatNumber(num) {
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
  return '$' + (num?.toString() || '0');
}

export default function Room() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenId = urlParams.get('id');
  const tokenCA = urlParams.get('ca');
  
  const { 
    getToken,
    tokens,
    walletConnected, 
    userHolding, 
    setUserHolding,
    globalPNLTier,
    watchlist,
    toggleWatchlist
  } = useMockData();
  
  // 支持通过 id 或 ca 查找房间
  let token = tokenId ? getToken(tokenId) : null;
  if (!token && tokenCA) {
    const normalizedCA = tokenCA.toLowerCase();
    token = tokens.find(t => t.contractAddress?.toLowerCase() === normalizedCA);
  }
  
  const actualTokenId = token?.id || tokenId;
  const isWatched = actualTokenId ? watchlist.includes(actualTokenId) : false;
  
  const [showSettings, setShowSettings] = useState(false);
  
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center py-20 text-gray-500">
          <p>房间不存在</p>
          <Link to={createPageUrl('Lobby')} className="text-cyan-400 text-sm mt-2 block">
            返回大厅
          </Link>
        </div>
      </div>
    );
  }
  
  const holdingInfo = getHoldingTitle(userHolding);
  const globalTitle = getGlobalTitle(globalPNLTier);
  
  // Mock speakers
  const mockSpeakers = [
    { id: 1, name: "鲸鱼大佬", holding: 5.2, isSpeaking: true },
    { id: 2, name: "钻石手", holding: 2.1, isSpeaking: false },
    { id: 3, name: "小韭菜", holding: 0.3, isSpeaking: false }
  ];

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Lobby')} className="p-2 -ml-2 rounded-lg hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => actualTokenId && toggleWatchlist(actualTokenId)}
              className="h-9 w-9"
              disabled={!actualTokenId}
            >
              {isWatched ? (
                <BookmarkCheck className="w-5 h-5 text-amber-400" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Token Info Card */}
        <div className={cn(
          "relative rounded-3xl p-6 mb-6 overflow-hidden",
          "bg-gradient-to-br",
          token.tier === "GOLD" ? "from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20" :
          token.tier === "PURPLE" ? "from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20" :
          "from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20"
        )}>
          {/* Glow effect */}
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30",
            token.tier === "GOLD" ? "bg-amber-500" :
            token.tier === "PURPLE" ? "bg-purple-500" :
            "bg-cyan-500"
          )} />
          
          <div className="relative">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold",
                "bg-gradient-to-br",
                token.tier === "GOLD" ? "from-amber-500/30 to-orange-600/30 text-amber-400" :
                token.tier === "PURPLE" ? "from-purple-500/30 to-pink-600/30 text-purple-400" :
                "from-cyan-500/30 to-blue-600/30 text-cyan-400"
              )}>
                {token.logo ? (
                  <img
                    src={token.logo}
                    alt={token.ticker || token.symbol || "token"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  token.ticker?.slice(0, 2) || token.symbol?.slice(0, 2) || "??"
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">${token.ticker}</h1>
                  <TierBadge tier={token.tier} />
                </div>
                <p className="text-gray-400 text-sm">{token.name}</p>
                <StateBadge state={token.state} />
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>市值</span>
                </div>
                <p className="font-bold text-lg">{formatNumber(token.marketCap)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Droplets className="w-3 h-3" />
                  <span>流动性</span>
                </div>
                <p className="font-bold text-lg">{formatNumber(token.liquidityUSD)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Activity className="w-3 h-3" />
                  <span>4分钟成交</span>
                </div>
                <p className="font-bold">{formatNumber(token.volume4m)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>4分钟交易</span>
                </div>
                <p className="font-bold">{token.swaps4m} 笔</p>
              </div>
            </div>
          </div>
        </div>

        {/* Room Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
              <Headphones className="w-5 h-5" />
              <span className="text-2xl font-bold">{token.listeners || 0}</span>
            </div>
            <p className="text-gray-500 text-xs">收听中</p>
          </div>
          <div className="w-px bg-gray-800" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <Mic className="w-5 h-5" />
              <span className="text-2xl font-bold">{mockSpeakers.filter(s => s.isSpeaking).length}</span>
            </div>
            <p className="text-gray-500 text-xs">发言中</p>
          </div>
          <div className="w-px bg-gray-800" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
              <Users className="w-5 h-5" />
              <span className="text-2xl font-bold">{token.holders || 0}</span>
            </div>
            <p className="text-gray-500 text-xs">持有者</p>
          </div>
        </div>

        {/* Speakers Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">当前发言者</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {mockSpeakers.map(speaker => {
              const speakerTitle = getHoldingTitle(speaker.holding);
              return (
                <div key={speaker.id} className={cn(
                  "flex flex-col items-center p-3 rounded-xl",
                  speaker.isSpeaking ? "bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30" : "bg-gray-800/50"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 relative",
                    "bg-gradient-to-br from-gray-700 to-gray-800"
                  )}>
                    <span className="text-lg">{speaker.name[0]}</span>
                    {speaker.isSpeaking && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Mic className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate max-w-[60px]">{speaker.name}</p>
                  <TitleBadge holdingPercent={speaker.holding} showIcon={false} />
                </div>
              );
            })}
          </div>
        </div>

        {/* User Identity & Controls */}
        {walletConnected ? (
          <div className="space-y-6">
            {/* User Badge */}
            <div className="bg-gray-800/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-gray-400 text-xs">你的身份</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TitleBadge holdingPercent={userHolding} />
                    <span className={cn("text-xs", globalTitle.color)}>{globalTitle.title}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">持仓比例</p>
                  <p className="font-bold text-lg">{userHolding.toFixed(2)}%</p>
                </div>
              </div>
              
              {/* Mock holding slider for testing */}
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-cyan-400 text-xs"
              >
                {showSettings ? '收起' : '调整持仓 (测试用)'}
              </button>
              
              {showSettings && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <Slider
                    value={[userHolding]}
                    onValueChange={([val]) => setUserHolding(val)}
                    max={10}
                    step={0.1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>0%</span>
                    <span>0.5% 堂主</span>
                    <span>1% 护法</span>
                    <span>4% 宗主</span>
                    <span>10%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Speak Button */}
            <div className="flex justify-center py-4">
              <SpeakButton holdingPercent={userHolding} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800/30 rounded-2xl">
            <p className="text-gray-400 mb-3">连接钱包以获取身份和发言权限</p>
            <p className="text-gray-500 text-xs">你的持仓比例将决定你的身份和发言时长</p>
          </div>
        )}
      </div>
    </div>
  );
}