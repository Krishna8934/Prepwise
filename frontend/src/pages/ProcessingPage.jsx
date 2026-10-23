import React, { useEffect, useState } from 'react';
import { Brain, CheckCircle2, Sparkles, Award } from 'lucide-react';
import { getInterviewReport } from '../services/api';

export default function ProcessingPage({ sessionId, onReportReady }) {
  const [stage, setStage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    // Staged animation
    const t1 = setTimeout(() => setStage(2), 1000);
    const t2 = setTimeout(() => setStage(3), 2200);
    const t3 = setTimeout(() => setStage(4), 3400);

    // Fetch report
    const fetchReport = async () => {
      try {
        const report = await getInterviewReport(sessionId);
        setTimeout(() => {
          if (isMounted) {
            onReportReady(report);
          }
        }, 3800);
      } catch (err) {
        console.error('Report fetch error:', err);
        if (isMounted) {
          setError('Encountered an issue synthesizing the final report. Retrying...');
          setTimeout(fetchReport, 2000);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [sessionId, onReportReady]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 max-w-xl mx-auto text-center">
      
      {/* Animated Brain Visual */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-2xl shadow-brand-500/40 animate-pulse">
          <Brain className="w-12 h-12 text-white animate-bounce" />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-brand-500/20 blur-xl animate-ping duration-1000 -z-10" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mb-3">
        Analyzing Your Interview...
      </h2>
      <p className="text-sm text-slate-400 mb-8 max-w-md">
        Synthesizing technical depth, communication clarity, and tailoring your personalized preparation roadmap.
      </p>

      {/* Checklist Card */}
      <div className="w-full p-6 rounded-3xl glass-panel border border-slate-800 text-left space-y-3.5 shadow-xl">
        
        <div className={`flex items-center space-x-3 text-xs transition-colors duration-300 ${stage >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
          {stage >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
          <span>Compiling spoken answers & transcript trajectory</span>
        </div>

        <div className={`flex items-center space-x-3 text-xs transition-colors duration-300 ${stage >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
          {stage >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
          <span>Evaluating technical accuracy, domain depth & trade-offs</span>
        </div>

        <div className={`flex items-center space-x-3 text-xs transition-colors duration-300 ${stage >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
          {stage >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
          <span>Scoring communication structure & confidence markers</span>
        </div>

        <div className={`flex items-center space-x-3 text-xs transition-colors duration-300 ${stage >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
          {stage >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
          <span>Generating custom study curriculum & question review</span>
        </div>

      </div>

      {error && (
        <p className="mt-4 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
          {error}
        </p>
      )}

    </div>
  );
}
