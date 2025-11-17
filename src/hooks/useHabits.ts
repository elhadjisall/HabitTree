import { useState, useEffect } from 'react';
import { getHabits, type Habit } from '../utils/habitsStore';

// Custom hook for reactive habits
export const useHabits = (): Habit[] => {
  const [habits, setHabits] = useState<Habit[]>(getHabits());

  useEffect(() => {
    const handleChange = () => {
      setHabits(getHabits());
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
