import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles, X, User } from 'lucide-react';
import { uploadResumePdf, analyzeResumeText } from '../services/api';
import { SAMPLE_RESUMES } from '../data/sampleResumes';

export default function ResumeUploadPage({ onResumeParsed, groqConnected, onOpenApiKeyModal }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError('');
    setSelectedSample(null);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Please select a valid PDF resume file (.pdf).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSelectSample = (sample) => {
    setError('');
    setFile(null);
    setSelectedSample(sample);
  };

  const handleProcessResume = async () => {
    if (!groqConnected) {
      setError('Groq API Key Required: Prepwise requires an active Groq API key to analyze your resume with real AI. Please enter your key to proceed.');
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      return;
    }

    if (!file && !selectedSample) {
      setError('Please upload a PDF resume or select a sample profile to continue.');
      return;
    }

    setLoading(true);
    setError('');

    // Staged animation progress
    setLoadingStage(1); // Reading
    const stageTimer1 = setTimeout(() => setLoadingStage(2), 700); // Extracting
    const stageTimer2 = setTimeout(() => setLoadingStage(3), 1400); // Analyzing LLM

    try {
      let result;
      if (file) {
        result = await uploadResumePdf(file);
      } else {
        result = await analyzeResumeText(selectedSample.text);
      }

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoadingStage(4); // Completed

      setTimeout(() => {
        onResumeParsed({
          profile: result.candidate_profile,
          rawText: result.resume_text_preview
        });
      }, 500);

    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoading(false);
      setLoadingStage(0);
      const detail = err.response?.data?.detail || 'Failed to process resume. Please ensure the PDF has readable text or try a sample resume.';
      setError(detail);
      if (err.response?.status === 403 && onOpenApiKeyModal) {
        onOpenApiKeyModal();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] mb-3">
          Step 1: Upload Your Resume
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Upload your resume in PDF format. Prepwise uses this to build a customized interview questioning strategy for your exact projects.
        </p>
      </div>

      {/* Groq API Key Required Banner if disconnected */}
      {!groqConnected && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-200">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300 font-['Outfit']">Groq API Key Required for Real AI</p>
              <p className="text-xs text-amber-200/80 leading-relaxed mt-0.5">
                Prepwise runs real Groq Llama-3.3-70b inference to deeply extract your actual skills and projects. Please enter your API key to proceed.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenApiKeyModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enter Groq Key</span>
          </button>
        </div>
      )}


      {/* Main Upload Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl mb-8">
        
        {/* Dropzone */}
        {!selectedSample && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-brand-500 bg-brand-500/10 scale-101'
                : file
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white mb-1 font-['Outfit']">{file.name}</h4>
                <p className="text-xs text-slate-400 mb-4">{(file.size / 1024).toFixed(1)} KB • PDF Document</p>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 shadow-lg shadow-brand-500/10">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1 font-['Outfit']">
                  Drag and drop your PDF resume here
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  or <span className="text-brand-400 font-semibold underline">browse files</span> from your computer (Max 10MB)
                </p>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Text-readable PDF only • Not stored permanently
                </span>
              </div>
            )}
          </div>
        )}

        {/* Selected Sample Resume Card Preview */}
        {selectedSample && (
          <div className="p-6 rounded-2xl bg-brand-500/10 border border-brand-500/30 relative">
            <button
              onClick={() => setSelectedSample(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-['Outfit']">{selectedSample.name}</h4>
                <p className="text-xs text-brand-300 font-medium">{selectedSample.role}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2">{selectedSample.description}</p>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mt-4 flex items-center space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading / Processing Status Checklist */}
        {loading && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Analyzing Resume Profile</span>
              <span className="text-brand-400 font-mono">Processing...</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className={`flex items-center space-x-2 ${loadingStage >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {loadingStage >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Validating PDF format and structure</span>
              </div>
              <div className={`flex items-center space-x-2 ${loadingStage >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {loadingStage >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Extracting raw text and project descriptions</span>
              </div>
              <div className={`flex items-center space-x-2 ${loadingStage >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {loadingStage >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>Structuring candidate profile & potential interview questions</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleProcessResume}
            disabled={(!file && !selectedSample) || loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Extracting & Analyzing...</span>
            ) : (
              <>
                <span>Continue to Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Instant Testing: Sample Resumes Selector */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800/80">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
            Quick Test: Try a Sample Candidate Profile
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_RESUMES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                selectedSample?.id === sample.id
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
              }`}
            >
              <p className="text-xs font-bold text-white font-['Outfit'] mb-1">{sample.role}</p>
              <p className="text-[11px] text-brand-300 font-medium mb-1.5">{sample.name}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{sample.description}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
