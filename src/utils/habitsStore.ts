// Habits Store - Single source of truth for all habit data

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
    id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

// Delete habit
export const deleteHabit = (id: string): void => {
  const habits = getHabits();
  setHabits(habits.filter(h => h.id !== id));
};
