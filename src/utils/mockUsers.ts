// Mock user data for friends system

export interface MockHabit {
  name: string;
  streak: number;
  progress: number;
  isPrivate: boolean;
}

export interface MockUser {
  username: string;
  avatar: string; // character emoji
  publicHabits: MockHabit[];
  privateHabits: MockHabit[];
  characters: string[]; // All owned character emojis
}

export const MOCK_USERS: MockUser[] = [
  {
    username: '@samurai_jake',
    avatar: '🥷',
    publicHabits: [
      { name: 'Meditation', streak: 12, progress: 40, isPrivate: false },
      { name: 'Reading', streak: 7, progress: 20, isPrivate: false },
    ],
    privateHabits: [
      { name: 'No Sugar', streak: 5, progress: 15, isPrivate: true },
    ],
    characters: ['🥷', '🦊'],
  },
  {
    username: '@moonwalker',
    avatar: '🦊',
    publicHabits: [
      { name: 'Running', streak: 3, progress: 10, isPrivate: false },
    ],
    privateHabits: [],
    characters: ['🦊', '🐢'],
  },
  {
    username: '@kitsune',
    avatar: '🦊',
    publicHabits: [
      { name: 'Practice Japanese', streak: 22, progress: 73, isPrivate: false },
      { name: 'Wake Up Early', streak: 9, progress: 30, isPrivate: false },
    ],
    privateHabits: [],
    characters: ['🦊', '🥷'],
  },
];

// Friends storage key
const FRIENDS_KEY = 'friends';

// Get friend list from localStorage
export const getFriends = (): string[] => {
  const stored = localStorage.getItem(FRIENDS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set friends list
export const setFriends = (friends: string[]): void => {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
};

// Add a friend
export const addFriend = (username: string): void => {
  const friends = getFriends();
  if (!friends.includes(username)) {
    friends.push(username);
    setFriends(friends);
  }
};

// Remove a friend
export const removeFriend = (username: string): void => {
  const friends = getFriends();
  setFriends(friends.filter(f => f !== username));
};

// Check if user is a friend
export const isFriend = (username: string): boolean => {
  return getFriends().includes(username);
};

// Search for users
export const searchUsers = (query: string): MockUser[] => {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  return MOCK_USERS.filter(user =>
    user.username.toLowerCase().includes(normalizedQuery)
  );
};

// Get user by username
export const getUserByUsername = (username: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.username === username);
};
