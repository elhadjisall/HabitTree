// Streak Calculation - Single source of truth based on habit logs

import { getHabitLogs, formatDate, isNumericHabitCompleted } from './habitLogsStore';
import { type Habit } from './habitsStore';

/**
 * Calculate current streak for a habit based on logs
 * Streak = consecutive successful periods ending today/this week/this month
 */
export const calculateStreak = (habit: Habit): number => {
  const logs = getHabitLogs().filter(log => String(log.habitId) === String(habit.id));
  if (logs.length === 0) return 0;

  const today = new Date();
  let streak = 0;

  if (habit.frequency === 'daily') {
    // Check consecutive days backwards from today
    let currentDate = new Date(today);

    while (true) {
      const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const log = logs.find(l => l.date === dateString);

      if (!log) break; // No log = streak broken

      // Check if day was successful
      let isSuccess = false;
      if (habit.trackingType === 'variable_amount') {
        isSuccess = log.value !== undefined && habit.target_amount !== undefined &&
                   isNumericHabitCompleted(log.value, habit.target_amount);
      } else {
        isSuccess = log.completed;
      }

      if (!isSuccess) break; // Failed day = streak broken

      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // Go back one day
    }
  } else if (habit.frequency === 'weekly') {
    // Check consecutive weeks backwards from current week
    let currentDate = new Date(today);

    while (true) {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Check if there's at least one successful completion in this week
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });

      let weekHasSuccess = false;
      for (const log of weekLogs) {
        let isSuccess = false;
        if (habit.trackingType === 'variable_amount') {
          isSuccess = log.value !== undefined && habit.target_amount !== undefined &&
                     isNumericHabitCompleted(log.value, habit.target_amount);
        } else {
          isSuccess = log.completed;
        }
        if (isSuccess) {
          weekHasSuccess = true;
          break;
        }
      }

      if (!weekHasSuccess) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 7); // Go back one week
    }
  } else if (habit.frequency === 'monthly') {
    // Check consecutive months backwards from current month
    let currentDate = new Date(today);

    while (true) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Check if there's at least one successful completion in this month
      const monthLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= monthStart && logDate <= monthEnd;
      });

      let monthHasSuccess = false;
      for (const log of monthLogs) {
        let isSuccess = false;
        if (habit.trackingType === 'variable_amount') {
          isSuccess = log.value !== undefined && habit.target_amount !== undefined &&
                     isNumericHabitCompleted(log.value, habit.target_amount);
        } else {
          isSuccess = log.completed;
        }
        if (isSuccess) {
          monthHasSuccess = true;
          break;
        }
      }

      if (!monthHasSuccess) break;

      streak++;
      currentDate.setMonth(currentDate.getMonth() - 1); // Go back one month
    }
  }

  return streak;
};

// Helper: Get start of week (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
};
