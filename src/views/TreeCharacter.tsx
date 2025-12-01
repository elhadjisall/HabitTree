import React, { useState, useEffect } from 'react';
import './TreeCharacter.css';
import { getLeafDollars, setLeafDollars } from '../utils/leafDollarsStorage';
import { useHabits } from '../hooks/useHabits';
import { getHabitLogs } from '../utils/habitLogsStore';
import {
  BASE_CHARACTERS,
  getUnlockedCharacters,
  getSelectedCharacter,
  updateAvatar,
  type Character
} from '../utils/charactersStorage';
import { useRive } from '@rive-app/react-canvas';

const UNLOCKED_CHARACTERS_KEY = 'unlockedCharacters';

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

  return <RiveComponent className="character-rive" />;
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

// Get tree level based on progress (0-10%, 11-20%, ..., 91-100%)
const getTreeLevel = (progress: number): number => {
  if (progress <= 10) return 0;
  if (progress <= 20) return 1;
  if (progress <= 30) return 2;
  if (progress <= 40) return 3;
  if (progress <= 50) return 4;
  if (progress <= 60) return 5;
  if (progress <= 70) return 6;
  if (progress <= 80) return 7;
  if (progress <= 90) return 8;
  return 9;
};

// Load unlocked characters from localStorage
const loadUnlockedCharacters = (): Character[] => {
  return getUnlockedCharacters();
};

// Save unlocked characters to localStorage
const saveUnlockedCharacters = (characterId: number): void => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  const unlockedIds = stored ? JSON.parse(stored) as number[] : [];
  if (!unlockedIds.includes(characterId)) {
    unlockedIds.push(characterId);
    localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(unlockedIds));
  }
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
  const [isNightTime, setIsNightTime] = useState<boolean>(() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6; // 6 PM to 6 AM
  });

  // Sync leaf dollars with global storage
  useEffect(() => {
    const storedLeafDollars = getLeafDollars();
    setLeafDollarsState(storedLeafDollars);
  }, []);

  // Check day/night every minute
  useEffect(() => {
    const checkDayNight = () => {
      const hour = new Date().getHours();
      setIsNightTime(hour >= 18 || hour < 6);
    };

    const interval = setInterval(checkDayNight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Persist selected character to localStorage
  const handleCharacterChange = (characterId: number) => {
    setSelectedCharacter(characterId);
    updateAvatar(characterId);
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
      saveUnlockedCharacters(characterId); // Persist to localStorage
      // Reload characters to reflect the update
      setCharacters(loadUnlockedCharacters());
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
                {character.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="visualization-area">
        <div className={`forest-background ${isNightTime ? 'night-mode' : ''}`}>
          {/* Sky/trees at top, soil at bottom */}
          <div className="forest-sky">
            <div className="sun"></div>
            <div className="moon"></div>
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
                  <p className="tree-progress-text">{currentProgress}% grown</p>
                </div>
              </div>

              {/* Character on the right */}
              <div className="character-container" style={{
                backgroundImage: currentCharacter ? `url(${currentCharacter.backgroundPath})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}>
                <div className="character-placeholder">
                  {currentCharacter && (
                    <RiveCharacter
                      src={currentCharacter.animatedRivePath}
                      characterName={currentCharacter.name}
                    />
                  )}
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
                  <div className="shop-item-icon">
                    <img src={character.iconPath} alt={character.name} className="shop-character-icon" />
                  </div>
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
