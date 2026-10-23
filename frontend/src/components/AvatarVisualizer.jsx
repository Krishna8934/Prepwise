import React from 'react';
import { Bot, Mic, Sparkles, Volume2, Brain } from 'lucide-react';

export default function AvatarVisualizer({
  state = 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking'
  interviewerName = 'Alex',
  topic = 'Technical Evaluation'
}) {
  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return {
          label: 'Interviewer Speaking',
          color: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
          dot: 'bg-brand-400 animate-pulse',
          icon: Volume2
        };
      case 'listening':
        return {
          label: 'Listening to You',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-ping',
          icon: Mic
        };
      case 'thinking':
        return {
          label: 'Evaluating & Planning Next Question...',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-bounce',
          icon: Brain
        };
      default:
        return {
          label: 'Ready',
          color: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
          dot: 'bg-slate-400',
          icon: Bot
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800/80 overflow-hidden group">
      
      {/* Dynamic Background Glow Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {state === 'speaking' && (
          <>
            <div className="absolute w-64 h-64 rounded-full bg-brand-500/15 animate-ping duration-1000" />
            <div className="absolute w-80 h-80 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
          </>
        )}
        {state === 'listening' && (
          <>
            <div className="absolute w-64 h-64 rounded-full bg-emerald-500/15 animate-ping duration-1000" />
            <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
          </>
        )}
        {state === 'thinking' && (
          <>
            <div className="absolute w-64 h-64 rounded-full bg-amber-500/15 animate-ping duration-700" />
            <div className="absolute w-80 h-80 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
          </>
        )}
      </div>

      {/* Avatar Graphic */}
      <div className="relative z-10 flex flex-col items-center">
        <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 transition-all duration-500 ${
          state === 'speaking'
            ? 'bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-400 shadow-2xl shadow-brand-500/40 scale-105'
            : state === 'listening'
            ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-2xl shadow-emerald-500/40 scale-105'
            : state === 'thinking'
            ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 shadow-2xl shadow-amber-500/40 scale-100 animate-pulse'
            : 'bg-gradient-to-tr from-slate-700 to-slate-800 shadow-lg'
        }`}>
          <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Ambient inner glow */}
            <div className={`absolute inset-0 opacity-25 transition-colors duration-500 ${
              state === 'speaking' ? 'bg-brand-500' :
              state === 'listening' ? 'bg-emerald-500' :
              state === 'thinking' ? 'bg-amber-500' : 'bg-slate-700'
            }`} />

            {/* Main AI Avatar Icon / Face */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {state === 'thinking' ? (
                <Brain className="w-12 h-12 text-amber-300 animate-pulse" />
              ) : state === 'listening' ? (
                <Mic className="w-12 h-12 text-emerald-300 animate-bounce" />
              ) : (
                <Bot className="w-12 h-12 text-brand-300" />
              )}
            </div>

            {/* Speaking audio wave bars below avatar */}
            {state === 'speaking' && (
              <div className="absolute bottom-2.5 flex items-center space-x-1 h-4">
                {[40, 90, 60, 100, 75, 45, 80].map((height, i) => (
                  <span
                    key={i}
                    className="w-1 bg-brand-400 rounded-full soundwave-bar"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Listening audio bars */}
            {state === 'listening' && (
              <div className="absolute bottom-2.5 flex items-center space-x-1 h-4">
                {[60, 30, 80, 40, 90, 50, 70].map((height, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full soundwave-bar"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.12}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Name & Role */}
        <div className="mt-4 text-center">
          <h4 className="text-base font-bold text-white font-['Outfit'] tracking-wide">
            {interviewerName} <span className="text-xs text-slate-400 font-normal font-sans">(AI Senior Interviewer)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Focus: <span className="text-slate-300 font-medium">{topic}</span>
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className={`mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status.label}</span>
        </div>
      </div>

    </div>
  );
}
