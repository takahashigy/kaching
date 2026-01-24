import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function WaveformIcon({ className, color = "cyan", animate = false }) {
  const bars = [3, 8, 5, 10, 6, 9, 4, 7, 5, 8];
  
  return (
    <div className={cn("flex items-center gap-0.5 h-8", className)}>
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-0.5 rounded-full",
            color === "cyan" && "bg-cyan-400",
            color === "green" && "bg-emerald-400",
            color === "purple" && "bg-purple-400",
            color === "orange" && "bg-orange-400"
          )}
          style={{ height: `${height * 2}px` }}
          animate={animate ? {
            height: [`${height * 2}px`, `${Math.random() * 20 + 4}px`, `${height * 2}px`]
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}