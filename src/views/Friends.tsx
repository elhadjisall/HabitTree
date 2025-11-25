import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Friends.css';
import { getFriends, removeFriend, getUserByUsername, searchUsers, addFriend, isFriend, getFriendRequests, acceptFriendRequest, rejectFriendRequest, hasSentRequest, initializeMockFriendRequests, type MockUser } from '../utils/mockUsers';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriendsState] = useState<string[]>([]);
  const [friendRequests, setFriendRequestsState] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MockUser[]>([]);
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    initializeMockFriendRequests();
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = (): void => {
    setFriendsState(getFriends());
  };

  const loadFriendRequests = (): void => {
    setFriendRequestsState(getFriendRequests());
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchResults(searchUsers(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = (username: string): void => {
    addFriend(username);
    loadFriendRequests();
  };

  const handleAcceptRequest = (username: string): void => {
    acceptFriendRequest(username);
    loadFriends();
    loadFriendRequests();
  };

  const handleRejectRequest = (username: string): void => {
    rejectFriendRequest(username);
    loadFriendRequests();
  };

  const handleLongPressStart = (username: string): void => {
    longPressTimer.current = window.setTimeout(() => {
      setSelectedFriend(username);
      setShowRemoveModal(true);
    }, 500);
  };

  const handleLongPressEnd = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRemoveFriend = (): void => {
    if (selectedFriend) {
      removeFriend(selectedFriend);
      loadFriends();
      setShowRemoveModal(false);
      setSelectedFriend(null);
    }
  };

  const handleViewProfile = (username: string): void => {
    navigate(`/friends/profile/${encodeURIComponent(username)}`);
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
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => {
                const isAlreadyFriend = isFriend(user.username);
                const requestSent = hasSentRequest(user.username);

                return (
                  <div key={user.username} className="friend-capsule search-result">
                    <div className="friend-avatar">{user.avatar}</div>
                    <div className="friend-info">
                      <span className="friend-username">{user.username}</span>
                    </div>
                    <button
                      className={`add-friend-button ${isAlreadyFriend || requestSent ? 'added' : ''}`}
                      onClick={() => handleAddFriend(user.username)}
                      disabled={isAlreadyFriend || requestSent}
                    >
                      {isAlreadyFriend ? '✓ Friends' : requestSent ? '📤 Sent' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <div className="no-results">No users found</div>
          )}
        </div>
      )}

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="friend-requests-section">
          <h2 className="section-title">Friend Requests</h2>
          <div className="friend-requests-list">
            {friendRequests.map((username) => {
              const user = getUserByUsername(username);
              if (!user) return null;

              return (
                <div key={username} className="friend-capsule request-capsule">
                  <div className="friend-avatar">{user.avatar}</div>
                  <div className="friend-info">
                    <span className="friend-username">{user.username}</span>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptRequest(username)}
                      aria-label={`Accept friend request from ${username}`}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectRequest(username)}
                      aria-label={`Reject friend request from ${username}`}
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
          {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No friends yet</h3>
            <p>Search for users to add as friends!</p>
          </div>
        ) : (
          friends.map((username) => {
            const user = getUserByUsername(username);
            if (!user) return null;

            return (
              <div
                key={username}
                className="friend-capsule"
                onMouseDown={() => handleLongPressStart(username)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(username)}
                onTouchEnd={handleLongPressEnd}
              >
                <div className="friend-avatar">{user.avatar}</div>
                <div className="friend-info">
                  <span className="friend-username">{user.username}</span>
                </div>
                <button
                  className="view-profile-button"
                  onClick={() => handleViewProfile(username)}
                  aria-label={`View ${username}'s profile`}
                >
                  →
                </button>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Remove friend modal */}
      {showRemoveModal && selectedFriend && (
        <div className="modal-overlay modal-overlay-high" onClick={() => setShowRemoveModal(false)}>
          <div className="modal-content remove-friend-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Friend?</h3>
            <p>Are you sure you want to remove {selectedFriend} from your friends?</p>
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
