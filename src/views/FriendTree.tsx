import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TreeCharacter.css';
import './FriendProfile.css';
import { getFriendProfileByUsername, type FriendProfile } from '../services/friends';
import { useRive } from '@rive-app/react-canvas';
import { BASE_CHARACTERS } from '../utils/charactersStorage';

// Get tree level based on progress (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
// Using 5 levels (0-4) based on available tree Rive files
const getTreeLevel = (progress: number): number => {
  if (progress <= 20) return 0;
  if (progress <= 40) return 1;
  if (progress <= 60) return 2;
  if (progress <= 80) return 3;
  return 4;
};

// Rive Tree Animation Component
interface RiveTreeProps {
  level: number;
}

const RiveTree: React.FC<RiveTreeProps> = ({ level }) => {
  const { RiveComponent } = useRive({
    src: `/assets/trees/tree-level-${level}.riv`,
    autoplay: true,
  });

  return <RiveComponent className="tree-rive" />;
};

// Rive Character Animation Component
interface RiveCharacterProps {
  src: string;
  characterName: string;
}

const RiveCharacter: React.FC<RiveCharacterProps> = ({ src, characterName }) => {
  const { RiveComponent } = useRive({
    src: src,
    autoplay: true,
  });

  return <RiveComponent className="character-rive" aria-label={`${characterName} animation`} />;
};

// Find character by avatar URL
const findCharacterByAvatar = (avatarUrl: string | undefined) => {
  if (!avatarUrl) return null;
  return BASE_CHARACTERS.find(char => char.iconPath === avatarUrl);
};

const FriendTree: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);

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
          // Set first habit as selected by default
          if (friendProfile.public_habits.length > 0) {
            setSelectedHabitId(friendProfile.public_habits[0].id);
          }
        } else {
          setError('Friend not found or you are not friends with this user');
        }
      } catch (err) {
        console.error('Failed to load friend tree:', err);
        setError('Failed to load friend tree');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="tree-character">
        <div className="top-controls">
          <button className="back-button" onClick={() => navigate(`/friends/profile/${encodeURIComponent(username || '')}`)}>
            ← Back
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
          <h2>Loading tree...</h2>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="tree-character">
        <div className="top-controls">
          <button className="back-button" onClick={() => navigate('/friends')}>
            ← Back
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
          <h2>{error || 'Tree not found'}</h2>
          <button className="btn" onClick={() => navigate('/friends')}>
            Back to Friends
          </button>
        </div>
      </div>
    );
  }

  const user = profile.user;
  
  // Handle case when there are no public habits
  if (!profile.public_habits || profile.public_habits.length === 0) {
    return (
      <div className="tree-character">
        <div className="top-controls" style={{ alignItems: 'center' }}>
          <button 
            className="back-button" 
            onClick={() => navigate(`/friends/profile/${encodeURIComponent(username || '')}`)}
          >
            ← Back to Profile
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
          <h2>No Public Quests</h2>
          <p>{user.display_name || user.username} doesn't have any public quests to display.</p>
          <button className="btn" onClick={() => navigate(`/friends/profile/${encodeURIComponent(username || '')}`)}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedHabit = profile.public_habits.find(h => h.id === selectedHabitId) || profile.public_habits[0];
  const currentProgress = selectedHabit ? selectedHabit.progress : 0;
  const mainAvatar = user.avatar_url || (profile.characters && profile.characters.length > 0 ? profile.characters[0] : '');
  
  // Find the character to get its Rive animation path
  const friendCharacter = findCharacterByAvatar(mainAvatar);

  return (
    <div className="tree-character">
      {/* Top controls */}
      <div className="top-controls" style={{ alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <button 
          className="back-button" 
          onClick={() => navigate(`/friends/profile/${encodeURIComponent(username || '')}`)}
        >
          ← Back to Profile
        </button>
        {profile.public_habits && profile.public_habits.length > 0 && (
          <div className="dropdown-group" style={{ flex: 1, maxWidth: '300px' }}>
            <label htmlFor="habit-select">Select Quest:</label>
            <select
              id="habit-select"
              value={selectedHabitId || ''}
              onChange={(e) => setSelectedHabitId(Number(e.target.value))}
              className="control-dropdown"
            >
              {profile.public_habits.map(habit => (
                <option key={habit.id} value={habit.id}>
                  {habit.emoji ? `${habit.emoji} ` : ''}{habit.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main visualization area */}
      <div className="visualization-area">
        <div className="forest-background">
          {/* Sky/trees at top, soil at bottom */}
          <div className="forest-sky">
            <div className="sun"></div>
          </div>
          <div className="forest-soil">
            {/* Horizontal layout: Tree and Character side by side */}
            <div className="horizontal-scene">
              {/* Tree on the left */}
              <div className="tree-container">
                <div className="tree-placeholder">
                  <RiveTree key={getTreeLevel(currentProgress)} level={getTreeLevel(currentProgress)} />
                  <div className="tree-growth-bar">
                    <div
                      className="tree-growth-fill"
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <p className="tree-progress-text">{currentProgress.toFixed(0)}% grown</p>
                </div>
              </div>

              {/* Character on the right */}
              <div className="character-container">
                <div className="character-placeholder">
                  {friendCharacter ? (
                    <RiveCharacter
                      src={friendCharacter.animatedRivePath}
                      characterName={friendCharacter.name}
                    />
                  ) : mainAvatar && (mainAvatar.startsWith('/') || mainAvatar.startsWith('http')) ? (
                    <div className="character-static">
                      <img 
                        src={mainAvatar} 
                        alt={user.display_name || user.username} 
                        className="character-static-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = '<span style="font-size: 5rem;">🌱</span>';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="character-emoji" style={{ fontSize: '5rem' }}>{mainAvatar || '🌱'}</div>
                  )}
                  <p className="character-name">{user.display_name || user.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress info */}
        <div className="progress-info">
          <div className="info-card">
            <span className="info-label">Current Quest</span>
            <span className="info-value">{selectedHabit?.name || 'No quests'}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Tree Growth</span>
            <span className="info-value">{currentProgress.toFixed(0)}%</span>
          </div>
          <div className="info-card">
            <span className="info-label">Streak</span>
            <span className="info-value">🔥 {selectedHabit?.current_streak || 0}</span>
          </div>
        </div>
      </div>

      {/* Friend info footer */}
      <div className="bottom-controls" style={{ justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Viewing {user.display_name || user.username}'s tree
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendTree;

