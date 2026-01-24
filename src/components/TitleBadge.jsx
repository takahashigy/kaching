import React from 'react';
import { cn } from "@/lib/utils";
import { Crown, Shield, Star, User } from 'lucide-react';

export function getHoldingTitle(holdingPercent) {
  if (holdingPercent >= 4) return { title: "宗主", titleEn: "Leader", icon: Crown, color: "text-amber-400 bg-amber-500/20" };
  if (holdingPercent >= 1) return { title: "护法", titleEn: "Guardian", icon: Shield, color: "text-purple-400 bg-purple-500/20" };
  if (holdingPercent >= 0.5) return { title: "堂主", titleEn: "Hall Master", icon: Star, color: "text-cyan-400 bg-cyan-500/20" };
  return { title: "散户", titleEn: "Retail", icon: User, color: "text-gray-400 bg-gray-500/20" };
}

export function getGlobalTitle(pnlTier) {
  const titles = {
    Legend: { title: "传说", color: "text-amber-400" },
    Grandmaster: { title: "宗师", color: "text-purple-400" },
    Elite: { title: "精英", color: "text-cyan-400" },
    Rookie: { title: "新秀", color: "text-emerald-400" },
    Bagholder: { title: "韭菜", color: "text-gray-400" }
  };
  return titles[pnlTier] || titles.Rookie;
}

export default function TitleBadge({ holdingPercent, showIcon = true }) {
  const { title, icon: Icon, color } = getHoldingTitle(holdingPercent);
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      color
    )}>
      {showIcon && <Icon className="w-3 h-3" />}
      {title}
    </span>
  );
}