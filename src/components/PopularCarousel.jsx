import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Headphones, Zap } from 'lucide-react';
import TierBadge from './TierBadge';
import WaveformIcon from './WaveformIcon';
import { motion, AnimatePresence } from 'framer-motion';

function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function PopularCarousel({ tokens = [] }) {
  const [centerIndex, setCenterIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoResetTimer = useRef(null);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  // Track image failures per token
  const [imgOkMap, setImgOkMap] = useState({});

  // Auto-snap back to #1 after idle
  useEffect(() => {
    if (centerIndex !== 0 && !isDragging) {
      autoResetTimer.current = setTimeout(() => {
        setCenterIndex(0);
      }, 4000);
    }
    return () => {
      if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
    };
  }, [centerIndex, isDragging]);

  // Keep centerIndex in range when tokens change
  useEffect(() => {
    if (centerIndex > tokens.length - 1) setCenterIndex(0);
  }, [tokens, centerIndex]);

  const handleTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX;
    dragCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
    if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
  };

  const handleTouchMove = (e) => {
    dragCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = dragStartX.current - dragCurrentX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && centerIndex < tokens.length - 1) {
        setCenterIndex(prev => prev + 1);
      } else if (diff < 0 && centerIndex > 0) {
        setCenterIndex(prev => prev - 1);
      }
    }
    setIsDragging(false);
  };

  const getCardStyle = (index) => {
    const offset = index - centerIndex;

    if (offset === 0) {
      return { scale: 1, opacity: 1, x: 0, zIndex: 30, rotateY: 0 };
    } else if (offset === -1) {
      return { scale: 0.85, opacity: 0.6, x: -120, zIndex: 20, rotateY: 15 };
    } else if (offset === 1) {
      return { scale: 0.85, opacity: 0.6, x: 120, zIndex: 20, rotateY: -15 };
    } else if (offset < -1) {
      return { scale: 0.7, opacity: 0.3, x: -180, zIndex: 10, rotateY: 25 };
    } else {
      return { scale: 0.7, opacity: 0.3, x: 180, zIndex: 10, rotateY: -25 };
    }
  };

  const getLogoSrc = (token) => {
    return (
      token?.logo ||
      token?.pfp ||
      token?.image ||
      token?.logoUrl ||
      token?.meta?.logo ||
      null
    );
  };

  const markImgFailed = (tokenId) => {
    setImgOkMap((prev) => ({ ...prev, [tokenId]: false }));
  };

  if (!tokens || tokens.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
        暂无热门房间
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Grid View */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tokens.slice(0, 8).map((token, index) => {
          const logoSrc = getLogoSrc(token);
          const imgOk = imgOkMap[token.id] !== false;
          const showImage = Boolean(logoSrc) && imgOk;

          return (
            <Link
              key={token.id}
              to={createPageUrl(`Room?id=${token.id}`)}
              className="block group"
            >
              <div
                className={cn(
                  "relative rounded-2xl transition-all duration-300 overflow-hidden",
                  "bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]",
                  "hover:scale-105 hover:shadow-2xl",
                  "border-2",
                  token.tier === "GOLD" && "border-amber-500/50 hover:border-amber-500/70 hover:shadow-amber-500/30",
                  token.tier === "PURPLE" && "border-purple-500/50 hover:border-purple-500/70 hover:shadow-purple-500/30",
                  token.tier === "BLUE" && "border-cyan-500/50 hover:border-cyan-500/70 hover:shadow-cyan-500/30"
                )}
              >
                {/* Waveform background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <WaveformIcon
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3]"
                    color={
                      token.tier === "GOLD" ? "orange" :
                      token.tier === "PURPLE" ? "purple" : "cyan"
                    }
                  />
                </div>

                {/* Rank badge */}
                <div
                  className={cn(
                    "absolute -top-2.5 -right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-20",
                    index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/50" :
                    index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800" :
                    index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                    "bg-gradient-to-br from-cyan-500 to-purple-600"
                  )}
                >
                  {index + 1}
                </div>

                <div className="relative p-6">
                  {/* Token avatar and info */}
                  <div className="flex flex-col items-center mb-6">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold mb-3 border-2",
                        "bg-gradient-to-br shadow-lg",
                        token.tier === "GOLD"
                          ? "from-amber-500/30 to-orange-600/30 text-amber-400 border-amber-500/50 shadow-amber-500/30"
                          : token.tier === "PURPLE"
                          ? "from-purple-500/30 to-pink-600/30 text-purple-400 border-purple-500/50 shadow-purple-500/30"
                          : "from-cyan-500/30 to-blue-600/30 text-cyan-400 border-cyan-500/50 shadow-cyan-500/30"
                      )}
                    >
                      {showImage ? (
                        <img
                          src={logoSrc}
                          alt={token?.name || token?.ticker || "token"}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => markImgFailed(token.id)}
                        />
                      ) : (
                        <span>{token.ticker?.slice(0, 2) || "??"}</span>
                      )}
                    </div>

                    <div className="text-center min-w-0 w-full">
                      <div className="flex items-center justify-center gap-2 mb-1.5">
                        <span className="font-bold text-white text-xl truncate">
                          ${token.ticker}
                        </span>
                        <TierBadge tier={token.tier} size="sm" />
                      </div>
                      <p className="text-gray-400 text-sm truncate">
                        {token.name}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-400 text-xs">市值</div>
                        <div className="text-white font-bold text-sm truncate">
                          ${formatNumber(token.marketCap)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-400 text-xs">听众</div>
                        <div className="text-white font-bold text-sm">
                          {token.listeners || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-400 text-xs">热度</div>
                        <div className="text-white font-bold text-sm">
                          +{token.joinVelocity || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <Users className="w-5 h-5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-400 text-xs">持有</div>
                        <div className="text-white font-bold text-sm">
                          {token.holders || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile Carousel View */}
      <div
        className="relative h-[280px] overflow-visible lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="sync">
            {tokens.map((token, index) => {
              const style = getCardStyle(index);
              const offset = index - centerIndex;

              const logoSrc = getLogoSrc(token);
              const imgOk = imgOkMap[token.id] !== false;
              const showImage = Boolean(logoSrc) && imgOk;

              return (
                <motion.div
                  key={token.id}
                  className="absolute"
                  initial={false}
                  animate={{
                    scale: style.scale,
                    opacity: style.opacity,
                    x: style.x,
                    zIndex: style.zIndex,
                    rotateY: style.rotateY
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
                >
                  <Link
                    to={createPageUrl(`Room?id=${token.id}`)}
                    className="block"
                    onClick={(e) => {
                      if (offset !== 0) {
                        e.preventDefault();
                        setCenterIndex(index);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "relative w-[82vw] max-w-[280px] rounded-2xl transition-all duration-300 overflow-hidden",
                        "bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]",
                        offset === 0 && "shadow-2xl",
                        "border-2",
                        token.tier === "GOLD" && offset === 0 && "border-amber-500/50 shadow-amber-500/30",
                        token.tier === "PURPLE" && offset === 0 && "border-purple-500/50 shadow-purple-500/30",
                        token.tier === "BLUE" && offset === 0 && "border-cyan-500/50 shadow-cyan-500/30"
                      )}
                      style={{
                        background: offset === 0 ? (
                          token.tier === "GOLD" ? "linear-gradient(135deg, #1a1f3a 0%, #2d1f0f 100%)" :
                          token.tier === "PURPLE" ? "linear-gradient(135deg, #1a1f3a 0%, #2d1f2d 100%)" :
                          "linear-gradient(135deg, #1a1f3a 0%, #0f1f2d 100%)"
                        ) : "linear-gradient(135deg, #1a1f3a 0%, #0f1229 100%)"
                      }}
                    >
                      {/* Waveform background */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <WaveformIcon
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3]"
                          color={
                            token.tier === "GOLD" ? "orange" :
                            token.tier === "PURPLE" ? "purple" : "cyan"
                          }
                        />
                      </div>

                      {/* Rank badge */}
                      <div
                        className={cn(
                          "absolute -top-2.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all z-20",
                          index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/50" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800" :
                          index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                          "bg-gradient-to-br from-cyan-500 to-purple-600"
                        )}
                      >
                        {index + 1}
                      </div>

                      <div className="relative p-4 pt-6">
                        {/* Token avatar and info */}
                        <div className="flex flex-col items-center mb-4">
                          <div
                            className={cn(
                              "w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-bold mb-2 border-2",
                              "bg-gradient-to-br shadow-lg",
                              token.tier === "GOLD"
                                ? "from-amber-500/30 to-orange-600/30 text-amber-400 border-amber-500/50 shadow-amber-500/30"
                                : token.tier === "PURPLE"
                                ? "from-purple-500/30 to-pink-600/30 text-purple-400 border-purple-500/50 shadow-purple-500/30"
                                : "from-cyan-500/30 to-blue-600/30 text-cyan-400 border-cyan-500/50 shadow-cyan-500/30"
                            )}
                          >
                            {showImage ? (
                              <img
                                src={logoSrc}
                                alt={token?.name || token?.ticker || "token"}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={() => markImgFailed(token.id)}
                              />
                            ) : (
                              <span>{token.ticker?.slice(0, 2) || "??"}</span>
                            )}
                          </div>

                          <div className="text-center min-w-0 w-full px-2">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <span className="font-bold text-white text-xl truncate">
                                ${token.ticker}
                              </span>
                              <TierBadge tier={token.tier} size="sm" />
                            </div>
                            <p className="text-gray-400 text-xs truncate">
                              {token.name}
                            </p>
                          </div>
                        </div>

                        {/* Stats grid - 2x2 layout for better fit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-gray-400 text-[10px]">市值</div>
                              <div className="text-white font-bold text-xs truncate">
                                ${formatNumber(token.marketCap)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                            <Headphones className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-gray-400 text-[10px]">听众</div>
                              <div className="text-white font-bold text-xs">
                                {token.listeners || 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-gray-400 text-[10px]">热度</div>
                              <div className="text-white font-bold text-xs">
                                +{token.joinVelocity || 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                            <Users className="w-4 h-4 text-purple-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-gray-400 text-[10px]">持有</div>
                              <div className="text-white font-bold text-xs">
                                {token.holders || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination dots - Mobile only */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        {tokens.map((_, index) => (
          <button
            key={index}
            onClick={() => setCenterIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === centerIndex
                ? "bg-gradient-to-r from-cyan-400 to-purple-500 w-6"
                : "bg-gray-600 hover:bg-gray-500"
            )}
          />
        ))}
      </div>
    </div>
  );
}