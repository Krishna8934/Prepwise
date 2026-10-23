import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, MessageSquare } from 'lucide-react';

export default function TranscriptDrawer({ turns = [], currentQuestionIndex }) {
  const [isOpen, setIsOpen] = useState(false);

  const answeredTurns = turns.filter(t => t.answer);

  if (answeredTurns.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl glass-card border border-slate-800 overflow-hidden transition-all duration-300">
      
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Conversation History ({answeredTurns.length} answers logged)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{isOpen ? 'Collapse' : 'View Past Answers'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-5 border-t border-slate-800/70 space-y-4 max-h-96 overflow-y-auto">
          {answeredTurns.map((turn, index) => (
            <div key={index} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs">
              
              {/* Question summary */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold text-[10px]">
                    Q{index + 1}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {turn.question.topic || turn.question.category}
                  </span>
                </div>
                {turn.question.is_follow_up && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Follow-up
                  </span>
                )}
              </div>

              <p className="text-slate-300 italic">
                "{turn.question.question}"
              </p>

              {/* Answer summary */}
              <div className="pt-2 border-t border-slate-800/50">
                <p className="text-slate-400 font-medium mb-1">Your Response:</p>
                <p className="text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  {turn.answer}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
