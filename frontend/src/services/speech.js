/**
 * Speech-to-Text (STT) and Text-to-Speech (TTS) modular service.
 */

// Check if Speech Recognition is supported
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 
    'webkitSpeechRecognition' in window
  );
};

// Clean text for natural speech synthesis
export const sanitizeTextForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1')     // remove italics
    .replace(/`([^`]+)`/g, '$1')     // remove backticks
    .replace(/#{1,6}\s?/g, '')       // remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
    .replace(/[•\-\*]\s/g, '')       // remove list bullets
    .trim();
};

let preferredVoice = null;

// Get the best available voice
export const getPreferredVoice = () => {
  if (preferredVoice) return preferredVoice;
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  // Look for high-quality natural voices
  const preferredNames = [
    'Google US English',
    'Samantha',
    'Daniel',
    'Karen',
    'Arthur',
    'Microsoft Zira',
    'Victoria'
  ];

  for (const name of preferredNames) {
    const found = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
    if (found) {
      preferredVoice = found;
      return found;
    }
  }

  // Fallback to first English voice
  const englishVoice = voices.find(v => v.lang.startsWith('en'));
  if (englishVoice) {
    preferredVoice = englishVoice;
    return englishVoice;
  }

  return voices[0] || null;
};

// Ensure voices are loaded
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    getPreferredVoice();
  };
}

/**
 * Speak text using Text-to-Speech.
 */
export const speakText = (text, onStart, onEnd, onError) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError(new Error('Text-to-speech is not supported in this browser.'));
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voice = getPreferredVoice();
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    // Ignore canceled error if intentionally stopped
    if (event.error !== 'canceled' && onError) {
      onError(event);
    } else if (onEnd) {
      onEnd();
    }
  };

  window.speechSynthesis.speak(utterance);

  // Return cancel function
  return () => {
    window.speechSynthesis.cancel();
    if (onEnd) onEnd();
  };
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Initialize Speech Recognition instance.
 */
export const createSpeechRecognizer = ({ onResult, onError, onEnd, onStart }) => {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error('Speech recognition is not supported in this browser.'));
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        full: (finalTranscript + interimTranscript).trim()
      });
    }
  };

  recognition.onerror = (event) => {
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};
