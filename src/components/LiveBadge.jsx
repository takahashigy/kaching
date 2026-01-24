import React from 'react';
import { cn } from "@/lib/utils";
import WaveformIcon from './WaveformIcon';

export default function LiveBadge({ className }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
      "bg-emerald-500/20 border border-emerald-500/50",
      className
    )}>
      <WaveformIcon color="green" animate className="h-3" />
      <span className="text-emerald-400 text-xs font-medium">直播中</span>
    </div>
  );
}