import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, Trophy, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_LEADERBOARD = [
  { id: 1, avatar: '🦁', nickname: '狮吼王', todayScore: 98, historyScore: 105 },
  { id: 2, avatar: '🐯', nickname: '虎啸山林', todayScore: 95, historyScore: 102 },
  { id: 3, avatar: '🦅', nickname: '鹰击长空', todayScore: 92, historyScore: 98 },
  { id: 4, avatar: '🐉', nickname: '龙吟九天', todayScore: 88, historyScore: 95 },
  { id: 5, avatar: '🐺', nickname: '狼嚎月夜', todayScore: 85, historyScore: 90 }
];

export default function ShoutMode() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentDb, setCurrentDb] = useState(0);
  const [resultScore, setResultScore] = useState(null);
  const [todayBest, setTodayBest] = useState(0);
  const [isInvalid, setIsInvalid] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Countdown
      setCountdown(3);
      const countInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countInterval);
            setIsRecording(true);
            startMeasuring();
            
            // Auto stop after 4 seconds
            setTimeout(() => {
              stopRecording();
            }, 4000);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const startMeasuring = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const measure = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      
      // Map to dB range (40-120)
      const mappedDb = 40 + (average / 255) * 80;
      setCurrentDb(Math.round(mappedDb));
      
      animationFrameRef.current = requestAnimationFrame(measure);
    };
    
    measure();
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (isRecording) {
      const finalScore = currentDb;
      
      // Check validity
      if (finalScore > 110) {
        setIsInvalid(true);
        setResultScore(finalScore);
      } else {
        setIsInvalid(false);
        setResultScore(finalScore);
        
        // Update today best
        if (finalScore > todayBest) {
          setTodayBest(finalScore);
        }
      }
    }

    setIsRecording(false);
    setCountdown(0);
    setCurrentDb(0);
  };

  const handleStartShout = () => {
    setResultScore(null);
    setIsInvalid(false);
    startRecording();
  };

  const getDbColor = (db) => {
    if (db < 60) return 'text-gray-400';
    if (db < 80) return 'text-cyan-400';
    if (db < 95) return 'text-purple-400';
    if (db < 110) return 'text-amber-400';
    return 'text-red-400';
  };

  const getDbGradient = (db) => {
    if (db < 60) return 'from-gray-500 to-gray-600';
    if (db < 80) return 'from-cyan-500 to-cyan-600';
    if (db < 95) return 'from-purple-500 to-purple-600';
    if (db < 110) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
          叫了么
        </h1>
        <p className="text-gray-500 text-xs">释放压力，看谁叫得最响</p>
      </div>

      {/* Safety disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-amber-300 text-xs">
          仅娱乐用途，请注意周围环境与听力保护。
        </p>
      </div>

      {/* Today's best */}
      {todayBest > 0 && (
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs mb-1">今日最佳</p>
              <p className="text-2xl font-bold text-purple-400">{todayBest} dB</p>
            </div>
            <Trophy className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      )}

      {/* Shout interface */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8 mb-6">
        <AnimatePresence mode="wait">
          {countdown > 0 && (
            <motion.div
              key="countdown"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <div className="text-8xl font-bold text-cyan-400 mb-4">
                {countdown}
              </div>
              <p className="text-gray-400">准备好你的嗓子...</p>
            </motion.div>
          )}

          {isRecording && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className={cn(
                  "absolute inset-0 rounded-full animate-ping",
                  `bg-gradient-to-r ${getDbGradient(currentDb)} opacity-50`
                )} />
                <div className={cn(
                  "relative w-full h-full rounded-full flex items-center justify-center",
                  `bg-gradient-to-br ${getDbGradient(currentDb)}`
                )}>
                  <Volume2 className="w-16 h-16 text-white animate-pulse" />
                </div>
              </div>

              <div className={cn("text-6xl font-bold mb-2", getDbColor(currentDb))}>
                {currentDb}
              </div>
              <p className="text-gray-400 text-sm">分贝</p>

              {/* Volume bar */}
              <div className="mt-6 h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full", `bg-gradient-to-r ${getDbGradient(currentDb)}`)}
                  animate={{ width: `${Math.min((currentDb / 120) * 100, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}

          {!countdown && !isRecording && !resultScore && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <button
                onClick={handleStartShout}
                className="w-32 h-32 rounded-full mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <Mic className="w-16 h-16 text-white" />
              </button>
              <p className="text-xl font-bold mb-2">开始叫</p>
              <p className="text-gray-400 text-sm">点击按钮开始录音</p>
            </motion.div>
          )}

          {resultScore && (
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              {isInvalid ? (
                <>
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-red-400 mb-2">
                    {resultScore} dB
                  </div>
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
                    <p className="text-red-300 text-sm">
                      检测到异常分贝，超过正常人类发声范围，本次成绩无效，请注意保护嗓子。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <div className={cn("text-5xl font-bold mb-2", getDbColor(resultScore))}>
                    {resultScore} dB
                  </div>
                  {resultScore > todayBest && (
                    <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg py-2 px-4 inline-block mb-4">
                      <p className="text-purple-300 text-sm font-medium">
                        🎉 新纪录！
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <Button
                onClick={handleStartShout}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                再来一次
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
              activeTab === 'today'
                ? "bg-cyan-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            今日排行
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
              activeTab === 'history'
                ? "bg-amber-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            历史排行
          </button>
        </div>

        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                "bg-gray-800/50 border",
                index === 0 ? "border-amber-500/50" :
                index === 1 ? "border-gray-400/50" :
                index === 2 ? "border-amber-700/50" :
                "border-gray-700"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800" :
                index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                "bg-gray-700 text-gray-400"
              )}>
                {index + 1}
              </div>

              <div className="text-2xl">{user.avatar}</div>

              <div className="flex-1">
                <p className="font-medium text-sm">{user.nickname}</p>
                <p className="text-gray-500 text-xs">
                  {activeTab === 'today' ? '今日' : '历史'}: {activeTab === 'today' ? user.todayScore : user.historyScore} dB
                </p>
              </div>

              <div className={cn(
                "text-lg font-bold",
                getDbColor(activeTab === 'today' ? user.todayScore : user.historyScore)
              )}>
                {activeTab === 'today' ? user.todayScore : user.historyScore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}