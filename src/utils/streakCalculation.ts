// Streak Calculation - Single source of truth based on habit logs

import { getHabitLogs, formatDate } from './habitLogsStore';
import { type Habit } from './habitsStore';

/**
 * Calculate current streak for a habit based on logs
 * Streak = consecutive successful days ending today
 */
export const calculateStreak = (habit: Habit): number => {
  const logs = getHabitLogs().filter(log => String(log.habitId) === String(habit.id));
  if (logs.length === 0) return 0;

  const today = new Date();
  let streak = 0;

  // Check consecutive days backwards from today
  let currentDate = new Date(today);

  while (true) {
    const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const log = logs.find(l => l.date === dateString);

    if (!log) break; // No log = streak broken

    // Check if day was successful
    let isSuccess = false;
    if (habit.trackingType === 'variable_amount') {
      // For Build (Amount): must reach 100% of target
      isSuccess = log.value !== undefined && habit.target_amount !== undefined &&
                 log.value >= habit.target_amount;
    } else {
      isSuccess = log.completed;
    }

    if (!isSuccess) break; // Failed day = streak broken

    streak++;
    currentDate.setDate(currentDate.getDate() - 1); // Go back one day
  }

  return streak;
};
