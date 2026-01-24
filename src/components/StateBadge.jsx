import React from 'react';
import { cn } from "@/lib/utils";
import { Radio, Snowflake, Circle } from 'lucide-react';

const stateConfig = {
  ACTIVE: {
    icon: Radio,
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "直播中"
  },
  FROZEN: {
    icon: Snowflake,
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    label: "已冻结"
  },
  INACTIVE: {
    icon: Circle,
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    label: "未激活"
  }
};

export default function StateBadge({ state }) {
  const config = stateConfig[state] || stateConfig.INACTIVE;
  const Icon = config.icon;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
      config.bg, config.text
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}