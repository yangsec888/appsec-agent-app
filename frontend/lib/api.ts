/**
 * API Client for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Get headers with auth token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        throw new Error('Unauthorized');
      }
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || errorData.message || 'Failed to get user');
    }
    
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || errorData.message || 'Failed to change password');
    }
    
    return response.json();
  },

  // Code Review
  codeReview: async (repoPath: string, query?: string) => {
    const response = await fetch(`${API_BASE_URL}/code-review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ repoPath, query }),
    });
    return response.json();
  },

  getCodeReviewReports: async () => {
    const response = await fetch(`${API_BASE_URL}/code-review/reports`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Threat Modeling
  threatModeling: async (repoPath: string, query?: string) => {
    const response = await fetch(`${API_BASE_URL}/threat-modeling`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ repoPath, query }),
    });
    return response.json();
  },

  getThreatModelingReports: async () => {
    const response = await fetch(`${API_BASE_URL}/threat-modeling/reports`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Chat
  chat: async (message: string, role?: string, history?: Array<{ role: string; content: string }>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, role, history }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        // Prioritize detailed message over generic error, or combine if both exist
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Chat API response:', data);
      return data;
    } catch (error: any) {
      console.error('Chat API error:', error);
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  },

  endChat: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.message || errorData.error || 'Failed to end chat session');
      }
      
      return response.json();
    } catch (error: any) {
      console.error('End chat error:', error);
      throw error;
    }
  },

  getChatSession: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/session`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.message || errorData.error || 'Failed to get session status');
      }
      
      return response.json();
    } catch (error: any) {
      console.error('Get chat session error:', error);
      throw error;
    }
  },
};

