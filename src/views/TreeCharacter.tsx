import React, { useState } from 'react';
import './TreeCharacter.css';

interface Habit {
  id: number;
  name: string;
  progress: number;
}

interface Character {
  id: number;
  name: string;
  emoji: string;
  unlocked: boolean;
  cost: number;
}

// Mock data
const MOCK_HABITS: Habit[] = [
  { id: 1, name: 'Morning Exercise', progress: 75 },
  { id: 2, name: 'Read 30 pages', progress: 60 },
  { id: 3, name: 'Meditate', progress: 90 },
];

const MOCK_CHARACTERS: Character[] = [
  { id: 1, name: 'Forest Fox', emoji: '🦊', unlocked: true, cost: 0 },
  { id: 2, name: 'Wise Owl', emoji: '🦉', unlocked: true, cost: 0 },
  { id: 3, name: 'Garden Rabbit', emoji: '🐰', unlocked: false, cost: 500 },
  { id: 4, name: 'Mountain Deer', emoji: '🦌', unlocked: false, cost: 750 },
  { id: 5, name: 'River Turtle', emoji: '🐢', unlocked: false, cost: 1000 },
  { id: 6, name: 'Sky Dragon', emoji: '🐉', unlocked: false, cost: 2000 },
];

const TreeCharacter: React.FC = () => {
  const [selectedHabit, setSelectedHabit] = useState<number>(MOCK_HABITS[0].id);
  const [selectedCharacter, setSelectedCharacter] = useState<number>(MOCK_CHARACTERS[0].id);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [leafDollars, setLeafDollars] = useState<number>(1250);
  const [characters, setCharacters] = useState<Character[]>(MOCK_CHARACTERS);

  const currentHabit = MOCK_HABITS.find(h => h.id === selectedHabit);
  const currentCharacter = characters.find(c => c.id === selectedCharacter);
  const unlockedCharacters = characters.filter(c => c.unlocked);

  const handlePurchaseCharacter = (characterId: number, cost: number): void => {
    if (leafDollars >= cost) {
      setLeafDollars(leafDollars - cost);
      setCharacters(characters.map(c =>
        c.id === characterId ? { ...c, unlocked: true } : c
      ));
      alert('Character unlocked! 🎉');
      setShowShop(false);
    } else {
      alert('Not enough Leaf Dollars! Keep completing your quests! 🍃');
    }
  };

  return (
    <div className="tree-character">
      {/* Top controls */}
      <div className="top-controls">
        <div className="dropdown-group">
          <label htmlFor="habit-select">Habit Tree:</label>
          <select
            id="habit-select"
            value={selectedHabit}
            onChange={(e) => setSelectedHabit(Number(e.target.value))}
            className="control-dropdown"
          >
            {MOCK_HABITS.map(habit => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-group">
          <label htmlFor="character-select">Character:</label>
          <select
            id="character-select"
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(Number(e.target.value))}
            className="control-dropdown"
          >
            {unlockedCharacters.map(character => (
              <option key={character.id} value={character.id}>
                {character.emoji} {character.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="visualization-area">
        <div className="nature-background">
          {/* Tree placeholder */}
          <div className="tree-container">
            <div className="tree-placeholder">
              <div className="tree-emoji">🌳</div>
              <div className="tree-growth-bar">
                <div
                  className="tree-growth-fill"
                  style={{ width: `${currentHabit?.progress || 0}%` }}
                ></div>
              </div>
              <p className="tree-progress-text">{currentHabit?.progress}% grown</p>
            </div>
          </div>

          {/* Character placeholder */}
          <div className="character-container">
            <div className="character-placeholder">
              <div className="character-emoji">{currentCharacter?.emoji}</div>
              <p className="character-name">{currentCharacter?.name}</p>
            </div>
          </div>
        </div>

        {/* Progress info */}
        <div className="progress-info">
          <div className="info-card">
            <span className="info-label">Current Quest</span>
            <span className="info-value">{currentHabit?.name}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Tree Growth</span>
            <span className="info-value">{currentHabit?.progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bottom-controls">
        <div className="leaf-dollars-display">
          <span className="leaf-icon">🍃</span>
          <span className="leaf-amount">{leafDollars.toLocaleString()}</span>
          <span className="leaf-label">Leaf Dollars</span>
        </div>

        <button className="btn btn-primary shop-btn" onClick={() => setShowShop(true)}>
          🛒 Shop
        </button>
      </div>

      {/* Shop modal */}
      {showShop && (
        <div className="shop-modal-overlay" onClick={() => setShowShop(false)}>
          <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shop-header">
              <h2>Character Shop</h2>
              <button className="close-btn" onClick={() => setShowShop(false)} aria-label="Close shop">
                ✕
              </button>
            </div>

            <div className="shop-balance">
              <span className="leaf-icon">🍃</span>
              <span>{leafDollars.toLocaleString()} Leaf Dollars</span>
            </div>

            <div className="shop-items">
              {characters.map(character => (
                <div
                  key={character.id}
                  className={`shop-item ${character.unlocked ? 'unlocked' : ''}`}
                >
                  <div className="shop-item-icon">{character.emoji}</div>
                  <div className="shop-item-info">
                    <h3>{character.name}</h3>
                    {character.unlocked ? (
                      <span className="unlocked-badge">✓ Unlocked</span>
                    ) : (
                      <span className="cost-badge">🍃 {character.cost}</span>
                    )}
                  </div>
                  {!character.unlocked && (
                    <button
                      className="btn btn-primary buy-btn"
                      onClick={() => handlePurchaseCharacter(character.id, character.cost)}
                      disabled={leafDollars < character.cost}
                    >
                      Buy
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeCharacter;
