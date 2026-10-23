import React, { useState } from 'react';
import { User, Code2, Layers, Briefcase, Sparkles, Check, ArrowRight, Settings2, Sliders, ShieldCheck, Flame } from 'lucide-react';
import { createInterviewSession } from '../services/api';

export default function InterviewSetupPage({
  candidateProfile,
  rawResumeText,
  onInterviewStarted,
  onBackToUpload
}) {
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartInterview = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        candidate_profile: candidateProfile,
        resume_text: rawResumeText,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: totalQuestions,
      };

      const response = await createInterviewSession(payload);
      onInterviewStarted(response, payload);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to start interview session. Please try again.');
    }
  };

  const skillsList = [
    ...(candidateProfile.programming_languages || []),
    ...(candidateProfile.frameworks || []),
    ...(candidateProfile.skills || [])
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Resume Profile Ready</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] mb-2">
          Step 2: Configure Your Interview
        </h2>
        <p className="text-sm text-slate-300">
          Customize the interview format, difficulty, and question depth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Candidate Profile Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
            <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  {candidateProfile.name || 'Candidate'}
                </h3>
                <p className="text-xs text-brand-300 font-medium">Candidate Profile</p>
              </div>
            </div>

            {/* Profile Summary */}
            {candidateProfile.summary && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Executive Summary</p>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {candidateProfile.summary}
                </p>
              </div>
            )}

            {/* Extracted Skills */}
            {skillsList.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Extracted Tech Stack & Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.slice(0, 12).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
                      {skill}
                    </span>
                  ))}
                  {skillsList.length > 12 && (
                    <span className="px-2 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-[10px] font-semibold">
                      +{skillsList.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Extracted Projects */}
            {candidateProfile.projects && candidateProfile.projects.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Target Projects for Questioning</p>
                <div className="space-y-2">
                  {candidateProfile.projects.slice(0, 2).map((proj, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                      <p className="font-bold text-white">{proj.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onBackToUpload}
              className="text-xs text-slate-400 hover:text-white transition-colors underline pt-2 block text-center w-full"
            >
              Upload a different resume
            </button>
          </div>
        </div>

        {/* Right Column: Configuration Selectors */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            
            {/* 1. Interview Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                1. Select Interview Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Mixed', title: 'Mixed (Recommended)', desc: 'Balanced technical deep dive + behavioral STAR questions.' },
                  { id: 'Technical', title: 'Technical Only', desc: 'System design, code logic, architectures, algorithms.' },
                  { id: 'HR', title: 'HR / Behavioral', desc: 'Leadership, situational questions, team collaboration.' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      interviewType === type.id
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-['Outfit']">{type.title}</span>
                      {interviewType === type.id && <Check className="w-4 h-4 text-brand-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Difficulty Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                2. Select Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Easy', title: 'Easy', badge: 'Fundamentals', color: 'emerald' },
                  { id: 'Medium', title: 'Medium', badge: 'Practical Trade-offs', color: 'indigo' },
                  { id: 'Hard', title: 'Hard', badge: 'Edge Cases & Scale', color: 'rose' }
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`p-3.5 rounded-2xl text-center border transition-all ${
                      difficulty === diff.id
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <p className="text-sm font-bold font-['Outfit'] mb-0.5">{diff.title}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{diff.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Number of Questions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                3. Total Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { count: 5, label: '5 Questions', sub: '~5-8 mins' },
                  { count: 10, label: '10 Questions', sub: '~12-15 mins (Default)' },
                  { count: 15, label: '15 Questions', sub: '~20 mins (Full Mock)' }
                ].map((q) => (
                  <button
                    key={q.count}
                    type="button"
                    onClick={() => setTotalQuestions(q.count)}
                    className={`p-3 rounded-2xl text-center border transition-all ${
                      totalQuestions === q.count
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <p className="text-sm font-bold font-['Outfit'] mb-0.5">{q.label}</p>
                    <span className="text-[10px] text-slate-400">{q.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preview */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Personalized Voice Simulation</p>
                <p className="mt-0.5 text-indigo-200">
                  Your interview will be dynamically personalized using your resume. The AI will speak questions aloud and listen to your answers.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Launch CTA */}
            <button
              onClick={handleStartInterview}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-2xl shadow-brand-500/30 hover:scale-101 transition-all flex items-center justify-center space-x-2.5"
            >
              {loading ? (
                <span>Initializing Interviewer...</span>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-amber-300" />
                  <span>Start Interview</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
