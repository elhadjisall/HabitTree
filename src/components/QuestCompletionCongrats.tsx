import React from 'react';
import './QuestCompletionCongrats.css';

interface QuestCompletionCongratsProps {
  isOpen: boolean;
  onClose: () => void;
  questName: string;
  questEmoji: string;
  questColor: string;
  daysCompleted: number;
  daysMissed: number;
  highestStreak: number;
}

const QuestCompletionCongrats: React.FC<QuestCompletionCongratsProps> = ({
  isOpen,
  onClose,
  questName,
  questEmoji,
  questColor,
  daysCompleted,
  daysMissed,
  highestStreak
}) => {
  if (!isOpen) return null;

  return (
    <div className="congrats-overlay">
      <div className="congrats-content">
        <button className="congrats-close" onClick={onClose}>×</button>

        <div className="congrats-header">
          <h1 className="congrats-title">Congratulations!</h1>
          <p className="congrats-subtitle">Your quest is complete</p>
        </div>

        <div className="congrats-quest-info">
          <div
            className="congrats-quest-emoji"
            style={{ backgroundColor: questColor }}
          >
            {questEmoji}
          </div>
          <h2 className="congrats-quest-name">{questName}</h2>
        </div>

        <div className="congrats-stats">
          <div className="congrats-stat-card">
            <div className="stat-icon-large">✅</div>
            <div className="stat-content">
              <span className="stat-number">{daysCompleted}</span>
              <span className="stat-label">Days Completed</span>
            </div>
          </div>

          <div className="congrats-stat-card">
            <div className="stat-icon-large">❌</div>
            <div className="stat-content">
              <span className="stat-number">{daysMissed}</span>
              <span className="stat-label">Days Missed</span>
            </div>
          </div>

          <div className="congrats-stat-card highlight">
            <div className="stat-icon-large">🔥</div>
            <div className="stat-content">
              <span className="stat-number">{highestStreak}</span>
              <span className="stat-label">Highest Streak</span>
            </div>
          </div>
        </div>

        <div className="congrats-footer">
          <p>Your quest has been moved to Quest History</p>
        </div>
      </div>
    </div>
  );
};

export default QuestCompletionCongrats;
