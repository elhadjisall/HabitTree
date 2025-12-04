import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FriendProfile.css';
import { getFriendProfileByUsername, type FriendProfile as FriendProfileType } from '../services/friends';

// Helper to render avatar - handles both image paths and emojis
const renderAvatar = (avatarUrl?: string, size: 'small' | 'large' = 'large'): React.ReactNode => {
  if (!avatarUrl) return <span className="default-avatar">🌱</span>;
  
  // Check if it's an image path
  if (avatarUrl.startsWith('/') || avatarUrl.startsWith('http')) {
    return (
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className={`avatar-image ${size}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: size === 'large' ? '50%' : '8px' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = '<span class="default-avatar">🌱</span>';
          }
        }}
      />
    );
  }
  
  // It's an emoji or short text
  return <span className="avatar-emoji">{avatarUrl}</span>;
};

const FriendProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FriendProfileType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [_showCurrentQuests, _setShowCurrentQuests] = useState(false);
  const [_showQuestHistory, _setShowQuestHistory] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const friendProfile = await getFriendProfileByUsername(decodeURIComponent(username));
        if (friendProfile) {
          setProfile(friendProfile);
        } else {
          setError('Friend not found or not a friend');
        }
      } catch (err: any) {
        console.error('Failed to load friend profile:', err);
        setError(err?.message || 'Failed to load friend profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="friend-profile-screen">
        <div className="profile-error">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="friend-profile-screen">
        <header className="profile-header">
          <button className="back-button" onClick={() => navigate('/friends')}>
            ← Back
          </button>
        </header>
        <div className="profile-error">
          <h2>{error || 'User not found'}</h2>
          <p>This user may not be your friend or doesn't exist.</p>
          <button className="btn" onClick={() => navigate('/friends')}>
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  const user = profile.user;

  return (
    <div className="friend-profile-screen">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate('/friends')}>
          ← Back
        </button>
      </header>

      {/* Mobile Profile Card */}
      <div className="profile-card">
        {/* Profile Top Section */}
        <div className="profile-top">
          <div className="profile-avatar-large">
            {renderAvatar(user.avatar_url, 'large')}
          </div>
          <h2 className="profile-username">{user.display_name || user.username}</h2>
        </div>

        {/* Avatar and Characters Section */}
        <div className="profile-section-compact">
          <div className="avatar-and-characters">
            <div className="profile-avatar-large">
              {renderAvatar(user.avatar_url, 'large')}
            </div>
            <div className="characters-horizontal">
              {profile.characters && profile.characters.length > 0 ? (
                profile.characters.map((char, index) => (
                  <div key={index} className="character-box-small">
                    {renderAvatar(char, 'small')}
                  </div>
                ))
              ) : (
                <div className="no-characters">No characters unlocked yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Public Habits Section */}
        <div className="profile-section">
          <h3 className="section-title">Public Quests</h3>
          {profile.public_habits && profile.public_habits.length > 0 ? (
            <div className="quests-list">
              {profile.public_habits.map((habit) => (
                <div key={habit.id} className="quest-item">
                  <div className="quest-info">
                    <span className="quest-name">
                      {habit.emoji} {habit.name}
                    </span>
                    <div className="quest-stats">
                      <span className="quest-streak">
                        🔥 {habit.current_streak} streak
                      </span>
                    </div>
                  </div>
                  <div className="quest-progress-bar">
                    <div
                      className="quest-progress-fill"
                      style={{ width: `${habit.progress}%` }}
                    />
                  </div>
                  <div className="quest-progress-text">
                    {habit.progress.toFixed(0)}% complete
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-quests">
              <p>No public quests to display</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="quest-buttons-friend">
          <button
            className="btn btn-primary quest-btn-friend"
            onClick={() => {
              if (profile.public_habits && profile.public_habits.length > 0) {
                navigate(`/friends/tree/${encodeURIComponent(user.username)}`);
              } else {
                alert('This friend has no public quests to display.');
              }
            }}
            disabled={!profile.public_habits || profile.public_habits.length === 0}
          >
            🌳 View Tree
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;
