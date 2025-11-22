import React, { useState, useEffect } from 'react';
import './TreeCharacter.css';
import { getLeafDollars, setLeafDollars } from '../utils/leafDollarsStorage';
import { useHabits } from '../hooks/useHabits';
import { getHabitLogs } from '../utils/habitLogsStore';

interface Character {
  id: number;
  name: string;
  emoji: string;
  unlocked: boolean;
  cost: number;
}

const BASE_CHARACTERS: Character[] = [
  { id: 1, name: 'Forest Fox', emoji: '🦊', unlocked: true, cost: 0 },
  { id: 2, name: 'Wise Owl', emoji: '🦉', unlocked: true, cost: 0 },
  { id: 3, name: 'Garden Rabbit', emoji: '🐰', unlocked: false, cost: 500 },
  { id: 4, name: 'Mountain Deer', emoji: '🦌', unlocked: false, cost: 750 },
  { id: 5, name: 'River Turtle', emoji: '🐢', unlocked: false, cost: 1000 },
  { id: 6, name: 'Sky Dragon', emoji: '🐉', unlocked: false, cost: 2000 },
];

const UNLOCKED_CHARACTERS_KEY = 'unlockedCharacters';

// Load unlocked characters from localStorage
const loadUnlockedCharacters = (): Character[] => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (stored) {
    const unlockedIds = JSON.parse(stored) as number[];
    return BASE_CHARACTERS.map(char => ({
      ...char,
      unlocked: char.unlocked || unlockedIds.includes(char.id)
    }));
  }
  return BASE_CHARACTERS;
};

// Save unlocked characters to localStorage
const saveUnlockedCharacters = (characters: Character[]): void => {
  const unlockedIds = characters.filter(c => c.unlocked && c.cost > 0).map(c => c.id);
  localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(unlockedIds));
};

const TreeCharacter: React.FC = () => {
  const habits = useHabits();
  const [selectedHabit, setSelectedHabit] = useState<string>(habits.length > 0 ? habits[0].id : '');
  const [selectedCharacter, setSelectedCharacter] = useState<number>(() => {
    const stored = localStorage.getItem('selectedCharacter');
    return stored ? parseInt(stored) : BASE_CHARACTERS[0].id;
  });
  const [showShop, setShowShop] = useState<boolean>(false);
  const [leafDollarsState, setLeafDollarsState] = useState<number>(getLeafDollars());
  const [characters, setCharacters] = useState<Character[]>(loadUnlockedCharacters());

  // Sync leaf dollars with global storage
  useEffect(() => {
    const storedLeafDollars = getLeafDollars();
    setLeafDollarsState(storedLeafDollars);
  }, []);

  // Persist selected character to localStorage
  const handleCharacterChange = (characterId: number) => {
    setSelectedCharacter(characterId);
    localStorage.setItem('selectedCharacter', characterId.toString());
  };

  // Calculate progress for selected habit
  const calculateProgress = (habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const logs = getHabitLogs().filter(log => String(log.habitId) === String(habitId) && log.completed);
    const totalDays = habit.duration_days;

    if (totalDays === 0) return 0;
    return Math.min(100, Math.round((logs.length / totalDays) * 100));
  };

  const currentHabit = habits.find(h => h.id === selectedHabit);
  const currentProgress = selectedHabit ? calculateProgress(selectedHabit) : 0;
  const currentCharacter = characters.find(c => c.id === selectedCharacter);
  const unlockedCharacters = characters.filter(c => c.unlocked);

  const handlePurchaseCharacter = (characterId: number, cost: number): void => {
    if (leafDollarsState >= cost) {
      const newBalance = leafDollarsState - cost;
      setLeafDollars(newBalance);
      setLeafDollarsState(newBalance);
      const updatedCharacters = characters.map(c =>
        c.id === characterId ? { ...c, unlocked: true } : c
      );
      setCharacters(updatedCharacters);
      saveUnlockedCharacters(updatedCharacters); // Persist to localStorage
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
          <label htmlFor="habit-select">Quest:</label>
          <select
            id="habit-select"
            value={selectedHabit}
            onChange={(e) => setSelectedHabit(e.target.value)}
            className="control-dropdown"
          >
            {habits.map(habit => (
              <option key={habit.id} value={habit.id}>
                {habit.emoji} {habit.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-group">
          <label htmlFor="character-select">Companion:</label>
          <select
            id="character-select"
            value={selectedCharacter}
            onChange={(e) => handleCharacterChange(Number(e.target.value))}
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
        <div className="forest-background">
          {/* Sky/trees at top, soil at bottom */}
          <div className="forest-sky"></div>
          <div className="forest-soil">
            {/* Horizontal layout: Tree and Character side by side */}
            <div className="horizontal-scene">
              {/* Tree on the left */}
              <div className="tree-container">
                <div className="tree-placeholder">
                  <div className="tree-emoji">🌳</div>
                  <div className="tree-growth-bar">
                    <div
                      className="tree-growth-fill"
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <p className="tree-progress-text">{currentProgress}% grown</p>
                </div>
              </div>

              {/* Character on the right */}
              <div className="character-container">
                <div className="character-placeholder">
                  <div className="character-emoji">{currentCharacter?.emoji}</div>
                  <p className="character-name">{currentCharacter?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress info */}
        <div className="progress-info">
          <div className="info-card">
            <span className="info-label">Current Quest</span>
            <span className="info-value">{currentHabit?.label}</span>
          </div>
          <div className="info-card">
            <span className="info-label">Tree Growth</span>
            <span className="info-value">{currentProgress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bottom-controls">
        <div className="leaf-dollars-display">
          <span className="leaf-icon">🍃</span>
          <span className="leaf-amount">{leafDollarsState.toLocaleString()}</span>
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
              <span>{leafDollarsState.toLocaleString()} Leaf Dollars</span>
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
                      disabled={leafDollarsState < character.cost}
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
