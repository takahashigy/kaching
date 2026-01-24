import React, { useState } from 'react';
import { useMockData } from '@/components/MockDataProvider';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import WalletToggle from '@/components/WalletToggle';
import { getGlobalTitle } from '@/components/TitleBadge';
import { Edit2, Check, Upload, User } from 'lucide-react';

const DEFAULT_AVATARS = [
  '🦄', '🐉', '🦊', '🐼', '🦁', '🐯',
  '🐻', '🐨', '🐸', '🦉', '🦅', '🐺',
  '🦝', '🐱', '🐶', '🐷', '🐮', '🐵'
];

export default function Profile() {
  const { 
    walletConnected,
    toggleWallet,
    userAddress,
    globalPNLTier, 
    setGlobalPNLTier 
  } = useMockData();
  
  const [nickname, setNickname] = useState('匿名用户');
  const [avatar, setAvatar] = useState('🦄');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);
  
  const globalTitle = getGlobalTitle(globalPNLTier);

  const handleSaveName = () => {
    setNickname(tempNickname);
    setIsEditingName(false);
  };

  const handleAvatarSelect = (emoji) => {
    setAvatar(emoji);
    setShowAvatarGallery(false);
  };

  const handleUploadAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result);
        setShowAvatarGallery(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">个人资料</h1>
        <p className="text-gray-500 text-xs">管理你的账户信息</p>
      </div>

      {/* Profile card */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl p-6 mb-6 border border-gray-700">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-gray-700",
              "overflow-hidden"
            )}>
              {avatar.startsWith('data:') ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{avatar}</span>
              )}
            </div>
            <button
              onClick={() => setShowAvatarGallery(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 hover:bg-cyan-600 transition-all shadow-lg"
            >
              <Edit2 className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Nickname */}
          <div className="mt-4 text-center w-full">
            {isEditingName ? (
              <div className="flex items-center gap-2 justify-center">
                <Input
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="h-8 w-32 text-center bg-gray-700 border-gray-600"
                  maxLength={12}
                />
                <Button size="icon" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xl font-bold">{nickname}</span>
                <button
                  onClick={() => {
                    setTempNickname(nickname);
                    setIsEditingName(true);
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Edit2 className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Global title */}
          {walletConnected && (
            <div className="mt-3 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700">
              <span className={cn("text-sm font-medium", globalTitle.color)}>
                {globalTitle.title}
              </span>
            </div>
          )}
        </div>

        {/* Wallet section */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-gray-400">钱包连接</Label>
            <WalletToggle 
              isConnected={walletConnected}
              onToggle={toggleWallet}
              userAddress={userAddress}
            />
          </div>

          {/* Mock PNL tier selector for testing */}
          {walletConnected && (
            <div>
              <Label className="text-gray-400 text-xs mb-2 block">
                PNL 等级 (测试用)
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {['Legend', 'Grandmaster', 'Elite', 'Rookie', 'Bagholder'].map(tier => {
                  const title = getGlobalTitle(tier);
                  return (
                    <button
                      key={tier}
                      onClick={() => setGlobalPNLTier(tier)}
                      className={cn(
                        "px-2 py-2 rounded-lg text-xs font-medium transition-all",
                        "border",
                        globalPNLTier === tier
                          ? `${title.color} bg-gray-700 border-gray-600`
                          : "text-gray-500 border-gray-800 hover:border-gray-700"
                      )}
                    >
                      {title.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar gallery modal */}
      {showAvatarGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-bold mb-4">选择头像</h3>
            
            {/* Avatar grid */}
            <div className="grid grid-cols-6 gap-3 mb-4">
              {DEFAULT_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAvatarSelect(emoji)}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    "bg-gray-800 hover:bg-gray-700 transition-all",
                    "border-2",
                    avatar === emoji ? "border-cyan-500" : "border-transparent"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Upload custom */}
            <div className="border-t border-gray-800 pt-4">
              <Label
                htmlFor="avatar-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">上传自定义头像</span>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleUploadAvatar}
                className="hidden"
              />
            </div>

            <Button
              onClick={() => setShowAvatarGallery(false)}
              variant="outline"
              className="w-full mt-4"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}