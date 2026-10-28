import React, { useState, useEffect } from 'react';
import { 
  User, 
  Code2, 
  Layers, 
  Briefcase, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Building2, 
  Flame, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp,
  Award
} from 'lucide-react';
import { createInterviewSession } from '../services/api';
import { getComparisonMetrics } from '../services/historyStorage';

const COMPANY_PREPARATION_PLANS = {
  TCS: {
    company: 'TCS',
    tagline: 'TCS Pattern: HR + OOP + DBMS + Project Questions',
    badge: 'Tata Consultancy Services NQT Track',
    overview: 'TCS evaluates procedural vs OOP clarity, relational database SQL queries, and dependable situational flexibility.',
    rounds: [
      { round: 'Round 1', name: 'Core CS Fundamentals', topics: 'OOP concepts (Inheritance, Polymorphism), DBMS, SQL Joins' },
      { round: 'Round 2', name: 'Resume Project Deep-Dive', topics: 'Project role, individual contribution, bug handling' },
      { round: 'Round 3', name: 'HR & Cultural Fit', topics: 'Willingness to learn new stacks, shifts, relocation, teamwork' }
    ],
    keyFocus: ['OOP (Polymorphism, Encapsulation)', 'SQL Queries (WHERE vs HAVING)', 'Verbal English clarity', 'Project ownership'],
    tip: 'Keep definitions crisp and textbook-accurate, then connect them directly to your resume code.'
  },
  Infosys: {
    company: 'Infosys',
    tagline: 'Infosys Pattern: Logic Dry-Runs + Collections + Normalization + Fit',
    badge: 'Specialist Programmer (SP) & DSE Track',
    overview: 'Infosys focuses on algorithmic dry-runs, clean pseudo-code, database normalization, and structured software life cycle.',
    rounds: [
      { round: 'Round 1', name: 'Algorithmic Problem Solving', topics: 'Time/space complexity, arrays, string manipulation' },
      { round: 'Round 2', name: 'Core Software Engineering', topics: 'Python/Java collections, RDBMS 1NF-3NF, API architecture' },
      { round: 'Round 3', name: 'HR & Cultural Alignment', topics: 'Adaptability, Mysore training readiness, team collaboration' }
    ],
    keyFocus: ['Clean logic walkthrough', 'Database Normalization', 'Data structures (HashMaps, Lists)', 'Clear verbal communication'],
    tip: 'Always dry-run your algorithm aloud step-by-step before stating your final answer.'
  },
  Wipro: {
    company: 'Wipro',
    tagline: 'Wipro Pattern: Elite NTH Coding + Core Architecture + Client Scenarios',
    badge: 'Elite National Talent Hunt (NTH)',
    overview: 'Wipro focuses on core programming logic, software engineering principles (SDLC/Agile), and client-centric communication.',
    rounds: [
      { round: 'Round 1', name: 'Technical Breadth', topics: 'Data structures (Stacks, Queues, Trees), OOP pillars, Memory' },
      { round: 'Round 2', name: 'Applied Project Discussion', topics: 'Frontend-backend integration, error handling, schema decisions' },
      { round: 'Round 3', name: 'Business & HR Readiness', topics: 'Client interaction scenarios, deadlines, relocation adaptability' }
    ],
    keyFocus: ['Data structure operations', 'Agile sprint understanding', 'English communicative clarity', 'Project problem solving'],
    tip: 'Structure your answers with beginning, middle, and end without trailing off.'
  },
  Accenture: {
    company: 'Accenture',
    tagline: 'Accenture Pattern: Cloud Basics + Agile + Project Architecture + Client HR',
    badge: 'Advanced Associate Software Engineer',
    overview: 'Accenture values cloud awareness, modern Agile practices, REST API integration, and strong collaborative communication.',
    rounds: [
      { round: 'Round 1', name: 'Modern Tech & Cloud Basics', topics: 'Cloud models (IaaS/PaaS), RESTful APIs, Microservices' },
      { round: 'Round 2', name: 'Resume Deep-Dive & CI/CD', topics: 'Git workflows, automated testing, project security' },
      { round: 'Round 3', name: 'Client Situational & HR', topics: 'Cross-functional teamwork, handling stakeholders, communication' }
    ],
    keyFocus: ['Cloud fundamentals', 'Agile ceremonies & Git', 'Professional English delivery', 'Business impact of tech choices'],
    tip: 'Highlight how your technical decisions solve end-user and business problems.'
  },
  Amazon: {
    company: 'Amazon',
    tagline: 'Amazon SDE Pattern: Leadership Principles (STAR) + High Scale Architecture + DSA',
    badge: 'Amazon SDE Bar-Raiser Track',
    overview: 'Amazon tests rigorous Data Structures & Algorithms, high-scale system architecture, and deep adherence to Amazon Leadership Principles.',
    rounds: [
      { round: 'Round 1', name: 'DSA & Computational Bounds', topics: 'Trees, Graphs, DP, Big-O runtime, concurrency' },
      { round: 'Round 2', name: 'System Design & Scalability', topics: 'Distributed caching, sharding, rate limiting, latency' },
      { round: 'Round 3', name: 'Leadership Principles (STAR)', topics: 'Customer Obsession, Ownership, Bias for Action, Deliver Results' }
    ],
    keyFocus: ['Strict STAR format for behavioral answers', 'Edge case analysis', 'High-scale trade-offs', 'Quantifiable metrics'],
    tip: 'Every story must clearly define the Situation, Task, Action, and quantifiable Result with zero ambiguity.'
  },
  Startup: {
    company: 'Startup',
    tagline: 'Startup Pattern: Fullstack Agility + Fast Execution + Production Debugging',
    badge: 'High-Growth Tech Startup Track',
    overview: 'Startups look for high agency, fullstack capability, rapid debugging under ambiguity, pragmatic trade-offs, and product intuition.',
    rounds: [
      { round: 'Round 1', name: 'Fullstack Practical Architecture', topics: 'End-to-end data flow, React/Vue lifecycle, backend API auth' },
      { round: 'Round 2', name: 'Production Debugging & Outages', topics: 'Triage production errors, speed vs clean code trade-offs' },
      { round: 'Round 3', name: 'Ownership & Ambiguity', topics: 'Prioritizing with incomplete specs, fast iteration, product sense' }
    ],
    keyFocus: ['High bias for action', 'Deep project ownership', 'Pragmatic trade-offs', 'Handling ambiguous problem statements'],
    tip: 'Show passion for shipping fast and explain what you learned from real technical mistakes.'
  },
  General: {
    company: 'General',
    tagline: 'General Pattern: Balanced Technical + Behavioral Placement Mock',
    badge: 'Comprehensive Software Engineer Mock',
    overview: 'A balanced, holistic evaluation covering technical depth, problem-solving reasoning, system design, and behavioral storytelling.',
    rounds: [
      { round: 'Round 1', name: 'Core Engineering Concepts', topics: 'Languages, frameworks, design patterns' },
      { round: 'Round 2', name: 'Resume Project Deep-Dive', topics: 'Hands-on architectural decisions and challenges' },
      { round: 'Round 3', name: 'Behavioral & Communication', topics: 'Team collaboration, STAR stories, career vision' }
    ],
    keyFocus: ['Technical fundamentals', 'Project ownership', 'Verbal clarity', 'Problem-solving methodology'],
    tip: 'Be honest about what you know and demonstrate enthusiasm to learn.'
  }
};

