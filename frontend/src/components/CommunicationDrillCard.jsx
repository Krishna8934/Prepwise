import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Layers, 
  TrendingUp, 
  Volume2,
  Award
} from 'lucide-react';

export default function CommunicationDrillCard({
  evaluation,
  onRetryAnswer,
  onProceedToNext,
  isRetrying,
  retryHistoryCount = 0
}) {
  if (!evaluation) return null;

  const commScore = evaluation.communication_score || 8;
  const isRetry = evaluation.is_retry;
  const improvement = evaluation.communication_improvement;
  const prevScore = evaluation.previous_communication_score;
  const fillers = evaluation.filler_words_detected || [];

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-brand-500/40 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-['Outfit']">
              AI Communication & Speech Drill Analysis
            </h4>
            <span className="text-[11px] text-slate-400">Real-time verbal clarity, filler-word tracking & structure review</span>
          </div>
        </div>

        {/* Retry Improvement Banner if retried */}
        {isRetry && prevScore !== null && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-pulse">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Communication: {prevScore}/10 → {commScore}/10
              {improvement !== null && improvement > 0 && ` (+${improvement} pts improved!) 🎯`}
            </span>
          </div>
        )}
      </div>

      {/* Grid: Communication Score & Filler Words */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        
        {/* Left Column: Communication Meter */}
        <div className="sm:col-span-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Clarity & Communication
          </span>
          <div className="flex items-baseline space-x-1 my-1">
            <span className={`text-3xl font-extrabold font-['Outfit'] ${
              commScore >= 8 ? 'text-emerald-400' : commScore >= 6 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {commScore}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/10</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                commScore >= 8 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : commScore >= 6 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${commScore * 10}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2">
            {commScore >= 8 ? '🌟 Crisp & Confident' : commScore >= 6 ? '⚡ Solid Delivery' : '💬 Practice Pauses'}
          </span>
        </div>

        {/* Right Column: Filler words & speech feedback */}
        <div className="sm:col-span-8 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white font-['Outfit']">Speech Polish & Filler Analysis</span>
          </div>

          {fillers.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Filler words noticed:</span>
                {fillers.map((f, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                    "{f}"
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {evaluation.communication_feedback || 'Replace verbal fillers with comfortable pauses to project senior authority.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero filler words detected! Clean and authoritative speech.</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {evaluation.communication_feedback || 'Excellent sentence transitions and clear pacing.'}
              </p>
            </div>
          )}

          {evaluation.feedback && (
            <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-800/80">
              "{evaluation.feedback}"
            </p>
          )}
        </div>

      </div>

      {/* Better Answer Structure Section */}
      {evaluation.better_answer_structure && (
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Recommended Answer Structure (Model Outline)</span>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {evaluation.better_answer_structure}
          </div>
        </div>
      )}

      {/* Action Bar: Retry Drill vs Continue */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRetryAnswer}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-brand-300 bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 transition-all shadow-lg hover:scale-102"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry this Answer (Drill Mode)</span>
          {retryHistoryCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/30 text-white">
              Attempt {retryHistoryCount + 1}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onProceedToNext}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-xl shadow-brand-500/25 transition-all hover:scale-102"
        >
          <span>Continue to Next Question</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
