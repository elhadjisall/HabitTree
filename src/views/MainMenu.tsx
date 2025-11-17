import React, { useState, useEffect } from 'react';
import './MainMenu.css';
import { getLeafDollars, addLeafDollars, subtractLeafDollars } from '../utils/leafDollarsStorage';
import { updateHabitLog, getTodayDateString, formatDate, isNumericHabitCompleted, getHabitLog } from '../utils/habitLogsStore';

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

interface CheckboxHabit {
  id: number;
  name: string;
  type: 'checkbox';
  color: string;
  completed: boolean;
  streak: number;
}

interface NumericHabit {
  id: number;
  name: string;
  type: 'numeric';
  target: number;
  unit: string;
  color: string;
  currentValue: number;
  streak: number;
}

type Habit = CheckboxHabit | NumericHabit;

// Mock data for habits
const MOCK_HABITS: Habit[] = [
  { id: 1, name: 'Morning Exercise', type: 'checkbox', color: '#6ab04c', completed: false, streak: 5 },
  { id: 2, name: 'Read 30 pages', type: 'checkbox', color: '#4a7c59', completed: false, streak: 3 },
  { id: 3, name: 'Meditate', type: 'checkbox', color: '#00b894', completed: false, streak: 7 },
  { id: 4, name: 'Walk 5km', type: 'numeric', target: 5, unit: 'km', color: '#fdcb6e', currentValue: 0, streak: 2 },
  { id: 5, name: 'Drink Water', type: 'numeric', target: 8, unit: 'glasses', color: '#74b9ff', currentValue: 0, streak: 10 },
  { id: 6, name: 'Quit Smoking', type: 'checkbox', color: '#d63031', completed: false, streak: 14 },
];

const MainMenu: React.FC = () => {
  const getTodayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);
  const [selectedDay, setSelectedDay] = useState<number>(getTodayIndex());
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [completedHabitId, setCompletedHabitId] = useState<number | null>(null);
  const [leafDollars, setLeafDollarsState] = useState<number>(getLeafDollars());

  // Get selected character from localStorage (same as TreeCharacter component)
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

  // Load initial habit completion state from shared store
  useEffect(() => {
    const today = new Date();
    const dayOffset = selectedDay - getTodayIndex();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const dateString = formatDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    setHabits(MOCK_HABITS.map(habit => {
      const log = getHabitLog(habit.id, dateString);
      if (log) {
        if (habit.type === 'checkbox') {
          return { ...habit, completed: log.completed };
        } else {
          return { ...habit, currentValue: log.value || 0 };
        }
      }
      return habit;
    }));
  }, [selectedDay]);

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

  const handleCheckboxToggle = (id: number): void => {
    setHabits(habits.map(habit => {
      if (habit.id === id && isToday(selectedDay) && habit.type === 'checkbox') {
        const newCompleted = !habit.completed;

        // Save to shared habit logs store
        const dateString = getTodayDateString();
        updateHabitLog(id, dateString, newCompleted);

        if (newCompleted) {
          setCompletedHabitId(id);
          setTimeout(() => setCompletedHabitId(null), 600);
          // Award +1 leaf dollar for completing the habit
          const newBalance = addLeafDollars(1);
          setLeafDollarsState(newBalance);
        }
        return {
          ...habit,
          completed: newCompleted,
          streak: newCompleted ? habit.streak + 1 : habit.streak
        };
      }
      return habit;
    }));
  };

  const handleNumericChange = (id: number, value: string): void => {
    setHabits(habits.map(habit => {
      if (habit.id === id && isToday(selectedDay) && habit.type === 'numeric') {
        const newValue = Math.max(0, Number(value) || 0);
        const previousValue = habit.currentValue;
        const wasCompleted = isNumericHabitCompleted(previousValue, habit.target);
        const isNowCompleted = isNumericHabitCompleted(newValue, habit.target);

        // Save to shared habit logs store
        const dateString = getTodayDateString();
        updateHabitLog(id, dateString, isNowCompleted, newValue);

        if (!wasCompleted && isNowCompleted) {
          setCompletedHabitId(id);
          setTimeout(() => setCompletedHabitId(null), 600);
          // Award +1 leaf dollar for completing the habit (≥50%)
          const newBalance = addLeafDollars(1);
          setLeafDollarsState(newBalance);
        }
        return {
          ...habit,
          currentValue: newValue,
          streak: !wasCompleted && isNowCompleted ? habit.streak + 1 : habit.streak
        };
      }
      return habit;
    }));
  };

  const handleReviveStreak = (id: number): void => {
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

      setHabits(habits.map(habit => {
        if (habit.id === id) {
          if (habit.type === 'checkbox') {
            // Save to shared habit logs store
            updateHabitLog(id, dateString, true);

            return {
              ...habit,
              completed: true,
              streak: habit.streak + 1
            };
          } else {
            // Save to shared habit logs store
            updateHabitLog(id, dateString, true, habit.target);

            return {
              ...habit,
              currentValue: habit.target,
              streak: habit.streak + 1
            };
          }
        }
        return habit;
      }));

      setCompletedHabitId(id);
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

        {habits.map(habit => (
          <div
            key={habit.id}
            className={`habit-card ${completedHabitId === habit.id ? 'completed-animation' : ''}`}
            style={{ borderLeftColor: habit.color }}
          >
            <div className="habit-info">
              <div className="habit-color-dot" style={{ backgroundColor: habit.color }}></div>
              <h3 className="habit-name">{habit.name}</h3>
            </div>

            <div className="habit-streak">
              <span className="streak-icon">🔥</span>
              <span className="streak-number">{habit.streak}</span>
            </div>

            {habit.type === 'checkbox' ? (
              <label className="habit-checkbox">
                <input
                  type="checkbox"
                  checked={habit.completed}
                  onChange={() => handleCheckboxToggle(habit.id)}
                  disabled={!isToday(selectedDay)}
                  aria-label={`Mark ${habit.name} as ${habit.completed ? 'incomplete' : 'complete'}`}
                />
                <span className="checkbox-custom"></span>
              </label>
            ) : (
              <div className="habit-numeric">
                <input
                  type="number"
                  min="0"
                  max={habit.target}
                  value={habit.currentValue}
                  onChange={(e) => handleNumericChange(habit.id, e.target.value)}
                  disabled={!isToday(selectedDay)}
                  aria-label={`${habit.name} progress`}
                />
                <span className="numeric-target">/ {habit.target} {habit.unit}</span>
              </div>
            )}

            {/* Revive streak button for past days */}
            {!isToday(selectedDay) && selectedDay < getTodayIndex() && (
              <button
                className="revive-btn"
                onClick={() => handleReviveStreak(habit.id)}
                title="Revive streak for 10 Leaf Dollars"
              >
                💚 10🍃
              </button>
            )}
          </div>
        ))}

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
