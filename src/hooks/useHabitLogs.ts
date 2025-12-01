import { useState, useEffect } from 'react';
import { getHabitLogs, type HabitLog } from '../utils/habitLogsStore';

// Custom hook for reactive habit logs
export const useHabitLogs = (): HabitLog[] => {
  const [logs, setLogs] = useState<HabitLog[]>(getHabitLogs());

  useEffect(() => {
    const handleChange = () => {
      setLogs(getHabitLogs());
    };

    // Listen for habit log changes
    window.addEventListener('habitLogsChanged', handleChange);

    // Also listen for storage events (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'habitLogs') {
        handleChange();
      }
    });

    return () => {
      window.removeEventListener('habitLogsChanged', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return logs;
};
