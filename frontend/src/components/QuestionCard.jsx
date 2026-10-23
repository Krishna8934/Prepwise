import React from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle, Layers, Zap } from 'lucide-react';

export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  isPlayingAudio,
  onReplayAudio,
  onStopAudio
}) {
  if (!question) return null;

  return (
    <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-slate-800/90 shadow-xl relative overflow-hidden transition-all duration-300">
      
      {/* Follow-up Banner if applicable */}
      {question.is_follow_up && (
        <div className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Dynamic Follow-up: Probing deeper into your previous response</span>
        </div>
      )}

      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            Question {currentIndex} of {totalQuestions}
          </span>
          {question.round_name && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {question.round_name}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {question.category || 'Technical'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {question.topic && (
            <span className="text-xs text-slate-400 font-medium px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              Topic: <strong className="text-slate-200">{question.topic}</strong>
            </span>
          )}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
            question.difficulty === 'Hard'
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : question.difficulty === 'Easy'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
          }`}>
            {question.difficulty || 'Medium'}
          </span>
        </div>
      </div>

      {/* Main Question Text */}
      <div className="my-3">
        <p className="text-lg sm:text-xl font-medium text-white leading-relaxed tracking-tight font-['Outfit']">
          "{question.question}"
        </p>
      </div>

      {/* Audio & Control Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isPlayingAudio ? (
            <button
              onClick={onStopAudio}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-all"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute Spoken Question</span>
            </button>
          ) : (
            <button
              onClick={onReplayAudio}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-300 bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Question Audio</span>
            </button>
          )}
        </div>

        {question.context_hint && (
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Hint: Answer clearly with real-world examples</span>
          </div>
        )}
      </div>

    </div>
  );
}
