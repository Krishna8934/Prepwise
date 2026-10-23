import React from 'react';
import { Mic, FileText, Zap, Award, ArrowRight, ShieldCheck, Sparkles, Bot, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 sm:py-12">
      
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-card border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Gen Voice AI Interview Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 font-['Outfit'] leading-[1.15]">
          Practice smarter. <br />
          <span className="gradient-text">Interview better.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-10 font-normal">
          Upload your resume and experience a realistic, personalized voice mock interview powered by Groq and advanced LLMs. Get challenged on your actual projects and receive deep performance analytics.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-brand-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3 group"
          >
            <Mic className="w-5 h-5 text-brand-200 group-hover:scale-110 transition-transform" />
            <span>Start Mock Interview</span>
            <ArrowRight className="w-4 h-4 text-brand-200 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mock Interface Preview Card */}
        <div className="relative max-w-3xl mx-auto rounded-3xl glass-panel-glow p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-hidden mb-20 text-left">
          
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">prepwise-session-active.ai</span>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Live Mock Simulation
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-400">AI Senior Interviewer (Voice)</p>
                <p className="text-sm text-slate-200 font-medium">
                  "I see you built a Customer Churn Prediction system using Random Forest. Why did you choose Random Forest over Gradient Boosting or a single Decision Tree for your dataset?"
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/70 ml-6">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400">Candidate (Spoken Voice Response)</p>
                <p className="text-sm text-slate-300">
                  "Random Forest handles non-linear relationships and high-dimensional tabular data without severe overfitting due to bootstrap aggregating and feature subsampling..."
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>AI dynamically adapts: Follow-up triggered to explore out-of-bag error and SHAP value explainability.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            Built for Serious Interview Preparation
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Everything you need to simulate realistic, high-stakes technical & behavioral interview rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Resume-Driven Context</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your PDF resume. The AI analyzes your exact projects, tech stack, and claims to ask tailored questions.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Real-Time Voice AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak naturally using your microphone. Hear questions spoken aloud with native text-to-speech synthesis.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Dynamic Follow-Ups</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No static question lists. The AI probes shallow answers, explores architecture trade-offs, and pivots topics dynamically.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card hover:glass-panel transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Deep Scorecards & Prep</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive 100-point overall scorecards, category radars, strengths, weaknesses, and a personalized study roadmap.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
