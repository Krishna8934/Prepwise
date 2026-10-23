import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  TrendingUp, 
  Target, 
  Award, 
  Trash2, 
  Calendar, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { getLocalHistory, getComparisonMetrics, clearAllHistory } from '../services/historyStorage';

export default function HistoryModal({ isOpen, onClose, onSelectSession }) {
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({ hasPrevious: false, lastScore: null, currentScore: null, diff: null, weakTopics: [] });
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = () => {
    const list = getLocalHistory();
    setHistory(list);
    const comp = getComparisonMetrics();
    setMetrics(comp);
  };

  const handleClear = async () => {
    await clearAllHistory();
    setHistory([]);
    setMetrics({ hasPrevious: false, lastScore: null, currentScore: null, diff: null, weakTopics: [] });
    setConfirmClear(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-['Outfit']">Interview History & Progress</h3>
              <p className="text-xs text-slate-400">Track your past mock sessions, score improvements, and weak topics.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Score Improvement Trend Banner */}
          {history.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950/60 via-indigo-950/40 to-slate-900 border border-brand-500/30 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-brand-300 uppercase tracking-wider mb-1">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span>Learning & Improvement Trend</span>
                  </div>
                  
                  {metrics.hasPrevious ? (
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-slate-300">
                        Last score: <strong className="text-white font-mono">{metrics.lastScore}</strong>
                      </span>
                      <ArrowRight className="w-4 h-4 text-brand-400" />
                      <span className="text-sm text-slate-300">
                        Current score: <strong className="text-white font-mono">{metrics.currentScore}</strong>
                      </span>
                      {metrics.diff !== null && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          metrics.diff > 0 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : metrics.diff === 0 
                            ? 'bg-slate-800 text-slate-300' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {metrics.diff > 0 ? `+${metrics.diff} pts 📈` : `${metrics.diff} pts`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-white mt-1">
                      Current Score: <span className="font-mono text-brand-300">{metrics.currentScore || (history[0] && history[0].overall_score)}/100</span> (Complete more mock interviews to map your trajectory!)
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{metrics.trendText}</p>
                </div>

                <div className="flex items-center space-x-2 sm:self-center">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Completed</span>
                    <span className="text-base font-extrabold text-white font-['Outfit']">{history.length} Mock{history.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recurring Weak Topics Across Interviews */}
          {metrics.weakTopics && metrics.weakTopics.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Priority Focus Areas (Identified from Past Interviews)</span>
              </div>
              <p className="text-xs text-slate-300">These topics appeared as improvement opportunities in your recent sessions:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {metrics.weakTopics.map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-xs font-medium text-amber-200">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* History Timeline List */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Session Timeline ({history.length})
            </h4>

            {history.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <History className="w-6 h-6" />
                </div>
                <h5 className="text-base font-bold text-white font-['Outfit']">No Saved Interviews Yet</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Complete your first mock interview to automatically save your performance scorecard, score progression, and improvement trend here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...history].reverse().map((item, idx) => (
                  <div
                    key={item.session_id || idx}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {item.target_company || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800">
                          {item.interview_type} • {item.difficulty}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.completed_at}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white font-['Outfit']">
                          {item.readiness_verdict || 'Interview Completed'}
                        </span>
                      </div>

                      {item.weak_topics && item.weak_topics.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                          <span className="text-slate-400">Weak topics:</span>
                          <span className="text-amber-300 font-medium">
                            {item.weak_topics.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-white font-['Outfit']">
                          {item.overall_score}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {history.length > 0 ? (
            confirmClear ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-rose-300">Clear all history?</span>
                <button
                  onClick={handleClear}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
