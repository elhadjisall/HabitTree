import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Friends.css';
import {
  searchUsers,
  sendFriendRequest,
  getOutgoingRequests,
  getIncomingRequests,
  getAcceptedFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  type User,
  type FriendRequest
} from '../services/friends';

// Default character image for users without avatar
const DEFAULT_AVATAR = '/assets/characters/mape-icon.jpeg';

// Helper to render avatar - handles both image paths and emojis
const renderAvatar = (avatarUrl?: string): React.ReactNode => {
  // If no avatar, show default character
  if (!avatarUrl) {
    return <img src={DEFAULT_AVATAR} alt="Avatar" className="avatar-img" />;
  }
  
  // If it's an image path (starts with / or http)
  if (avatarUrl.startsWith('/') || avatarUrl.startsWith('http')) {
    return (
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className="avatar-img"
        onError={(e) => {
          // Fallback to default if image fails to load
          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
        }}
      />
    );
  }
  
  // If it's an emoji (short string)
  if (avatarUrl.length <= 4) {
    return <span className="avatar-emoji">{avatarUrl}</span>;
  }
  
  // Default fallback
  return <img src={DEFAULT_AVATAR} alt="Avatar" className="avatar-img" />;
};

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<User[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true); // Track initial load
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const longPressTimer = useRef<number | null>(null);

  // Load friends and requests on mount, then poll for updates
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadFriends(), loadRequests()]);
      setInitialLoading(false);
    };
    loadData();

    // Poll for updates every 5 seconds for real-time friend updates
    const pollInterval = setInterval(() => {
      loadFriends();
      loadRequests();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const loadFriends = async (): Promise<void> => {
    try {
      const acceptedFriends = await getAcceptedFriends();
      setFriends(acceptedFriends);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadRequests = async (): Promise<void> => {
    try {
      const [outgoing, incoming] = await Promise.all([
        getOutgoingRequests(),
        getIncomingRequests()
      ]);
      setOutgoingRequests(outgoing);
      setIncomingRequests(incoming);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      setLoading(true);
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = async (user: User): Promise<void> => {
    try {
      await sendFriendRequest(user.id);
      // Refresh search results to update status
      if (searchQuery.trim().length >= 2) {
        await handleSearch(searchQuery);
      }
      // Reload requests to show outgoing
      await loadRequests();
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      alert(error?.message || 'Failed to send friend request. Please try again.');
    }
  };

  const handleAcceptRequest = async (request: FriendRequest): Promise<void> => {
    try {
      await acceptFriendRequest(request.id);
      await loadFriends();
      await loadRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleRejectRequest = async (request: FriendRequest): Promise<void> => {
    try {
      await rejectFriendRequest(request.id);
      await loadRequests();
      // If it was an outgoing request, refresh search results
      if (searchQuery.trim().length >= 2) {
        await handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      alert('Failed to reject friend request. Please try again.');
    }
  };

  const handleLongPressStart = (friend: User): void => {
    longPressTimer.current = window.setTimeout(() => {
      setSelectedFriend(friend);
      setShowRemoveModal(true);
    }, 500);
  };

  const handleLongPressEnd = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRemoveFriend = async (): Promise<void> => {
    if (selectedFriend) {
      try {
        // Find the friend request to reject/remove
        const friendRequest = outgoingRequests.find(
          req => req.friend.id === selectedFriend.id || req.user.id === selectedFriend.id
        ) || incomingRequests.find(
          req => req.user.id === selectedFriend.id || req.friend.id === selectedFriend.id
        );
        
        if (friendRequest) {
          await rejectFriendRequest(friendRequest.id);
        }
        
        await loadFriends();
        await loadRequests();
        setShowRemoveModal(false);
        setSelectedFriend(null);
      } catch (error) {
        console.error('Failed to remove friend:', error);
        alert('Failed to remove friend. Please try again.');
      }
    }
  };

  const handleViewProfile = (username: string): void => {
    navigate(`/friends/profile/${encodeURIComponent(username)}`);
  };

  const handleViewTree = (username: string): void => {
    navigate(`/friends/tree/${encodeURIComponent(username)}`);
  };

  // Check if user is already a friend
  const isFriend = (userId: number): boolean => {
    return friends.some(f => f.id === userId);
  };

  // Check if request was sent to this user
  const hasOutgoingRequest = (userId: number): boolean => {
    return outgoingRequests.some(req => req.friend.id === userId);
  };

  // Check if request was received from this user
  const hasIncomingRequest = (userId: number): boolean => {
    return incomingRequests.some(req => req.user.id === userId);
  };

  return (
    <div className="main-menu friends-screen">
      <header className="friends-header">
        <h1 className="friends-title">Friends</h1>
        <button
          className="search-icon-button"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Search users"
        >
          🔍
        </button>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search username or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {loading && <div className="loading-text">Searching...</div>}
          {!loading && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => {
                const isAlreadyFriend = isFriend(user.id);
                const requestSent = hasOutgoingRequest(user.id);
                const requestReceived = hasIncomingRequest(user.id);

                return (
                  <div key={user.id} className="friend-capsule search-result">
                    <div className="friend-avatar">{renderAvatar(user.avatar_url)}</div>
                    <div className="friend-info">
                      <span className="friend-username">{user.display_name || user.username}</span>
                      {user.email && <span className="friend-email">{user.email}</span>}
                    </div>
                    <button
                      className={`add-friend-button ${isAlreadyFriend || requestSent || requestReceived ? 'added' : ''}`}
                      onClick={() => {
                        if (requestReceived) {
                          // Show accept/reject options
                          const request = incomingRequests.find(req => req.user.id === user.id);
                          if (request) {
                            handleAcceptRequest(request);
                          }
                        } else if (!isAlreadyFriend && !requestSent) {
                          handleAddFriend(user);
                        }
                      }}
                      disabled={isAlreadyFriend || requestSent}
                    >
                      {isAlreadyFriend ? '✓ Friends' : requestReceived ? 'Accept' : requestSent ? '📤 Sent' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && searchQuery && searchResults.length === 0 && (
            <div className="no-results">No users found</div>
          )}
        </div>
      )}

      {/* Outgoing Friend Requests Section */}
      {outgoingRequests.length > 0 && (
        <div className="friend-requests-section">
          <h2 className="section-title">Outgoing Requests</h2>
          <div className="friend-requests-list">
            {outgoingRequests.map((request) => {
              const friend = request.friend;
              return (
                <div key={request.id} className="friend-capsule request-capsule">
                  <div className="friend-avatar">{renderAvatar(friend.avatar_url)}</div>
                  <div className="friend-info">
                    <span className="friend-username">{friend.display_name || friend.username}</span>
                  </div>
                  <button
                    className="btn-reject"
                    onClick={() => handleRejectRequest(request)}
                    aria-label={`Cancel friend request to ${friend.username}`}
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incoming Friend Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="friend-requests-section">
          <h2 className="section-title">Friend Requests</h2>
          <div className="friend-requests-list">
            {incomingRequests.map((request) => {
              const user = request.user;
              return (
                <div key={request.id} className="friend-capsule request-capsule">
                  <div className="friend-avatar">{renderAvatar(user.avatar_url)}</div>
                  <div className="friend-info">
                    <span className="friend-username">{user.display_name || user.username}</span>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptRequest(request)}
                      aria-label={`Accept friend request from ${user.username}`}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectRequest(request)}
                      aria-label={`Reject friend request from ${user.username}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="friends-section">
        <h2 className="section-title">Friends</h2>
        <div className="friends-list">
          {initialLoading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3>Loading friends...</h3>
            </div>
          ) : friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No friends yet</h3>
              <p>Search for users to add as friends!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="friend-capsule"
                onMouseDown={() => handleLongPressStart(friend)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(friend)}
                onTouchEnd={handleLongPressEnd}
              >
                <div className="friend-avatar">{renderAvatar(friend.avatar_url)}</div>
                <div className="friend-info">
                  <span className="friend-username">{friend.display_name || friend.username}</span>
                </div>
                <div className="friend-actions">
                  <button
                    className="view-profile-button"
                    onClick={() => handleViewProfile(friend.username)}
                    aria-label={`View ${friend.username}'s profile`}
                  >
                    Profile
                  </button>
                  <button
                    className="view-tree-button"
                    onClick={() => handleViewTree(friend.username)}
                    aria-label={`View ${friend.username}'s tree`}
                  >
                    🌳 Tree
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Remove friend modal */}
      {showRemoveModal && selectedFriend && (
        <div className="modal-overlay modal-overlay-high" onClick={() => setShowRemoveModal(false)}>
          <div className="modal-content remove-friend-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Friend?</h3>
            <p>Are you sure you want to remove {selectedFriend.display_name || selectedFriend.username} from your friends?</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleRemoveFriend}>
                ❌ Remove
              </button>
              <button className="btn btn-secondary" onClick={() => setShowRemoveModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
