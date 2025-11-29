// Habits Store - Single source of truth for all habit data

import { getHabitLogs, formatDate } from './habitLogsStore';
import { addQuestToHistory, type QuestHistoryEntry } from './questHistoryStorage';

export type TrackingType = 'tick_cross' | 'variable_amount' | 'quit';

export interface Habit {
  id: string;
  label: string;
  emoji: string;
  color: string;
  duration_days: number; // Total days for the quest
  trackingType: TrackingType;
  target_amount?: number; // Only for variable_amount
  unit?: string; // Only for variable_amount
  streak: number;
  createdAt: string; // ISO date string
  isPrivate?: boolean; // Public by default (false), true for private habits
}

const HABITS_KEY = 'habits';

// Get all habits from localStorage
export const getHabits = (): Habit[] => {
  const stored = localStorage.getItem(HABITS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set all habits
export const setHabits = (habits: Habit[]): void => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  // Trigger event for reactivity
  window.dispatchEvent(new Event('habitsChanged'));
};

// Add a new habit
export const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'createdAt'>): Habit => {
  const habits = getHabits();
  const newHabit: Habit = {
    ...habit,
    id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    streak: 0,
    createdAt: new Date().toISOString(),
  };
  habits.push(newHabit);
  setHabits(habits);
  return newHabit;
};

// Get habit by ID
export const getHabitById = (id: string): Habit | undefined => {
  const habits = getHabits();
  return habits.find(h => h.id === id);
};

// Update habit
export const updateHabit = (id: string, updates: Partial<Habit>): void => {
  const habits = getHabits();
  const index = habits.findIndex(h => h.id === id);
  if (index >= 0) {
    habits[index] = { ...habits[index], ...updates };
    setHabits(habits);
  }
};

// Calculate quest statistics from logs
const calculateQuestStats = (habitId: string, durationDays: number, createdAt: string): { highestStreak: number; daysCompleted: number; daysMissed: number; totalDays: number } => {
  const logs = getHabitLogs().filter(log => String(log.habitId) === String(habitId));

  // Calculate highest streak by going through ALL logs chronologically
  let highestStreak = 0;
  let currentStreak = 0;

  // Build complete date range from creation to now
  const createdDate = new Date(createdAt);
  const today = new Date();
  const allDates: string[] = [];

  for (let d = new Date(createdDate); d <= today; d.setDate(d.getDate() + 1)) {
    allDates.push(formatDate(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  // Calculate highest streak
  for (const dateString of allDates) {
    const log = logs.find(l => l.date === dateString);

    if (log && log.completed) {
      currentStreak++;
      highestStreak = Math.max(highestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Count completed days
  const daysCompleted = logs.filter(log => log.completed).length;

  // Count days missed: all past days (up to today) that were NOT completed
  // This includes days with explicit incomplete logs AND days with no logs at all
  const daysMissed = allDates.filter(dateString => {
    const log = logs.find(l => l.date === dateString);
    return !log || !log.completed;
  }).length;

  // Total days is the duration
  const totalDays = durationDays;

  return {
    highestStreak,
    daysCompleted,
    daysMissed,
    totalDays
  };
};

// Complete habit (when duration is over) and move to history
export const completeHabit = (id: string): { stats: { highestStreak: number; daysCompleted: number; daysMissed: number }; habit: Habit } | null => {
  const habits = getHabits();
  const habitToComplete = habits.find(h => h.id === id);

  if (!habitToComplete) {
    return null;
  }

  // Calculate quest statistics
  const stats = calculateQuestStats(id, habitToComplete.duration_days, habitToComplete.createdAt);

  // Create history entry
  const historyEntry: QuestHistoryEntry = {
    id: habitToComplete.id,
    label: habitToComplete.label,
    emoji: habitToComplete.emoji,
    color: habitToComplete.color,
    trackingType: habitToComplete.trackingType,
    highestStreak: stats.highestStreak,
    daysCompleted: stats.daysCompleted,
    daysMissed: stats.daysMissed,
    totalDays: stats.totalDays,
    completedAt: new Date().toISOString(),
    target_amount: habitToComplete.target_amount,
    unit: habitToComplete.unit
  };

  // Save to history
  addQuestToHistory(historyEntry);

  // Remove from active habits
  setHabits(habits.filter(h => h.id !== id));

  return {
    stats: {
      highestStreak: stats.highestStreak,
      daysCompleted: stats.daysCompleted,
      daysMissed: stats.daysMissed
    },
    habit: habitToComplete
  };
};

// Delete habit and save to history
export const deleteHabit = (id: string): void => {
  const habits = getHabits();
  const habitToDelete = habits.find(h => h.id === id);

  if (habitToDelete) {
    // Calculate quest statistics before deletion
    const stats = calculateQuestStats(id, habitToDelete.duration_days, habitToDelete.createdAt);

    // Create history entry
    const historyEntry: QuestHistoryEntry = {
      id: habitToDelete.id,
      label: habitToDelete.label,
      emoji: habitToDelete.emoji,
      color: habitToDelete.color,
      trackingType: habitToDelete.trackingType,
      highestStreak: stats.highestStreak,
      daysCompleted: stats.daysCompleted,
      daysMissed: stats.daysMissed,
      totalDays: stats.totalDays,
      completedAt: new Date().toISOString(),
      target_amount: habitToDelete.target_amount,
      unit: habitToDelete.unit
    };

    // Save to history
    addQuestToHistory(historyEntry);
  }

  // Delete habit
  setHabits(habits.filter(h => h.id !== id));
};
