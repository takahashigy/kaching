import React from 'react';
import { useMockData } from '@/components/MockDataProvider';
import TokenCard from '@/components/TokenCard';
import { Star, Crown, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function GoldFeatured() {
  const { getGoldFeatured } = useMockData();
  const goldTokens = getGoldFeatured();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 relative">
            <Star className="w-6 h-6 text-amber-400" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              金榜
            </h1>
            <p className="text-gray-500 text-xs">Gold Featured</p>
          </div>
        </div>
        
        {/* Info */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>市值超过 $1,000,000 的精选房间</span>
          </div>
        </div>
      </div>

      {/* Featured List */}
      {goldTokens.length > 0 ? (
        <div className="space-y-4">
          {goldTokens.map((token, index) => (
            <div key={token.id} className="relative">
              {/* Featured badge for top token */}
              {index === 0 && (
                <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold text-white shadow-lg shadow-amber-500/30">
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>头牌</span>
                  </div>
                </div>
              )}
              
              <div className={cn(
                index === 0 && "pt-2"
              )}>
                <TokenCard token={token} rank={index + 1} showRank />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Star className="w-16 h-16 mx-auto mb-4 text-amber-500/30" />
          <p className="text-gray-400">暂无金级房间</p>
          <p className="text-gray-500 text-xs mt-1">市值达到 $1,000,000 即可登上金榜</p>
        </div>
      )}
    </div>
  );
}