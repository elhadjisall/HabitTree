import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FriendProfile.css';
import { getUserByUsername, type MockHabit } from '../utils/mockUsers';

// Mock Quest History Popup Component
interface MockQuestHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  questHistory: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
    highestStreak: number;
    daysCompleted: number;
    daysMissed: number;
  }>;
}

const MockQuestHistoryPopup: React.FC<MockQuestHistoryProps> = ({ isOpen, onClose, questHistory }) => {
  const [selectedQuest, setSelectedQuest] = useState<typeof questHistory[0] | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statsPosition, setStatsPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = (quest: typeof questHistory[0], e: React.MouseEvent) => {
    setSelectedQuest(quest);
    setStatsPosition({ x: e.clientX, y: e.clientY });
    setShowStats(true);
  };

  if (!isOpen) return null;

  return (
    <div className="quest-popup-overlay" onClick={onClose}>
      <div className="quest-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="quest-popup-header">
          <h2>Quest History</h2>
          <button className="quest-popup-close" onClick={onClose}>×</button>
        </div>
        <div className="quest-popup-body">
          {questHistory.length === 0 ? (
            <p className="no-quests-message">No completed quests yet</p>
          ) : (
            <div className="history-list">
              {questHistory.map((quest) => (
                <div
                  key={quest.id}
                  className="history-item"
                  style={{ borderLeft: `4px solid ${quest.color}` }}
                  onMouseDown={(e) => handleLongPress(quest, e)}
                >
                  <span className="history-emoji">{quest.emoji}</span>
                  <span className="history-label">{quest.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStats && selectedQuest && (
        <div className="stats-popup-overlay" onClick={() => setShowStats(false)}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Current Quests Popup Component
interface MockCurrentQuestsProps {
  isOpen: boolean;
  onClose: () => void;
  quests: MockHabit[];
}

const MockCurrentQuestsPopup: React.FC<MockCurrentQuestsProps> = ({ isOpen, onClose, quests }) => {
  if (!isOpen) return null;

  return (
    <div className="quest-popup-overlay" onClick={onClose}>
      <div className="quest-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="quest-popup-header">
          <h2>Current Quests</h2>
          <button className="quest-popup-close" onClick={onClose}>×</button>
        </div>
        <div className="quest-popup-body">
          {quests.length === 0 ? (
            <p className="no-quests-message">No current quests</p>
          ) : (
            <div className="quest-list">
              {quests.map((quest, index) => (
                <div
                  key={index}
                  className="quest-item"
                  style={{ borderLeft: `4px solid ${quest.color}` }}
                >
                  <div className="quest-item-header">
                    <span className="quest-emoji">{quest.emoji}</span>
                    <span className="quest-label">{quest.name}</span>
                  </div>
                  <div className="quest-progress-section">
                    <div className="quest-progress-bar-container">
                      <div
                        className="quest-progress-bar-fill"
                        style={{
                          width: `${quest.progress}%`,
                          backgroundColor: quest.color
                        }}
                      />
                    </div>
                    <span className="quest-progress-text">{quest.progress}%</span>
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

const FriendProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [showCurrentQuests, setShowCurrentQuests] = useState(false);
  const [showQuestHistory, setShowQuestHistory] = useState(false);

  const user = username ? getUserByUsername(decodeURIComponent(username)) : undefined;

  if (!user) {
    return (
      <div className="main-menu friend-profile-screen">
        <div className="profile-error">
          <h2>User not found</h2>
          <button className="btn" onClick={() => navigate('/friends')}>
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-profile-screen">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate('/friends')}>
          ← Back
        </button>
      </header>

      {/* Mobile Profile Card */}
      <div className="profile-card">
        {/* Profile and Companions Section */}
        <div className="profile-companions-section-friend">
          <div className="profile-picture-wrapper-friend">
            <div className="profile-picture-small-friend">
              {user.avatar}
            </div>
            <h2 className="profile-username-friend">{user.username}</h2>
          </div>

          <div className="companions-wrapper-friend">
            <h3 className="companions-heading-friend">Companions</h3>
            <div className="companions-grid-friend">
              {user.companionSlots.map((emoji, index) => (
                <div
                  key={index}
                  className={`companion-slot-friend ${emoji ? 'filled' : 'empty'}`}
                >
                  {emoji || ''}
                </div>
              ))}
            </div>
          </div>

          <div className="quest-buttons-friend">
            <button
              className="btn btn-primary quest-btn-friend"
              onClick={() => setShowCurrentQuests(true)}
            >
              View Current Quests
            </button>
            <button
              className="btn btn-secondary quest-btn-friend"
              onClick={() => setShowQuestHistory(true)}
            >
              Quest History
            </button>
          </div>
        </div>
      </div>

      {/* Current Quests Popup */}
      <MockCurrentQuestsPopup
        isOpen={showCurrentQuests}
        onClose={() => setShowCurrentQuests(false)}
        quests={user.publicHabits}
      />

      {/* Quest History Popup */}
      <MockQuestHistoryPopup
        isOpen={showQuestHistory}
        onClose={() => setShowQuestHistory(false)}
        questHistory={user.questHistory}
      />
    </div>
  );
};

export default FriendProfile;
