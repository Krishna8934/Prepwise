import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  FileText, 
  Zap, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  Building2, 
  RotateCcw, 
  History, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { getComparisonMetrics } from '../services/historyStorage';

export default function LandingPage({ onStart, onOpenHistory, groqConnected, onOpenApiKeyModal }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const data = getComparisonMetrics();
    setMetrics(data);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-12 space-y-12">
      
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-card border border-brand-500/30 text-brand-300 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Next-Gen Voice AI Interview Platform</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>TCS • Infosys • Wipro • Accenture • Amazon • Startup Modes</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 font-['Outfit'] leading-[1.15]">
          Practice smarter. <br />
          <span className="gradient-text">Interview better.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-8 font-normal">
          Upload your resume and experience a realistic, company-specific mock interview with AI speech coaching, instant answer retry drills, and persistent progress tracking.
        </p>

        {/* Previous Progress Alert if history exists */}
        {metrics && metrics.currentScore !== null && (
          <div className="max-w-md mx-auto mb-8 p-3 rounded-2xl bg-slate-900/90 border border-brand-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Welcome back! Last score: <strong className="text-white font-mono">{metrics.currentScore}/100</strong>
              </span>
            </div>
            {metrics.diff !== null && metrics.diff > 0 && (
              <span className="text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md">
                +{metrics.diff} pts trend 📈
              </span>
            )}
          </div>
        )}

        {/* Primary CTA */}
        <div className="flex flex-col items-center justify-center gap-3 mb-16">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-brand-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3 group"
          >
            <Mic className="w-5 h-5 text-brand-200 group-hover:scale-110 transition-transform" />
            <span>Start Company Mock Interview</span>
            <ArrowRight className="w-4 h-4 text-brand-200 group-hover:translate-x-1 transition-transform" />
          </button>

          {!groqConnected && (
            <div className="flex items-center justify-center space-x-2 text-xs text-amber-300/90 pt-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Groq API Key Required. <button onClick={onOpenApiKeyModal} className="underline font-bold text-amber-200 hover:text-white">Enter key</button> for real Llama-3.3-70b interview generation.</span>
            </div>
          )}
        </div>


        {/* Mock Interface Preview Card */}
        <div className="relative max-w-3xl mx-auto rounded-3xl glass-panel-glow p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-hidden mb-12 text-left">
          
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">tcs-placement-simulator.prepwise</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                TCS NQT Pattern
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Comm Drill: 8/10
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-400">TCS Senior Interviewer (Voice)</p>
                <p className="text-sm text-slate-200 font-medium">
                  "In your resume project, walk me through how you applied Object-Oriented principles like Polymorphism and Encapsulation to manage your API endpoints."
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/70 ml-6">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400">Candidate (Instant Speech & Retry Drill)</p>
                <p className="text-sm text-slate-300">
                  "I implemented polymorphism by defining an abstract BaseHandler and overriding processRequest for user authentication and payments..."
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Communication: 6/10 → 8/10 (+2 pts improved!) 🎯
                  </span>
                  <span className="text-slate-400">Zero filler words detected on retry</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            Engineered Beyond Static Placement Portals
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic resume personalization, company round roadmaps, and verbal feedback Freshersworld can't offer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Company Placement Modes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Targeted round patterns for <strong>TCS, Infosys, Wipro, Accenture, Amazon, and Startups</strong> with dedicated preparation roadmaps.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">English Drill & Retry Loop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time clarity score, filler-word detection ("basically", "like"), model STAR structures, and instant retry drills to boost communication.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Session History & Progress</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your mock interviews never disappear on refresh. Track "Last score: 68 → Current score: 76", score graphs, and recurring weak topics.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
