import React, { useState, useEffect } from 'react';
import './Settings.css';
import { getDarkMode, setDarkMode } from '../utils/darkModeStorage';
import { getUserProfile, updateUsername, updateAvatar, getUnlockedCharacters, getCharacterById } from '../utils/charactersStorage';
import { getCompanionSlots, setCompanionSlots, getMaxCompanionSlots } from '../utils/companionSlotsStorage';
import { useHabits } from '../hooks/useHabits';
import { getCurrentUser, updateUserProfile, logout } from '../services/auth';
import QuestCompletionPopup from '../components/QuestCompletionPopup';
import QuestHistory from './QuestHistory';

interface ProfileState {
  username: string;
  email: string;
  profilePicture: string;
}

interface EditModeState {
  username: boolean;
  email: boolean;
  password: boolean;
}

interface FormDataState {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const userProfile = getUserProfile();
  const habits = useHabits();
  const [profile, setProfile] = useState<ProfileState>({
    username: userProfile.username,
    email: 'user@example.com',
    profilePicture: userProfile.avatar,
  });
  const [, setLoading] = useState<boolean>(true);

  // Fetch user data from backend on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Convert full URL to relative path if needed for display
          let avatarPath = user.avatar_url || userProfile.avatar;
          if (avatarPath && avatarPath.startsWith('http')) {
            // Extract relative path from full URL
            try {
              const url = new URL(avatarPath);
              avatarPath = url.pathname;
            } catch {
              // If URL parsing fails, use as is
            }
          }
          
