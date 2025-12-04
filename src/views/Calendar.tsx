import React, { useState } from 'react';
import './Calendar.css';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { getHabitLog, formatDate, updateHabitLog } from '../utils/habitLogsStore';
import { getLeafDollars, subtractLeafDollars } from '../utils/leafDollarsStorage';
import ConfirmModal from '../components/ConfirmModal';

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

  // Revival modal states
  const [reviveModal, setReviveModal] = useState<{ isOpen: boolean; day: number | null; dateString: string | null }>({ isOpen: false, day: null, dateString: null });
  const [notEnoughLeafModal, setNotEnoughLeafModal] = useState<boolean>(false);
  const [reviveSuccessModal, setReviveSuccessModal] = useState<boolean>(false);

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
      const dayDate = new Date(selectedYear, selectedMonth, day);
      dayDate.setHours(0, 0, 0, 0);

      // Check if this day is before habit was created
      let isBeforeHabitStart = false;
      if (selectedHabitData) {
        const habitStartDate = new Date(selectedHabitData.createdAt);
        habitStartDate.setHours(0, 0, 0, 0);
        isBeforeHabitStart = dayDate < habitStartDate;
      }

      // Skip days before habit creation
      if (isBeforeHabitStart) {
        continue;
      }

      const dateString = formatDate(selectedYear, selectedMonth, day);
      const log = getHabitLog(selectedHabit, dateString);

      if (log) {
        // If numeric habit, check if 100% completed
        if (selectedHabitData?.trackingType === 'variable_amount') {
          if (log.value !== undefined && selectedHabitData.target_amount && log.value >= selectedHabitData.target_amount) {
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

    const totalTrackedDays = completedDays + missedDays;
    const completionRate = totalTrackedDays > 0 ? Math.round((completedDays / totalTrackedDays) * 100) : 0;

    return { completedDays, missedDays, completionRate };
  };

  const { completedDays, missedDays, completionRate } = calculateStats();

  // Get selected character from localStorage
  const getSelectedCharacter = (): string => {
    const storedCharacterId = localStorage.getItem('selectedCharacter');
    const characterId = storedCharacterId ? parseInt(storedCharacterId) : 1;

    const characters = [
      { id: 1, emoji: '' },
      { id: 2, emoji: '' },
      { id: 3, emoji: '' },
      { id: 4, emoji: '' },
      { id: 5, emoji: '' },
      { id: 6, emoji: '' },
    ];

    const character = characters.find(c => c.id === characterId);
    return character ? character.emoji : '';
  };

  // Handle clicking on a missed day
  const handleDayClick = (day: number, isMissed: boolean, isCompleted: boolean, isFuture: boolean, isBeforeHabitStart: boolean, dateString: string): void => {
    // Only allow revival for missed days (not completed, not future, not before habit start)
    if (!isMissed || isCompleted || isFuture || isBeforeHabitStart || monthHasNoData) {
      return;
    }

    const log = getHabitLog(selectedHabit, dateString);
    // Don't show revival if already revived
    if (log?.wasRevived) {
      return;
    }

    setReviveModal({ isOpen: true, day, dateString });
  };

  // Confirm revival
  const confirmRevival = (): void => {
    if (!reviveModal.day || !reviveModal.dateString || !selectedHabitData) {
      return;
    }

    const leafDollars = getLeafDollars();
    if (leafDollars < 10) {
      setNotEnoughLeafModal(true);
      setReviveModal({ isOpen: false, day: null, dateString: null });
      return;
    }

    // Deduct 10 leaf dollars
    subtractLeafDollars(10);

    // Mark the day as completed with wasRevived flag
    if (selectedHabitData.trackingType === 'variable_amount' && selectedHabitData.target_amount) {
      updateHabitLog(selectedHabit, reviveModal.dateString, true, selectedHabitData.target_amount, true);
    } else {
      updateHabitLog(selectedHabit, reviveModal.dateString, true, undefined, true);
    }

    setReviveModal({ isOpen: false, day: null, dateString: null });
    setReviveSuccessModal(true);
  };

  // Generate calendar grid
  const calendarDays: React.ReactElement[] = [];

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
    dayDate.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999); // End of today for future comparison
    const isFuture = dayDate > todayDate;

    // Check if this day is before habit was created
    let isBeforeHabitStart = true; // Default to true (no habit selected = all days are "before")
    if (selectedHabitData && selectedHabitData.createdAt) {
      const habitStartDate = new Date(selectedHabitData.createdAt);
      habitStartDate.setHours(0, 0, 0, 0); // Reset to start of day
      isBeforeHabitStart = dayDate < habitStartDate;
    }

    // Get log for this day from shared store
    const dateString = formatDate(selectedYear, selectedMonth, day);
    const log = getHabitLog(selectedHabit, dateString);

    let isCompleted = false;
    if (log && selectedHabitData) {
      if (selectedHabitData.trackingType === 'variable_amount') {
        // Check if 100% of target
        isCompleted = log.value !== undefined && selectedHabitData.target_amount !== undefined && log.value >= selectedHabitData.target_amount;
      } else {
        isCompleted = log.completed;
      }
    }

    // Only mark as missed if: not completed, not future, has data, AND not before habit start
    const isMissed = !isCompleted && !isFuture && !monthHasNoData && !isBeforeHabitStart && !isToday;
    const canRevive = isMissed && !log?.wasRevived;

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${
          isFuture || monthHasNoData || isBeforeHabitStart ? 'disabled' :
          isToday && !isCompleted ? 'today-pending' :
          isCompleted ? 'completed' : 'missed'
        } ${isToday ? 'today' : ''} ${canRevive ? 'revivable' : ''}`}
        aria-label={`Day ${day}, ${isFuture || isBeforeHabitStart ? 'not tracked' : isCompleted ? 'completed' : 'missed'}`}
        onClick={() => handleDayClick(day, isMissed, isCompleted, isFuture, isBeforeHabitStart, dateString)}
        style={{ cursor: canRevive ? 'pointer' : 'default' }}
      >
        <span className="day-number">{day}</span>
        {!isFuture && !monthHasNoData && !isBeforeHabitStart && (
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

      {/* Revive Day Confirmation Modal */}
      <ConfirmModal
        isOpen={reviveModal.isOpen}
        onClose={() => setReviveModal({ isOpen: false, day: null, dateString: null })}
        onConfirm={confirmRevival}
        title="Revive This Day?"
        message="Revive this missed day for 10 Leaf Dollars? 🍃"
        confirmText="Revive (10🍃)"
        cancelText="Cancel"
        icon="💚"
        type="success"
      />

      {/* Not Enough Leaf Dollars Modal */}
      <ConfirmModal
        isOpen={notEnoughLeafModal}
        onClose={() => setNotEnoughLeafModal(false)}
        onConfirm={() => setNotEnoughLeafModal(false)}
        title="Not Enough Leaf Dollars"
        message="You need 10 🍃 to revive a day. Keep completing your quests!"
        confirmText="OK"
        cancelText=""
        icon="🍃"
        type="warning"
      />

      {/* Revival Success Modal */}
      <ConfirmModal
        isOpen={reviveSuccessModal}
        onClose={() => setReviveSuccessModal(false)}
        onConfirm={() => setReviveSuccessModal(false)}
        title="Day Revived!"
        message="Your day has been restored. Keep up the great work!"
        confirmText="Awesome!"
        cancelText=""
        icon="✨"
        type="success"
      />
    </div>
  );
};

export default Calendar;
