// Shared habit logs store - Single source of truth for all habit completion data
// Now syncs with backend database for persistence

import { api } from '../services/api';

export interface HabitLog {
  habitId: number | string; // Support both legacy number IDs and new string IDs
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // For numeric habits
  wasRevived?: boolean; // Track if this day was revived (hide revive button)
}

interface BackendLog {
  habit_id: number;
  date: string;
  completed: boolean;
  status: string;
  amount_done?: number | null;
}

const HABIT_LOGS_KEY = 'habitLogs';

// Get all habit logs from localStorage
export const getHabitLogs = (): HabitLog[] => {
  const stored = localStorage.getItem(HABIT_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set all habit logs
export const setHabitLogs = (logs: HabitLog[]): void => {
  localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(logs));
  // Trigger storage event for cross-component reactivity
  window.dispatchEvent(new Event('habitLogsChanged'));
};

// Sync habit logs from backend to localStorage
export const syncHabitLogsFromBackend = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token, skipping habit logs sync');
      return;
    }

    console.log('Syncing habit logs from backend...');
    const response = await api.get<{
      logs: BackendLog[];
      leaf_dollars: number;
      unlocked_characters: number[];
      selected_character: number;
    }>('/habits/all_logs/');

    console.log('Backend response:', response);

    if (response.logs && response.logs.length > 0) {
      // Convert backend logs to frontend format
      const frontendLogs: HabitLog[] = response.logs.map(log => ({
        habitId: log.habit_id,
        date: log.date,
        completed: log.completed,
        value: log.amount_done || undefined,
      }));

      console.log('Converted logs:', frontendLogs);
      setHabitLogs(frontendLogs);
      console.log('Habit logs synced successfully, count:', frontendLogs.length);
    } else {
      console.log('No habit logs from backend');
    }
  } catch (error) {
    console.error('Failed to sync habit logs from backend:', error);
  }
};

// Get log for specific habit and date
export const getHabitLog = (habitId: number | string, date: string): HabitLog | undefined => {
  const logs = getHabitLogs();
  return logs.find(log => String(log.habitId) === String(habitId) && log.date === date);
};

// Update or create a log entry (local only - backend is updated via API calls)
export const updateHabitLog = (habitId: number | string, date: string, completed: boolean, value?: number, wasRevived?: boolean): void => {
  const logs = getHabitLogs();
  const existingIndex = logs.findIndex(log => String(log.habitId) === String(habitId) && log.date === date);

  const newLog: HabitLog = { habitId, date, completed, value, wasRevived };

  if (existingIndex >= 0) {
    // Preserve wasRevived flag if it was already set
    logs[existingIndex] = { ...logs[existingIndex], ...newLog };
  } else {
    logs.push(newLog);
  }

  setHabitLogs(logs);
};

// Get logs for a specific habit in a date range
export const getHabitLogsForMonth = (habitId: number | string, year: number, month: number): HabitLog[] => {
  const logs = getHabitLogs();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  return logs.filter(log =>
    String(log.habitId) === String(habitId) &&
    log.date >= startDate &&
    log.date <= endDate
  );
};

// Format date to YYYY-MM-DD
export const formatDate = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Get today's date string
export const getTodayDateString = (): string => {
  const now = new Date();
  return formatDate(now.getFullYear(), now.getMonth(), now.getDate());
};

// Check if a numeric habit is completed (≥50% of target)
export const isNumericHabitCompleted = (value: number, target: number): boolean => {
  return value >= target * 0.5;
};
