import React, { useState } from 'react';
import './Calendar.css';

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

// Same habits as MainMenu
const MOCK_HABITS: Habit[] = [
  { id: 1, name: 'Morning Exercise', type: 'checkbox', color: '#6ab04c', completed: false, streak: 5 },
  { id: 2, name: 'Read 30 pages', type: 'checkbox', color: '#4a7c59', completed: false, streak: 3 },
  { id: 3, name: 'Meditate', type: 'checkbox', color: '#00b894', completed: false, streak: 7 },
  { id: 4, name: 'Walk 5km', type: 'numeric', target: 5, unit: 'km', color: '#fdcb6e', currentValue: 0, streak: 2 },
  { id: 5, name: 'Drink Water', type: 'numeric', target: 8, unit: 'glasses', color: '#74b9ff', currentValue: 0, streak: 10 },
  { id: 6, name: 'Quit Smoking', type: 'checkbox', color: '#d63031', completed: false, streak: 14 },
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
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Generate year options (previous, current, next year)
  const currentYear = currentDate.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

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
    const isToday = day === currentDate.getDate() &&
                    selectedMonth === currentDate.getMonth() &&
                    selectedYear === currentDate.getFullYear();

    // Check if this day is in the future
    const dayDate = new Date(selectedYear, selectedMonth, day);
    const isFuture = dayDate > currentDate;

    // Determine if month has no data (all future or no habit started)
    const monthHasNoData = selectedYear > currentYear ||
                           (selectedYear === currentYear && selectedMonth > currentDate.getMonth());

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${
          isFuture || monthHasNoData ? 'disabled' :
          isToday && !isCompleted ? 'today-pending' :
          isCompleted ? 'completed' : 'missed'
        } ${isToday ? 'today' : ''}`}
        aria-label={`Day ${day}, ${isFuture ? 'future' : isCompleted ? 'completed' : 'missed'}`}
      >
        <span className="day-number">{day}</span>
        {!isFuture && !monthHasNoData && (
          <span className="day-status">
            {isToday && !isCompleted ? '' : isCompleted ? '✓' : '✗'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <h1 className="calendar-title">Progress Calendar</h1>
      </header>

      {/* Dropdowns */}
      <div className="calendar-controls">
        <div className="dropdown-group">
          <label htmlFor="habit-select">Quest:</label>
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

        <div className="dropdown-group">
          <label htmlFor="year-select">Year:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="year-dropdown"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year}
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
        <div className="summary-stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <span className="stat-value">{completedDays}</span>
            <span className="stat-label">Days Completed</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{daysInMonth - completedDays}</span>
            <span className="stat-label">Days Missed</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>

        <div className="summary-progress-card">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
          </div>
          <p className="progress-text">
            {completedDays} / {daysInMonth} days completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
