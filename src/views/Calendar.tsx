import React, { useState } from 'react';
import './Calendar.css';

interface Habit {
  id: number;
  name: string;
  color: string;
}

// Mock habits
const MOCK_HABITS: Habit[] = [
  { id: 1, name: 'Morning Exercise', color: '#6ab04c' },
  { id: 2, name: 'Read 30 pages', color: '#4a7c59' },
  { id: 3, name: 'Meditate', color: '#00b894' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate mock calendar data
const generateMockCalendarData = (year: number, month: number): Record<number, boolean> => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: Record<number, boolean> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    // Randomly mark ~60% of days as completed
    data[day] = Math.random() > 0.4;
  }

  return data;
};

const Calendar: React.FC = () => {
  const currentDate = new Date();
  const [selectedHabit, setSelectedHabit] = useState<number>(MOCK_HABITS[0].id);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear] = useState<number>(currentDate.getFullYear());

  const calendarData = generateMockCalendarData(selectedYear, selectedMonth);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday = 0

  const selectedHabitData = MOCK_HABITS.find(h => h.id === selectedHabit);

  const completedDays = Object.values(calendarData).filter(Boolean).length;
  const completionRate = Math.round((completedDays / daysInMonth) * 100);

  // Generate calendar grid
  const calendarDays: JSX.Element[] = [];

  // Empty cells before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const isCompleted = calendarData[day];
    const isToday = day === currentDate.getDate() && selectedMonth === currentDate.getMonth();

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${isCompleted ? 'completed' : 'missed'} ${isToday ? 'today' : ''}`}
        aria-label={`Day ${day}, ${isCompleted ? 'completed' : 'missed'}`}
      >
        <span className="day-number">{day}</span>
        <span className="day-status">{isCompleted ? '✓' : '✗'}</span>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <h1>Progress Calendar</h1>
      </header>

      {/* Dropdowns */}
      <div className="calendar-controls">
        <div className="dropdown-group">
          <label htmlFor="habit-select">Habit:</label>
          <select
            id="habit-select"
            value={selectedHabit}
            onChange={(e) => setSelectedHabit(Number(e.target.value))}
            className="habit-dropdown"
            style={{ borderColor: selectedHabitData?.color }}
          >
            {MOCK_HABITS.map(habit => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-group">
          <label htmlFor="month-select">Month:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="month-dropdown"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="weekday-headers">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {calendarDays}
      </div>

      {/* Summary */}
      <div className="calendar-summary">
        <div className="summary-card">
          <div className="summary-stat">
            <span className="stat-value">{completedDays}</span>
            <span className="stat-label">Days Completed</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-stat">
            <span className="stat-value">{daysInMonth - completedDays}</span>
            <span className="stat-label">Days Missed</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-stat">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>

        <p className="summary-text">
          {completedDays} / {daysInMonth} days completed this month
        </p>
      </div>
    </div>
  );
};

export default Calendar;
