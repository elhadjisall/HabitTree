import React, { useState } from 'react';
import './QuestCreation.css';

interface PremadeQuest {
  id: number;
  name: string;
  icon: string;
  color: string;
  category: string;
}

interface CustomQuestState {
  name: string;
  color: string;
  period: string;
  value: string;
  unit: string;
  duration: number;
  type: string;
}

// Pre-made quest templates
const PREMADE_QUESTS: PremadeQuest[] = [
  { id: 1, name: 'Exercise', icon: '💪', color: '#6ab04c', category: 'Health' },
  { id: 2, name: 'Read', icon: '📚', color: '#4a7c59', category: 'Learning' },
  { id: 3, name: 'Meditate', icon: '🧘', color: '#00b894', category: 'Mindfulness' },
  { id: 4, name: 'Water Intake', icon: '💧', color: '#74b9ff', category: 'Health' },
  { id: 5, name: 'Sleep Early', icon: '😴', color: '#a29bfe', category: 'Health' },
  { id: 6, name: 'No Social Media', icon: '📱', color: '#fd79a8', category: 'Digital Wellness' },
  { id: 7, name: 'Journal', icon: '✍️', color: '#fdcb6e', category: 'Self-Care' },
  { id: 8, name: 'Learn Language', icon: '🌍', color: '#e17055', category: 'Learning' },
];

const QuestCreation: React.FC = () => {
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customQuest, setCustomQuest] = useState<CustomQuestState>({
    name: '',
    color: '#6ab04c',
    period: 'daily',
    value: '',
    unit: '',
    duration: 30,
    type: 'build', // build or quit
  });

  const handlePremadeSelect = (quest: PremadeQuest): void => {
    console.log('Selected premade quest:', quest);
    // In a real app, this would add the quest to the user's habits
    alert(`Added "${quest.name}" to your quests!`);
  };

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!customQuest.name.trim()) {
      alert('Please enter a quest name');
      return;
    }
    console.log('Creating custom quest:', customQuest);
    alert(`Created custom quest: ${customQuest.name}!`);
    setShowCustomForm(false);
    setCustomQuest({
      name: '',
      color: '#6ab04c',
      period: 'daily',
      value: '',
      unit: '',
      duration: 30,
      type: 'build',
    });
  };

  return (
    <div className="quest-creation">
      <header className="creation-header">
        <h1>Create a Quest</h1>
        <p className="subtitle">Choose a preset or create your own custom quest</p>
      </header>

      {!showCustomForm ? (
        <>
          {/* Premade quests */}
          <section className="premade-section">
            <h2>Quick Start Quests</h2>
            <div className="premade-grid">
              {PREMADE_QUESTS.map(quest => (
                <button
                  key={quest.id}
                  className="quest-card"
                  style={{ borderColor: quest.color }}
                  onClick={() => handlePremadeSelect(quest)}
                  aria-label={`Add ${quest.name} quest`}
                >
                  <div className="quest-icon" style={{ backgroundColor: quest.color }}>
                    {quest.icon}
                  </div>
                  <h3 className="quest-name">{quest.name}</h3>
                  <span className="quest-category">{quest.category}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Custom quest button */}
          <button
            className="btn btn-primary custom-quest-btn"
            onClick={() => setShowCustomForm(true)}
          >
            ✨ Create Custom Quest
          </button>
        </>
      ) : (
        /* Custom quest form */
        <section className="custom-form-section">
          <div className="form-header">
            <h2>Custom Quest</h2>
            <button
              className="btn-back"
              onClick={() => setShowCustomForm(false)}
              aria-label="Go back"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleCustomSubmit} className="custom-form">
            <div className="form-group">
              <label htmlFor="quest-name">Quest Name *</label>
              <input
                id="quest-name"
                type="text"
                placeholder="e.g., Morning Run"
                value={customQuest.name}
                onChange={(e) => setCustomQuest({ ...customQuest, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quest-color">Color</label>
              <input
                id="quest-color"
                type="color"
                value={customQuest.color}
                onChange={(e) => setCustomQuest({ ...customQuest, color: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quest-period">Period</label>
                <select
                  id="quest-period"
                  value={customQuest.period}
                  onChange={(e) => setCustomQuest({ ...customQuest, period: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quest-duration">Duration (days)</label>
                <input
                  id="quest-duration"
                  type="number"
                  min="1"
                  max="365"
                  value={customQuest.duration}
                  onChange={(e) => setCustomQuest({ ...customQuest, duration: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quest-value">Target Value</label>
                <input
                  id="quest-value"
                  type="text"
                  placeholder="e.g., 5"
                  value={customQuest.value}
                  onChange={(e) => setCustomQuest({ ...customQuest, value: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quest-unit">Unit</label>
                <input
                  id="quest-unit"
                  type="text"
                  placeholder="e.g., km, pages"
                  value={customQuest.unit}
                  onChange={(e) => setCustomQuest({ ...customQuest, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Quest Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="quest-type"
                    value="build"
                    checked={customQuest.type === 'build'}
                    onChange={(e) => setCustomQuest({ ...customQuest, type: e.target.value })}
                  />
                  <span>Build Habit (Do More)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="quest-type"
                    value="quit"
                    checked={customQuest.type === 'quit'}
                    onChange={(e) => setCustomQuest({ ...customQuest, type: e.target.value })}
                  />
                  <span>Quit Habit (Do Less)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">
              🎯 Create Quest
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default QuestCreation;
