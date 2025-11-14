import React, { useState } from 'react';
import './Settings.css';

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
  const [profile, setProfile] = useState<ProfileState>({
    username: 'HabitWarrior',
    email: 'user@example.com',
    profilePicture: '👤',
  });

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

  const handleSave = (field: string): void => {
    if (field === 'password') {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (formData.newPassword.length < 8) {
        alert('Password must be at least 8 characters!');
        return;
      }
      alert('Password updated successfully!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setProfile({ ...profile, [field]: formData[field as keyof FormDataState] });
      alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
    }
    setEditMode({ ...editMode, [field]: false });
  };

  const handleLogout = (): void => {
    if (window.confirm('Are you sure you want to log out?')) {
      alert('Logged out successfully!');
      // In a real app, this would clear auth tokens and redirect to login
    }
  };

  const PROFILE_EMOJIS = ['👤', '😊', '🌟', '🦊', '🌳', '🍃', '🏆', '💪'];

  return (
    <div className="settings">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      {/* Profile picture */}
      <section className="profile-section">
        <div className="profile-picture-container">
          <div className="profile-picture">{profile.profilePicture}</div>
          <div className="emoji-picker">
            {PROFILE_EMOJIS.map(emoji => (
              <button
                key={emoji}
                className={`emoji-option ${profile.profilePicture === emoji ? 'active' : ''}`}
                onClick={() => setProfile({ ...profile, profilePicture: emoji })}
                aria-label={`Select ${emoji} as profile picture`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <h2 className="profile-username">{profile.username}</h2>
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
    </div>
  );
};

export default Settings;
