import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  RotateCcw, 
  Printer, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  Layers, 
  MessageSquareQuote,
  ChevronDown
} from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';

export default function ResultsDashboardPage({ report, onRestart }) {
  useEffect(() => {
    // Fire festive celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  if (!report) return null;

  const categories = [
    { label: 'Technical Knowledge', score: report.category_scores?.technical_knowledge || 80, icon: Target },
    { label: 'Problem Solving', score: report.category_scores?.problem_solving || 80, icon: TrendingUp },
    { label: 'Communication', score: report.category_scores?.communication || 85, icon: MessageSquareQuote },
    { label: 'Relevance', score: report.category_scores?.relevance || 85, icon: CheckCircle2 },
    { label: 'Answer Depth', score: report.category_scores?.answer_depth || 75, icon: Layers },
    { label: 'Confidence', score: report.category_scores?.confidence || 80, icon: ShieldCheck },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Top Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interview Complete 🎉</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
          Performance Scorecard
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Comprehensive evaluation of your {report.interview_type} mock interview for <strong className="text-white">{report.candidate_name}</strong>.
        </p>
      </div>

      {/* Main Hero Card: Overall Score & Verdict */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Radial Score Meter */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800/80">
            <ScoreGauge score={report.overall_score || 80} size={170} />
            <div className="mt-4 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Overall Rating
              </span>
              <span className="text-sm font-semibold text-brand-300">
                {report.total_questions_answered} Questions Evaluated
              </span>
            </div>
          </div>

          {/* Verdict and Summary */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {report.readiness_verdict || 'Ready for Onsite'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
                {report.difficulty} Difficulty
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
                {report.interview_type}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Executive Evaluation Summary
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {report.summary}
            </p>

            <p className="text-xs text-slate-500 font-mono">
              Evaluated on {report.completed_at} • Prepwise AI Engine
            </p>
          </div>

        </div>
      </div>

      {/* Category Scores Grid */}
      <div>
        <h3 className="text-xl font-bold text-white font-['Outfit'] mb-4">
          Core Competency Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl glass-card border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  </div>
                  <span className="text-base font-extrabold text-white font-['Outfit']">
                    {cat.score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvement Areas Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Strengths */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Key Strengths Demonstrated</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {report.strengths && report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Priority Growth Areas</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {report.improvement_areas && report.improvement_areas.map((imp, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 bg-amber-500/5 p-3 rounded-xl border border-amber-500/15">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Recommended Topics & Study Roadmap */}
      {report.recommended_topics && report.recommended_topics.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">Personalized Preparation Roadmap</h3>
              <p className="text-xs text-slate-400">Targeted study topics based on weak or hesitant points observed during your interview.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {report.recommended_topics.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-white text-sm font-['Outfit']">{rec.topic}</h4>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Why:</strong> {rec.reason}
                </p>
                <div className="pt-1.5 border-t border-slate-800/60 text-brand-300">
                  <strong className="text-slate-200">Recommended Action:</strong> {rec.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Deep Dive Analysis */}
      {report.question_reviews && report.question_reviews.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">Question-by-Question Review</h3>
              <p className="text-xs text-slate-400">Inspect individual answers, scores, and granular AI feedback.</p>
            </div>
          </div>

          <div className="space-y-4">
            {report.question_reviews.map((rev, idx) => (
              <details key={idx} className="group rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden" open={idx === 0}>
                <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors list-none">
                  <div className="flex items-center space-x-3 pr-4">
                    <span className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs">
                      Q{rev.question_number}
                    </span>
                    <span className="font-semibold text-white text-xs sm:text-sm font-['Outfit'] line-clamp-1">
                      {rev.question}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                      {rev.score}/100
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="p-5 border-t border-slate-800/80 space-y-4 text-xs bg-slate-950/90">
                  <div>
                    <p className="text-slate-400 font-semibold mb-1">Full Question Asked:</p>
                    <p className="text-slate-200 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                      "{rev.question}"
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 font-semibold mb-1">Your Spoken Answer:</p>
                    <p className="text-slate-200 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {rev.answer || 'No response recorded.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-slate-200">
                    <p className="font-bold text-brand-300 mb-0.5">AI Interviewer Evaluation:</p>
                    <p className="leading-relaxed">{rev.feedback}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all flex items-center justify-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF Scorecard</span>
        </button>

        <button
          onClick={onRestart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-xl shadow-brand-500/25 hover:scale-102 transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Another Mock Interview</span>
        </button>
      </div>

    </div>
  );
}
