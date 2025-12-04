// Character ownership and avatar storage utilities
// Now syncs with backend database for persistence across devices

import { api } from '../services/api';

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
    iconPath: '/assets/characters/mape-icon.jpeg',
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
    iconPath: '/assets/characters/ban-icon.jpeg',
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
    iconPath: '/assets/characters/saku-icon.jpeg',
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
const SELECTED_CHARACTER_KEY = 'selectedCharacter';
const USER_PROFILE_KEY = 'userProfile';

// Sync unlocked characters from backend to localStorage
export const syncCharactersFromBackend = (unlockedIds: number[], selectedId: number | null): void => {
  if (unlockedIds && unlockedIds.length > 0) {
    localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(unlockedIds));
  }
  if (selectedId) {
    localStorage.setItem(SELECTED_CHARACTER_KEY, String(selectedId));
  }
};

// Get unlocked characters (from localStorage, synced with backend)
export const getUnlockedCharacters = (): Character[] => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (stored) {
    const unlockedIds = JSON.parse(stored) as number[];
    return BASE_CHARACTERS.filter(char => unlockedIds.includes(char.id));
  }
  return [];
};

// Get unlocked character IDs
export const getUnlockedCharacterIds = (): number[] => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (stored) {
    return JSON.parse(stored) as number[];
  }
  return [];
};

// Get unlocked character icon paths only
export const getUnlockedCharacterIcons = (): string[] => {
  return getUnlockedCharacters().map(char => char.iconPath);
};

// Initialize first character for new users - syncs with backend
export const initializeFirstCharacter = async (): Promise<Character | null> => {
  const stored = localStorage.getItem(UNLOCKED_CHARACTERS_KEY);
  if (stored && JSON.parse(stored).length > 0) {
    // Already initialized
    return getSelectedCharacter();
  }
  
  // No characters unlocked yet - assign random first character
  const randomIndex = Math.floor(Math.random() * BASE_CHARACTERS.length);
  const firstCharacter = BASE_CHARACTERS[randomIndex];

  try {
    // Sync with backend
    const response = await api.post<{
      success: boolean;
      unlocked_characters: number[];
      selected_character: number;
      avatar_url: string;
      leaf_dollars: number;
      already_initialized?: boolean;
    }>('/users/initialize_character/', {
      character_id: firstCharacter.id,
      icon_path: firstCharacter.iconPath
    });
    
    if (response.already_initialized) {
      // Backend already has characters, sync to localStorage
      syncCharactersFromBackend(response.unlocked_characters, response.selected_character);
      return getCharacterById(response.selected_character) || firstCharacter;
    }
    
    // Update localStorage
    localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(response.unlocked_characters));
    localStorage.setItem(SELECTED_CHARACTER_KEY, String(response.selected_character));
    
    const profile = getUserProfile();
    profile.avatar = response.avatar_url || firstCharacter.iconPath;
    saveUserProfile(profile);
    
    return firstCharacter;
  } catch (error) {
    console.error('Failed to initialize character on backend:', error);
    // Fallback to local-only initialization
    localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify([firstCharacter.id]));
    localStorage.setItem(SELECTED_CHARACTER_KEY, String(firstCharacter.id));
    
    const profile = getUserProfile();
    profile.avatar = firstCharacter.iconPath;
    saveUserProfile(profile);
    
    return firstCharacter;
  }
};

// Purchase a character - syncs with backend
export const purchaseCharacter = async (characterId: number): Promise<{
  success: boolean;
  remainingLeafDollars: number;
  error?: string;
}> => {
  const character = getCharacterById(characterId);
  if (!character) {
    return { success: false, remainingLeafDollars: 0, error: 'Character not found' };
  }
  
  try {
    const response = await api.post<{
      success: boolean;
      unlocked_characters: number[];
      remaining_leaf_dollars: number;
      error?: string;
    }>('/users/purchase_character/', {
      character_id: characterId,
      cost: character.cost,
      icon_path: character.iconPath
    });
    
    if (response.success) {
      // Update localStorage
      localStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(response.unlocked_characters));
      localStorage.setItem('leafDollars', String(response.remaining_leaf_dollars));
    }
    
    return {
      success: response.success,
      remainingLeafDollars: response.remaining_leaf_dollars,
      error: response.error
    };
  } catch (error) {
    console.error('Failed to purchase character:', error);
    return { success: false, remainingLeafDollars: 0, error: 'Failed to purchase character' };
  }
};

// Select a character - syncs with backend
export const selectCharacter = async (characterId: number): Promise<boolean> => {
  const character = getCharacterById(characterId);
  if (!character) return false;
  
  try {
    const response = await api.post<{
      success: boolean;
      selected_character: number;
      avatar_url: string;
    }>('/users/select_character/', {
      character_id: characterId,
      icon_path: character.iconPath
    });
    
    if (response.success) {
      // Update localStorage
      localStorage.setItem(SELECTED_CHARACTER_KEY, String(response.selected_character));
      
      const profile = getUserProfile();
      profile.avatar = response.avatar_url || character.iconPath;
      saveUserProfile(profile);
    }
    
    return response.success;
  } catch (error) {
    console.error('Failed to select character:', error);
    // Fallback to local update
    localStorage.setItem(SELECTED_CHARACTER_KEY, String(characterId));
    const profile = getUserProfile();
    profile.avatar = character.iconPath;
    saveUserProfile(profile);
    return true;
  }
};

// Get character by ID
export const getCharacterById = (id: number): Character | undefined => {
  return BASE_CHARACTERS.find(char => char.id === id);
};

// Get currently selected character
export const getSelectedCharacter = (): Character => {
  const selectedId = localStorage.getItem(SELECTED_CHARACTER_KEY);
  if (selectedId) {
    const character = getCharacterById(parseInt(selectedId));
    if (character) {
      return character;
    }
  }
  // Fallback to first unlocked character or first character
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
  // Default profile
  return {
    username: 'habitworrier',
    avatar: BASE_CHARACTERS[0].iconPath
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
export const updateAvatar = async (characterId: number): Promise<void> => {
  await selectCharacter(characterId);
};

// Check if a character is unlocked
export const isCharacterUnlocked = (characterId: number): boolean => {
  const unlockedIds = getUnlockedCharacterIds();
  return unlockedIds.includes(characterId);
};
