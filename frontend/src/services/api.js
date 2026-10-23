import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const checkHealth = async () => {
  try {
    const res = await api.get('/api/health');
    return res.data;
  } catch (error) {
    return { status: 'offline', groq_connected: false };
  }
};

export const updateGroqKey = async (apiKey) => {
  const res = await api.post('/api/config/groq-key', { api_key: apiKey });
  return res.data;
};

export const uploadResumePdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/api/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const analyzeResumeText = async (resumeText) => {
  const res = await api.post('/api/resume/analyze-text', { resume_text: resumeText });
  return res.data;
};

export const createInterviewSession = async (payload) => {
  const res = await api.post('/api/interview/create', payload);
  return res.data;
};

export const submitInterviewAnswer = async (sessionId, answerText, responseTime = null) => {
  const res = await api.post(`/api/interview/${sessionId}/answer`, {
    answer_text: answerText,
    response_time_seconds: responseTime,
  });
  return res.data;
};

export const getInterviewStatus = async (sessionId) => {
  const res = await api.get(`/api/interview/${sessionId}/status`);
  return res.data;
};

export const forceCompleteInterview = async (sessionId) => {
  const res = await api.post(`/api/interview/${sessionId}/complete`);
  return res.data;
};

export const getInterviewReport = async (sessionId) => {
  const res = await api.get(`/api/interview/${sessionId}/report`);
  return res.data;
};

export default api;
