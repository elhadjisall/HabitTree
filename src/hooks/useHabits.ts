import { useState, useEffect } from 'react';
import { getHabits, getHabitsSync, type Habit } from '../utils/habitsStore';
import { isAuthenticated } from '../services/auth';

// Custom hook for reactive habits
export const useHabits = (): Habit[] => {
  const [habits, setHabits] = useState<Habit[]>(getHabitsSync());

  useEffect(() => {
    // Fetch habits from backend if authenticated
    if (isAuthenticated()) {
      getHabits().then(setHabits).catch(console.error);
    }

    const handleChange = () => {
      setHabits(getHabitsSync());
    };

    // Listen for habit changes
    window.addEventListener('habitsChanged', handleChange);

    // Also listen for storage events (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'habits') {
        handleChange();
      }
    });

    return () => {
      window.removeEventListener('habitsChanged', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return habits;
};
