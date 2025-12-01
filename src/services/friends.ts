// Friends Service - API calls for friends system

import { api } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_friend?: boolean;
  friend_status?: 'pending' | 'accepted' | 'received_pending' | null;
}

export interface FriendRequest {
  id: number;
  user: User;
  friend: User;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

// Search for users
export const searchUsers = async (query: string): Promise<User[]> => {
  if (!query || query.length < 2) {
    return [];
  }
  
  try {
    const response = await api.get<User[]>(`/friends/search/?q=${encodeURIComponent(query)}`);
    return response || [];
  } catch (error) {
    console.error('Failed to search users:', error);
    return [];
  }
};

// Send friend request
export const sendFriendRequest = async (friendId: number): Promise<FriendRequest> => {
  const response = await api.post<FriendRequest>('/friends/send_request/', {
    friend_id: friendId
  });
  return response;
};

// Get outgoing friend requests (sent by current user)
export const getOutgoingRequests = async (): Promise<FriendRequest[]> => {
  const response = await api.get<FriendRequest[]>('/friends/outgoing/');
  return response || [];
};

// Get incoming friend requests (received by current user)
export const getIncomingRequests = async (): Promise<FriendRequest[]> => {
  const response = await api.get<FriendRequest[]>('/friends/incoming/');
  return response || [];
};

// Get accepted friends
export const getAcceptedFriends = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/friends/accepted/');
  return response || [];
};

// Accept friend request
export const acceptFriendRequest = async (requestId: number): Promise<FriendRequest> => {
  const response = await api.post<FriendRequest>(`/friends/${requestId}/accept/`);
  return response;
};

// Reject/cancel friend request
export const rejectFriendRequest = async (requestId: number): Promise<void> => {
  await api.post(`/friends/${requestId}/reject/`);
};

// Get friend's public profile
export interface FriendProfile {
  user: User;
  public_habits: Array<{
    id: number;
    name: string;
    emoji: string;
    current_streak: number;
    progress: number;
  }>;
  characters: string[];
}

export const getFriendProfile = async (userId: number): Promise<FriendProfile> => {
  const response = await api.get<FriendProfile>(`/users/${userId}/profile/`);
  return response;
};

// Get friend profile by username (searches in accepted friends first)
export const getFriendProfileByUsername = async (username: string): Promise<FriendProfile | null> => {
  try {
    // First, get all accepted friends
    const friends = await getAcceptedFriends();
    const friend = friends.find(f => f.username === username || f.display_name === username);
    
    if (friend) {
      return await getFriendProfile(friend.id);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get friend profile:', error);
    return null;
  }
};

