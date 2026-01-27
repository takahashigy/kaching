import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { Home, Trophy, Star, Volume2, User, Search } from 'lucide-react';

const navItems = [
  { name: "Lobby", icon: Home, label: "大厅" },
  { name: "Watchlist", icon: Star, label: "自选" },
  { name: "ShoutMode", icon: Volume2, label: "叫了么", color: "text-pink-400" },
  { name: "Search", icon: Trophy, label: "搜索" },
  { name: "Profile", icon: User, label: "我的" }
];

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname.replace('/', '');
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#0a0e27]/95 backdrop-blur-xl border-t border-gray-800/50">
        <div className="max-w-md md:max-w-2xl mx-auto flex justify-around items-center h-16 md:h-20 px-2 md:gap-8">
          {navItems.map(({ name, icon: Icon, label, color }) => {
            const isActive = currentPath === name || (currentPath === '' && name === 'Lobby');
            return (
              <Link
                key={name}
                to={createPageUrl(name)}
                className={cn(
                  "flex flex-col items-center justify-center w-16 md:w-20 h-14 md:h-16 rounded-xl transition-all",
                  isActive 
                    ? "text-white" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon className={cn(
                  "w-6 h-6 md:w-7 md:h-7 mb-0.5 stroke-[1.5]",
                  isActive && (color || "text-cyan-400")
                )} />
                <span className="text-[10px] md:text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area spacer */}
      <div className="h-safe-area-inset-bottom bg-[#0a0e27]" />
    </nav>
  );
}