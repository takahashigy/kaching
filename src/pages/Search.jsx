import React, { useState } from 'react';
import { useMockData } from '@/components/MockDataProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X, AlertCircle, CheckCircle2, Snowflake, ArrowRight } from 'lucide-react';
import TierBadge from '@/components/TierBadge';

function shortenCA(ca) {
  if (!ca) return '';
  return `${ca.slice(0, 6)}...${ca.slice(-4)}`;
}

export default function Search() {
  const { searchTokens, getStatusReason } = useMockData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const found = searchTokens(query);
    setResults(found);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const StateIcon = ({ state }) => {
    if (state === "ACTIVE") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (state === "FROZEN") return <Snowflake className="w-4 h-4 text-blue-400" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">搜索代币</h1>
        <p className="text-gray-500 text-xs">按名称、代号或合约地址搜索</p>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="输入代币名称、代号或 CA..."
          className="pr-20 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={handleSearch}
            size="icon"
            className="h-8 w-8 bg-cyan-500 hover:bg-cyan-600"
          >
            <SearchIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search results */}
      {query && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            找到 {results.length} 个结果
          </p>

          {results.length > 0 ? (
            results.map(token => {
              const statusReason = getStatusReason(token);
              
              return (
                <div
                  key={token.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
                >
                  {/* Token info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                      "bg-gradient-to-br",
                      token.tier === "GOLD" ? "from-amber-500/30 to-orange-600/30 text-amber-400" :
                      token.tier === "PURPLE" ? "from-purple-500/30 to-pink-600/30 text-purple-400" :
                      "from-cyan-500/30 to-blue-600/30 text-cyan-400"
                    )}>
                      {token.ticker?.slice(0, 2)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">${token.ticker}</span>
                        {token.state === "ACTIVE" && <TierBadge tier={token.tier} size="sm" />}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{token.name}</p>
                      <p className="text-gray-500 text-xs mt-1 font-mono">
                        {shortenCA(token.contractAddress)}
                      </p>
                    </div>
                  </div>

                  {/* Status section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StateIcon state={token.state} />
                      <div>
                        {token.state === "ACTIVE" ? (
                          <span className="text-emerald-400 text-sm font-medium">直播中</span>
                        ) : token.state === "FROZEN" ? (
                          <div>
                            <span className="text-blue-400 text-sm font-medium block">已冻结</span>
                            <span className="text-gray-500 text-xs">{statusReason}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-gray-400 text-sm font-medium block">未达标</span>
                            <span className="text-gray-500 text-xs">{statusReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {token.state === "ACTIVE" ? (
                      <Link to={createPageUrl(`Room?id=${token.id}`)}>
                        <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                          进入房间
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="ghost" disabled className="text-gray-500">
                        {token.state === "FROZEN" ? "已冻结" : "未开放"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">未找到匹配的代币</p>
              <p className="text-gray-500 text-xs mt-1">请尝试其他关键词</p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">输入关键词开始搜索</p>
          <p className="text-gray-500 text-xs mt-2">
            支持搜索代币名称、代号或合约地址
          </p>
        </div>
      )}
    </div>
  );
}