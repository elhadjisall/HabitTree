import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestCreation.css';
import { addHabit, type TrackingType } from '../utils/habitsStore';

interface PresetQuest {
  name: string;
  emoji: string;
  color: string;
  trackingType: TrackingType;
  defaultTarget?: number;
  defaultUnit?: string;
}

// Preset quest templates with defaults
const PRESET_QUESTS: PresetQuest[] = [
  { name: 'Exercise', emoji: '💪', color: '#6ab04c', trackingType: 'tick_cross' },
  { name: 'Read', emoji: '📚', color: '#4a7c59', trackingType: 'variable_amount', defaultTarget: 30, defaultUnit: 'pages' },
  { name: 'Meditate', emoji: '🧘', color: '#00b894', trackingType: 'tick_cross' },
  { name: 'Water Intake', emoji: '💧', color: '#74b9ff', trackingType: 'variable_amount', defaultTarget: 8, defaultUnit: 'glasses' },
  { name: 'Sleep Early', emoji: '😴', color: '#a29bfe', trackingType: 'tick_cross' },
  { name: 'No Social Media', emoji: '📱', color: '#fd79a8', trackingType: 'quit' },
  { name: 'Journal', emoji: '✍️', color: '#fdcb6e', trackingType: 'tick_cross' },
  { name: 'Learn Language', emoji: '🌍', color: '#e17055', trackingType: 'variable_amount', defaultTarget: 15, defaultUnit: 'minutes' },
];

// Available emojis for custom quests (60+ options)
const EMOJI_OPTIONS = [
  '🏃', '💪', '📚', '🧘', '💧', '😴', '📱', '✍️', '🌍', '🎯',
  '🌱', '🔥', '⭐', '🎨', '🎵', '🍎', '🚴', '🏊', '🧠', '💻',
  '📝', '🎓', '☕', '🌟', '🏃‍♂️', '🏃‍♀️', '🧘‍♀️', '🧘‍♂️', '📖', '🥤',
  '🛌', '⚽', '🎧', '🧹', '🌿', '🍽️', '📈', '🗓️', '✨', '🕒',
  '🔒', '🌾', '🥗', '💭', '📦', '🛀', '🚿', '🚰', '📵', '🎮',
  '🏋️', '🤸', '🚶', '🧗', '🤾', '🏌️', '🧖', '💆', '🍵', '🥛',
  '🥕', '🥦', '🍓', '🥑', '🌻', '🌺', '🍃', '🌲', '🏞️', '⛰️'
];

interface QuestFormState {
  isPreset: boolean;
  presetName: string;
  label: string;
  emoji: string;
  color: string;
  duration: number;
  trackingType: TrackingType;
  targetAmount: number;
  unit: string;
  isPrivate: boolean;
}

