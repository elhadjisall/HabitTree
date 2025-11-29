import React from 'react';
import './QuestCompletionPopup.css';
import { type Habit } from '../utils/habitsStore';

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
              {quests.map((quest) => (
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
                          width: `${Math.min(100, (quest.streak / quest.duration_days) * 100)}%`,
                          backgroundColor: quest.color
                        }}
                      />
                    </div>
                    <span className="quest-progress-text">
                      {quest.streak}/{quest.duration_days} days
                    </span>
                  </div>

                  <div className="quest-streak">
                    <span className="streak-icon">🔥</span>
                    <span className="streak-number">{quest.streak}</span>
                    <span className="streak-label">streak</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestCompletionPopup;
