// Shared habit logs store - Single source of truth for all habit completion data

export interface HabitLog {
  habitId: number | string; // Support both legacy number IDs and new string IDs
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // For numeric habits
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

// Get log for specific habit and date
export const getHabitLog = (habitId: number | string, date: string): HabitLog | undefined => {
  const logs = getHabitLogs();
  return logs.find(log => String(log.habitId) === String(habitId) && log.date === date);
};

// Update or create a log entry
export const updateHabitLog = (habitId: number | string, date: string, completed: boolean, value?: number): void => {
  const logs = getHabitLogs();
  const existingIndex = logs.findIndex(log => String(log.habitId) === String(habitId) && log.date === date);

  const newLog: HabitLog = { habitId, date, completed, value };

  if (existingIndex >= 0) {
    logs[existingIndex] = newLog;
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
