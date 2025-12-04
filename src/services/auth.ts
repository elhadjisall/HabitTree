// Authentication Service

import { api, setTokens, clearTokens } from './api';
import { initializeFirstCharacter, getSelectedCharacter } from '../utils/charactersStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2?: string;
  display_name?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  leaf_dollars: number;
  created_at: string;
  last_login?: string;
}

// Get API base URL
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '/api';
};

// Login
export const login = async (credentials: LoginCredentials): Promise<{ access: string; refresh: string; user: User }> => {
  const response = await fetch(`${getApiBaseUrl()}/auth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email, // Custom serializer accepts email
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  setTokens(data.access, data.refresh);

  // Get user info
  const user = await api.get<User>('/users/me/');
  
  return {
    access: data.access,
    refresh: data.refresh,
    user,
  };
};

// Register
export const register = async (data: RegisterData): Promise<{ access: string; refresh: string; user: User }> => {
  const response = await fetch(`${getApiBaseUrl()}/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      password: data.password,
      password2: data.password, // Backend requires password confirmation
      display_name: data.display_name || '',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
    const errorMessage = error.detail || error.password?.[0] || error.email?.[0] || error.username?.[0] || 'Registration failed';
    throw new Error(errorMessage);
  }

  // Initialize the first random character for the new user
  initializeFirstCharacter();
  
  // After registration, login automatically
  const loginResult = await login({ email: data.email, password: data.password });
  
  // Set the profile picture to the randomly assigned character
  try {
    const selectedChar = getSelectedCharacter();
    await api.put('/users/me/', { avatar_url: selectedChar.iconPath });
  } catch (avatarError) {
    console.error('Failed to set initial avatar:', avatarError);
    // Continue anyway, avatar can be set later
  }
  
  return loginResult;
};

// Logout
export const logout = (): void => {
  // Clear tokens
  clearTokens();
  
  // Clear ALL user-specific cached data
  localStorage.removeItem('habits');
  localStorage.removeItem('habitLogs');
  localStorage.removeItem('selectedCharacter');
  localStorage.removeItem('leafDollars');
  localStorage.removeItem('questHistory');
  localStorage.removeItem('completedQuests');
  localStorage.removeItem('unlockedCharacters');
  localStorage.removeItem('companionSlots');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('friends');
  localStorage.removeItem('friendRequests');
  
  // Clear habits cache by triggering event
  window.dispatchEvent(new Event('habitsChanged'));
  window.dispatchEvent(new Event('habitLogsChanged'));
  
  // Redirect to landing page
  window.location.href = '/';
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return await api.get<User>('/users/me/');
  } catch (error) {
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Update user profile
export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  return await api.put<User>('/users/me/', data);
};

