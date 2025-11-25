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
        {/* Top section with username */}
        <div className="profile-top">
          <h2 className="profile-username">{user.username}</h2>
        </div>

        {/* Avatar and Characters section - Horizontal layout */}
        <div className="profile-section profile-section-compact">
          <div className="avatar-and-characters">
            <div className="profile-avatar-large">{user.avatar}</div>
            <div className="characters-horizontal">
              {user.characters.filter(c => c !== user.avatar).map((character, index) => (
                <div key={index} className="character-box-small">
                  {character}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quests section */}
        <div className="profile-section">
          <h3 className="section-title">🎯 Active Quests</h3>
          <div className="quests-list">
            {user.publicHabits.length > 0 ? (
              user.publicHabits.map((habit, index) => (
                <div key={index} className="quest-item">
                  <div className="quest-info">
                    <span className="quest-name">
                      {habit.name}
                    </span>
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
                </div>
              ))
            ) : (
              <p className="no-quests">No public quests to display</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;
