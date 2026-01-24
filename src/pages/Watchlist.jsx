import React from 'react';
import { useMockData } from '@/components/MockDataProvider';
import TokenCard from '@/components/TokenCard';
import { Bookmark, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function Watchlist() {
  const { getWatchlistTokens, watchlist } = useMockData();
  const watchlistTokens = getWatchlistTokens();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Bookmark className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              关注列表
            </h1>
            <p className="text-gray-500 text-xs">Watchlist · {watchlist.length} 个代币</p>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      {watchlistTokens.length > 0 ? (
        <div className="space-y-3">
          {watchlistTokens.map(token => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="relative inline-block mb-4">
            <Eye className="w-16 h-16 text-cyan-500/30" />
            <Plus className="w-6 h-6 text-cyan-400 absolute -bottom-1 -right-1" />
          </div>
          <p className="text-gray-400 mb-2">关注列表为空</p>
          <p className="text-gray-500 text-xs mb-6">在房间页面点击收藏按钮添加代币</p>
          <Link to={createPageUrl('Lobby')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              浏览房间
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}