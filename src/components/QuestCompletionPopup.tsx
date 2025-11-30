import React from 'react';
import './QuestCompletionPopup.css';
import { type Habit } from '../utils/habitsStore';
import { calculateStreak } from '../utils/streakCalculation';
import { getHabitLogs } from '../utils/habitLogsStore';

interface QuestCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Habit[];
  title: string;
}

const QuestCompletionPopup: React.FC<QuestCompletionPopupProps> = ({
  isOpen,
  onClose,
  quests,
  title
}) => {
  if (!isOpen) return null;

  // Calculate days completed and days missed for a habit
  const calculateHabitStats = (quest: Habit) => {
    const logs = getHabitLogs().filter(log => String(log.habitId) === String(quest.id));

    // Days completed = number of successful logs
    let daysCompleted = 0;
    logs.forEach(log => {
      let isSuccess = false;
      if (quest.trackingType === 'variable_amount') {
        // For Build (Amount): must reach 100% of target
        isSuccess = log.value !== undefined && quest.target_amount !== undefined &&
                   log.value >= quest.target_amount;
      } else {
        isSuccess = log.completed;
      }
      if (isSuccess) daysCompleted++;
    });

    // Calculate days missed based on habit start date
    const habitStartDate = new Date(quest.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    habitStartDate.setHours(0, 0, 0, 0);

    // Calculate total days that have passed since habit creation
    const daysPassed = Math.floor((today.getTime() - habitStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Days missed = days that passed minus days completed (but not more than duration)
    const daysMissed = Math.max(0, Math.min(daysPassed, quest.duration_days) - daysCompleted);

    return { daysCompleted, daysMissed };
  };

  return (
    <div className="quest-popup-overlay" onClick={onClose}>
      <div className="quest-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="quest-popup-header">
          <h2>{title}</h2>
          <button className="quest-popup-close" onClick={onClose}>×</button>
        </div>

        <div className="quest-popup-body">
          {quests.length === 0 ? (
            <p className="no-quests-message">No quests to display</p>
          ) : (
            <div className="quest-list">
              {quests.map((quest) => {
                const currentStreak = calculateStreak(quest);
                const { daysCompleted, daysMissed } = calculateHabitStats(quest);

                return (
                  <div
                    key={quest.id}
                    className="quest-item"
                    style={{ borderLeft: `4px solid ${quest.color}` }}
                  >
                    <div className="quest-item-header">
                      <span className="quest-emoji">{quest.emoji}</span>
                      <span className="quest-label">{quest.label}</span>
                    </div>

                    <div className="quest-progress-section">
                      <div className="quest-progress-bar-container">
                        <div
                          className="quest-progress-bar-fill"
                          style={{
                            width: `${Math.min(100, (daysCompleted / quest.duration_days) * 100)}%`,
                            backgroundColor: quest.color
                          }}
                        />
                      </div>
                      <span className="quest-progress-text">
                        {daysCompleted}/{quest.duration_days} days completed
                      </span>
                    </div>

                    <div className="quest-stats">
                      <div className="quest-streak">
                        <span className="streak-icon">🔥</span>
                        <span className="streak-number">{currentStreak}</span>
                        <span className="streak-label">streak</span>
                      </div>
                      <div className="quest-stat-item">
                        <span className="stat-icon">✅</span>
                        <span className="stat-number">{daysCompleted}</span>
                        <span className="stat-label">completed</span>
                      </div>
                      <div className="quest-stat-item">
                        <span className="stat-icon">❌</span>
                        <span className="stat-number">{daysMissed}</span>
                        <span className="stat-label">missed</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestCompletionPopup;
