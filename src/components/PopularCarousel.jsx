import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Headphones, Zap } from 'lucide-react';
import TierBadge from './TierBadge';
import { motion, AnimatePresence } from 'framer-motion';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

export default function PopularCarousel({ tokens }) {
  const [centerIndex, setCenterIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoResetTimer = useRef(null);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

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

  const handleTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX;
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
      // Center card
      return {
        scale: 1,
        opacity: 1,
        x: 0,
        zIndex: 30,
        rotateY: 0
      };
    } else if (offset === -1) {
      // Left card
      return {
        scale: 0.85,
        opacity: 0.6,
        x: -120,
        zIndex: 20,
        rotateY: 15
      };
    } else if (offset === 1) {
      // Right card
      return {
        scale: 0.85,
        opacity: 0.6,
        x: 120,
        zIndex: 20,
        rotateY: -15
      };
    } else if (offset < -1) {
      // Far left
      return {
        scale: 0.7,
        opacity: 0.3,
        x: -180,
        zIndex: 10,
        rotateY: 25
      };
    } else {
      // Far right
      return {
        scale: 0.7,
        opacity: 0.3,
        x: 180,
        zIndex: 10,
        rotateY: -25
      };
    }
  };

  return (
    <div className="relative">
      {/* Carousel container */}
      <div 
        className="relative h-[280px] overflow-visible"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="sync">
            {tokens.map((token, index) => {
              const style = getCardStyle(index);
              const offset = index - centerIndex;
              
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
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  style={{
                    perspective: 1000,
                    transformStyle: 'preserve-3d'
                  }}
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
                    <div className={cn(
                      "relative w-[280px] rounded-2xl border transition-all duration-300",
                      "bg-gradient-to-br from-gray-900/95 to-gray-800/80",
                      "border-gray-700/50 backdrop-blur-xl",
                      offset === 0 && "shadow-2xl",
                      token.tier === "GOLD" && offset === 0 && "border-amber-500/40 shadow-amber-500/20",
                      token.tier === "PURPLE" && offset === 0 && "border-purple-500/40 shadow-purple-500/20"
                    )}>
                      {/* Rank badge */}
                      <div className={cn(
                        "absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all",
                        index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800" :
                        index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                        "bg-gradient-to-br from-cyan-500 to-purple-600"
                      )}>
                        {index + 1}
                      </div>
                      
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold",
                            "bg-gradient-to-br",
                            token.tier === "GOLD" ? "from-amber-500/30 to-orange-600/30 text-amber-400" :
                            token.tier === "PURPLE" ? "from-purple-500/30 to-pink-600/30 text-purple-400" :
                            "from-cyan-500/30 to-blue-600/30 text-cyan-400"
                          )}>
                            {token.ticker?.slice(0, 2)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white text-lg truncate">${token.ticker}</span>
                              <TierBadge tier={token.tier} />
                            </div>
                            <p className="text-gray-400 text-xs truncate">{token.name}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div className="flex flex-col items-center gap-1 bg-gray-800/50 rounded-lg p-2">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-gray-400">${formatNumber(token.marketCap)}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 bg-gray-800/50 rounded-lg p-2">
                            <Headphones className="w-3 h-3 text-cyan-400" />
                            <span className="text-gray-400">{token.listeners || 0}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 bg-gray-800/50 rounded-lg p-2">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-400">{token.holders || 0}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 bg-gray-800/50 rounded-lg p-2">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-gray-400">+{token.joinVelocity || 0}</span>
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

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
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