const QuestCreation: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [createdQuest, setCreatedQuest] = useState<{ emoji: string; label: string } | null>(null);

  const [quest, setQuest] = useState<QuestFormState>({
    isPreset: false,
    presetName: '',
    label: '',
    emoji: '🎯',
    color: '#6ab04c',
    duration: 30,
    trackingType: 'tick_cross',
    targetAmount: 0,
    unit: '',
    isPrivate: false,
  });

  const handlePresetSelect = (preset: PresetQuest): void => {
    setQuest({
      isPreset: true,
      presetName: preset.name,
      label: preset.name,
      emoji: preset.emoji,
      color: preset.color,
      duration: 30,
      trackingType: preset.trackingType,
      targetAmount: preset.defaultTarget || 0,
      unit: preset.defaultUnit || '',
      isPrivate: false,
    });
    setShowForm(true);
  };

  const handleCustomQuestClick = (): void => {
    setQuest({
      isPreset: false,
      presetName: '',
      label: '',
      emoji: '🎯',
      color: '#6ab04c',
      duration: 30,
      trackingType: 'tick_cross',
      targetAmount: 0,
      unit: '',
      isPrivate: false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!quest.label.trim()) {
      alert('Please enter a quest name');
      return;
    }

    if (quest.trackingType === 'variable_amount' && (!quest.targetAmount || !quest.unit.trim())) {
      alert('Please enter target value and unit for amount-based quests');
      return;
    }

    try {
      // Create the habit via backend API
      const newHabit = await addHabit({
        label: quest.label,
        emoji: quest.emoji,
        color: quest.color,
        duration_days: quest.duration,
        trackingType: quest.trackingType,
        target_amount: quest.trackingType === 'variable_amount' ? quest.targetAmount : undefined,
        unit: quest.trackingType === 'variable_amount' ? quest.unit : undefined,
        isPrivate: quest.isPrivate,
      });

      // Show confirmation modal
      setCreatedQuest({ emoji: newHabit.emoji, label: newHabit.label });
      setShowConfirmation(true);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
      alert('Failed to create quest. Please try again.');
    }
  };

  const handleBackToList = (): void => {
    setShowForm(false);
    setQuest({
      isPreset: false,
      presetName: '',
      label: '',
      emoji: '🎯',
      color: '#6ab04c',
      duration: 30,
      trackingType: 'tick_cross',
      targetAmount: 0,
      unit: '',
      isPrivate: false,
    });
  };

  return (
    <div className="quest-creation">
      {!showForm && (
        <>
          <header className="creation-header">
            <h1 className="journey-title">Start your Journey</h1>
            <p className="subtitle">Choose a quest or create your own</p>
          </header>

          {/* Premade quests */}
          <section className="premade-section">
            <h2 className="quick-start-label">Quick Start Quests</h2>
            <div className="premade-grid">
              {PRESET_QUESTS.map((preset, index) => (
                <button
                  key={index}
                  className="quest-card"
                  style={{ borderColor: preset.color }}
                  onClick={() => handlePresetSelect(preset)}
                  aria-label={`Add ${preset.name} quest`}
                >
                  <div className="quest-icon" style={{ backgroundColor: preset.color }}>
                    {preset.emoji}
                  </div>
                  <h3 className="quest-name">{preset.name}</h3>
                </button>
              ))}
            </div>
          </section>

          {/* Custom quest button */}
          <button
            className="btn btn-primary custom-quest-btn"
            onClick={handleCustomQuestClick}
          >
            ✨ Create Custom Quest
          </button>
        </>
      )}

      {showForm && (
        <section className="custom-form-section">
          <div className="form-header">
            <h2>{quest.isPreset ? 'Customize Quest' : 'Custom Quest'}</h2>
            <button
              className="btn-back"
              onClick={handleBackToList}
              aria-label="Go back"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="custom-form">
            {/* Quest Name */}
            <div className="form-group">
              <label htmlFor="quest-name">Quest Name *</label>
              <input
                id="quest-name"
                type="text"
                placeholder="e.g., Morning Run"
                value={quest.label}
                onChange={(e) => setQuest({ ...quest, label: e.target.value })}
                disabled={quest.isPreset}
                required
              />
            </div>

            {/* Emoji Selector */}
            <div className="form-group">
              <label htmlFor="quest-emoji">Emoji</label>
              {quest.isPreset ? (
                <div className="emoji-display-only">
                  <span className="emoji-large">{quest.emoji}</span>
                  <span className="emoji-note">(Fixed for preset quests)</span>
                </div>
              ) : (
                <div className="emoji-picker">
                  {EMOJI_OPTIONS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`emoji-option ${quest.emoji === emoji ? 'selected' : ''}`}
                      onClick={() => setQuest({ ...quest, emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="form-group">
              <label htmlFor="quest-color">Color</label>
              <input
                id="quest-color"
                type="color"
                value={quest.color}
                onChange={(e) => setQuest({ ...quest, color: e.target.value })}
              />
            </div>

            {/* Quest Duration */}
            <div className="form-group">
              <label htmlFor="quest-duration">Duration (days)</label>
              <input
                id="quest-duration"
                type="number"
                min="1"
                max="365"
                value={quest.duration}
                onChange={(e) => setQuest({ ...quest, duration: Number(e.target.value) })}
              />
            </div>

            {/* Quest Type */}
            <div className="form-group">
              <label>Quest Type</label>
              <div className="radio-group">
                <label className={`radio-label ${quest.isPreset ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="quest-type"
                    value="tick_cross"
                    checked={quest.trackingType === 'tick_cross'}
                    onChange={(e) => setQuest({ ...quest, trackingType: e.target.value as TrackingType })}
                    disabled={quest.isPreset}
                  />
                  <span>Build Habit (Tick / Cross)</span>
                </label>
                <label className={`radio-label ${quest.isPreset ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="quest-type"
                    value="variable_amount"
                    checked={quest.trackingType === 'variable_amount'}
                    onChange={(e) => setQuest({ ...quest, trackingType: e.target.value as TrackingType })}
                    disabled={quest.isPreset}
                  />
                  <span>Build Habit (Amount)</span>
                </label>
                <label className={`radio-label ${quest.isPreset ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="quest-type"
                    value="quit"
                    checked={quest.trackingType === 'quit'}
                    onChange={(e) => setQuest({ ...quest, trackingType: e.target.value as TrackingType })}
                    disabled={quest.isPreset}
                  />
                  <span>Quit Habit (Tick / Cross)</span>
                </label>
              </div>
            </div>

            {/* Target Value & Unit (only for Build Amount) */}
            {quest.trackingType === 'variable_amount' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quest-target">Target Value *</label>
                  <input
                    id="quest-target"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={quest.targetAmount || ''}
                    onChange={(e) => setQuest({ ...quest, targetAmount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quest-unit">Unit *</label>
                  <input
                    id="quest-unit"
                    type="text"
                    placeholder="e.g., km, pages"
                    value={quest.unit}
                    onChange={(e) => setQuest({ ...quest, unit: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Privacy Setting */}
            <div className="form-group">
              <label>Privacy</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={!quest.isPrivate}
                    onChange={() => setQuest({ ...quest, isPrivate: false })}
                  />
                  <span>Public - Visible to friends</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={quest.isPrivate}
                    onChange={() => setQuest({ ...quest, isPrivate: true })}
                  />
                  <span>Private - Only you can see</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">
              🎯 Create Quest
            </button>
          </form>
        </section>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && createdQuest && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Your journey begins here</h2>
            <div className="modal-quest">
              <span className="modal-emoji">{createdQuest.emoji}</span>
              <span className="modal-label">{createdQuest.label}</span>
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowConfirmation(false);
                  navigate('/app');
                }}
              >
                Go to My Quests
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirmation(false);
                  setCreatedQuest(null);
                }}
              >
                Create Another Quest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestCreation;
