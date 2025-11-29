import React, { useState, useEffect, useRef } from 'react';
import './QuestHistory.css';
import { getQuestHistory, type QuestHistoryEntry } from '../utils/questHistoryStorage';

interface QuestHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuestHistory: React.FC<QuestHistoryProps> = ({ isOpen, onClose }) => {
  const [historyEntries, setHistoryEntries] = useState<QuestHistoryEntry[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<QuestHistoryEntry | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [statsPosition, setStatsPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setHistoryEntries(getQuestHistory());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleHistoryChange = () => {
      setHistoryEntries(getQuestHistory());
    };
    window.addEventListener('questHistoryChanged', handleHistoryChange);
    return () => window.removeEventListener('questHistoryChanged', handleHistoryChange);
  }, []);

  const handleLongPressStart = (quest: QuestHistoryEntry, e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    touchStartPos.current = { x: clientX, y: clientY };

    longPressTimer.current = window.setTimeout(() => {
      setSelectedQuest(quest);
      setStatsPosition({ x: clientX, y: clientY });
      setShowStats(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);

      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const closeStatsPopup = () => {
    setShowStats(false);
    setSelectedQuest(null);
  };

  if (!isOpen) return null;

  return (
    <div className="quest-history-overlay" onClick={onClose}>
      <div className="quest-history-content" onClick={(e) => e.stopPropagation()}>
        <div className="quest-history-header">
          <h2>Quest History</h2>
          <button className="quest-history-close" onClick={onClose}>×</button>
        </div>

        <div className="quest-history-body">
          {historyEntries.length === 0 ? (
            <p className="no-history-message">No completed quests yet. Keep going!</p>
          ) : (
            <div className="history-list">
              {historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="history-item"
                  style={{ borderLeft: `4px solid ${entry.color}` }}
                  onMouseDown={(e) => handleLongPressStart(entry, e)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={(e) => handleLongPressStart(entry, e)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleTouchMove}
                >
                  <span className="history-emoji">{entry.emoji}</span>
                  <span className="history-label">{entry.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStats && selectedQuest && (
        <div className="stats-popup-overlay" onClick={closeStatsPopup}>
          <div
            className="stats-popup"
            style={{
              position: 'fixed',
              left: `${Math.min(statsPosition.x, window.innerWidth - 250)}px`,
              top: `${Math.min(statsPosition.y, window.innerHeight - 200)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedQuest.emoji} {selectedQuest.label}</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">🔥</span>
                <div className="stat-info">
                  <span className="stat-label">Highest Streak</span>
                  <span className="stat-value">{selectedQuest.highestStreak} days</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <div className="stat-info">
                  <span className="stat-label">Days Completed</span>
                  <span className="stat-value">{selectedQuest.daysCompleted}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❌</span>
                <div className="stat-info">
                  <span className="stat-label">Days Missed</span>
                  <span className="stat-value">{selectedQuest.daysMissed}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <div className="stat-info">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">
                    {selectedQuest.totalDays > 0
                      ? Math.round((selectedQuest.daysCompleted / selectedQuest.totalDays) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestHistory;
