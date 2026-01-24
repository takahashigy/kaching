import React from 'react';
import { cn } from "@/lib/utils";

const tierConfig = {
  BLUE: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/50",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20"
  },
  PURPLE: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/50",
    text: "text-purple-400",
    glow: "shadow-purple-500/20"
  },
  GOLD: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-400",
    glow: "shadow-amber-500/20"
  }
};

export default function TierBadge({ tier, size = "sm" }) {
  const config = tierConfig[tier] || tierConfig.BLUE;
  
  return (
    <span className={cn(
      "inline-flex items-center font-bold border-2 rounded-full uppercase tracking-wide",
      config.bg, config.border, config.text,
      `shadow-lg ${config.glow}`,
      size === "sm" ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-xs"
    )}>
      {tier}
    </span>
  );
}