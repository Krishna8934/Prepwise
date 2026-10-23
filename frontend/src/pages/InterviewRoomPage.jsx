import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Volume2, Sparkles, CheckCircle2, ShieldAlert, Building2, RotateCcw } from 'lucide-react';
import AvatarVisualizer from '../components/AvatarVisualizer';
import QuestionCard from '../components/QuestionCard';
import VoiceRecorder from '../components/VoiceRecorder';
import TranscriptDrawer from '../components/TranscriptDrawer';
import CommunicationDrillCard from '../components/CommunicationDrillCard';
import { submitInterviewAnswer, retryInterviewAnswer, forceCompleteInterview } from '../services/api';
import { speakText, stopSpeaking } from '../services/speech';

export default function InterviewRoomPage({
  sessionData,
  initialQuestion,
  config,
  onInterviewCompleted,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(config.total_questions || 10);
  const [turns, setTurns] = useState([{ question: initialQuestion }]);
  
  // Drill & evaluation state
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [pendingNextData, setPendingNextData] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryHistoryCount, setRetryHistoryCount] = useState(0);

  const [interviewerState, setInterviewerState] = useState('speaking'); // 'speaking' | 'listening' | 'thinking' | 'idle'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const sessionId = sessionData.session_id;
  const targetCompany = config.target_company || 'General';

  // Automatically speak the question when it changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.question && !currentEvaluation) {
      handleSpeakQuestion(currentQuestion.question);
    }
    return () => {
      stopSpeaking();
    };
  }, [currentQuestion, currentEvaluation]);

  const handleSpeakQuestion = (text) => {
    setIsPlayingAudio(true);
    setInterviewerState('speaking');

    speakText(
      text,
      () => {
        setIsPlayingAudio(true);
        setInterviewerState('speaking');
      },
      () => {
        setIsPlayingAudio(false);
        setInterviewerState('idle');
      },
      (err) => {
        console.warn('TTS playback issue:', err);
        setIsPlayingAudio(false);
        setInterviewerState('idle');
      }
    );
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setInterviewerState('idle');
  };

  const handleReplayAudio = () => {
    if (currentQuestion) {
      handleSpeakQuestion(currentQuestion.question);
    }
  };

  const handleAnswerSubmit = async (answerText, responseTime) => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setIsThinking(true);
    setInterviewerState('thinking');
    setError('');

    // If candidate was in retry drill mode, call retry endpoint instead
    if (isRetrying && currentEvaluation) {
      try {
        const prevScore = currentEvaluation.communication_score;
        const retryRes = await retryInterviewAnswer(sessionId, answerText, prevScore, responseTime);

        // Update turns with revised answer
        setTurns((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: answerText,
              evaluation: retryRes.evaluation
            };
          }
          return updated;
        });

        setCurrentEvaluation(retryRes.evaluation);
        setIsRetrying(false);
        setRetryHistoryCount((c) => c + 1);
        setIsThinking(false);
        setInterviewerState('idle');
        return;
      } catch (err) {
        console.error('Retry submission error:', err);
        setIsThinking(false);
        setInterviewerState('idle');
        setError(err.response?.data?.detail || 'Failed to evaluate retry. You can try again or proceed.');
        return;
      }
    }

    // Normal answer submission
    setTurns((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: answerText
        };
      }
      return updated;
    });

    try {
      const response = await submitInterviewAnswer(sessionId, answerText, responseTime);

      // Present the instant communication drill feedback card!
      if (response.previous_evaluation) {
        setCurrentEvaluation(response.previous_evaluation);
        setPendingNextData(response);
        setIsThinking(false);
        setInterviewerState('idle');
        setIsRetrying(false);
        setRetryHistoryCount(0);
      } else if (response.is_completed) {
        setIsThinking(false);
        onInterviewCompleted(sessionId);
      } else {
        // Direct transition fallback
        proceedToNextQuestion(response);
      }

    } catch (err) {
      console.error('Answer submission error:', err);
      setIsThinking(false);
      setInterviewerState('idle');
      setError(err.response?.data?.detail || 'Failed to submit answer. Please try submitting again.');
    }
  };

  const proceedToNextQuestion = (dataToUse = null) => {
    const data = dataToUse || pendingNextData;
    if (!data) return;

    if (data.is_completed) {
      onInterviewCompleted(sessionId);
      return;
    }

    const nextQ = data.question;
    setCurrentQuestion(nextQ);
    setCurrentIndex(data.current_question_index);
    setTurns((prev) => [...prev, { question: nextQ }]);
    setCurrentEvaluation(null);
    setPendingNextData(null);
    setIsRetrying(false);
    setRetryHistoryCount(0);
    setIsThinking(false);
    // TTS will trigger via useEffect
  };

  const handleStartRetry = () => {
    setIsRetrying(true);
  };

  const handleForceEnd = async () => {
    stopSpeaking();
    setIsThinking(true);
    try {
      await forceCompleteInterview(sessionId);
      onInterviewCompleted(sessionId);
    } catch (err) {
      onInterviewCompleted(sessionId);
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex - 1) / totalQuestions) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Top Session Status Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Progress info */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Interview Simulator
            </span>
            <span className="text-sm sm:text-base font-bold text-white font-['Outfit']">
              Question {currentIndex} of {totalQuestions}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{targetCompany}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {config.interview_type}
            </span>
            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 hidden sm:inline">
              {config.difficulty}
            </span>
          </div>
        </div>

        {/* Center: Progress Bar */}
        <div className="w-full sm:w-1/3 flex items-center space-x-3">
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 min-w-[32px]">
            {progressPercent}%
          </span>
        </div>

        {/* Right: End Interview Safety Button */}
        <div>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Finish & View Report</span>
          </button>
        </div>

      </div>

      {/* Main Grid: Avatar on Left/Top, Question & Mic on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Avatar */}
        <div className="lg:col-span-4">
          <AvatarVisualizer
            state={interviewerState}
            interviewerName="Alex"
            topic={currentQuestion?.topic || `${targetCompany} Assessment`}
          />
        </div>

        {/* Right Column: Question + Instant Communication Drill + Voice Input */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            isPlayingAudio={isPlayingAudio}
            onReplayAudio={handleReplayAudio}
            onStopAudio={handleStopAudio}
          />

          {/* Feature 3: English Communication + Answer Retry Drill Card */}
          {currentEvaluation && (
            <CommunicationDrillCard
              evaluation={currentEvaluation}
              onRetryAnswer={handleStartRetry}
              onProceedToNext={() => proceedToNextQuestion()}
              isRetrying={isRetrying}
              retryHistoryCount={retryHistoryCount}
            />
          )}

          {/* Voice & Text Recorder */}
          {(!currentEvaluation || isRetrying) && (
            <div className="space-y-2">
              {isRetrying && (
                <div className="p-3 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-between text-xs text-brand-200">
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4 text-brand-400 animate-spin" />
                    <span className="font-bold">Retry Drill Active:</span>
                    <span>Re-speak or edit your answer to eliminate fillers and improve clarity score.</span>
                  </div>
                  <button
                    onClick={() => setIsRetrying(false)}
                    className="text-xs underline text-slate-400 hover:text-white"
                  >
                    Cancel Retry
                  </button>
                </div>
              )}

              <VoiceRecorder
                onAnswerSubmit={handleAnswerSubmit}
                isThinking={isThinking}
                disabled={isPlayingAudio}
              />
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          <TranscriptDrawer
            turns={turns}
            currentQuestionIndex={currentIndex}
          />

        </div>

      </div>

      {/* Early Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="p-6 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Outfit']">End Interview Early?</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                You've answered {turns.filter(t => t.answer).length} question(s). You can generate your full {targetCompany} scorecard right now.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Continue Interview
              </button>
              <button
                onClick={handleForceEnd}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
