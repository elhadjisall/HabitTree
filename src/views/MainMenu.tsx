import React, { useState } from 'react';
import './MainMenu.css';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface CheckboxHabit {
  id: number;
  name: string;
  type: 'checkbox';
  color: string;
  completed: boolean;
}

interface NumericHabit {
  id: number;
  name: string;
  type: 'numeric';
  target: number;
  unit: string;
  color: string;
  currentValue: number;
}

type Habit = CheckboxHabit | NumericHabit;

// Mock data for habits
const MOCK_HABITS: Habit[] = [
  { id: 1, name: 'Morning Exercise', type: 'checkbox', color: '#6ab04c', completed: false },
  { id: 2, name: 'Read 30 pages', type: 'checkbox', color: '#4a7c59', completed: false },
  { id: 3, name: 'Meditate', type: 'checkbox', color: '#00b894', completed: false },
  { id: 4, name: 'Walk 5km', type: 'numeric', target: 5, unit: 'km', color: '#fdcb6e', currentValue: 0 },
  { id: 5, name: 'Drink Water', type: 'numeric', target: 8, unit: 'glasses', color: '#74b9ff', currentValue: 0 },
];

const MainMenu: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  const getTodayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  const isToday = (dayIndex: number): boolean => {
    return dayIndex === getTodayIndex();
  };

  const handleCheckboxToggle = (id: number): void => {
    setHabits(habits.map(habit =>
      habit.id === id && isToday(selectedDay)
        ? { ...habit, completed: habit.type === 'checkbox' ? !habit.completed : false }
        : habit
    ));
  };

  const handleNumericChange = (id: number, value: string): void => {
    setHabits(habits.map(habit =>
      habit.id === id && isToday(selectedDay)
        ? { ...habit, currentValue: habit.type === 'numeric' ? Math.max(0, Number(value) || 0) : 0 }
        : habit
    ));
  };

  return (
    <div className="main-menu">
      <header className="menu-header">
        <h1>My Quests</h1>
        <div className="streak-badge">
          <span className="streak-icon">🔥</span>
          <span className="streak-count">7 day streak</span>
        </div>
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
            📖 Viewing past day - changes disabled
          </div>
        )}

        {habits.map(habit => (
          <div key={habit.id} className="habit-card" style={{ borderLeftColor: habit.color }}>
            <div className="habit-info">
              <div className="habit-color-dot" style={{ backgroundColor: habit.color }}></div>
              <h3 className="habit-name">{habit.name}</h3>
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
