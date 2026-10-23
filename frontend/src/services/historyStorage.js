import { getInterviewHistory, clearInterviewHistory } from './api';

const STORAGE_KEY = 'prepwise_interview_history';

/**
 * Get locally stored history list
 */
export const getLocalHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local history:', err);
    return [];
  }
};

/**
 * Save completed report to local history
 */
export const saveReportLocally = (report) => {
  if (!report || !report.session_id) return;
  try {
    const history = getLocalHistory();
    const weakTopics = (report.recommended_topics || []).map(r => r.topic);
    
    const entry = {
      session_id: report.session_id,
      candidate_name: report.candidate_name || 'Candidate',
      target_company: report.target_company || 'General',
      interview_type: report.interview_type || 'Mixed',
      difficulty: report.difficulty || 'Medium',
      overall_score: report.overall_score || 75,
      readiness_verdict: report.readiness_verdict || 'Ready for Onsite',
      completed_at: report.completed_at || new Date().toLocaleDateString(),
      total_questions: report.total_questions_answered || (report.question_reviews || []).length || 5,
      weak_topics: weakTopics,
      category_scores: report.category_scores || {},
      strengths: report.strengths || []
    };

    // Remove if already exists to update
    const filtered = history.filter(h => h.session_id !== entry.session_id);
    filtered.push(entry);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to save to local storage:', err);
  }
};

/**
 * Calculate progress comparison metrics (e.g. Last score: 68 -> Current score: 76)
 */
export const getComparisonMetrics = (currentScore = null) => {
  const history = getLocalHistory();
  if (history.length === 0) {
    return {
      hasPrevious: false,
      lastScore: null,
      currentScore: currentScore,
      diff: null,
      trendText: 'First mock interview completed! Great start.',
      weakTopics: []
    };
  }

  // If currentScore was not passed, take latest from history
  const scoreNow = currentScore !== null ? currentScore : history[history.length - 1].overall_score;
  
  // Previous score is the second-to-last if available, or compare against baseline
  let scoreLast = null;
  if (currentScore !== null) {
    // Current is being evaluated against the last stored item
    const prevEntry = history[history.length - 1];
    scoreLast = prevEntry ? prevEntry.overall_score : null;
  } else if (history.length >= 2) {
    scoreLast = history[history.length - 2].overall_score;
  }

  let diff = null;
  let trendText = 'Keep practicing to track improvement.';

  if (scoreLast !== null) {
    diff = scoreNow - scoreLast;
    if (diff > 0) {
      trendText = `↗ Improved by +${diff} points since your last interview!`;
    } else if (diff === 0) {
      trendText = `→ Maintained steady performance (${scoreNow} pts).`;
    } else {
      trendText = `↘ Slight dip (${diff} pts). Focus on recurring weak topics below.`;
    }
  }

  // Aggregate recurring weak topics across all interviews
  const topicFrequency = {};
  history.forEach(item => {
    (item.weak_topics || []).forEach(t => {
      topicFrequency[t] = (topicFrequency[t] || 0) + 1;
    });
  });

  const weakTopics = Object.keys(topicFrequency)
    .sort((a, b) => topicFrequency[b] - topicFrequency[a])
    .slice(0, 6);

  return {
    hasPrevious: scoreLast !== null,
    lastScore: scoreLast,
    currentScore: scoreNow,
    diff,
    trendText,
    weakTopics,
    totalCompleted: history.length
  };
};

/**
 * Clear both local and server history
 */
export const clearAllHistory = async () => {
  localStorage.removeItem(STORAGE_KEY);
  try {
    await clearInterviewHistory();
  } catch (e) {
    // ignore
  }
};
