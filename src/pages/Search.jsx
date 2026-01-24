import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X, AlertCircle, CheckCircle2, Snowflake, ArrowRight, Loader2 } from 'lucide-react';
import TierBadge from '@/components/TierBadge';

// ✅ 改成你的 Worker 地址
const API_BASE = "https://kaching-room-engine.zhenshi1996799.workers.dev";

function shortenCA(ca) {
  if (!ca) return '';
  return `${ca.slice(0, 6)}...${ca.slice(-4)}`;
}

function normalize(s = "") {
  return String(s || "").trim().toLowerCase();
}

function looksLikeCA(s) {
  const x = normalize(s);
  return x.startsWith("0x") && x.length === 42;
}

function StateIcon({ state }) {
  if (state === "ACTIVE") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (state === "FROZEN") return <Snowflake className="w-4 h-4 text-blue-400" />;
  return <AlertCircle className="w-4 h-4 text-gray-400" />;
}

function statusReasonFromRoom(room) {
  // Worker 里：INACTIVE 用 statusReason，FROZEN 用 freezeReason
  if (!room) return "";
  if (room.state === "FROZEN") return room.freezeReason || "已冻结";
  if (room.state === "INACTIVE") return room.statusReason || "未达标";
  return "";
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const countText = useMemo(() => {
    if (!searched) return "";
    return `找到 ${results.length} 个结果`;
  }, [searched, results.length]);

  const handleSearch = async () => {
    const q = query.trim();
    setErrorText('');
    setSearched(true);

    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);

    try {
      // 1) 拉全量 rooms（你目前追踪 tokens 数量不大，这个最省事）
      const res = await fetch(`${API_BASE}/rooms/all`, { method: "GET" });
      if (!res.ok) throw new Error(`rooms/all HTTP ${res.status}`);
      const data = await res.json();
      const rooms = Array.isArray(data?.rooms) ? data.rooms : [];

      const needle = q.toLowerCase();
      const filtered = rooms.filter((r) => {
        const name = normalize(r?.name);
        const symbol = normalize(r?.symbol);
        const ca = normalize(r?.tokenAddress);
        return name.includes(needle) || symbol.includes(needle) || ca.includes(needle);
      });

      // 2) 如果没找到且像 CA，则额外查 status（可显示未达标原因/冻结原因）
      if (filtered.length === 0 && looksLikeCA(q)) {
        const ca = normalize(q);
        const r2 = await fetch(`${API_BASE}/token/status?ca=${ca}`, { method: "GET" });
        if (r2.ok) {
          const one = await r2.json();
          // one 可能是“尚未初始化”，也能展示出来
          setResults([{
            // 统一成页面渲染需要的字段
            id: one.roomId || ca,
            tokenAddress: one.tokenAddress || ca,
            name: one.meta?.name || "",
            symbol: one.meta?.symbol || "",
            logo: one.meta?.logo || null,
            tier: one.tier || null,
            state: one.state || "INACTIVE",
            statusReason: one.statusReason || null,
            freezeReason: one.freezeReason || null,
          }]);
        } else {
          setResults([]);
        }
      } else {
        setResults(filtered);
      }
    } catch (e) {
      setErrorText("搜索失败：后端接口请求异常（请稍后重试）");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setErrorText('');
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
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入至少 2 个字符开始搜索..."
          className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search results */}
      {(query || searched) && (
        <div className="space-y-3">
          {errorText && (
            <p className="text-red-400 text-sm">{errorText}</p>
          )}

          {loading ? (
            <p className="text-gray-400 text-sm">搜索中…</p>
          ) : (
            <>
              {searched && (
                <p className="text-gray-400 text-sm">{countText}</p>
              )}

              {results.length > 0 ? (
                results.map(room => {
                  const ca = room.tokenAddress || room.contractAddress || "";
                  const symbol = room.symbol || room.ticker || "";
                  const name = room.name || "";
                  const state = room.state || "INACTIVE";
                  const tier = room.tier || null;
                  const reason = statusReasonFromRoom(room);

                  return (
                    <div
                      key={room.roomId || ca || room.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
                    >
                      {/* Token info */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* ✅ 头像：优先 logo，没有就用 symbol 前两位 */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl overflow-hidden border border-gray-700/60",
                          "flex items-center justify-center text-lg font-bold",
                          "bg-gradient-to-br",
                          tier === "GOLD" ? "from-amber-500/30 to-orange-600/30 text-amber-400" :
                          tier === "PURPLE" ? "from-purple-500/30 to-pink-600/30 text-purple-400" :
                          "from-cyan-500/30 to-blue-600/30 text-cyan-400"
                        )}>
                          {room.logo ? (
                            <img
                              src={room.logo}
                              alt={symbol || "token"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            (symbol?.slice(0, 2) || "??").toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">${symbol}</span>
                            {state === "ACTIVE" && tier && <TierBadge tier={tier} size="sm" />}
                          </div>
                          <p className="text-gray-400 text-sm truncate">{name}</p>
                          <p className="text-gray-500 text-xs mt-1 font-mono">
                            {shortenCA(ca)}
                          </p>
                        </div>
                      </div>

                      {/* Status section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StateIcon state={state} />
                          <div>
                            {state === "ACTIVE" ? (
                              <span className="text-emerald-400 text-sm font-medium">直播中</span>
                            ) : state === "FROZEN" ? (
                              <div>
                                <span className="text-blue-400 text-sm font-medium block">已冻结</span>
                                <span className="text-gray-500 text-xs">{reason}</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-gray-400 text-sm font-medium block">未达标</span>
                                <span className="text-gray-500 text-xs">{reason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {state === "ACTIVE" ? (
                          // ✅ 用 ca 跳转（更适配真实后端）
                          <Link to={createPageUrl(`Room?ca=${normalize(ca)}`)}>
                            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                              进入房间
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="ghost" disabled className="text-gray-500">
                            {state === "FROZEN" ? "已冻结" : "未开放"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                searched && !loading && !errorText && (
                  <div className="text-center py-12">
                    <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">未找到匹配的代币</p>
                    <p className="text-gray-500 text-xs mt-1">请尝试其他关键词或输入 CA</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}

      {!query && !searched && (
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