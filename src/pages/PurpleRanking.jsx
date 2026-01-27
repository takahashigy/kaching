import React from 'react';
import { useMockData } from '@/components/MockDataProvider';
import TokenCard from '@/components/TokenCard';
import { Trophy, TrendingUp, Activity, Headphones, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PurpleRanking() {
  const { getPurpleRanking } = useMockData();
  const purpleTokens = getPurpleRanking();

  return (
    <div className="w-full lg:px-0 px-4 lg:py-0 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Trophy className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              紫榜
            </h1>
            <p className="text-gray-500 text-xs">Purple Ranking</p>
          </div>
        </div>
        
        {/* Ranking formula info */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-400">
              <p className="mb-1">排名算法：</p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  市值 50%
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-400" />
                  成交量 30%
                </span>
                <span className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-purple-400" />
                  收听数 20%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking List */}
      {purpleTokens.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {purpleTokens.map((token, index) => (
            <div key={token.id} className="relative">
              {/* Rank indicator */}
              <div className={cn(
                "absolute -left-2 top-1/2 -translate-y-1/2 z-10",
                "w-8 h-8 rounded-full flex items-center justify-center",
                "font-bold text-sm shadow-lg",
                index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800" :
                index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                "bg-gray-700 text-gray-300"
              )}>
                {index + 1}
              </div>
              
              <div className="ml-4">
                <TokenCard token={token} />
              </div>
              
              {/* Score bar */}
              <div className="ml-4 mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${token.rankScore * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-12 text-right">
                  {(token.rankScore * 100).toFixed(1)}分
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-purple-500/30" />
          <p className="text-gray-400">暂无紫级房间</p>
          <p className="text-gray-500 text-xs mt-1">市值达到 $444,444 即可进入紫榜</p>
        </div>
      )}
    </div>
  );
}