export default function InterviewSetupPage({
  candidateProfile,
  rawResumeText,
  onInterviewStarted,
  onBackToUpload,
  groqConnected,
  onOpenApiKeyModal
}) {
  const [targetCompany, setTargetCompany] = useState('TCS');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastMetrics, setPastMetrics] = useState(null);

  useEffect(() => {
    const metrics = getComparisonMetrics();
    setPastMetrics(metrics);
  }, []);

  const handleStartInterview = async () => {
    if (!groqConnected) {
      setError('Groq API Key Required: An active Groq API key is required to start a real AI mock interview. Please configure your key.');
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        candidate_profile: candidateProfile,
        resume_text: rawResumeText,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: totalQuestions,
        target_company: targetCompany,
      };

      const response = await createInterviewSession(payload);
      onInterviewStarted(response, payload);
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || 'Failed to start interview session. Please try again.';
      setError(detail);
      if (err.response?.status === 403 && onOpenApiKeyModal) {
        onOpenApiKeyModal();
      }
    }
  };


  const currentPlan = COMPANY_PREPARATION_PLANS[targetCompany] || COMPANY_PREPARATION_PLANS.General;

  const skillsList = [
    ...(candidateProfile.programming_languages || []),
    ...(candidateProfile.frameworks || []),
    ...(candidateProfile.skills || [])
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Resume Profile Ready</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
          Configure Your Placement Mock Interview
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Select your target company round pattern and customize the question depth.
        </p>
      </div>

      {/* Improvement Badge if history exists */}
      {pastMetrics && pastMetrics.currentScore !== null && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-indigo-950/50 border border-brand-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Your Progress Record</p>
              <p className="text-xs text-slate-300">
                Last Score: <strong className="text-brand-300 font-mono">{pastMetrics.currentScore}/100</strong> • {pastMetrics.totalCompleted} interview(s) saved in history.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20 hidden sm:inline">
            Goal: Beat {pastMetrics.currentScore} pts 🎯
          </span>
        </div>
      )}

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
                  {skillsList.slice(0, 10).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
                      {skill}
                    </span>
                  ))}
                  {skillsList.length > 10 && (
                    <span className="px-2 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-[10px] font-semibold">
                      +{skillsList.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Target Projects */}
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
            
            {/* 1. Company Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>1. Select Target Company Mode (Freshersworld Specialization)</span>
                </label>
              </div>

              {/* Company Selector Dropdown & Quick Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { id: 'TCS', label: 'TCS', role: 'NQT Pattern' },
                  { id: 'Infosys', label: 'Infosys', role: 'Specialist' },
                  { id: 'Wipro', label: 'Wipro', role: 'Elite NTH' },
                  { id: 'Accenture', label: 'Accenture', role: 'Associate' },
                  { id: 'Amazon', label: 'Amazon', role: 'SDE Bar-Raiser' },
                  { id: 'Startup', label: 'Startup', role: 'High Agency' },
                  { id: 'General', label: 'General', role: 'Full Mock' }
                ].map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setTargetCompany(comp.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      targetCompany === comp.id
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/15 ring-1 ring-brand-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm font-['Outfit']">{comp.label}</span>
                      {targetCompany === comp.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{comp.role}</span>
                  </button>
                ))}
              </div>

              {/* Interactive Company Preparation Plan Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-950/80 border border-brand-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {currentPlan.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Personalized Preparation Plan</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    {currentPlan.tagline}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {currentPlan.overview}
                  </p>
                </div>

                {/* Rounds Breakdown */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Typical Rounds Simulation:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentPlan.rounds.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
                        <span className="font-bold text-brand-300 block">{r.round}: {r.name}</span>
                        <span className="text-slate-400 text-[10px] line-clamp-2 mt-0.5">{r.topics}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key focus topics */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Target Focus:</span>
                  {currentPlan.keyFocus.map((f, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 text-brand-200 text-[10px] border border-slate-800 font-medium">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-200">
                  <strong className="text-white">Interviewer Pro Tip:</strong> {currentPlan.tip}
                </div>
              </div>

            </div>

            {/* 2. Interview Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                2. Select Interview Focus
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Mixed', title: 'Mixed (Recommended)', desc: 'Balanced technical deep dive + behavioral STAR questions.' },
                  { id: 'Technical', title: 'Technical Only', desc: 'Core CS, architecture, algorithms, coding concepts.' },
                  { id: 'HR', title: 'HR / Behavioral', desc: 'Company culture fit, adaptability, leadership, conflict.' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
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

            {/* 3. Difficulty Level & Total Questions Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  3. Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Easy', title: 'Easy' },
                    { id: 'Medium', title: 'Medium' },
                    { id: 'Hard', title: 'Hard' }
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id)}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        difficulty === diff.id
                          ? 'bg-brand-500/20 border-brand-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xs">{diff.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Questions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  4. Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 5, label: '5 Questions' },
                    { count: 10, label: '10 Questions' },
                    { count: 15, label: '15 Questions' }
                  ].map((q) => (
                    <button
                      key={q.count}
                      type="button"
                      onClick={() => setTotalQuestions(q.count)}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        totalQuestions === q.count
                          ? 'bg-brand-500/20 border-brand-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xs">{q.count} Qs</span>
                    </button>
                  ))}
                </div>
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
                <span>Configuring {targetCompany} Simulator...</span>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-amber-300" />
                  <span>Start {targetCompany} Mock Interview</span>
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
