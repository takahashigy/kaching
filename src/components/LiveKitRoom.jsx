import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Room, RoomEvent, Track, ParticipantEvent } from 'livekit-client';
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
  
  const connectingRef = useRef(false);
  const roomRef = useRef(null);
  
  // 发言时长和冷却时间
  const [remainingTime, setRemainingTime] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  
  // 音量级别（0-1）
  const [audioLevel, setAudioLevel] = useState(0);
  
  // 排队位置（模拟）
  const [queuePosition, setQueuePosition] = useState(0);

  // 连接到 LiveKit 房间
  const connectToRoom = useCallback(async () => {
    console.log('🔌 connectToRoom 开始, roomName:', roomName, 'userHoldingPercent:', userHoldingPercent);
    
    // 防止重复连接
    if (connectingRef.current) {
      console.log('⚠️ 已经在连接中，跳过');
      return;
    }
    
    // 断开旧连接
    if (roomRef.current) {
      console.log('🔌 断开旧连接');
      await roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setConnected(false);
    }

    connectingRef.current = true;
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
      console.log('✅ 后端返回 - 持仓%:', userHoldingPercent, '可发言:', canPub);
      setCanPublish(canPub);

      // 创建 Room 实例
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      
      roomRef.current = newRoom;

      // 监听连接状态变化
      newRoom.on(RoomEvent.Connected, () => {
        console.log('✅ Room Connected - 连接成功！');
        setConnected(true);
        updateParticipants(newRoom);
      });
      
      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('🔄 Connection state:', state);
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
          s => s.identity === newRoom.localParticipant?.identity
        );
        console.log('🗣️ ActiveSpeakers changed, local isSpeaking:', localIsSpeaking);
        setIsSpeaking(localIsSpeaking);
        onSpeakingChange?.(localIsSpeaking);
      });

      // ① 先连接
      console.log('🔗 开始连接到房间...');
      await newRoom.connect(wsUrl, token);
      console.log('🎉 connect() 完成，roomID:', newRoom.name);
      
      // ② 连接成功后立即设置音量监听
      newRoom.localParticipant.on(ParticipantEvent.AudioLevelChanged, (level) => {
        console.log('🔊 audioLevel changed:', level);
        setAudioLevel(level);
      });
      
      newRoom.localParticipant.on(ParticipantEvent.IsSpeakingChanged, (speaking) => {
        console.log('🗣️ isSpeaking changed:', speaking);
        setIsSpeaking(speaking);
      });
      
      setRoom(newRoom);

    } catch (err) {
      console.error('❌ LiveKit connection error:', err);
      setError(err.message);
      roomRef.current = null;
    } finally {
      setConnecting(false);
      connectingRef.current = false;
    }
  }, [roomName, userHoldingPercent, onSpeakingChange]);

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
        // 开启麦克风 - 先请求浏览器权限
        console.log('🎤 请求麦克风权限...');
        
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('✅ 麦克风权限已授予');
        } catch (permError) {
          console.error('❌ 麦克风权限被拒绝:', permError);
          alert('需要麦克风权限才能发言，请在浏览器设置中允许麦克风访问。');
          return;
        }
        
        const limits = getSpeakingLimits(userHoldingPercent);
        
        // ② 在 connected 之后才 publish
        console.log('🎤 开启麦克风，roomID:', room.name);
        await room.localParticipant.setMicrophoneEnabled(true);
        
        setIsMuted(false);
        setRemainingTime(limits.speakDuration);
        console.log('✅ 麦克风已开启，可发言', limits.speakDuration, '秒，等待音量数据...');
      } else {
        // 提前结束发言，进入冷却
        const limits = getSpeakingLimits(userHoldingPercent);
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
        setRemainingTime(0);
        setAudioLevel(0);
        setIsOnCooldown(true);
        setCooldownTime(limits.cooldown);
        console.log('✅ 提前结束发言，进入冷却', limits.cooldown, '秒');
      }
    } catch (err) {
      console.error('❌ Toggle microphone error:', err);
      alert('麦克风开启失败: ' + err.message);
    }
  }, [room, canPublish, isMuted, isOnCooldown, userHoldingPercent]);

  // 清理：关闭麦克风时重置音量
  useEffect(() => {
    if (isMuted) {
      setAudioLevel(0);
    }
  }, [isMuted]);

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

  // 初始化连接（仅在 roomName 变化时）
  useEffect(() => {
    connectToRoom();

    return () => {
      if (roomRef.current) {
        console.log('🔌 组件卸载，断开连接');
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [roomName]); // 只在房间名变化时重连，持仓变化不重连

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

  const limits = getSpeakingLimits(userHoldingPercent);

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

      {/* 正在发言浮条 */}
      {!isMuted && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* 头像 + 动态音量圆环 */}
              <div className="relative w-12 h-12">
                {/* 音量圆环 - 外层 */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-700"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${audioLevel * 138} 138`}
                    className={cn(
                      "transition-all duration-100",
                      audioLevel > 0.7 ? "text-red-400" :
                      audioLevel > 0.4 ? "text-yellow-400" :
                      "text-cyan-400"
                    )}
                    style={{
                      filter: audioLevel > 0.1 ? `drop-shadow(0 0 ${audioLevel * 8}px currentColor)` : 'none'
                    }}
                  />
                </svg>

                {/* 头像/麦克风图标 */}
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>

                {/* 脉动效果 */}
                {audioLevel > 0.1 && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping"
                      style={{ animationDuration: '1s' }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping"
                      style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}
                    />
                  </>
                )}
              </div>

              <div>
                <div className="text-cyan-400 font-medium flex items-center gap-2">
                  你正在发言
                  {/* 音波动画指示器 */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-cyan-400 rounded-full"
                        style={{
                          height: `${8 + (audioLevel > 0.1 ? Math.random() * audioLevel * 8 : 0)}px`,
                          animation: audioLevel > 0.1 ? `pulse ${0.6 + i * 0.1}s ease-in-out infinite` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400">剩余 {remainingTime} 秒</div>
              </div>
            </div>
            <Button
              onClick={toggleMicrophone}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white"
            >
              结束发言
            </Button>
          </div>

          {/* 音量强度条 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>麦克风强度</span>
              <span>{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="flex items-center gap-1 h-8">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm transition-all duration-75",
                    audioLevel * 20 > i 
                      ? i < 12 
                        ? "bg-green-500" 
                        : i < 16 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                      : "bg-gray-700"
                  )}
                  style={{
                    height: `${20 + (i * 3)}%`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 排队提示 */}
      {canPublish && isMuted && !isOnCooldown && queuePosition > 0 && (
        <div className="text-center p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-amber-400 text-sm">排队中：第 {queuePosition} 位</span>
        </div>
      )}

      {/* 麦克风控制（只在未发言时显示） */}
      {isMuted && (
        <Button
          onClick={toggleMicrophone}
          disabled={!canPublish || isOnCooldown}
          className={cn(
            "w-full py-6 text-base font-medium transition-all",
            isOnCooldown
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gray-700 hover:bg-gray-600"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <MicOff className="w-5 h-5" />
              <span>
                {!canPublish 
                  ? `需要持仓 ≥ 0.01% 才能发言` 
                  : isOnCooldown
                    ? `冷却中 ${cooldownTime}s`
                    : `点击发言 (${limits.title}·${limits.speakDuration}s)`}
              </span>
            </div>
            {isOnCooldown && (
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-red-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(cooldownTime / limits.cooldown) * 100}%` 
                  }}
                />
              </div>
            )}
          </div>
        </Button>
      )}

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