import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainMenu.css';
import { getLeafDollars, addLeafDollars, subtractLeafDollars } from '../utils/leafDollarsStorage';
import { updateHabitLog, getTodayDateString, formatDate, getHabitLog, getHabitLogs, setHabitLogs } from '../utils/habitLogsStore';
import { useHabits } from '../hooks/useHabits';
import { calculateStreak } from '../utils/streakCalculation';
import { deleteHabit, updateHabit, completeHabit, getHabits, type Habit } from '../utils/habitsStore';
import { hasShownCompletionPopup, markQuestCompletionShown } from '../utils/completedQuestsStorage';
import { getSelectedCharacter, getRandomDialogue, initializeFirstCharacter } from '../utils/charactersStorage';
import { api } from '../services/api';
// import { getCurrentUser } from '../services/auth'; // Unused for now
import ConfirmModal from '../components/ConfirmModal';
import QuestCompletionCongrats from '../components/QuestCompletionCongrats';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface HabitUIState {
  id: string;
  completed: boolean;
  currentValue: number;
}

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const getTodayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  // Get the date for a given weekday index
  const getDateForWeekday = (index: number): number => {
    const today = new Date();
    const dayOffset = index - getTodayIndex();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    return targetDate.getDate();
  };

  const habits = useHabits(); // Get habits from store
  const [habitStates, setHabitStates] = useState<Record<string, HabitUIState>>({});
  const [selectedDay, setSelectedDay] = useState<number>(getTodayIndex());
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [completedHabitId, setCompletedHabitId] = useState<string | null>(null);
  const [leafDollars, setLeafDollarsState] = useState<number>(getLeafDollars());
  const [showHabitDetails, setShowHabitDetails] = useState<boolean>(false);
  const [selectedHabitForDetails, setSelectedHabitForDetails] = useState<Habit | null>(null);
  const longPressTimer = useRef<number | null>(null);

  // Confirmation modals
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; habitId: string | null }>({ isOpen: false, habitId: null });
  const [reviveConfirmModal, setReviveConfirmModal] = useState<{ isOpen: boolean; habit: Habit | null }>({ isOpen: false, habit: null });
  const [notEnoughLeafModal, setNotEnoughLeafModal] = useState<boolean>(false);
  const [reviveSuccessModal, setReviveSuccessModal] = useState<boolean>(false);
  const [privacyChangeModal, setPrivacyChangeModal] = useState<{ isOpen: boolean; habit: Habit | null }>({ isOpen: false, habit: null });

  // Quest completion popup states
  const [completionQueue, setCompletionQueue] = useState<string[]>([]);
  const [showCompletionPopup, setShowCompletionPopup] = useState<boolean>(false);
  const [currentCompletion, setCurrentCompletion] = useState<{
    questName: string;
    questEmoji: string;
    questColor: string;
    daysCompleted: number;
    daysMissed: number;
    highestStreak: number;
  } | null>(null);
  const [questToRemove, setQuestToRemove] = useState<string | null>(null);

  // Initialize first character on mount
  useEffect(() => {
    initializeFirstCharacter();
  }, []);

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
      const randomMessage = getRandomDialogue();
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

  // Check for completed quests on component mount and when habits change
  useEffect(() => {
    const completedQuestIds: string[] = [];

    habits.forEach(habit => {
      const daysLeft = getDaysLeft(habit);

      // Check if quest duration is over and hasn't shown popup yet
      if (daysLeft === 0 && !hasShownCompletionPopup(habit.id)) {
        completedQuestIds.push(habit.id);
      }
    });

    if (completedQuestIds.length > 0) {
      setCompletionQueue(completedQuestIds);
    }
  }, [habits]);

  // Process completion queue - show one popup at a time
  useEffect(() => {
    if (completionQueue.length > 0 && !showCompletionPopup) {
      const nextQuestId = completionQueue[0];
      completeHabit(nextQuestId).then(result => {
        if (result) {
          setCurrentCompletion({
            questName: result.habit.label,
            questEmoji: result.habit.emoji,
            questColor: result.habit.color,
            daysCompleted: result.stats.daysCompleted,
            daysMissed: result.stats.daysMissed,
            highestStreak: result.stats.highestStreak
          });
          setShowCompletionPopup(true);
          setQuestToRemove(nextQuestId);
          markQuestCompletionShown(nextQuestId);
        }

        // Remove from queue
        setCompletionQueue(prev => prev.slice(1));
      }).catch(error => {
        console.error('Failed to complete habit:', error);
        // Remove from queue even on error
        setCompletionQueue(prev => prev.slice(1));
      });
    }
  }, [completionQueue, showCompletionPopup]);

  const isToday = (dayIndex: number): boolean => {
    return dayIndex === getTodayIndex();
  };

  // Calculate days left for a habit
  const getDaysLeft = (habit: Habit): number => {
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, habit.duration_days - daysPassed);
  };

  const handleCheckboxToggle = async (habit: Habit): Promise<void> => {
    if (!isToday(selectedDay) || (habit.trackingType !== 'tick_cross' && habit.trackingType !== 'quit')) return;

    const currentState = habitStates[habit.id];

    // Prevent unchecking if already completed (anti-exploit)
    if (currentState.completed) return;

    const newCompleted = !currentState.completed;

    try {
      if (newCompleted) {
        // Mark as complete via backend API
        const response = await api.post<{total_leaf_dollars?: number; leaf_dollars_earned?: number}>(`/habits/${habit.id}/complete/`, {});
        
        // Update leaf dollars from backend response
        if (response.total_leaf_dollars !== undefined) {
          setLeafDollarsState(response.total_leaf_dollars);
          // Also update localStorage for consistency
          localStorage.setItem('leafDollars', String(response.total_leaf_dollars));
        } else if (response.leaf_dollars_earned) {
          const newBalance = addLeafDollars(response.leaf_dollars_earned);
          setLeafDollarsState(newBalance);
        }

        // Update local cache
        const dateString = getTodayDateString();
        updateHabitLog(habit.id, dateString, true);
        
        // Refresh habits to get updated streak
        await getHabits();
        window.dispatchEvent(new Event('habitsChanged'));
      } else {
        // Mark as incomplete via backend API
        await api.post(`/habits/${habit.id}/incomplete/`, {});
        
        // Update local cache
        const dateString = getTodayDateString();
        updateHabitLog(habit.id, dateString, false);
      }

      // Update local UI state
      setHabitStates(prev => ({
        ...prev,
        [habit.id]: { ...prev[habit.id], completed: newCompleted }
      }));

      if (newCompleted) {
        setCompletedHabitId(habit.id);
        setTimeout(() => setCompletedHabitId(null), 600);
      }
    } catch (error) {
      console.error('Failed to update habit completion:', error);
      // Fallback to local update on error
      const dateString = getTodayDateString();
      updateHabitLog(habit.id, dateString, newCompleted);
      setHabitStates(prev => ({
        ...prev,
        [habit.id]: { ...prev[habit.id], completed: newCompleted }
      }));
    }
  };

  const handleNumericChange = async (habit: Habit, value: string): Promise<void> => {
    if (!isToday(selectedDay) || habit.trackingType !== 'variable_amount') return;

    const previousValue = habitStates[habit.id]?.currentValue || 0;
    const wasCompleted = habit.target_amount !== undefined && previousValue >= habit.target_amount;

    // Prevent changes if already completed (anti-exploit)
    if (wasCompleted) return;

    const newValue = Math.max(0, Number(value) || 0);
    const isNowCompleted = habit.target_amount !== undefined && newValue >= habit.target_amount;

    try {
      if (isNowCompleted && !wasCompleted) {
        // Mark as complete via backend API when target is reached
        const response = await api.post<{total_leaf_dollars?: number; leaf_dollars_earned?: number}>(`/habits/${habit.id}/complete/`, {
          amount_done: newValue
        });
        
        // Update leaf dollars from backend response
        if (response.total_leaf_dollars !== undefined) {
          setLeafDollarsState(response.total_leaf_dollars);
          localStorage.setItem('leafDollars', String(response.total_leaf_dollars));
        } else if (response.leaf_dollars_earned) {
          const newBalance = addLeafDollars(response.leaf_dollars_earned);
          setLeafDollarsState(newBalance);
        }

        // Refresh habits to get updated streak
        await getHabits();
        window.dispatchEvent(new Event('habitsChanged'));
      }

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
      }
    } catch (error) {
      console.error('Failed to update habit value:', error);
      // Fallback to local update on error
      const dateString = getTodayDateString();
      updateHabitLog(habit.id, dateString, isNowCompleted, newValue);
      setHabitStates(prev => ({
        ...prev,
        [habit.id]: { ...prev[habit.id], currentValue: newValue }
      }));
    }
  };

  const handleReviveStreak = async (habit: Habit): Promise<void> => {
    if (leafDollars < 10) {
      alert('Not enough Leaf Dollars! You need 10 🍃 to revive a streak.');
      return;
    }

    if (window.confirm('Revive this missed day for 10 Leaf Dollars? 🍃')) {
      try {
        // Calculate the date for the selected past day
        const today = new Date();
        const dayOffset = selectedDay - getTodayIndex();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const dateString = formatDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

        // Revive via backend API
        const response = await api.post<{remaining_leaf_dollars?: number}>(`/habits/${habit.id}/revive/`, {
          date: dateString
        });

        // Update leaf dollars from backend response
        if (response.remaining_leaf_dollars !== undefined) {
          setLeafDollarsState(response.remaining_leaf_dollars);
          localStorage.setItem('leafDollars', String(response.remaining_leaf_dollars));
        } else {
          const newBalance = subtractLeafDollars(10);
          setLeafDollarsState(newBalance);
        }

        // Refresh habits to get updated streak
        await getHabits();
        window.dispatchEvent(new Event('habitsChanged'));

        // Save completion to logs with wasRevived flag
        if (habit.trackingType === 'variable_amount' && habit.target_amount) {
          updateHabitLog(habit.id, dateString, true, habit.target_amount, true);
          setHabitStates(prev => ({
            ...prev,
            [habit.id]: { ...prev[habit.id], currentValue: habit.target_amount!, completed: true }
          }));
        } else {
          updateHabitLog(habit.id, dateString, true, undefined, true);
          setHabitStates(prev => ({
            ...prev,
            [habit.id]: { ...prev[habit.id], completed: true }
          }));
        }

        setCompletedHabitId(habit.id);
        setTimeout(() => setCompletedHabitId(null), 600);
      } catch (error: any) {
        console.error('Failed to revive habit:', error);
        const errorMessage = error?.message || 'Failed to revive habit. Please try again.';
        alert(errorMessage);
      }
    }
  };

  // Long press handlers
  const handleLongPressStart = (habit: Habit): void => {
    longPressTimer.current = window.setTimeout(() => {
      setSelectedHabitForDetails(habit);
      setShowHabitDetails(true);
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteHabit = (habitId: string): void => {
    setDeleteConfirmModal({ isOpen: true, habitId });
  };

  const confirmDeleteHabit = async (): Promise<void> => {
    if (deleteConfirmModal.habitId) {
      try {
        // Delete habit from backend
        await deleteHabit(deleteConfirmModal.habitId);

        // Delete all logs for this habit
        const allLogs = getHabitLogs();
        const filteredLogs = allLogs.filter(log => String(log.habitId) !== String(deleteConfirmModal.habitId));
        setHabitLogs(filteredLogs);

        setShowHabitDetails(false);
        setSelectedHabitForDetails(null);
        setDeleteConfirmModal({ isOpen: false, habitId: null });
      } catch (error) {
        console.error('Failed to delete habit:', error);
        alert('Failed to delete habit. Please try again.');
      }
    }
  };

  const handleReviveYesterday = (habit: Habit): void => {
    if (leafDollars < 10) {
      setNotEnoughLeafModal(true);
      return;
    }

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    // Check if yesterday was already completed
    const yesterdayLog = getHabitLog(habit.id, yesterdayString);
    if (yesterdayLog?.completed) {
      return; // Already completed, button shouldn't show
    }

    setReviveConfirmModal({ isOpen: true, habit });
  };

  const handleChangePrivacy = (habit: Habit): void => {
    setPrivacyChangeModal({ isOpen: true, habit });
  };

  const confirmChangePrivacy = (): void => {
    if (privacyChangeModal.habit) {
      const habit = privacyChangeModal.habit;
      updateHabit(habit.id, { isPrivate: !habit.isPrivate });
      setPrivacyChangeModal({ isOpen: false, habit: null });
      setShowHabitDetails(false);
      setSelectedHabitForDetails(null);
    }
  };

  const handleCloseCompletionPopup = (): void => {
    setShowCompletionPopup(false);
    setCurrentCompletion(null);
    setQuestToRemove(null);
  };

  const confirmReviveYesterday = (): void => {
    if (reviveConfirmModal.habit) {
      const habit = reviveConfirmModal.habit;
      const newBalance = subtractLeafDollars(10);
      setLeafDollarsState(newBalance);

      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      // Mark yesterday as completed with wasRevived flag
      if (habit.trackingType === 'variable_amount' && habit.target_amount) {
        updateHabitLog(habit.id, yesterdayString, true, habit.target_amount, true);
      } else {
        updateHabitLog(habit.id, yesterdayString, true, undefined, true);
      }

      setReviveConfirmModal({ isOpen: false, habit: null });
      setReviveSuccessModal(true);
    }
  };

  // Check if yesterday is eligible for revival
  const canReviveYesterday = (habit: Habit): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    // Check if habit existed on yesterday
    const habitCreatedDate = new Date(habit.createdAt);
    habitCreatedDate.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (yesterday < habitCreatedDate) {
      return false; // Habit didn't exist yet
    }

    const yesterdayLog = getHabitLog(habit.id, yesterdayString);

    // Can revive if yesterday was not completed AND was not already revived
    return !yesterdayLog?.completed && !yesterdayLog?.wasRevived;
  };

  // Check if the selected past day can be revived
  const canReviveSelectedDay = (habit: Habit): boolean => {
    if (isToday(selectedDay) || selectedDay > getTodayIndex()) {
      return false; // Can't revive today or future days
    }

    const today = new Date();
    const dayOffset = selectedDay - getTodayIndex();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    // Check if habit existed on this date
    const habitCreatedDate = new Date(habit.createdAt);
    habitCreatedDate.setHours(0, 0, 0, 0);

    if (targetDate < habitCreatedDate) {
      return false; // Habit didn't exist yet
    }

    const dateString = formatDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const log = getHabitLog(habit.id, dateString);

    // Can revive if not completed AND was not already revived
    return !log?.completed && !log?.wasRevived;
  };

  return (
    <div className="main-menu">
      <header className="menu-header">
        <div className="header-left">
          <h1 className="quests-title">My Quests</h1>
          <div className="header-right-controls">
            <div className="leaf-dollars-bubble">
              <span className="leaf-icon">🍃</span>
              <span className="leaf-amount">{leafDollars}</span>
            </div>
            <button
              className="tree-icon-button"
              onClick={() => navigate('/tree')}
              aria-label="View Tree Animation"
            >
              🌳
            </button>
          </div>
        </div>
        {isToday(selectedDay) && (
          <div className="avatar-container">
            {showSpeechBubble && (
              <div className="speech-bubble">{currentMessage}</div>
            )}
            <div className="character-avatar">
              <img src={getSelectedCharacter().iconPath} alt={getSelectedCharacter().name} className="character-avatar-img" />
            </div>
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
            <span className="weekday-date">{getDateForWeekday(index)}</span>
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
              className={`habit-card ${completedHabitId === habit.id ? 'completed-animation' : ''} ${questToRemove === habit.id ? 'removing' : ''}`}
              style={{ borderLeftColor: habit.color }}
              onMouseDown={() => handleLongPressStart(habit)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(habit)}
              onTouchEnd={handleLongPressEnd}
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
                    disabled={!isToday(selectedDay) || state.completed}
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
                    disabled={!isToday(selectedDay) || (habit.target_amount !== undefined && state.currentValue >= habit.target_amount)}
                    aria-label={`${habit.label} progress`}
                  />
                  <span className="numeric-target">/ {habit.target_amount} {habit.unit}</span>
                </div>
              )}

              {/* Revive streak button for past days */}
              {!isToday(selectedDay) && selectedDay < getTodayIndex() && canReviveSelectedDay(habit) && (
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

      {/* Habit Details Modal */}
      {showHabitDetails && selectedHabitForDetails && (
        <div className="modal-overlay modal-overlay-high" onClick={() => setShowHabitDetails(false)}>
          <div className="modal-content habit-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quest Details</h2>
              <button className="close-btn" onClick={() => setShowHabitDetails(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="habit-details-content">
              <div className="detail-row">
                <span className="detail-emoji">{selectedHabitForDetails.emoji}</span>
                <span className="detail-name">{selectedHabitForDetails.label}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Quest Type:</span>
                <span className="detail-value">
                  {selectedHabitForDetails.trackingType === 'tick_cross' ? 'Build Habit (✓ / ✗)' :
                   selectedHabitForDetails.trackingType === 'variable_amount' ? 'Build Habit (Amount)' :
                   'Quit Habit (✓ / ✗)'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{selectedHabitForDetails.duration_days} days</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Days Left:</span>
                <span className="detail-value">{getDaysLeft(selectedHabitForDetails)} days</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Current Streak:</span>
                <span className="detail-value">🔥 {calculateStreak(selectedHabitForDetails)}</span>
              </div>

              {selectedHabitForDetails.trackingType === 'variable_amount' && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Target:</span>
                    <span className="detail-value">{selectedHabitForDetails.target_amount} {selectedHabitForDetails.unit}</span>
                  </div>
                </>
              )}

              <div className="detail-row">
                <span className="detail-label">Color:</span>
                <div className="detail-color" style={{ backgroundColor: selectedHabitForDetails.color }}></div>
              </div>

              <div className="detail-row">
                <span className="detail-label">Privacy:</span>
                <span className="detail-value">
                  {selectedHabitForDetails.isPrivate ? '🔒 Private' : '👥 Public'}
                </span>
              </div>
            </div>

            <div className="modal-actions">
              {canReviveYesterday(selectedHabitForDetails) && (
                <button
                  className="btn btn-secondary revive-yesterday-btn"
                  onClick={() => handleReviveYesterday(selectedHabitForDetails)}
                >
                  💚 Revive Yesterday (10🍃)
                </button>
              )}
              <button
                className="btn btn-secondary change-privacy-btn"
                onClick={() => handleChangePrivacy(selectedHabitForDetails)}
              >
                {selectedHabitForDetails.isPrivate ? '👥 Make Public' : '🔒 Make Private'}
              </button>
              <button
                className="btn btn-danger delete-btn"
                onClick={() => handleDeleteHabit(selectedHabitForDetails.id)}
              >
                🗑️ Delete Quest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, habitId: null })}
        onConfirm={confirmDeleteHabit}
        title="Delete Quest?"
        message="Are you sure you want to delete this quest? All progress will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        icon="🗑️"
        type="error"
      />

      <ConfirmModal
        isOpen={reviveConfirmModal.isOpen}
        onClose={() => setReviveConfirmModal({ isOpen: false, habit: null })}
        onConfirm={confirmReviveYesterday}
        title="Revive Yesterday?"
        message="Revive your streak for yesterday? This will cost 10 Leaf Dollars."
        confirmText="Revive (10🍃)"
        cancelText="Cancel"
        icon="🍃"
        type="success"
      />

      <ConfirmModal
        isOpen={notEnoughLeafModal}
        onClose={() => setNotEnoughLeafModal(false)}
        onConfirm={() => setNotEnoughLeafModal(false)}
        title="Not Enough Leaf Dollars"
        message="You need 10 🍃 to revive a streak. Keep completing your quests!"
        confirmText="OK"
        cancelText=""
        icon="🍃"
        type="warning"
      />

      <ConfirmModal
        isOpen={reviveSuccessModal}
        onClose={() => setReviveSuccessModal(false)}
        onConfirm={() => setReviveSuccessModal(false)}
        title="Streak Revived!"
        message="Your streak has been restored. Keep up the great work!"
        confirmText="Awesome!"
        cancelText=""
        icon="💚"
        type="success"
      />

      <ConfirmModal
        isOpen={privacyChangeModal.isOpen}
        onClose={() => setPrivacyChangeModal({ isOpen: false, habit: null })}
        onConfirm={confirmChangePrivacy}
        title="Change Privacy?"
        message={privacyChangeModal.habit?.isPrivate
          ? "Make this quest visible to your friends?"
          : "Hide this quest from your friends?"}
        confirmText="Change"
        cancelText="Cancel"
        icon={privacyChangeModal.habit?.isPrivate ? '👥' : '🔒'}
        type="warning"
      />

      {/* Quest Completion Congratulations Popup */}
      {currentCompletion && (
        <QuestCompletionCongrats
          isOpen={showCompletionPopup}
          onClose={handleCloseCompletionPopup}
          questName={currentCompletion.questName}
          questEmoji={currentCompletion.questEmoji}
          questColor={currentCompletion.questColor}
          daysCompleted={currentCompletion.daysCompleted}
          daysMissed={currentCompletion.daysMissed}
          highestStreak={currentCompletion.highestStreak}
        />
      )}
    </div>
  );
};

export default MainMenu;
