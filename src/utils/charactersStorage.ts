// Character ownership and avatar storage utilities

export interface Character {
  id: number;
  name: string;
  iconPath: string; // Path to static icon image
  animatedRivePath: string; // Path to Rive animation file for animation screen
  backgroundPath: string; // Path to character-specific background
  unlocked: boolean;
  cost: number;
  dialogues: string[]; // Array of dialogue lines for this character
}

export const BASE_CHARACTERS: Character[] = [
  {
    id: 1,
    name: 'Mape',
    iconPath: '/assets/characters/mape-icon.png',
    animatedRivePath: '/assets/characters/mape-animated.riv',
    backgroundPath: '/assets/backgrounds/character-background.jpg',
    unlocked: false,
    cost: 50,
    dialogues: [
      "Let's grow together! 🍁",
      "Every small step counts!",
      "You're doing amazing!",
      "Keep going, friend!",
      "Progress is progress! 🌱",
      "I believe in you!",
      "One day at a time!",
      "You've got this! 💪"
    ]
  },
  {
    id: 2,
    name: 'Ban',
    iconPath: '/assets/characters/ban-icon.png',
    animatedRivePath: '/assets/characters/ban-animated.riv',
    backgroundPath: '/assets/backgrounds/character-background.jpg',
    unlocked: false,
    cost: 50,
    dialogues: [
      "Strength comes from consistency! 🌿",
      "Your efforts are paying off!",
      "Keep nurturing your habits!",
      "Steady progress is the key!",
      "You're building something great!",
      "Stay focused and strong! 💚",
      "Every habit is a new leaf!",
      "Growth takes time and care!"
    ]
  },
  {
    id: 3,
    name: 'Saku',
    iconPath: '/assets/characters/saku-icon.png',
    animatedRivePath: '/assets/characters/saku-animated.riv',
    backgroundPath: '/assets/backgrounds/character-background.jpg',
    unlocked: false,
    cost: 50,
    dialogues: [
      "Bloom where you are planted! 🌸",
      "Your journey is beautiful!",
      "Each day brings new growth!",
      "You're blossoming wonderfully!",
      "Keep nurturing yourself! 🌺",
      "Your potential is endless!",
      "Embrace the process!",
      "You're doing great! ✨"
    ]
  },
];

const UNLOCKED_CHARACTERS_KEY = 'unlockedCharacters';
const USER_PROFILE_KEY = 'userProfile';

// Get unlocked characters
export const getUnlockedCharacters = (): Character[] => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (stored) {
    const unlockedIds = JSON.parse(stored) as number[];
    return BASE_CHARACTERS.filter(char => char.unlocked || unlockedIds.includes(char.id));
  }
  return BASE_CHARACTERS.filter(char => char.unlocked);
};

// Get unlocked character icon paths only
export const getUnlockedCharacterIcons = (): string[] => {
  return getUnlockedCharacters().map(char => char.iconPath);
};

// Initialize first character - called on first app load
export const initializeFirstCharacter = (): void => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (!stored) {
    // No characters unlocked yet - assign random first character
    const randomIndex = Math.floor(Math.random() * BASE_CHARACTERS.length);
    const firstCharacter = BASE_CHARACTERS[randomIndex];

    // Unlock the first character
    localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify([firstCharacter.id]));

    // Set as selected character and avatar
    localStorage.setItem('selectedCharacter', String(firstCharacter.id));

    const profile = getUserProfile();
    profile.avatar = firstCharacter.iconPath;
    saveUserProfile(profile);
  }
};

// Get character by ID
export const getCharacterById = (id: number): Character | undefined => {
  return BASE_CHARACTERS.find(char => char.id === id);
};

// Get currently selected character
export const getSelectedCharacter = (): Character => {
  const selectedId = localStorage.getItem('selectedCharacter');
  if (selectedId) {
    const character = getCharacterById(parseInt(selectedId));
    if (character) {
      return character;
    }
  }
  // Fallback to first unlocked character
  const unlocked = getUnlockedCharacters();
  return unlocked.length > 0 ? unlocked[0] : BASE_CHARACTERS[0];
};

// Get random dialogue from selected character
export const getRandomDialogue = (): string => {
  const character = getSelectedCharacter();
  const dialogues = character.dialogues;
  return dialogues[Math.floor(Math.random() * dialogues.length)];
};

// User profile interface
export interface UserProfile {
  username: string;
  avatar: string; // Now stores iconPath instead of emoji
}

// Get user profile
export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize first character if needed
  initializeFirstCharacter();
  const firstChar = getSelectedCharacter();
  // Default profile
  return {
    username: 'habitworrier',
    avatar: firstChar.iconPath
  };
};

// Save user profile
export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

// Update username only
export const updateUsername = (username: string): void => {
  const profile = getUserProfile();
  profile.username = username;
  saveUserProfile(profile);
};

// Update avatar only (now takes character ID instead of emoji)
export const updateAvatar = (characterId: number): void => {
  const character = getCharacterById(characterId);
  if (character) {
    const profile = getUserProfile();
    profile.avatar = character.iconPath;
    saveUserProfile(profile);
    localStorage.setItem('selectedCharacter', String(characterId));
  }
};
