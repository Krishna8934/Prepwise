import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Key, RotateCcw, Activity, History } from 'lucide-react';
import { getLocalHistory } from '../services/historyStorage';

export default function Navbar({
  groqConnected,
  onOpenApiKeyModal,
  onOpenHistoryModal,
  onResetInterview,
  currentStep
}) {
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const list = getLocalHistory();
    setHistoryCount(list.length);
  }, [currentStep]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={onResetInterview}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold font-['Outfit'] tracking-tight text-white group-hover:text-brand-300 transition-colors">
                Prep<span className="text-brand-400">wise</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Practice smarter. Interview better.
            </p>
          </div>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center space-x-3">
          
          {/* History & Progress button */}
          <button
            onClick={onOpenHistoryModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-800/70 text-slate-300 hover:text-white transition-all shadow-sm"
            title="View Past Interview History & Improvement Trend"
          >
            <History className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">History & Progress</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-500/30 text-brand-200 border border-brand-500/40">
                {historyCount}
              </span>
            )}
          </button>

          {/* Groq LLM Status indicator */}
          <button
            onClick={onOpenApiKeyModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-slate-300"
            title="Configure Groq API Key"
          >
            <span className={`w-2 h-2 rounded-full ${groqConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden md:inline">
              {groqConnected ? 'Groq Llama-3.3 Active' : 'Configure Groq Key'}
            </span>
            <Key className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Reset / New Session */}
          {currentStep !== 'landing' && (
            <button
              onClick={onResetInterview}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900/80 border border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Interview</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
