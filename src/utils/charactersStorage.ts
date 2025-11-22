// Character ownership and avatar storage utilities

export interface Character {
  id: number;
  name: string;
  emoji: string;
  unlocked: boolean;
  cost: number;
}

export const BASE_CHARACTERS: Character[] = [
  { id: 1, name: 'Forest Fox', emoji: '🦊', unlocked: true, cost: 0 },
  { id: 2, name: 'Wise Owl', emoji: '🦉', unlocked: true, cost: 0 },
  { id: 3, name: 'Garden Rabbit', emoji: '🐰', unlocked: false, cost: 500 },
  { id: 4, name: 'Mountain Deer', emoji: '🦌', unlocked: false, cost: 750 },
  { id: 5, name: 'River Turtle', emoji: '🐢', unlocked: false, cost: 1000 },
  { id: 6, name: 'Sky Dragon', emoji: '🐉', unlocked: false, cost: 2000 },
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

// Get unlocked character emojis only
export const getUnlockedCharacterEmojis = (): string[] => {
  return getUnlockedCharacters().map(char => char.emoji);
};

// User profile interface
export interface UserProfile {
  username: string;
  avatar: string;
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
    avatar: '🦊'
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

// Update avatar only
export const updateAvatar = (avatar: string): void => {
  const profile = getUserProfile();
  profile.avatar = avatar;
  saveUserProfile(profile);
  // Also update selectedCharacter for consistency
  const char = BASE_CHARACTERS.find(c => c.emoji === avatar);
  if (char) {
    localStorage.setItem('selectedCharacter', String(char.id));
  }
};
