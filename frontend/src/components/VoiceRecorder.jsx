import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Trash2, Edit3, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { isSpeechRecognitionSupported, createSpeechRecognizer } from '../services/speech';

export default function VoiceRecorder({
  onAnswerSubmit,
  isThinking,
  disabled
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognizerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Timer effect when recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    setSpeechError('');
    if (!isSupported) {
      setIsEditingManually(true);
      setSpeechError('Speech recognition is not supported in this browser. You can type your answer directly.');
      return;
    }

    try {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }

      const recognizer = createSpeechRecognizer({
        onStart: () => {
          setIsRecording(true);
        },
        onResult: ({ full }) => {
          setTranscript(full);
        },
        onError: (event) => {
          console.warn('Speech recognition error:', event);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone access was denied. Please allow microphone permissions or type your answer.');
          } else if (event.error !== 'no-speech') {
            setSpeechError(`Voice input notice: ${event.error}. You can edit or type below.`);
          }
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        }
      });

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setSpeechError('Microphone initialization failed. Feel free to type your response below.');
    }
  };

  const stopRecording = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClear = () => {
    stopRecording();
    setTranscript('');
    setRecordingSeconds(0);
  };

  const handleSubmit = () => {
    stopRecording();
    const finalAnswer = transcript.trim();
    if (!finalAnswer) return;
    onAnswerSubmit(finalAnswer, recordingSeconds);
    setTranscript('');
    setRecordingSeconds(0);
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-800/90 shadow-2xl relative overflow-hidden">
      
      {/* Header controls & recording indicator */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/70">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            isRecording
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isRecording ? 'Recording Voice...' : 'Voice Input'}</span>
          </div>

          {isRecording && (
            <span className="text-xs font-mono text-slate-300 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
              {formatTime(recordingSeconds)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditingManually(!isEditingManually)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            title="Toggle text edit mode"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditingManually ? 'Hide Text Area' : 'Type / Edit'}</span>
          </button>

          {transcript && (
            <button
              onClick={handleClear}
              disabled={isThinking || disabled}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/30 transition-all"
              title="Clear transcript"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Speech notice if any */}
      {speechError && (
        <div className="mb-4 flex items-center space-x-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Live Transcript / Editable Text Area */}
      <div className="mb-6">
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            isRecording
              ? 'Listening to your voice... speak your answer clearly.'
              : 'Click "Start Speaking" or type your interview answer here...'
          }
          disabled={isThinking || disabled}
          className={`w-full px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed text-white placeholder-slate-500 bg-slate-950/80 border transition-all outline-none resize-none ${
            isRecording
              ? 'border-emerald-500/40 ring-1 ring-emerald-500/30'
              : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
          }`}
        />
      </div>

      {/* Main Interactive Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Large Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isThinking || disabled}
          className={`w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl ${
            isRecording
              ? 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-rose-500/30 scale-102 hover:from-rose-500 hover:to-red-400 animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 hover:scale-102'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Start Speaking Answer</span>
            </>
          )}
        </button>

        {/* Submit Answer CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!transcript.trim() || isThinking || disabled}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-brand-500/25 hover:scale-102 transition-all"
        >
          {isThinking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI Evaluating...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Answer</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
}
