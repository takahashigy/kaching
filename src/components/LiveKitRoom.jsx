import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Mic, MicOff, Volume2, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 根据持仓%计算发言时长和冷却时间
function getSpeakingLimits(holdingPercent) {
  const h = Number(holdingPercent) || 0;
  
  if (h >= 4) {
    // 宗主
    return { speakDuration: 180, cooldown: 30, title: '宗主' };
  } else if (h >= 1) {
    // 护法
    return { speakDuration: 120, cooldown: 45, title: '护法' };
  } else if (h >= 0.5) {
    // 堂主
    return { speakDuration: 60, cooldown: 60, title: '堂主' };
  } else if (h >= 0.01) {
    // 散户
    return { speakDuration: 30, cooldown: 90, title: '散户' };
  } else {
    // 无持仓
    return { speakDuration: 0, cooldown: 0, title: '游客' };
  }
}

export default function LiveKitRoom({ 
  roomName, 
  userHoldingPercent = 0,
  onParticipantCountChange,
  onSpeakingChange 
}) {
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [canPublish, setCanPublish] = useState(false);
  
  // 发言时长和冷却时间
  const [remainingTime, setRemainingTime] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  // 连接到 LiveKit 房间
  const connectToRoom = useCallback(async () => {
    console.log('🔌 connectToRoom 开始, roomName:', roomName, 'userHoldingPercent:', userHoldingPercent);
    
    // 断开旧连接
    if (room) {
      room.disconnect();
      setRoom(null);
      setConnected(false);
    }
    
    if (connecting) return;

    setConnecting(true);
    setError(null);

    try {
      // 调用后端获取 token
      const { base44 } = await import('@/api/base44Client');
      console.log('📡 调用后端 getLiveKitToken, 参数:', { roomName, userHoldingPercent });
      const response = await base44.functions.invoke('getLiveKitToken', { 
        roomName, 
        userHoldingPercent 
      });

      const data = response.data;
      
      console.log('🎤 LiveKit token response:', { status: response.status, data });
      
      if (response.status !== 200 || !data) {
        console.error('❌ Token request failed:', data);
        throw new Error(data?.error || data?.message || 'Failed to get token');
      }

      const { token, wsUrl, canPublish: canPub } = data;
      console.log('✅ 后端返回 - 持仓%:', userHoldingPercent, '可发言:', canPub, 'canPub类型:', typeof canPub);
      setCanPublish(canPub);
      console.log('✅ setCanPublish 已调用:', canPub);

      // 创建 Room 实例
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // 监听参与者变化
      newRoom.on(RoomEvent.ParticipantConnected, () => {
        updateParticipants(newRoom);
      });
      
      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipants(newRoom);
      });

      // 监听说话状态
      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const localIsSpeaking = speakers.some(
          s => s.identity === newRoom.localParticipant.identity
        );
        setIsSpeaking(localIsSpeaking);
        onSpeakingChange?.(localIsSpeaking);
      });

      // 连接到房间
      await newRoom.connect(wsUrl, token);
      
      setRoom(newRoom);
      setConnected(true);
      updateParticipants(newRoom);

    } catch (err) {
      console.error('LiveKit connection error:', err);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }, [roomName, userHoldingPercent, connecting, connected, onSpeakingChange]);

  // 更新参与者列表
  const updateParticipants = (room) => {
    if (!room) return;
    const parts = Array.from(room.remoteParticipants.values());
    setParticipants(parts);
    onParticipantCountChange?.(parts.length + 1); // +1 包括自己
  };

  // 切换麦克风
  const toggleMicrophone = useCallback(async () => {
    if (!room || !canPublish) {
      console.log('❌ 无法切换麦克风: room=', !!room, 'canPublish=', canPublish);
      return;
    }

    if (isOnCooldown) {
      console.log('❌ 冷却中，无法发言');
      return;
    }

    try {
      if (isMuted) {
        // 开启麦克风
        const limits = getSpeakingLimits(userHoldingPercent);
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
        setRemainingTime(limits.speakDuration);
        console.log('✅ 开启麦克风，可发言', limits.speakDuration, '秒');
      } else {
        // 关闭麦克风
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
        setRemainingTime(0);
        console.log('✅ 关闭麦克风');
      }
    } catch (err) {
      console.error('Toggle microphone error:', err);
    }
  }, [room, canPublish, isMuted, isOnCooldown, userHoldingPercent]);

  // 倒计时逻辑
  useEffect(() => {
    if (!isMuted && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // 时间到，自动关闭麦克风并进入冷却
            if (room) {
              room.localParticipant.setMicrophoneEnabled(false);
            }
            setIsMuted(true);
            
            const limits = getSpeakingLimits(userHoldingPercent);
            setIsOnCooldown(true);
            setCooldownTime(limits.cooldown);
            console.log('⏰ 发言时间到，进入冷却', limits.cooldown, '秒');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMuted, remainingTime, room, userHoldingPercent]);

  // 冷却倒计时
  useEffect(() => {
    if (isOnCooldown && cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsOnCooldown(false);
            console.log('✅ 冷却结束');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOnCooldown, cooldownTime]);

  // 初始化连接
  useEffect(() => {
    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomName, userHoldingPercent]); // 持仓或房间变化时重新连接

  // 渲染连接状态
  if (connecting) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">连接音频房间...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <p className="text-red-400 text-sm">音频连接失败: {error}</p>
        <Button 
          onClick={connectToRoom} 
          variant="ghost" 
          size="sm" 
          className="mt-2 text-red-400"
        >
          重试
        </Button>
      </div>
    );
  }

  if (!connected) return null;

  return (
    <div className="space-y-3">
      {/* 房间状态 */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-300">音频已连接</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-400">
          <Users className="w-4 h-4" />
          <span className="text-sm">{participants.length + 1}</span>
        </div>
      </div>

      {/* 调试信息 */}
      <div className="text-xs text-gray-500 mb-2">
        持仓: {userHoldingPercent.toFixed(2)}% | 可发言: {canPublish ? '是' : '否'}
      </div>

      {/* 麦克风控制 */}
      <Button
        onClick={toggleMicrophone}
        disabled={!canPublish || isOnCooldown}
        className={cn(
          "w-full py-6 text-base font-medium transition-all",
          isOnCooldown
            ? "bg-gray-600 cursor-not-allowed"
            : isMuted 
              ? "bg-gray-700 hover:bg-gray-600" 
              : isSpeaking
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span>
              {!canPublish 
                ? `需要持仓 ≥ 0.01% 才能发言` 
                : isOnCooldown
                  ? `冷却中 ${cooldownTime}s`
                  : isMuted 
                    ? `点击发言 (${getSpeakingLimits(userHoldingPercent).title})` 
                    : `发言中 ${remainingTime}s`}
            </span>
          </div>
          {!isMuted && remainingTime > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${(remainingTime / getSpeakingLimits(userHoldingPercent).speakDuration) * 100}%` 
                }}
              />
            </div>
          )}
        </div>
      </Button>

      {/* 参与者列表 */}
      {participants.length > 0 && (
        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-2">房间内的其他人：</p>
          <div className="space-y-1">
            {participants.map((p) => (
              <div 
                key={p.identity} 
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <Volume2 className="w-3 h-3" />
                <span>{p.name || p.identity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}