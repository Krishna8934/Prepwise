import React, { useState } from 'react';
import { Key, CheckCircle, AlertCircle, X, ExternalLink, Sparkles } from 'lucide-react';
import { updateGroqKey } from '../services/api';

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated, currentStatus }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter a valid Groq API key.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await updateGroqKey(apiKey.trim());
      if (res.success) {
        setSuccess(true);
        if (onKeyUpdated) onKeyUpdated(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update API key. Please verify the key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-brand-500/10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Key className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">Groq API Key Required</h3>
            <p className="text-xs text-slate-400">Power genuine Llama-3.3-70b interview intelligence</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Prepwise uses Groq’s high-throughput Llama-3 models to perform real-time resume extraction, adaptive question generation, and rigorous technical evaluations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Enter Groq API Key (gsk_...)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Groq API Key verified & activated successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
            >
              <span>Get a free Groq key</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-1.5"
              >
                {loading ? (
                  <span>Verifying with Groq...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Verify & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>


      </div>
    </div>
  );
}
