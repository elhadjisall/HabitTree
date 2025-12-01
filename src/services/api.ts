// API Service - Handles all backend API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Store tokens
export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem('auth_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// Clear tokens
export const clearTokens = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

// Refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access, refresh);
      return data.access;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  clearTokens();
  return null;
};

// Make authenticated API request
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // Redirect to login if refresh fails
      window.location.href = '/';
    }
  }

  return response;
};

// API methods
export const api = {
  // GET request
  async get<T>(endpoint: string): Promise<T> {
    const response = await apiRequest(endpoint, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  },

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }
    return response.json();
  },

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await apiRequest(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    // DELETE might return empty response
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  },
};


