import React, { useState, useEffect } from 'react';
import './MainMenu.css';
import { getLeafDollars, addLeafDollars, subtractLeafDollars } from '../utils/leafDollarsStorage';
import { updateHabitLog, getTodayDateString, formatDate, isNumericHabitCompleted, getHabitLog } from '../utils/habitLogsStore';
import { useHabits } from '../hooks/useHabits';
import { calculateStreak } from '../utils/streakCalculation';
import type { Habit } from '../utils/habitsStore';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MOTIVATIONAL_MESSAGES = [
  "You've got this! 💪",
  "Keep up the great work!",
  "One step at a time! 🌟",
  "I believe in you!",
  "Progress over perfection!",
  "You're doing amazing! ✨",
  "Stay consistent! 🔥",
  "Every day counts!"
];

interface HabitUIState {
  id: string;
  completed: boolean;
  currentValue: number;
}

const MainMenu: React.FC = () => {
  const getTodayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  const habits = useHabits(); // Get habits from store
  const [habitStates, setHabitStates] = useState<Record<string, HabitUIState>>({});
  const [selectedDay, setSelectedDay] = useState<number>(getTodayIndex());
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [completedHabitId, setCompletedHabitId] = useState<string | null>(null);
  const [leafDollars, setLeafDollarsState] = useState<number>(getLeafDollars());

  // Get selected character from localStorage
  const getSelectedCharacter = (): string => {
    const storedCharacterId = localStorage.getItem('selectedCharacter');
    const characterId = storedCharacterId ? parseInt(storedCharacterId) : 1;

    const characters = [
      { id: 1, emoji: '🦊' },
      { id: 2, emoji: '🦉' },
      { id: 3, emoji: '🐰' },
      { id: 4, emoji: '🦌' },
      { id: 5, emoji: '🐢' },
      { id: 6, emoji: '🐉' },
    ];

    const character = characters.find(c => c.id === characterId);
    return character ? character.emoji : '🦊';
  };

  // Load habit states from logs for selected day
  useEffect(() => {
    const today = new Date();
    const dayOffset = selectedDay - getTodayIndex();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const dateString = formatDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const newStates: Record<string, HabitUIState> = {};
    habits.forEach(habit => {
      const log = getHabitLog(habit.id, dateString);
      newStates[habit.id] = {
        id: habit.id,
        completed: log?.completed || false,
        currentValue: log?.value || 0
      };
    });
    setHabitStates(newStates);
  }, [selectedDay, habits]);

  // Show motivational speech bubble every 5 seconds when viewing today
  useEffect(() => {
    if (!isToday(selectedDay)) {
      setShowSpeechBubble(false);
      return;
    }

    const showMessage = () => {
      const randomMessage = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      setCurrentMessage(randomMessage);
      setShowSpeechBubble(true);

      setTimeout(() => {
        setShowSpeechBubble(false);
      }, 3000);
    };

    const interval = setInterval(showMessage, 5000);
    showMessage(); // Show immediately on mount

    return () => clearInterval(interval);
  }, [selectedDay]);

  const isToday = (dayIndex: number): boolean => {
    return dayIndex === getTodayIndex();
  };

  const handleCheckboxToggle = (habit: Habit): void => {
    if (!isToday(selectedDay) || (habit.trackingType !== 'tick_cross' && habit.trackingType !== 'quit')) return;

    const currentState = habitStates[habit.id];
    const newCompleted = !currentState.completed;

    // Save to shared habit logs store
    const dateString = getTodayDateString();
    updateHabitLog(habit.id, dateString, newCompleted);

    // Update local UI state
    setHabitStates(prev => ({
      ...prev,
      [habit.id]: { ...prev[habit.id], completed: newCompleted }
    }));

    if (newCompleted) {
      setCompletedHabitId(habit.id);
      setTimeout(() => setCompletedHabitId(null), 600);
      // Award +1 leaf dollar
      const newBalance = addLeafDollars(1);
      setLeafDollarsState(newBalance);
    }
  };

  const handleNumericChange = (habit: Habit, value: string): void => {
    if (!isToday(selectedDay) || habit.trackingType !== 'variable_amount') return;

    const newValue = Math.max(0, Number(value) || 0);
    const previousValue = habitStates[habit.id]?.currentValue || 0;
    const wasCompleted = habit.target_amount !== undefined && isNumericHabitCompleted(previousValue, habit.target_amount);
    const isNowCompleted = habit.target_amount !== undefined && isNumericHabitCompleted(newValue, habit.target_amount);

    // Save to shared habit logs store
    const dateString = getTodayDateString();
    updateHabitLog(habit.id, dateString, isNowCompleted, newValue);

    // Update local UI state
    setHabitStates(prev => ({
      ...prev,
      [habit.id]: { ...prev[habit.id], currentValue: newValue }
    }));

    if (!wasCompleted && isNowCompleted) {
      setCompletedHabitId(habit.id);
      setTimeout(() => setCompletedHabitId(null), 600);
      // Award +1 leaf dollar
      const newBalance = addLeafDollars(1);
      setLeafDollarsState(newBalance);
    }
  };

  const handleReviveStreak = (habit: Habit): void => {
    if (leafDollars < 10) {
      alert('Not enough Leaf Dollars! You need 10 🍃 to revive a streak.');
      return;
    }

    if (window.confirm('Revive this missed day for 10 Leaf Dollars? 🍃')) {
      const newBalance = subtractLeafDollars(10);
      setLeafDollarsState(newBalance);

      // Calculate the date for the selected past day
      const today = new Date();
      const dayOffset = selectedDay - getTodayIndex();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateString = formatDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

      // Save completion to logs
      if (habit.trackingType === 'variable_amount' && habit.target_amount) {
        updateHabitLog(habit.id, dateString, true, habit.target_amount);
        setHabitStates(prev => ({
          ...prev,
          [habit.id]: { ...prev[habit.id], currentValue: habit.target_amount!, completed: true }
        }));
      } else {
        updateHabitLog(habit.id, dateString, true);
        setHabitStates(prev => ({
          ...prev,
          [habit.id]: { ...prev[habit.id], completed: true }
        }));
      }

      setCompletedHabitId(habit.id);
      setTimeout(() => setCompletedHabitId(null), 600);
    }
  };

  return (
    <div className="main-menu">
      <header className="menu-header">
        <div className="header-left">
          <h1 className="quests-title">My Quests</h1>
          <div className="leaf-dollars-bubble">
            <span className="leaf-icon">🍃</span>
            <span className="leaf-amount">{leafDollars}</span>
          </div>
        </div>
        {isToday(selectedDay) && (
          <div className="avatar-container">
            {showSpeechBubble && (
              <div className="speech-bubble">{currentMessage}</div>
            )}
            <div className="character-avatar">{getSelectedCharacter()}</div>
          </div>
        )}
      </header>

      {/* Weekday selector */}
      <div className="weekday-bar" role="tablist" aria-label="Day selector">
        {WEEKDAYS.map((day, index) => (
          <button
            key={day}
            role="tab"
            aria-selected={index === selectedDay}
            aria-label={`${day}, ${isToday(index) ? 'today' : 'view only'}`}
            className={`weekday-item ${index === selectedDay ? 'active' : ''} ${isToday(index) ? 'today' : ''}`}
            onClick={() => setSelectedDay(index)}
          >
            <span className="weekday-label">{day}</span>
            <span className="weekday-indicator"></span>
          </button>
        ))}
      </div>

      {/* Habits list */}
      <div className="habits-list">
        {!isToday(selectedDay) && (
          <div className="view-only-notice">
            {selectedDay < getTodayIndex() ? '📖 Viewing past day — changes disabled' : '📖 Viewing a future day — changes disabled'}
          </div>
        )}

        {habits.map(habit => {
          const state = habitStates[habit.id] || { completed: false, currentValue: 0 };
          const streak = calculateStreak(habit); // Calculate streak from logs

          return (
            <div
              key={habit.id}
              className={`habit-card ${completedHabitId === habit.id ? 'completed-animation' : ''}`}
              style={{ borderLeftColor: habit.color }}
            >
              <div className="habit-info">
                <div className="habit-color-dot" style={{ backgroundColor: habit.color }}></div>
                <div className="habit-details">
                  <h3 className="habit-name">
                    {habit.emoji} {habit.label}
                  </h3>
                </div>
              </div>

              <div className="habit-streak">
                <span className="streak-icon">🔥</span>
                <span className="streak-number">{streak}</span>
              </div>

              {habit.trackingType === 'tick_cross' || habit.trackingType === 'quit' ? (
                <label className="habit-checkbox">
                  <input
                    type="checkbox"
                    checked={state.completed}
                    onChange={() => handleCheckboxToggle(habit)}
                    disabled={!isToday(selectedDay)}
                    aria-label={`Mark ${habit.label} as ${state.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className="checkbox-custom"></span>
                </label>
              ) : (
                <div className="habit-numeric">
                  <input
                    type="number"
                    min="0"
                    max={habit.target_amount}
                    value={state.currentValue}
                    onChange={(e) => handleNumericChange(habit, e.target.value)}
                    disabled={!isToday(selectedDay)}
                    aria-label={`${habit.label} progress`}
                  />
                  <span className="numeric-target">/ {habit.target_amount} {habit.unit}</span>
                </div>
              )}

              {/* Revive streak button for past days */}
              {!isToday(selectedDay) && selectedDay < getTodayIndex() && (
                <button
                  className="revive-btn"
                  onClick={() => handleReviveStreak(habit)}
                  title="Revive streak for 10 Leaf Dollars"
                >
                  💚 10🍃
                </button>
              )}
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h3>No quests yet</h3>
            <p>Tap the + button below to create your first quest!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
