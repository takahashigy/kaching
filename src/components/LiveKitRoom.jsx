import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Mic, MicOff, Volume2, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  // 连接到 LiveKit 房间
  const connectToRoom = useCallback(async () => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);

    try {
      // 调用后端获取 token
      const response = await fetch('/api/functions/getLiveKitToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName, 
          userHoldingPercent 
        }),
      });

      const data = await response.json();
      
      console.log('🎤 LiveKit token response:', { ok: response.ok, status: response.status, data });
      
      if (!response.ok) {
        console.error('❌ Token request failed:', data);
        throw new Error(data.error || data.message || 'Failed to get token');
      }

      const { token, wsUrl, canPublish: canPub } = data;
      setCanPublish(canPub);

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
    if (!room || !canPublish) return;

    try {
      const enabled = !isMuted;
      await room.localParticipant.setMicrophoneEnabled(enabled);
      setIsMuted(!enabled);
    } catch (err) {
      console.error('Toggle microphone error:', err);
    }
  }, [room, isMuted, canPublish]);

  // 初始化连接
  useEffect(() => {
    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomName]); // 只在 roomName 变化时重新连接

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

      {/* 麦克风控制 */}
      <Button
        onClick={toggleMicrophone}
        disabled={!canPublish}
        className={cn(
          "w-full py-6 text-base font-medium transition-all",
          isMuted 
            ? "bg-gray-700 hover:bg-gray-600" 
            : isSpeaking
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse"
              : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
        )}
      >
        <div className="flex items-center gap-3">
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span>
            {!canPublish 
              ? `需要持仓 ≥ 0.01% 才能发言` 
              : isMuted 
                ? "点击发言" 
                : isSpeaking 
                  ? "正在说话..." 
                  : "静音"}
          </span>
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