          setProfile({
            username: user.display_name || user.username,
            email: user.email,
            profilePicture: avatarPath,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const [editMode, setEditMode] = useState<EditModeState>({
    username: false,
    email: false,
    password: false,
  });

  const [formData, setFormData] = useState<FormDataState>({
    username: profile.username,
    email: profile.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getDarkMode());
  const [companionSlots, setCompanionSlotsState] = useState<string[]>([]);
  const [showProfilePicturePicker, setShowProfilePicturePicker] = useState<boolean>(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState<boolean>(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showCurrentQuests, setShowCurrentQuests] = useState<boolean>(false);
  const [showQuestHistory, setShowQuestHistory] = useState<boolean>(false);

  useEffect(() => {
    // Load companion slots
    const slots = getCompanionSlots();
    // Ensure we always have 8 slots
    while (slots.length < getMaxCompanionSlots()) {
      slots.push('');
    }
    setCompanionSlotsState(slots);
  }, []);

  useEffect(() => {
    // Listen for dark mode changes from other tabs/windows
    const handleDarkModeChange = () => {
      setIsDarkMode(getDarkMode());
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  const handleEdit = (field: keyof EditModeState): void => {
    setEditMode({ ...editMode, [field]: true });
  };

  const handleCancel = (field: keyof FormDataState): void => {
    setEditMode({ ...editMode, [field]: false });
    setFormData({
      ...formData,
      [field]: field in profile ? profile[field as keyof ProfileState] : '',
    });
  };

  const handleSave = async (field: string): Promise<void> => {
    if (field === 'password') {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (formData.newPassword.length < 8) {
        alert('Password must be at least 8 characters!');
        return;
      }
      // TODO: Implement password change API endpoint
      alert('Password updated successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else if (field === 'username') {
      try {
        const newUsername = formData.username;
        await updateUserProfile({ display_name: newUsername });
        setProfile({ ...profile, username: newUsername });
        updateUsername(newUsername); // Also update local storage
        alert('Username updated!');
      } catch (error) {
        console.error('Failed to update username:', error);
        alert('Failed to update username. Please try again.');
        return;
      }
    } else {
      setProfile({ ...profile, [field]: formData[field as keyof FormDataState] });
      alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
    }
    setEditMode({ ...editMode, [field]: false });
  };

  const handleProfilePictureChange = async (characterId: number): Promise<void> => {
    const character = getCharacterById(characterId);
    if (character) {
      try {
        // Send the relative path directly (backend now accepts CharField)
        // The iconPath is like '/assets/characters/mape-icon.png'
        await updateUserProfile({ avatar_url: character.iconPath });
        
        // Update local state immediately
        setProfile({ ...profile, profilePicture: character.iconPath });
        updateAvatar(characterId); // Also update local storage
        setShowProfilePicturePicker(false);
        
        // Refresh user data to confirm update
        try {
          const updatedUser = await getCurrentUser();
          if (updatedUser && updatedUser.avatar_url) {
            // Use the path from backend
            setProfile(prev => ({
              ...prev,
              profilePicture: updatedUser.avatar_url || character.iconPath
            }));
          }
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
          // Continue anyway, local state is already updated
        }
      } catch (error: any) {
        console.error('Failed to update avatar:', error);
        const errorMessage = error?.message || 'Failed to update profile picture. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleCompanionSlotClick = (index: number): void => {
    setSelectedSlotIndex(index);
    setShowCompanionPicker(true);
  };

  const handleCompanionSelect = (iconPath: string): void => {
    if (selectedSlotIndex !== null) {
      const newSlots = [...companionSlots];
      newSlots[selectedSlotIndex] = iconPath;
      setCompanionSlotsState(newSlots);
      setCompanionSlots(newSlots);
    }
    setShowCompanionPicker(false);
    setSelectedSlotIndex(null);
  };

  const handleLogout = (): void => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const handleDarkModeToggle = (): void => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setDarkMode(newDarkMode);
  };

  // Get only unlocked characters for profile picture selection
  const unlockedCharacters = getUnlockedCharacters();

  // Get public habits for current quests view
  const publicHabits = habits.filter(habit => !habit.isPrivate);

  return (
    <div className="settings">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      {/* Profile and Companions Section */}
      <section className="profile-companions-section">
        <div className="profile-picture-wrapper">
          <div
            className="profile-picture-small"
            onClick={() => setShowProfilePicturePicker(true)}
            style={{ cursor: 'pointer' }}
          >
            {profile.profilePicture && (profile.profilePicture.startsWith('/') || profile.profilePicture.startsWith('http')) ? (
              <img 
                src={profile.profilePicture} 
                alt="Profile" 
                style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.textContent = '👤';
                  }
                }}
              />
            ) : (
              <div style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {profile.profilePicture || '👤'}
              </div>
            )}
          </div>
          <h2 className="profile-username">{profile.username}</h2>
        </div>

        <div className="companions-wrapper">
          <h3 className="companions-heading">Companions</h3>
          <div className="companions-grid">
            {companionSlots.map((iconPath, index) => (
              <div
                key={index}
                className={`companion-slot ${iconPath ? 'filled' : 'empty'}`}
                onClick={() => handleCompanionSlotClick(index)}
              >
                {iconPath && <img src={iconPath} alt={`Companion ${index + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
              </div>
            ))}
          </div>
        </div>

        <div className="quest-buttons">
          <button
            className="btn btn-primary quest-btn"
            onClick={() => setShowCurrentQuests(true)}
          >
            View Current Quests
          </button>
          <button
            className="btn btn-secondary quest-btn"
            onClick={() => setShowQuestHistory(true)}
          >
            Quest History
          </button>
        </div>
      </section>

      {/* Settings sections */}
      <div className="settings-sections">
        {/* Username */}
        <section className="settings-card">
          <div className="card-header">
            <h3>Username</h3>
            {!editMode.username && (
              <button className="btn-edit" onClick={() => handleEdit('username')}>
                Edit
              </button>
            )}
          </div>
          {editMode.username ? (
            <div className="edit-form">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter new username"
              />
              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => handleCancel('username')}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => handleSave('username')}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="card-value">{profile.username}</p>
          )}
        </section>

        {/* Email */}
        <section className="settings-card">
          <div className="card-header">
            <h3>Email</h3>
            {!editMode.email && (
              <button className="btn-edit" onClick={() => handleEdit('email')}>
                Edit
              </button>
            )}
          </div>
          {editMode.email ? (
            <div className="edit-form">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter new email"
              />
              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => handleCancel('email')}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => handleSave('email')}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="card-value">{profile.email}</p>
          )}
        </section>

        {/* Password */}
        <section className="settings-card">
          <div className="card-header">
            <h3>Password</h3>
            {!editMode.password && (
              <button className="btn-edit" onClick={() => handleEdit('password')}>
                Change
              </button>
            )}
          </div>
          {editMode.password ? (
            <div className="edit-form">
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Current password"
              />
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="New password"
              />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => handleCancel('currentPassword')}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => handleSave('password')}>
                  Update
                </button>
              </div>
            </div>
          ) : (
            <p className="card-value">••••••••</p>
          )}
        </section>

        {/* Dark Mode */}
        <section className="settings-card">
          <div className="card-header">
            <h3>Dark Mode</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                aria-label="Toggle dark mode"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="card-value">{isDarkMode ? 'Enabled' : 'Disabled'}</p>
        </section>

        {/* Account actions */}
        <section className="settings-card danger-zone">
          <h3>Account Actions</h3>
          <div className="action-buttons">
            <button className="btn btn-secondary action-btn" onClick={handleLogout}>
              🚪 Log Out
            </button>
            <button
              className="btn btn-secondary action-btn"
              onClick={() => alert('Switch account functionality coming soon!')}
            >
              🔄 Switch Account
            </button>
          </div>
        </section>

        {/* App info */}
        <section className="app-info">
          <p>Habitree v1.0.0</p>
          <p>Made with 💚 for better habits</p>
        </section>
      </div>

      {/* Profile Picture Picker Modal */}
      {showProfilePicturePicker && (
        <div className="picker-overlay" onClick={() => setShowProfilePicturePicker(false)}>
          <div className="picker-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Profile Picture</h3>
            <div className="emoji-grid">
              {unlockedCharacters.map(character => (
                <button
                  key={character.id}
                  className={`emoji-option ${profile.profilePicture === character.iconPath ? 'active' : ''}`}
                  onClick={() => handleProfilePictureChange(character.id)}
                >
                  {character.iconPath && (character.iconPath.startsWith('/') || character.iconPath.startsWith('http')) ? (
                    <img 
                      src={character.iconPath} 
                      alt={character.name} 
                      style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.textContent = character.name.charAt(0).toUpperCase();
                        }
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{character.name.charAt(0)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Companion Picker Modal */}
      {showCompanionPicker && (
        <div className="picker-overlay" onClick={() => setShowCompanionPicker(false)}>
          <div className="picker-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Companion</h3>
            <div className="emoji-grid">
              <button
                className="emoji-option"
                onClick={() => handleCompanionSelect('')}
              >
                ❌
              </button>
              {unlockedCharacters.map(character => (
                <button
                  key={character.id}
                  className={`emoji-option ${selectedSlotIndex !== null && companionSlots[selectedSlotIndex] === character.iconPath ? 'active' : ''}`}
                  onClick={() => handleCompanionSelect(character.iconPath)}
                >
                  <img src={character.iconPath} alt={character.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Quests Popup */}
      <QuestCompletionPopup
        isOpen={showCurrentQuests}
        onClose={() => setShowCurrentQuests(false)}
        quests={publicHabits}
        title="Current Quests"
      />

      {/* Quest History */}
      <QuestHistory
        isOpen={showQuestHistory}
        onClose={() => setShowQuestHistory(false)}
      />
    </div>
  );
};

export default Settings;
