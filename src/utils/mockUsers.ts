// Mock user data for friends system

export interface MockHabit {
  name: string;
  emoji: string;
  color: string;
  streak: number;
  progress: number;
  isPrivate: boolean;
}

export interface MockQuestHistory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  highestStreak: number;
  daysCompleted: number;
  daysMissed: number;
}

export interface MockUser {
  username: string;
  avatar: string; // character emoji
  publicHabits: MockHabit[];
  privateHabits: MockHabit[];
  characters: string[]; // All owned character emojis
  companionSlots: string[]; // Up to 8 characters to display
  questHistory: MockQuestHistory[]; // Completed quests
}

export const MOCK_USERS: MockUser[] = [
  {
    username: '@samurai_jake',
    avatar: '🥷',
    publicHabits: [
      { name: 'Meditation', emoji: '🧘', color: '#9b59b6', streak: 12, progress: 40, isPrivate: false },
      { name: 'Reading', emoji: '📚', color: '#3498db', streak: 7, progress: 20, isPrivate: false },
    ],
    privateHabits: [
      { name: 'No Sugar', emoji: '🚫', color: '#e74c3c', streak: 5, progress: 15, isPrivate: true },
    ],
    characters: ['🥷', '🦊', '🦌', '🐰'],
    companionSlots: ['🥷', '🦊', '🦌', '🐰', '', '', '', ''],
    questHistory: [
      { id: 'hist_1', label: 'Morning Workout', emoji: '💪', color: '#e67e22', highestStreak: 15, daysCompleted: 25, daysMissed: 5 },
      { id: 'hist_2', label: 'Journaling', emoji: '📝', color: '#1abc9c', highestStreak: 20, daysCompleted: 28, daysMissed: 2 },
    ],
  },
  {
    username: '@moonwalker',
    avatar: '🦊',
    publicHabits: [
      { name: 'Running', emoji: '🏃', color: '#e74c3c', streak: 3, progress: 10, isPrivate: false },
    ],
    privateHabits: [],
    characters: ['🦊', '🐢', '🦉'],
    companionSlots: ['🦊', '🐢', '🦉', '', '', '', '', ''],
    questHistory: [
      { id: 'hist_3', label: 'Drink Water', emoji: '💧', color: '#3498db', highestStreak: 10, daysCompleted: 20, daysMissed: 10 },
    ],
  },
  {
    username: '@kitsune',
    avatar: '🦊',
    publicHabits: [
      { name: 'Practice Japanese', emoji: '🇯🇵', color: '#e91e63', streak: 22, progress: 73, isPrivate: false },
      { name: 'Wake Up Early', emoji: '⏰', color: '#ff9800', streak: 9, progress: 30, isPrivate: false },
    ],
    privateHabits: [],
    characters: ['🦊', '🥷', '🐉'],
    companionSlots: ['🦊', '🥷', '🐉', '', '', '', '', ''],
    questHistory: [],
  },
];

// Friends storage key
const FRIENDS_KEY = 'friends';
const FRIEND_REQUESTS_KEY = 'friendRequests';

// Get friend list from localStorage
export const getFriends = (): string[] => {
  const stored = localStorage.getItem(FRIENDS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set friends list
export const setFriends = (friends: string[]): void => {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
};

// Get friend requests from localStorage
export const getFriendRequests = (): string[] => {
  const stored = localStorage.getItem(FRIEND_REQUESTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Set friend requests list
export const setFriendRequests = (requests: string[]): void => {
  localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
};

// Send a friend request (instead of adding directly)
export const sendFriendRequest = (username: string): void => {
  const requests = getFriendRequests();
  const friends = getFriends();

  // Don't send if already friends or already requested
  if (!friends.includes(username) && !requests.includes(username)) {
    requests.push(username);
    setFriendRequests(requests);
  }
};

// Accept a friend request
export const acceptFriendRequest = (username: string): void => {
  // Add to friends list
  const friends = getFriends();
  if (!friends.includes(username)) {
    friends.push(username);
    setFriends(friends);
  }

  // Remove from requests
  const requests = getFriendRequests();
  setFriendRequests(requests.filter(r => r !== username));
};

// Reject a friend request
export const rejectFriendRequest = (username: string): void => {
  const requests = getFriendRequests();
  setFriendRequests(requests.filter(r => r !== username));
};

// Check if user has sent a friend request
export const hasSentRequest = (username: string): boolean => {
  return getFriendRequests().includes(username);
};

// Add a friend (kept for backwards compatibility, but now sends request instead)
export const addFriend = (username: string): void => {
  sendFriendRequest(username);
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

// Initialize mock friend requests (for demo purposes)
export const initializeMockFriendRequests = (): void => {
  const currentRequests = getFriendRequests();
  if (currentRequests.length === 0) {
    // Add some mock incoming friend requests if none exist
    setFriendRequests(['@samurai_jake', '@kitsune']);
  }
};
