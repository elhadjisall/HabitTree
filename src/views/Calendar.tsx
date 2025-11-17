import React, { useState } from 'react';
import './Calendar.css';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { getHabitLog, formatDate, isNumericHabitCompleted } from '../utils/habitLogsStore';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Calendar: React.FC = () => {
  const currentDate = new Date();
  const habits = useHabits(); // Get habits from store
  useHabitLogs(); // Reactive habit logs from shared store - triggers re-render on changes

  const [selectedHabit, setSelectedHabit] = useState<string>(habits.length > 0 ? habits[0].id : '');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Generate year options (previous, current, next year)
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = currentDate.getDate();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // Determine if month has no data (all future)
  const monthHasNoData = selectedYear > currentYear ||
                         (selectedYear === currentYear && selectedMonth > currentMonth);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday = 0

  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  // Calculate stats based on actual logs up to TODAY only
  const calculateStats = () => {
    if (monthHasNoData) {
      return { completedDays: 0, missedDays: 0, completionRate: 0 };
    }

    // Determine how many days to count:
    // - If viewing current month/year, count up to TODAY
    // - If viewing past month/year, count ALL days in that month
    let daysToCount = daysInMonth;
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      daysToCount = today; // Only count up to today
    }

    let completedDays = 0;
    let missedDays = 0;

    // Check each day up to daysToCount
    for (let day = 1; day <= daysToCount; day++) {
      const dateString = formatDate(selectedYear, selectedMonth, day);
      const log = getHabitLog(selectedHabit, dateString);

      if (log) {
        // If numeric habit, check if ≥50% completed
        if (selectedHabitData?.trackingType === 'variable_amount') {
          if (log.value !== undefined && selectedHabitData.target_amount && isNumericHabitCompleted(log.value, selectedHabitData.target_amount)) {
            completedDays++;
          } else {
            missedDays++;
          }
        } else {
          // Checkbox or quit habit
          if (log.completed) {
            completedDays++;
          } else {
            missedDays++;
          }
        }
      } else {
        // No log = missed day
        missedDays++;
      }
    }

    const completionRate = daysToCount > 0 ? Math.round((completedDays / daysToCount) * 100) : 0;

    return { completedDays, missedDays, completionRate };
  };

  const { completedDays, missedDays, completionRate } = calculateStats();

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

  // Generate calendar grid
  const calendarDays: JSX.Element[] = [];

  // Empty cells before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today &&
                    selectedMonth === currentMonth &&
                    selectedYear === currentYear;

    // Check if this day is in the future
    const dayDate = new Date(selectedYear, selectedMonth, day);
    const isFuture = dayDate > currentDate;

    // Get log for this day from shared store
    const dateString = formatDate(selectedYear, selectedMonth, day);
    const log = getHabitLog(selectedHabit, dateString);

    let isCompleted = false;
    if (log && selectedHabitData) {
      if (selectedHabitData.trackingType === 'variable_amount') {
        // Check if ≥50% of target
        isCompleted = log.value !== undefined && selectedHabitData.target_amount !== undefined && isNumericHabitCompleted(log.value, selectedHabitData.target_amount);
      } else {
        isCompleted = log.completed;
      }
    }

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
            onChange={(e) => setSelectedHabit(e.target.value)}
            className="habit-dropdown"
            style={{ borderColor: selectedHabitData?.color }}
          >
            {habits.map(habit => (
              <option key={habit.id} value={habit.id}>
                {habit.emoji} {habit.label}
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
            <span className="stat-value">{missedDays}</span>
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

        {/* Enhanced progress bar with character */}
        <div className="summary-progress-card-new">
          <div className="progress-container">
            <div className="character-progress-avatar">{getSelectedCharacter()}</div>
            <div className="progress-bar-new">
              <div
                className="progress-fill-new"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
          <p className="progress-text-new">
            {completedDays} / {monthHasNoData ? 0 : (selectedYear === currentYear && selectedMonth === currentMonth ? today : daysInMonth)} days completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
