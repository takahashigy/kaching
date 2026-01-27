import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Search, Star, TrendingUp, Award, Bookmark, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import WalletToggle from '@/components/WalletToggle';
import { useMockData } from '@/components/MockDataProvider';

const navItems = [
  { name: 'Lobby', icon: Home, label: '大厅' },
  { name: 'Search', icon: Search, label: '搜索' },
  { name: 'GoldFeatured', icon: Award, label: '金榜', color: 'text-amber-400' },
  { name: 'PurpleRanking', icon: TrendingUp, label: '紫榜', color: 'text-purple-400' },
  { name: 'Watchlist', icon: Bookmark, label: '关注' },
  { name: 'Profile', icon: User, label: '我的' },
];

export default function SideNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { stats } = useMockData();

  return (
    <div className="w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl font-bold">K</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              KaChing
            </h1>
            <p className="text-[10px] text-gray-500">Audio Rooms</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-800/30 rounded-lg p-2">
            <p className="text-xs text-gray-400">今日新增</p>
            <p className="text-lg font-bold text-green-400">+{stats.newRoomsToday}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2">
            <p className="text-xs text-gray-400">冻结</p>
            <p className="text-lg font-bold text-red-400">{stats.frozenRoomsToday}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2">
            <p className="text-xs text-gray-400">活跃中</p>
            <p className="text-lg font-bold text-cyan-400">{stats.totalActive}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === createPageUrl(item.name);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={createPageUrl(item.name)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "bg-gray-800/80 text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && item.color)} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="p-4 border-t border-gray-800/50">
        <WalletToggle />
      </div>
    </div>
  );
}