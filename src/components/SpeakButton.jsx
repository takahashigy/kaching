import React, { useState, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Mic, MicOff, Timer } from 'lucide-react';
import { getHoldingTitle } from './TitleBadge';

function getSpeakingLimits(holdingPercent) {
  if (holdingPercent >= 1) return { maxTime: 240, cooldown: 30 }; // 护法/宗主
  if (holdingPercent >= 0.5) return { maxTime: 120, cooldown: 45 }; // 堂主
  return { maxTime: 30, cooldown: 60 }; // 散户
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SpeakButton({ holdingPercent = 0.1 }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  const limits = getSpeakingLimits(holdingPercent);
  const { title } = getHoldingTitle(holdingPercent);
  
  const startSpeaking = useCallback(() => {
    if (cooldownTime > 0) return;
    setIsSpeaking(true);
    setSpeakingTime(limits.maxTime);
  }, [cooldownTime, limits.maxTime]);
  
  const stopSpeaking = useCallback(() => {
    setIsSpeaking(false);
    setSpeakingTime(0);
    setCooldownTime(limits.cooldown);
  }, [limits.cooldown]);
  
  useEffect(() => {
    let interval;
    if (isSpeaking && speakingTime > 0) {
      interval = setInterval(() => {
        setSpeakingTime(t => {
          if (t <= 1) {
            stopSpeaking();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSpeaking, speakingTime, stopSpeaking]);
  
  useEffect(() => {
    let interval;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(t => Math.max(0, t - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);
  
  const isOnCooldown = cooldownTime > 0;
  const progress = isSpeaking ? (speakingTime / limits.maxTime) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main button */}
      <button
        onClick={isSpeaking ? stopSpeaking : startSpeaking}
        disabled={isOnCooldown}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
          "shadow-lg",
          isSpeaking 
            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30 animate-pulse" 
            : isOnCooldown
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-gradient-to-br from-cyan-500 to-purple-600 shadow-cyan-500/30 hover:scale-105"
        )}
      >
        {/* Progress ring */}
        {isSpeaking && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
        )}
        
        {isSpeaking ? (
          <MicOff className="w-8 h-8 text-white relative z-10" />
        ) : (
          <Mic className="w-8 h-8 text-white relative z-10" />
        )}
      </button>
      
      {/* Status text */}
      <div className="text-center">
        {isSpeaking ? (
          <div className="flex items-center gap-2 text-red-400">
            <Timer className="w-4 h-4 animate-pulse" />
            <span className="font-mono font-bold">{formatTime(speakingTime)}</span>
          </div>
        ) : isOnCooldown ? (
          <div className="text-gray-400 text-sm">
            <span>冷却中 </span>
            <span className="font-mono">{formatTime(cooldownTime)}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">点击发言</span>
        )}
      </div>
      
      {/* Speaking limits info */}
      <div className="text-[10px] text-gray-500 text-center">
        <span className="text-gray-400">{title}</span>
        <span> · 最长 {formatTime(limits.maxTime)} · 冷却 {limits.cooldown}秒</span>
      </div>
    </div>
  );
}