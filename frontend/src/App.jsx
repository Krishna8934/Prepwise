import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ApiKeyModal from './components/ApiKeyModal';
import LandingPage from './pages/LandingPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsDashboardPage from './pages/ResultsDashboardPage';
import { checkHealth } from './services/api';

export default function App() {
  const [currentStep, setCurrentStep] = useState('landing');
  const [groqConnected, setGroqConnected] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Flow State
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [rawResumeText, setRawResumeText] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [initialQuestion, setInitialQuestion] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState({
    interview_type: 'Mixed',
    difficulty: 'Medium',
    total_questions: 10,
  });
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const health = await checkHealth();
      setGroqConnected(Boolean(health.groq_connected));
    };
    fetchStatus();
  }, []);

  const handleStartFromLanding = () => {
    setCurrentStep('upload');
  };

  const handleResumeParsed = ({ profile, rawText }) => {
    setCandidateProfile(profile);
    setRawResumeText(rawText);
    setCurrentStep('setup');
  };

  const handleInterviewStarted = (response, config) => {
    setSessionData({ session_id: response.session_id });
    setInitialQuestion(response.question);
    setInterviewConfig(config);
    setCurrentStep('interview');
  };

  const handleInterviewCompleted = (sessionId) => {
    setCompletedSessionId(sessionId);
    setCurrentStep('processing');
  };

  const handleReportReady = (report) => {
    setReportData(report);
    setCurrentStep('results');
  };

  const handleResetInterview = () => {
    setCandidateProfile(null);
    setRawResumeText('');
    setSessionData(null);
    setInitialQuestion(null);
    setCompletedSessionId(null);
    setReportData(null);
    setCurrentStep('landing');
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-between selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Top Navbar */}
      <Navbar
        groqConnected={groqConnected}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onResetInterview={handleResetInterview}
        currentStep={currentStep}
      />

      {/* Main Flow Content */}
      <main className="flex-1">
        {currentStep === 'landing' && (
          <LandingPage onStart={handleStartFromLanding} />
        )}

        {currentStep === 'upload' && (
          <ResumeUploadPage onResumeParsed={handleResumeParsed} />
        )}

        {currentStep === 'setup' && candidateProfile && (
          <InterviewSetupPage
            candidateProfile={candidateProfile}
            rawResumeText={rawResumeText}
            onInterviewStarted={handleInterviewStarted}
            onBackToUpload={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'interview' && sessionData && initialQuestion && (
          <InterviewRoomPage
            sessionData={sessionData}
            initialQuestion={initialQuestion}
            config={interviewConfig}
            onInterviewCompleted={handleInterviewCompleted}
          />
        )}

        {currentStep === 'processing' && completedSessionId && (
          <ProcessingPage
            sessionId={completedSessionId}
            onReportReady={handleReportReady}
          />
        )}

        {currentStep === 'results' && reportData && (
          <ResultsDashboardPage
            report={reportData}
            onRestart={handleResetInterview}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <p>
          Prepwise — Practice smarter. Interview better. • Built with FastAPI, Groq LLMs & React.
        </p>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={(status) => setGroqConnected(status)}
        currentStatus={groqConnected}
      />

    </div>
  );
}
