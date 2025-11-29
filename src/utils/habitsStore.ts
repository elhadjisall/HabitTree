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
const calculateQuestStats = (habitId: string, durationDays: number): { highestStreak: number; daysCompleted: number; daysMissed: number; totalDays: number } => {
  const logs = getHabitLogs().filter(log => String(log.habitId) === String(habitId));

  // Calculate highest streak
  let highestStreak = 0;
  let currentStreak = 0;

  // Get all dates from habit creation to now
  const today = new Date();
  const completedDates = new Set(logs.filter(log => log.completed).map(log => log.date));

  // Calculate streak by checking consecutive days
  for (let i = 0; i < durationDays; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateString = formatDate(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    if (completedDates.has(dateString)) {
      currentStreak++;
      highestStreak = Math.max(highestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Count completed and missed days
  const daysCompleted = logs.filter(log => log.completed).length;
  const totalDays = Math.min(durationDays, Math.ceil((today.getTime() - new Date(logs[0]?.date || today).getTime()) / (1000 * 60 * 60 * 24)));
  const daysMissed = Math.max(0, totalDays - daysCompleted);

  return {
    highestStreak,
    daysCompleted,
    daysMissed,
    totalDays: durationDays
  };
};

// Delete habit and save to history
export const deleteHabit = (id: string): void => {
  const habits = getHabits();
  const habitToDelete = habits.find(h => h.id === id);

  if (habitToDelete) {
    // Calculate quest statistics before deletion
    const stats = calculateQuestStats(id, habitToDelete.duration_days);

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
