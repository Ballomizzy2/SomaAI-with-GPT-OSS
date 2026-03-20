/**
 * Session and Progress Tracking for Soma AI
 * Uses localStorage for demo purposes (would use DB in production)
 */

export interface PainLog {
  id: string;
  timestamp: number;
  region: string;
  quality: string;
  severity: number;
  days_since_onset?: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  timestamp: number;
  exerciseId: string;
  exerciseTitle: string;
  completed: boolean;
  duration?: number; // seconds
}

export interface ConversationLog {
  id: string;
  timestamp: number;
  type: 'text' | 'voice';
  conversationId?: string;
  summary?: string;
}

export interface UserSession {
  sessionId: string;
  startedAt: number;
  lastActive: number;
  painLogs: PainLog[];
  exerciseLogs: ExerciseLog[];
  conversationLogs: ConversationLog[];
}

const STORAGE_KEY = 'soma_ai_session';

/**
 * Get current session or create new one
 */
export function getSession(): UserSession {
  if (typeof window === 'undefined') return createNewSession();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const session = JSON.parse(stored);
      // Update last active
      session.lastActive = Date.now();
      saveSession(session);
      return session;
    } catch (e) {
      console.error('Failed to parse session:', e);
    }
  }

  return createNewSession();
}

/**
 * Create a new session
 */
function createNewSession(): UserSession {
  const session: UserSession = {
    sessionId: generateId(),
    startedAt: Date.now(),
    lastActive: Date.now(),
    painLogs: [],
    exerciseLogs: [],
    conversationLogs: []
  };

  saveSession(session);
  return session;
}

/**
 * Save session to localStorage
 */
function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;

  session.lastActive = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Log a pain report
 */
export function logPainReport(
  region: string,
  quality: string,
  severity: number,
  daysSinceOnset?: number,
  notes?: string
): PainLog {
  const session = getSession();

  const painLog: PainLog = {
    id: generateId(),
    timestamp: Date.now(),
    region,
    quality,
    severity,
    days_since_onset: daysSinceOnset,
    notes
  };

  session.painLogs.push(painLog);
  saveSession(session);

  return painLog;
}

/**
 * Log an exercise completion
 */
export function logExercise(
  exerciseId: string,
  exerciseTitle: string,
  completed: boolean = true,
  duration?: number
): ExerciseLog {
  const session = getSession();

  const exerciseLog: ExerciseLog = {
    id: generateId(),
    timestamp: Date.now(),
    exerciseId,
    exerciseTitle,
    completed,
    duration
  };

  session.exerciseLogs.push(exerciseLog);
  saveSession(session);

  return exerciseLog;
}

/**
 * Log a conversation
 */
export function logConversation(
  type: 'text' | 'voice',
  conversationId?: string,
  summary?: string
): ConversationLog {
  const session = getSession();

  const conversationLog: ConversationLog = {
    id: generateId(),
    timestamp: Date.now(),
    type,
    conversationId,
    summary
  };

  session.conversationLogs.push(conversationLog);
  saveSession(session);

  return conversationLog;
}

/**
 * Get pain trend (last 7 days)
 */
export function getPainTrend(): { timestamp: number; severity: number }[] {
  const session = getSession();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return session.painLogs
    .filter(log => log.timestamp > sevenDaysAgo)
    .map(log => ({
      timestamp: log.timestamp,
      severity: log.severity
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get exercise adherence stats
 */
export function getExerciseStats() {
  const session = getSession();

  const total = session.exerciseLogs.length;
  const completed = session.exerciseLogs.filter(log => log.completed).length;
  const adherenceRate = total > 0 ? (completed / total) * 100 : 0;

  // Calculate streak
  const sortedLogs = [...session.exerciseLogs]
    .filter(log => log.completed)
    .sort((a, b) => b.timestamp - a.timestamp);

  let streak = 0;
  let currentDate = new Date().setHours(0, 0, 0, 0);

  for (const log of sortedLogs) {
    const logDate = new Date(log.timestamp).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((currentDate - logDate) / (24 * 60 * 60 * 1000));

    if (daysDiff === streak) {
      streak++;
      currentDate = logDate;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return {
    total,
    completed,
    adherenceRate: Math.round(adherenceRate),
    streak
  };
}

/**
 * Clear all session data (for testing)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
