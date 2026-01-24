import React from 'react';
import { cn } from "@/lib/utils";
import { Wallet, Check } from 'lucide-react';

export default function WalletToggle({ isConnected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        "border",
        isConnected
          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
      )}
    >
      {isConnected ? (
        <>
          <Check className="w-3 h-3" />
          <span>已连接</span>
        </>
      ) : (
        <>
          <Wallet className="w-3 h-3" />
          <span>连接钱包</span>
        </>
      )}
    </button>
  );
}