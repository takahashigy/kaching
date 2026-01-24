import React from 'react';
import { cn } from "@/lib/utils";
import { Wallet, Check } from 'lucide-react';

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletToggle({ isConnected, onToggle, userAddress }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        "border select-none",
        isConnected
          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
      )}
    >
      {isConnected ? (
        <>
          <Check className="w-3 h-3" />
          <span className="font-mono truncate max-w-[90px]">
            {shortAddress(userAddress) || "已连接"}
          </span>
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
