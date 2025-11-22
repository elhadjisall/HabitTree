import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FriendProfile.css';
import { getUserByUsername } from '../utils/mockUsers';

const FriendProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const user = username ? getUserByUsername(decodeURIComponent(username)) : undefined;

  if (!user) {
    return (
      <div className="friend-profile-screen">
        <div className="profile-error">
          <h2>User not found</h2>
          <button className="btn" onClick={() => navigate('/friends')}>
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  const allHabits = [...user.publicHabits, ...user.privateHabits];

  return (
    <div className="friend-profile-screen">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate('/friends')}>
          ← Back
        </button>
      </header>

      {/* ID Card style profile */}
      <div className="profile-card">
        {/* Top section with avatar and username */}
        <div className="profile-top">
          <div className="profile-avatar">{user.avatar}</div>
          <h2 className="profile-username">{user.username}</h2>
        </div>

        {/* Quests section */}
        <div className="profile-section">
          <h3 className="section-title">🎯 Active Quests</h3>
          <div className="quests-list">
            {allHabits.map((habit, index) => (
              <div key={index} className="quest-item">
                {habit.isPrivate ? (
                  <>
                    <div className="quest-info-private">
                      <span className="lock-icon">🔒</span>
                      <span className="quest-name-private">This quest is private</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="quest-info">
                      <span className="quest-name">{habit.name}</span>
                      <div className="quest-stats">
                        <span className="quest-streak">🔥 {habit.streak}</span>
                      </div>
                    </div>
                    <div className="quest-progress-bar">
                      <div
                        className="quest-progress-fill"
                        style={{ width: `${habit.progress}%` }}
                      ></div>
                    </div>
                    <span className="quest-progress-text">{habit.progress}%</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Characters section */}
        <div className="profile-section">
          <h3 className="section-title">👥 Companions</h3>
          <div className="characters-grid">
            {user.characters.map((character, index) => (
              <div key={index} className="character-box">
                {character}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;
