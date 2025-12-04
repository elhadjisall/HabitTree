// Habits Store - Single source of truth for all habit data
// Integrated with backend API

import { api } from '../services/api';
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

// Backend Habit format
interface BackendHabit {
  id: number;
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  icon?: string;
  habit_type?: string;
  tracking_mode: string;
  target_amount?: number;
  unit?: string;
  frequency?: string;
  duration_days?: number;
  is_public: boolean;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
  created_at: string;
  updated_at?: string;
  completion_percentage?: number;
}

// Map backend habit to frontend format
const mapBackendToFrontend = (backendHabit: BackendHabit): Habit => {
  // Map tracking_mode to TrackingType
  // Backend uses: 'daily', 'weekly', 'count', 'time'
  // Frontend uses: 'tick_cross', 'variable_amount', 'quit'
  let trackingType: TrackingType = 'tick_cross';
  if (backendHabit.tracking_mode === 'count' || backendHabit.tracking_mode === 'amount' || backendHabit.tracking_mode === 'variable_amount') {
    trackingType = 'variable_amount';
  } else if (backendHabit.tracking_mode === 'quit') {
    trackingType = 'quit';
  } else {
    // 'daily', 'weekly', 'time' all map to 'tick_cross'
    trackingType = 'tick_cross';
  }

  return {
    id: String(backendHabit.id),
    label: backendHabit.name,
    emoji: backendHabit.emoji || '🌱',
    color: backendHabit.color || '#6ab04c',
    duration_days: backendHabit.duration_days || 30,
    trackingType,
    target_amount: backendHabit.target_amount,
    unit: backendHabit.unit,
    streak: backendHabit.current_streak || 0,
    createdAt: backendHabit.created_at,
    isPrivate: !backendHabit.is_public,
  };
};

// Map frontend habit to backend format
const mapFrontendToBackend = (habit: Omit<Habit, 'id' | 'streak' | 'createdAt'>): Partial<BackendHabit> => {
  // Map TrackingType to tracking_mode
  // Frontend uses: 'tick_cross', 'variable_amount', 'quit'
  // Backend expects: 'daily', 'weekly', 'count', 'time'
  let tracking_mode = 'daily'; // Default to 'daily' for tick_cross
  if (habit.trackingType === 'variable_amount') {
    tracking_mode = 'count'; // Use 'count' for variable amount tracking
  } else if (habit.trackingType === 'quit') {
    tracking_mode = 'daily'; // Use 'daily' for quit habits
  }

  const backendData: Partial<BackendHabit> = {
    name: habit.label,
    emoji: habit.emoji,
    color: habit.color,
    tracking_mode,
    duration_days: habit.duration_days,
    is_public: !habit.isPrivate,
  };

  // Only include target_amount and unit if they are defined (for variable_amount tracking)
  if (habit.trackingType === 'variable_amount') {
    if (habit.target_amount !== undefined) {
      backendData.target_amount = habit.target_amount;
    }
    if (habit.unit !== undefined && habit.unit !== '') {
      backendData.unit = habit.unit;
    }
  }

  return backendData;
};

const HABITS_KEY = 'habits';

// Get all habits from backend API
export const getHabits = async (): Promise<Habit[]> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Not authenticated, return empty array
      return [];
    }

    const response = await api.get<{ count: number; results: BackendHabit[] }>('/habits/');
    const backendHabits = response.results || response; // Handle both paginated and non-paginated responses
    
    // Convert array if needed
    const habitsArray = Array.isArray(backendHabits) ? backendHabits : [];
    
    const habits = habitsArray.map(mapBackendToFrontend);
    
    // Cache in localStorage for offline access
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    
    return habits;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    // Fallback to localStorage cache
    const stored = localStorage.getItem(HABITS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

// Get habits synchronously from cache (for hooks that need immediate data)
export const getHabitsSync = (): Habit[] => {
  const stored = localStorage.getItem(HABITS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set all habits (internal use, triggers event)
const setHabits = (habits: Habit[]): void => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  // Trigger event for reactivity
  window.dispatchEvent(new Event('habitsChanged'));
};

// Add a new habit
export const addHabit = async (habit: Omit<Habit, 'id' | 'streak' | 'createdAt'>): Promise<Habit> => {
  try {
    const backendData = mapFrontendToBackend(habit);
    const response = await api.post<BackendHabit>('/habits/', backendData);
    const newHabit = mapBackendToFrontend(response);
    
    // Update cache
    const habits = getHabitsSync();
    habits.push(newHabit);
    setHabits(habits);
    
    return newHabit;
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
};

// Get habit by ID
export const getHabitById = (id: string): Habit | undefined => {
  const habits = getHabitsSync();
  return habits.find(h => h.id === id);
};

// Update habit
export const updateHabit = async (id: string, updates: Partial<Habit>): Promise<void> => {
  try {
    const backendData: Partial<BackendHabit> = {};
    
    if (updates.label !== undefined) backendData.name = updates.label;
    if (updates.emoji !== undefined) backendData.emoji = updates.emoji;
    if (updates.color !== undefined) backendData.color = updates.color;
    if (updates.duration_days !== undefined) backendData.duration_days = updates.duration_days;
    if (updates.isPrivate !== undefined) backendData.is_public = !updates.isPrivate;
    if (updates.trackingType !== undefined) {
      if (updates.trackingType === 'variable_amount') {
        backendData.tracking_mode = 'count';
      } else if (updates.trackingType === 'quit') {
        backendData.tracking_mode = 'daily';
      } else {
        backendData.tracking_mode = 'daily';
      }
    }
    if (updates.target_amount !== undefined) backendData.target_amount = updates.target_amount;
    if (updates.unit !== undefined) backendData.unit = updates.unit;
    
    await api.put<BackendHabit>(`/habits/${id}/`, backendData);
    
    // Update cache
    const habits = getHabitsSync();
    const index = habits.findIndex(h => h.id === id);
    if (index >= 0) {
      habits[index] = { ...habits[index], ...updates };
      setHabits(habits);
    }
  } catch (error) {
    console.error('Failed to update habit:', error);
    throw error;
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
export const completeHabit = async (id: string): Promise<{ stats: { highestStreak: number; daysCompleted: number; daysMissed: number }; habit: Habit } | null> => {
  const habits = getHabitsSync();
  const habitToComplete = habits.find(h => h.id === id);

  if (!habitToComplete) {
    return null;
  }

  try {
    // Delete from backend
    await api.delete(`/habits/${id}/`);
  } catch (error) {
    console.error('Failed to delete habit from backend:', error);
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
export const deleteHabit = async (id: string): Promise<void> => {
  const habits = getHabitsSync();
  const habitToDelete = habits.find(h => h.id === id);

  if (habitToDelete) {
    try {
      // Delete from backend
      await api.delete(`/habits/${id}/`);
    } catch (error) {
      console.error('Failed to delete habit from backend:', error);
    }

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

  // Delete habit from cache
  setHabits(habits.filter(h => h.id !== id));
};
