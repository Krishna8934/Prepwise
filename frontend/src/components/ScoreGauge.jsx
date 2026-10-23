import React from 'react';

export default function ScoreGauge({ score = 85, size = 160 }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 85) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 70) return 'text-brand-400 stroke-brand-400';
    if (score >= 50) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const getGradientId = () => {
    if (score >= 85) return 'emerald-grad';
    if (score >= 70) return 'brand-grad';
    if (score >= 50) return 'amber-grad';
    return 'rose-grad';
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />

          {/* Score progress circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={`url(#${getGradientId()})`}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            out of 100
          </span>
        </div>
      </div>
    </div>
  );
}
